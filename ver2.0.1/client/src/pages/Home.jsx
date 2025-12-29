import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Star, 
  TrendingUp, 
  Clock, 
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useSelector } from 'react-redux';
import BookCard from '../components/books/BookCard';
import AuthorCard from '../components/authors/AuthorCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import bookService from '../services/bookService';
import authorService from '../services/authorService';
import recommendationService from '../services/recommendationService';

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch trending books
        const trendingData = await bookService.getTrendingBooks(8);
        setTrendingBooks(trendingData.books);

        // Fetch new releases
        const newReleasesData = await bookService.getNewReleases(8);
        setNewReleases(newReleasesData.books);

        // Fetch top authors
        const authorsData = await authorService.getTopAuthors(6);
        setTopAuthors(authorsData.authors);

        // Fetch featured books
        const featuredData = await bookService.getBooks({
          featured: true,
          limit: 4
        });
        setFeaturedBooks(featuredData.books);

        // Fetch personalized recommendations if user is logged in
        if (user) {
          const recs = await recommendationService.getPersonalizedRecommendations(10);
          setRecommendations(recs.recommendations);
        }

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-navy-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-navy text-white">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Discover Your Next
              <span className="block gradient-text">Favorite Book</span>
            </h1>
            <p className="text-xl text-navy-100 mb-8">
              AurumReads combines the best of Kindle and Goodreads. 
              Find personalized recommendations, track your reading, 
              and connect with fellow book lovers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/search" 
                className="btn-primary inline-flex items-center justify-center text-lg"
              >
                Explore Books
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/quiz" 
                className="btn-outline border-white text-white hover:bg-white hover:text-primary inline-flex items-center justify-center text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Take AI Quiz
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {user && recommendations.length > 0 && (
        <section className="section-padding">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold text-primary mb-2">
                  Recommended For You
                </h2>
                <p className="text-gray-600">
                  Personalized picks based on your reading history
                </p>
              </div>
              <Link 
                to="/recommendations" 
                className="text-accent hover:text-accent-dark font-medium flex items-center"
              >
                View all
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {recommendations.slice(0, 5).map((rec) => (
                <BookCard 
                  key={rec.book._id} 
                  book={rec.book} 
                  showAuthor 
                  showRating
                  score={rec.score}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Books */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-primary mb-2 flex items-center">
                <TrendingUp className="mr-3 h-8 w-8 text-accent" />
                Trending Now
              </h2>
              <p className="text-gray-600">
                What other readers are loving this week
              </p>
            </div>
            <Link 
              to="/search?sort=-ratings.average" 
              className="text-accent hover:text-accent-dark font-medium flex items-center"
            >
              View all
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {trendingBooks.map((book) => (
              <BookCard 
                key={book._id} 
                book={book} 
                showAuthor 
                showRating
                showPrice
              />
            ))}
          </div>
        </div>
      </section>

      {/* New Releases */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-primary mb-2 flex items-center">
                <Clock className="mr-3 h-8 w-8 text-accent" />
                New Releases
              </h2>
              <p className="text-gray-600">
                Fresh off the press - discover latest titles
              </p>
            </div>
            <Link 
              to="/search?newRelease=true" 
              className="text-accent hover:text-accent-dark font-medium flex items-center"
            >
              View all
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {newReleases.map((book) => (
              <BookCard 
                key={book._id} 
                book={book} 
                showAuthor 
                showRating
                badge="NEW"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Authors */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-primary mb-2">
                Featured Authors
              </h2>
              <p className="text-gray-600">
                Discover and follow your favorite writers
              </p>
            </div>
            <Link 
              to="/authors" 
              className="text-accent hover:text-accent-dark font-medium flex items-center"
            >
              View all
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {topAuthors.map((author) => (
              <AuthorCard 
                key={author._id} 
                author={author} 
                showFollowers
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-primary mb-2 flex items-center">
                <Star className="mr-3 h-8 w-8 text-accent" />
                Editor's Picks
              </h2>
              <p className="text-gray-600">
                Curated selections from our editorial team
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredBooks.map((book, index) => (
              <div 
                key={book._id} 
                className={`card p-6 flex gap-6 items-center ${index === 0 ? 'lg:col-span-2' : ''}`}
              >
                <div className="flex-shrink-0">
                  <img 
                    src={book.coverImage} 
                    alt={book.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-book"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-primary mb-1">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        by {book.author?.name}
                      </p>
                    </div>
                    {book.bestseller && (
                      <span className="badge-accent">Bestseller</span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {book.shortDescription || book.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-gold-500 fill-current mr-1" />
                      <span className="font-medium">
                        {book.ratings.average.toFixed(1)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({book.ratings.count.toLocaleString()})
                      </span>
                    </div>
                    <Link 
                      to={`/book/${book._id}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="container-custom text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-6 text-accent" />
          <h2 className="text-4xl font-display font-bold mb-4">
            Start Your Reading Journey
          </h2>
          <p className="text-xl text-navy-100 mb-8 max-w-2xl mx-auto">
            Join thousands of readers tracking their progress, 
            discovering new books, and sharing recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link 
                  to="/register" 
                  className="bg-accent hover:bg-accent-dark text-white font-medium px-8 py-3 rounded-lg text-lg transition-colors"
                >
                  Join Free
                </Link>
                <Link 
                  to="/login" 
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-medium px-8 py-3 rounded-lg text-lg transition-colors"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link 
                to="/profile" 
                className="bg-accent hover:bg-accent-dark text-white font-medium px-8 py-3 rounded-lg text-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;