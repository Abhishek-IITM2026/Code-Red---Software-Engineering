import React from 'react';
import { Link } from 'react-router-dom';
// import './Header.css';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logo?: string;
  navItems?: NavItem[];
  onSearch?: (query: string) => void;
  user?: {
    name: string;
    avatar?: string;
  } | null;
}

const Header: React.FC<HeaderProps> = ({
  logo = 'Logo',
  navItems = [],
  onSearch,
  user = null,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="bg-[var(--secondary)] text-[var(--text)] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-[var(--primary)]">
              {logo}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="hover:text-[var(--primary)] transition"
              >
                {item.label}
              </Link>
            ))}
        </nav>

          {/* Search Bar - Desktop */}
          {onSearch && (
            <form onSubmit={handleSearchSubmit} className="hidden md:flex">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-l-lg bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-r-lg hover:opacity-90 transition"
              >
                Search
              </button>
            </form>
          )}

          {/* User Section - Desktop */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{user.name}</span>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[var(--secondary)] border-t border-[var(--text)]/10">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="block px-4 py-2 rounded-lg hover:bg-[var(--primary)]/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Search */}
            {onSearch && (
              <form onSubmit={handleSearchSubmit} className="flex">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-l-lg bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-r-lg"
                >
                  Search
                </button>
              </form>
            )}

            {/* Mobile User Section */}
            {user ? (
              <div className="flex items-center gap-3 py-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{user.name}</span>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="flex-1 px-4 py-2 text-center text-[var(--primary)] border border-[var(--primary)] rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 px-4 py-2 text-center bg-[var(--primary)] text-white rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
export type { HeaderProps, NavItem };