import express from 'express';
import {
  getPersonalizedRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getTrendingRecommendations,
  getBecauseYouLiked,
  getQuizRecommendations,
  generateAISummary,
  trackRecommendationInteraction
} from '../controllers/recommendation.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (some recommendations can be public)
router.get('/trending', getTrendingRecommendations);

// Protected routes
router.get('/personalized', protect, getPersonalizedRecommendations);
router.get('/collaborative', protect, getCollaborativeRecommendations);
router.get('/content-based', protect, getContentBasedRecommendations);
router.get('/because-you-liked/:bookId', protect, getBecauseYouLiked);
router.get('/quiz', protect, getQuizRecommendations);
router.post('/:recommendationId/interact', protect, trackRecommendationInteraction);

// AI routes
router.post('/generate-summary/:bookId', protect, generateAISummary);

export default router;