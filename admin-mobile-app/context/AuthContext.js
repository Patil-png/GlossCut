import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SecurityService } from '../services/SecurityService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Configure Axios defaults
    axios.defaults.baseURL = process.env.EXPO_PUBLIC_API_URL;

    useEffect(() => {
        const loadAdmin = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('adminToken');
                if (storedToken) {
                    setToken(storedToken);
                    axios.defaults.headers.common['x-auth-token'] = storedToken;
                    try {
                        const res = await axios.get('/api/admin/auth/admin');
                        setAdmin(res.data);
                    } catch (err) {
                        console.error('Error loading admin:', err);
                        await SecureStore.deleteItemAsync('adminToken');
                        setAdmin(null);
                        setToken(null);
                    }
                }
            } catch (e) {
                console.error('Failed to load token', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadAdmin();
    }, []);

    const login = async (email, password) => {
        try {
            // LEVEL 2: Device Binding Headers
            const device = await SecurityService.getDeviceFingerprint();

            const res = await axios.post('/api/admin/auth/login', { email, password }, {
                headers: {
                    'X-Device-Id': device.deviceId,
                    'X-Device-Model': device.deviceModel,
                    'X-Device-OS': device.os
                }
            });

            if (res.data.requiresTwoFactor) {
                return { requiresTwoFactor: true, adminId: res.data.adminId };
            }

            const newToken = res.data.token;
            setToken(newToken);
            axios.defaults.headers.common['x-auth-token'] = newToken;
            await SecureStore.setItemAsync('adminToken', newToken);

            const adminRes = await axios.get('/api/admin/auth/admin');
            setAdmin(adminRes.data);
            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            // Handle specific security errors
            if (err.response?.data?.unauthorizedDevice) {
                return { success: false, error: 'SECURITY ALERT: Device not authorized. Contact co-founder for access.' };
            }
            return { success: false, error: err.response?.data?.msg || 'Login failed' };
        }
    };

    const verify2FA = async (adminId, otp) => {
        try {
            // The original code uses 'token' param name in verfiy2FA but sends it as 'token' in body. 
            // AdminAuthContext.jsx: verify2FA(adminId, token) -> body: { adminId, token }
            // Login.jsx: verify2FA(adminId, otp)
            const res = await axios.post('/api/admin/auth/verify-2fa-login', { adminId, token: otp });

            const newToken = res.data.token;
            setToken(newToken);
            axios.defaults.headers.common['x-auth-token'] = newToken;
            await SecureStore.setItemAsync('adminToken', newToken);

            const adminRes = await axios.get('/api/admin/auth/admin');
            setAdmin(adminRes.data);
            return { success: true };
        } catch (err) {
            console.error('2FA Verification error:', err);
            return { success: false, error: err.response?.data?.msg || 'Invalid Code' };
        }
    };

    const logout = async () => {
        setToken(null);
        setAdmin(null);
        delete axios.defaults.headers.common['x-auth-token'];
        await SecureStore.deleteItemAsync('adminToken');
    };

    return (
        <AuthContext.Provider value={{
            admin,
            token,
            isLoading,
            login,
            verify2FA,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
