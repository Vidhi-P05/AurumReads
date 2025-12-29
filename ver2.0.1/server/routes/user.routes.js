import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getUserReadingLists,
  getUserWishlist,
  getUserPurchases,
  getUserReviews,
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
  getUserStats
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.delete('/account', deleteUserAccount);
router.get('/stats', getUserStats);

router.get('/reading-lists', getUserReadingLists);
router.get('/wishlist', getUserWishlist);
router.get('/purchases', getUserPurchases);
router.get('/reviews', getUserReviews);
router.get('/followers', getUserFollowers);
router.get('/following', getUserFollowing);

router.post('/follow/:userId', followUser);
router.delete('/unfollow/:userId', unfollowUser);

export default router;