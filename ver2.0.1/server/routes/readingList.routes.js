import express from 'express';
import { check } from 'express-validator';
import {
  getReadingLists,
  getReadingListById,
  createReadingList,
  updateReadingList,
  deleteReadingList,
  addBookToList,
  removeBookFromList,
  updateBookInList,
  reorderBooks,
  followReadingList,
  unfollowReadingList,
  likeReadingList,
  unlikeReadingList,
  getPublicReadingLists,
  getUserReadingLists,
  getTrendingReadingLists
} from '../controllers/readingList.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const readingListValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
];

const bookInListValidation = [
  check('bookId', 'Book ID is required').not().isEmpty(),
];

// Public routes
router.get('/public', getPublicReadingLists);
router.get('/trending', getTrendingReadingLists);
router.get('/:id', getReadingListById);
router.get('/user/:userId', getUserReadingLists);

// Protected routes
router.get('/', protect, getReadingLists);
router.post('/', protect, readingListValidation, createReadingList);
router.put('/:id', protect, readingListValidation, updateReadingList);
router.delete('/:id', protect, deleteReadingList);

// Book management
router.post('/:id/books', protect, bookInListValidation, addBookToList);
router.delete('/:id/books/:bookId', protect, removeBookFromList);
router.put('/:id/books/:bookId', protect, updateBookInList);
router.put('/:id/reorder', protect, reorderBooks);

// Social features
router.post('/:id/follow', protect, followReadingList);
router.delete('/:id/unfollow', protect, unfollowReadingList);
router.post('/:id/like', protect, likeReadingList);
router.delete('/:id/unlike', protect, unlikeReadingList);

export default router;