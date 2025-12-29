import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add author name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot be more than 2000 characters']
  },
  shortBio: {
    type: String,
    maxlength: [500, 'Short bio cannot be more than 500 characters']
  },
  photo: {
    type: String,
    default: 'default-author.jpg'
  },
  dateOfBirth: Date,
  dateOfDeath: Date,
  nationality: String,
  website: String,
  socialMedia: {
    twitter: String,
    instagram: String,
    facebook: String,
    goodreads: String
  },
  genres: [{
    type: String,
    enum: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
      'Science', 'Fantasy', 'Biography', 'History', 'Self-Help',
      'Business', 'Technology', 'Poetry', 'Drama', 'Horror', 'Young Adult'
    ]
  }],
  awards: [{
    name: String,
    year: Number,
    book: String
  }],
  upcomingReleases: [{
    title: String,
    expectedDate: Date,
    description: String
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
authorSchema.index({ name: 'text', bio: 'text' });
authorSchema.index({ followersCount: -1 });
authorSchema.index({ genres: 1 });

// Virtual for books
authorSchema.virtual('books', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'author',
  justOne: false
});

// Update followers count
authorSchema.methods.updateFollowersCount = async function() {
  const User = mongoose.model('User');
  const count = await User.countDocuments({ 'following.author': this._id });
  this.followersCount = count;
  await this.save();
};

const Author = mongoose.model('Author', authorSchema);

export default Author;