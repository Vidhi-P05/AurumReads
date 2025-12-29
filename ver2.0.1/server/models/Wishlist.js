import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot be more than 200 characters']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    priceAlert: {
      type: Boolean,
      default: false
    },
    originalPrice: Number,
    lowestPrice: Number
  }],
  notificationPreferences: {
    priceDrop: {
      type: Boolean,
      default: true
    },
    backInStock: {
      type: Boolean,
      default: true
    },
    newEdition: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.book': 1 });
wishlistSchema.index({ 'items.addedAt': -1 });

// Method to check for price drops
wishlistSchema.methods.checkPriceDrops = async function() {
  const Book = mongoose.model('Book');
  const notifications = [];
  
  for (const item of this.items) {
    if (item.priceAlert && item.originalPrice) {
      const book = await Book.findById(item.book);
      if (book) {
        const currentPrice = Math.min(
          ...book.formats.map(f => f.discountPrice || f.price)
        );
        
        if (currentPrice < item.lowestPrice) {
          item.lowestPrice = currentPrice;
          notifications.push({
            book: book._id,
            bookTitle: book.title,
            oldPrice: item.lowestPrice,
            newPrice: currentPrice,
            discount: Math.round(((item.lowestPrice - currentPrice) / item.lowestPrice) * 100)
          });
        }
      }
    }
  }
  
  if (notifications.length > 0) {
    await this.save();
  }
  
  return notifications;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;