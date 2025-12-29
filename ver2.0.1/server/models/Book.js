import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a book title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [300, 'Subtitle cannot be more than 300 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: true
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author'
  }],
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot be more than 500 characters']
  },
  coverImage: {
    type: String,
    required: [true, 'Please add a cover image URL'],
    default: 'default-book-cover.jpg'
  },
  samplePages: [{
    pageNumber: Number,
    content: String,
    imageUrl: String
  }],
  genres: [{
    type: String,
    required: true,
    enum: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
      'Science', 'Fantasy', 'Biography', 'History', 'Self-Help',
      'Business', 'Technology', 'Poetry', 'Drama', 'Horror', 'Young Adult',
      'Children', 'Cookbook', 'Travel', 'Health', 'Psychology'
    ]
  }],
  language: {
    type: String,
    required: true,
    default: 'English'
  },
  publishedDate: {
    type: Date,
    required: true
  },
  publisher: String,
  pageCount: {
    type: Number,
    min: 1,
    required: true
  },
  formats: [{
    type: {
      type: String,
      enum: ['ebook', 'audiobook', 'hardcover', 'paperback'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: val => Math.round(val * 10) / 10
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  newRelease: {
    type: Boolean,
    default: false
  },
  metadata: {
    wordCount: Number,
    readingTime: Number, // in minutes
    ageGroup: {
      type: String,
      enum: ['Children', 'Young Adult', 'Adult', 'All Ages']
    },
    topics: [String]
  },
  aiSummary: {
    summary: String,
    keyTakeaways: [String],
    generatedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
bookSchema.index({ title: 'text', description: 'text' });
bookSchema.index({ genres: 1, ratings: -1 });
bookSchema.index({ 'formats.price': 1 });
bookSchema.index({ publishedDate: -1 });

// Virtual for reviews
bookSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'book',
  justOne: false
});

// Virtual for reading lists containing this book
bookSchema.virtual('inReadingLists', {
  ref: 'ReadingList',
  localField: '_id',
  foreignField: 'books.book',
  justOne: false
});

// Method to update average rating
bookSchema.methods.updateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ book: this._id });
  
  if (reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = total / reviews.length;
  this.ratings.count = reviews.length;
  
  // Update distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  
  this.ratings.distribution = distribution;
  
  await this.save();
};

const Book = mongoose.model('Book', bookSchema);

export default Book;