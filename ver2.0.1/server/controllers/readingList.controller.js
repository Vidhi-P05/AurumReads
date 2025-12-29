import asyncHandler from 'express-async-handler';
import ReadingList from '../models/ReadingList.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// @desc    Get user's reading lists
// @route   GET /api/reading-lists
// @access  Private
export const getReadingLists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includePrivate = false } = req.query;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (!includePrivate) {
    filter.isPublic = true;
  }

  const readingLists = await ReadingList.find(filter)
    .populate('books.book')
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await ReadingList.countDocuments(filter);

  res.json({
    success: true,
    count: readingLists.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    readingLists
  });
});

// @desc    Get public reading lists
// @route   GET /api/reading-lists/public
// @access  Public
export const getPublicReadingLists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, sort = '-followersCount' } = req.query;
  const skip = (page - 1) * limit;

  const readingLists = await ReadingList.find({ isPublic: true })
    .populate('books.book')
    .populate('user', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await ReadingList.countDocuments({ isPublic: true });

  res.json({
    success: true,
    count: readingLists.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    readingLists
  });
});

// @desc    Get trending reading lists
// @route   GET /api/reading-lists/trending
// @access  Public
export const getTrendingReadingLists = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const readingLists = await ReadingList.find({ isPublic: true })
    .sort('-followersCount -likesCount')
    .limit(Number(limit))
    .populate('user', 'name avatar')
    .populate({
      path: 'books.book',
      select: 'title coverImage author',
      populate: {
        path: 'author',
        select: 'name'
      }
    })
    .lean();

  res.json({
    success: true,
    readingLists
  });
});

// @desc    Get reading list by ID
// @route   GET /api/reading-lists/:id
// @access  Public
export const getReadingListById = asyncHandler(async (req, res) => {
  const readingList = await ReadingList.findById(req.params.id)
    .populate({
      path: 'books.book',
      populate: {
        path: 'author',
        select: 'name photo'
      }
    })
    .populate('user', 'name avatar bio')
    .populate('followers.user', 'name avatar')
    .populate('likes.user', 'name avatar')
    .lean();

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Check if private and user doesn't have access
  if (!readingList.isPublic && (!req.user || readingList.user._id.toString() !== req.user.id)) {
    res.status(403);
    throw new Error('This reading list is private');
  }

  // Check if current user is following/liking
  let isFollowing = false;
  let isLiked = false;

  if (req.user) {
    const userId = req.user.id;
    isFollowing = readingList.followers.some(f => 
      f.user && f.user._id.toString() === userId
    );
    isLiked = readingList.likes.some(l => 
      l.user && l.user._id.toString() === userId
    );
  }

  res.json({
    success: true,
    readingList: {
      ...readingList,
      isFollowing,
      isLiked
    }
  });
});

// @desc    Get reading lists by user
// @route   GET /api/reading-lists/user/:userId
// @access  Public
export const getUserReadingLists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { user: userId, isPublic: true };

  const readingLists = await ReadingList.find(filter)
    .populate('books.book')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await ReadingList.countDocuments(filter);

  res.json({
    success: true,
    count: readingLists.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    readingLists
  });
});

// @desc    Create a reading list
// @route   POST /api/reading-lists
// @access  Private
export const createReadingList = asyncHandler(async (req, res) => {
  const { title, description, isPublic = true, tags, coverImage } = req.body;

  const readingList = await ReadingList.create({
    title,
    description,
    isPublic,
    tags,
    coverImage,
    user: req.user.id
  });

  res.status(201).json({
    success: true,
    readingList
  });
});

