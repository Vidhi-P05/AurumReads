import asyncHandler from 'express-async-handler';
import Book from '../models/Book.js';
import Author from '../models/Author.js';
import Review from '../models/Review.js';
import Purchase from '../models/Purchase.js';
import Wishlist from '../models/Wishlist.js';

// @desc    Get all books with filtering and pagination
// @route   GET /api/books
// @access  Public
export const getBooks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    genre,
    minPrice,
    maxPrice,
    rating,
    format,
    language,
    featured,
    bestseller,
    newRelease
  } = req.query;

  // Build filter object
  const filter = {};

  if (genre) {
    filter.genres = genre;
  }

  if (rating) {
    filter['ratings.average'] = { $gte: Number(rating) };
  }

  if (format) {
    filter['formats.type'] = format;
    filter['formats.isAvailable'] = true;
  }

  if (language) {
    filter.language = language;
  }

  if (featured === 'true') {
    filter.featured = true;
  }

  if (bestseller === 'true') {
    filter.bestseller = true;
  }

  if (newRelease === 'true') {
    filter.newRelease = true;
  }

  // Price filtering
  if (minPrice || maxPrice) {
    filter['formats.price'] = {};
    if (minPrice) {
      filter['formats.price'].$gte = Number(minPrice);
    }
    if (maxPrice) {
      filter['formats.price'].$lte = Number(maxPrice);
    }
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  const books = await Book.find(filter)
    .populate('author', 'name photo')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Book.countDocuments(filter);

  // Get min price for each book
  const booksWithMinPrice = books.map(book => {
    const prices = book.formats.map(f => f.discountPrice || f.price);
    const minPrice = Math.min(...prices);
    return {
      ...book,
      minPrice
    };
  });

  res.json({
    success: true,
    count: books.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    books: booksWithMinPrice,
  });
});

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
export const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id)
    .populate('author', 'name photo bio followersCount')
    .populate('coAuthors', 'name photo')
    .lean();

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Get similar books
  const similarBooks = await Book.find({
    genres: { $in: book.genres },
    _id: { $ne: book._id }
  })
    .limit(4)
    .populate('author', 'name photo')
    .select('title coverImage author ratings formats genres')
    .lean();

  // Get reviews
  const reviews = await Review.find({ book: book._id })
    .populate('user', 'name avatar')
    .sort({ helpfulVotes: -1, createdAt: -1 })
    .limit(5)
    .lean();

  // Calculate min price
  const prices = book.formats.map(f => f.discountPrice || f.price);
  const minPrice = Math.min(...prices);

  res.json({
    success: true,
    book: {
      ...book,
      minPrice,
      similarBooks,
      reviews,
      reviewCount: book.ratings.count
    }
  });
});

// @desc    Create a book
// @route   POST /api/books
// @access  Private/Admin
export const createBook = asyncHandler(async (req, res) => {
  const book = await Book.create(req.body);

  // Update author's book count
  await Author.findByIdAndUpdate(book.author, {
    $push: { books: book._id }
  });

  res.status(201).json({
    success: true,
    book
  });
});

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
export const updateBook = asyncHandler(async (req, res) => {
  let book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    book
  });
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
export const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Remove book from author's books array
  await Author.findByIdAndUpdate(book.author, {
    $pull: { books: book._id }
  });

  // Delete associated reviews
  await Review.deleteMany({ book: book._id });

  // Remove from wishlists
  await Wishlist.updateMany(
    { 'items.book': book._id },
    { $pull: { items: { book: book._id } } }
  );

  await book.deleteOne();

  res.json({
    success: true,
    message: 'Book deleted successfully'
  });
});

// @desc    Search books
// @route   GET /api/books/search
// @access  Public
export const searchBooks = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Please provide a search query');
  }

  const query = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { 'author.name': { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (page - 1) * limit;

  const books = await Book.find(query)
    .populate('author', 'name photo')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Book.countDocuments(query);

  res.json({
    success: true,
    count: books.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    books
  });
});

