import asyncHandler from 'express-async-handler';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import Review from '../models/Review.js';
import RecommendationHistory from '../models/RecommendationHistory.js';
import AIService from '../services/aiService.js';

// @desc    Get personalized recommendations based on user history
// @route   GET /api/recommendations/personalized
// @access  Private
export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user.id;

  // Check for cached recommendations
  const cachedRecommendations = await RecommendationHistory.findOne({
    user: userId,
    recommendationType: 'personalized',
    expiresAt: { $gt: new Date() }
  }).sort('-createdAt');

  if (cachedRecommendations) {
    return res.json({
      success: true,
      recommendations: cachedRecommendations.books,
      source: 'cached',
      generatedAt: cachedRecommendations.createdAt
    });
  }

  // Get user data for recommendations
  const user = await User.findById(userId)
    .select('favoriteGenres readingPreferences following')
    .lean();

  // Get user's purchase history
  const purchases = await Purchase.find({
    user: userId,
    paymentStatus: 'completed'
  })
    .populate('items.book')
    .lean();

  const purchasedBooks = purchases.flatMap(p => 
    p.items.map(i => i.book?._id).filter(Boolean)
  );

  // Get user's reviews
  const reviews = await Review.find({ user: userId })
    .select('book rating')
    .lean();

  const highlyRatedBooks = reviews
    .filter(r => r.rating >= 4)
    .map(r => r.book);

  // Build recommendation criteria
  const criteria = {
    favoriteGenres: user.favoriteGenres || [],
    purchasedBooks,
    highlyRatedBooks,
    followingAuthors: user.following?.map(f => f.author) || []
  };

  // Query for recommendations
  let query = {};

  if (criteria.favoriteGenres.length > 0) {
    query.genres = { $in: criteria.favoriteGenres };
  }

  // Exclude already purchased/rated books
  const excludedBooks = [...criteria.purchasedBooks, ...criteria.highlyRatedBooks];
  if (excludedBooks.length > 0) {
    query._id = { $nin: excludedBooks };
  }

  // Get recommendations
  const recommendations = await Book.find(query)
    .populate('author', 'name photo')
    .sort({ 'ratings.average': -1, 'ratings.count': -1 })
    .limit(Number(limit))
    .lean();

  // Calculate scores for each recommendation
  const recommendationsWithScores = recommendations.map(book => {
    let score = 0;

    // Genre match
    const genreMatches = book.genres.filter(g => 
      criteria.favoriteGenres.includes(g)
    ).length;
    score += genreMatches * 0.3;

    // Author follow
    if (criteria.followingAuthors.includes(book.author._id.toString())) {
      score += 0.4;
    }

    // Rating weight
    score += book.ratings.average * 0.1;

    // Popularity weight
    score += Math.min(book.ratings.count / 1000, 0.2);

    return {
      book: {
        _id: book._id,
        title: book.title,
        coverImage: book.coverImage,
        author: book.author,
        genres: book.genres,
        ratings: book.ratings,
        formats: book.formats
      },
      score: Math.min(score, 1),
      reason: generateRecommendationReason(book, criteria)
    };
  });

  // Sort by score
  recommendationsWithScores.sort((a, b) => b.score - a.score);

  // Cache the recommendations
  await RecommendationHistory.create({
    user: userId,
    recommendationType: 'personalized',
    books: recommendationsWithScores,
    sourceData: {
      favoriteGenres: criteria.favoriteGenres,
      purchasedBooks: criteria.purchasedBooks,
      highlyRatedBooks: criteria.highlyRatedBooks
    }
  });

  res.json({
    success: true,
    recommendations: recommendationsWithScores,
    source: 'generated',
    generatedAt: new Date()
  });
});

