import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiUserPlus, FiArrowRight } from "react-icons/fi";
import { Button, Input, Card, Select } from "../../../components/common";
import { register, clearError } from "../store/authSlice";
import type { AppDispatch, RootState } from "../../../app/store";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Role-based redirect mapping
  const roleRedirects: Record<string, string> = {
    student: "/student/dashboard",
    faculty: "/faculty/dashboard",
    parent: "/parent/dashboard",
    admin: "/administration/dashboard"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    dispatch(clearError());
    
    const registerData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role
    };

    const result = await dispatch(register(registerData) as any);
    if (register.fulfilled.match(result)) {
      const role = result.payload.user.role?.toLowerCase();
      navigate(roleRedirects[role || "student"] || "/student/dashboard", { replace: true });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
    setValidationError("");
  };

  const roleOptions = [
    { value: "student", label: "Student" },
    { value: "faculty", label: "Faculty/Teacher" },
    { value: "parent", label: "Parent" }
  ];

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
          <h1 className="text-2xl font-bold text-[var(--text)]">Create an account</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Join CodeRed today</p>
        </div>

        {/* Register Form */}
        <Card className="!p-8" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || validationError) && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error || validationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                icon={<FiUser className="w-5 h-5" />}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<FiMail className="w-5 h-5" />}
              required
            />

            <Select
              label="Register As"
              name="role"
              options={roleOptions}
              value={formData.role}
              onChange={handleChange}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                icon={<FiLock className="w-5 h-5" />}
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
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

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                required
              />
              <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]">
                I agree to the{" "}
                <a href="#" className="text-[var(--primary)] hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-[var(--primary)] hover:underline">Privacy Policy</a>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              width="full"
              loading={isLoading}
              icon={<FiUserPlus className="w-5 h-5" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-[var(--primary)] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
