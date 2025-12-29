import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import bookService from '../../services/bookService';

const ReviewForm = ({ bookId, onReviewAdded }) => {
  const { user } = useSelector((state) => state.auth);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      setSubmitting(true);
      const reviewData = await bookService.rateBook(bookId, rating, comment, title);
      
      toast.success('Review submitted successfully!');
      
      // Reset form
      setTitle('');
      setComment('');
      
      // Callback with new review
      if (onReviewAdded) {
        onReviewAdded(reviewData.review);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-700 mb-4">
          Please login to write a review
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4 mb-6">
        <img 
          src={user.avatar} 
          alt={user.name}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <h4 className="font-semibold text-primary">Write a Review</h4>
          <p className="text-sm text-gray-600">Share your thoughts about this book</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Rating Stars */}
        <div className="mb-6">
          <label className="label">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-gold-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-lg font-medium">
              {rating}.0
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div className="mb-4">
          <label htmlFor="review-title" className="label">
            Review Title (Optional)
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review in a few words"
            className="input-primary"
            maxLength={200}
          />
        </div>

        {/* Review Comment */}
        <div className="mb-6">
          <label htmlFor="review-comment" className="label">
            Your Review *
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike about this book? What did the author do well?"
            className="input-primary min-h-[120px] resize-none"
            rows={4}
            required
            maxLength={2000}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {comment.length}/2000 characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="btn-primary flex items-center"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
            <Send className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;