'use client';

import { LogOut, ShieldCheck, User, Upload } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SettingsPageClientProps {
  admin: {
    fullName: string;
    email: string;
    username: string;
    lastLogin: string | null;
    profilePicture?: string | null;
  };
}

const passwordStrengthChecks = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Uppercase and lowercase letters', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'At least one number', test: (value: string) => /\d/.test(value) },
  { label: 'At least one special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export default function SettingsPageClient({ admin }: SettingsPageClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState({ fullName: admin.fullName, email: admin.email, username: admin.username });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [currentImage, setCurrentImage] = useState<string | null>(admin.profilePicture ?? null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setCurrentImage(admin.profilePicture ?? null);
  }, [admin.profilePicture]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const passwordStrength = useMemo(() => {
  const passedChecks = passwordStrengthChecks.filter((check) =>
    check.test(passwordForm.newPassword)
  ).length;

  if (!passwordForm.newPassword) return 'Enter a new password';

  if (passedChecks <= 1) return 'Weak';

  if (passedChecks <= 3) return 'Medium';

  return 'Strong';
}, [passwordForm.newPassword]);

  async function handleProfilePictureUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be 2MB or less.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCurrentImage(previewUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/settings/profile-picture', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to upload profile picture.');
      }

      setCurrentImage(result.profilePicture || previewUrl);
      toast.success('Profile picture updated successfully.');
    } catch (error) {
      console.error(error);
      setCurrentImage(admin.profilePicture ?? null);
      toast.error(error instanceof Error ? error.message : 'Unable to upload profile picture.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  function validateProfile() {
    const nextErrors: { fullName?: string; email?: string } = {};

    if (!profile.fullName.trim()) {
      nextErrors.fullName = 'Admin name is required.';
    }

    if (!profile.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSaveProfile() {
    if (!validateProfile()) {
      toast.error('Please fix the highlighted information.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: profile.fullName.trim(), email: profile.email.trim().toLowerCase() }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || 'Unable to save profile information.');
        return;
      }

      toast.success('Admin profile saved successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to save profile right now.');
    } finally {
      setIsSaving(false);
    }
  }

  function validatePasswordForm() {
    const nextErrors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword.trim()) {
      nextErrors.newPassword = 'New password is required.';
    } else if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(passwordForm.newPassword) || !/[a-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword) || !/[^A-Za-z0-9]/.test(passwordForm.newPassword)) {
      nextErrors.newPassword = 'Use uppercase, lowercase, numbers, and special characters.';
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handlePasswordSubmit() {
    if (!validatePasswordForm()) {
      toast.error('Please fix the password errors.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await fetch('/api/admin/settings/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || 'Unable to update password.');
        return;
      }

      try {
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'auth',
            title: 'Password Changed',
            description: 'The admin password was changed successfully.',
          }),
        });
      } catch (error) {
        console.error('Failed to log password change activity:', error);
      }
      toast.success('Password updated successfully.');
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      console.error(error);
      toast.error('Unable to change password right now.');
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      try {
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'auth',
            title: 'Admin Logout',
            description: 'The admin logged out successfully.',
          }),
        });
      } catch (error) {
        console.error('Failed to log logout activity:', error);
      }
      toast.success('Logged out successfully.');
      router.push('/login');
    } catch (error) {
      console.error(error);
      toast.error('Unable to logout right now.');
    } finally {
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-4 pt-0">
      <div className="space-y-4">
        <section className="rounded-[32px] border border-[#E8DFFB] bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-0.5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#F5EEFF] text-[#7F63C7] shadow-sm">
                  <User size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Admin Account</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#2F3340]">Manage your profile securely</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#F4EEFF] px-4 py-2 text-sm font-semibold text-[#5D3B82] transition hover:bg-[#E8D3FF]"
              >
                <ShieldCheck size={16} />
                Change Password
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#E9E0F7] bg-[#FCFCFD] p-6 sm:flex-row">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#C9B1F4] to-[#B79CED] text-2xl font-semibold text-white">
                  {currentImage ? (
                    <img src={currentImage} alt="Admin profile" className="h-full w-full object-cover" />
                  ) : (
                    admin.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-[#2F3340]">Profile Picture</p>
                  <p className="mt-1 text-sm text-[#6D7280]">JPG, PNG, or WEBP. Max 2MB.</p>
                  <label className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#7F63C7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6D4AC0]">
                    <Upload size={16} />
                    {isUploading ? 'Uploading...' : 'Upload Picture'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleProfilePictureUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4B5563]">Admin Name</span>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                  className="w-full rounded-3xl border border-[#E9E0F7] bg-[#FBF8FF] px-4 py-3 text-sm text-[#2F3340] outline-none transition focus:border-[#C9B1F4] focus:ring-2 focus:ring-[#E8DFFB]"
                  placeholder="Administrator name"
                />
                {errors.fullName ? <p className="text-sm text-[#C2410C]">{errors.fullName}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4B5563]">Email Address</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-3xl border border-[#E9E0F7] bg-[#FBF8FF] px-4 py-3 text-sm text-[#2F3340] outline-none transition focus:border-[#C9B1F4] focus:ring-2 focus:ring-[#E8DFFB]"
                  placeholder="admin@example.com"
                />
                {errors.email ? <p className="text-sm text-[#C2410C]">{errors.email}</p> : null}
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#E9E0F7] bg-[#FCFCFD] p-4 text-sm text-[#4B5563]">
                <p className="font-semibold text-[#2F3340]">Username</p>
                <p className="mt-2 break-all">{profile.username || '—'}</p>
              </div>
              <div className="rounded-3xl border border-[#E9E0F7] bg-[#FCFCFD] p-4 text-sm text-[#4B5563]">
                <p className="font-semibold text-[#2F3340]">Last Login</p>
                <p className="mt-2">{admin.lastLogin || 'Not available'}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#6D7280]">Keep account details current for secure access.</p>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-3xl bg-[#7F63C7] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7F63C7]/10 transition hover:bg-[#6D4AC0] disabled:cursor-not-allowed disabled:bg-[#A49AC9]"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

        </div>

      {passwordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Change Password</p>
                <h3 className="mt-3 text-2xl font-semibold text-[#2F3340]">Secure your account</h3>
              </div>
              <button type="button" onClick={() => setPasswordModalOpen(false)} className="text-[#6D7280] transition hover:text-[#2F3340]">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4B5563]">Current Password</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="w-full rounded-3xl border border-[#E9E0F7] bg-[#FBF8FF] px-4 py-3 text-sm text-[#2F3340] outline-none focus:border-[#C9B1F4] focus:ring-2 focus:ring-[#E8DFFB]"
                />
                {passwordErrors.currentPassword ? <p className="text-sm text-[#C2410C]">{passwordErrors.currentPassword}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4B5563]">New Password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="w-full rounded-3xl border border-[#E9E0F7] bg-[#FBF8FF] px-4 py-3 text-sm text-[#2F3340] outline-none focus:border-[#C9B1F4] focus:ring-2 focus:ring-[#E8DFFB]"
                />
                {passwordErrors.newPassword ? <p className="text-sm text-[#C2410C]">{passwordErrors.newPassword}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4B5563]">Confirm New Password</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-3xl border border-[#E9E0F7] bg-[#FBF8FF] px-4 py-3 text-sm text-[#2F3340] outline-none focus:border-[#C9B1F4] focus:ring-2 focus:ring-[#E8DFFB]"
                />
                {passwordErrors.confirmPassword ? <p className="text-sm text-[#C2410C]">{passwordErrors.confirmPassword}</p> : null}
              </label>

              <div className="rounded-3xl border border-[#E9E0F7] bg-[#FCFCFD] p-4 text-sm text-[#4B5563]">
                <p className="font-semibold text-[#2F3340]">Password strength</p>
                <p className="mt-2 text-sm text-[#6D7280]">{passwordStrength}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-3xl border border-[#E9E0F7] bg-[#FCFCFD] px-5 py-3 text-sm font-semibold text-[#4B5563] transition hover:border-[#D7C8F8] hover:bg-[#F5F0FF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordSubmit}
                disabled={isSubmittingPassword}
                className="rounded-3xl bg-[#7F63C7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D4AC0] disabled:cursor-not-allowed disabled:bg-[#A49AC9]"
              >
                {isSubmittingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {logoutConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#F4EEFF] text-[#7F63C7]">
                <LogOut size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Logout</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#2F3340]">Are you sure you want to logout?</h3>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-3xl border border-[#E9E0F7] bg-[#FCFCFD] px-5 py-3 text-sm font-semibold text-[#4B5563] transition hover:border-[#D7C8F8] hover:bg-[#F5F0FF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-3xl bg-[#D8B4FE] px-5 py-3 text-sm font-semibold text-[#4B2565] transition hover:bg-[#C292FF] disabled:cursor-not-allowed disabled:bg-[#E9D6FF]"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