// @desc    Get collaborative filtering recommendations
// @route   GET /api/recommendations/collaborative
// @access  Private
export const getCollaborativeRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user.id;

  // Get users with similar tastes
  const userReviews = await Review.find({ user: userId })
    .select('book rating')
    .lean();

  if (userReviews.length < 3) {
    // Not enough data for collaborative filtering
    return getPersonalizedRecommendations(req, res);
  }

  // Find users who rated the same books similarly
  const similarUsers = await Review.aggregate([
    {
      $match: {
        user: { $ne: userId },
        book: { $in: userReviews.map(r => r.book) }
      }
    },
    {
      $group: {
        _id: '$user',
        commonRatings: {
          $push: {
            book: '$book',
            rating: '$rating'
          }
        }
      }
    },
    {
      $project: {
        similarity: {
          $let: {
            vars: {
              userRatings: userReviews
            },
            in: {
              $divide: [
                {
                  $sum: {
                    $map: {
                      input: '$commonRatings',
                      as: 'cr',
                      in: {
                        $multiply: [
                          {
                            $subtract: [
                              '$$cr.rating',
                              {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: '$$userRatings',
                                      as: 'ur',
                                      cond: { $eq: ['$$ur.book', '$$cr.book'] }
                                    }
                                  },
                                  0
                                ]
                              }.rating
                            ]
                          },
                          2
                        ]
                      }
                    }
                  }
                },
                { $size: '$commonRatings' }
              ]
            }
          }
        },
        commonRatings: 1
      }
    },
    { $match: { similarity: { $lt: 2 } } }, // Similarity threshold
    { $sort: { similarity: 1 } },
    { $limit: 10 }
  ]);

  if (similarUsers.length === 0) {
    return getPersonalizedRecommendations(req, res);
  }

  // Get books rated highly by similar users that current user hasn't read
  const similarUserIds = similarUsers.map(su => su._id);
  const userBookIds = userReviews.map(r => r.book);

  const recommendedBooks = await Review.aggregate([
    {
      $match: {
        user: { $in: similarUserIds },
        book: { $nin: userBookIds },
        rating: { $gte: 4 }
      }
    },
    {
      $group: {
        _id: '$book',
        avgRating: { $avg: '$rating' },
        recommendationCount: { $sum: 1 }
      }
    },
    { $sort: { avgRating: -1, recommendationCount: -1 } },
    { $limit: Number(limit) }
  ]);

  // Get book details
  const bookIds = recommendedBooks.map(r => r._id);
  const books = await Book.find({ _id: { $in: bookIds } })
    .populate('author', 'name photo')
    .lean();

  // Map scores
  const recommendations = books.map(book => {
    const recData = recommendedBooks.find(r => r._id.toString() === book._id.toString());
    return {
      book: {
        _id: book._id,
        title: book.title,
        coverImage: book.coverImage,
        author: book.author,
        genres: book.genres,
        ratings: book.ratings
      },
      score: recData.avgRating / 5,
      reason: `Recommended by ${recData.recommendationCount} users with similar tastes`
    };
  });

  res.json({
    success: true,
    recommendations,
    source: 'collaborative'
  });
});

// @desc    Get content-based recommendations
// @route   GET /api/recommendations/content-based
// @access  Private
export const getContentBasedRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user.id;

  // Get user's highly rated books
  const reviews = await Review.find({ user: userId, rating: { $gte: 4 } })
    .populate('book')
    .lean();

  if (reviews.length === 0) {
    return getPersonalizedRecommendations(req, res);
  }

  // Use the most recent highly rated book
  const sourceBook = reviews[0].book;

  // Find books with similar characteristics
  const similarBooks = await Book.find({
    $or: [
      { genres: { $in: sourceBook.genres } },
      { author: sourceBook.author }
    ],
    _id: { $ne: sourceBook._id }
  })
    .populate('author', 'name photo')
    .limit(Number(limit))
    .lean();

  const recommendations = similarBooks.map(book => {
    const commonGenres = book.genres.filter(g => 
      sourceBook.genres.includes(g)
    ).length;

    const score = 0.3 + (commonGenres / book.genres.length) * 0.4 + 
                  (book.author._id.toString() === sourceBook.author._id.toString() ? 0.3 : 0);

    return {
      book: {
        _id: book._id,
        title: book.title,
        coverImage: book.coverImage,
        author: book.author,
        genres: book.genres,
        ratings: book.ratings
      },
      score: Math.min(score, 1),
      reason: generateSimilarityReason(book, sourceBook)
    };
  });

  recommendations.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    recommendations,
    source: 'content-based',
    basedOn: sourceBook.title
  });
});

// @desc    Get trending recommendations
// @route   GET /api/recommendations/trending
// @access  Public
export const getTrendingRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get trending books based on recent purchases
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendingBooks = await Purchase.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        paymentStatus: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.book',
        purchaseCount: { $sum: '$items.quantity' }
      }
    },
    { $sort: { purchaseCount: -1 } },
    { $limit: Number(limit) }
  ]);

  const bookIds = trendingBooks.map(b => b._id);
  const books = await Book.find({ _id: { $in: bookIds } })
    .populate('author', 'name photo')
    .lean();

  // Maintain order and add scores
  const recommendations = bookIds.map(bookId => {
    const book = books.find(b => b._id.toString() === bookId.toString());
    const trendData = trendingBooks.find(t => t._id.toString() === bookId.toString());
    
    if (!book) return null;

    return {
      book: {
        _id: book._id,
        title: book.title,
        coverImage: book.coverImage,
        author: book.author,
        genres: book.genres,
        ratings: book.ratings
      },
      score: Math.min(trendData.purchaseCount / 100, 1),
      reason: `Trending with ${trendData.purchaseCount} recent purchases`
    };
  }).filter(Boolean);

  res.json({
    success: true,
    recommendations,
    source: 'trending'
  });
});

