import api from './api';

const readingListService = {
  // Get user's reading lists
  getReadingLists: async (params = {}) => {
    const response = await api.get('/reading-lists', { params });
    return response.data;
  },

  // Get public reading lists
  getPublicReadingLists: async (params = {}) => {
    const response = await api.get('/reading-lists/public', { params });
    return response.data;
  },

  // Get trending reading lists
  getTrendingReadingLists: async (limit = 10) => {
    const response = await api.get('/reading-lists/trending', { params: { limit } });
    return response.data;
  },

  // Get reading list by ID
  getReadingListById: async (id) => {
    const response = await api.get(`/reading-lists/${id}`);
    return response.data;
  },

  // Create reading list
  createReadingList: async (data) => {
    const response = await api.post('/reading-lists', data);
    return response.data;
  },

  // Update reading list
  updateReadingList: async (id, data) => {
    const response = await api.put(`/reading-lists/${id}`, data);
    return response.data;
  },

  // Delete reading list
  deleteReadingList: async (id) => {
    const response = await api.delete(`/reading-lists/${id}`);
    return response.data;
  },

  // Add book to reading list
  addBookToList: async (listId, bookId, notes = '') => {
    const response = await api.post(`/reading-lists/${listId}/books`, {
      bookId,
      notes,
    });
    return response.data;
  },

  // Remove book from reading list
  removeBookFromList: async (listId, bookId) => {
    const response = await api.delete(`/reading-lists/${listId}/books/${bookId}`);
    return response.data;
  },

  // Follow reading list
  followReadingList: async (listId) => {
    const response = await api.post(`/reading-lists/${listId}/follow`);
    return response.data;
  },

  // Unfollow reading list
  unfollowReadingList: async (listId) => {
    const response = await api.delete(`/reading-lists/${listId}/unfollow`);
    return response.data;
  },

  // Like reading list
  likeReadingList: async (listId) => {
    const response = await api.post(`/reading-lists/${listId}/like`);
    return response.data;
  },

  // Unlike reading list
  unlikeReadingList: async (listId) => {
    const response = await api.delete(`/reading-lists/${listId}/unlike`);
    return response.data;
  },
};

export default readingListService;