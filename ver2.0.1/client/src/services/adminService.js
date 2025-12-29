import api from './api';

const adminService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getRecentOrders: async (limit = 10) => {
    const response = await api.get('/admin/orders/recent', {
      params: { limit },
    });
    return response.data;
  },

  getPopularBooks: async (limit = 10) => {
    const response = await api.get('/admin/books/popular', {
      params: { limit },
    });
    return response.data;
  },

  // Books Management
  getBooks: async (params = {}) => {
    const response = await api.get('/admin/books', { params });
    return response.data;
  },

  getBookById: async (id) => {
    const response = await api.get(`/admin/books/${id}`);
    return response.data;
  },

  createBook: async (bookData) => {
    const response = await api.post('/admin/books', bookData);
    return response.data;
  },

  updateBook: async (id, bookData) => {
    const response = await api.put(`/admin/books/${id}`, bookData);
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/admin/books/${id}`);
    return response.data;
  },

  // Orders Management
  getOrders: async (params = {}) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
    return response.data;
  },

  // Users Management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Authors Management
  getAuthors: async (params = {}) => {
    const response = await api.get('/admin/authors', { params });
    return response.data;
  },

  createAuthor: async (authorData) => {
    const response = await api.post('/admin/authors', authorData);
    return response.data;
  },

  updateAuthor: async (id, authorData) => {
    const response = await api.put(`/admin/authors/${id}`, authorData);
    return response.data;
  },

  deleteAuthor: async (id) => {
    const response = await api.delete(`/admin/authors/${id}`);
    return response.data;
  },

  // Analytics
  getSalesAnalytics: async (period = 'month') => {
    const response = await api.get('/admin/analytics/sales', {
      params: { period },
    });
    return response.data;
  },

  getUserAnalytics: async (period = 'month') => {
    const response = await api.get('/admin/analytics/users', {
      params: { period },
    });
    return response.data;
  },
};

export default adminService;