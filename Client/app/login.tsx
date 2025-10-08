import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { showComingSoonAlert, showSuccessAlert, showErrorAlert } from '../components/ui/alert';
import { AuthService } from '../googleServices/authService';

const { width, height } = Dimensions.get('window');

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const logoScale = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo animation
    logoScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Title animation
    opacity.value = withDelay(500, withSpring(1));
    translateY.value = withDelay(500, withSpring(0));
    
    // Form animation
    formOpacity.value = withDelay(800, withSpring(1));
    
    // Button animation
    buttonOpacity.value = withDelay(1100, withSpring(1));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleLogin = async () => {
    if (isAuthLoading) return;
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      showErrorAlert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showErrorAlert('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      showErrorAlert('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsAuthLoading(true);
    try {
      if (isSignup) {
        const response = await AuthService.signUp({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        showSuccessAlert(
          'Account Created!',
          `Welcome ${response.data.user.name}! Your account has been created successfully.`
        );
      } else {
        const response = await AuthService.signIn({
          email: email.trim().toLowerCase(),
          password,
        });
        showSuccessAlert(
          'Welcome Back!',
          `Hello ${response.data.user.name}! You have successfully signed in.`
        );
      }

      // Navigate to main app after successful auth
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    } catch (error: any) {
      showErrorAlert(
        'Authentication Failed',
        error.message || 'An error occurred during authentication. Please try again.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };


  const handleForgotPassword = () => {
    showComingSoonAlert('Forgot Password');
  };

  const handleToggleMode = () => {
    setIsSignup(!isSignup);
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleBackToOnboarding = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoBackground}>
            <Ionicons name="wallet" size={60} color="#ffffff" />
          </View>
        </Animated.View>

        <Animated.View style={titleAnimatedStyle}>
          <Text style={styles.title}>Welcome to CoinBreakr</Text>
          <Text style={styles.subtitle}>
            {isSignup ? 'Create an account to get started' : 'Sign in to start managing your expenses'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
          {isSignup && (
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#667eea" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="rgba(102, 126, 234, 0.6)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(102, 126, 234, 0.6)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(102, 126, 234, 0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#667eea" 
              />
            </Pressable>
          </View>

          {!isSignup && (
            <Pressable style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>
          )}
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable 
            style={[styles.loginButton, isAuthLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isAuthLoading}
          >
            <LinearGradient
              colors={['#ffffff', '#f8f9ff']}
              style={styles.gradientButton}
            >
              {isAuthLoading ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {isSignup ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>


          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <Pressable onPress={handleToggleMode}>
              <Text style={styles.signupLink}>
                {isSignup ? 'Sign In' : 'Sign Up'}
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.backButton} onPress={handleBackToOnboarding}>
            <Ionicons name="arrow-back" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.backButtonText}>Back to Onboarding</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#667eea',
    paddingVertical: 15,
  },
  passwordToggle: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 20,
  },
  loginButton: {
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  signupLink: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 8,
  },
});
