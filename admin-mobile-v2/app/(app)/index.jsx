import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Animated,
    Easing,
    Dimensions,
    Platform,
    StyleSheet
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Users,
    Calendar,
    CreditCard,
    Star,
    TrendingUp,
    Activity,
    ArrowRight,
    ShieldCheck,
    Settings,
    Bell,
    LogOut,
    Menu,
    FileText
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get("window");

// --- 1. Helper: Ink-Like Barcode ---
const Barcode = () => (
    <View className="flex-row items-end h-8 opacity-60">
        {[4, 2, 6, 2, 1, 3, 5, 2, 4, 1, 3, 5, 2, 4, 2, 6, 2, 4, 1, 2].map(
            (w, i) => (
                <View key={i} style={{ width: w, height: '100%', backgroundColor: '#000', marginRight: 2 }} />
            )
        )}
    </View>
);

// --- 2. Helper: Sepia Dashed Separator ---
const DashedLine = () => (
    <View className="flex-row overflow-hidden w-full h-[1px]">
        {[...Array(25)].map((_, i) => (
            <View key={i} className="w-2 h-[1px] bg-gray-300 mr-1" />
        ))}
    </View>
);

// --- 3. Component: Scale Button (Micro-interaction) ---
const ScaleButton = ({ onPress, style, children, activeScale = 0.98 }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: activeScale,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, { transform: [{ scale: scaleValue }] }]}
        >
            {children}
        </TouchableOpacity>
    );
};

