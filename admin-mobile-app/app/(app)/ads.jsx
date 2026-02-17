import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
    }
};

const TierCard = ({ tier, count }) => (
    <View
        style={{
            backgroundColor: tier.name === 'Premium' ? '#FEF3C7' :
                tier.name === 'Gold' ? '#FEF9C3' :
                    tier.name === 'Silver' ? '#F3F4F6' :
                        tier.name === 'Bronze' ? '#FFEDD5' : '#EFF6FF'
        }}
        className="p-3 rounded-lg border border-gray-200 items-center justify-center mr-3 w-28 h-28"
    >
        <Text className="text-xs font-bold text-gray-700 mb-1">{tier.name}</Text>
        <Text className="text-2xl font-bold text-gray-900">{count}</Text>
        <Text className="text-xs text-gray-500">₹{tier.price}</Text>
    </View>
);

export default function AdsScreen() {
    const [listingTiers, setListingTiers] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const timestamp = new Date().getTime();
            const [tiersRes, adsRes] = await Promise.all([
                axios.get(`/api/admin/listing-tiers?t=${timestamp}`),
                axios.get(`/api/admin/ads?t=${timestamp}`)
            ]);
            setListingTiers(tiersRes.data);
            setAds(adsRes.data);
        } catch (err) {
            console.error('Error fetching ads data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    const tiersListDefinition = [
        { id: 1, name: 'Premium', price: 999 },
        { id: 2, name: 'Gold', price: 899 },
        { id: 3, name: 'Silver', price: 799 },
        { id: 4, name: 'Bronze', price: 699 },
        { id: 5, name: 'Standard', price: 599 },
        { id: 6, name: 'Basic', price: 499 },
        { id: 7, name: 'Entry', price: 399 },
        { id: 8, name: 'Starter', price: 299 },
        { id: 9, name: 'Lite', price: 199 },
        { id: 10, name: 'Free', price: 99 }
    ];

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
            >
                <View className="mb-6">
                    <Text className="text-gray-900 text-2xl font-black tracking-tight">Ads & Tiers</Text>
                    <Text className="text-gray-500 text-sm font-medium">Revenue Management</Text>
                </View>

                {/* Listing Tiers Section */}
                <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Listing Tiers</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                        {tiersListDefinition.map(tier => (
                            <TierCard
                                key={tier.id}
                                tier={tier}
                                count={listingTiers.filter(lt => lt.tierId === tier.id).length}
                            />
                        ))}
                    </ScrollView>

                    {/* Listing Tier Revenue Summary */}
                    {listingTiers.length > 0 && (
                        <View className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
                            <View className="items-center mb-4">
                                <Text className="text-lg font-bold text-green-800 mb-1">Total Tier Revenue</Text>
                                <Text className="text-3xl font-black text-green-600">
                                    {formatCurrency(listingTiers.reduce((sum, tier) => sum + (tier.tierDetails?.price || 0), 0))}
                                </Text>
                                <Text className="text-xs text-green-600 font-medium mt-1">
                                    From {listingTiers.length} listing tier purchases
                                </Text>
                            </View>

                            {/* Category Breakdown */}
                            <View className="space-y-2">
                                {['Barber', "Women's Salon", 'Pet Care'].map(category => {
                                    const categoryTiers = listingTiers.filter(tier => tier.category === category);
                                    const revenue = categoryTiers.reduce((sum, tier) => sum + (tier.tierDetails?.price || 0), 0);
                                    if (categoryTiers.length === 0) return null;
                                    return (
                                        <View key={category} className="flex-row justify-between items-center">
                                            <Text className="text-green-800 text-xs w-[60%]">
                                                {category} ({((categoryTiers.length / listingTiers.length) * 100).toFixed(1)}%)
                                            </Text>
                                            <Text className="text-green-800 font-bold text-xs text-right flex-1">
                                                {categoryTiers.length} • {formatCurrency(revenue)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    <View>
                        <Text className="font-semibold text-gray-700 mb-2">Recent Purchases</Text>
                        {listingTiers.slice(0, 5).map((tier, idx) => (
                            <View key={tier._id || idx} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
                                <View className="flex-row justify-between mb-1">
                                    <View>
                                        <Text className="font-bold text-gray-800 text-sm">{tier.lockedBy?.name || 'Unknown'}</Text>
                                        <Text className="text-[10px] text-gray-500">{tier.lockedBy?.email}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-bold text-indigo-600 text-sm">{tier.tierDetails?.name}</Text>
                                        <Text className="text-[10px] text-gray-400 capitalize">{tier.category}</Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200/50">
                                    <Text className="text-gray-500 text-xs">{formatDate(tier.createdAt)}</Text>
                                    <Text className="text-gray-900 font-bold text-xs">{formatCurrency(tier.tierDetails?.price || 0)}</Text>
                                </View>
                            </View>
                        ))}
                        {listingTiers.length > 5 && (
                            <Text className="text-center text-gray-400 text-xs mt-2">...and {listingTiers.length - 5} more</Text>
                        )}
                    </View>
                </View>

                {/* Ad Placements Section */}
                <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Ad Placements</Text>

                    <View className="flex-row flex-wrap justify-between mb-6">
                        <View className="w-[48%] bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                            <Text className="text-blue-800 text-[10px] font-bold uppercase">Total Ads</Text>
                            <Text className="text-blue-600 text-xl font-bold">{ads.length}</Text>
                        </View>
                        <View className="w-[48%] bg-green-50 p-3 rounded-lg border border-green-100 mb-2">
                            <Text className="text-green-800 text-[10px] font-bold uppercase">Active</Text>
                            <Text className="text-green-600 text-xl font-bold">{ads.filter(ad => ad.status === 'active').length}</Text>
                        </View>
                        <View className="w-[48%] bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            <Text className="text-yellow-800 text-[10px] font-bold uppercase">Pending</Text>
                            <Text className="text-yellow-600 text-xl font-bold">{ads.filter(ad => ad.status === 'pending').length}</Text>
                        </View>
                        <View className="w-[48%] bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <Text className="text-purple-800 text-[10px] font-bold uppercase">Revenue</Text>
                            <Text className="text-purple-600 text-xl font-bold" numberOfLines={1}>
                                {formatCurrency(ads.filter(ad => ad.status === 'active' || ad.status === 'expired').reduce((sum, ad) => sum + ad.price, 0))}
                            </Text>
                        </View>
                    </View>

                    {/* Ad Revenue Summary */}
                    {ads.length > 0 && (
                        <View className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 mb-6">
                            <View className="items-center mb-4">
                                <Text className="text-lg font-bold text-indigo-800 mb-1">Total Ad Revenue</Text>
                                <Text className="text-3xl font-black text-indigo-600">
                                    {formatCurrency(ads.filter(ad => ad.status === 'active' || ad.status === 'expired').reduce((sum, ad) => sum + ad.price, 0))}
                                </Text>
                                <Text className="text-xs text-indigo-600 font-medium mt-1">
                                    From {ads.filter(ad => ad.status === 'active' || ad.status === 'expired').length} completed ad placements
                                </Text>
                            </View>

                            {/* Status Breakdown */}
                            <View className="space-y-2">
                                {ads.filter(ad => ad.status === 'active').length > 0 && (
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-indigo-800 text-xs w-[60%]">
                                            Active Ads ({((ads.filter(ad => ad.status === 'active').length / ads.length) * 100).toFixed(1)}%)
                                        </Text>
                                        <Text className="text-indigo-800 font-bold text-xs text-right flex-1">
                                            {ads.filter(ad => ad.status === 'active').length} • {formatCurrency(ads.filter(ad => ad.status === 'active').reduce((sum, ad) => sum + ad.price, 0))}
                                        </Text>
                                    </View>
                                )}
                                {ads.filter(ad => ad.status === 'expired').length > 0 && (
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-indigo-800 text-xs w-[60%]">
                                            Expired Ads ({((ads.filter(ad => ad.status === 'expired').length / ads.length) * 100).toFixed(1)}%)
                                        </Text>
                                        <Text className="text-indigo-800 font-bold text-xs text-right flex-1">
                                            {ads.filter(ad => ad.status === 'expired').length} • {formatCurrency(ads.filter(ad => ad.status === 'expired').reduce((sum, ad) => sum + ad.price, 0))}
                                        </Text>
                                    </View>
                                )}
                                {ads.filter(ad => ad.status === 'pending').length > 0 && (
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-indigo-800 text-xs w-[60%]">
                                            Pending Ads ({((ads.filter(ad => ad.status === 'pending').length / ads.length) * 100).toFixed(1)}%)
                                        </Text>
                                        <Text className="text-indigo-800 font-bold text-xs text-right flex-1">
                                            {ads.filter(ad => ad.status === 'pending').length} pending approval
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    <View>
                        <Text className="font-semibold text-gray-700 mb-2">All Placements</Text>
                        {ads.map((ad, idx) => (
                            <View key={ad._id || idx} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
                                <View className="flex-row justify-between mb-1">
                                    <View>
                                        <Text className="font-bold text-gray-800 text-sm">{ad.barberId?.name || 'Unknown'}</Text>
                                        <Text className="text-[10px] text-gray-500">{ad.barberId?.email}</Text>
                                    </View>
                                    <View className={`px-2 py-1 rounded-md ${ad.status === 'active' ? 'bg-green-100' :
                                        ad.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-200'
                                        }`}>
                                        <Text className={`text-[10px] font-bold ${ad.status === 'active' ? 'text-green-800' :
                                            ad.status === 'pending' ? 'text-yellow-800' : 'text-gray-800'
                                            } uppercase`}>
                                            {ad.status}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center mb-1 mt-2">
                                    <View className="flex-row items-center">
                                        <Text className="text-xs text-gray-500 font-medium capitalize mr-2">{ad.mediaType || 'N/A'}</Text>
                                        {ad.videoUrl && <Text className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">YouTube</Text>}
                                        {ad.mediaUrl && <Text className="text-[10px] text-green-600 bg-green-50 px-1 rounded">Uploaded</Text>}
                                    </View>
                                    <Text className="text-gray-900 font-bold text-sm">{formatCurrency(ad.price)}</Text>
                                </View>

                                <Text className="text-gray-400 text-[10px] mt-1">{formatDate(ad.startDate)} - {formatDate(ad.endDate)}</Text>
                            </View>
                        ))}
                        {ads.length === 0 && <Text className="text-center text-gray-400">No ads found</Text>}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
