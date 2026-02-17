import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Platform, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Search } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingsScreen() {
    const [totalBookingsCount, setTotalBookingsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [barberBookings, setBarberBookings] = useState([]);
    const [barberLoading, setBarberLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInitialData = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/bookings');
            setTotalBookingsCount(res.data.length);
        } catch (err) {
            console.error('Error fetching bookings count:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBarberBookings = useCallback(async () => {
        setBarberLoading(true);
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const res = await axios.get(`/api/admin/bookings-by-date/${dateStr}`);
            setBarberBookings(res.data);
        } catch (err) {
            console.error('Error fetching barber bookings:', err);
            setBarberBookings([]);
        } finally {
            setBarberLoading(false);
            setRefreshing(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchBarberBookings();
    }, [fetchBarberBookings]);

    // Enhanced Filtering Logic
    const filteredBookings = useMemo(() => {
        if (!searchTerm) return barberBookings;

        const lowerTerm = searchTerm.toLowerCase();

        return barberBookings.map(group => {
            // Check if Barber Name matches
            const barberMatches = group.barberName.toLowerCase().includes(lowerTerm);

            if (barberMatches) {
                return group; // Return all bookings if barber matches
            }

            // Filter bookings by Customer Name
            const matchingBookings = group.bookings.filter(booking => {
                const customerName = booking.isOfflineBooking
                    ? booking.customerName
                    : booking.userId?.name;
                return (customerName || '').toLowerCase().includes(lowerTerm);
            });

            if (matchingBookings.length > 0) {
                return { ...group, bookings: matchingBookings };
            }
            return null;
        }).filter(group => group !== null);
    }, [barberBookings, searchTerm]);


    const onDateChange = (event, selected) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selected) {
            setSelectedDate(selected);
        }
    };

    const renderBarberItem = ({ item }) => (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <Text className="text-lg font-bold text-gray-800">{item.barberName}</Text>
                <View className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="text-xs text-gray-500">{item.bookings.length} booking{item.bookings.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            {item.bookings.map((booking, idx) => (
                <View key={booking._id || idx} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-200">
                    <View className="flex-row justify-between mb-1">
                        <Text className="font-bold text-gray-900 text-sm">
                            {booking.isOfflineBooking ? booking.customerName : (booking.userId?.name || 'N/A')}
                            {booking.isOfflineBooking && <Text className="text-gray-500 text-xs"> (Offline)</Text>}
                        </Text>
                        <Text className="text-gray-500 text-xs">{booking.time}</Text>
                    </View>

                    <Text className="text-gray-600 text-xs mb-2">
                        {booking.services?.map(s => s.name).join(', ') || 'N/A'}
                    </Text>

                    <View className="flex-row justify-between items-center">
                        <Text className="font-bold text-gray-900 text-sm">₹{booking.totalPrice}</Text>
                        <View className="flex-row">
                            <View className="px-2 py-0.5 rounded-full mr-2" style={{
                                backgroundColor: booking.status === 'completed' ? '#DCFCE7' :
                                    booking.status === 'confirmed' ? '#DBEAFE' :
                                        booking.status === 'cancelled' ? '#FEE2E2' : '#FEF3C7'
                            }}>
                                <Text className="text-[10px] font-bold" style={{
                                    color: booking.status === 'completed' ? '#166534' :
                                        booking.status === 'confirmed' ? '#1E40AF' :
                                            booking.status === 'cancelled' ? '#991B1B' : '#854D0E'
                                }}>
                                    {booking.status?.toUpperCase() || 'PENDING'}
                                </Text>
                            </View>

                            <View className="px-2 py-0.5 rounded-full" style={{
                                backgroundColor: booking.paymentStatus === 'completed' ? '#DCFCE7' : '#FEF3C7'
                            }}>
                                <Text className="text-[10px] font-bold" style={{
                                    color: booking.paymentStatus === 'completed' ? '#166534' : '#854D0E'
                                }}>
                                    {booking.paymentStatus === 'completed' ? 'PAID' : 'UNPAID'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-gray-900 text-2xl font-black tracking-tight">Bookings</Text>
                    <Text className="text-gray-500 text-sm font-medium">Total: {totalBookingsCount}</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-white border border-gray-300 px-4 py-2 rounded-lg flex-row items-center"
                >
                    <Ionicons name="calendar" size={18} color="#4B5563" style={{ marginRight: 8 }} />
                    <Text className="text-gray-700 font-medium">{selectedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row mb-4 bg-white rounded-xl shadow-sm border border-gray-200 items-center px-3 h-12">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                    className="flex-1 ml-2 text-gray-900 font-medium"
                    placeholder="Search customer or barber..."
                    placeholderTextColor="#9CA3AF"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {barberLoading && !refreshing ? (
                <ActivityIndicator size="large" color="#4F46E5" />
            ) : (
                <FlatList
                    data={filteredBookings}
                    keyExtractor={(item) => item.barberId}
                    renderItem={renderBarberItem}
                    ListEmptyComponent={
                        <View className="items-center py-10">
                            <Text className="text-gray-400">No bookings found for this search</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBarberBookings(); }} colors={['#4F46E5']} />
                    }
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}
        </View>
    );
}
