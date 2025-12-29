import api from './api';

const cartService = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Sync cart with server
  syncCart: async (cartData) => {
    const response = await api.post('/cart/sync', cartData);
    return response.data;
  },

  // Update cart item
  updateCartItem: async (bookId, format, quantity) => {
    const response = await api.put(`/cart/items/${bookId}`, {
      format,
      quantity,
    });
    return response.data;
  },

  // Remove item from cart
  removeCartItem: async (bookId, format) => {
    const response = await api.delete(`/cart/items/${bookId}`, {
      data: { format },
    });
    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },

  // Apply promo code
  applyPromoCode: async (code) => {
    const response = await api.post('/cart/promo', { code });
    return response.data;
  },

  // Remove promo code
  removePromoCode: async () => {
    const response = await api.delete('/cart/promo');
    return response.data;
  },

  // Calculate shipping
  calculateShipping: async (address) => {
    const response = await api.post('/cart/shipping', address);
    return response.data;
  },

  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get order by ID
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Get user's orders
  getUserOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
};

export default cartService;