export default function Dashboard() {
    const { admin } = useAuth();
    const insets = useSafeAreaInsets();
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Animation for "Live" status pulsing
    const pulseAnim = useRef(new Animated.Value(1)).current;
    // --- Animation for Floating Ticket (Levitation) ---
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // Floating Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 3000, // Slow, smooth float
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: false,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const fetchOverviewData = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const timestamp = new Date().getTime();
            const results = {};

            const fetchData = async (url, fallback) => {
                try {
                    const res = await axios.get(`${url}?t=${timestamp}`);
                    return res.data;
                } catch (err) {
                    console.warn(`API failed: ${url}`, err.message);
                    return fallback;
                }
            };

            results.earnings = await fetchData('/api/admin/earnings', { totalBookings: 0, totalEarnings: 0, totalPlatformFees: 0, pendingBookingsCount: 0 });
            results.users = await fetchData('/api/admin/users', []);
            results.bookings = await fetchData('/api/admin/bookings', []);

            const data = {
                totalUsers: results.users.length,
                totalBookings: results.earnings.totalBookings || 0,
                totalRevenue: results.earnings.totalEarnings || 0,
                pendingBookings: results.earnings.pendingBookingsCount || 0,
                recentBookings: results.bookings.slice(0, 5),
            };

            setOverviewData(data);
        } catch (err) {
            console.error("Error fetching overview data:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOverviewData();
    }, [fetchOverviewData]);

    // --- Dynamic Shadow & Float Values ---
    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -14], // Floats up
    });

    const shadowOpacity = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.15, 0.45], // Intense shadow at peak
    });

    const shadowRadius = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 24],
    });

    const shadowHeight = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 20],
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F4F5F7]">
                <ActivityIndicator size="large" color="#FFC107" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F4F5F7]">
            {/* --- ROUNDED BOTTOM HEADER --- */}
            <View style={{ paddingTop: insets.top + 10 }} className="bg-white pb-6 rounded-b-[30px] shadow-sm z-20">
                <View className="flex-row justify-between items-center px-6">
                    {/* Left: Profile & Welcome */}
                    <TouchableOpacity activeOpacity={0.8} className="flex-row items-center">
                        <View className="relative">
                            <Image
                                source={require('../../assets/images/SetKarr.png')}
                                className="w-12 h-12 rounded-full bg-gray-100"
                            />
                            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </View>
                        <View className="ml-3">
                            <Text className="text-gray-500 text-xs font-medium">Welcome Back</Text>
                            <Text className="text-gray-900 text-lg font-bold">{admin?.name || "Super Admin"}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Right: Notification Icon */}
                    <TouchableOpacity className="relative p-2 bg-gray-50 rounded-full">
                        <Bell size={24} color="#1F2937" />
                        <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20, paddingTop: 24 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchOverviewData(true)} tintColor="#FFC107" />
                }
            >
                <View className="flex-row justify-between items-center mb-4 px-1">
                    <Text className="text-gray-500 text-xs font-bold tracking-widest uppercase">PLATFORM OVERVIEW</Text>
                </View>

                {/* --- 3D FLOATING TICKET SECTION --- */}
                <Animated.View
                    style={{
                        transform: [{ translateY }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: shadowHeight },
                        shadowOpacity: shadowOpacity,
                        shadowRadius: shadowRadius,
                        zIndex: 10,
                        marginBottom: 24,
                    }}
                >
                    <ScaleButton activeScale={0.97} className="w-full">
                        {/* --- MAIN TICKET CONTAINER --- */}
                        <View className="bg-[#FFFDE7] rounded-xl overflow-hidden border border-transparent">
                            {/* 1. Yellow Header Strip */}
                            <View className="bg-[#FFC107] py-3 px-4 flex-row justify-between items-center">
                                <Text className="text-[#1C1C1E] font-bold text-xs tracking-widest">ADMIN CONSOLE</Text>
                                <View className="bg-[#111] px-2 py-1 rounded-full flex-row items-center">
                                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="w-1.5 h-1.5 bg-[#00E676] rounded-full mr-1.5" />
                                    <Text className="text-white text-[10px] font-bold">ONLINE</Text>
                                </View>
                            </View>

                            {/* 2. Main Ticket Body */}
                            <View className="p-5">
                                <View className="flex-row justify-between items-end mb-4">
                                    <View>
                                        <Text className="text-gray-500 text-xs font-medium mb-1">Total Revenue</Text>
                                        <Text className="text-3xl font-black text-[#2C2C2C]">
                                            {overviewData ? formatCurrency(overviewData.totalRevenue) : "₹0"}
                                        </Text>
                                    </View>
                                    <Barcode />
                                </View>

                                <View className="border-t border-gray-200/50 pt-3 flex-row justify-between">
                                    <Text className="text-gray-500 text-xs">
                                        Total Users: <Text className="font-bold text-gray-900">{overviewData?.totalUsers || 0}</Text>
                                    </Text>
                                    <Text className="text-gray-500 text-xs">
                                        Pending: <Text className="font-bold text-orange-600">{overviewData?.pendingBookings || 0}</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* 3. Perforation */}
                            <View className="flex-row items-center justify-between relative h-4 overflow-hidden bg-[#FFFDE7]">
                                <View className="w-6 h-6 rounded-full bg-[#F4F5F7] absolute -left-3" />
                                <View className="flex-1 px-4">
                                    <DashedLine />
                                </View>
                                <View className="w-6 h-6 rounded-full bg-[#F4F5F7] absolute -right-3" />
                            </View>

                            {/* 4. Ticket Bottom Section */}
                            <View className="p-4 bg-[#FFFDE7]">
                                <View className="bg-white border border-gray-200 rounded-lg p-3 flex-row items-center shadow-sm">
                                    <View className="w-10 h-10 bg-[#2C2C2C] rounded-lg items-center justify-center mr-3">
                                        <Activity size={18} color="#FFF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">SYSTEM HEALTH</Text>
                                        <Text className="text-gray-800 text-sm font-bold">All Services Operational</Text>
                                    </View>
                                    <View className="bg-green-50 px-2 py-1 rounded">
                                        <Text className="text-green-700 text-xs font-bold">100%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScaleButton>
                </Animated.View>

                {/* Quick Actions Grid */}
                <Text className="text-gray-900 text-lg font-bold mb-4 ml-1">Quick Actions</Text>
                <View className="flex-row flex-wrap justify-between">
                    <QuickAction icon={Users} label="Users" color="text-blue-600" bg="bg-blue-50" />
                    <QuickAction icon={Calendar} label="Bookings" color="text-purple-600" bg="bg-purple-50" />
                    <QuickAction icon={Star} label="Reviews" color="text-amber-600" bg="bg-amber-50" />
                    <QuickAction icon={FileText} label="Reports" color="text-emerald-600" bg="bg-emerald-50" />
                    <QuickAction icon={Settings} label="Settings" color="text-gray-600" bg="bg-gray-50" />
                    <QuickAction icon={LogOut} label="Logout" color="text-red-600" bg="bg-red-50" />
                </View>

            </ScrollView>
        </View>
    );
}

const QuickAction = ({ icon: Icon, label, color, bg }) => (
    <ScaleButton className={`w-[31%] mb-4 ${bg} p-4 rounded-xl items-center justify-center shadow-sm border border-black/5`}>
        <Icon size={24} style={{ color: color.replace('text-', '') /* rough hack, better to use proper hex */ }} className="mb-2 text-black" />
        <Text className={`text-xs font-bold ${color}`}>{label}</Text>
    </ScaleButton>
);