// @desc    Get "Because you liked X" recommendations
// @route   GET /api/recommendations/because-you-liked/:bookId
// @access  Private
export const getBecauseYouLiked = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { limit = 8 } = req.query;

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Find similar books
  const similarBooks = await Book.find({
    $or: [
      { genres: { $in: book.genres } },
      { author: book.author }
    ],
    _id: { $ne: book._id }
  })
    .populate('author', 'name photo')
    .limit(Number(limit))
    .lean();

  const recommendations = similarBooks.map(similarBook => {
    const commonGenres = similarBook.genres.filter(g => 
      book.genres.includes(g)
    ).length;

    let reason = '';
    if (similarBook.author._id.toString() === book.author._id.toString()) {
      reason = `Same author as "${book.title}"`;
    } else if (commonGenres > 0) {
      reason = `Similar genre${commonGenres > 1 ? 's' : ''}: ${book.genres.slice(0, 2).join(', ')}`;
    }

    const score = 0.2 + (commonGenres / book.genres.length) * 0.5 +
                  (similarBook.author._id.toString() === book.author._id.toString() ? 0.3 : 0);

    return {
      book: {
        _id: similarBook._id,
        title: similarBook.title,
        coverImage: similarBook.coverImage,
        author: similarBook.author,
        genres: similarBook.genres,
        ratings: similarBook.ratings
      },
      score: Math.min(score, 1),
      reason
    };
  });

  recommendations.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    recommendations,
    basedOn: {
      title: book.title,
      author: book.author.name,
      genres: book.genres
    }
  });
});

// @desc    Get AI quiz recommendations
// @route   GET /api/recommendations/quiz
// @access  Private
export const getQuizRecommendations = asyncHandler(async (req, res) => {
  const { answers } = req.query;
  const userId = req.user.id;

  if (!answers) {
    res.status(400);
    throw new Error('Quiz answers required');
  }

  try {
    const parsedAnswers = JSON.parse(answers);
    
    // Use AI service to generate recommendations based on quiz answers
    const recommendations = await AIService.generateRecommendations(
      { favoriteGenres: parsedAnswers.genres || [] },
      {},
      'openai'
    );

    // Cache the recommendations
    await RecommendationHistory.create({
      user: userId,
      recommendationType: 'ai_quiz',
      books: recommendations.recommendations,
      sourceData: {
        quizAnswers: parsedAnswers
      }
    });

    res.json({
      success: true,
      recommendations: recommendations.recommendations,
      source: 'ai_quiz'
    });
  } catch (error) {
    console.error('Quiz recommendation error:', error);
    // Fallback to personalized recommendations
    return getPersonalizedRecommendations(req, res);
  }
});

// @desc    Generate AI summary for a book
// @route   POST /api/recommendations/generate-summary/:bookId
// @access  Private
export const generateAISummary = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const book = await Book.findById(bookId)
    .populate('author', 'name');

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Check if summary already exists and is recent
  if (book.aiSummary && book.aiSummary.generatedAt) {
    const hoursSinceGeneration = (Date.now() - book.aiSummary.generatedAt) / (1000 * 60 * 60);
    if (hoursSinceGeneration < 24) {
      return res.json({
        success: true,
        summary: book.aiSummary,
        cached: true
      });
    }
  }

  // Generate new summary using AI
  const aiSummary = await AIService.generateBookSummary(book);

  // Update book with AI summary
  book.aiSummary = {
    summary: aiSummary.summary,
    keyTakeaways: aiSummary.keyTakeaways,
    targetAudience: aiSummary.targetAudience,
    generatedAt: new Date()
  };

  await book.save();

  res.json({
    success: true,
    summary: book.aiSummary,
    cached: false
  });
});

// @desc    Track recommendation interaction
// @route   POST /api/recommendations/:recommendationId/interact
// @access  Private
export const trackRecommendationInteraction = asyncHandler(async (req, res) => {
  const { recommendationId } = req.params;
  const { bookId, interaction, rating } = req.body;

  const recommendation = await RecommendationHistory.findById(recommendationId);

  if (!recommendation) {
    res.status(404);
    throw new Error('Recommendation not found');
  }

  // Verify user owns this recommendation
  if (recommendation.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  await recommendation.updateInteraction(bookId, interaction, rating);

  res.json({
    success: true,
    message: 'Interaction tracked successfully'
  });
});

// Helper functions
const generateRecommendationReason = (book, criteria) => {
  const reasons = [];

  if (criteria.favoriteGenres.some(g => book.genres.includes(g))) {
    const matchingGenres = book.genres.filter(g => 
      criteria.favoriteGenres.includes(g)
    );
    reasons.push(`Matches your favorite ${matchingGenres.length > 1 ? 'genres' : 'genre'}: ${matchingGenres.join(', ')}`);
  }

  if (criteria.followingAuthors.includes(book.author._id.toString())) {
    reasons.push(`From an author you follow`);
  }

  if (book.ratings.average >= 4.5 && book.ratings.count >= 100) {
    reasons.push('Highly rated by readers');
  }

  if (book.newRelease) {
    reasons.push('New release');
  }

  if (book.bestseller) {
    reasons.push('Bestseller');
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you';
};

const generateSimilarityReason = (book, sourceBook) => {
  if (book.author._id.toString() === sourceBook.author._id.toString()) {
    return `Same author as "${sourceBook.title}"`;
  }

  const commonGenres = book.genres.filter(g => 
    sourceBook.genres.includes(g)
  );

  if (commonGenres.length > 0) {
    return `Similar genre${commonGenres.length > 1 ? 's' : ''}: ${commonGenres.slice(0, 2).join(', ')}`;
  }

  return 'Similar to books you enjoyed';
};