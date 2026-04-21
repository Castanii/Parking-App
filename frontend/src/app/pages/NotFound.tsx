import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
