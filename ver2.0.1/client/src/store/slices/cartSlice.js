import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';

// Async thunks
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, thunkAPI) => {
    try {
      return await cartService.getCart();
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to get cart';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const syncCart = createAsyncThunk(
  'cart/syncCart',
  async (cartData, thunkAPI) => {
    try {
      return await cartService.syncCart(cartData);
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to sync cart';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  isLoading: false,
  isError: false,
  message: '',
  lastSync: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { book, format, price, quantity = 1 } = action.payload;
      const existingItem = state.items.find(
        item => item.book._id === book._id && item.format === format
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          book,
          format,
          price,
          quantity,
          addedAt: new Date().toISOString(),
        });
      }

      updateCartTotals(state);
    },
    removeFromCart: (state, action) => {
      const { bookId, format } = action.payload;
      state.items = state.items.filter(
        item => !(item.book._id === bookId && item.format === format)
      );
      updateCartTotals(state);
    },
    updateQuantity: (state, action) => {
      const { bookId, format, quantity } = action.payload;
      const item = state.items.find(
        item => item.book._id === bookId && item.format === format
      );
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(
            i => !(i.book._id === bookId && i.format === format)
          );
        } else {
          item.quantity = quantity;
        }
      }
      
      updateCartTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.subtotal = 0;
      state.tax = 0;
      state.shipping = 0;
      state.total = 0;
    },
    setShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
    },
    setBillingAddress: (state, action) => {
      state.billingAddress = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.tax = action.payload.tax || 0;
        state.shipping = action.payload.shipping || 0;
        state.total = action.payload.total || 0;
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.lastSync = new Date().toISOString();
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(syncCart.fulfilled, (state, action) => {
        state.lastSync = new Date().toISOString();
      });
  },
});

// Helper function to update cart totals
const updateCartTotals = (state) => {
  state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate tax (assuming 8.5% tax rate)
  state.tax = state.subtotal * 0.085;
  
  // Calculate shipping (free over $25, else $3.99)
  state.shipping = state.subtotal >= 25 ? 0 : 3.99;
  
  state.total = state.subtotal + state.tax + state.shipping;
};

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setShippingAddress,
  setBillingAddress,
  setPaymentMethod,
} = cartSlice.actions;

export default cartSlice.reducer;