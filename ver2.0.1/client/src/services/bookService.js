import api from './api';

const bookService = {
  // Get all books with pagination and filters
  getBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Get single book by ID
  getBookById: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Get books by author
  getBooksByAuthor: async (authorId, params = {}) => {
    const response = await api.get(`/books/author/${authorId}`, { params });
    return response.data;
  },

  // Search books
  searchBooks: async (query, params = {}) => {
    const response = await api.get('/books/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (type = 'personalized', limit = 10) => {
    const response = await api.get('/recommendations', {
      params: { type, limit },
    });
    return response.data;
  },

  // Get trending books
  getTrendingBooks: async (limit = 10) => {
    const response = await api.get('/books/trending', { params: { limit } });
    return response.data;
  },

  // Get new releases
  getNewReleases: async (limit = 10) => {
    const response = await api.get('/books/new-releases', { params: { limit } });
    return response.data;
  },

  // Get book preview
  getBookPreview: async (bookId) => {
    const response = await api.get(`/books/${bookId}/preview`);
    return response.data;
  },

  // Add to wishlist
  addToWishlist: async (bookId) => {
    const response = await api.post(`/wishlist/${bookId}`);
    return response.data;
  },

  // Remove from wishlist
  removeFromWishlist: async (bookId) => {
    const response = await api.delete(`/wishlist/${bookId}`);
    return response.data;
  },

  // Rate a book
  rateBook: async (bookId, rating, comment) => {
    const response = await api.post(`/books/${bookId}/rate`, {
      rating,
      comment,
    });
    return response.data;
  },

  // Update reading progress
  updateReadingProgress: async (bookId, progress) => {
    const response = await api.post(`/books/${bookId}/progress`, { progress });
    return response.data;
  },
};

export default bookService;