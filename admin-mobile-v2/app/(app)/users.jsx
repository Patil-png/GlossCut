import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    Animated,
    Easing
} from 'react-native';
import axios from 'axios';
import {
    Search,
    Filter,
    User,
    Phone,
    Mail,
    MoreVertical,
    Trash2,
    CreditCard,
    Calendar,
    CheckCircle,
    XCircle,
    Shield,
    Zap,
    ChevronRight
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

// --- Helper: Scale Button ---
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

export default function UsersScreen() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    // Modal States
    const [showUserDetailModal, setShowUserDetailModal] = useState(false);
    const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);
    const [showBookingsModal, setShowBookingsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [coinAmount, setCoinAmount] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
            setFilteredUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        let filtered = users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm));

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && user.isAvailable) ||
                (statusFilter === 'inactive' && !user.isAvailable);

            return matchesSearch && matchesRole && matchesStatus;
        });

        filtered.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'name': aValue = a.name.toLowerCase(); bValue = b.name.toLowerCase(); break;
                case 'email': aValue = a.email.toLowerCase(); bValue = b.email.toLowerCase(); break;
                case 'role': aValue = a.role; bValue = b.role; break;
                default: return 0;
            }
            return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
        });

        setFilteredUsers(filtered);
    }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

    const handleViewUser = async (user) => {
        setSelectedUser(user);
        setShowUserDetailModal(true);
        setStatsLoading(true);
        try {
            const response = await axios.get(`/api/admin/user-stats/${user._id}`);
            setUserStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setUserStats(null);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleAddCoins = (user) => {
        setSelectedUser(user);
        setShowAddCoinsModal(true);
        setCoinAmount('');
        setAdminPassword('');
        setModalError('');
    };

    const handleAddCoinsSubmit = async () => {
        setModalLoading(true);
        setModalError('');
        try {
            await axios.post('/api/admin/add-coins', {
                userId: selectedUser._id,
                amount: parseInt(coinAmount),
                adminPassword
            });
            fetchUsers(); // Refresh data
            setShowAddCoinsModal(false);
            Alert.alert('Success', `Added ${coinAmount} coins to ${selectedUser.name}`);
        } catch (err) {
            setModalError(err.response?.data?.msg || 'Failed to add coins');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        Alert.alert(
            'Delete User',
            `Permanently delete ${user.name}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/admin/delete-user/${user._id}`);
                            setUsers(users.filter(u => u._id !== user._id));
                            setShowUserDetailModal(false);
                            Alert.alert('Success', 'User deleted');
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const renderUserCard = ({ item }) => (
        <ScaleButton onPress={() => handleViewUser(item)} className="mb-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center">
                    {/* Avatar Area */}
                    <LinearGradient
                        colors={item.role === 'barber' ? ['#4F46E5', '#6366F1'] : ['#10B981', '#34D399']}
                        className="w-12 h-12 rounded-full items-center justify-center mr-4 shadow-sm"
                    >
                        <Text className="text-white font-bold text-lg">{getInitials(item.name)}</Text>
                        {/* Online Status Dot */}
                        <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${item.isAvailable ? 'bg-green-400' : 'bg-gray-400'}`} />
                    </LinearGradient>

                    {/* User Info */}
                    <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
                                <Text className="text-gray-500 text-xs">{item.email}</Text>
                            </View>
                            {/* Role Badge */}
                            <View className={`px-2 py-1 rounded-md ${item.role === 'barber' ? 'bg-indigo-50' : 'bg-green-50'}`}>
                                <Text className={`text-[10px] font-bold tracking-wide uppercase ${item.role === 'barber' ? 'text-indigo-700' : 'text-green-700'}`}>
                                    {item.role}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
                            <View className="flex-row items-center mr-4">
                                <Shield size={12} color="#9CA3AF" />
                                <Text className="text-gray-400 text-xs ml-1">{item.isAvailable ? 'Active' : 'Inactive'}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Phone size={12} color="#9CA3AF" />
                                <Text className="text-gray-400 text-xs ml-1">{item.phone || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Arrow */}
                    <View className="ml-2">
                        <ChevronRight size={20} color="#E5E7EB" />
                    </View>
                </View>
            </View>
        </ScaleButton>
    );

    return (
        <View className="flex-1 bg-[#F4F5F7] p-5">
            {/* Header */}
            <View className="flex-row justify-between items-end mb-6">
                <View>
                    <Text className="text-gray-900 text-2xl font-black tracking-tight">Users</Text>
                    <Text className="text-gray-500 text-sm font-medium">Manage platform accounts</Text>
                </View>
                <View className="bg-indigo-100 px-3 py-1 rounded-full">
                    <Text className="text-indigo-700 font-bold text-xs">{filteredUsers.length} TOTAL</Text>
                </View>
            </View>

            {/* Search & Filter Bar */}
            <View className="flex-row mb-6 space-x-3">
                <View className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex-row items-center px-3 h-12">
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-900 font-medium"
                        placeholder="Search name, email..."
                        placeholderTextColor="#9CA3AF"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                {/* Simple Filter Toggle (Role) */}
                <TouchableOpacity
                    onPress={() => setRoleFilter(roleFilter === 'all' ? 'barber' : roleFilter === 'barber' ? 'customer' : 'all')}
                    className={`w-12 h-12 rounded-xl items-center justify-center shadow-sm border ${roleFilter !== 'all' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                >
                    <Filter size={20} color={roleFilter !== 'all' ? '#FFF' : '#374151'} />
                </TouchableOpacity>
            </View>

            {/* Users List */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserCard}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* --- User Detail Modal --- */}
            <Modal visible={showUserDetailModal} animationType="fade" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <Animated.View className="bg-white rounded-t-[32px] h-[85%] overflow-hidden">
                        <View className="flex-1">
                            {/* Header */}
                            <View className="bg-gray-50 p-6 rounded-b-[32px] border-b border-gray-200/50 pb-8">
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-xl font-bold text-gray-900">User Profile</Text>
                                    <TouchableOpacity onPress={() => setShowUserDetailModal(false)} className="bg-gray-200 p-2 rounded-full">
                                        <XCircle size={24} color="#374151" />
                                    </TouchableOpacity>
                                </View>

                                {/* Profile Stats */}
                                {selectedUser && (
                                    <View className="items-center">
                                        <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-4">
                                            <Text className="text-4xl font-bold text-indigo-600">{getInitials(selectedUser.name)}</Text>
                                        </View>
                                        <Text className="text-2xl font-bold text-gray-900">{selectedUser.name}</Text>
                                        <Text className="text-gray-500 font-medium mb-4">{selectedUser.email}</Text>

                                        <View className="flex-row space-x-4">
                                            <View className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 items-center min-w-[80px]">
                                                <Text className="text-xs font-bold text-gray-400">COINS</Text>
                                                <Text className="text-xl font-bold text-indigo-600">{selectedUser.setkarCoins || 0}</Text>
                                            </View>
                                            <View className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 items-center min-w-[80px]">
                                                <Text className="text-xs font-bold text-gray-400">BOOKINGS</Text>
                                                <Text className="text-xl font-bold text-gray-900">{userStats?.user?.totalBookings || 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Actions */}
                            <ScrollView className="p-6">
                                <Text className="text-gray-900 font-bold mb-4 ml-1">Actions</Text>

                                <ScaleButton onPress={() => handleAddCoins(selectedUser)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex-row items-center">
                                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                                        <Zap size={20} color="#059669" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-900">Add Coins</Text>
                                        <Text className="text-xs text-gray-500">Credit user wallet</Text>
                                    </View>
                                    <ChevronRight size={18} color="#D1D5DB" />
                                </ScaleButton>

                                <ScaleButton onPress={() => { setShowUserDetailModal(false); setShowBookingsModal(true); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex-row items-center">
                                    <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-4">
                                        <Calendar size={20} color="#D97706" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-900">View Bookings</Text>
                                        <Text className="text-xs text-gray-500">History & upcoming</Text>
                                    </View>
                                    <ChevronRight size={18} color="#D1D5DB" />
                                </ScaleButton>

                                <ScaleButton onPress={() => handleDeleteUser(selectedUser)} className="bg-red-50 p-4 rounded-xl border border-red-100 mt-4 flex-row items-center justify-center">
                                    <Trash2 size={20} color="#DC2626" className="mr-2" />
                                    <Text className="font-bold text-red-600">Delete User Account</Text>
                                </ScaleButton>
                            </ScrollView>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* --- Add Coins Modal --- */}
            <Modal visible={showAddCoinsModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center items-center p-6">
                    <View className="bg-white w-full rounded-3xl p-6 shadow-xl">
                        <View className="items-center mb-6">
                            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
                                <Zap size={24} color="#059669" />
                            </View>
                            <Text className="text-xl font-bold text-gray-900">Add Coins</Text>
                            <Text className="text-gray-500 text-center">Adding funds to {selectedUser?.name}</Text>
                        </View>

                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 font-bold text-lg text-center"
                            placeholder="0"
                            keyboardType="number-pad"
                            value={coinAmount}
                            onChangeText={setCoinAmount}
                        />
                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6"
                            placeholder="Admin Password"
                            secureTextEntry
                            value={adminPassword}
                            onChangeText={setAdminPassword}
                        />

                        {modalError ? <Text className="text-red-500 text-center mb-4 font-medium">{modalError}</Text> : null}

                        <View className="flex-row space-x-3">
                            <TouchableOpacity onPress={() => setShowAddCoinsModal(false)} className="flex-1 bg-gray-100 py-4 rounded-xl items-center">
                                <Text className="font-bold text-gray-600">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddCoinsSubmit} className="flex-1 bg-indigo-600 py-4 rounded-xl items-center">
                                {modalLoading ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Confirm</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- Bookings Modal --- */}
            <Modal visible={showBookingsModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-gray-50">
                    <View className="bg-white p-4 border-b border-gray-200 flex-row justify-between items-center">
                        <Text className="text-lg font-bold">Booking History</Text>
                        <TouchableOpacity onPress={() => setShowBookingsModal(false)} className="bg-gray-100 p-2 rounded-full">
                            <XCircle size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                        {userStats?.recentBookings?.map((booking, idx) => (
                            <View key={idx} className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="font-bold text-gray-900 text-base">{booking.barberName}</Text>
                                    <View className={`px-2 py-1 rounded-md ${booking.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                        <Text className={`text-xs font-bold ${booking.status === 'completed' ? 'text-green-700' : 'text-orange-700'}`}>{booking.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center mb-2">
                                    <Calendar size={14} color="#9CA3AF" className="mr-1" />
                                    <Text className="text-gray-500 text-sm">{new Date(booking.date).toDateString()} • {booking.time}</Text>
                                </View>
                                <View className="border-t border-gray-50 pt-2 mt-2">
                                    <Text className="font-bold text-gray-900">₹{booking.totalPrice}</Text>
                                </View>
                            </View>
                        ))}
                        {(!userStats?.recentBookings || userStats.recentBookings.length === 0) && (
                            <View className="items-center mt-10">
                                <Calendar size={48} color="#E5E7EB" />
                                <Text className="text-gray-400 mt-4 font-medium">No bookings found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

        </View>
    );
}
