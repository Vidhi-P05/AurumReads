import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    format: {
      type: String,
      enum: ['ebook', 'audiobook', 'hardcover', 'paperback'],
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  transactionId: String,
  notes: String
}, {
  timestamps: true
});

// Indexes
purchaseSchema.index({ user: 1, createdAt: -1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
purchaseSchema.index({ 'items.book': 1 });

// Calculate totals before save
purchaseSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * (1 - item.discount / 100));
    }, 0);
    
    this.total = this.subtotal + this.tax;
  }
  next();
});

// Post-save to update book sales and user stats
purchaseSchema.post('save', async function() {
  if (this.paymentStatus === 'completed') {
    const Book = mongoose.model('Book');
    const User = mongoose.model('User');
    
    // Update each book's sales count
    for (const item of this.items) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { 'salesCount': 1 }
      });
    }
    
    // Update user's purchase stats
    await User.findByIdAndUpdate(this.user, {
      $inc: { 'readingStats.booksPurchased': this.items.length }
    });
    }
});

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;