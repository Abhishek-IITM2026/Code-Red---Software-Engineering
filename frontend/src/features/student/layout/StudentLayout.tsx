import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FiMenu, FiX, FiSettings, FiHome, FiBook, FiAward, FiCalendar, FiFileText, FiDownload, FiChevronRight, FiChevronLeft, FiLogOut, FiUser } from "react-icons/fi";
import { logout } from "../../auth/store/authSlice";
import type { RootState, AppDispatch } from "../../../app/store";
import { Preferences, Button } from "../../../components/common";

const appName = import.meta.env.VITE_APP_NAME || "CIOM";
const appLogo = import.meta.env.VITE_APP_LOGO || "C";
const appTagline = import.meta.env.VITE_APP_TAGLINE || "";

// Sidebar links - only main pages, not dynamic routes
const sidebarLinks = [
  { label: "Dashboard", href: "/student/dashboard", icon: FiHome },
  { label: "Attendance", href: "/student/attendance", icon: FiBook },
  { label: "Marks", href: "/student/marks", icon: FiAward },
  { label: "Schedule", href: "/student/schedule", icon: FiCalendar },
  { label: "Subjects", href: "/student/subjects", icon: FiBook },
  { label: "Assignments", href: "/student/assignments", icon: FiFileText },
  { label: "Study Materials", href: "/student/materials", icon: FiDownload },
  { label: "My Profile", href: "/profile", icon: FiUser },
];

// Filter routes to exclude dynamic routes (those with : in path)
const mainRoutes = sidebarLinks.filter(link => !link.href.includes(":"));

const navItems = [
  { label: "Home", href: "/student/dashboard" },
  { label: "Attendance", href: "/student/attendance" },
  { label: "Marks", href: "/student/marks" },
  { label: "Schedule", href: "/student/schedule" },
];

const StudentLayout = function () {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--header-bg)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/student/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                  {appLogo}
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[var(--primary)]">{appName}</span>
                  {appTagline && !isCollapsed && (
                    <span className="hidden md:inline-block text-[10px] text-[var(--text-secondary)] -mt-1">
                      {appTagline}
                    </span>
                  )}
                </div>
              </Link>
              {!isCollapsed && (
                <span className="hidden md:inline-block text-xs px-2 py-1 bg-[var(--secondary)] text-[var(--text-secondary)] rounded-lg">
                  Student Portal
                </span>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition hover:text-[var(--primary)] ${
                    location.pathname === item.href 
                      ? 'text-[var(--primary)]' 
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                icon={<FiSettings className="w-4 h-4" />}
                onClick={() => setIsPreferencesOpen(true)}
                title="Settings"
              />
              <Link
                to="/profile"
                className="hidden md:flex items-center gap-3 hover:bg-[var(--secondary)] px-2 py-1 rounded-lg transition"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm">
                  {user?.firstName?.charAt(0) || "S"}
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Student</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="small"
                onClick={handleLogout}
                title="Logout"
                className="text-red-500 hover:bg-red-50"
              >
                <FiLogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Sidebar Toggle */}
        <button
          className="md:hidden fixed top-20 left-4 z-50 p-2 bg-[var(--primary)] text-white rounded-lg shadow-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>

        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${isCollapsed ? "w-20" : "w-64"} md:translate-x-0 fixed md:static z-40 bg-[var(--sidebar-bg)] min-h-[calc(100vh-64px)] border-r border-[var(--border)] transition-all duration-300`}
        >
          {/* Collapse Button inside Sidebar */}
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-sm hover:bg-[var(--secondary)] transition"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* User Info */}
          <div className={`mb-6 px-4 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] ${isCollapsed ? 'p-2' : ''}`}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user?.firstName?.charAt(0) || "S"}
                </div>
                {!isCollapsed && (
                  <div>
                    <p className="font-semibold truncate max-w-[120px]">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">Student</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 px-4">
            {sidebarLinks.filter(link => !link.href.includes(":")).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  location.pathname === link.href
                    ? "bg-[var(--primary)] text-white"
                    : "hover:bg-[var(--secondary)]"
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? link.label : undefined}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Back to Home */}
          <div className={`mt-6 px-4 ${isCollapsed ? 'px-2' : ''}`}>
            <Link
              to="/"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--secondary)] transition ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Back to Home" : undefined}
            >
              <FiChevronRight className="w-5 h-5 rotate-180 flex-shrink-0" />
              {!isCollapsed && <span>Back to Home</span>}
            </Link>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0 transition-all duration-300 ${isCollapsed ? 'ml-0' : ''}`}>
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Preferences Modal */}
      <Preferences 
        isOpen={isPreferencesOpen} 
        onClose={() => setIsPreferencesOpen(false)} 
      />
    </div>
  );
};

export default StudentLayout;