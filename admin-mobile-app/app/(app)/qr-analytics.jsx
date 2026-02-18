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
    AlertCircle,
    Users,
    Phone,
    User,
    CheckCircle2,
    Trash2,
    ShieldCheck,
    Repeat
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
    const [activeTab, setActiveTab] = useState('analytics'); // analytics, leads
    const [leads, setLeads] = useState([]);
    const [sourceFilter, setSourceFilter] = useState('All'); // All, QR Scan, Walk-In

    const fetchStats = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.glosscut.com';
            const res = await axios.get(`${apiUrl}/api/qr/stats`, { timeout: 10000 });

            setStats(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.msg || "Could not load analytics data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchLeads = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.glosscut.com';
            const res = await axios.get(`${apiUrl}/api/qr/leads`, { timeout: 10000 });

            setLeads(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.msg || "Could not load customer leads.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchData = useCallback((showRefreshIndicator = false) => {
        if (activeTab === 'analytics') fetchStats(showRefreshIndicator);
        else fetchLeads(showRefreshIndicator);
    }, [activeTab, fetchStats, fetchLeads]);

    const handleToggleContacted = async (lead) => {
        try {
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.glosscut.com';
            await axios.patch(`${apiUrl}/api/qr/leads/${lead.id}`, {
                source: lead.source,
                contacted: !lead.contacted
            });
            // Optimistic update
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, contacted: !l.contacted } : l));
        } catch (err) {
            Alert.alert("Error", "Could not update contacted status.");
        }
    };

    const handleDeleteLead = async (lead) => {
        Alert.alert(
            "Delete Lead",
            "Are you sure you want to delete this customer lead? Only the lead history will be deleted, not any barber or user accounts.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.glosscut.com';
                            await axios.delete(`${apiUrl}/api/qr/leads/${lead.id}?source=${lead.source}`);
                            setLeads(prev => prev.filter(l => l.id !== lead.id));
                        } catch (err) {
                            Alert.alert("Error", "Could not delete lead.");
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                    <TouchableOpacity
                        onPress={() => activeTab === 'analytics' ? fetchStats(true) : fetchLeads(true)}
                        className="bg-indigo-100 p-2 rounded-xl"
                    >
                        <QrCode size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                {/* Tab Switcher */}
                <View className="flex-row bg-gray-100 p-1.5 rounded-[20px] mb-4">
                    <TouchableOpacity
                        onPress={() => setActiveTab('analytics')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-[16px] ${activeTab === 'analytics' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <BarChart3 size={14} color={activeTab === 'analytics' ? '#4F46E5' : '#6B7280'} />
                        <Text className={`ml-1 text-[10px] font-black ${activeTab === 'analytics' ? 'text-[#4F46E5]' : 'text-gray-500'}`}>Analytics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('leads')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-[16px] ${activeTab === 'leads' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <Users size={14} color={activeTab === 'leads' ? '#4F46E5' : '#6B7280'} />
                        <Text className={`ml-1 text-[10px] font-black ${activeTab === 'leads' ? 'text-[#4F46E5]' : 'text-gray-500'}`}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('registered')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-[16px] ${activeTab === 'registered' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <ShieldCheck size={14} color={activeTab === 'registered' ? '#4F46E5' : '#6B7280'} />
                        <Text className={`ml-1 text-[10px] font-black ${activeTab === 'registered' ? 'text-[#4F46E5]' : 'text-gray-500'}`}>Registered</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <Search size={18} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 text-sm"
                        placeholder={activeTab === 'analytics' ? "Search salon name..." : "Search customer name..."}
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
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => activeTab === 'analytics' ? fetchStats(true) : fetchLeads(true)}
                        tintColor="#4F46E5"
                    />
                }
            >
                {activeTab === 'analytics' ? (
                    <>
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

                        {/* Performance List */}
                        <View className="flex-row items-center justify-between mb-4 px-1">
                            <Text className="text-gray-900 text-lg font-black">Salon Performance</Text>
                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                <Text className="text-gray-500 text-[10px] font-bold">{processedStats.length} shops</Text>
                            </View>
                        </View>

                        {processedStats.length === 0 ? (
                            <View className="items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                                <Search size={48} color="#D1D5DB" />
                                <Text className="text-gray-500 mt-4 font-bold">No results found</Text>
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
                    </>
                ) : (
                    <>
                        <View className="flex-row items-center justify-between mb-6 px-1">
                            <Text className="text-gray-900 text-lg font-black">
                                {activeTab === 'leads' ? 'Captured Leads' : 'Real Account Users'}
                            </Text>
                            <View className="bg-indigo-50 px-3 py-1 rounded-full">
                                <Text className="text-indigo-600 text-[10px] font-bold">
                                    {activeTab === 'leads'
                                        ? leads.length
                                        : leads.filter(l => l.is_registered).length}
                                </Text>
                            </View>
                        </View>

                        {/* Source Filter Buttons (Only for Leads Tab) */}
                        {activeTab === 'leads' && (
                            <View className="flex-row mb-6 px-1">
                                {['All', 'QR Scan', 'Walk-In'].map((f) => (
                                    <TouchableOpacity
                                        key={f}
                                        onPress={() => setSourceFilter(f)}
                                        className={`flex-1 py-2 rounded-xl mr-2 items-center justify-center border ${sourceFilter === f ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={`text-[10px] font-bold ${sourceFilter === f ? 'text-white' : 'text-gray-500'}`}>
                                            {f}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {leads.filter(l => {
                            const matchesSearch = l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesSource = activeTab === 'registered' ? true : (sourceFilter === 'All' || l.source === sourceFilter);
                            const matchesTab = activeTab === 'registered' ? l.is_registered : true;
                            return matchesSearch && matchesSource && matchesTab;
                        }).length === 0 ? (
                            <View className="items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                                <Users size={48} color="#D1D5DB" />
                                <Text className="text-gray-500 mt-4 font-bold">No results found</Text>
                            </View>
                        ) : (
                            leads
                                .filter(l => {
                                    const matchesSearch = l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchesSource = activeTab === 'registered' ? true : (sourceFilter === 'All' || l.source === sourceFilter);
                                    const matchesTab = activeTab === 'registered' ? l.is_registered : true;
                                    return matchesSearch && matchesSource && matchesTab;
                                })
                                .map((lead, index) => (
                                    <View key={lead.id} className="bg-white rounded-3xl mb-4 p-5 shadow-sm border border-gray-100">
                                        <View className="flex-row items-center mb-4">
                                            <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
                                                <User size={24} color="#4F46E5" />
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row items-center">
                                                    <Text className="text-gray-900 font-black text-base mr-2">{lead.customer_name}</Text>
                                                    {lead.is_registered && (
                                                        <View className="bg-blue-100 px-1.5 py-0.5 rounded-md flex-row items-center">
                                                            <ShieldCheck size={10} color="#2563EB" />
                                                            <Text className="text-blue-700 text-[8px] font-black uppercase ml-1">REAL</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-row items-center mt-1">
                                                    <View className="bg-emerald-50 px-2 py-0.5 rounded-md flex-row items-center mr-2">
                                                        <Phone size={10} color="#059669" />
                                                        <Text className="text-emerald-700 text-[10px] font-bold ml-1">{lead.customer_phone}</Text>
                                                    </View>
                                                    <View className={`${lead.source === 'QR Scan' ? 'bg-blue-50' : 'bg-amber-50'} px-2 py-0.5 rounded-md flex-row items-center`}>
                                                        <Text className={`${lead.source === 'QR Scan' ? 'text-blue-700' : 'text-amber-700'} text-[9px] font-black uppercase`}>{lead.source}</Text>
                                                    </View>
                                                    <View className="bg-indigo-50 px-2 py-0.5 rounded-md flex-row items-center ml-2">
                                                        <Repeat size={10} color="#4F46E5" />
                                                        <Text className="text-indigo-700 text-[9px] font-black uppercase ml-1">{lead.visit_count} VISITS</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-gray-400 text-[10px] font-medium">
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="bg-gray-50 p-3 rounded-2xl flex-row items-center justify-between border border-gray-100">
                                            <View className="flex-row items-center flex-1">
                                                <MapPin size={12} color="#6366F1" />
                                                <Text className="text-gray-900 text-[11px] font-bold ml-2 flex-1" numberOfLines={1}>Shop: {lead.salon_name}</Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <TouchableOpacity
                                                    onPress={() => handleToggleContacted(lead)}
                                                    className={`mr-2 p-1.5 rounded-lg border ${lead.contacted ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-100 border-gray-200'}`}
                                                >
                                                    <CheckCircle2 size={14} color={lead.contacted ? '#059669' : '#9CA3AF'} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteLead(lead)}
                                                    className="p-1.5 rounded-lg bg-red-50 border border-red-100"
                                                >
                                                    <Trash2 size={14} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
