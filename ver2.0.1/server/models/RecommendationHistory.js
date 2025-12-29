import mongoose from 'mongoose';

const recommendationHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendationType: {
    type: String,
    required: true,
    enum: [
      'personalized',
      'collaborative',
      'content_based',
      'trending',
      'similar_books',
      'ai_quiz'
    ]
  },
  books: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    reason: String,
    shownAt: {
      type: Date,
      default: Date.now
    },
    clicked: {
      type: Boolean,
      default: false
    },
    purchased: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  sourceData: {
    // Data used to generate recommendations
    viewedBooks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }],
    purchasedBooks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }],
    ratedBooks: [{
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
      },
      rating: Number
    }],
    favoriteGenres: [String],
    quizAnswers: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
recommendationHistorySchema.index({ user: 1, createdAt: -1 });
recommendationHistorySchema.index({ user: 1, recommendationType: 1 });
recommendationHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to update interaction
recommendationHistorySchema.methods.updateInteraction = async function(bookId, interaction) {
  const bookEntry = this.books.find(b => b.book.toString() === bookId.toString());
  
  if (bookEntry) {
    if (interaction === 'click') {
      bookEntry.clicked = true;
    } else if (interaction === 'purchase') {
      bookEntry.purchased = true;
    } else if (interaction === 'rating' && interaction.rating) {
      bookEntry.rating = interaction.rating;
    }
    
    await this.save();
  }
};

const RecommendationHistory = mongoose.model('RecommendationHistory', recommendationHistorySchema);

export default RecommendationHistory;