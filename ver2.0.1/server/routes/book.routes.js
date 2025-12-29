import express from 'express';
import { check } from 'express-validator';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  getTrendingBooks,
  getNewReleases,
  getBookPreview,
  addReview,
  updateReadingProgress,
  getSimilarBooks,
  getBooksByAuthor
} from '../controllers/book.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const bookValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('author', 'Author is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('genres', 'At least one genre is required').isArray({ min: 1 }),
  check('pageCount', 'Page count is required').isInt({ min: 1 }),
  check('publishedDate', 'Published date is required').not().isEmpty(),
  check('formats', 'At least one format is required').isArray({ min: 1 }),
];

const reviewValidation = [
  check('rating', 'Rating between 1-5 is required').isInt({ min: 1, max: 5 }),
  check('comment', 'Comment is required').not().isEmpty(),
];

// Public routes
router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/trending', getTrendingBooks);
router.get('/new-releases', getNewReleases);
router.get('/:id', getBookById);
router.get('/:id/similar', getSimilarBooks);
router.get('/author/:authorId', getBooksByAuthor);
router.get('/:id/preview', getBookPreview);

// Protected routes
router.post('/:id/reviews', protect, reviewValidation, addReview);
router.post('/:id/progress', protect, updateReadingProgress);

// Admin routes
router.post('/', protect, admin, bookValidation, createBook);
router.put('/:id', protect, admin, bookValidation, updateBook);
router.delete('/:id', protect, admin, deleteBook);

export default router;