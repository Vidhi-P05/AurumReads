import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Tag,
  Truck,
  Shield,
  CreditCard,
  Lock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../../store/slices/cartSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import cartService from '../../services/cartService';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal, tax, shipping, total, totalItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    if (user) {
      syncCartWithServer();
    }
  }, [user]);

  const syncCartWithServer = async () => {
    try {
      setLoading(true);
      await cartService.syncCart({
        items: items.map(item => ({
          book: item.book._id,
          format: item.format,
          quantity: item.quantity,
          price: item.price,
        })),
      });
    } catch (error) {
      console.error('Failed to sync cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (bookId, format, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart({ bookId, format }));
      toast.success('Item removed from cart');
    } else {
      dispatch(updateQuantity({ bookId, format, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (bookId, format) => {
    dispatch(removeFromCart({ bookId, format }));
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    try {
      const result = await cartService.applyPromoCode(promoCode);
      setDiscount(result.discount || 0);
      setPromoError('');
      toast.success('Promo code applied successfully!');
    } catch (error) {
      setPromoError(error.response?.data?.error || 'Invalid promo code');
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to proceed to checkout');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    navigate('/checkout');
  };

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
                  <ShoppingCart className="h-8 w-8 text-accent mr-3" />
                  Shopping Cart
                </h1>
                <p className="text-gray-600">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
                </p>
              </div>
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 flex items-center text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Continue Shopping */}
            <Link
              to="/search"
              className="inline-flex items-center text-accent hover:text-accent-dark font-medium mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {items.length === 0 ? (
                <div className="card p-12 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-display font-bold text-primary mb-4">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Add some books to your cart and they'll appear here.
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
                <div className="card p-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={`${item.book._id}-${item.format}`} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        {/* Book Cover */}
                        <Link 
                          to={`/book/${item.book._id}`}
                          className="flex-shrink-0"
                        >
                          <img 
                            src={item.book.coverImage} 
                            alt={item.book.title}
                            className="w-20 h-32 object-cover rounded-lg"
                          />
                        </Link>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Link 
                                to={`/book/${item.book._id}`}
                                className="group"
                              >
                                <h4 className="font-serif font-bold text-primary group-hover:text-accent transition-colors">
                                  {item.book.title}
                                </h4>
                              </Link>
                              <p className="text-sm text-gray-600">
                                by {item.book.author?.name}
                              </p>
                            </div>
                            <div className="text-lg font-bold text-primary">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>

                          {/* Format & Price */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full capitalize">
                                {item.format}
                              </span>
                              <span className="text-gray-700">
                                ${item.price.toFixed(2)} each
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.book._id, item.format)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Quantity Control */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                              <button
                                onClick={() => handleQuantityChange(item.book._id, item.format, item.quantity - 1)}
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.book._id, item.format, item.quantity + 1)}
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-sm text-gray-600">
                              ${(item.price * item.quantity).toFixed(2)} total
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoError('');
                          }}
                          placeholder="Enter promo code"
                          className="input-primary pl-10"
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        className="btn-outline whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {promoError}
                      </p>
                    )}
                    {discount > 0 && (
                      <p className="mt-2 text-sm text-green-600">
                        Promo code applied! ${discount.toFixed(2)} discount
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-display font-bold text-primary mb-6">
                    Order Summary
                  </h3>

                  {/* Summary Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Total</span>
                        <span>${(total - discount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={items.length === 0}
                    className="btn-primary w-full flex items-center justify-center text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-accent mr-3" />
                      <div>
                        <div className="font-medium text-primary">Secure Payment</div>
                        <div className="text-sm text-gray-600">256-bit SSL encryption</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Truck className="h-5 w-5 text-accent mr-3" />
                      <div>
                        <div className="font-medium text-primary">Free Shipping</div>
                        <div className="text-sm text-gray-600">On orders over $25</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-accent mr-3" />
                      <div>
                        <div className="font-medium text-primary">Easy Returns</div>
                        <div className="text-sm text-gray-600">30-day return policy</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Books */}
                {items.length > 0 && (
                  <div className="card p-6 mt-6">
                    <h4 className="font-semibold text-primary mb-4">
                      Frequently Bought Together
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img 
                          src="https://m.media-amazon.com/images/I/71JxA6I+msL._SL1500_.jpg" 
                          alt="Recommended"
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">The Psychology of Money</div>
                          <div className="text-xs text-gray-600">by Morgan Housel</div>
                        </div>
                        <button className="text-accent hover:text-accent-dark text-sm font-medium">
                          Add
                        </button>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img 
                          src="https://m.media-amazon.com/images/I/81T4J+nzu0L._SL1500_.jpg" 
                          alt="Recommended"
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Atomic Habits</div>
                          <div className="text-xs text-gray-600">by James Clear</div>
                        </div>
                        <button className="text-accent hover:text-accent-dark text-sm font-medium">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;