import express from 'express';
import { check } from 'express-validator';
import {
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  voteHelpful,
  voteUnhelpful,
  addReply,
  deleteReply,
  getBookReviews
} from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const reviewValidation = [
  check('rating', 'Rating between 1-5 is required').isInt({ min: 1, max: 5 }),
  check('comment', 'Comment is required').not().isEmpty(),
];

const replyValidation = [
  check('comment', 'Reply comment is required').not().isEmpty(),
];

// Public routes
router.get('/', getReviews);
router.get('/book/:bookId', getBookReviews);
router.get('/:id', getReviewById);

// Protected routes
router.put('/:id', protect, reviewValidation, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, voteHelpful);
router.post('/:id/unhelpful', protect, voteUnhelpful);
router.post('/:id/replies', protect, replyValidation, addReply);
router.delete('/:id/replies/:replyId', protect, deleteReply);

export default router;