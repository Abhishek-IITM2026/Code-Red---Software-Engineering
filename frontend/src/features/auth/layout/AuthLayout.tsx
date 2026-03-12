import { Outlet, Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import { setTheme } from "../../../theme/themeSlice";
import type { RootState } from "../../../app/store";
import type { ThemeType } from "../../../theme/themes";
import authRoutes from "../routes/auth.routes";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const themeOptions: { value: ThemeType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "ocean", label: "Ocean" },
];

const AuthLayout = function () {
  const location = useLocation();
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.auth.user);

  const isLoginPage = location.pathname === "/auth/login";
  const isRegisterPage = location.pathname === "/auth/register";

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(e.target.value as ThemeType));
  };

  const sidebarLinks = [
    { label: "Login", href: "/auth/login", icon: "🔑" },
    { label: "Register", href: "/auth/register", icon: "📝" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Header
        logo="Coaching Institute"
        navItems={navItems}
        user={user ? { name: `${user.firstName} ${user.lastName}` } : null}
      />

      <div className="flex flex-1">
        {/* Sidebar - Hidden on login/register pages for cleaner look */}
        {!isLoginPage && !isRegisterPage && (
          <aside className="w-64 bg-[var(--secondary)] min-h-[calc(100vh-64px)] p-4 hidden md:block">
            <nav className="space-y-2">
              {authRoutes.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    location.pathname === link.path
                      ? "bg-[var(--primary)] text-white"
                      : "hover:bg-[var(--primary)]/10"
                  }`}
                >
                  <span>{link.name}</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>

            {/* Theme Switcher in Sidebar */}
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
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Mobile Theme Switcher */}
          <div className="md:hidden p-4 bg-[var(--secondary)]">
            <label htmlFor="mobile-theme" className="text-sm font-medium mr-2">
              Theme:
            </label>
            <select
              id="mobile-theme"
              value={currentTheme}
              onChange={handleThemeChange}
              className="px-3 py-1 rounded-lg bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {themeOptions.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          {/* Page Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AuthLayout;
