import api from './api';

const authorService = {
  // Get all authors
  getAuthors: async (params = {}) => {
    const response = await api.get('/authors', { params });
    return response.data;
  },

  // Get author by ID
  getAuthorById: async (id) => {
    const response = await api.get(`/authors/${id}`);
    return response.data;
  },

  // Get top authors
  getTopAuthors: async (limit = 10) => {
    const response = await api.get('/authors/top', { params: { limit } });
    return response.data;
  },

  // Search authors
  searchAuthors: async (query, params = {}) => {
    const response = await api.get('/authors/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Follow author
  followAuthor: async (authorId) => {
    const response = await api.post(`/authors/${authorId}/follow`);
    return response.data;
  },

  // Unfollow author
  unfollowAuthor: async (authorId) => {
    const response = await api.delete(`/authors/${authorId}/unfollow`);
    return response.data;
  },

  // Get author's books
  getAuthorBooks: async (authorId, params = {}) => {
    const response = await api.get(`/authors/${authorId}/books`, { params });
    return response.data;
  },
};

export default authorService;