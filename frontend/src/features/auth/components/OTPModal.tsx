import { useState, useEffect } from 'react';
import { useSendOTPMutation, useVerifyOTPMutation } from '../api/authApi';
import type { SendOTPRequest, VerifyOTPRequest } from '../types/profile';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  purpose: 'profile_update' | 'password_change' | 'profile_picture_update';
  onVerifySuccess: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  email,
  purpose,
  onVerifySuccess,
}) => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');

  const [sendOTP, { isLoading: isSending }] = useSendOTPMutation();
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();

  const purposeMessages = {
    profile_update: 'update your profile information',
    password_change: 'change your password',
    profile_picture_update: 'update your profile picture',
  };

  useEffect(() => {
    if (isOpen) {
      handleSendOTP();
    }
  }, [isOpen]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOTP = async () => {
    try {
      setError('');
      const data: SendOTPRequest = { email, purpose };
      await sendOTP(data).unwrap();
      setTimer(60); // 60 seconds cooldown
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('Send OTP error:', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setError('');
      const data: VerifyOTPRequest = { email, otp, purpose };
      await verifyOTP(data).unwrap();
      onVerifySuccess();
      onClose();
    } catch (err) {
      setError('Invalid or expired OTP. Please try again.');
      console.error('Verify OTP error:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Verify Your Identity
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          To {purposeMessages[purpose]}, please verify your identity by entering
          the OTP sent to your email.
        </p>

        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">OTP sent to:</span> {email}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={timer > 0 || isSending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending
                ? 'Sending...'
                : timer > 0
                ? `Resend in ${formatTime(timer)}`
                : 'Resend OTP'}
            </button>

            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPModal;
