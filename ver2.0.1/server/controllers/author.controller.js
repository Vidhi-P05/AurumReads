import asyncHandler from 'express-async-handler';
import Author from '../models/Author.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// @desc    Get all authors
// @route   GET /api/authors
// @access  Public
export const getAuthors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort = '-followersCount',
    genre,
    verified
  } = req.query;

  // Build filter
  const filter = {};

  if (genre) {
    filter.genres = genre;
  }

  if (verified === 'true') {
    filter.isVerified = true;
  }

  const skip = (page - 1) * limit;

  const authors = await Author.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Author.countDocuments(filter);

  // Get book count for each author
  const authorsWithStats = await Promise.all(
    authors.map(async (author) => {
      const bookCount = await Book.countDocuments({ author: author._id });
      return {
        ...author,
        bookCount
      };
    })
  );

  res.json({
    success: true,
    count: authors.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    authors: authorsWithStats
  });
});

// @desc    Get single author by ID
// @route   GET /api/authors/:id
// @access  Public
export const getAuthorById = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id)
    .populate('user', 'name email avatar')
    .lean();

  if (!author) {
    res.status(404);
    throw new Error('Author not found');
  }

  // Get author's books
  const books = await Book.find({ author: author._id })
    .select('title coverImage ratings publishedDate genres formats')
    .sort('-publishedDate')
    .limit(10)
    .lean();

  // Get similar authors (same genres)
  const similarAuthors = await Author.find({
    genres: { $in: author.genres },
    _id: { $ne: author._id }
  })
    .select('name photo genres followersCount')
    .limit(4)
    .lean();

  // Check if current user is following
  let isFollowing = false;
  if (req.user) {
    const user = await User.findById(req.user.id);
    isFollowing = user.following.some(
      f => f.author.toString() === author._id.toString()
    );
  }

  res.json({
    success: true,
    author: {
      ...author,
      books,
      similarAuthors,
      isFollowing
    }
  });
});

// @desc    Create an author
// @route   POST /api/authors
// @access  Private/Admin
export const createAuthor = asyncHandler(async (req, res) => {
  const author = await Author.create(req.body);

  res.status(201).json({
    success: true,
    author
  });
});

// @desc    Update an author
// @route   PUT /api/authors/:id
// @access  Private/Admin
export const updateAuthor = asyncHandler(async (req, res) => {
  let author = await Author.findById(req.params.id);

  if (!author) {
    res.status(404);
    throw new Error('Author not found');
  }

  author = await Author.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    author
  });
});

// @desc    Delete an author
// @route   DELETE /api/authors/:id
// @access  Private/Admin
export const deleteAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);

  if (!author) {
    res.status(404);
    throw new Error('Author not found');
  }

  // Delete author's books
  await Book.deleteMany({ author: author._id });

  // Remove author from user's following lists
  await User.updateMany(
    { 'following.author': author._id },
    { $pull: { following: { author: author._id } } }
  );

  await author.deleteOne();

  res.json({
    success: true,
    message: 'Author deleted successfully'
  });
});

// @desc    Follow an author
// @route   POST /api/authors/:id/follow
// @access  Private
export const followAuthor = asyncHandler(async (req, res) => {
  const authorId = req.params.id;
  const userId = req.user.id;

  const author = await Author.findById(authorId);

  if (!author) {
    res.status(404);
    throw new Error('Author not found');
  }

  const user = await User.findById(userId);

  // Check if already following
  const isFollowing = user.following.some(
    f => f.author.toString() === authorId
  );

  if (isFollowing) {
    res.status(400);
    throw new Error('Already following this author');
  }

  // Add to user's following
  user.following.push({ author: authorId });
  await user.save();

  // Update author's followers count
  await author.updateFollowersCount();

  res.json({
    success: true,
    message: 'Successfully followed author',
    following: user.following
  });
});

// @desc    Unfollow an author
// @route   DELETE /api/authors/:id/unfollow
// @access  Private
export const unfollowAuthor = asyncHandler(async (req, res) => {
  const authorId = req.params.id;
  const userId = req.user.id;

  const user = await User.findById(userId);

  // Remove from user's following
  user.following = user.following.filter(
    f => f.author.toString() !== authorId
  );
  await user.save();

  // Update author's followers count
  const author = await Author.findById(authorId);
  if (author) {
    await author.updateFollowersCount();
  }

  res.json({
    success: true,
    message: 'Successfully unfollowed author',
    following: user.following
  });
});

// @desc    Get author's books
// @route   GET /api/authors/:id/books
// @access  Public
export const getAuthorBooks = asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 12, sort = '-publishedDate' } = req.query;

  const skip = (page - 1) * limit;

  const books = await Book.find({ author: authorId })
    .populate('author', 'name photo')
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

// @desc    Get top authors
// @route   GET /api/authors/top
// @access  Public
export const getTopAuthors = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const authors = await Author.find({ isVerified: true })
    .sort('-followersCount')
    .limit(Number(limit))
    .select('name photo genres followersCount bio')
    .lean();

  res.json({
    success: true,
    authors
  });
});

// @desc    Search authors
// @route   GET /api/authors/search
// @access  Public
export const searchAuthors = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Please provide a search query');
  }

  const query = {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (page - 1) * limit;

  const authors = await Author.find(query)
    .sort('-followersCount')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Author.countDocuments(query);

  res.json({
    success: true,
    count: authors.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    authors
  });
});