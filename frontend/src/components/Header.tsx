import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Home } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-gray-900 hover:text-gray-700">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold">AI Meeting Digest</span>
            </Link>
          </div>
          <nav className="flex space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              to="/history"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              History
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 