import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Lock,
  Shield,
  Truck,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Loader2,
  Building,
  Home,
  Mail,
  Phone,
  User,
  MapPin
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { clearCart } from '../../store/slices/cartSlice';
import cartService from '../../services/cartService';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { items, subtotal, tax, shipping, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
  });

  const [billingAddress, setBillingAddress] = useState({
    sameAsShipping: true,
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
  });

  const [payment, setPayment] = useState({
    method: 'credit_card',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false,
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [user, items, navigate]);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Shipping validation
      if (!shippingAddress.firstName.trim()) newErrors.shippingFirstName = 'First name is required';
      if (!shippingAddress.lastName.trim()) newErrors.shippingLastName = 'Last name is required';
      if (!shippingAddress.email.trim()) newErrors.shippingEmail = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(shippingAddress.email)) newErrors.shippingEmail = 'Email is invalid';
      if (!shippingAddress.street.trim()) newErrors.shippingStreet = 'Street address is required';
      if (!shippingAddress.city.trim()) newErrors.shippingCity = 'City is required';
      if (!shippingAddress.state.trim()) newErrors.shippingState = 'State is required';
      if (!shippingAddress.postalCode.trim()) newErrors.shippingPostalCode = 'Postal code is required';
    }

    if (step === 2 && !billingAddress.sameAsShipping) {
      // Billing validation
      if (!billingAddress.firstName.trim()) newErrors.billingFirstName = 'First name is required';
      if (!billingAddress.lastName.trim()) newErrors.billingLastName = 'Last name is required';
      if (!billingAddress.street.trim()) newErrors.billingStreet = 'Street address is required';
      if (!billingAddress.city.trim()) newErrors.billingCity = 'City is required';
      if (!billingAddress.state.trim()) newErrors.billingState = 'State is required';
      if (!billingAddress.postalCode.trim()) newErrors.billingPostalCode = 'Postal code is required';
    }

    if (step === 3) {
      // Payment validation
      if (!payment.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(payment.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Invalid card number';
      if (!payment.cardName.trim()) newErrors.cardName = 'Name on card is required';
      if (!payment.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
      else if (!/^\d{2}\/\d{2}$/.test(payment.expiryDate)) newErrors.expiryDate = 'Invalid format (MM/YY)';
      if (!payment.cvv.trim()) newErrors.cvv = 'CVV is required';
      else if (!/^\d{3,4}$/.test(payment.cvv)) newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      if (activeStep < 3) {
        setActiveStep(activeStep + 1);
      } else {
        handlePlaceOrder();
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      const orderData = {
        items: items.map(item => ({
          book: item.book._id,
          format: item.format,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress,
        billingAddress: billingAddress.sameAsShipping ? shippingAddress : billingAddress,
        paymentMethod: payment.method,
        subtotal,
        tax,
        shipping,
        total,
      };

      const result = await cartService.createOrder(orderData);
      
      setOrderId(result.order._id);
      setOrderComplete(true);
      dispatch(clearCart());
      
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiryDate = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-accent rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-display font-bold text-primary mb-4">
              Order Confirmed!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="font-medium text-gray-700 mb-2">Order ID</div>
              <div className="text-2xl font-bold text-primary font-mono">{orderId}</div>
            </div>
            
            <div className="space-y-3 text-left mb-8">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Total</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/profile/orders" className="btn-primary">
                View Orders
              </Link>
              <Link to="/" className="btn-outline">
                Continue Shopping
              </Link>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to <strong>{user.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-padding">
        <div className="container-custom max-w-6xl">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex flex-col items-center ${step <= activeStep ? 'text-accent' : 'text-gray-400'}`}>
                    <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center mb-2 ${
                      step <= activeStep 
                        ? 'border-accent bg-accent/10' 
                        : 'border-gray-300'
                    }`}>
                      {step < activeStep ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="font-bold">{step}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {step === 1 && 'Shipping'}
                      {step === 2 && 'Billing'}
                      {step === 3 && 'Payment'}
                    </span>
                  </div>
                  {step < 3 && (
                    <div className={`h-0.5 w-16 mx-4 ${step < activeStep ? 'bg-accent' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Checkout Form */}
            <div className="lg:col-span-2">
              <div className="card p-8">
                {/* Step 1: Shipping */}
                {activeStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-display font-bold text-primary mb-6 flex items-center">
                      <Truck className="h-6 w-6 text-accent mr-3" />
                      Shipping Address
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="label">First Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={shippingAddress.firstName}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                            className={`input-primary pl-10 ${errors.shippingFirstName ? 'input-error' : ''}`}
                            placeholder="John"
                          />
                        </div>
                        {errors.shippingFirstName && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingFirstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="label">Last Name *</label>
                        <input
                          type="text"
                          value={shippingAddress.lastName}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                          className={`input-primary ${errors.shippingLastName ? 'input-error' : ''}`}
                          placeholder="Doe"
                        />
                        {errors.shippingLastName && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingLastName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="label">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={shippingAddress.email}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                          className={`input-primary pl-10 ${errors.shippingEmail ? 'input-error' : ''}`}
                          placeholder="john@example.com"
                        />
                      </div>
                      {errors.shippingEmail && (
                        <p className="mt-1 text-sm text-red-600">{errors.shippingEmail}</p>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <label className="label">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="input-primary pl-10"
                          placeholder="(123) 456-7890"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="label">Street Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={shippingAddress.street}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                          className={`input-primary pl-10 ${errors.shippingStreet ? 'input-error' : ''}`}
                          placeholder="123 Main St"
                        />
                      </div>
                      {errors.shippingStreet && (
                        <p className="mt-1 text-sm text-red-600">{errors.shippingStreet}</p>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <label className="label">Apartment, Suite, etc. (Optional)</label>
                      <input
                        type="text"
                        value={shippingAddress.apartment}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, apartment: e.target.value }))}
                        className="input-primary"
                        placeholder="Apt 4B"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      <div>
                        <label className="label">City *</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                          className={`input-primary ${errors.shippingCity ? 'input-error' : ''}`}
                          placeholder="New York"
                        />
                        {errors.shippingCity && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingCity}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="label">State *</label>
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                          className={`input-primary ${errors.shippingState ? 'input-error' : ''}`}
                          placeholder="NY"
                        />
                        {errors.shippingState && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingState}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="label">Postal Code *</label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                          className={`input-primary ${errors.shippingPostalCode ? 'input-error' : ''}`}
                          placeholder="10001"
                        />
                        {errors.shippingPostalCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingPostalCode}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="label">Country *</label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="input-primary"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Billing */}
                {activeStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-display font-bold text-primary mb-6 flex items-center">
                      <Building className="h-6 w-6 text-accent mr-3" />
                      Billing Address
                    </h2>
                    
                    <div className="mb-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sameAsShipping"
                          checked={billingAddress.sameAsShipping}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, sameAsShipping: e.target.checked }))}
                          className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                        />
                        <label htmlFor="sameAsShipping" className="ml-2 block text-gray-700">
                          Same as shipping address
                        </label>
                      </div>
                    </div>
                    
                    {!billingAddress.sameAsShipping && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="label">First Name *</label>
                            <input
                              type="text"
                              value={billingAddress.firstName}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                              className={`input-primary ${errors.billingFirstName ? 'input-error' : ''}`}
                              placeholder="John"
                            />
                            {errors.billingFirstName && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingFirstName}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="label">Last Name *</label>
                            <input
                              type="text"
                              value={billingAddress.lastName}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                              className={`input-primary ${errors.billingLastName ? 'input-error' : ''}`}
                              placeholder="Doe"
                            />
                            {errors.billingLastName && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingLastName}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="label">Street Address *</label>
                          <input
                            type="text"
                            value={billingAddress.street}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                            className={`input-primary ${errors.billingStreet ? 'input-error' : ''}`}
                            placeholder="123 Main St"
                          />
                          {errors.billingStreet && (
                            <p className="mt-1 text-sm text-red-600">{errors.billingStreet}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                          <div>
                            <label className="label">City *</label>
                            <input
                              type="text"
                              value={billingAddress.city}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                              className={`input-primary ${errors.billingCity ? 'input-error' : ''}`}
                              placeholder="New York"
                            />
                            {errors.billingCity && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="label">State *</label>
                            <input
                              type="text"
                              value={billingAddress.state}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                              className={`input-primary ${errors.billingState ? 'input-error' : ''}`}
                              placeholder="NY"
                            />
                            {errors.billingState && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingState}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="label">Postal Code *</label>
                            <input
                              type="text"
                              value={billingAddress.postalCode}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                              className={`input-primary ${errors.billingPostalCode ? 'input-error' : ''}`}
                              placeholder="10001"
                            />
                            {errors.billingPostalCode && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingPostalCode}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="label">Country</label>
                          <select
                            value={billingAddress.country}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                            className="input-primary"
                          >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 3: Payment */}
                {activeStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-display font-bold text-primary mb-6 flex items-center">
                      <CreditCard className="h-6 w-6 text-accent mr-3" />
                      Payment Method
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Payment Method Selection */}
                      <div>
                        <label className="label">Select Payment Method</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            type="button"
                            onClick={() => setPayment(prev => ({ ...prev, method: 'credit_card' }))}
                            className={`p-4 rounded-lg border-2 text-center transition-all ${
                              payment.method === 'credit_card'
                                ? 'border-accent bg-accent/10'
                                : 'border-gray-200 hover:border-accent'
                            }`}
                          >
                            <CreditCard className="h-6 w-6 mx-auto mb-2" />
                            <div className="font-medium">Credit Card</div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPayment(prev => ({ ...prev, method: 'paypal' }))}
                            className={`p-4 rounded-lg border-2 text-center transition-all ${
                              payment.method === 'paypal'
                                ? 'border-accent bg-accent/10'
                                : 'border-gray-200 hover:border-accent'
                            }`}
                          >
                            <div className="h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="font-bold text-sm">P</span>
                            </div>
                            <div className="font-medium">PayPal</div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPayment(prev => ({ ...prev, method: 'apple_pay' }))}
                            className={`p-4 rounded-lg border-2 text-center transition-all ${
                              payment.method === 'apple_pay'
                                ? 'border-accent bg-accent/10'
                                : 'border-gray-200 hover:border-accent'
                            }`}
                          >
                            <div className="h-6 w-6 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="font-bold text-xs">􀣺</span>
                            </div>
                            <div className="font-medium">Apple Pay</div>
                          </button>
                        </div>
                      </div>
                      
                      {payment.method === 'credit_card' && (
                        <>
                          <div>
                            <label className="label">Card Number *</label>
                            <input
                              type="text"
                              value={payment.cardNumber}
                              onChange={(e) => setPayment(prev => ({ 
                                ...prev, 
                                cardNumber: formatCardNumber(e.target.value)
                              }))}
                              className={`input-primary ${errors.cardNumber ? 'input-error' : ''}`}
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                            />
                            {errors.cardNumber && (
                              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="label">Name on Card *</label>
                            <input
                              type="text"
                              value={payment.cardName}
                              onChange={(e) => setPayment(prev => ({ ...prev, cardName: e.target.value }))}
                              className={`input-primary ${errors.cardName ? 'input-error' : ''}`}
                              placeholder="John Doe"
                            />
                            {errors.cardName && (
                              <p className="mt-1 text-sm text-red-600">{errors.cardName}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="label">Expiry Date *</label>
                              <input
                                type="text"
                                value={payment.expiryDate}
                                onChange={(e) => setPayment(prev => ({ 
                                  ...prev, 
                                  expiryDate: formatExpiryDate(e.target.value)
                                }))}
                                className={`input-primary ${errors.expiryDate ? 'input-error' : ''}`}
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                              {errors.expiryDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="label">CVV *</label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={payment.cvv}
                                  onChange={(e) => setPayment(prev => ({ 
                                    ...prev, 
                                    cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                                  }))}
                                  className={`input-primary pr-10 ${errors.cvv ? 'input-error' : ''}`}
                                  placeholder="123"
                                  maxLength={4}
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                              {errors.cvv && (
                                <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="saveCard"
                              checked={payment.saveCard}
                              onChange={(e) => setPayment(prev => ({ ...prev, saveCard: e.target.checked }))}
                              className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                            />
                            <label htmlFor="saveCard" className="ml-2 block text-gray-700">
                              Save card for future purchases
                            </label>
                          </div>
                        </>
                      )}
                      
                      {payment.method === 'paypal' && (
                        <div className="text-center p-6 bg-blue-50 rounded-lg">
                          <div className="h-12 w-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="font-bold text-xl">P</span>
                          </div>
                          <p className="text-gray-700 mb-4">
                            You will be redirected to PayPal to complete your payment securely.
                          </p>
                          <button className="btn-primary bg-blue-500 hover:bg-blue-600 border-blue-500">
                            Continue with PayPal
                          </button>
                        </div>
                      )}
                      
                      {payment.method === 'apple_pay' && (
                        <div className="text-center p-6 bg-black rounded-lg text-white">
                          <div className="h-12 w-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="font-bold text-xl">􀣺</span>
                          </div>
                          <p className="mb-4">
                            Pay securely with Apple Pay using your Face ID or Touch ID.
                          </p>
                          <button className="btn-primary bg-white text-black hover:bg-gray-100 border-white">
                            Pay with Apple Pay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePrevStep}
                    disabled={activeStep === 1}
                    className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Back
                  </button>
                  
                  <button
                    onClick={handleNextStep}
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : activeStep === 3 ? (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Place Order
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Security Notice */}
              <div className="mt-6 flex items-start gap-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p>
                  Your payment information is encrypted and secure. We never store your full card details on our servers.
                </p>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {/* Order Summary */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-display font-bold text-primary mb-6">
                    Order Summary
                  </h3>
                  
                  {/* Items List */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={`${item.book._id}-${item.format}`} className="flex gap-3">
                        <img 
                          src={item.book.coverImage} 
                          alt={item.book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.book.title}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.format} • Qty: {item.quantity}
                          </div>
                          <div className="text-sm font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-6 border-t border-gray-200">
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
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Help & Support */}
                <div className="card p-6">
                  <h4 className="font-semibold text-primary mb-4">Need Help?</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 mr-2 text-accent" />
                      <span>30-day return policy</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="h-4 w-4 mr-2 text-accent" />
                      <span>SSL secure payment</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 mr-2 text-accent" />
                      <span>Free shipping over $25</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Link to="/contact" className="text-accent hover:text-accent-dark text-sm font-medium">
                      Contact Support →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;