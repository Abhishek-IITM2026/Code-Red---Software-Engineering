import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';
import { AUTH_API_BASE_URL } from '../../../services/api/config';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';
import type {
  SendOTPRequest,
  VerifyOTPRequest,
  OTPResponse,
  UpdateProfileRequest,
  UpdateProfilePictureRequest,
  ChangePasswordRequest,
  ProfileUpdateResponse,
  PasswordChangeResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  EmailChangeRequest,
} from '../types/profile';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: AUTH_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
      transformResponse: (response: AuthResponse) => {
        // Store token and user in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
    }),

    // Register mutation
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
      transformResponse: (response: AuthResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
    }),

    // Logout mutation
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
      transformResponse: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    }),

    // Get current user (protected)
    getCurrentUser: builder.query<User, void>({
      query: () => '/me',
      providesTags: ['Auth'],
    }),

    // Refresh token
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/refresh',
        method: 'POST',
      }),
      transformResponse: (response: AuthResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
    }),

    // Send OTP for verification
    sendOTP: builder.mutation<OTPResponse, SendOTPRequest>({
      queryFn: async (data, { getState }) => {
        try {
          const response = await fetch(`${AUTH_API_BASE_URL}/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) return { error: { status: response.status, data: result } };
          return { data: result };
        } catch {
          // Mock OTP generation
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = Date.now() + 5 * 60 * 1000;
          
          // Store mock OTP in sessionStorage
          sessionStorage.setItem(`otp_${data.email}`, JSON.stringify({ otp, expiresAt }));
          console.log(`Mock OTP for ${data.email}: ${otp}`); // For testing
          
          return {
            data: {
              success: true,
              message: `OTP sent to ${data.email} (Check console for mock OTP)`,
              expiresAt: new Date(expiresAt).toISOString(),
            } as OTPResponse,
          };
        }
      },
    }),

    // Verify OTP
    verifyOTP: builder.mutation<OTPResponse, VerifyOTPRequest>({
      queryFn: async (data) => {
        try {
          const response = await fetch(`${AUTH_API_BASE_URL}/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) return { error: { status: response.status, data: result } };
          return { data: result };
        } catch {
          // Mock OTP verification
          const stored = sessionStorage.getItem(`otp_${data.email}`);
          if (!stored) {
            return { error: { status: 400, data: { message: 'No OTP found. Please request a new OTP.' } } };
          }
          
          const { otp, expiresAt } = JSON.parse(stored);
          
          if (Date.now() > expiresAt) {
            sessionStorage.removeItem(`otp_${data.email}`);
            return { error: { status: 400, data: { message: 'OTP has expired. Please request a new one.' } } };
          }
          
          if (otp !== data.otp) {
            return { error: { status: 400, data: { message: 'Invalid OTP. Please try again.' } } };
          }
          
          // OTP verified successfully
          sessionStorage.removeItem(`otp_${data.email}`);
          
          return { data: { success: true, message: 'OTP verified successfully' } as OTPResponse };
        }
      },
    }),

    // Update Profile (after OTP verification)
    updateProfile: builder.mutation<ProfileUpdateResponse, UpdateProfileRequest>({
      queryFn: async (data, { getState }) => {
        const state = getState() as { auth: { user: User | null; token: string | null } };
        const currentUser = state.auth.user;
        
        if (!currentUser) {
          return { error: { status: 401, data: { message: 'Not authenticated' } } };
        }

        try {
          const response = await fetch(`${AUTH_API_BASE_URL}/profile/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.auth.token}`,
            },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) return { error: { status: response.status, data: result } };
          return { data: result };
        } catch {
          // Mock profile update
          const updatedUser: User = {
            ...currentUser,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          return {
            data: {
              success: true,
              message: 'Profile updated successfully',
              user: updatedUser,
            } as ProfileUpdateResponse,
          };
        }
      },
    }),

    // Update Profile Picture (after OTP verification)
    updateProfilePicture: builder.mutation<ProfileUpdateResponse, UpdateProfilePictureRequest>({
      queryFn: async (data, { getState }) => {
        const state = getState() as { auth: { user: User | null; token: string | null } };
        const currentUser = state.auth.user;
        
        if (!currentUser) {
          return { error: { status: 401, data: { message: 'Not authenticated' } } };
        }

        try {
          const response = await fetch(`${AUTH_API_BASE_URL}/profile/picture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.auth.token}`,
            },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) return { error: { status: response.status, data: result } };
          return { data: result };
        } catch {
          // Mock profile picture update
          const updatedUser: User = {
            ...currentUser,
            profilePicture: data.profilePicture,
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          return {
            data: {
              success: true,
              message: 'Profile picture updated successfully',
              user: updatedUser,
            } as ProfileUpdateResponse,
          };
        }
      },
    }),

    // Password Reset Request
    passwordResetRequest: builder.mutation<OTPResponse, PasswordResetRequest>({
      query: (data) => ({
        url: '/password/reset-request',
        method: 'POST',
        body: data,
      }),
    }),

    // Password Reset Confirm
    passwordResetConfirm: builder.mutation<{ success: boolean; message: string }, PasswordResetConfirmRequest>({
      query: (data) => ({
        url: '/password/reset-confirm',
        method: 'POST',
        body: data,
      }),
    }),

    // Email Change Request
    emailChangeRequest: builder.mutation<OTPResponse, EmailChangeRequest>({
      query: (data) => ({
        url: '/email/change-request',
        method: 'POST',
        body: data,
      }),
    }),

    // Email Change Confirm
    emailChangeConfirm: builder.mutation<{ success: boolean; message: string; user: User }, VerifyOTPRequest & { newEmail: string }>({
      queryFn: async (data, { getState }) => {
        const state = getState() as { auth: { token: string | null } };
        try {
          const response = await fetch(`${AUTH_API_BASE_URL}/email/change-confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.auth.token}`,
            },
            body: JSON.stringify({ email: data.newEmail, otp: data.otp, purpose: data.purpose }),
          });
          const result = await response.json();
          if (!response.ok) return { error: { status: response.status, data: result } };
          if (result.user) localStorage.setItem('user', JSON.stringify(result.user));
          return { data: result };
        } catch {
          return { data: { success: true, message: 'Email changed successfully' } };
        }
      },
    }),

    // Change Password (after OTP verification)
    changePassword: builder.mutation<PasswordChangeResponse, ChangePasswordRequest>({
      queryFn: async (data, { getState }) => {
        const state = getState() as { auth: { user: User | null; token: string | null } };
        
        if (!state.auth.user) {
          return { error: { status: 401, data: { message: 'Not authenticated' } } };
        }

        try {
          const response = await fetch(`${AUTH_API_BASE_URL}/profile/change-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.auth.token}`,
            },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) return { error: { status: response.status, data: result } };
          return { data: result };
        } catch {
          // Mock password change - for demo, just succeed
          return {
            data: {
              success: true,
              message: 'Password changed successfully',
            } as PasswordChangeResponse,
          };
        }
      },
    }),
  }),
});

// Export hooks for usage in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useSendOTPMutation,
  useVerifyOTPMutation,
  useUpdateProfileMutation,
  useUpdateProfilePictureMutation,
  useChangePasswordMutation,
  usePasswordResetRequestMutation,
  usePasswordResetConfirmMutation,
  useEmailChangeRequestMutation,
  useEmailChangeConfirmMutation,
} = authApi;

export default authApi;
