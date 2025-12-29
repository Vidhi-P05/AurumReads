import api from './api';

const wishlistService = {
  // Get user's wishlist
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  // Add book to wishlist
  addToWishlist: async (bookId, data = {}) => {
    const response = await api.post('/wishlist/add', {
      bookId,
      ...data,
    });
    return response.data;
  },

  // Remove book from wishlist
  removeFromWishlist: async (bookId) => {
    const response = await api.delete(`/wishlist/remove/${bookId}`);
    return response.data;
  },

  // Update wishlist item
  updateWishlistItem: async (bookId, data) => {
    const response = await api.put(`/wishlist/update/${bookId}`, data);
    return response.data;
  },

  // Clear wishlist
  clearWishlist: async () => {
    const response = await api.delete('/wishlist/clear');
    return response.data;
  },

  // Get wishlist notifications
  getWishlistNotifications: async () => {
    const response = await api.get('/wishlist/notifications');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (data) => {
    const response = await api.put('/wishlist/notifications/preferences', data);
    return response.data;
  },
};

export default wishlistService;