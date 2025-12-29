import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  BookOpen, 
  ChevronLeft,
  Share2,
  Users,
  Clock,
  Globe,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  MessageCircle
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BookCard from '../components/books/BookCard';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewList from '../components/reviews/ReviewList';
import bookService from '../../services/bookService';
import wishlistService from '../../services/wishlistService';
import { addToCart } from '../../store/slices/cartSlice';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [book, setBook] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPages, setPreviewPages] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({});

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch book details
        const bookData = await bookService.getBookById(id);
        setBook(bookData.book);
        setSimilarBooks(bookData.similarBooks || []);
        setReviews(bookData.reviews || []);
        
        // Set default format
        if (bookData.book.formats?.length > 0) {
          setSelectedFormat(bookData.book.formats[0]);
        }

        // Check if in wishlist
        if (user) {
          try {
            const wishlist = await wishlistService.getWishlist();
            const isInList = wishlist.items?.some(item => 
              item.book?._id === id
            );
            setIsInWishlist(isInList);
          } catch (error) {
            console.error('Error checking wishlist:', error);
          }
        }

        // Get rating distribution
        if (bookData.book.ratings?.distribution) {
          setRatingDistribution(bookData.book.ratings.distribution);
        }

      } catch (error) {
        console.error('Error fetching book details:', error);
        toast.error('Failed to load book details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id, user, navigate]);

  const handleAddToCart = () => {
    if (!selectedFormat) {
      toast.error('Please select a format');
      return;
    }

    dispatch(addToCart({
      book: {
        _id: book._id,
        title: book.title,
        coverImage: book.coverImage,
        author: book.author
      },
      format: selectedFormat.type,
      price: selectedFormat.discountPrice || selectedFormat.price,
      quantity: 1
    }));

    toast.success('Added to cart');
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please login to manage wishlist');
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

  const handlePreviewClick = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    try {
      const previewData = await bookService.getBookPreview(book._id);
      setPreviewPages(previewData.preview.pages);
      setShowPreview(true);
    } catch (error) {
      toast.error('Preview not available for this book');
    }
  };

  const getRatingPercentage = (rating) => {
    const total = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return Math.round((ratingDistribution[rating] || 0) / total * 100);
  };

  const renderRatingBar = (rating) => {
    const percentage = getRatingPercentage(rating);
    return (
      <div className="flex items-center mb-1">
        <span className="w-8 text-sm">{rating}★</span>
        <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-12 text-sm text-gray-600">{percentage}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="section-padding text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Book not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Navigation */}
      <div className="bg-gray-50 py-4">
        <div className="container-custom">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-custom">
          {/* Book Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Book Cover */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="book-cover shadow-xl">
                  <img 
                    src={book.coverImage} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleAddToCart}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isInWishlist 
                        ? 'border-red-500 text-red-500 bg-red-50' 
                        : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="lg:col-span-2">
              {/* Title & Author */}
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <h2 className="text-2xl text-gray-600 mb-4">{book.subtitle}</h2>
                )}
                <div className="flex items-center mb-4">
                  <span className="text-lg text-gray-700">by</span>
                  <Link 
                    to={`/author/${book.author._id}`}
                    className="ml-2 text-lg font-medium text-accent hover:text-accent-dark transition-colors"
                  >
                    {book.author.name}
                  </Link>
                  {book.coAuthors?.length > 0 && (
                    <span className="text-gray-600 ml-2">
                      with {book.coAuthors.map(a => a.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Ratings */}
              <div className="flex items-center mb-6">
                <div className="flex items-center mr-4">
                  <div className="star-rating text-2xl">
                    <Star className="h-7 w-7 text-gold-500 fill-current mr-1" />
                    <span className="font-bold">{book.ratings.average.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600 ml-2">
                    ({book.ratings.count.toLocaleString()} ratings)
                  </span>
                </div>
                {book.bestseller && (
                  <span className="badge-accent">Bestseller</span>
                )}
                {book.newRelease && (
                  <span className="badge-primary ml-2">New Release</span>
                )}
              </div>

              {/* Rating Distribution */}
              <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-3">Rating Distribution</h3>
                {[5, 4, 3, 2, 1].map(rating => renderRatingBar(rating))}
              </div>

              {/* Format Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-primary mb-4">Available Formats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {book.formats.map((format) => (
                    <button
                      key={format.type}
                      onClick={() => setSelectedFormat(format)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedFormat?.type === format.type
                          ? 'border-accent bg-accent/10'
                          : 'border-gray-200 hover:border-accent'
                      }`}
                    >
                      <div className="font-medium capitalize mb-1">{format.type}</div>
                      <div className="text-lg font-bold text-primary">
                        ${(format.discountPrice || format.price).toFixed(2)}
                      </div>
                      {format.discountPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          ${format.price.toFixed(2)}
                        </div>
                      )}
                      {!format.isAvailable && (
                        <div className="text-sm text-red-500 mt-1">Out of Stock</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-accent mx-auto mb-2" />
                  <div className="font-medium">{book.pageCount}</div>
                  <div className="text-sm text-gray-600">Pages</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-6 w-6 text-accent mx-auto mb-2" />
                  <div className="font-medium">
                    {Math.ceil(book.pageCount / 300)} hours
                  </div>
                  <div className="text-sm text-gray-600">Reading Time</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Globe className="h-6 w-6 text-accent mx-auto mb-2" />
                  <div className="font-medium">{book.language}</div>
                  <div className="text-sm text-gray-600">Language</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="h-6 w-6 text-accent mx-auto mb-2" />
                  <div className="font-medium">
                    {book.ratings.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Readers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              {['details', 'preview', 'reviews', 'similar'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 font-medium text-lg border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-accent text-accent'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-12">
            {/* Description Tab */}
            {activeTab === 'details' && (
              <div>
                <div className="prose max-w-none">
                  <div 
                    className={`${!showFullDescription ? 'max-h-96 overflow-hidden' : ''}`}
                    dangerouslySetInnerHTML={{ 
                      __html: book.description.replace(/\n/g, '<br/>') 
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-4 text-accent hover:text-accent-dark font-medium flex items-center"
                >
                  {showFullDescription ? (
                    <>
                      Show Less
                      <ChevronUp className="ml-1 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Read More
                      <ChevronDown className="ml-1 h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Book Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-primary mb-4">Book Details</h4>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Publisher</dt>
                        <dd className="font-medium">{book.publisher || 'Not specified'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Published Date</dt>
                        <dd className="font-medium">
                          {new Date(book.publishedDate).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">ISBN</dt>
                        <dd className="font-medium">{book.isbn || 'Not specified'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-primary mb-4">Genres & Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {book.genres.map((genre) => (
                        <span 
                          key={genre}
                          className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div>
                <div className="text-center mb-8">
                  <BookOpen className="h-16 w-16 text-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-primary mb-2">Read a Sample</h3>
                  <p className="text-gray-600 mb-6">
                    Preview the first few pages before you buy
                  </p>
                  <button
                    onClick={handlePreviewClick}
                    className="btn-primary"
                  >
                    {showPreview ? 'Hide Preview' : 'Read Preview'}
                  </button>
                </div>

                {showPreview && previewPages.length > 0 && (
                  <div className="bg-gray-50 p-8 rounded-lg">
                    <div className="max-w-3xl mx-auto">
                      <h4 className="text-xl font-bold text-center mb-8">
                        Preview: {book.title}
                      </h4>
                      {previewPages.map((page, index) => (
                        <div key={index} className="mb-8 last:mb-0">
                          {page.imageUrl ? (
                            <img 
                              src={page.imageUrl} 
                              alt={`Page ${page.pageNumber}`}
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                          ) : (
                            <div className="prose max-w-none bg-white p-6 rounded-lg shadow-md">
                              <p className="whitespace-pre-line">{page.content}</p>
                            </div>
                          )}
                          <div className="text-center text-gray-500 text-sm mt-2">
                            Page {page.pageNumber}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Review Stats */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
                      <h4 className="font-semibold text-primary mb-4">Review Summary</h4>
                      <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-primary mb-2">
                          {book.ratings.average.toFixed(1)}
                        </div>
                        <div className="star-rating justify-center text-2xl mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`h-6 w-6 ${
                                i < Math.floor(book.ratings.average)
                                  ? 'text-gold-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-gray-600">
                          {book.ratings.count.toLocaleString()} reviews
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => renderRatingBar(rating))}
                      </div>

                      {user && (
                        <div className="mt-8">
                          <button
                            onClick={() => document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' })}
                            className="btn-primary w-full"
                          >
                            <MessageCircle className="h-5 w-5 mr-2 inline" />
                            Write a Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="lg:col-span-2">
                    {user && (
                      <div id="review-form" className="mb-8">
                        <ReviewForm 
                          bookId={book._id} 
                          onReviewAdded={(newReview) => {
                            setReviews([newReview, ...reviews]);
                          }}
                        />
                      </div>
                    )}

                    <ReviewList 
                      reviews={reviews}
                      bookId={book._id}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Similar Books Tab */}
            {activeTab === 'similar' && (
              <div>
                <h3 className="text-2xl font-bold text-primary mb-6">
                  Readers who liked this also liked...
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {similarBooks.map((book) => (
                    <BookCard 
                      key={book._id} 
                      book={book} 
                      showAuthor 
                      showRating
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Similar Books Section */}
          {similarBooks.length > 0 && activeTab !== 'similar' && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-primary mb-6">
                Similar Books
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {similarBooks.slice(0, 5).map((book) => (
                  <BookCard 
                    key={book._id} 
                    book={book} 
                    showAuthor 
                    showRating
                    size="small"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;