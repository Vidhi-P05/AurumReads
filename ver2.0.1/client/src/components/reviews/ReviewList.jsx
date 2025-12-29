import { useState } from 'react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import reviewService from '../../services/reviewService';

const ReviewList = ({ reviews, bookId }) => {
  const { user } = useSelector((state) => state.auth);
  const [expandedReview, setExpandedReview] = useState(null);
  const [localReviews, setLocalReviews] = useState(reviews);

  const handleVote = async (reviewId, type) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    try {
      if (type === 'helpful') {
        await reviewService.voteHelpful(reviewId);
      } else {
        await reviewService.voteUnhelpful(reviewId);
      }

      // Update local state
      setLocalReviews(prev => prev.map(review => {
        if (review._id === reviewId) {
          return {
            ...review,
            helpfulVotes: type === 'helpful' ? review.helpfulVotes + 1 : review.helpfulVotes,
            unhelpfulVotes: type === 'unhelpful' ? review.unhelpfulVotes + 1 : review.unhelpfulVotes
          };
        }
        return review;
      }));

      toast.success(type === 'helpful' ? 'Marked as helpful' : 'Marked as unhelpful');
    } catch (error) {
      toast.error('Failed to submit vote');
    }
  };

  const toggleReview = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  return (
    <div className="space-y-6">
      {localReviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600">
            Be the first to share your thoughts about this book
          </p>
        </div>
      ) : (
        localReviews.map((review) => (
          <div key={review._id} className="card p-6">
            {/* Review Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={review.user.avatar} 
                  alt={review.user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-primary">
                    {review.user.name}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="flex items-center mr-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'text-gold-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                    {review.isEdited && (
                      <span className="ml-2 text-gray-500">(Edited)</span>
                    )}
                  </div>
                </div>
              </div>

              {review.isVerifiedPurchase && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified Purchase
                </div>
              )}
            </div>

            {/* Review Title */}
            {review.title && (
              <h5 className="font-semibold text-lg text-primary mb-2">
                {review.title}
              </h5>
            )}

            {/* Review Content */}
            <div className="mb-4">
              <div 
                className={`prose text-gray-700 ${!expandedReview && review.comment.length > 300 ? 'max-h-24 overflow-hidden' : ''}`}
              >
                {review.comment}
              </div>
              {review.comment.length > 300 && (
                <button
                  onClick={() => toggleReview(review._id)}
                  className="text-accent hover:text-accent-dark text-sm font-medium mt-2 flex items-center"
                >
                  {expandedReview === review._id ? (
                    <>
                      Show Less
                      <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Read More
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Review Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleVote(review._id, 'helpful')}
                  className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpfulVotes || 0})
                </button>
                <button
                  onClick={() => handleVote(review._id, 'unhelpful')}
                  className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Unhelpful ({review.unhelpfulVotes || 0})
                </button>
              </div>

              {/* Replies Count */}
              {review.replies?.length > 0 && (
                <div className="text-sm text-gray-600">
                  {review.replies.length} repl{review.replies.length === 1 ? 'y' : 'ies'}
                </div>
              )}
            </div>

            {/* Replies */}
            {review.replies?.length > 0 && (
              <div className="mt-4 pl-6 border-l-2 border-gray-200">
                {review.replies.slice(0, expandedReview === review._id ? undefined : 2).map((reply) => (
                  <div key={reply._id} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <img 
                        src={reply.user.avatar} 
                        alt={reply.user.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="font-medium text-sm">{reply.user.name}</span>
                      <span className="text-gray-500 text-xs">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm pl-8">{reply.comment}</p>
                  </div>
                ))}
                {review.replies.length > 2 && expandedReview !== review._id && (
                  <button
                    onClick={() => toggleReview(review._id)}
                    className="text-accent hover:text-accent-dark text-sm font-medium"
                  >
                    Show all {review.replies.length} replies
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewList;