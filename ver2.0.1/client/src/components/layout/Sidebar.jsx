import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  BookOpen,
  Heart,
  List,
  User,
  Settings,
  BarChart3,
  Bell,
  LogOut,
  BookMarked
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'My Books', path: '/profile/books', icon: BookOpen },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'Reading Lists', path: '/profile/lists', icon: List },
    { name: 'Reviews', path: '/profile/reviews', icon: BookMarked },
    { name: 'Statistics', path: '/profile/stats', icon: BarChart3 },
    { name: 'Notifications', path: '/profile/notifications', icon: Bell },
    { name: 'Settings', path: '/profile/settings', icon: Settings },
  ];

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
  };

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
      <div className="p-6">
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-accent to-accent-light flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">My Profile</h3>
            <Link 
              to="/profile" 
              className="text-sm text-accent hover:text-accent-dark"
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent border-r-4 border-accent'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg mt-8 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;