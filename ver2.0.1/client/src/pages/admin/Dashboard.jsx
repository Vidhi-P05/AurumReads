import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Package,
  Clock,
  AlertCircle,
  Plus,
  Edit2,
  Eye,
  MoreVertical,
  Download,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    } else {
      window.location.href = '/';
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
      
      // Fetch recent orders
      const ordersData = await adminService.getRecentOrders();
      setRecentOrders(ordersData.orders || []);
      
      // Fetch popular books
      const booksData = await adminService.getPopularBooks();
      setPopularBooks(booksData.books || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-primary text-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
                <p className="text-navy-100">Manage your bookstore efficiently</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <Download className="h-4 w-4 mr-2 inline" />
                  Export Data
                </button>
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="font-bold">A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-custom">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+12.5%</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {formatCurrency(stats.revenue || 0)}
              </div>
              <div className="text-gray-600">Total Revenue</div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+8.2%</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stats.orders || 0}
              </div>
              <div className="text-gray-600">Total Orders</div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+5.7%</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stats.customers || 0}
              </div>
              <div className="text-gray-600">Total Customers</div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+3.4%</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stats.books || 0}
              </div>
              <div className="text-gray-600">Books in Catalog</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              {['overview', 'orders', 'books', 'users', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 font-medium text-lg border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-accent text-accent'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Orders */}
              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-display font-bold text-primary">
                      Recent Orders
                    </h3>
                    <Link 
                      to="/admin/orders"
                      className="text-accent hover:text-accent-dark text-sm font-medium flex items-center"
                    >
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Order ID</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="text-sm font-medium text-primary">
                              #{order._id.slice(-8).toUpperCase()}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-900">
                              {order.user?.name || 'Guest'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user?.email || ''}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-900">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.total)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button className="p-1 text-gray-400 hover:text-accent">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-accent">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-500">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {recentOrders.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No recent orders</p>
                  </div>
                )}
              </div>

              {/* Popular Books */}
              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-display font-bold text-primary">
                      Popular Books
                    </h3>
                    <Link 
                      to="/admin/books"
                      className="text-accent hover:text-accent-dark text-sm font-medium flex items-center"
                    >
                      Manage Books
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {popularBooks.map((book, index) => (
                      <div key={book._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400 w-6">
                            {index + 1}
                          </span>
                          <img 
                            src={book.coverImage} 
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              by {book.author?.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(book.sales * (book.price || 10))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {book.sales} sales
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/admin/books/new"
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Plus className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Add New Book</div>
                      <div className="text-sm text-gray-500">Add book to catalog</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/authors/new"
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Add Author</div>
                      <div className="text-sm text-gray-500">Add new author</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/analytics"
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">View Analytics</div>
                      <div className="text-sm text-gray-500">Sales & performance</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/admin/promo"
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Manage Promos</div>
                      <div className="text-sm text-gray-500">Discounts & coupons</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* System Alerts */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6 flex items-center">
                  <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                  System Alerts
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-yellow-800 mb-1">
                      5 Books Out of Stock
                    </div>
                    <div className="text-sm text-yellow-700">
                      Restock recommended
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-800 mb-1">
                      3 Pending Reviews
                    </div>
                    <div className="text-sm text-blue-700">
                      Need moderation
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800 mb-1">
                      System Updated
                    </div>
                    <div className="text-sm text-green-700">
                      All systems operational
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card p-6">
                <h3 className="text-xl font-display font-bold text-primary mb-6">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">New book added</div>
                      <div className="text-sm text-gray-500">"The Midnight Library" by Matt Haig</div>
                      <div className="text-xs text-gray-400">2 hours ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Order completed</div>
                      <div className="text-sm text-gray-500">Order #ORD-7842 for $42.99</div>
                      <div className="text-xs text-gray-400">4 hours ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">New user registered</div>
                      <div className="text-sm text-gray-500">Sarah Johnson joined</div>
                      <div className="text-xs text-gray-400">Yesterday</div>
                    </div>
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

export default AdminDashboard;