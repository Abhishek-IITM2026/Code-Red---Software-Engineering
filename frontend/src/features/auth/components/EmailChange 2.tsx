import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEmailChangeRequestMutation, useEmailChangeConfirmMutation, useVerifyOTPMutation } from '../api/authApi';
import { setCredentials } from '../store/authSlice';
import type { RootState } from '../../../app/store';
import type { EmailChangeRequest, VerifyOTPRequest } from '../types/profile';

interface EmailChangeProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EmailChange: React.FC<EmailChangeProps> = ({ onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const [step, setStep] = useState<'enter' | 'verify' | 'success'>('enter');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  const [requestChange, { isLoading: isRequesting }] = useEmailChangeRequestMutation();
  const [confirmChange, { isLoading: isConfirming }] = useEmailChangeConfirmMutation();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newEmail === user?.email) {
      setError('New email is the same as your current email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const data: EmailChangeRequest = { newEmail };
      await requestChange(data).unwrap();
      setStep('verify');
      setTimer(300);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to send verification code.');
    }
  };

  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const data: VerifyOTPRequest & { newEmail: string } = { 
        email: newEmail, 
        otp, 
        purpose: 'email_change' as const,
        newEmail 
      };
      const response = await confirmChange(data).unwrap();
      
      if (response.user) {
        dispatch(setCredentials({ user: response.user, token: token! }));
      }
      setStep('success');
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to verify code. Please check and try again.');
    }
  };

  const handleResendCode = async () => {
    setError('');
    try {
      const data: EmailChangeRequest = { newEmail };
      await requestChange(data).unwrap();
      setTimer(300);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to resend code.');
    }
  };

  if (step === 'success') {
    return (
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Changed!</h2>
          <p className="text-gray-600 mb-6">
            Your email has been successfully updated to <span className="font-medium">{newEmail}</span>
          </p>
          <button
            onClick={onSuccess}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Verify New Email</h2>
          <button onClick={() => setStep('enter')} className="text-gray-500 hover:text-gray-700">
            ← Back
          </button>
        </div>

        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-blue-700">
            Enter the 6-digit code sent to your new email:
          </p>
          <p className="text-sm font-medium text-blue-800">{newEmail}</p>
        </div>

        {timer > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Code expires in: <span className="font-medium text-blue-600">{formatTime(timer)}</span>
          </p>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmChange}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
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
              onClick={handleResendCode}
              disabled={timer > 0 || isRequesting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend Code'}
            </button>

            <button
              type="submit"
              disabled={isConfirming || otp.length !== 6}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? 'Verifying...' : 'Verify & Change'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Change Email Address</h2>
      <p className="text-gray-600 mb-4">
        Enter your new email address. A verification code will be sent to confirm the change.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleRequestChange}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
          <input
            type="email"
            value={user?.email || ''}
            className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
            disabled
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter new email"
            required
          />
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isRequesting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailChange;
