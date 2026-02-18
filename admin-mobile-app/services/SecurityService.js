import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * 5-LEVEL SECURITY SERVICE
 * Level 2: Device Binding
 * Level 3: Biometric Lock
 */
export const SecurityService = {
    // LEVEL 2: Get Unique Device Fingerprint
    getDeviceFingerprint: async () => {
        let deviceId = 'unknown';

        if (Platform.OS === 'android') {
            deviceId = Application.androidId;
        } else if (Platform.OS === 'ios') {
            deviceId = await Application.getIosIdForVendorAsync();
        }

        return {
            deviceId: deviceId || 'unknown-device-id',
            deviceModel: Device.modelName || 'Unknown Model',
            os: `${Device.osName} ${Device.osVersion}`,
            deviceName: Device.deviceName || 'Admin Device'
        };
    },

    // LEVEL 3: Biometric Authentication
    authenticateBiometrics: async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // Determine fallback if biometrics not available (e.g. true for now, or force PIN)
                console.log('Biometrics not available or enrolled');
                return true;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify Admin Identity',
                fallbackLabel: 'Use Passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            return result.success;
        } catch (error) {
            console.error('Biometric Auth Error:', error);
            return false;
        }
    },

    // Secure Storage Wrapper
    saveSecureItem: async (key, value) => {
        await SecureStore.setItemAsync(key, value);
    },

    getSecureItem: async (key) => {
        return await SecureStore.getItemAsync(key);
    },

    deleteSecureItem: async (key) => {
        await SecureStore.deleteItemAsync(key);
    }
};
