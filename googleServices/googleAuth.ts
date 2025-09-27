import { Alert } from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  isErrorWithCode,
  User,
} from '@react-native-google-signin/google-signin';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '747146878644-r9j3vsdlpr4nr4pva09ueqpanaitgkdd.apps.googleusercontent.com'; 

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  idToken?: string;
  accessToken?: string;
}

export class GoogleAuthService {
  // Initialize Google Sign-In configuration
  static configure(): void {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_CLIENT_ID,
        offlineAccess: true, 
        hostedDomain: '', // specifies a hosted domain restriction
        forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
        accountName: 'CoinBreakr'
      });
    } catch (error) {
      console.error('Google Sign-In configuration error:', error);
    }
  }

  // Check if Google Play Services are available
  static async hasPlayServices(): Promise<boolean> {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      return true;
    } catch (err) {
      console.error('Play Services not available:', err);
      return false;
    }
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<GoogleUser | null> {
    try {
      // Ensure Google Sign-In is configured
      this.configure();

      // Check if Play Services are available (Android)
      const hasPlayServices = await this.hasPlayServices();
      if (!hasPlayServices) {
        Alert.alert(
          'Google Play Services Required',
          'This app requires Google Play Services to be installed and up to date.'
        );
        return null;
      }

      // Check if user is already signed in
      const userInfo = await GoogleSignin.getCurrentUser();
      if (userInfo) {
        return this.formatUserInfo(userInfo);
      }

      // Sign in
      const signInResult = await GoogleSignin.signIn();
      const newUserInfo = await GoogleSignin.getCurrentUser();
      
      if (newUserInfo) {
        return this.formatUserInfo(newUserInfo);
      }

      return null;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled the login flow
            console.log('User cancelled Google Sign-In');
            return null;
          case statusCodes.IN_PROGRESS:
            // Operation (e.g. sign in) is in progress already
            Alert.alert('Sign-In in Progress', 'Please wait for the current sign-in to complete.');
            return null;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Play services not available or outdated
            Alert.alert(
              'Google Play Services Required',
              'This app requires Google Play Services to be installed and up to date.'
            );
            return null;
          default:
            // Some other error happened
            Alert.alert(
              'Authentication Error',
              'Failed to sign in with Google. Please try again.'
            );
            return null;
        }
      } else {
        // An error that's not related to Google Sign-In occurred
        Alert.alert(
          'Authentication Error',
          'An unexpected error occurred. Please try again.'
        );
        return null;
      }
    }
  }

  // Format user info to match our interface
  private static formatUserInfo(userInfo: User): GoogleUser {
    return {
      id: userInfo.user.id,
      email: userInfo.user.email,
      name: userInfo.user.name || '',
      picture: userInfo.user.photo || undefined,
      idToken: userInfo.idToken || undefined,
      accessToken: undefined, // Access token is handled differently in this library
    };
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Sign Out Error',
        'Failed to sign out. Please try again.'
      );
    }
  }

  // Revoke access (completely disconnect the user)
  static async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
      console.log('User access revoked successfully');
    } catch (error) {
      console.error('Revoke access error:', error);
      Alert.alert(
        'Revoke Access Error',
        'Failed to revoke access. Please try again.'
      );
    }
  }

  // Get current user (if signed in)
  static async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      if (userInfo) {
        return this.formatUserInfo(userInfo);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Check if user is signed in
  static async isSignedIn(): Promise<boolean> {
    try {
      const user = await GoogleSignin.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error('Check sign-in status error:', error);
      return false;
    }
  }
}

