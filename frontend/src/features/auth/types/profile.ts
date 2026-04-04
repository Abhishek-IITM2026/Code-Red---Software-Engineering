// OTP Types
export type OtpPurposeType = 'profile_update' | 'password_change' | 'profile_picture_update' | 'email_change' | 'password_reset' | 'account_verification';

export interface SendOTPRequest {
  email: string;
  purpose: OtpPurposeType;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  purpose: OtpPurposeType;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  otp?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateProfilePictureRequest {
  profilePicture: string;
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

export interface OTPVerificationState {
  isModalOpen: boolean;
  purpose: OtpPurposeType | null;
  email: string;
  isVerified: boolean;
  pendingData: UpdateProfileRequest | UpdateProfilePictureRequest | ChangePasswordRequest | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface EmailChangeRequest {
  newEmail: string;
}

export interface EmailChangeResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const OTP_PURPOSES = [
  'profile_update',
  'password_change',
  'profile_picture_update',
  'email_change',
  'password_reset',
  'account_verification',
] as const;

export type OtpPurpose = typeof OTP_PURPOSES[number];
