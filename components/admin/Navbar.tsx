'use client';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
interface NavbarProps {
  userName: string;
  profilePicture?: string | null;
  onMenuClick?: () => void;
}

export default function Navbar({
  userName,
  profilePicture,
  onMenuClick,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(profilePicture ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  async function handleLogout() {
  await signOut({
    callbackUrl: '/login',
  });

}

  useEffect(() => {
    setCurrentImage(profilePicture ?? null);
  }, [profilePicture]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
      setCurrentImage(profilePicture ?? null);
      toast.error(error instanceof Error ? error.message : 'Unable to upload profile picture.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <button
  type="button"
  onClick={onMenuClick}
  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9E0F7] bg-white shadow-sm transition hover:bg-[#F8F4FF] lg:hidden"
>
  <Menu size={22} className="text-[#7F63C7]" />
</button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-3 rounded-full border border-[#E5E7EB] bg-white px-2 py-1.5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#C9B1F4] to-[#B79CED] text-sm font-semibold text-white">
              {currentImage ? (
                <img src={currentImage} alt="Admin profile" className="h-full w-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden pr-1 text-left sm:block">
              <p className="text-sm font-semibold text-[#2F3340]">{userName}</p>
              <p className="text-xs text-[#7D8290]">Super Admin</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4B5563] transition hover:bg-[#F8F4FF]">
                <Upload size={15} className="text-[#8B6AD3]" />
                {isUploading ? 'Uploading...' : 'Upload profile'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} />
              </label>
              <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#4B5563] transition hover:bg-[#F8F4FF]">
                Profile
              </button>
             <button type="button" onClick={handleLogout} className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#4B5563] transition hover:bg-[#F8F4FF]">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
