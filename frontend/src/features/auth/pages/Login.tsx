import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiUser, FiUserPlus, FiShield } from "react-icons/fi";
import { Button, Input, Card } from "../../../components/common";
import { login, clearError } from "../store/authSlice";
import type { AppDispatch, RootState } from "../../../app/store";

const demoUsers = [
  { email: "student@demo.com", password: "password", role: "Student", icon: FiUser },
  { email: "faculty@demo.com", password: "password", role: "Faculty", icon: FiShield },
  { email: "parent@demo.com", password: "password", role: "Parent", icon: FiUser },
  { email: "admin@demo.com", password: "password", role: "Admin", icon: FiShield },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  // Role-based redirect mapping
  const roleRedirects: Record<string, string> = {
    student: "/student/dashboard",
    faculty: "/faculty/dashboard",
    parent: "/parent/dashboard",
    admin: "/administration/dashboard",
    administration: "/administration/dashboard"
  };

  const from = (location.state as any)?.from?.pathname || "/student/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(formData) as any);
    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role?.toLowerCase();
      navigate(roleRedirects[role || "student"] || "/student/dashboard", { replace: true });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setFormData({ email, password });
    dispatch(clearError());
    const result = await dispatch(login({ email, password }) as any);
    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role?.toLowerCase();
      navigate(roleRedirects[role || "student"] || "/student/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary)]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-2xl mb-4">
              C
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">Welcome back</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Sign in to continue to CodeRed</p>
        </div>

        {/* Login Form */}
        <Card className="!p-8" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              icon={<FiMail className="w-5 h-5" />}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                icon={<FiLock className="w-5 h-5" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              width="full"
              loading={isLoading}
              icon={<FiLogIn className="w-5 h-5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don't have an account?{" "}
              <Link to="/auth/register" className="text-[var(--primary)] font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo Login Buttons */}
        <div className="mt-6">
          <p className="text-sm font-medium text-[var(--text)] mb-3 text-center">Quick Demo Login</p>
          <div className="grid grid-cols-2 gap-3">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => handleDemoLogin(user.email, user.password)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all disabled:opacity-50"
              >
                <user.icon className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--text)]">{user.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Info */}
        <div className="mt-4 p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text)] mb-2">Demo Credentials</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Email: <span className="font-mono">student@demo.com</span> | Password: <span className="font-mono">password</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
