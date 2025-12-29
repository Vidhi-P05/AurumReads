import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  BookOpen,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import adminService from '../../services/adminService';

const BookManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [filters, setFilters] = useState({
    genre: '',
    status: '',
    featured: '',
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchBooks();
    } else {
      window.location.href = '/';
    }
  }, [user, page, filters]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBooks({
        page,
        limit: 20,
        search: searchQuery,
        ...filters,
      });
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await adminService.deleteBook(bookToDelete._id);
      toast.success('Book deleted successfully');
      setBooks(books.filter(b => b._id !== bookToDelete._id));
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  const handleToggleFeatured = async (book) => {
    try {
      const updatedBook = await adminService.updateBook(book._id, {
        featured: !book.featured,
      });
      
      setBooks(books.map(b => 
        b._id === book._id ? { ...b, featured: updatedBook.book.featured } : b
      ));
      
      toast.success(`Book ${updatedBook.book.featured ? 'added to' : 'removed from'} featured`);
    } catch (error) {
      toast.error('Failed to update book');
    }
  };

  const handleToggleSelection = (bookId) => {
    setSelectedBooks(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedBooks.length === 0) {
      toast.error('No books selected');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Delete ${selectedBooks.length} selected books?`)) {
            await Promise.all(selectedBooks.map(id => adminService.deleteBook(id)));
            toast.success('Selected books deleted');
            setBooks(books.filter(b => !selectedBooks.includes(b._id)));
            setSelectedBooks([]);
          }
          break;
        case 'featured':
          await Promise.all(selectedBooks.map(id => 
            adminService.updateBook(id, { featured: true })
          ));
          toast.success('Books marked as featured');
          setBooks(books.map(b => 
            selectedBooks.includes(b._id) ? { ...b, featured: true } : b
          ));
          setSelectedBooks([]);
          break;
      }
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
    'Science Fiction', 'Fantasy', 'Biography', 'History', 'Self-Help'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-display font-bold text-primary">
                      Delete Book
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-primary text-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold">Book Management</h1>
                <p className="text-navy-100">Manage your book catalog</p>
              </div>
              <Link
                to="/admin/books/new"
                className="btn-primary bg-accent hover:bg-accent-dark flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Book
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-custom">
          {/* Search & Filters */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books by title, author, or ISBN..."
                    className="input-primary pl-10"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent hover:text-accent-dark"
                  >
                    Search
                  </button>
                </form>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="btn-outline flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button className="btn-outline flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                  className="input-primary"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="input-primary"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              
              <div>
                <label className="label">Featured</label>
                <select
                  value={filters.featured}
                  onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
                  className="input-primary"
                >
                  <option value="">All</option>
                  <option value="true">Featured Only</option>
                  <option value="false">Not Featured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedBooks.length > 0 && (
            <div className="card p-4 mb-6 bg-accent/5 border border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent mr-3" />
                  <span className="font-medium">
                    {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('featured')}
                    className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    Mark as Featured
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedBooks([])}
                    className="px-4 py-2 text-gray-600 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Books Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-6 text-left">
                      <input
                        type="checkbox"
                        checked={selectedBooks.length === books.length && books.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBooks(books.map(b => b._id));
                          } else {
                            setSelectedBooks([]);
                          }
                        }}
                        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                      />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Book</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Author</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book._id)}
                          onChange={() => handleToggleSelection(book._id)}
                          className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={book.coverImage} 
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {book.genres?.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">
                          {book.author?.name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">
                          ${Math.min(...book.formats?.map(f => f.price) || [0]).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">
                          {book.stock || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-2">
                          {book.featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                              Featured
                            </span>
                          )}
                          {book.bestseller && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Bestseller
                            </span>
                          )}
                          {book.newRelease && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New Release
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/book/${book._id}`}
                            className="p-1 text-gray-400 hover:text-accent transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/books/edit/${book._id}`}
                            className="p-1 text-gray-400 hover:text-accent transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleFeatured(book)}
                            className={`p-1 transition-colors ${
                              book.featured
                                ? 'text-accent hover:text-accent-dark'
                                : 'text-gray-400 hover:text-accent'
                            }`}
                            title={book.featured ? 'Remove from featured' : 'Mark as featured'}
                          >
                            <BookOpen className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(book)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {books.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No books found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try a different search query' : 'Add your first book to get started'}
                </p>
                <Link
                  to="/admin/books/new"
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Book
                </Link>
              </div>
            )}

            {/* Pagination */}
            {books.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> books
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg border text-sm ${
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
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookManagement;