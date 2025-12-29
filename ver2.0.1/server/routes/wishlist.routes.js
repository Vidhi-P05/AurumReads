import express from 'express';
import { check } from 'express-validator';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  clearWishlist,
  getWishlistNotifications,
  updateNotificationPreferences
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const wishlistItemValidation = [
  check('bookId', 'Book ID is required').not().isEmpty(),
];

router.get('/', getWishlist);
router.post('/add', wishlistItemValidation, addToWishlist);
router.delete('/remove/:bookId', removeFromWishlist);
router.put('/update/:bookId', updateWishlistItem);
router.delete('/clear', clearWishlist);
router.get('/notifications', getWishlistNotifications);
router.put('/notifications/preferences', updateNotificationPreferences);

export default router;