// @desc    Update a reading list
// @route   PUT /api/reading-lists/:id
// @access  Private
export const updateReadingList = asyncHandler(async (req, res) => {
  let readingList = await ReadingList.findById(req.params.id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Make sure user owns the reading list
  if (readingList.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to update this reading list');
  }

  readingList = await ReadingList.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('books.book')
    .populate('user', 'name avatar');

  res.json({
    success: true,
    readingList
  });
});

// @desc    Delete a reading list
// @route   DELETE /api/reading-lists/:id
// @access  Private
export const deleteReadingList = asyncHandler(async (req, res) => {
  const readingList = await ReadingList.findById(req.params.id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Make sure user owns the reading list
  if (readingList.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this reading list');
  }

  await readingList.deleteOne();

  res.json({
    success: true,
    message: 'Reading list deleted successfully'
  });
});

// @desc    Add book to reading list
// @route   POST /api/reading-lists/:id/books
// @access  Private
export const addBookToList = asyncHandler(async (req, res) => {
  const { bookId, notes } = req.body;
  const { id } = req.params;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Make sure user owns the reading list
  if (readingList.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to modify this reading list');
  }

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Check if book already in list
  const bookExists = readingList.books.some(b => 
    b.book.toString() === bookId
  );

  if (bookExists) {
    res.status(400);
    throw new Error('Book already in reading list');
  }

  // Add book to list
  readingList.books.push({
    book: bookId,
    notes,
    order: readingList.books.length
  });

  await readingList.save();

  // Populate the new book
  await readingList.populate({
    path: 'books.book',
    populate: {
      path: 'author',
      select: 'name'
    }
  });

  const newBook = readingList.books[readingList.books.length - 1];

  res.status(201).json({
    success: true,
    book: newBook,
    bookCount: readingList.books.length
  });
});

// @desc    Remove book from reading list
// @route   DELETE /api/reading-lists/:id/books/:bookId
// @access  Private
export const removeBookFromList = asyncHandler(async (req, res) => {
  const { id, bookId } = req.params;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Make sure user owns the reading list
  if (readingList.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to modify this reading list');
  }

  // Remove book from list
  const initialLength = readingList.books.length;
  readingList.books = readingList.books.filter(b => 
    b.book.toString() !== bookId
  );

  if (readingList.books.length === initialLength) {
    res.status(404);
    throw new Error('Book not found in reading list');
  }

  // Reorder remaining books
  readingList.books.forEach((book, index) => {
    book.order = index;
  });

  await readingList.save();

  res.json({
    success: true,
    message: 'Book removed from reading list',
    bookCount: readingList.books.length
  });
});

// @desc    Update book in reading list
// @route   PUT /api/reading-lists/:id/books/:bookId
// @access  Private
export const updateBookInList = asyncHandler(async (req, res) => {
  const { id, bookId } = req.params;
  const { notes, order } = req.body;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Make sure user owns the reading list
  if (readingList.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to modify this reading list');
  }

  // Find the book in the list
  const bookIndex = readingList.books.findIndex(b => 
    b.book.toString() === bookId
  );

  if (bookIndex === -1) {
    res.status(404);
    throw new Error('Book not found in reading list');
  }

  // Update book
  if (notes !== undefined) {
    readingList.books[bookIndex].notes = notes;
  }

  if (order !== undefined) {
    readingList.books[bookIndex].order = order;
  }

  await readingList.save();

  res.json({
    success: true,
    book: readingList.books[bookIndex]
  });
});

// @desc    Reorder books in reading list
// @route   PUT /api/reading-lists/:id/reorder
// @access  Private
export const reorderBooks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bookOrder } = req.body;

  if (!Array.isArray(bookOrder)) {
    res.status(400);
    throw new Error('Book order array is required');
  }

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Make sure user owns the reading list
  if (readingList.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to modify this reading list');
  }

  // Update order of books
  bookOrder.forEach((bookId, index) => {
    const book = readingList.books.find(b => 
      b.book.toString() === bookId
    );
    if (book) {
      book.order = index;
    }
  });

  // Sort books by new order
  readingList.books.sort((a, b) => a.order - b.order);

  await readingList.save();

  res.json({
    success: true,
    books: readingList.books
  });
});

// @desc    Follow a reading list
// @route   POST /api/reading-lists/:id/follow
// @access  Private
export const followReadingList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Check if already following
  const isFollowing = readingList.followers.some(f => 
    f.user && f.user.toString() === userId
  );

  if (isFollowing) {
    res.status(400);
    throw new Error('Already following this reading list');
  }

  // Add to followers
  readingList.followers.push({ user: userId });
  readingList.followersCount = readingList.followers.length;

  await readingList.save();

  res.json({
    success: true,
    message: 'Successfully followed reading list',
    followersCount: readingList.followersCount
  });
});

// @desc    Unfollow a reading list
// @route   DELETE /api/reading-lists/:id/unfollow
// @access  Private
export const unfollowReadingList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Remove from followers
  const initialCount = readingList.followers.length;
  readingList.followers = readingList.followers.filter(f => 
    !f.user || f.user.toString() !== userId
  );

  if (readingList.followers.length === initialCount) {
    res.status(404);
    throw new Error('Not following this reading list');
  }

  readingList.followersCount = readingList.followers.length;
  await readingList.save();

  res.json({
    success: true,
    message: 'Successfully unfollowed reading list',
    followersCount: readingList.followersCount
  });
});

// @desc    Like a reading list
// @route   POST /api/reading-lists/:id/like
// @access  Private
export const likeReadingList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Check if already liked
  const isLiked = readingList.likes.some(l => 
    l.user && l.user.toString() === userId
  );

  if (isLiked) {
    res.status(400);
    throw new Error('Already liked this reading list');
  }

  // Add to likes
  readingList.likes.push({ user: userId });
  readingList.likesCount = readingList.likes.length;

  await readingList.save();

  res.json({
    success: true,
    message: 'Successfully liked reading list',
    likesCount: readingList.likesCount
  });
});

// @desc    Unlike a reading list
// @route   DELETE /api/reading-lists/:id/unlike
// @access  Private
export const unlikeReadingList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const readingList = await ReadingList.findById(id);

  if (!readingList) {
    res.status(404);
    throw new Error('Reading list not found');
  }

  // Remove from likes
  const initialCount = readingList.likes.length;
  readingList.likes = readingList.likes.filter(l => 
    !l.user || l.user.toString() !== userId
  );

  if (readingList.likes.length === initialCount) {
    res.status(404);
    throw new Error('Not liking this reading list');
  }

  readingList.likesCount = readingList.likes.length;
  await readingList.save();

  res.json({
    success: true,
    message: 'Successfully unliked reading list',
    likesCount: readingList.likesCount
  });
});