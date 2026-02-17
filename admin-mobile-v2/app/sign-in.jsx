import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
    const [email, setEmail] = useState('superadmin@setkarr.com');
    const [password, setPassword] = useState('superadmin123');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState('login'); // 'login' or '2fa'
    const [adminId, setAdminId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, verify2FA } = useAuth();
    const router = useRouter();

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            if (step === 'login') {
                const result = await login(email, password);
                if (result.requiresTwoFactor) {
                    setStep('2fa');
                    setAdminId(result.adminId);
                    setError('');
                } else if (result.success) {
                    router.replace('/');
                } else {
                    setError(result.error || 'Invalid credentials');
                }
            } else {
                const result = await verify2FA(adminId, otp);
                if (result.success) {
                    router.replace('/');
                } else {
                    setError(result.error || 'Invalid Code');
                }
            }
        } catch (e) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <Stack.Screen options={{ headerShown: false }} />

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View className="pt-20 pb-12 px-6">
                        {/* Logo/Icon */}
                        <View className="items-center mb-6">
                            <View
                                className="h-20 w-20 rounded-3xl items-center justify-center mb-6"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <Text className="text-4xl text-white font-bold">S</Text>
                            </View>
                            <Text className="text-white text-4xl font-bold tracking-tight">
                                {step === 'login' ? 'Welcome Back' : 'Verify Identity'}
                            </Text>
                            <Text className="text-indigo-100 text-base mt-2 text-center">
                                {step === 'login'
                                    ? 'Sign in to access your admin dashboard'
                                    : 'Enter the code from your authenticator app'}
                            </Text>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-8">
                        {step === 'login' ? (
                            <View>
                                {/* Email Input */}
                                <View className="mb-5">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Email Address</Text>
                                    <View className="relative">
                                        <View className="absolute left-4 top-4 z-10">
                                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                                        </View>
                                        <TextInput
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                            placeholder="admin@setkarr.com"
                                            placeholderTextColor="#9CA3AF"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            style={{ fontSize: 16 }}
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View className="mb-6">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
                                    <View className="relative">
                                        <View className="absolute left-4 top-4 z-10">
                                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                                        </View>
                                        <TextInput
                                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                            placeholder="Enter your password"
                                            placeholderTextColor="#9CA3AF"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            style={{ fontSize: 16 }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4"
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View>
                                {/* OTP Input */}
                                <View className="mb-6">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2 text-center">
                                        6-Digit Authentication Code
                                    </Text>
                                    <View className="items-center">
                                        <View className="relative">
                                            <View className="absolute left-4 top-5 z-10">
                                                <Ionicons name="shield-checkmark-outline" size={24} color="#6366F1" />
                                            </View>
                                            <TextInput
                                                className="w-full pl-14 pr-4 py-5 bg-indigo-50 border-2 border-indigo-300 rounded-2xl text-gray-900 text-center"
                                                placeholder="000000"
                                                placeholderTextColor="#A5B4FC"
                                                value={otp}
                                                onChangeText={setOtp}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                style={{ fontSize: 24, letterSpacing: 8, fontFamily: 'monospace', fontWeight: 'bold' }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Error Message */}
                        {error ? (
                            <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex-row items-start">
                                <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 8, marginTop: 2 }} />
                                <View className="flex-1">
                                    <Text className="text-red-800 font-semibold text-sm">Error</Text>
                                    <Text className="text-red-700 text-sm mt-1">{error}</Text>
                                </View>
                            </View>
                        ) : null}

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading ? ['#A5B4FC', '#C7D2FE'] : ['#6366F1', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="w-full py-4 rounded-xl items-center justify-center"
                                style={{
                                    shadowColor: '#6366F1',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 6
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-bold text-base mr-2">
                                            {step === 'login' ? 'Sign In' : 'Verify Code'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Back to Login (2FA Step) */}
                        {step === '2fa' && (
                            <TouchableOpacity
                                onPress={() => {
                                    setStep('login');
                                    setError('');
                                    setOtp('');
                                }}
                                className="mt-6 items-center py-3"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="arrow-back" size={16} color="#6366F1" />
                                    <Text className="text-indigo-600 font-semibold ml-2">Back to Login</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Default Credentials (Login Step) */}
                        {step === 'login' && (
                            <View className="mt-8 items-center">
                                <View className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-200">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="information-circle" size={16} color="#6B7280" />
                                        <Text className="text-xs font-semibold text-gray-600 ml-2 uppercase tracking-wide">
                                            Default Credentials
                                        </Text>
                                    </View>
                                    <View className="bg-white px-4 py-3 rounded-lg border border-gray-200">
                                        <Text className="text-sm text-gray-800 text-center" style={{ fontFamily: 'monospace' }}>
                                            superadmin@setkarr.com
                                        </Text>
                                        <View className="h-px bg-gray-200 my-2" />
                                        <Text className="text-sm text-gray-800 text-center" style={{ fontFamily: 'monospace' }}>
                                            superadmin123
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Footer */}
                        <View className="mt-auto pt-8">
                            <Text className="text-center text-gray-400 text-xs">
                                © 2026 SetKarr Admin • Secure & Encrypted
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}
