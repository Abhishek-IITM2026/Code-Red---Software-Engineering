import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX, FiBookOpen, FiAward, FiUsers, FiBarChart2, FiPhone, FiMail, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from "react-icons/fi";
import { Button } from "../../../components/common";

const HomeLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setIsScrolled(window.scrollY > 50);
    });
  }

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-[var(--card-bg)]/95 backdrop-blur-md shadow-md" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl">
                C
              </div>
              <span className="text-xl font-bold text-[var(--primary)]">CIOM</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth/login">
                <Button variant="ghost" size="small">Login</Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="primary" size="small">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[var(--card-bg)] border-t border-[var(--border)]">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-[var(--border)] flex gap-3">
                <Link to="/auth/login" className="flex-1">
                  <Button variant="outline" width="full">Login</Button>
                </Link>
                <Link to="/auth/register" className="flex-1">
                  <Button variant="primary" width="full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[var(--secondary)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl">
                  C
                </div>
                <span className="text-xl font-bold text-[var(--primary)]">CodeRed</span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Empowering education through technology. Join thousands of students and educators using CodeRed.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                  <FiFacebook className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                  <FiTwitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                  <FiInstagram className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                  <FiLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["About Us", "Features", "Pricing", "Contact", "FAQ"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4">Features</h4>
              <ul className="space-y-2">
                {["Attendance Tracking", "Online Assessments", "Performance Analytics", "Parent Portal", "Study Materials"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <FiMapPin className="w-5 h-5 text-[var(--primary)]" />
                  <span>123 Education Lane, City</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <FiPhone className="w-5 h-5 text-[var(--primary)]" />
                  <span>+1 234 567 890</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <FiMail className="w-5 h-5 text-[var(--primary)]" />
                  <span>info@codered.edu</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--text-secondary)]">
            <p>© {new Date().getFullYear()} CodeRed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeLayout;
