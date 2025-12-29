import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Grid,
  List,
  Users,
  Heart,
  BookOpen,
  Filter,
  Search,
  TrendingUp,
  Globe,
  Lock,
  Edit2,
  Trash2,
  Share2,
  ChevronRight
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import readingListService from '../../services/readingListService';

const ReadingLists = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [trendingLists, setTrendingLists] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newList, setNewList] = useState({
    title: '',
    description: '',
    isPublic: true,
    tags: [],
  });

  const filters = [
    { value: 'all', label: 'All Lists' },
    { value: 'public', label: 'Public Only' },
    { value: 'private', label: 'Private Only' },
    { value: 'followed', label: 'Followed Lists' },
    { value: 'my', label: 'My Lists' },
  ];

  const tags = [
    'Fiction', 'Non-Fiction', 'Classics', 'Contemporary', 'Fantasy',
    'Mystery', 'Biography', 'Self-Help', 'Business', 'Technology'
  ];

  useEffect(() => {
    fetchLists();
    fetchTrendingLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const data = await readingListService.getPublicReadingLists({
        page: 1,
        limit: 12
      });
      setLists(data.readingLists || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast.error('Failed to load reading lists');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingLists = async () => {
    try {
      const data = await readingListService.getTrendingReadingLists(5);
      setTrendingLists(data.readingLists || []);
    } catch (error) {
      console.error('Error fetching trending lists:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newList.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const data = await readingListService.createReadingList(newList);
      setLists([data.readingList, ...lists]);
      setShowCreateModal(false);
      setNewList({
        title: '',
        description: '',
        isPublic: true,
        tags: [],
      });
      toast.success('Reading list created successfully!');
    } catch (error) {
      toast.error('Failed to create reading list');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this reading list? This cannot be undone.')) return;

    try {
      await readingListService.deleteReadingList(listId);
      setLists(lists.filter(list => list._id !== listId));
      toast.success('Reading list deleted');
    } catch (error) {
      toast.error('Failed to delete reading list');
    }
  };

  const handleToggleFollow = async (listId, currentlyFollowing) => {
    try {
      if (currentlyFollowing) {
        await readingListService.unfollowReadingList(listId);
        toast.success('Unfollowed list');
      } else {
        await readingListService.followReadingList(listId);
        toast.success('Followed list');
      }
      
      // Update local state
      setLists(lists.map(list => {
        if (list._id === listId) {
          return {
            ...list,
            isFollowing: !currentlyFollowing,
            followersCount: currentlyFollowing ? list.followersCount - 1 : list.followersCount + 1
          };
        }
        return list;
      }));
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const handleTagToggle = (tag) => {
    setNewList(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const filteredLists = lists.filter(list => {
    // Apply search
    if (searchQuery && !list.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !list.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Apply filters
    switch (filter) {
      case 'public':
        return list.isPublic;
      case 'private':
        return !list.isPublic;
      case 'followed':
        return list.isFollowing;
      case 'my':
        return list.user?._id === user?.id;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowCreateModal(false)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-accent/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Plus className="h-6 w-6 text-accent" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-display font-bold text-primary">
                      Create New Reading List
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="label">List Title *</label>
                        <input
                          type="text"
                          value={newList.title}
                          onChange={(e) => setNewList(prev => ({ ...prev, title: e.target.value }))}
                          className="input-primary"
                          placeholder="My Favorite Books"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="label">Description</label>
                        <textarea
                          value={newList.description}
                          onChange={(e) => setNewList(prev => ({ ...prev, description: e.target.value }))}
                          className="input-primary min-h-[100px]"
                          placeholder="What's this list about?"
                          maxLength={500}
                        />
                      </div>
                      <div>
                        <label className="label">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagToggle(tag)}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                newList.tags.includes(tag)
                                  ? 'bg-accent text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={newList.isPublic}
                          onChange={(e) => setNewList(prev => ({ ...prev, isPublic: e.target.checked }))}
                          className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                        />
                        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                          Make this list public (visible to other users)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateList}
                  className="btn-primary w-full sm:w-auto sm:ml-3"
                >
                  Create List
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline mt-3 sm:mt-0 w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section-padding">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-primary">
                  Reading Lists
                </h1>
                <p className="text-gray-600">
                  Discover and create collections of books
                </p>
              </div>
              
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create List
                </button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="card p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reading lists..."
                    className="input-primary pl-10"
                  />
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

                {/* Filter Dropdown */}
                <div className="relative">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {filters.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Trending Lists */}
          {trendingLists.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-display font-bold text-primary mb-6 flex items-center">
                <TrendingUp className="h-6 w-6 text-accent mr-3" />
                Trending Lists
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingLists.map((list) => (
                  <Link
                    key={list._id}
                    to={`/list/${list._id}`}
                    className="card p-6 hover:shadow-book-hover transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {list.coverImage ? (
                        <img
                          src={list.coverImage}
                          alt={list.title}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gradient-to-r from-accent to-accent-light rounded-lg flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-serif font-bold text-primary group-hover:text-accent transition-colors">
                            {list.title}
                          </h3>
                          {list.isPublic ? (
                            <Globe className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {list.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <img
                            src={list.user.avatar}
                            alt={list.user.name}
                            className="h-5 w-5 rounded-full mr-2"
                          />
                          <span>{list.user.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm">{list.books?.length || 0} books</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm">{list.followersCount} followers</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-accent transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Lists */}
          <div>
            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              {filter === 'my' ? 'My Lists' : 'All Reading Lists'} ({filteredLists.length})
            </h2>
            
            {filteredLists.length === 0 ? (
              <div className="card p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-display font-bold text-primary mb-4">
                  No reading lists found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery
                    ? 'No lists match your search. Try a different query.'
                    : filter === 'my'
                    ? 'You haven\'t created any reading lists yet.'
                    : 'Be the first to create a reading list!'}
                </p>
                {user && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    Create Your First List
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLists.map((list) => (
                  <div key={list._id} className="card p-6 hover:shadow-book-hover transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <Link 
                        to={`/list/${list._id}`}
                        className="group"
                      >
                        <h3 className="font-serif font-bold text-primary group-hover:text-accent transition-colors mb-1">
                          {list.title}
                        </h3>
                      </Link>
                      {list.user?._id === user?.id && (
                        <div className="flex gap-1">
                          <button className="p-1 text-gray-400 hover:text-accent">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteList(list._id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {list.description}
                    </p>
                    
                    {/* Cover Preview */}
                    {list.books?.length > 0 && (
                      <div className="flex -space-x-2 mb-4">
                        {list.books.slice(0, 4).map((bookItem, index) => (
                          <div key={index} className="w-10 h-16 rounded overflow-hidden shadow-sm border border-white">
                            <img 
                              src={bookItem.book?.coverImage} 
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {list.books.length > 4 && (
                          <div className="w-10 h-16 bg-primary text-white text-xs font-bold rounded flex items-center justify-center">
                            +{list.books.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {list.books?.length || 0}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {list.followersCount || 0}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Heart className="h-4 w-4 mr-1" />
                          {list.likesCount || 0}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {user && list.user?._id !== user.id && (
                          <button
                            onClick={() => handleToggleFollow(list._id, list.isFollowing)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              list.isFollowing
                                ? 'bg-accent/10 text-accent'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {list.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                        <button className="p-1 text-gray-400 hover:text-accent">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLists.map((list) => (
                  <div key={list._id} className="card p-6">
                    <div className="flex gap-4">
                      {/* Cover */}
                      {list.coverImage ? (
                        <img
                          src={list.coverImage}
                          alt={list.title}
                          className="w-20 h-32 object-cover rounded-lg"
                        />
                      ) : list.books?.length > 0 ? (
                        <div className="w-20 h-32 rounded-lg overflow-hidden">
                          <img 
                            src={list.books[0].book?.coverImage} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-32 bg-gradient-to-r from-accent to-accent-light rounded-lg flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <Link 
                            to={`/list/${list._id}`}
                            className="group"
                          >
                            <h3 className="text-xl font-serif font-bold text-primary group-hover:text-accent transition-colors">
                              {list.title}
                            </h3>
                          </Link>
                          <div className="flex gap-2">
                            {list.user?._id === user?.id && (
                              <>
                                <button className="p-1 text-gray-400 hover:text-accent">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteList(list._id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button className="p-1 text-gray-400 hover:text-accent">
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          {list.description}
                        </p>
                        
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center">
                            <img
                              src={list.user?.avatar}
                              alt={list.user?.name}
                              className="h-6 w-6 rounded-full mr-2"
                            />
                            <span className="text-sm text-gray-700">{list.user?.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe className="h-4 w-4 mr-1" />
                            {list.isPublic ? 'Public' : 'Private'}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {list.books?.length || 0} books
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            {list.followersCount || 0} followers
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {list.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {list.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        {list.books?.slice(0, 3).map((bookItem, index) => (
                          <Link
                            key={index}
                            to={`/book/${bookItem.book?._id}`}
                            className="w-12 h-18 rounded overflow-hidden shadow-sm"
                          >
                            <img 
                              src={bookItem.book?.coverImage} 
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </Link>
                        ))}
                      </div>
                      
                      {user && list.user?._id !== user.id && (
                        <button
                          onClick={() => handleToggleFollow(list._id, list.isFollowing)}
                          className={`btn-primary text-sm px-4 py-2 ${
                            list.isFollowing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''
                          }`}
                        >
                          {list.isFollowing ? 'Following' : 'Follow List'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingLists;