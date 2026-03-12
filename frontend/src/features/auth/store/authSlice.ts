import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type{ AuthState, LoginCredentials , RegisterData, AuthResponse, User} from "../types/index.ts";

// Mock users for demo
const mockUsers: Record<string, User & { password: string }> = {
  "student@demo.com": {
    id: "1",
    email: "student@demo.com",
    firstName: "John",
    lastName: "Student",
    role: "student",
    password: "password"
  },
  "faculty@demo.com": {
    id: "2",
    email: "faculty@demo.com",
    firstName: "Jane",
    lastName: "Teacher",
    role: "faculty",
    password: "password"
  },
  "parent@demo.com": {
    id: "3",
    email: "parent@demo.com",
    firstName: "Mike",
    lastName: "Parent",
    role: "parent",
    password: "password"
  },
  "admin@demo.com": {
    id: "4",
    email: "admin@demo.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    password: "password"
  }
};

const getStoredAuth = (): { user: User | null; token: string | null } => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

const storedAuth = getStoredAuth();

const initialState: AuthState = {
  user: storedAuth.user,
  token: storedAuth.token,
  isLoading: false,
  error: null,
  isAuthenticated: !!storedAuth.token,
};

// Simulated token generation
const generateToken = (user: User): string => {
  return btoa(JSON.stringify({ userId: user.id, role: user.role, timestamp: Date.now() }));
};

// Login - works with mock data or real API
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    // Try to find user in mock data
    const mockUser = mockUsers[credentials.email];
    
    if (mockUser && mockUser.password === credentials.password) {
      const { password, ...user } = mockUser;
      const token = generateToken(user);
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      return { user, token };
    }
    
    // If not in mock, try API call (will fail if backend not available)
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data as AuthResponse;
    } catch {
      // Return mock success for demo purposes
      return rejectWithValue("Invalid email or password. Use demo credentials shown below.");
    }
  }
);

// Register
export const register = createAsyncThunk<AuthResponse, RegisterData>(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    // Try API first
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data as AuthResponse;
    } catch {
      // Mock registration success
      const newUser: User = {
        id: String(Date.now()),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "student"
      };
      const token = generateToken(newUser);
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));
      
      return { user: newUser, token };
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return null;
});

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
