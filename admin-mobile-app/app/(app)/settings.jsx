import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(admin?.twoFactorEnabled || false);

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
            await axios.post('/api/admin/change-password', { currentPassword, newPassword });
            Alert.alert('Success', 'Password changed successfully');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
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
                        onPress={() => Alert.alert('Security Center', 'Detailed device management coming in next update.')}
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
                                <TextInput
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-black text-sm"
                                    placeholder="••••••••"
                                    placeholderTextColor="#CBD5E1"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</Text>
                                <TextInput
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-black text-sm"
                                    placeholder="••••••••"
                                    placeholderTextColor="#CBD5E1"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Identity</Text>
                                <TextInput
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-black text-sm"
                                    placeholder="••••••••"
                                    placeholderTextColor="#CBD5E1"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
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
        </View>
    );
}
