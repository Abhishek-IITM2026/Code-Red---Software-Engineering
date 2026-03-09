import { useState, type FormEventHandler } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { useLoginMutation } from "../../../app/hooks";

const Login = function () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  
  // Use RTK Query mutation hook
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    try {
      await login({ email, password }).unwrap();
      // Successful login - navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="bg-[var(--secondary)] p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-[var(--primary)]">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error.data?.message || "Login failed. Please try again."}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--primary)] text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FiLogIn className="w-5 h-5" />
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link to="/auth/register" className="text-[var(--primary)] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
