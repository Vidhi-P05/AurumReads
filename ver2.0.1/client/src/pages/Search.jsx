import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  Grid, 
  List, 
  ChevronDown,
  Check,
  Sliders,
  Star
} from 'lucide-react';
import { debounce } from 'lodash';
import BookCard from '../components/books/BookCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import bookService from '../services/bookService';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
    'Science Fiction', 'Fantasy', 'Biography', 'History', 'Self-Help',
    'Business', 'Technology', 'Poetry', 'Drama', 'Horror', 'Young Adult'
  ];

  const formats = [
    { value: 'ebook', label: 'E-book' },
    { value: 'audiobook', label: 'Audiobook' },
    { value: 'hardcover', label: 'Hardcover' },
    { value: 'paperback', label: 'Paperback' }
  ];

  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'createdAt', label: 'Oldest' },
    { value: '-ratings.average', label: 'Highest Rated' },
    { value: '-ratings.count', label: 'Most Reviews' },
    { value: 'title', label: 'Title A-Z' },
    { value: '-title', label: 'Title Z-A' },
    { value: 'formats.price', label: 'Price: Low to High' },
    { value: '-formats.price', label: 'Price: High to Low' }
  ];

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: viewMode === 'grid' ? 20 : 10,
        sort: sortBy,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedGenres.length > 0 && { genre: selectedGenres.join(',') }),
        ...(selectedFormat && { format: selectedFormat }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(minRating && { rating: minRating })
      };

      const response = await bookService.searchBooks(searchQuery, params);
      setBooks(response.books || []);
      setTotal(response.total || 0);
      
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [page, viewMode, sortBy, searchQuery, selectedGenres, selectedFormat, minPrice, maxPrice, minRating]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchParams({ q: query });
      setPage(1);
      fetchBooks();
    }, 500),
    []
  );

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setSelectedFormat('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSortBy('-createdAt');
    setSearchParams({});
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Genres */}
      <div>
        <h4 className="font-semibold text-primary mb-3">Genres</h4>
        <div className="space-y-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreToggle(genre)}
              className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedGenres.includes(genre)
                  ? 'bg-accent/10 text-accent border border-accent'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span>{genre}</span>
              {selectedGenres.includes(genre) && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div>
        <h4 className="font-semibold text-primary mb-3">Format</h4>
        <div className="space-y-2">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => {
                setSelectedFormat(format.value === selectedFormat ? '' : format.value);
                setPage(1);
              }}
              className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedFormat === format.value
                  ? 'bg-accent/10 text-accent border border-accent'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span>{format.label}</span>
              {selectedFormat === format.value && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-primary mb-3">Price Range</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
            className="input-primary text-sm"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
            className="input-primary text-sm"
            min="0"
          />
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h4 className="font-semibold text-primary mb-3">Minimum Rating</h4>
        <div className="flex gap-1">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => {
                setMinRating(minRating === rating.toString() ? '' : rating.toString());
                setPage(1);
              }}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                minRating === rating.toString()
                  ? 'bg-accent/10 text-accent border border-accent'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Star className="h-4 w-4 mr-1" />
              <span>{rating}+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedGenres.length > 0 || selectedFormat || minPrice || maxPrice || minRating) && (
        <button
          onClick={handleClearFilters}
          className="w-full btn-outline text-sm py-2"
        >
          <X className="h-4 w-4 mr-2 inline" />
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-padding">
        <div className="container-custom">
          {/* Search Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-primary">
                  {searchQuery ? `Search: "${searchQuery}"` : 'Browse Books'}
                </h1>
                <p className="text-gray-600">
                  {total.toLocaleString()} books found
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>

                {/* Filter Toggle (Mobile) */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden btn-secondary p-2"
                >
                  <Sliders className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or description..."
                className="input-primary pl-12 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar (Desktop) */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-primary">Filters</h3>
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                {renderFilters()}
              </div>
            </div>

            {/* Mobile Filters Overlay */}
            {showFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div 
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowFilters(false)}
                />
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-primary">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  {renderFilters()}
                </div>
              </div>
            )}

            {/* Books Grid/List */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No books found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="btn-primary"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {books.map((book) => (
                    <BookCard 
                      key={book._id} 
                      book={book} 
                      showAuthor 
                      showRating
                      showPrice
                      size="small"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {books.map((book) => (
                    <div key={book._id} className="card p-4">
                      <div className="flex gap-4">
                        <img 
                          src={book.coverImage} 
                          alt={book.title}
                          className="w-24 h-36 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-serif font-bold text-primary mb-1">
                            {book.title}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            by {book.author?.name}
                          </p>
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                            {book.shortDescription || book.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-gold-500 fill-current mr-1" />
                              <span className="font-medium">
                                {book.ratings.average.toFixed(1)}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({book.ratings.count.toLocaleString()})
                              </span>
                            </div>
                            <div className="text-lg font-bold text-primary">
                              ${Math.min(...book.formats.map(f => f.discountPrice || f.price)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {books.length > 0 && (
                <div className="flex justify-center mt-12">
                  <nav className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg border ${
                            page === pageNum
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * 20 >= total}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;