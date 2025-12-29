import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  Edit2, 
  Save,
  X,
  Upload,
  Globe,
  Bookmark,
  Star,
  Heart,
  Users,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BookCard from '../components/books/BookCard';
import userService from '../services/userService';
import { updateProfile } from '../store/slices/authSlice';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentBooks, setRecentBooks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    favoriteGenres: [],
    avatar: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
    'Science Fiction', 'Fantasy', 'Biography', 'History', 'Self-Help',
    'Business', 'Technology', 'Poetry', 'Drama', 'Horror', 'Young Adult'
  ];

  useEffect(() => {
    if (user) {
      fetchUserData();
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        favoriteGenres: user.favoriteGenres || [],
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsData = await userService.getUserStats();
      setStats(statsData.stats);

      // Fetch recent activity
      const reviewsData = await userService.getUserReviews({ limit: 4 });
      setRecentBooks(reviewsData.reviews.map(review => review.book));

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        favoriteGenres: user.favoriteGenres || [],
        avatar: user.avatar || '',
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenreToggle = (genre) => {
    setEditForm(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const resultAction = await dispatch(updateProfile(editForm));
      
      if (updateProfile.fulfilled.match(resultAction)) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        setSelectedFile(null);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-padding">
        <div className="container-custom">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-white">
                  {editForm.avatar ? (
                    <img 
                      src={editForm.avatar} 
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-accent to-accent-light flex items-center justify-center">
                      <User className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-accent p-2 rounded-full cursor-pointer hover:bg-accent-dark transition-colors">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="text-3xl font-display font-bold bg-transparent border-b border-white/50 focus:outline-none"
                        placeholder="Your name"
                      />
                    ) : (
                      <h1 className="text-3xl font-display font-bold">{user.name}</h1>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleEditToggle}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </>
                    )}
                  </button>
                </div>

                {/* Bio */}
                <div className="mt-4">
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 focus:outline-none focus:border-white/50"
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={500}
                    />
                  ) : (
                    <p className="text-white/90">
                      {user.bio || 'No bio yet. Tell us about your reading journey!'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats & Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Reading Stats */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-accent" />
                  Reading Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-accent mr-3" />
                      <span>Books Read</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {stats?.readingStats.booksRead || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-accent mr-3" />
                      <span>Pages Read</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {stats?.readingStats.totalPagesRead?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-accent mr-3" />
                      <span>Current Streak</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {stats?.readingStats.currentStreak || 0} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-accent mr-3" />
                      <span>Longest Streak</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {stats?.readingStats.longestStreak || 0} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Favorite Genres */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6 flex items-center">
                  <Heart className="h-6 w-6 mr-2 text-accent" />
                  Favorite Genres
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          editForm.favoriteGenres.includes(genre)
                            ? 'bg-accent/10 text-accent border border-accent'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span>{genre}</span>
                        {editForm.favoriteGenres.includes(genre) && (
                          <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.favoriteGenres?.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                    {(!user.favoriteGenres || user.favoriteGenres.length === 0) && (
                      <p className="text-gray-500">No favorite genres selected</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6 flex items-center">
                  <Users className="h-6 w-6 mr-2 text-accent" />
                  Community Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats?.followers || 0}
                    </div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats?.following || 0}
                    </div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats?.lists || 0}
                    </div>
                    <div className="text-sm text-gray-600">Lists</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats?.reviews || 0}
                    </div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Save Button for Editing */}
              {isEditing && (
                <div className="card p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">Profile Changes</h3>
                      <p className="text-gray-600 text-sm">Review and save your changes</p>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="btn-primary flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-primary flex items-center">
                    <Bookmark className="h-6 w-6 mr-2 text-accent" />
                    Recently Reviewed
                  </h3>
                  <button className="text-accent hover:text-accent-dark text-sm font-medium">
                    View All →
                  </button>
                </div>
                {recentBooks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recentBooks.map((book) => (
                      <BookCard
                        key={book._id}
                        book={book}
                        showAuthor
                        showRating
                        size="small"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Start reviewing books!</p>
                  </div>
                )}
              </div>

              {/* Reading Preferences */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6 flex items-center">
                  <Globe className="h-6 w-6 mr-2 text-accent" />
                  Reading Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">Daily Reading Goal</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-accent">
                        {user.readingPreferences?.dailyReadingGoal || 30}
                      </span>
                      <span className="text-gray-600">minutes/day</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">Preferred Format</h4>
                    <div className="text-2xl font-bold text-accent capitalize">
                      {user.readingPreferences?.preferredFormat || 'ebook'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wishlist Preview */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-primary flex items-center">
                    <Heart className="h-6 w-6 mr-2 text-accent" />
                    Wishlist ({stats?.wishlist || 0})
                  </h3>
                  <button className="text-accent hover:text-accent-dark text-sm font-medium">
                    View All →
                  </button>
                </div>
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Add books to your wishlist to see them here
                  </p>
                  <button className="btn-primary mt-4">
                    Browse Books
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;