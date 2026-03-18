import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaCamera, FaLock, FaSave, FaTimes } from 'react-icons/fa';
import type { RootState } from '../../../app/store';
import { setCredentials } from '../store/authSlice';
import {
  useUpdateProfileMutation,
  useUpdateProfilePictureMutation,
  useChangePasswordMutation,
} from '../api/authApi';
import OTPModal from '../components/OTPModal';
import type {
  UpdateProfileRequest,
  UpdateProfilePictureRequest,
  ChangePasswordRequest,
} from '../types/profile';

type TabType = 'profile' | 'picture' | 'password';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'profile_update' | 'password_change' | 'profile_picture_update'>('profile_update');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile picture state
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [updateProfilePicture, { isLoading: isUpdatingPicture }] = useUpdateProfilePictureMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpPurpose('profile_update');
    setIsOTPModalOpen(true);
  };

  const handleProfilePictureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) {
      showMessage('Please select an image', true);
      return;
    }
    setOtpPurpose('profile_picture_update');
    setIsOTPModalOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', true);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', true);
      return;
    }

    setOtpPurpose('password_change');
    setIsOTPModalOpen(true);
  };

  const handleOTPVerified = async () => {
    try {
      if (otpPurpose === 'profile_update') {
        const data: UpdateProfileRequest = { firstName, lastName, phone };
        const response = await updateProfile(data).unwrap();
        dispatch(setCredentials({ user: response.user, token: token! }));
        showMessage('Profile updated successfully!');
      } else if (otpPurpose === 'profile_picture_update') {
        const data: UpdateProfilePictureRequest = { profilePicture: previewImage };
        const response = await updateProfilePicture(data).unwrap();
        dispatch(setCredentials({ user: response.user, token: token! }));
        showMessage('Profile picture updated successfully!');
      } else if (otpPurpose === 'password_change') {
        const data: ChangePasswordRequest = { currentPassword, newPassword, confirmPassword };
        await changePassword(data).unwrap();
        showMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      showMessage(err?.data?.message || 'Operation failed. Please try again.', true);
    }
    setIsOTPModalOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile Info', icon: FaUser },
    { id: 'picture' as TabType, label: 'Profile Picture', icon: FaCamera },
    { id: 'password' as TabType, label: 'Change Password', icon: FaLock },
  ];
  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-3xl bg-[var(--secondary)] shadow-sm ring-1 ring-[var(--text)]/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--primary)] to-sky-700 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  Faculty Profile
                </p>
                <h1 className="mt-2 text-3xl font-bold text-white">Account Settings</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
                  Manage your profile, security settings, and account picture without leaving the faculty workspace.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-bold text-[var(--primary)]">
                  {user?.firstName?.charAt(0) || "F"}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-white/80">{roleLabel}</p>
                  <p className="text-xs text-white/65">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mx-6 mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:mx-8">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mx-6 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:mx-8">
              {errorMessage}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-6 py-4 md:px-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white p-6 md:p-8">
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 capitalize"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave className="w-4 h-4" />
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Profile Picture Tab */}
            {activeTab === 'picture' && (
              <form onSubmit={handleProfilePictureSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FaUser className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaCamera className="w-5 h-5" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <p className="mt-4 text-sm text-gray-500">
                    Click the camera icon to upload a new profile picture
                  </p>
                </div>

                {previewImage && (
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(user?.profilePicture || '')}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      <FaTimes className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  <button
                    type="submit"
                    disabled={isUpdatingPicture || !previewImage}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave className="w-4 h-4" />
                    {isUpdatingPicture ? 'Updating...' : 'Update Picture'}
                  </button>
                </div>
              </form>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> After changing your password, you will need to log in again with your new password.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaLock className="w-4 h-4" />
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        email={user?.email || ''}
        purpose={otpPurpose}
        onVerifySuccess={handleOTPVerified}
      />
    </div>
  );
};

export default Profile;
