# Splitlyr Mobile App

A React Native mobile application for splitting expenses with friends and groups, built with Expo and TypeScript.

## 📱 Overview

Splitlyr is a comprehensive expense-splitting mobile app that helps users track shared expenses, manage debts, and organize finances with friends and family. The app provides an intuitive interface for creating groups, adding friends, and managing shared costs seamlessly.

## ✨ Key Features

### 🔐 Authentication & Profile Management
- **User Registration & Login**: Secure authentication system
- **Profile Management**: Update personal information, profile pictures, and contact details
- **Password Management**: Change passwords securely
- **Onboarding Flow**: 4-screen guided introduction for new users

### 👥 Friends Management
- **Add Friends**: Multiple ways to add friends:
  - Search by email or name
  - Import from device contacts (with permission)
  - Invite non-users via SMS
- **Friend Profiles**: View friend details and transaction history
- **Pending Invitations**: Track sent and received friend requests
- **Contact Sync**: Seamlessly integrate with device contacts

### 🏷️ Groups Management
- **Create Groups**: Organize friends into groups for shared expenses
- **Group Members**: Add/remove members and manage roles
- **Group Settings**: Customize group details and descriptions
- **Multi-member Expenses**: Split costs among multiple people

### 💰 Expense Tracking
- **Add Expenses**: Record shared costs with detailed information
- **Expense Categories**: Organize expenses by type
- **Split Methods**: Various ways to divide costs
- **Transaction History**: View detailed expense records
- **Debt Tracking**: Monitor who owes what to whom

### 📱 User Experience
- **Intuitive Navigation**: Bottom tab navigation with stack navigators
- **Responsive Design**: Optimized for various screen sizes
- **Offline Support**: Local data caching with AsyncStorage
- **Pull-to-Refresh**: Easy data synchronization
- **Floating Action Buttons**: Quick access to common actions

## 🛠️ Technical Stack

### Core Technologies
- **React Native**: 0.81.5
- **Expo**: 54.0.20
- **TypeScript**: ~5.9.2
- **React Navigation**: v7 (Stack & Bottom Tabs)

### Key Dependencies
- **@react-navigation/native**: Navigation framework
- **@react-native-async-storage/async-storage**: Local data persistence
- **expo-contacts**: Device contacts integration
- **expo-image-picker**: Profile image selection
- **react-native-gesture-handler**: Enhanced touch interactions
- **react-native-reanimated**: Smooth animations
- **@expo/vector-icons**: Icon library

### Development Tools
- **EAS CLI**: Build and deployment management
- **Expo Dev Client**: Development builds
- **TypeScript**: Type safety and better development experience

## 📁 Project Structure

```
Client/
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/             # App configuration (API, constants)
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation setup and navigators
│   ├── screens/            # Screen components
│   │   ├── friends/        # Friend-related screens
│   │   ├── groups/         # Group management screens
│   │   ├── onboarding/     # App introduction screens
│   │   └── profile/        # User profile and auth screens
│   ├── services/           # API services and data management
│   ├── theme/              # Design system (colors, typography)
│   └── utils/              # Utility functions and helpers
├── assets/                 # Images, icons, and static assets
├── .env.example           # Environment variables template
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on specific platforms**
   ```bash
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   npm run web      # Web browser
   ```

## 🔧 Configuration

### API Configuration
The app connects to a backend API with automatic failover configuration managed through environment variables.

API configuration is managed in `src/config/api.ts` with health checks and automatic switching between primary and fallback URLs.

### Environment Setup

#### Environment Variables
Create a `.env` file in the root directory with the following variables:

```bash
# API Configuration
EXPO_PUBLIC_API_DOMAIN_URL=http://your-api-domain.com
EXPO_PUBLIC_API_FALLBACK_IP=127.0.0.1
EXPO_PUBLIC_API_PORT=3000
EXPO_PUBLIC_API_VERSION=v1

# API Timeouts (in milliseconds)
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3
EXPO_PUBLIC_HEALTH_CHECK_TIMEOUT=5000
```

**Note**: Use the `.env.example` file as a template. The `.env` file is gitignored for security.

#### Build Profiles
- **Development**: Uses Expo development client
- **Preview**: Internal distribution builds
- **Production**: App store ready builds with auto-increment

## 📱 App Flow

### First-Time Users
1. **Onboarding**: 4-screen introduction to app features
2. **Authentication**: Register or login
3. **Profile Setup**: Complete profile information
4. **Add Friends**: Start building friend network
5. **Create Groups**: Organize friends for shared expenses

### Returning Users
1. **Authentication**: Quick login
2. **Dashboard**: Access friends, groups, and expenses
3. **Quick Actions**: Use floating action buttons for common tasks

## 🎨 Design System

### Color Scheme
- **Primary**: Blue-based color palette
- **Background**: Light theme with subtle grays
- **Text**: Hierarchical text colors for readability
- **Status**: Success, warning, and error states

### Typography
- **Headers**: Bold, prominent titles
- **Body**: Readable text with proper line heights
- **Labels**: Subtle, informative text

### Components
- **Cards**: Elevated surfaces for content grouping
- **Buttons**: Primary, secondary, and text variants
- **Forms**: Consistent input styling and validation
- **Navigation**: Clear visual hierarchy

## 🔒 Permissions

The app requests the following permissions:
- **Contacts**: To import friends from device contacts
- **Camera/Photo Library**: For profile picture uploads
- **SMS**: To send invitations to non-users (Android)

## 🚀 Build & Deployment

### Development Builds
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Builds
```bash
eas build --profile production --platform all
```

### App Store Submission
```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## 🧪 Testing

The app includes comprehensive error handling and user feedback:
- **Network Error Handling**: Graceful API failure management
- **Form Validation**: Client-side input validation
- **Loading States**: User feedback during async operations
- **Error Messages**: Clear, actionable error communication

## 📈 Performance Features

- **Lazy Loading**: Screens loaded on demand
- **Image Optimization**: Efficient image handling and caching
- **Memory Management**: Proper cleanup of resources
- **Network Optimization**: Request batching and caching
- **Smooth Animations**: 60fps animations with Reanimated

## 🔄 State Management

- **Local State**: React hooks for component state
- **Persistent Storage**: AsyncStorage for user preferences
- **API State**: Service layer for backend communication
- **Navigation State**: React Navigation state management

## 🛡️ Security

- **JWT Authentication**: Secure token-based authentication
- **API Security**: Bearer token authorization
- **Data Validation**: Input sanitization and validation
- **Secure Storage**: Encrypted local storage for sensitive data

## 📞 Support & Maintenance

### Common Issues
- **API Connection**: Check network connectivity, API health, and environment variables
- **Environment Variables**: Ensure `.env` file is properly configured
- **Contact Permissions**: Ensure proper permissions are granted
- **Build Issues**: Clear cache and reinstall dependencies

### Debugging
- **Expo DevTools**: Use Expo development tools for debugging
- **React Native Debugger**: Advanced debugging capabilities
- **Console Logs**: Comprehensive logging throughout the app

## 🔮 Future Enhancements

- **Push Notifications**: Real-time expense updates
- **Offline Mode**: Full offline functionality
- **Receipt Scanning**: OCR for automatic expense entry
- **Multi-currency Support**: International expense tracking
- **Advanced Analytics**: Spending insights and reports

---

**Package**: com.clestiq.splitlyr.app  
**Version**: 1.0.0  
**Expo SDK**: 54.0.20  
**React Native**: 0.81.5