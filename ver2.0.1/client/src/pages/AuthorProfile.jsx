import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  BookOpen,
  Users,
  Calendar,
  Globe,
  Award,
  Twitter,
  Instagram,
  Facebook,
  ExternalLink,
  ChevronRight,
  Star,
  Heart,
  Bell
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BookCard from '../components/books/BookCard';
import authorService from '../../services/authorService';

const AuthorProfile = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [similarAuthors, setSimilarAuthors] = useState([]);
  const [activeTab, setActiveTab] = useState('books');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchAuthorData();
  }, [id]);

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      
      // Fetch author details
      const authorData = await authorService.getAuthorById(id);
      setAuthor(authorData.author);
      setBooks(authorData.author.books || []);
      setSimilarAuthors(authorData.author.similarAuthors || []);
      setIsFollowing(authorData.author.isFollowing || false);

    } catch (error) {
      console.error('Error fetching author data:', error);
      toast.error('Failed to load author profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Please login to follow authors');
      return;
    }

    try {
      if (isFollowing) {
        await authorService.unfollowAuthor(id);
        toast.success('Unfollowed author');
        setIsFollowing(false);
        setAuthor(prev => ({
          ...prev,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await authorService.followAuthor(id);
        toast.success('Now following author');
        setIsFollowing(true);
        setAuthor(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }));
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const getAge = (birthDate, deathDate) => {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="section-padding text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Author not found</h2>
        <Link to="/authors" className="btn-primary">
          Browse Authors
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Author Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Author Photo */}
              <div className="relative">
                <div className="h-48 w-48 rounded-full border-4 border-white overflow-hidden bg-white">
                  <img 
                    src={author.photo} 
                    alt={author.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {author.isVerified && (
                  <div className="absolute bottom-4 right-4 bg-accent text-white p-2 rounded-full">
                    <Award className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Author Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-display font-bold mb-2">
                      {author.name}
                    </h1>
                    {author.shortBio && (
                      <p className="text-xl text-navy-100 mb-4">
                        {author.shortBio}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 mb-6">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        <span>{books.length} Books</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        <span>{author.followersCount.toLocaleString()} Followers</span>
                      </div>
                      {author.nationality && (
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 mr-2" />
                          <span>{author.nationality}</span>
                        </div>
                      )}
                      {author.dateOfBirth && (
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          <span>
                            {getAge(author.dateOfBirth, author.dateOfDeath) || 'Unknown'} years
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleFollowToggle}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isFollowing
                          ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                          : 'bg-accent hover:bg-accent-dark'
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 fill-current" />
                          Following
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-2" />
                          Follow Author
                        </span>
                      )}
                    </button>
                    {user && (
                      <button className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm font-medium flex items-center justify-center">
                        <Bell className="h-4 w-4 mr-2" />
                        Get Updates
                      </button>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {author.socialMedia && (
                  <div className="flex gap-4 mt-6">
                    {author.socialMedia.twitter && (
                      <a
                        href={author.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {author.socialMedia.instagram && (
                      <a
                        href={author.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {author.socialMedia.facebook && (
                      <a
                        href={author.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {author.website && (
                      <a
                        href={author.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Author Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Biography */}
                <div className="card p-6">
                  <h3 className="text-xl font-display font-bold text-primary mb-4">
                    Biography
                  </h3>
                  <div className="prose text-gray-700">
                    {author.bio || 'No biography available.'}
                  </div>
                </div>

                {/* Author Details */}
                <div className="card p-6">
                  <h3 className="text-xl font-display font-bold text-primary mb-4">
                    Details
                  </h3>
                  <dl className="space-y-3">
                    {author.dateOfBirth && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Born</dt>
                        <dd className="font-medium">
                          {format(new Date(author.dateOfBirth), 'MMMM d, yyyy')}
                          {author.dateOfDeath && (
                            <span className="text-gray-500 ml-1">
                              (Died {format(new Date(author.dateOfDeath), 'MMMM d, yyyy')})
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                    {author.nationality && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Nationality</dt>
                        <dd className="font-medium">{author.nationality}</dd>
                      </div>
                    )}
                    {author.genres?.length > 0 && (
                      <div>
                        <dt className="text-gray-600 mb-2">Genres</dt>
                        <dd>
                          <div className="flex flex-wrap gap-2">
                            {author.genres.map((genre) => (
                              <span
                                key={genre}
                                className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Awards */}
                {author.awards?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-xl font-display font-bold text-primary mb-4 flex items-center">
                      <Award className="h-5 w-5 text-accent mr-2" />
                      Awards
                    </h3>
                    <div className="space-y-3">
                      {author.awards.map((award, index) => (
                        <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                          <div className="font-medium">{award.name}</div>
                          <div className="text-sm text-gray-600">
                            {award.year} • {award.book}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Releases */}
                {author.upcomingReleases?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-xl font-display font-bold text-primary mb-4">
                      Upcoming Releases
                    </h3>
                    <div className="space-y-4">
                      {author.upcomingReleases.map((release, index) => (
                        <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                          <div className="font-medium">{release.title}</div>
                          <div className="text-sm text-gray-600">
                            Expected {format(new Date(release.expectedDate), 'MMM yyyy')}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {release.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Books & Similar Authors */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-8">
                  {['books', 'similar'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 font-medium text-lg border-b-2 transition-colors capitalize ${
                        activeTab === tab
                          ? 'border-accent text-accent'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'books' ? `Books (${books.length})` : 'Similar Authors'}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Books Tab */}
              {activeTab === 'books' && (
                <div>
                  {books.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No books found
                      </h3>
                      <p className="text-gray-600">
                        This author hasn't published any books yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Sort Options */}
                      <div className="flex justify-end mb-6">
                        <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent">
                          <option value="newest">Newest First</option>
                          <option value="popular">Most Popular</option>
                          <option value="title">Title A-Z</option>
                          <option value="rating">Highest Rated</option>
                        </select>
                      </div>

                      {/* Books Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {books.map((book) => (
                          <BookCard
                            key={book._id}
                            book={book}
                            showAuthor={false}
                            showRating
                            showPrice
                            size="small"
                          />
                        ))}
                      </div>

                      {/* View All Button */}
                      {books.length > 12 && (
                        <div className="text-center mt-8">
                          <button className="btn-outline">
                            View All {books.length} Books
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Similar Authors Tab */}
              {activeTab === 'similar' && (
                <div>
                  {similarAuthors.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No similar authors found.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {similarAuthors.map((similarAuthor) => (
                        <Link
                          key={similarAuthor._id}
                          to={`/author/${similarAuthor._id}`}
                          className="card p-6 hover:shadow-book-hover transition-all duration-300 group"
                        >
                          <div className="flex flex-col items-center text-center">
                            <img
                              src={similarAuthor.photo}
                              alt={similarAuthor.name}
                              className="h-24 w-24 rounded-full object-cover mb-4"
                            />
                            <h4 className="font-serif font-bold text-primary group-hover:text-accent transition-colors mb-2">
                              {similarAuthor.name}
                            </h4>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {similarAuthor.bio?.slice(0, 100)}...
                            </p>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <Users className="h-4 w-4 mr-1" />
                              {similarAuthor.followersCount?.toLocaleString() || 0} followers
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {similarAuthor.genres?.slice(0, 2).map((genre) => (
                                <span
                                  key={genre}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center text-accent text-sm font-medium">
                              View Profile
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Browse More */}
                  <div className="mt-8 text-center">
                    <Link to="/authors" className="btn-outline">
                      Browse All Authors
                    </Link>
                  </div>
                </div>
              )}

              {/* Author's Stats */}
              <div className="mt-12 card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6">
                  Author Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {books.length}
                    </div>
                    <div className="text-sm text-gray-600">Books Published</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {author.followersCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {author.genres?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Primary Genres</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {author.awards?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Awards Won</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorProfile;