import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default-avatar.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  favoriteGenres: [{
    type: String,
    enum: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
      'Science Fiction', 'Fantasy', 'Biography', 'History', 'Self-Help',
      'Business', 'Technology', 'Poetry', 'Drama', 'Horror', 'Young Adult'
    ]
  }],
  readingPreferences: {
    preferredFormat: {
      type: String,
      enum: ['ebook', 'audiobook', 'both'],
      default: 'ebook'
    },
    dailyReadingGoal: {
      type: Number,
      min: 5,
      max: 300,
      default: 30
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'author'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  wishlist: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  following: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
  readingStats: {
    booksRead: {
      type: Number,
      default: 0
    },
    totalPagesRead: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verifyEmailToken: String,
  verifyEmailExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Cascade delete user's reading lists when user is deleted
userSchema.pre('remove', async function(next) {
  await this.model('ReadingList').deleteMany({ user: this._id });
  next();
});

// Virtual for reading lists
userSchema.virtual('readingLists', {
  ref: 'ReadingList',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Virtual for reviews
userSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

const User = mongoose.model('User', userSchema);

export default User;