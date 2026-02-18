import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const { admin, logout } = useAuth();
    const router = useRouter();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(admin?.isTwoFactorEnabled || false);
    const [passwordTwoFactorCode, setPasswordTwoFactorCode] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Security Center Modal
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    // 2FA Modal
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const { enable2FA, verify2FASetup } = useAuth();

    const handleEnable2FA = async () => {
        setLoading(true);
        try {
            const res = await enable2FA();
            if (res.success) {
                setQrCodeUrl(res.qrCode);
                setTwoFactorSecret(res.secret);
            } else {
                Alert.alert('Error', res.error);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to generate 2FA setup.');
        } finally {
            setLoading(false);
        }
    };

    const handleVertify2FASetup = async () => {
        setLoading(true);
        try {
            const res = await verify2FASetup(twoFactorCode);
            if (res.success) {
                Alert.alert('Success', 'Two-Factor Authentication Enabled!');
                setShowTwoFactorModal(false);
                setTwoFactorEnabled(true);
            } else {
                Alert.alert('Error', res.error);
            }
        } catch (e) {
            Alert.alert('Error', 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/admin/auth/change-password', {
                currentPassword,
                newPassword,
                twoFactorCode: twoFactorEnabled ? passwordTwoFactorCode : undefined
            });
            Alert.alert('Success', 'Password changed successfully');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordTwoFactorCode('');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout Session',
            'Are you sure you want to end your active administrative session?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const SettingItem = ({ icon, title, subtitle, onPress, value, showArrow = true, danger = false }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`bg-white p-4 rounded-[24px] mb-3 flex-row items-center shadow-sm border ${danger ? 'border-red-50' : 'border-gray-100'}`}
            activeOpacity={0.7}
        >
            <View className={`h-11 w-11 rounded-2xl items-center justify-center mr-4 ${danger ? 'bg-red-50' : 'bg-indigo-50/50'}`}>
                <Ionicons name={icon} size={20} color={danger ? '#EF4444' : '#4F46E5'} />
            </View>
            <View className="flex-1">
                <Text className={`font-black tracking-tight text-sm ${danger ? 'text-red-600' : 'text-gray-900'}`}>{title}</Text>
                {subtitle && <Text className="text-gray-500 text-[10px] font-bold mt-0.5 uppercase tracking-tighter opacity-60">{subtitle}</Text>}
            </View>
            {value !== undefined ? (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                    thumbColor={value ? '#4F46E5' : '#F8FAFC'}
                />
            ) : showArrow ? (
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            ) : null}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                className="flex-1 px-4 mt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Profile Card */}
                <View className="bg-white rounded-[32px] p-6 mb-8 shadow-md border border-gray-100 shadow-gray-200">
                    <View className="flex-row items-center">
                        <LinearGradient
                            colors={['#4F46E5', '#6366F1']}
                            className="h-16 w-16 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200"
                        >
                            <Text className="text-white text-2xl font-black">
                                {admin?.email?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                        </LinearGradient>
                        <View className="flex-1 ml-4">
                            <View className="flex-row items-center mb-1">
                                <Text className="text-lg font-black text-gray-900 leading-tight">Admin Console</Text>
                                <View className="ml-2 w-2 h-2 bg-emerald-500 rounded-full" />
                            </View>
                            <Text className="text-gray-400 text-xs font-medium tracking-tight" numberOfLines={1}>{admin?.email || 'admin@glosscut.com'}</Text>
                        </View>
                        <View className="bg-indigo-50 px-2 py-1 rounded-lg">
                            <Text className="text-indigo-600 text-[8px] font-black uppercase">Active</Text>
                        </View>
                    </View>

                    <View className="mt-6 pt-6 border-t border-gray-50 flex-row justify-between">
                        <View className="items-center flex-1 border-r border-gray-50">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Permissions</Text>
                            <Text className="text-gray-900 font-black text-xs">Full Access</Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Last Login</Text>
                            <Text className="text-gray-900 font-black text-xs">Today</Text>
                        </View>
                    </View>
                </View>

                {/* Security Section */}
                <View className="mb-6">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-4">5-Level Safety Shield</Text>

                    <SettingItem
                        icon="shield-checkmark"
                        title="Security Center"
                        subtitle="Manage trusted devices & biometrics"
                        onPress={() => setShowSecurityModal(true)}
                    />

                    <SettingItem
                        icon="lock-closed"
                        title="Change Access Key"
                        subtitle="Update master password"
                        onPress={() => setShowPasswordModal(true)}
                    />

                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                '🔴 EMERGENCY LOCKDOWN',
                                'This will instantly kill all active sessions and lock the admin panel for everyone. Only the Super Admin can unlock it via database access.\n\nAre you sure?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'ACTIVATE KILL SWITCH',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await axios.post('/api/admin/auth/emergency-lock');
                                                Alert.alert('SYSTEM LOCKED', 'All access has been suspended.');
                                                logout();
                                            } catch (e) {
                                                Alert.alert('Error', 'Failed to activate lockdown.');
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                        className="bg-red-50 p-4 rounded-[24px] mb-3 flex-row items-center border border-red-100"
                        activeOpacity={0.7}
                    >
                        <View className="h-11 w-11 rounded-2xl items-center justify-center mr-4 bg-red-100">
                            <Ionicons name="alert-circle" size={24} color="#DC2626" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-black tracking-tight text-sm text-red-700">EMERGENCY KILL SWITCH</Text>
                            <Text className="text-red-500 text-[10px] font-bold mt-0.5 uppercase tracking-tighter opacity-80">Level 5: Global Lockdown</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <View className="mb-6">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-4">Live Preferences</Text>
                    <SettingItem
                        icon="notifications"
                        title="Real-time Alerts"
                        subtitle="Instant push notifications"
                        value={notificationsEnabled}
                        onPress={setNotificationsEnabled}
                        showArrow={false}
                    />
                    <SettingItem
                        icon="globe-outline"
                        title="System Region"
                        subtitle="Current Data Server: India"
                        onPress={() => { }}
                    />
                </View>

                {/* Danger Section */}
                <View className="mb-8">
                    <Text className="text-[10px] font-black text-red-400 uppercase tracking-[2px] mb-4 ml-4">Termination Zone</Text>
                    <SettingItem
                        icon="log-out-outline"
                        title="Logout Session"
                        subtitle="End portal administration"
                        onPress={handleLogout}
                        danger={true}
                    />
                </View>

                {/* Footer Branding */}
                <View className="items-center">
                    <View className="w-12 h-1 bg-gray-200 rounded-full mb-6" />
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[3px]">Glosscut Admin Ecosystem</Text>
                    <Text className="text-gray-300 text-[9px] font-bold mt-2 italic">© 2026 SetKarr Dynamics. All rights reserved.</Text>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showPasswordModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/60 justify-end"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1"
                        onPress={() => setShowPasswordModal(false)}
                    />
                    <View className="bg-white rounded-t-[40px] p-8">
                        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-8" />

                        <View className="flex-row items-center justify-between mb-8">
                            <View>
                                <Text className="text-2xl font-black text-gray-900 tracking-tight">Access Control</Text>
                                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Update Password</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowPasswordModal(false)}
                                className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center border border-gray-100"
                            >
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Password</Text>
                                <View className="w-full h-[52px] px-4 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center">
                                    <TextInput
                                        className="flex-1 h-full text-gray-900 font-black text-sm"
                                        placeholder="••••••••"
                                        placeholderTextColor="#CBD5E1"
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        secureTextEntry={!showCurrentPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                        <Ionicons name={showCurrentPassword ? "eye" : "eye-off"} size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</Text>
                                <View className="w-full h-[52px] px-4 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center">
                                    <TextInput
                                        className="flex-1 h-full text-gray-900 font-black text-sm"
                                        placeholder="••••••••"
                                        placeholderTextColor="#CBD5E1"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showNewPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                        <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Identity</Text>
                                <View className="w-full h-[52px] px-4 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center">
                                    <TextInput
                                        className="flex-1 h-full text-gray-900 font-black text-sm"
                                        placeholder="••••••••"
                                        placeholderTextColor="#CBD5E1"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* 2FA Input for Password Change */}
                            {twoFactorEnabled && (
                                <View>
                                    <Text className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">2FA Verification Code</Text>
                                    <View className="w-full h-[52px] px-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex-row items-center">
                                        <TextInput
                                            className="flex-1 h-full text-indigo-900 font-black text-lg tracking-widest text-center"
                                            placeholder="000 000"
                                            placeholderTextColor="#A5B4FC"
                                            value={passwordTwoFactorCode}
                                            onChangeText={setPasswordTwoFactorCode}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                        />
                                        <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
                                    </View>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleChangePassword}
                            disabled={loading}
                            activeOpacity={0.8}
                            className="mt-8 mb-4"
                        >
                            <LinearGradient
                                colors={loading ? ['#CBD5E1', '#E2E8F0'] : ['#4F46E5', '#6366F1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-full py-5 rounded-2xl items-center shadow-lg shadow-indigo-200"
                            >
                                <Text className="text-white font-black text-base uppercase tracking-widest">
                                    {loading ? 'Verifying...' : 'Authenticate Update'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Security Center Modal */}
            <Modal
                visible={showSecurityModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSecurityModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1"
                        onPress={() => setShowSecurityModal(false)}
                    />
                    <View className="bg-white rounded-t-[40px] h-[85%]">
                        <LinearGradient
                            colors={['#4F46E5', '#6366F1']}
                            className="p-6 rounded-t-[40px]"
                        >
                            <View className="w-12 h-1 bg-white/30 rounded-full self-center mb-6" />
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white text-2xl font-black">Security Center</Text>
                                    <Text className="text-indigo-100 text-xs font-bold uppercase tracking-wider mt-1">Level 2 & 3 Protection Active</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowSecurityModal(false)}
                                    className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center border border-white/30"
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <ScrollView className="flex-1 p-6">
                            {/* Device Auditing Section (Level 2) */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-8 h-8 bg-indigo-50 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="phone-portrait-outline" size={18} color="#4F46E5" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-black text-lg">Active Device Registry</Text>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Level 2: Audit & Monitoring</Text>
                                    </View>
                                </View>

                                {admin?.approvedDevices?.map((device, index) => (
                                    <View key={index} className="bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-100 flex-row items-center">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-3 shadow-sm">
                                            <Ionicons name={device.os?.toLowerCase().includes('ios') ? 'logo-apple' : 'logo-android'} size={20} color="#64748b" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-black text-sm">{device.deviceModel}</Text>
                                            <Text className="text-gray-400 text-xs font-medium">ID: ...{device.deviceId?.slice(-6)}</Text>
                                            {device.lastLogin && (
                                                <Text className="text-gray-400 text-[10px] mt-0.5">Last seen: {new Date(device.lastLogin).toLocaleDateString()}</Text>
                                            )}
                                        </View>
                                        <View className="bg-emerald-100 px-2 py-1 rounded-lg">
                                            <Text className="text-emerald-700 text-[8px] font-black uppercase">Authorized</Text>
                                        </View>
                                    </View>
                                ))}

                                <View className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2">
                                    <Text className="text-blue-600 text-xs font-medium leading-5">
                                        <Text className="font-black">Audit Log: </Text>
                                        All devices accessing your admin panel are logged here. If you see an unrecognized device, use the Emergency Kill Switch immediately.
                                    </Text>
                                </View>
                            </View>

                            {/* Biometric Section (Level 3) */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-8 h-8 bg-indigo-50 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="finger-print-outline" size={18} color="#4F46E5" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-black text-lg">Biometric Lock</Text>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Level 3: App Security</Text>
                                    </View>
                                </View>

                                <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center justify-between">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-gray-900 font-bold text-sm">FaceID / TouchID</Text>
                                        <Text className="text-gray-400 text-xs mt-0.5">Require biometrics to open app</Text>
                                    </View>
                                    <Switch
                                        value={true}
                                        onValueChange={() => Alert.alert('Security', 'Biometric lock is enforced by system policy.')}
                                        trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                                        thumbColor={'#4F46E5'}
                                    />
                                </View>
                            </View>

                            {/* 2FA Section (Level 4) */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-8 h-8 bg-indigo-50 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="shield-checkmark-outline" size={18} color="#4F46E5" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-black text-lg">Google Authenticator (2FA)</Text>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Level 4: Identity Verification</Text>
                                    </View>
                                </View>

                                {admin?.isTwoFactorEnabled ? (
                                    <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex-row items-center">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-3 shadow-sm">
                                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-emerald-800 font-black text-sm">2FA Enabled</Text>
                                            <Text className="text-emerald-600 text-xs font-medium">Your account is secured with TOTP.</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => setShowTwoFactorModal(true)}
                                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center"
                                    >
                                        <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                                            <Ionicons name="qr-code-outline" size={20} color="#4F46E5" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-black text-sm">Enable 2FA</Text>
                                            <Text className="text-gray-400 text-xs font-medium">Scan QR code to secure account</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Emergency Section (Level 5) */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-black text-lg">Emergency Protocols</Text>
                                        <Text className="text-red-400 text-[10px] font-bold uppercase tracking-wide">Level 5: Global Safety</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        setShowSecurityModal(false);
                                        // Slight delay to allow modal to close before showing alert
                                        setTimeout(() => {
                                            Alert.alert(
                                                '🔴 EMERGENCY LOCKDOWN',
                                                'This will instantly kill all active sessions. Are you sure?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'ACTIVATE',
                                                        style: 'destructive',
                                                        onPress: async () => {
                                                            try {
                                                                await axios.post('/api/admin/auth/emergency-lock');
                                                                logout();
                                                            } catch (e) { }
                                                        }
                                                    }
                                                ]
                                            );
                                        }, 500);
                                    }}
                                    className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center"
                                >
                                    <View className="bg-red-100 w-10 h-10 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="nuclear" size={20} color="#DC2626" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-red-700 font-black text-sm">Initiate Lockdown</Text>
                                        <Text className="text-red-500 text-xs opacity-80">Kill all sessions immediately</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
                                </TouchableOpacity>
                            </View>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 2FA Setup Modal */}
            <Modal
                visible={showTwoFactorModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTwoFactorModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/60 justify-end"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1"
                        onPress={() => setShowTwoFactorModal(false)}
                    />
                    <View className="bg-white rounded-t-[40px] h-[85%]">
                        <LinearGradient
                            colors={['#4F46E5', '#6366F1']}
                            className="p-6 rounded-t-[40px]"
                        >
                            <View className="w-12 h-1 bg-white/30 rounded-full self-center mb-6" />
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white text-2xl font-black">Two-Factor Setup</Text>
                                    <Text className="text-indigo-100 text-xs font-bold uppercase tracking-wider mt-1">Enhance Account Security</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowTwoFactorModal(false)}
                                    className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center border border-white/30"
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                            <View className="items-center mb-8">
                                <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
                                    <Ionicons name="shield-checkmark" size={32} color="#4F46E5" />
                                </View>
                                <Text className="text-gray-900 text-xl font-black text-center mb-2">Secure Your Account</Text>
                                <Text className="text-gray-500 text-sm text-center px-8">
                                    Scan the QR code below with your Google Authenticator app.
                                </Text>
                            </View>

                            {qrCodeUrl ? (
                                <View className="items-center mb-8">
                                    <View className="p-4 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
                                        <Image
                                            source={{ uri: qrCodeUrl }}
                                            style={{ width: 200, height: 200 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-4">Scan with Authenticator App</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleEnable2FA}
                                    disabled={loading}
                                    className="bg-gray-50 p-6 rounded-3xl border border-gray-100 items-center justify-center mb-8 h-64"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#4F46E5" />
                                    ) : (
                                        <View className="items-center">
                                            <Ionicons name="qr-code" size={48} color="#CBD5E1" />
                                            <Text className="text-indigo-600 font-bold mt-4">Tap to Generate QR Code</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Verification Code</Text>
                                <TextInput
                                    className="w-full py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 text-center font-bold tracking-[8px] text-xl"
                                    placeholder="000000"
                                    placeholderTextColor="#CBD5E1"
                                    value={twoFactorCode}
                                    onChangeText={setTwoFactorCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleVertify2FASetup}
                                disabled={loading || twoFactorCode.length !== 6}
                                className={`mt-8 py-5 rounded-2xl items-center shadow-lg shadow-indigo-200 ${twoFactorCode.length === 6 ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black text-base uppercase tracking-widest">Verify & Enable</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
