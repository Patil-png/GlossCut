import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Dimensions,
    Image,
    Alert
} from 'react-native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    QrCode,
    Search,
    TrendingUp,
    Calendar,
    ChevronRight,
    MapPin,
    BarChart3,
    Activity,
    AlertCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get("window");

export default function QrAnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async (showRefreshIndicator = false) => {
        try {
            console.log("Fetching QR Stats...");
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            // Using full URL to absolute certainty and adding timeout
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.glosscut.com';
            const res = await axios.get(`${apiUrl}/api/qr/stats`, {
                timeout: 10000 // 10s timeout
            });

            console.log("Stats fetched:", res.data?.length);
            setStats(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch QR stats:", err.message);
            setError(err.response?.data?.msg || "Could not load analytics data. Please check your connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const processedStats = (stats || [])
        .filter(stat =>
            stat && stat.shop_name && typeof stat.shop_name === 'string' &&
            stat.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (b.total_scans || 0) - (a.total_scans || 0));

    const totalScans = processedStats.reduce((acc, curr) => acc + (curr.total_scans || 0), 0);
    const totalScansWeek = processedStats.reduce((acc, curr) => acc + (curr.scans_this_week || 0), 0);
    const scanValues = processedStats.map(s => Number(s.total_scans) || 0);
    const maxScans = scanValues.length > 0 ? Math.max(...scanValues, 1) : 1;

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F4F5F7]">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-gray-400 text-xs mt-4 font-bold">Connecting to server...</Text>
                <TouchableOpacity
                    onPress={() => fetchStats()}
                    className="mt-6 px-4 py-2 bg-white rounded-full border border-gray-200"
                >
                    <Text className="text-gray-500 text-xs font-bold">Retry Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F4F5F7]">
            {/* Header */}
            <View style={{ paddingTop: insets.top + 10, paddingBottom: 20, paddingHorizontal: 24 }} className="bg-white border-b border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black">QR Analytics</Text>
                        <Text className="text-gray-500 text-xs font-medium">Standee Performance</Text>
                    </View>
                    <TouchableOpacity onPress={() => fetchStats(true)} className="bg-indigo-100 p-2 rounded-xl">
                        <QrCode size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <Search size={18} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 text-sm"
                        placeholder="Search salon name..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} tintColor="#4F46E5" />
                }
            >
                {/* KPI Cards */}
                <View className="flex-row justify-between mb-6">
                    <View className="bg-white rounded-3xl p-5 w-[48%] shadow-sm border border-gray-100">
                        <View className="bg-blue-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
                            <BarChart3 size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total Scans</Text>
                        <Text className="text-2xl font-black text-gray-900 mt-1">{totalScans}</Text>
                    </View>
                    <View className="bg-white rounded-3xl p-5 w-[48%] shadow-sm border border-gray-100">
                        <View className="bg-indigo-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
                            <Activity size={20} color="#6366F1" />
                        </View>
                        <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">This Week</Text>
                        <Text className="text-2xl font-black text-indigo-600 mt-1">{totalScansWeek}</Text>
                    </View>
                </View>

                {error && (
                    <View className="bg-white p-6 rounded-3xl mb-6 border border-red-100 shadow-sm items-center">
                        <View className="bg-red-50 p-3 rounded-full mb-4">
                            <AlertCircle size={32} color="#EF4444" />
                        </View>
                        <Text className="text-gray-900 font-bold text-center mb-2">Error Loading Data</Text>
                        <Text className="text-gray-500 text-xs text-center mb-6 leading-5">{error}</Text>
                        <TouchableOpacity
                            onPress={() => fetchStats()}
                            className="bg-indigo-600 px-8 py-3 rounded-2xl"
                        >
                            <Text className="text-white font-bold">Try Again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Performance List */}
                <View className="flex-row items-center justify-between mb-4 px-1">
                    <Text className="text-gray-900 text-lg font-black">Salon Performance</Text>
                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-500 text-[10px] font-bold">{processedStats.length} shops</Text>
                    </View>
                </View>

                {!error && processedStats.length === 0 ? (
                    <View className="items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <Search size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 mt-4 font-bold">No results found for "{searchTerm}"</Text>
                    </View>
                ) : (
                    processedStats.map((stat, index) => (
                        <View key={stat._id || index} className="bg-white rounded-3xl mb-4 p-5 shadow-sm border border-gray-100">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-bold text-base">{stat.shop_name}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <MapPin size={12} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-[10px] ml-1">Standee #{index + 1}</Text>
                                    </View>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${(stat.total_scans || 0) > 10 ? 'bg-green-100' : 'bg-amber-100'}`}>
                                    <Text className={`text-[10px] font-bold ${(stat.total_scans || 0) > 10 ? 'text-green-700' : 'text-amber-700'}`}>
                                        {(stat.total_scans || 0) > 10 ? 'ACTIVE' : 'NEEDS PROMOTION'}
                                    </Text>
                                </View>
                            </View>

                            {/* Bar Visualization */}
                            <View className="mb-4">
                                <View className="flex-row justify-between mb-1.5">
                                    <View className="flex-row items-center">
                                        <TrendingUp size={10} color="#6366F1" className="mr-1" />
                                        <Text className="text-gray-500 text-[10px] font-bold uppercase ml-1">Scan Volume</Text>
                                    </View>
                                    <Text className="text-gray-900 text-xs font-black">{stat.total_scans || 0} Total</Text>
                                </View>
                                <View className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                    <LinearGradient
                                        colors={index < 3 ? ['#4F46E5', '#818CF8'] : ['#94A3B8', '#CBD5E1']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            width: `${Math.min(100, Math.max(5, ((stat.total_scans || 0) / maxScans) * 100))}%`,
                                            height: '100%',
                                            borderRadius: 6
                                        }}
                                    />
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
                                <View className="flex-row items-center">
                                    <Calendar size={14} color="#6366F1" />
                                    <Text className="text-indigo-600 font-bold text-xs ml-1.5">{stat.scans_this_week || 0} this week</Text>
                                </View>
                                <TouchableOpacity className="bg-gray-50 px-4 py-1.5 rounded-full flex-row items-center">
                                    <Text className="text-gray-500 font-bold text-[10px]">Analytics</Text>
                                    <ChevronRight size={12} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
