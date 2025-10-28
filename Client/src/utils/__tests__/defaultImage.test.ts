import { getDefaultProfileImage, getProfileImageUri } from '../defaultImage';

describe('defaultImage utils', () => {
  test('getDefaultProfileImage returns correct placeholder URL', () => {
    expect(getDefaultProfileImage(40)).toBe('https://placehold.co/40x40/E5E7EB/9CA3AF?text=👤');
    expect(getDefaultProfileImage(80)).toBe('https://placehold.co/80x80/E5E7EB/9CA3AF?text=👤');
  });

  test('getProfileImageUri returns provided image when available', () => {
    const testImage = 'https://example.com/profile.jpg';
    expect(getProfileImageUri(testImage, 40)).toBe(testImage);
  });

  test('getProfileImageUri returns default when image is not provided', () => {
    expect(getProfileImageUri(undefined, 40)).toBe('https://placehold.co/40x40/E5E7EB/9CA3AF?text=👤');
    expect(getProfileImageUri('', 40)).toBe('https://placehold.co/40x40/E5E7EB/9CA3AF?text=👤');
  });
});