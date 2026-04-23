import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Map, User, Ticket, CreditCard, MessageSquare, LogOut, CalendarClock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-blue-600">ParkEasy</h1>
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/') && !isActive('/profile') && !isActive('/tickets') && !isActive('/payment') && !isActive('/messages')
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </Link>
              <Link
                to="/tickets"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/tickets')
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden sm:inline">Tickets</span>
              </Link>
              <Link
                to="/messages"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/messages')
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </Link>
              <Link
                to="/reservations"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/reservations')
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                <span className="hidden sm:inline">Reservations</span>
              </Link>
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/profile')
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}