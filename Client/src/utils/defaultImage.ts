// Default image utility for consistent placeholder handling across the app
export const getDefaultProfileImage = (size: number = 40): string => {
  return `https://placehold.co/${size}x${size}/E5E7EB/9CA3AF?text=👤`;
};

export const getProfileImageUri = (profileImage?: string, size: number = 40): string => {
  return profileImage || getDefaultProfileImage(size);
};