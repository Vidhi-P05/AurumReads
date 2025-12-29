import express from 'express';
import { check } from 'express-validator';
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  followAuthor,
  unfollowAuthor,
  getAuthorBooks,
  getTopAuthors,
  searchAuthors
} from '../controllers/author.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const authorValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('bio', 'Bio is required').not().isEmpty(),
];

// Public routes
router.get('/', getAuthors);
router.get('/top', getTopAuthors);
router.get('/search', searchAuthors);
router.get('/:id', getAuthorById);
router.get('/:id/books', getAuthorBooks);

// Protected routes
router.post('/:id/follow', protect, followAuthor);
router.delete('/:id/unfollow', protect, unfollowAuthor);

// Admin routes
router.post('/', protect, admin, authorValidation, createAuthor);
router.put('/:id', protect, admin, authorValidation, updateAuthor);
router.delete('/:id', protect, admin, deleteAuthor);

export default router;