import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../asset/logo.png';

function Header() {
  return (
    <header className="bg-primary-600 sticky top-0 z-50 shadow-sm">
      <div className="w-full px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="logo" className="h-12 w-auto" />
          <span className="font-bold text-white text-lg">Job Portal</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/jobs" className="text-sm text-primary-100 hover:text-white transition-colors">Jobs</Link>
          <Link to="/login" className="text-sm font-medium bg-white text-primary-600 hover:bg-primary-50 px-4 py-1.5 rounded-lg transition-colors">Login</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;