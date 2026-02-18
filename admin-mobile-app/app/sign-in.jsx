import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Dimensions, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SignIn() {
    const [email, setEmail] = useState('superadmin@setkarr.com');
    const [password, setPassword] = useState('superadmin123');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState('login'); // 'login' or '2fa'
    const [adminId, setAdminId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Animation Values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(50))[0];

    const { login, verify2FA } = useAuth();
    const router = useRouter();

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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
                colors={['#0F172A', '#1E293B', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <Stack.Screen options={{ headerShown: false }} />

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                            paddingHorizontal: 24,
                            width: '100%',
                            maxWidth: 500,
                            alignSelf: 'center'
                        }}
                    >
                        {/* Header Section */}
                        <View className="items-center mb-10">
                            <LinearGradient
                                colors={['#4F46E5', '#6366F1']}
                                className="h-24 w-24 rounded-3xl items-center justify-center mb-6 shadow-lg shadow-indigo-500/50"
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="shield-checkmark" size={48} color="white" />
                            </LinearGradient>

                            <Text className="text-white text-4xl font-black tracking-tighter text-center">
                                {step === 'login' ? 'Root Access' : 'Verify Identity'}
                            </Text>
                            <Text className="text-slate-400 text-sm font-bold uppercase tracking-[3px] mt-2 text-center">
                                {step === 'login' ? 'SetKarr Administration Console' : 'Two-Factor Authentication'}
                            </Text>
                        </View>

                        {/* Glassmorphic Form Container (Simulated with opacity) */}
                        <View className="bg-white/5 border border-white/10 rounded-[32px] p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            {step === 'login' ? (
                                <View className="space-y-5">
                                    {/* Email Input */}
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Administrator ID</Text>
                                        <View className="relative">
                                            <View className="absolute left-4 top-4 z-10">
                                                <Ionicons name="person-outline" size={20} color="#94A3B8" />
                                            </View>
                                            <TextInput
                                                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white font-medium"
                                                placeholder="admin@setkarr.com"
                                                placeholderTextColor="#64748B"
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                style={{ fontSize: 16 }}
                                            />
                                        </View>
                                    </View>

                                    {/* Password Input */}
                                    <View>
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Key</Text>
                                        <View className="relative">
                                            <View className="absolute left-4 top-4 z-10">
                                                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                            </View>
                                            <TextInput
                                                className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white font-medium"
                                                placeholder="Enter secure password"
                                                placeholderTextColor="#64748B"
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
                                                    color="#94A3B8"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    {/* OTP Input */}
                                    <View className="mb-6">
                                        <Text className="text-center text-slate-400 text-sm mb-6">
                                            Enter the 6-digit code from your authenticator app to verify ownership.
                                        </Text>
                                        <View className="items-center">
                                            <TextInput
                                                className="w-full py-5 bg-slate-800/50 border border-indigo-500/50 rounded-2xl text-white text-center font-bold tracking-[12px]"
                                                placeholder="000000"
                                                placeholderTextColor="#475569"
                                                value={otp}
                                                onChangeText={setOtp}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                style={{ fontSize: 28, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Error Message */}
                            {error ? (
                                <View className="mt-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex-row items-center">
                                    <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                                    <Text className="text-red-400 font-bold text-xs flex-1 uppercase tracking-wide">{error}</Text>
                                </View>
                            ) : null}

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.8}
                                className="mt-8 shadow-lg shadow-indigo-500/40"
                            >
                                <LinearGradient
                                    colors={loading ? ['#334155', '#475569'] : ['#4F46E5', '#6366F1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="w-full py-5 rounded-2xl items-center justify-center border-t border-white/10"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <View className="flex-row items-center">
                                            <Text className="text-white font-black text-base uppercase tracking-[2px] mr-2">
                                                {step === 'login' ? 'Authenticate' : 'Verify Access'}
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
                                    className="mt-6 items-center py-2"
                                >
                                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel Verification</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Footer Branding */}
                        <View className="mt-12 items-center opacity-60">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[2px] ml-2">256-Bit SSL Encrypted</Text>
                            </View>
                            <Text className="text-slate-500 text-[10px] font-medium">© 2026 SetKarr Dynamics • Internal Use Only</Text>
                        </View>

                    </Animated.View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}
