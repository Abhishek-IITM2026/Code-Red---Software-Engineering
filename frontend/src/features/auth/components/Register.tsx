import { useState, type FormEventHandler } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiUserPlus } from "react-icons/fi";
import { useRegisterMutation } from "../../../app/hooks";

const Register = function () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("student");

  const navigate = useNavigate();
  
  // Use RTK Query mutation hook
  const [register, { isLoading, error }] = useRegisterMutation();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    try {
      await register({ email, password, firstName, lastName, role }).unwrap();
      // Successful registration - navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Registration failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="bg-[var(--secondary)] p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-[var(--primary)]">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--bg)] text-[var(--text)]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--bg)] text-[var(--text)]"
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--bg)] text-[var(--text)]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--bg)] text-[var(--text)]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--bg)] text-[var(--text)]"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error.data?.message || "Registration failed. Please try again."}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--primary)] text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FiUserPlus className="w-5 h-5" />
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-[var(--primary)] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
