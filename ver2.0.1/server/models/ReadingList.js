import mongoose from 'mongoose';

const readingListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a list title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  books: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot be more than 200 characters']
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: String,
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
readingListSchema.index({ user: 1, title: 1 });
readingListSchema.index({ isPublic: 1, followersCount: -1 });
readingListSchema.index({ tags: 1 });
readingListSchema.index({ 'books.book': 1 });

// Update followers and likes count
readingListSchema.pre('save', function(next) {
  this.followersCount = this.followers.length;
  this.likesCount = this.likes.length;
  next();
});

// Virtual for number of books
readingListSchema.virtual('bookCount').get(function() {
  return this.books.length;
});

const ReadingList = mongoose.model('ReadingList', readingListSchema);

export default ReadingList;