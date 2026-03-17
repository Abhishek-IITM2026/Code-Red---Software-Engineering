// OTP Types
export interface SendOTPRequest {
  email: string;
  purpose: 'profile_update' | 'password_change' | 'profile_picture_update';
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  purpose: 'profile_update' | 'password_change' | 'profile_picture_update';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

// Profile Update Types
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateProfilePictureRequest {
  profilePicture: string; // Base64 or URL
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    profilePicture?: string;
  };
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

// OTP Verification State
export interface OTPVerificationState {
  isModalOpen: boolean;
  purpose: 'profile_update' | 'password_change' | 'profile_picture_update' | null;
  email: string;
  isVerified: boolean;
  pendingData: UpdateProfileRequest | UpdateProfilePictureRequest | ChangePasswordRequest | null;
}
