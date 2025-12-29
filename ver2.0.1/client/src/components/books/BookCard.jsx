import { Link } from 'react-router-dom';
import { Star, Heart, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import bookService from '../../services/bookService';
import wishlistService from '../../services/wishlistService';

const BookCard = ({ 
  book, 
  showAuthor = true, 
  showRating = true, 
  showPrice = false,
  score = null,
  badge = null,
  size = 'medium'
}) => {
  const { user } = useSelector((state) => state.auth);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(book._id);
        toast.success('Removed from wishlist');
        setIsInWishlist(false);
      } else {
        await wishlistService.addToWishlist(book._id);
        toast.success('Added to wishlist');
        setIsInWishlist(true);
      }
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const getMinPrice = () => {
    if (!book.formats || book.formats.length === 0) return null;
    return Math.min(...book.formats.map(f => f.discountPrice || f.price));
  };

  const sizes = {
    small: {
      cover: 'w-20 h-32',
      title: 'text-sm',
      author: 'text-xs',
      rating: 'text-xs'
    },
    medium: {
      cover: 'w-32 h-48',
      title: 'text-lg',
      author: 'text-sm',
      rating: 'text-sm'
    },
    large: {
      cover: 'w-40 h-60',
      title: 'text-xl',
      author: 'text-base',
      rating: 'text-base'
    }
  };

  const sizeClass = sizes[size];

  return (
    <Link 
      to={`/book/${book._id}`}
      className="group relative block"
    >
      <div className="card p-4 hover:shadow-book-hover transition-all duration-300">
        {/* Book Cover */}
        <div className="relative mb-4">
          <div className={`${sizeClass.cover} mx-auto book-cover overflow-hidden`}>
            <img 
              src={book.coverImage} 
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Badge */}
          {badge && (
            <div className="absolute top-2 left-2">
              <span className="badge-accent text-xs px-2 py-1">
                {badge}
              </span>
            </div>
          )}

          {/* Score Indicator */}
          {score !== null && (
            <div className="absolute top-2 right-2">
              <div className="bg-primary text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                {Math.round(score * 100)}%
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleWishlistToggle}
              className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart 
                className={`h-4 w-4 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-600'}`}
              />
            </button>
          </div>
        </div>

        {/* Book Info */}
        <div>
          <h3 className={`font-serif font-bold text-primary mb-1 ${sizeClass.title} line-clamp-2`}>
            {book.title}
          </h3>
          
          {showAuthor && book.author && (
            <p className={`text-gray-600 mb-2 ${sizeClass.author} truncate`}>
              {book.author.name}
            </p>
          )}

          {/* Rating */}
          {showRating && book.ratings && (
            <div className="flex items-center mb-2">
              <div className="star-rating">
                <Star className="h-4 w-4 text-gold-500 fill-current" />
                <span className={`ml-1 font-medium ${sizeClass.rating}`}>
                  {book.ratings.average?.toFixed(1) || '4.5'}
                </span>
              </div>
              <span className="text-gray-500 text-xs ml-1">
                ({book.ratings.count?.toLocaleString() || 0})
              </span>
            </div>
          )}

          {/* Price */}
          {showPrice && (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-primary">
                  ${getMinPrice()?.toFixed(2) || '--'}
                </span>
                {book.formats?.some(f => f.discountPrice) && (
                  <span className="text-sm text-gray-500 line-through ml-2">
                    ${book.formats.find(f => f.discountPrice)?.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Genres */}
          {book.genres && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.genres.slice(0, 2).map((genre) => (
                <span 
                  key={genre}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BookCard;