// @desc    Get trending books
// @route   GET /api/books/trending
// @access  Public
export const getTrendingBooks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get books with most purchases in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendingPurchases = await Purchase.aggregate([
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

  const bookIds = trendingPurchases.map(p => p._id);

  let books = await Book.find({ _id: { $in: bookIds } })
    .populate('author', 'name photo')
    .lean();

  // Maintain order from aggregation
  books = bookIds.map(id => books.find(b => b._id.toString() === id.toString()));

  res.json({
    success: true,
    books
  });
});

// @desc    Get new releases
// @route   GET /api/books/new-releases
// @access  Public
export const getNewReleases = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const books = await Book.find({
    publishedDate: { $gte: thirtyDaysAgo },
    newRelease: true
  })
    .populate('author', 'name photo')
    .sort({ publishedDate: -1 })
    .limit(Number(limit))
    .lean();

  res.json({
    success: true,
    books
  });
});

// @desc    Get book preview (first chapter/sample)
// @route   GET /api/books/:id/preview
// @access  Public
export const getBookPreview = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id)
    .select('title author samplePages')
    .populate('author', 'name');

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Get first 3 sample pages or generate placeholder
  const preview = book.samplePages?.slice(0, 3) || [
    {
      pageNumber: 1,
      content: 'Sample preview not available for this book.',
      imageUrl: null
    }
  ];

  res.json({
    success: true,
    preview: {
      bookTitle: book.title,
      authorName: book.author.name,
      pages: preview
    }
  });
});

// @desc    Add review to book
// @route   POST /api/books/:id/reviews
// @access  Private
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;
  const bookId = req.params.id;

  // Check if user has already reviewed this book
  const existingReview = await Review.findOne({
    book: bookId,
    user: req.user.id
  });

  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this book');
  }

  // Check if user has purchased the book (for verified purchase badge)
  const hasPurchased = await Purchase.findOne({
    user: req.user.id,
    'items.book': bookId,
    paymentStatus: 'completed'
  });

  const review = await Review.create({
    book: bookId,
    user: req.user.id,
    rating,
    comment,
    title,
    isVerifiedPurchase: !!hasPurchased
  });

  // Populate user info for response
  await review.populate('user', 'name avatar');

  res.status(201).json({
    success: true,
    review
  });
});

// @desc    Update reading progress
// @route   POST /api/books/:id/progress
// @access  Private
export const updateReadingProgress = asyncHandler(async (req, res) => {
  const { progress } = req.body;
  const bookId = req.params.id;

  // In a real app, you'd have a ReadingProgress model
  // For now, we'll update user's reading stats
  const user = req.user;

  if (progress === 100) {
    // Mark book as read
    user.readingStats.booksRead += 1;
    
    // Update streak
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (user.lastReadDate && 
        user.lastReadDate.toDateString() === yesterday.toDateString()) {
      user.readingStats.currentStreak += 1;
    } else {
      user.readingStats.currentStreak = 1;
    }
    
    user.readingStats.longestStreak = Math.max(
      user.readingStats.longestStreak,
      user.readingStats.currentStreak
    );
    
    user.lastReadDate = today;
    await user.save();
  }

  res.json({
    success: true,
    message: 'Reading progress updated',
    readingStats: user.readingStats
  });
});

// @desc    Get similar books
// @route   GET /api/books/:id/similar
// @access  Public
export const getSimilarBooks = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  const similarBooks = await Book.find({
    $or: [
      { genres: { $in: book.genres } },
      { author: book.author }
    ],
    _id: { $ne: book._id }
  })
    .populate('author', 'name photo')
    .limit(8)
    .lean();

  res.json({
    success: true,
    books: similarBooks
  });
});

// @desc    Get books by author
// @route   GET /api/books/author/:authorId
// @access  Public
export const getBooksByAuthor = asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 12, sort = '-publishedDate' } = req.query;

  const skip = (page - 1) * limit;

  const books = await Book.find({ author: authorId })
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Book.countDocuments({ author: authorId });

  res.json({
    success: true,
    count: books.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    books
  });
});