import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function SettingsScreen() {
    const { admin, logout } = useAuth();
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
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const SettingItem = ({ icon, title, subtitle, onPress, value, showArrow = true, danger = false }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`bg-white p-4 rounded-2xl mb-3 flex-row items-center ${danger ? 'border border-red-200' : ' border border-gray-100'}`}
            activeOpacity={0.7}
        >
            <View className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${danger ? 'bg-red-50' : 'bg-indigo-50'
                }`}>
                <Ionicons name={icon} size={20} color={danger ? '#EF4444' : '#6366F1'} />
            </View>
            <View className="flex-1">
                <Text className={`font-semibold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{title}</Text>
                {subtitle && <Text className="text-gray-500 text-xs mt-1">{subtitle}</Text>}
            </View>
            {value !== undefined ? (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                    thumbColor={value ? '#6366F1' : '#F3F4F6'}
                />
            ) : showArrow ? (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            ) : null}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                className="pt-12 pb-6 px-6"
            >
                <Text className="text-white text-3xl font-bold mb-1">Settings</Text>
                <Text className="text-indigo-200">Manage your account & preferences</Text>
            </LinearGradient>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
                    <View className="flex-row items-center">
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            className="h-16 w-16 rounded-2xl items-center justify-center"
                        >
                            <Text className="text-white text-2xl font-bold">
                                {admin?.email?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                        </LinearGradient>
                        <View className="flex-1 ml-4">
                            <Text className="text-lg font-bold text-gray-900">Admin Account</Text>
                            <Text className="text-gray-500">{admin?.email || 'admin@setkarr.com'}</Text>
                        </View>
                    </View>
                </View>

                {/* Security Section */}
                <Text className="text-xs font-semibold text-gray-500 uppercase mb-3 ml-2">Security</Text>

                <SettingItem
                    icon="lock-closed"
                    title="Change Password"
                    subtitle="Update your account password"
                    onPress={() => setShowPasswordModal(true)}
                />

                <SettingItem
                    icon="shield-checkmark"
                    title="Two-Factor Authentication"
                    subtitle={twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    value={twoFactorEnabled}
                    onPress={setTwoFactorEnabled}
                    showArrow={false}
                />

                {/* Preferences Section */}
                <Text className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-6 ml-2">Preferences</Text>

                <SettingItem
                    icon="notifications"
                    title="Push Notifications"
                    subtitle="Receive alerts for new bookings"
                    value={notificationsEnabled}
                    onPress={setNotificationsEnabled}
                    showArrow={false}
                />

                {/* Danger Zone */}
                <Text className="text-xs font-semibold text-red-500 uppercase mb-3 mt-6 ml-2">Danger Zone</Text>

                <SettingItem
                    icon="log-out-outline"
                    title="Logout"
                    subtitle="Sign out of your account"
                    onPress={handleLogout}
                    danger={true}
                />

                {/* Footer */}
                <View className="items-center py-8">
                    <Text className="text-gray-400 text-xs">SetKarr Admin v1.0.0</Text>
                    <Text className="text-gray-400 text-xs mt-1">© 2026 All rights reserved</Text>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-2xl font-bold text-gray-900">Change Password</Text>
                            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                                <Ionicons name="close" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">Current Password</Text>
                            <TextInput
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                placeholder="Enter current password"
                                placeholderTextColor="#9CA3AF"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">New Password</Text>
                            <TextInput
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                placeholder="Enter new password"
                                placeholderTextColor="#9CA3AF"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">Confirm Password</Text>
                            <TextInput
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                placeholder="Confirm new password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleChangePassword}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading ? ['#A5B4FC', '#C7D2FE'] : ['#6366F1', '#8B5CF6']}
                                className="w-full py-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-base">
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
