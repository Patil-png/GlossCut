import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [oauthError, setOauthError] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/api/auth/user');
                    setUser(res.data);
                } catch (error) {
                    console.error('Failed to load user', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (identifier, password) => {
        try {
            // Using the barber login endpoint as per the mobile app
            const res = await api.post('/api/auth/barber/login', { email: identifier, password });
            const { token } = res.data;
 
            localStorage.setItem('token', token);
 
            // Load user profile
            const userRes = await api.get('/api/auth/user');
            setUser(userRes.data);
 
            return { success: true };
        } catch (error) {
            console.error('Login error for identifier:', identifier, error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.msg || error.response?.data?.message || 'Login failed'
            };
        }
    };

    const syncPushSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                // Already has a local subscription, sync it with the NEW user ID
                await api.post('/api/webpush/subscribe', { subscription }).catch(e => console.error("Sync error:", e));
            }
        } catch (error) {
            console.error('Failed to auto-sync push notifications:', error);
        }
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await api.get('/api/auth/user');
                setUser(res.data);
            } catch (error) {
                console.error('Failed to refresh user', error);
            }
        }
    };

    const logout = async () => {
        try {
            // Unsubscribe from web push before losing auth token to stop cross-account leaks
            if (localStorage.getItem('token')) {
                await api.post('/api/webpush/unsubscribe').catch(() => {});
            }
        } catch (err) {
            console.error('Error during logout unsubscribe:', err);
        }
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const isMainOwner = user?.isMainOwner || (user?.user && user.user.isMainOwner) || false;

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isMainOwner, refreshUser, syncPushSubscription, oauthError, setOauthError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
