import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function EarningsScreen() {
    const [earningsData, setEarningsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const fetchEarnings = useCallback(async (showRefreshIndicator = false, searchTerm = '') => {
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const res = await axios.get(`/api/admin/earnings?t=${timestamp}&search=${searchTerm}`);
            setEarningsData(res.data);
            setIsSearching(searchTerm.length > 0);
        } catch (err) {
            console.error('Error fetching earnings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleSearch = () => {
        fetchEarnings(false, search);
    };

    const clearSearch = () => {
        setSearch('');
        fetchEarnings(false, '');
    };

    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-gray-500 mt-4">Loading earnings data...</Text>
            </View>
        );
    }

    if (!earningsData) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center p-6">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-gray-900 text-lg font-bold mt-4">Unable to load data</Text>
                <TouchableOpacity onPress={() => fetchEarnings(false)} className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl">
                    <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerStyle={{ paddingBottom: 30 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchEarnings(true)} colors={['#4F46E5']} tintColor="#4F46E5" />
            }
        >
            <View className="pt-6 px-6 pb-6 bg-white rounded-b-3xl shadow-sm mb-6">
                <Text className="text-gray-900 text-2xl font-black tracking-tight mb-1">Earnings Analytics</Text>
                <Text className="text-gray-500 text-sm font-medium">Real-time revenue & performance</Text>
            </View>

            {/* Barber Earnings Section */}
            <View className="px-4 mb-6">
                <View className="flex-row justify-between items-center mb-4 px-2">
                    <Text className="text-lg font-bold text-gray-900">Barber Revenue</Text>
                    {isSearching && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Text className="text-indigo-600 font-semibold">Show Top 1</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Bar */}
                <View className="px-2 mb-4">
                    <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-1">
                        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 h-10 ml-2 text-gray-900"
                            placeholder="Search by name or email..."
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {isSearching && earningsData.barberEarnings?.length > 0 && (
                    <Text className="text-gray-500 text-xs mb-3 px-2 italic">
                        Showing {earningsData.barberEarnings.length} result(s) for "{search}"
                    </Text>
                )}
                {earningsData.barberEarnings && earningsData.barberEarnings.length > 0 ? (
                    earningsData.barberEarnings.map((barber) => (
                        <View key={barber.barberId} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-start mb-2">
                                <View>
                                    <Text className="text-gray-900 font-bold text-base">{barber.barberName}</Text>
                                    <Text className="text-gray-500 text-xs">{barber.barberEmail}</Text>
                                </View>
                                <View className="bg-green-50 px-3 py-1 rounded-full">
                                    <Text className="text-green-700 font-bold">{formatCurrency(barber.totalEarnings)}</Text>
                                </View>
                            </View>
                            <View className="flex-row mt-2 pt-3 border-t border-gray-50">
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs uppercase font-semibold">Bookings</Text>
                                    <Text className="text-gray-700 font-medium">{barber.bookingCount}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs uppercase font-semibold">Avg Booking</Text>
                                    <Text className="text-gray-700 font-medium">{formatCurrency(barber.averageBooking)}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text className="text-gray-500 px-2">No barber earnings data available.</Text>
                )}
            </View>

            {/* Appointment Type Popularity */}
            <View className="px-4 mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-4 px-2">Appointment Types</Text>
                {earningsData.appointmentTypes && earningsData.appointmentTypes.map((type, index) => (
                    <View key={index} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <View className={`w-3 h-3 rounded-full mr-2 ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                    }`} />
                                <Text className="font-bold text-gray-900 capitalize">{type.appointmentType}</Text>
                                {index === 0 && (
                                    <View className="ml-2 bg-yellow-100 px-2 py-0.5 rounded-md">
                                        <Text className="text-yellow-800 text-[10px] font-bold">POPULAR</Text>
                                    </View>
                                )}
                            </View>
                            <View className="items-end">
                                <Text className="text-xl font-bold text-gray-900">{type.percentage}%</Text>
                                <Text className="text-xs text-gray-500">{type.bookingCount} bookings</Text>
                            </View>
                        </View>

                        <View className="w-full bg-gray-100 rounded-full h-2 mb-3">
                            <View
                                className={`h-2 rounded-full ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${type.percentage}%` }}
                            />
                        </View>

                        <View className="flex-row justify-between items-center bg-gray-50 p-2 rounded-lg">
                            <Text className="text-xs text-gray-600">Total: {formatCurrency(type.totalEarnings)}</Text>
                            <Text className="text-xs font-bold text-indigo-600">Fees: {formatCurrency(type.platformFees)}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Platform Fees Summary */}
            <View className="px-4 mb-6">
                <View className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <View className="items-center mb-6">
                        <Text className="text-indigo-800 font-semibold mb-1">Total Platform Revenue</Text>
                        <Text className="text-4xl font-bold text-indigo-600">{formatCurrency(earningsData.totalPlatformFees || 0)}</Text>
                        <Text className="text-indigo-400 text-xs mt-1">From {earningsData.totalBookings || 0} completed bookings</Text>
                    </View>

                    <View className="bg-white/50 rounded-xl p-3">
                        {earningsData.appointmentTypes && earningsData.appointmentTypes.map((type) => {
                            const rate = type.appointmentType === 'basic' ? 7 :
                                type.appointmentType === 'express' ? 20 :
                                    type.appointmentType === 'standard' ? 5 : 5;
                            return (
                                <View key={type.appointmentType} className="flex-row justify-between items-center mb-1 last:mb-0">
                                    <Text className="text-xs text-indigo-700 capitalize w-1/2">
                                        {type.appointmentType} ({type.bookingCount})
                                    </Text>
                                    <Text className="text-xs font-bold text-indigo-700">
                                        {type.bookingCount} × ₹{rate} = {formatCurrency(type.platformFees)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Summary Grid */}
            <View className="flex-row px-4 gap-3">
                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100 items-center shadow-sm">
                    <Text className="text-xl font-bold text-gray-900">{earningsData.appointmentTypes?.length || 0}</Text>
                    <Text className="text-[10px] text-gray-500 text-center mt-1">Types</Text>
                </View>
                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100 items-center shadow-sm">
                    <Text className="text-lg font-bold text-gray-900 capitalize" numberOfLines={1}>
                        {earningsData.appointmentTypes?.[0]?.appointmentType || 'N/A'}
                    </Text>
                    <Text className="text-[10px] text-gray-500 text-center mt-1">Top Type</Text>
                </View>
                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100 items-center shadow-sm">
                    <Text className="text-xl font-bold text-gray-900">
                        {earningsData.appointmentTypes?.[0]?.percentage || 0}%
                    </Text>
                    <Text className="text-[10px] text-gray-500 text-center mt-1">Share</Text>
                </View>
            </View>

        </ScrollView>
    );
}
