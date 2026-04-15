import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type{ AuthState, LoginCredentials , RegisterData, AuthResponse, User} from "../types/index.ts";
import { AUTH_API_BASE_URL } from "../../../services/api/config";
import type {
  UpdateProfileRequest,
  UpdateProfilePictureRequest,
  ChangePasswordRequest,
} from "../types/profile";

// Mock OTP storage (in real app, this would be on the server)
const mockOTPStore: Record<string, { otp: string; expiresAt: number }> = {};

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

type ProfileMutationResponse = {
  user?: User;
};

// Login
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data as AuthResponse;
    } catch {
      return rejectWithValue("Unable to reach the backend. Check that the API server is running on http://localhost:3500.");
    }
  }
);

// Register
export const register = createAsyncThunk<AuthResponse, RegisterData>(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    // Try API first
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || "Registration failed");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      return data as AuthResponse;
    } catch {
      return rejectWithValue("Unable to reach the backend. Check that the API server is running on http://localhost:3500.");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return null;
});

// Mock OTP - Send
export const sendOTP = createAsyncThunk(
  "auth/sendOTP",
  async (data: { email: string; purpose: string }, { rejectWithValue }) => {
    // Try API first
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return rejectWithValue(result.error?.message || "Failed to send OTP");
      return result;
    } catch {
      // Mock OTP generation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      mockOTPStore[data.email] = { otp, expiresAt };
      
      // In real app, OTP would be sent via email
      console.log(`Mock OTP for ${data.email}: ${otp}`); // For testing
      
      return {
        success: true,
        message: `OTP sent to ${data.email} (Check console for mock OTP)`,
        expiresAt: new Date(expiresAt).toISOString(),
      };
    }
  }
);

// Mock OTP - Verify
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (data: { email: string; otp: string; purpose: string }, { rejectWithValue }) => {
    // Try API first
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return rejectWithValue(result.error?.message || "Invalid OTP");
      return result;
    } catch {
      // Mock OTP verification
      const storedOTP = mockOTPStore[data.email];
      
      if (!storedOTP) {
        return rejectWithValue("No OTP found. Please request a new OTP.");
      }
      
      if (Date.now() > storedOTP.expiresAt) {
        delete mockOTPStore[data.email];
        return rejectWithValue("OTP has expired. Please request a new one.");
      }
      
      if (storedOTP.otp !== data.otp) {
        return rejectWithValue("Invalid OTP. Please try again.");
      }
      
      // OTP verified successfully - clear it
      delete mockOTPStore[data.email];
      
      return { success: true, message: "OTP verified successfully" };
    }
  }
);

// Mock Profile Update
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: UpdateProfileRequest, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const currentUser = state.auth.user;
    
    if (!currentUser) {
      return rejectWithValue("Not authenticated");
    }

    // Try API first
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return rejectWithValue(result.error?.message || "Update failed");
      return result;
    } catch {
      // Mock profile update
      const updatedUser: User = {
        ...currentUser,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      return {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      };
    }
  }
);

// Mock Profile Picture Update
export const updateProfilePicture = createAsyncThunk(
  "auth/updateProfilePicture",
  async (data: UpdateProfilePictureRequest, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const currentUser = state.auth.user;
    
    if (!currentUser) {
      return rejectWithValue("Not authenticated");
    }

    // Try API first
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/profile/picture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return rejectWithValue(result.error?.message || "Update failed");
      return result;
    } catch {
      // Mock profile picture update
      const updatedUser: User = {
        ...currentUser,
        profilePicture: data.profilePicture,
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      return {
        success: true,
        message: "Profile picture updated successfully",
        user: updatedUser,
      };
    }
  }
);

// Mock Change Password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (data: ChangePasswordRequest, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const currentUser = state.auth.user;
    
    if (!currentUser) {
      return rejectWithValue("Not authenticated");
    }

    // Try API first
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.auth.token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return rejectWithValue(result.error?.message || "Password change failed");
      return result;
    } catch {
      // Mock password change - in real app, verify current password
      // For demo, just succeed
      return {
        success: true,
        message: "Password changed successfully",
      };
    }
  }
);

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
        state.token = action.payload.token ?? null;
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
        if (action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
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
      })
      // Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<ProfileMutationResponse>) => {
        state.isLoading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Profile Picture
      .addCase(updateProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfilePicture.fulfilled, (state, action: PayloadAction<ProfileMutationResponse>) => {
        state.isLoading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
