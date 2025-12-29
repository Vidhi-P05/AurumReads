import asyncHandler from 'express-async-handler';
import Wishlist from '../models/Wishlist.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id })
    .populate({
      path: 'items.book',
      populate: {
        path: 'author',
        select: 'name'
      }
    })
    .lean();

  if (!wishlist) {
    // Create empty wishlist if it doesn't exist
    const newWishlist = await Wishlist.create({
      user: req.user.id,
      items: []
    });
    
    return res.json({
      success: true,
      wishlist: newWishlist
    });
  }

  res.json({
    success: true,
    wishlist
  });
});

// @desc    Add book to wishlist
// @route   POST /api/wishlist/add
// @access  Private
export const addToWishlist = asyncHandler(async (req, res) => {
  const { bookId, notes, priority = 'medium', priceAlert = false } = req.body;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Get or create wishlist
  let wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: []
    });
  }

  // Check if book already in wishlist
  const existingItemIndex = wishlist.items.findIndex(item => 
    item.book.toString() === bookId
  );

  if (existingItemIndex !== -1) {
    res.status(400);
    throw new Error('Book already in wishlist');
  }

  // Get current price
  const currentPrice = Math.min(...book.formats.map(f => f.discountPrice || f.price));

  // Add to wishlist
  wishlist.items.push({
    book: bookId,
    notes,
    priority,
    priceAlert,
    originalPrice: currentPrice,
    lowestPrice: currentPrice
  });

  await wishlist.save();

  // Populate the new item
  await wishlist.populate({
    path: 'items.book',
    populate: {
      path: 'author',
      select: 'name'
    }
  });

  const newItem = wishlist.items[wishlist.items.length - 1];

  res.status(201).json({
    success: true,
    item: newItem,
    message: 'Book added to wishlist'
  });
});

// @desc    Remove book from wishlist
// @route   DELETE /api/wishlist/remove/:bookId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  const initialLength = wishlist.items.length;
  wishlist.items = wishlist.items.filter(item => 
    item.book.toString() !== bookId
  );

  if (wishlist.items.length === initialLength) {
    res.status(404);
    throw new Error('Book not found in wishlist');
  }

  await wishlist.save();

  res.json({
    success: true,
    message: 'Book removed from wishlist',
    itemCount: wishlist.items.length
  });
});

// @desc    Update wishlist item
// @route   PUT /api/wishlist/update/:bookId
// @access  Private
export const updateWishlistItem = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { notes, priority, priceAlert } = req.body;

  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  const itemIndex = wishlist.items.findIndex(item => 
    item.book.toString() === bookId
  );

  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Book not found in wishlist');
  }

  // Update item
  if (notes !== undefined) {
    wishlist.items[itemIndex].notes = notes;
  }

  if (priority !== undefined) {
    wishlist.items[itemIndex].priority = priority;
  }

  if (priceAlert !== undefined) {
    wishlist.items[itemIndex].priceAlert = priceAlert;
  }

  await wishlist.save();

  res.json({
    success: true,
    item: wishlist.items[itemIndex],
    message: 'Wishlist item updated'
  });
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  wishlist.items = [];
  await wishlist.save();

  res.json({
    success: true,
    message: 'Wishlist cleared'
  });
});

// @desc    Get wishlist notifications (price drops, restocks)
// @route   GET /api/wishlist/notifications
// @access  Private
export const getWishlistNotifications = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id })
    .populate({
      path: 'items.book',
      populate: {
        path: 'author',
        select: 'name'
      }
    });

  if (!wishlist || wishlist.items.length === 0) {
    return res.json({
      success: true,
      notifications: [],
      unreadCount: 0
    });
  }

  // Check for price drops and other notifications
  const notifications = await wishlist.checkPriceDrops();

  // Add restock notifications (you'd need to track stock in Book model)
  const restockNotifications = [];
  for (const item of wishlist.items) {
    const book = await Book.findById(item.book);
    if (book && book.formats.some(f => !f.isAvailable)) {
      // Check if any format is now available
      const wasUnavailable = item.lastChecked && !item.lastChecked.isAvailable;
      if (wasUnavailable && book.formats.some(f => f.isAvailable)) {
        restockNotifications.push({
          type: 'restock',
          book: book._id,
          bookTitle: book.title,
          message: 'Book is back in stock!'
        });
      }
    }
  }

  const allNotifications = [...notifications, ...restockNotifications];

  res.json({
    success: true,
    notifications: allNotifications,
    unreadCount: allNotifications.length
  });
});

// @desc    Update notification preferences
// @route   PUT /api/wishlist/notifications/preferences
// @access  Private
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { priceDrop, backInStock, newEdition } = req.body;

  let wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: []
    });
  }

  // Update preferences
  if (priceDrop !== undefined) {
    wishlist.notificationPreferences.priceDrop = priceDrop;
  }

  if (backInStock !== undefined) {
    wishlist.notificationPreferences.backInStock = backInStock;
  }

  if (newEdition !== undefined) {
    wishlist.notificationPreferences.newEdition = newEdition;
  }

  await wishlist.save();

  res.json({
    success: true,
    preferences: wishlist.notificationPreferences
  });
});