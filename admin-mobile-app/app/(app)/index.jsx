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
import { useRouter } from 'expo-router';
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
    FileText,
    Store
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get("window");

// --- 1. Helper functions (Removed unused Barcode/DashedLine) ---

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
    const { admin, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Animation for "Live" status pulsing


    useEffect(() => {
        // Animations removed as they were for the ticket UI
    }, []);

    // --- Dynamic Shadow & Float Values ---
    // (Removed Floating Ticket Animations and variables as they are no longer needed)

    const fetchOverviewData = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const timestamp = new Date().getTime();
            const results = {};

            const fetchData = async (url, fallback) => {
                try {
                    const res = await axios.get(`${url}?t=${timestamp}`, { timeout: 10000 });
                    return res.data;
                } catch (err) {
                    console.warn(`API failed: ${url}`, err.message);
                    return fallback;
                }
            };

            // Fetch all required data in PARALLEL
            const [earnings, users, bookings, reviews, ads, tiers] = await Promise.all([
                fetchData('/api/admin/earnings', { totalBookings: 0, totalEarnings: 0, totalPlatformFees: 0, pendingBookingsCount: 0, appointmentTypes: [] }),
                fetchData('/api/admin/users', []),
                fetchData('/api/admin/bookings', []),
                fetchData('/api/admin/reviews', []),
                fetchData('/api/admin/ads', []),
                fetchData('/api/admin/listing-tiers', [])
            ]);

            results.earnings = earnings;
            results.users = users;
            results.bookings = bookings;
            results.reviews = reviews;
            results.ads = ads;
            results.tiers = tiers;

            // --- Client-Side Calculations (Mirroring Web Dashboard) ---
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            // Monthly Booking Revenue
            const monthlyBookings = results.bookings.filter((booking) => {
                const bookingDate = new Date(booking.createdAt);
                return (
                    bookingDate.getMonth() === currentMonth &&
                    bookingDate.getFullYear() === currentYear &&
                    booking.status === "completed"
                );
            });
            const monthlyBookingRevenue = monthlyBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

            // Monthly Ad Revenue
            const monthlyAds = results.ads.filter((ad) => {
                const adDate = new Date(ad.bookedAt);
                return (
                    adDate.getMonth() === currentMonth &&
                    adDate.getFullYear() === currentYear &&
                    (ad.status === "active" || ad.status === "expired")
                );
            });
            const monthlyAdRevenue = monthlyAds.reduce((sum, ad) => sum + (ad.price || 0), 0);

            // Monthly Tier Revenue
            const monthlyTiers = results.tiers.filter((tier) => {
                const tierDate = new Date(tier.lockedAt);
                return (
                    tierDate.getMonth() === currentMonth &&
                    tierDate.getFullYear() === currentYear
                );
            });
            const monthlyTierRevenue = monthlyTiers.reduce((sum, tier) => sum + (tier.tierDetails?.price || 0), 0);

            const totalMonthlyRevenue = monthlyBookingRevenue + monthlyAdRevenue + monthlyTierRevenue;

            const data = {
                totalUsers: results.users.length,
                totalBookings: results.earnings.totalBookings || 0,
                completedBookings: results.bookings.filter(b => b.status === "completed").length,
                totalReviews: results.reviews.length,
                totalRevenue: results.earnings.totalEarnings || 0,
                platformFees: results.earnings.totalPlatformFees || 0,
                pendingBookings: results.earnings.pendingBookingsCount || 0,
                activeAds: results.ads.filter(ad => ad.status === "active").length,
                totalAds: results.ads.length,
                listingTiers: results.tiers.length,
                recentBookings: results.bookings.slice(0, 5),
                recentReviews: results.reviews.slice(0, 3),
                appointmentTypes: results.earnings.appointmentTypes || [],
                monthlyRevenue: {
                    total: totalMonthlyRevenue,
                    bookings: monthlyBookingRevenue,
                    ads: monthlyAdRevenue,
                    tiers: monthlyTierRevenue,
                },
                hourlyBookings: calculateHourlyBookings(results.bookings),
            };

            setOverviewData(data);
        } catch (err) {
            console.error("Error fetching overview data:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const calculateHourlyBookings = (bookings) => {
        const hourlyStats = {};
        for (let hour = 0; hour <= 23; hour++) {
            let hourLabel =
                hour === 0 ? "12 AM" :
                    hour < 12 ? `${hour} AM` :
                        hour === 12 ? "12 PM" :
                            `${hour - 12} PM`;
            hourlyStats[hour] = {
                hour: hour,
                label: hourLabel,
                count: 0,
                percentage: 0,
            };
        }

        bookings.forEach((booking) => {
            if (booking.time !== undefined && booking.time !== null) {
                try {
                    let hour;
                    const timeStr = booking.time.toString().toLowerCase().trim();
                    if (timeStr.includes(":")) {
                        const timeParts = timeStr.split(":");
                        hour = parseInt(timeParts[0]);
                        if (timeStr.includes("pm") && hour !== 12) hour += 12;
                        else if (timeStr.includes("am") && hour === 12) hour = 0;
                    } else if (!isNaN(parseInt(timeStr))) {
                        hour = parseInt(timeStr);
                    } else {
                        const hourMatch = timeStr.match(/(\d+)/);
                        if (hourMatch) {
                            hour = parseInt(hourMatch[1]);
                            if (timeStr.includes("pm") && hour !== 12) hour += 12;
                            else if (timeStr.includes("am") && hour === 12) hour = 0;
                        }
                    }
                    if (hour >= 0 && hour <= 23 && hourlyStats[hour]) {
                        hourlyStats[hour].count++;
                    }
                } catch (error) {
                    console.warn("Failed to parse booking time:", booking.time, error);
                }
            }
        });

        const totalBookings = Object.values(hourlyStats).reduce((sum, hour) => sum + hour.count, 0);
        const hourlyArray = Object.values(hourlyStats).map((hour) => ({
            ...hour,
            percentage: totalBookings > 0 ? ((hour.count / totalBookings) * 100).toFixed(1) : 0,
        }));
        return hourlyArray.sort((a, b) => b.count - a.count);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F4F5F7]">
                <ActivityIndicator size="large" color="#FFC107" />
                <Text className="text-gray-400 text-xs mt-4">Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F4F5F7]">
            {/* --- FLAT HEADER (Standardized) --- */}
            <View style={{ paddingTop: insets.top + 10, paddingBottom: 20, paddingHorizontal: 24 }} className="bg-[#F4F5F7] z-20">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-900 text-3xl font-black tracking-tight">Dashboard</Text>
                        <Text className="text-gray-500 text-sm font-medium">Platform Overview</Text>
                    </View>

                    {/* Right: Notification Icon */}
                    <TouchableOpacity className="relative p-2 bg-white rounded-full shadow-sm border border-gray-100">
                        <Bell size={24} color="#1F2937" />
                        <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
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

                {/* --- 2x2 HERO STATS GRID --- */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    <StatCard
                        title="Total Users"
                        value={overviewData?.totalUsers?.toLocaleString() || '0'}
                        subtext="Active Accounts"
                        icon={Users}
                        iconColor="#3B82F6"
                        bgColor="bg-blue-50"
                        borderColor="border-blue-100"
                    />
                    <StatCard
                        title="Bookings Done"
                        value={overviewData?.completedBookings?.toLocaleString() || '0'}
                        subtext={`${overviewData?.pendingBookings || 0} Pending`}
                        icon={Calendar}
                        iconColor="#10B981"
                        bgColor="bg-emerald-50"
                        borderColor="border-emerald-100"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(overviewData?.platformFees || 0)}
                        subtext="Platform Fees"
                        icon={CreditCard}
                        iconColor="#8B5CF6"
                        bgColor="bg-violet-50"
                        borderColor="border-violet-100"
                    />
                    <StatCard
                        title="Reviews"
                        value={overviewData?.totalReviews?.toLocaleString() || '0'}
                        subtext="Avg. 4.8 Rating"
                        icon={Star}
                        iconColor="#F59E0B"
                        bgColor="bg-amber-50"
                        borderColor="border-amber-100"
                    />
                </View>

                {/* --- SECONDARY STATS (Vertical Stack or smaller grid) --- */}
                <View className="mb-6">
                    <View className="flex-row justify-between mb-3">
                        <SecondaryStatCard
                            label="Active Ads"
                            value={overviewData?.activeAds || 0}
                            icon="📢"
                            bg="bg-pink-50"
                            text="text-pink-600"
                        />
                        <View style={{ width: 12 }} />
                        <SecondaryStatCard
                            label="Listing Tiers"
                            value={overviewData?.listingTiers || 0}
                            icon="🏆"
                            bg="bg-purple-50"
                            text="text-purple-600"
                        />
                    </View>
                    <SecondaryStatCard
                        label="This Month Revenue"
                        value={formatCurrency(overviewData?.monthlyRevenue?.total || 0)}
                        icon="💵"
                        bg="bg-green-50"
                        text="text-green-600"
                        fullWidth
                    />
                </View>

                {/* --- PEAK HOURS CHART --- */}
                <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center">
                            <View className="bg-red-100 p-1.5 rounded-lg mr-2">
                                <Activity size={16} color="#DC2626" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">Peak Hours</Text>
                        </View>
                        <View className="bg-gray-100 px-2 py-1 rounded-full">
                            <Text className="text-xs font-semibold text-gray-500">Top 5</Text>
                        </View>
                    </View>

                    {overviewData?.hourlyBookings && overviewData?.hourlyBookings.length > 0 ? (
                        <View>
                            {overviewData.hourlyBookings.slice(0, 5).map((hourData, index) => (
                                <View key={hourData.hour} className="mb-3">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className={`font-semibold text-xs ${index === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                            {hourData.label} {index === 0 && '🔥'}
                                        </Text>
                                        <Text className="text-gray-500 text-xs font-medium">
                                            {hourData.count} ({hourData.percentage}%)
                                        </Text>
                                    </View>
                                    <View className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <View
                                            style={{ width: `${Math.max(Number(hourData.percentage), 5)}%` }}
                                            className={`h-full rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-400' : 'bg-indigo-400'}`}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-center py-4">No data available</Text>
                    )}
                </View>

                {/* --- CATEGORIES (Appointment Types) --- */}
                <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-100 shadow-sm">
                    <View className="flex-row items-center mb-4">
                        <View className="bg-violet-100 p-1.5 rounded-lg mr-2">
                            <Text className="text-violet-600 font-bold">🎯</Text>
                        </View>
                        <Text className="text-lg font-bold text-gray-800">Categories</Text>
                    </View>

                    {overviewData?.appointmentTypes && overviewData?.appointmentTypes.length > 0 ? (
                        <View>
                            {overviewData.appointmentTypes.map((type, index) => (
                                <View key={type.appointmentType} className="flex-row items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <View className="flex-row items-center">
                                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${index % 3 === 0 ? 'bg-blue-100' : index % 3 === 1 ? 'bg-pink-100' : 'bg-amber-100'}`}>
                                            <Text className={`font-bold text-xs ${index % 3 === 0 ? 'text-blue-600' : index % 3 === 1 ? 'text-pink-600' : 'text-amber-600'}`}>
                                                {type.appointmentType.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-sm font-bold text-gray-800 capitalize">{type.appointmentType}</Text>
                                            <Text className="text-xs text-gray-500">{type.bookingCount} bookings</Text>
                                        </View>
                                    </View>
                                    <Text className="font-bold text-gray-900">{type.percentage}%</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-center py-4">No categories found</Text>
                    )}
                </View>

                {/* --- PRO TIP CARD --- */}
                <View className="mb-6 rounded-2xl p-5 bg-indigo-600 shadow-lg">
                    <View className="flex-row items-start">
                        <View className="bg-white/20 p-2 rounded-lg mr-3">
                            <Text className="text-white">💡</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Pro Tip</Text>
                            <Text className="text-indigo-100 text-sm leading-5">
                                Review active ads on weekends to boost revenue by ~15%.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <Text className="text-gray-900 text-lg font-bold mb-4 ml-1">Quick Actions</Text>
                <View className="flex-row flex-wrap justify-between">
                    <QuickAction icon={Store} label="Shops" color="text-indigo-600" bg="bg-indigo-50" onPress={() => router.push('/shops')} />
                    <QuickAction icon={Users} label="Users" color="text-blue-600" bg="bg-blue-50" onPress={() => router.push('/users')} />
                    <QuickAction icon={Calendar} label="Bookings" color="text-purple-600" bg="bg-purple-50" onPress={() => router.push('/bookings')} />
                    <QuickAction icon={Star} label="Reviews" color="text-amber-600" bg="bg-amber-50" onPress={() => router.push('/reviews')} />
                    <QuickAction icon={FileText} label="Reports" color="text-emerald-600" bg="bg-emerald-50" />
                    <QuickAction icon={Settings} label="Settings" color="text-gray-600" bg="bg-gray-50" onPress={() => router.push('/settings')} />
                    <QuickAction icon={LogOut} label="Logout" color="text-red-600" bg="bg-red-50" onPress={logout} />
                </View>

            </ScrollView>
        </View>
    );
}

const StatCard = ({ title, value, subtext, icon: Icon, iconColor, bgColor, borderColor }) => (
    <View className={`w-[48%] bg-white rounded-2xl p-4 mb-4 border ${borderColor} shadow-sm justify-between shadow-indigo-100`}>
        <View className="flex-row justify-between items-start mb-2">
            <View>
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">{title}</Text>
                <Text className="text-2xl font-black text-gray-900">{value}</Text>
            </View>
            <View className={`p-2 rounded-xl ${bgColor}`}>
                <Icon size={20} color={iconColor} />
            </View>
        </View>
        <View className="bg-gray-50 self-start px-2 py-1 rounded-md">
            <Text className="text-gray-500 text-[10px] font-medium">{subtext}</Text>
        </View>
    </View>
);

const SecondaryStatCard = ({ label, value, icon, bg, text, fullWidth }) => (
    <View className={`${fullWidth ? 'w-full' : 'flex-1'} bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-row items-center justify-between`}>
        <View className="flex-row items-center">
            <View className={`p-2 rounded-lg mr-3 ${bg}`}>
                <Text className={text}>{icon}</Text>
            </View>
            <View>
                <Text className="text-gray-500 text-xs font-bold uppercase">{label}</Text>
                <Text className="text-lg font-black text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</Text>
            </View>
        </View>
    </View>
);

const QuickAction = ({ icon: Icon, label, color, bg }) => (
    <ScaleButton className={`w-[31%] mb-4 ${bg} p-4 rounded-xl items-center justify-center shadow-sm border border-black/5`}>
        <Icon size={24} style={{ color: color.replace('text-', '') /* rough hack, better to use proper hex */ }} className="mb-2 text-black" />
        <Text className={`text-xs font-bold ${color}`}>{label}</Text>
    </ScaleButton>
);
