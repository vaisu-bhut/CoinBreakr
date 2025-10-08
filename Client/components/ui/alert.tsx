import { Alert } from 'react-native';

export const showComingSoonAlert = (feature: string) => {
  Alert.alert(
    'Coming Soon! 🚀',
    `${feature} will be available in a future update. Stay tuned!`,
    [{ text: 'OK', style: 'default' }]
  );
};

export const showSuccessAlert = (title: string, message: string) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'default' }]
  );
};

export const showErrorAlert = (title: string, message: string) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'default' }]
  );
};
