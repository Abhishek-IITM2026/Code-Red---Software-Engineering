import { useState, type ChangeEvent } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { setTheme } from "../theme/themeSlice";
import { logout } from "../features/auth/authSlice";
import type { RootState, AppDispatch } from "../app/store";
import type { ThemeType } from "../theme/themes";

const navItems = [
  { label: "Home", href: "/student/dashboard" },
  { label: "Attendance", href: "/student/attendance" },
  { label: "Marks", href: "/student/marks" },
  { label: "Schedule", href: "/student/schedule" },
];

const themeOptions: { value: ThemeType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "ocean", label: "Ocean" },
];

const sidebarLinks = [
  { label: "Dashboard", href: "/student/dashboard", icon: "📊" },
  { label: "Attendance", href: "/student/attendance", icon: "✅" },
  { label: "Marks", href: "/student/marks", icon: "📝" },
  { label: "Schedule", href: "/student/schedule", icon: "🗓️" },
  { label: "Study Materials", href: "/student/study-materials", icon: "📚" },
];

const StudentView = function () {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const currentTheme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(e.target.value as ThemeType));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Header
        logo="CodeRed"
        navItems={navItems}
        user={user ? { name: `${user.firstName} ${user.lastName}` } : null}
      />

      <div className="flex flex-1">
        {/* Mobile Sidebar Toggle */}
        <button
          className="md:hidden fixed top-20 left-4 z-50 p-2 bg-[var(--primary)] text-white rounded-lg shadow-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:static z-40 w-64 bg-[var(--secondary)] min-h-[calc(100vh-64px)] p-4 transition-transform duration-300 ease-in-out`}
        >
          {/* User Info */}
          <div className="mb-6 p-4 bg-[var(--bg)] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
                {user?.firstName?.charAt(0) || "S"}
              </div>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-[var(--text)]/70">Student</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === link.href
                    ? "bg-[var(--primary)] text-white"
                    : "hover:bg-[var(--primary)]/10"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Theme Switcher */}
          <div className="mt-8 p-4 border-t border-[var(--text)]/20">
            <h3 className="text-sm font-semibold mb-3">Theme</h3>
            <select
              value={currentTheme}
              onChange={handleThemeChange}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {themeOptions.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logout Button */}
          <div className="mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
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
        <main className="flex-1 p-4 md:p-6 mt-14 md:mt-0">
          <Outlet />
        </main>
      </div>

      <Footer copyright={`© ${new Date().getFullYear()} CodeRed Student Portal`} />
    </div>
  );
};

export default StudentView;
