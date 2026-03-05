import React from 'react';
import './Header.css';

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <a href="/">{logo}</a>
        </div>

        <nav className="header__nav">
          <ul className="header__nav-list">
            {navItems.map((item, index) => (
              <li key={index} className="header__nav-item">
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {onSearch && (
          <form className="header__search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header__search-input"
            />
            <button type="submit" className="header__search-button">
              Search
            </button>
          </form>
        )}

        <div className="header__user">
          {user ? (
            <div className="header__user-profile">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="header__user-avatar"
                />
              ) : (
                <span className="header__user-initial">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="header__user-name">{user.name}</span>
            </div>
          ) : (
            <div className="header__auth">
              <a href="/login" className="header__login">Login</a>
              <a href="/signup" className="header__signup">Sign Up</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
export type { HeaderProps, NavItem };