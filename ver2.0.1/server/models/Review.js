import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Review title cannot be more than 200 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please add a review comment'],
    maxlength: [2000, 'Review cannot be more than 2000 characters']
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: {
      type: String,
      required: true,
      maxlength: [1000, 'Reply cannot be more than 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

// Index for sorting
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });

// Pre-save to mark as verified purchase if user has purchased the book
reviewSchema.pre('save', async function(next) {
  if (!this.isVerifiedPurchase) {
    const Purchase = mongoose.model('Purchase');
    const purchase = await Purchase.findOne({
      user: this.user,
      'items.book': this.book,
      status: 'completed'
    });
    
    if (purchase) {
      this.isVerifiedPurchase = true;
    }
  }
  next();
});

// Post-save to update book's average rating
reviewSchema.post('save', async function() {
  const Book = mongoose.model('Book');
  const book = await Book.findById(this.book);
  
  if (book) {
    await book.updateAverageRating();
  }
});

// Post-remove to update book's average rating
reviewSchema.post('remove', async function() {
  const Book = mongoose.model('Book');
  const book = await Book.findById(this.book);
  
  if (book) {
    await book.updateAverageRating();
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;