import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// @desc    Get all reviews with filtering
// @route   GET /api/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    book,
    user,
    rating,
    verified
  } = req.query;

  const filter = {};

  if (book) {
    filter.book = book;
  }

  if (user) {
    filter.user = user;
  }

  if (rating) {
    filter.rating = Number(rating);
  }

  if (verified === 'true') {
    filter.isVerifiedPurchase = true;
  }

  const skip = (page - 1) * limit;

  const reviews = await Review.find(filter)
    .populate('user', 'name avatar')
    .populate('book', 'title coverImage')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Review.countDocuments(filter);

  res.json({
    success: true,
    count: reviews.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    reviews
  });
});

// @desc    Get reviews for a specific book
// @route   GET /api/reviews/book/:bookId
// @access  Public
export const getBookReviews = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { page = 1, limit = 5, sort = '-helpfulVotes' } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ book: bookId })
    .populate('user', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Review.countDocuments({ book: bookId });

  // Get rating distribution
  const distribution = await Review.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const ratingDistribution = {};
  distribution.forEach(item => {
    ratingDistribution[item._id] = item.count;
  });

  // Fill missing ratings with 0
  for (let i = 1; i <= 5; i++) {
    if (!ratingDistribution[i]) {
      ratingDistribution[i] = 0;
    }
  }

  res.json({
    success: true,
    count: reviews.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    reviews,
    ratingDistribution
  });
});

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('book', 'title coverImage author')
    .populate('replies.user', 'name avatar')
    .lean();

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  res.json({
    success: true,
    review
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Make sure user owns the review
  if (review.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to update this review');
  }

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { ...req.body, isEdited: true },
    { new: true, runValidators: true }
  ).populate('user', 'name avatar');

  // Update book's average rating
  const book = await Book.findById(review.book);
  if (book) {
    await book.updateAverageRating();
  }

  res.json({
    success: true,
    review
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Make sure user owns the review or is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to delete this review');
  }

  const bookId = review.book;

  await review.deleteOne();

  // Update book's average rating
  const book = await Book.findById(bookId);
  if (book) {
    await book.updateAverageRating();
  }

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Vote a review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const voteHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user already voted
  // In a real app, you'd track who voted to prevent multiple votes
  review.helpfulVotes += 1;
  await review.save();

  res.json({
    success: true,
    helpfulVotes: review.helpfulVotes,
    unhelpfulVotes: review.unhelpfulVotes
  });
});

// @desc    Vote a review as unhelpful
// @route   POST /api/reviews/:id/unhelpful
// @access  Private
export const voteUnhelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.unhelpfulVotes += 1;
  await review.save();

  res.json({
    success: true,
    helpfulVotes: review.helpfulVotes,
    unhelpfulVotes: review.unhelpfulVotes
  });
});

// @desc    Add reply to review
// @route   POST /api/reviews/:id/replies
// @access  Private
export const addReply = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const reviewId = req.params.id;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.replies.push({
    user: req.user.id,
    comment
  });

  await review.save();

  // Populate the new reply's user info
  await review.populate('replies.user', 'name avatar');

  const newReply = review.replies[review.replies.length - 1];

  res.status(201).json({
    success: true,
    reply: newReply
  });
});

// @desc    Delete a reply from review
// @route   DELETE /api/reviews/:id/replies/:replyId
// @access  Private
export const deleteReply = asyncHandler(async (req, res) => {
  const { id, replyId } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Find the reply
  const replyIndex = review.replies.findIndex(
    reply => reply._id.toString() === replyId
  );

  if (replyIndex === -1) {
    res.status(404);
    throw new Error('Reply not found');
  }

  // Check if user owns the reply or is admin
  const reply = review.replies[replyIndex];
  if (reply.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to delete this reply');
  }

  review.replies.splice(replyIndex, 1);
  await review.save();

  res.json({
    success: true,
    message: 'Reply deleted successfully'
  });
});