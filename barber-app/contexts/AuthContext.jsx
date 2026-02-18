import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform, Alert, AppState, View, StyleSheet } from 'react-native'; // <--- Added View, StyleSheet
import * as LinkingExpo from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import { setAuthLogout } from '../utils/api';
import api, { API_URL } from '../utils/api';
import { navigate } from '../navigation/RootNavigation';

// <--- UI ADDITION: Import the Lock Screen Component
// (Ensure BiometricLockScreen.js is in your components folder)
import BiometricLockScreen from '../components/BiometricLockScreen';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // OAuth error state for login-only flows
  const [oauthError, setOauthError] = useState(null);

  // Biometric Locking State
  const [isLocked, setIsLocked] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(null); // 'FACE' | 'FINGERPRINT' | 'IRIS'
  const appState = useRef(AppState.currentState);

  // Effect to set the logout callback for the API interceptor
  useEffect(() => {
    setAuthLogout(logout);
  }, []);

  // Check Biometric Support & Preference on Mount
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsSupported(compatible && enrolled);

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('FACE');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('FINGERPRINT');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('IRIS');
      }

      const savedPref = await AsyncStorage.getItem('useBiometrics');
      if (savedPref === 'true') {
        setBiometricsEnabled(true);
      }
    })();
  }, []);

  // --- ROOT/JAILBREAK DETECTION ---
  useEffect(() => {
    (async () => {
      try {
        const isRooted = await Device.isRootedExperimentalAsync();
        if (isRooted) {
          Alert.alert(
            "Security Warning",
            "This device appears to be rooted or jailbroken. For your security, some features may not work correctly, and your data could be at risk.",
            [{ text: "I Understand" }]
          );
        }
      } catch (e) {
        console.warn("Root detection failed:", e);
      }
    })();
  }, []);

  // AppState Listener (Auto-Lock on Background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - ONLY lock if enabled by user
        if (token && biometricsEnabled) {
          // We check 'biometricsEnabled' here which implies the user explicitly turned it on.
          // Even if hardware fails later, they opted in.
          setIsLocked(true);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [token, biometricsEnabled]);

  // Authenticate Function (Public)
  const authenticateBiometric = async () => {
    // If enabled but not supported (e.g. hardware broke), we still allow fallback
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricType === 'FACE' ? 'Scan Face to Unlock' : 'Scan Fingerprint to Unlock',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false, // CRITICAL: Allows PIN/Pattern if biometrics fail
        cancelLabel: 'Cancel'
      });

      if (result.success) {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Biometric Error:', error);
      // If error (e.g. no hardware), we might want to unlock or show PIN?
      // For security, we stay locked unless success.
    }
  };

  // Toggle Function (Public)
  const toggleBiometrics = async (value) => {
    if (value) {
      // If turning ON, verify identity first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Identity to Enable App Lock',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setBiometricsEnabled(true);
        await AsyncStorage.setItem('useBiometrics', 'true');
        return true;
      }
      return false;
    } else {
      // If turning OFF
      setBiometricsEnabled(false);
      await AsyncStorage.setItem('useBiometrics', 'false');
      return true;
    }
  };

  // Load user on startup
  useEffect(() => {
    const loadUser = async () => {
      // 1. Try to get token from Secure Storage
      let storedToken = await SecureStore.getItemAsync('token');

      if (storedToken) {
        ('🔒 SecureStore: Token successfully loaded from secure vault.');
      }

      // 2. MIGRATION LOGIC: If not in valid storage, check old AsyncStorage
      if (!storedToken) {
        const oldToken = await AsyncStorage.getItem('token');
        if (oldToken) {
          ('Migrating token to SecureStore...');
          await SecureStore.setItemAsync('token', oldToken);
          await AsyncStorage.removeItem('token');
          storedToken = oldToken;
        }
      }

      if (storedToken) {
        setToken(storedToken);

        // Read preference again to be sure
        const savedPref = await AsyncStorage.getItem('useBiometrics');

        // Lock immediately ONLY if preference is true
        // independent of current hardware check (trusting the saved pref)
        if (savedPref === 'true') {
          setIsLocked(true);
        }

        // Set header immediately for subsequent requests
        api.defaults.headers.common['x-auth-token'] = storedToken;
        api.defaults.headers.common['authorization'] = `Bearer ${storedToken}`;

        // CRITICAL FIX: Explicitly pass headers for the initial load to bypass any race conditions
        try {
          const res = await api.get('/api/auth/user', {
            headers: {
              'x-auth-token': storedToken,
              'Authorization': `Bearer ${storedToken}`
            }
          });
          setUser({
            ...res.data,
            id: res.data._id,
            token: storedToken,
            isMainOwner: res.data.isMainOwner || (res.data.user && res.data.user.isMainOwner)
          });
        } catch (err) {
          console.error('Load user error:', err);
          // Only logout if it's a genuine auth error, not network
          if (err.response && err.response.status === 401) {
            await logout();
          }
        }
      }
      setIsLoading(false);
    };

    loadUser();

    // ============================================================
    // HANDLE DEEP LINKS (OAuth Return)
    // ============================================================
    const handleDeepLink = async (event) => {
      const url = event.url;
      ('Deep Link Received:', url);

      // 1. Try standard parsing first
      let parsed = LinkingExpo.parse(url);
      let incomingToken = parsed.queryParams?.token;
      const error = parsed.queryParams?.error || (url.match(/[?&]error=([^&]+)/) || [])[1];

      // If OAuth returned a login-only error, show a friendly message and abort
      if (error === 'signup_not_allowed') {
        ('AuthContext: OAuth login-only error received via deep link');
        // Ensure Login screen is visible immediately and set state
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        ('AuthContext: setting oauthError signup_not_allowed');
        setOauthError('signup_not_allowed');
        Alert.alert('Login not allowed', 'This email does not exist in our system. Please sign in with your existing account. Tap "Sign up" to create an account.');
        return;
      }

      // If OAuth returned a role mismatch (e.g., non-barber trying to login via barber flow)
      if (error === 'role_not_allowed') {
        ('AuthContext: OAuth role mismatch received via deep link');
        const requiredRole = parsed.queryParams?.required_role || (url.match(/[?&]required_role=([^&]+)/) || [])[1];
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        setOauthError('role_not_allowed');
        Alert.alert('Access denied', `This Google account is not a ${requiredRole || 'barber'} account. Please sign in with an account that has the ${requiredRole || 'barber'} role or use a different login method.`);
        return;
      }

      // 2. Fallback: Manually extract token if parser failed
      // This fixes cases where Expo/Google hides the token in the path
      if (!incomingToken && url.includes('token=')) {
        const match = url.match(/token=([^&]*)/);
        if (match && match[1]) {
          incomingToken = match[1];
        }
      }

      if (incomingToken) {
        ('✅ Token found:', incomingToken);

        // 1. Save Token State
        setToken(incomingToken);
        await SecureStore.setItemAsync('token', incomingToken);

        // 2. Update Global Defaults (for future requests)
        api.defaults.headers.common['x-auth-token'] = incomingToken;
        api.defaults.headers.common['authorization'] = `Bearer ${incomingToken}`;

        // 3. CRITICAL FIX: Pass headers EXPLICITLY for this immediate request.
        // This prevents the 401 Race Condition where the request fires before 
        // AsyncStorage or Global Defaults are fully updated.
        api.get('/api/auth/user', {
          headers: { 'x-auth-token': incomingToken, 'Authorization': `Bearer ${incomingToken}` }
        })
          .then(res => {
            ('✅ User Profile Loaded:', res.data.email);
            setUser({
              ...res.data,
              id: res.data._id,
              token: incomingToken,
              isMainOwner: res.data.isMainOwner || (res.data.user && res.data.user.isMainOwner)
            });
          })
          .catch(err => {
            console.error('❌ Error loading user after OAuth:', err.message);
          });
      } else {
        ('❌ No token found in URL');
      }
    };

    // Listen for incoming links
    const subscription = LinkingExpo.addEventListener('url', handleDeepLink);

    // Check if app was opened via link (Cold Start)
    LinkingExpo.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const newToken = res.data.token;

      setToken(newToken);
      await SecureStore.setItemAsync('token', newToken);
      api.defaults.headers.common['x-auth-token'] = newToken;
      api.defaults.headers.common['authorization'] = `Bearer ${newToken}`;

      // Explicitly pass headers for immediately following request
      const userRes = await api.get('/api/auth/user', {
        headers: { 'x-auth-token': newToken, 'Authorization': `Bearer ${newToken}` }
      });
      setUser({
        ...userRes.data,
        id: userRes.data._id,
        token: newToken,
        isMainOwner: userRes.data.isMainOwner || (userRes.data.user && userRes.data.user.isMainOwner)
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const barberLogin = async (email, password) => {
    try {
      const res = await api.post('/api/auth/barber/login', { email, password });
      const newToken = res.data.token;

      setToken(newToken);
      await SecureStore.setItemAsync('token', newToken);
      api.defaults.headers.common['x-auth-token'] = newToken;
      api.defaults.headers.common['authorization'] = `Bearer ${newToken}`;

      const userRes = await api.get('/api/auth/user');
      setUser({
        ...userRes.data,
        id: userRes.data._id,
        token: newToken,
        isMainOwner: userRes.data.isMainOwner || (userRes.data.user && userRes.data.user.isMainOwner)
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend to clear push token
      await api.post('/api/auth/logout').catch(err => {
        // If API call fails, still proceed with local logout
        console.log('Backend logout failed, proceeding with local logout:', err.message);
      });
    } catch (error) {
      console.log('Logout API error:', error);
    }

    // Clear local state regardless of API success
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['x-auth-token'];
    await SecureStore.deleteItemAsync('token');
  };

  const updateProfile = async (data) => {
    try {
      // Explicitly pass headers to prevent race conditions or missing default headers
      await api.put('/api/auth/user', data, {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      });

      const userRes = await api.get('/api/auth/user', {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      });

      setUser({ ...userRes.data, id: userRes.data._id, token: token });
      return true;
    } catch (err) {
      console.error("Update profile error:", err);
      return false;
    }
  };

  const verifyTwoFactorOtp = async (email, otp) => {
    try {
      await api.post('/api/auth/2fa/verify', { token: otp });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const userRes = await api.get('/api/auth/user');
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // Only logout if it's a 401/403 to avoid losing session on temporary network blip
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
      }
    }
  }, [token, logout]);

  const updateShopProfile = async (data) => {
    try {
      await api.put('/api/shop', data);
      const userRes = await api.get('/api/auth/user');
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
      return true;
    } catch (err) {
      console.error('Error updating shop profile:', err);
      return false;
    }
  };

  const updateAvailability = async (isAvailable) => {
    try {
      await api.put('/api/auth/availability', { isAvailable });
      setUser(prev => prev ? { ...prev, isAvailable } : null);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================
  const googleLogin = async ({ loginOnly = false, requiredRole = null } = {}) => {
    try {
      const redirectUri = LinkingExpo.createURL('oauth');
      ('Generated Mobile Redirect:', redirectUri);

      const params = `mobile_redirect=${encodeURIComponent(redirectUri)}${loginOnly ? '&login_only=1' : ''}${requiredRole ? `&required_role=${encodeURIComponent(requiredRole)}` : ''}&prompt=select_account`;
      const oauthUrl = `${API_URL}/api/auth/google?${params}`;

      const supported = await Linking.canOpenURL(oauthUrl);
      if (supported) {
        await Linking.openURL(oauthUrl);
        return { success: true, message: 'Opening Google authentication...' };
      } else {
        return { success: false, message: 'Cannot open OAuth URL' };
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { success: false, message: 'Failed to initiate Google OAuth' };
    }
  };

  // ============================================================
  // PRIVACY SETTINGS
  // ============================================================
  const updatePrivacySettings = async (settings) => {
    try {
      // Optimistic update
      setUser(prev => ({
        ...prev,
        privacySettings: { ...prev.privacySettings, ...settings }
      }));

      const res = await api.put('/api/user/privacy-settings', settings);

      if (res.data.success) {
        // Confirm with server data
        setUser(prev => ({
          ...prev,
          privacySettings: res.data.privacySettings
        }));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      console.error('Privacy Update Error:', error);
      // Revert on error (optional, but good practice would be to re-fetch user)
      return { success: false, message: 'Failed to update settings' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      isLoading,
      login,
      barberLogin,
      googleLogin,
      logout,
      updateProfile,
      verifyTwoFactorOtp,
      refreshUser,
      updateAvailability,
      updateShopProfile,
      isLocked,
      authenticateBiometric,
      biometricsSupported,
      biometricsEnabled,
      toggleBiometrics,
      biometricType,
      updatePrivacySettings,
      isMainOwner: user?.isMainOwner || false
    }}>

      {/* UI ADDITION: Conditional Rendering for Lock Screen */}
      {isLocked && user ? (
        // If locked and user exists, we BLOCK the app with the Lock UI
        <View style={styles.lockContainer}>
          <BiometricLockScreen onUnlock={authenticateBiometric} biometricType={biometricType} />
        </View>
      ) : (
        // Otherwise, render the app normally
        children
      )}

    </AuthContext.Provider>
  );
};

// UI ADDITION: Styles to ensure lock screen covers everything
const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});

export const useAuth = () => useContext(AuthContext);