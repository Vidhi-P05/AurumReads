import api from './api';

const recommendationService = {
  // Get personalized recommendations
  getPersonalizedRecommendations: async (limit = 10) => {
    const response = await api.get('/recommendations/personalized', {
      params: { limit },
    });
    return response.data;
  },

  // Get collaborative recommendations
  getCollaborativeRecommendations: async (limit = 10) => {
    const response = await api.get('/recommendations/collaborative', {
      params: { limit },
    });
    return response.data;
  },

  // Get content-based recommendations
  getContentBasedRecommendations: async (limit = 10) => {
    const response = await api.get('/recommendations/content-based', {
      params: { limit },
    });
    return response.data;
  },

  // Get trending recommendations
  getTrendingRecommendations: async (limit = 10) => {
    const response = await api.get('/recommendations/trending', {
      params: { limit },
    });
    return response.data;
  },

  // Get "because you liked" recommendations
  getBecauseYouLiked: async (bookId, limit = 8) => {
    const response = await api.get(`/recommendations/because-you-liked/${bookId}`, {
      params: { limit },
    });
    return response.data;
  },

  // Get AI quiz recommendations
  getQuizRecommendations: async (answers) => {
    const response = await api.get('/recommendations/quiz', {
      params: { answers },
    });
    return response.data;
  },

  // Generate AI summary
  generateAISummary: async (bookId) => {
    const response = await api.post(`/recommendations/generate-summary/${bookId}`);
    return response.data;
  },

  // Track recommendation interaction
  trackRecommendationInteraction: async (recommendationId, data) => {
    const response = await api.post(`/recommendations/${recommendationId}/interact`, data);
    return response.data;
  },
};

export default recommendationService;