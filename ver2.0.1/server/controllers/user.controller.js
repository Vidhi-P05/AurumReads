import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import ReadingList from '../models/ReadingList.js';
import Wishlist from '../models/Wishlist.js';
import Purchase from '../models/Purchase.js';
import Review from '../models/Review.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('wishlist.book')
    .populate('following.author')
    .populate('followers.user')
    .lean();

  res.json({
    success: true,
    user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, bio, favoriteGenres, readingPreferences, avatar } = req.body;

  const user = await User.findById(req.user.id);

  // Update fields if provided
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (favoriteGenres) user.favoriteGenres = favoriteGenres;
  if (readingPreferences) user.readingPreferences = readingPreferences;
  if (avatar) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      favoriteGenres: user.favoriteGenres,
      readingPreferences: user.readingPreferences,
      readingStats: user.readingStats
    }
  });
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // Delete user's reading lists
  await ReadingList.deleteMany({ user: user._id });

  // Delete user's wishlist
  await Wishlist.deleteMany({ user: user._id });

  // Delete user's reviews
  await Review.deleteMany({ user: user._id });

  // Delete user's purchases (optional - might want to keep for records)
  await Purchase.deleteMany({ user: user._id });

  // Remove user from other users' followers/following
  await User.updateMany(
    { 'followers.user': user._id },
    { $pull: { followers: { user: user._id } } }
  );

  await User.updateMany(
    { 'following.user': user._id },
    { $pull: { following: { user: user._id } } }
  );

  // Finally delete the user
  await user.deleteOne();

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

// @desc    Get user reading lists
// @route   GET /api/users/reading-lists
// @access  Private
export const getUserReadingLists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const readingLists = await ReadingList.find({ user: req.user.id })
    .populate('books.book')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await ReadingList.countDocuments({ user: req.user.id });

  res.json({
    success: true,
    count: readingLists.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    readingLists
  });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getUserWishlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const skip = (page - 1) * limit;

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
    return res.json({
      success: true,
      items: [],
      total: 0,
      count: 0
    });
  }

  // Paginate items
  const items = wishlist.items.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    items,
    total: wishlist.items.length,
    count: items.length,
    pages: Math.ceil(wishlist.items.length / limit),
    currentPage: Number(page)
  });
});

// @desc    Get user purchases
// @route   GET /api/users/purchases
// @access  Private
export const getUserPurchases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const purchases = await Purchase.find({ user: req.user.id })
    .populate('items.book')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Purchase.countDocuments({ user: req.user.id });

  res.json({
    success: true,
    count: purchases.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    purchases
  });
});

// @desc    Get user reviews
// @route   GET /api/users/reviews
// @access  Private
export const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user.id })
    .populate('book', 'title coverImage author')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Review.countDocuments({ user: req.user.id });

  res.json({
    success: true,
    count: reviews.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    reviews
  });
});

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('readingStats')
    .lean();

  const readingListsCount = await ReadingList.countDocuments({ user: req.user.id });
  const wishlistCount = await Wishlist.aggregate([
    { $match: { user: req.user._id } },
    { $project: { count: { $size: '$items' } } }
  ]);
  
  const purchasesCount = await Purchase.countDocuments({ 
    user: req.user.id,
    paymentStatus: 'completed'
  });

  const reviewsCount = await Review.countDocuments({ user: req.user.id });

  const followersCount = await User.countDocuments({ 'following.user': req.user.id });
  const followingCount = (await User.findById(req.user.id)).following.length;

  res.json({
    success: true,
    stats: {
      readingStats: user.readingStats,
      lists: readingListsCount,
      wishlist: wishlistCount[0]?.count || 0,
      purchases: purchasesCount,
      reviews: reviewsCount,
      followers: followersCount,
      following: followingCount
    }
  });
});

// @desc    Get user followers
// @route   GET /api/users/followers
// @access  Private
export const getUserFollowers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user.id)
    .populate({
      path: 'followers.user',
      select: 'name avatar bio'
    })
    .lean();

  const followers = user.followers.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    count: followers.length,
    total: user.followers.length,
    pages: Math.ceil(user.followers.length / limit),
    currentPage: Number(page),
    followers
  });
});

// @desc    Get user following
// @route   GET /api/users/following
// @access  Private
export const getUserFollowing = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user.id)
    .populate({
      path: 'following.author',
      select: 'name photo bio followersCount'
    })
    .lean();

  const following = user.following.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    count: following.length,
    total: user.following.length,
    pages: Math.ceil(user.following.length / limit),
    currentPage: Number(page),
    following
  });
});

// @desc    Follow another user
// @route   POST /api/users/follow/:userId
// @access  Private
export const followUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  if (userId === currentUserId) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  const userToFollow = await User.findById(userId);
  if (!userToFollow) {
    res.status(404);
    throw new Error('User not found');
  }

  const currentUser = await User.findById(currentUserId);

  // Check if already following
  const isFollowing = currentUser.following.some(
    f => f.user && f.user.toString() === userId
  );

  if (isFollowing) {
    res.status(400);
    throw new Error('Already following this user');
  }

  // Add to current user's following
  currentUser.following.push({ user: userId });
  await currentUser.save();

  // Add to target user's followers
  userToFollow.followers.push({ user: currentUserId });
  await userToFollow.save();

  res.json({
    success: true,
    message: 'Successfully followed user'
  });
});

// @desc    Unfollow a user
// @route   DELETE /api/users/unfollow/:userId
// @access  Private
export const unfollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const currentUser = await User.findById(currentUserId);

  // Remove from current user's following
  currentUser.following = currentUser.following.filter(
    f => !f.user || f.user.toString() !== userId
  );
  await currentUser.save();

  // Remove from target user's followers
  await User.findByIdAndUpdate(userId, {
    $pull: { followers: { user: currentUserId } }
  });

  res.json({
    success: true,
    message: 'Successfully unfollowed user'
  });
});