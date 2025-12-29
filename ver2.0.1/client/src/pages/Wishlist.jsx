import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Tag,
  ArrowRight,
  Bell,
  BellOff
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import wishlistService from '../../services/wishlistService';
import { addToCart } from '../../store/slices/cartSlice';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [priceAlertsOnly, setPriceAlertsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [notifications, setNotifications] = useState([]);

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Recently Added' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'title', label: 'Title A-Z' },
  ];

  useEffect(() => {
    if (user) {
      fetchWishlist();
      fetchNotifications();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      setWishlist(data.items || []);
      setFilteredItems(data.items || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await wishlistService.getWishlistNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleRemoveItem = async (bookId) => {
    if (!window.confirm('Remove this item from wishlist?')) return;

    try {
      await wishlistService.removeFromWishlist(bookId);
      setWishlist(prev => prev.filter(item => item.book._id !== bookId));
      setFilteredItems(prev => prev.filter(item => item.book._id !== bookId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      book: item.book,
      format: 'ebook', // Default format
      price: item.lowestPrice || item.originalPrice || 0,
      quantity: 1
    }));
    toast.success('Added to cart');
  };

  const handleTogglePriceAlert = async (item) => {
    try {
      await wishlistService.updateWishlistItem(item.book._id, {
        priceAlert: !item.priceAlert
      });
      
      setWishlist(prev => prev.map(wishlistItem => 
        wishlistItem.book._id === item.book._id
          ? { ...wishlistItem, priceAlert: !item.priceAlert }
          : wishlistItem
      ));
      
      toast.success(`Price alerts ${!item.priceAlert ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update price alert');
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Clear your entire wishlist? This cannot be undone.')) return;

    try {
      await wishlistService.clearWishlist();
      setWishlist([]);
      setFilteredItems([]);
      toast.success('Wishlist cleared');
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
  };

  // Filter and sort items
  useEffect(() => {
    let items = [...wishlist];

    // Filter by priority
    if (selectedPriority !== 'all') {
      items = items.filter(item => item.priority === selectedPriority);
    }

    // Filter by price alerts
    if (priceAlertsOnly) {
      items = items.filter(item => item.priceAlert);
    }

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.addedAt) - new Date(a.addedAt);
        case 'price-low':
          return (a.lowestPrice || a.originalPrice || 0) - (b.lowestPrice || b.originalPrice || 0);
        case 'price-high':
          return (b.lowestPrice || b.originalPrice || 0) - (a.lowestPrice || a.originalPrice || 0);
        case 'title':
          return a.book.title.localeCompare(b.book.title);
        default:
          return 0;
      }
    });

    setFilteredItems(items);
  }, [wishlist, selectedPriority, priceAlertsOnly, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-padding">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-primary flex items-center">
                  <Heart className="h-8 w-8 text-accent mr-3" />
                  My Wishlist
                </h1>
                <p className="text-gray-600">
                  {wishlist.length} items • Save books for later
                </p>
              </div>
              {wishlist.length > 0 && (
                <button
                  onClick={handleClearWishlist}
                  className="text-red-600 hover:text-red-700 flex items-center text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              )}
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary mb-1">
                      Price Drop Alerts ({notifications.length})
                    </h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {notifications.slice(0, 2).map((notification, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          <span>
                            <strong>{notification.bookTitle}</strong> is now $
                            {notification.newPrice} ({notification.discount}% off)
                          </span>
                        </div>
                      ))}
                      {notifications.length > 2 && (
                        <button className="text-accent hover:text-accent-dark text-sm font-medium">
                          View all {notifications.length} alerts →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-700">Filter by:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Priority Filter */}
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Price Alerts Toggle */}
                <button
                  onClick={() => setPriceAlertsOnly(!priceAlertsOnly)}
                  className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
                    priceAlertsOnly
                      ? 'bg-accent/10 text-accent border-accent'
                      : 'border-gray-300 hover:border-accent'
                  }`}
                >
                  {priceAlertsOnly ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                  Price Alerts
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {wishlist.length === 0 ? (
            <div className="card p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-display font-bold text-primary mb-4">
                Your wishlist is empty
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Save books you're interested in to your wishlist. 
                We'll notify you about price drops and availability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search" className="btn-primary">
                  Browse Books
                </Link>
                <Link to="/quiz" className="btn-outline">
                  Take AI Quiz
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Wishlist Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {filteredItems.map((item) => (
                  <div key={item.book._id} className="card p-6 hover:shadow-book-hover transition-all duration-300">
                    <div className="flex gap-4 mb-4">
                      {/* Book Cover */}
                      <Link 
                        to={`/book/${item.book._id}`}
                        className="flex-shrink-0"
                      >
                        <img 
                          src={item.book.coverImage} 
                          alt={item.book.title}
                          className="w-20 h-32 object-cover rounded-lg shadow-sm"
                        />
                      </Link>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <Link 
                            to={`/book/${item.book._id}`}
                            className="group"
                          >
                            <h4 className="font-serif font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
                              {item.book.title}
                            </h4>
                          </Link>
                          <button
                            onClick={() => handleRemoveItem(item.book._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <Link 
                          to={`/author/${item.book.author?._id}`}
                          className="text-sm text-gray-600 hover:text-accent transition-colors block mb-2"
                        >
                          {item.book.author?.name}
                        </Link>

                        {/* Price */}
                        <div className="mb-3">
                          <div className="text-lg font-bold text-primary">
                            ${item.lowestPrice?.toFixed(2) || item.originalPrice?.toFixed(2) || '--'}
                          </div>
                          {item.lowestPrice && item.originalPrice && item.lowestPrice < item.originalPrice && (
                            <div className="text-sm text-green-600">
                              Save ${(item.originalPrice - item.lowestPrice).toFixed(2)}!
                            </div>
                          )}
                        </div>

                        {/* Priority Badge */}
                        <div className="mb-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.priority === 'high' 
                              ? 'bg-red-100 text-red-800'
                              : item.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-1">Notes:</div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {item.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn-primary flex-1 flex items-center justify-center text-sm py-2"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleTogglePriceAlert(item)}
                        className={`p-2 rounded-lg border transition-colors ${
                          item.priceAlert
                            ? 'bg-accent/10 text-accent border-accent'
                            : 'border-gray-300 hover:border-accent'
                        }`}
                        title={item.priceAlert ? 'Disable price alerts' : 'Enable price alerts'}
                      >
                        {item.priceAlert ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {wishlist.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      $
                      {wishlist
                        .reduce((total, item) => total + (item.lowestPrice || item.originalPrice || 0), 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {wishlist.filter(item => item.priceAlert).length}
                    </div>
                    <div className="text-sm text-gray-600">Price Alerts</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;