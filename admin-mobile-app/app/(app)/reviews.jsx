import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReviewsScreen() {
    const [barberReviews, setBarberReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedBarbers, setExpandedBarbers] = useState(new Set());

    const fetchBarberReviews = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        try {
            const res = await axios.get('/api/admin/barber-reviews');
            setBarberReviews(res.data);
        } catch (err) {
            console.error('Error fetching barber reviews:', err);
        } finally {
            setLoading(false);
            if (showRefreshIndicator) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBarberReviews();
    }, [fetchBarberReviews]);

    const toggleBarberExpansion = (barberId) => {
        const newExpanded = new Set(expandedBarbers);
        if (newExpanded.has(barberId)) {
            newExpanded.delete(barberId);
        } else {
            newExpanded.add(barberId);
        }
        setExpandedBarbers(newExpanded);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-500 mt-4">Loading reviews...</Text>
            </View>
        );
    }

    const totalReviews = barberReviews.reduce((sum, barber) => sum + barber.totalReviews, 0);

    const renderStars = (rating) => {
        return (
            <View className="flex-row">
                {[...Array(5)].map((_, i) => (
                    <Text key={i} style={{ color: i < Math.floor(rating) ? '#FBBF24' : '#E5E7EB', fontSize: 14 }}>
                        ★
                    </Text>
                ))}
            </View>
        );
    };

    const renderBarberItem = ({ item: barberData }) => {
        const isExpanded = expandedBarbers.has(barberData.barberId);

        return (
            <View className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-100">
                {/* Barber Header */}
                <TouchableOpacity
                    onPress={() => toggleBarberExpansion(barberData.barberId)}
                    activeOpacity={0.7}
                >
                    <View
                        className={`p-4 ${isExpanded ? 'bg-indigo-50/50' : 'bg-white'}`}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-gray-900 mb-2">{barberData.barberName}</Text>

                                <View className="flex-row items-center">
                                    <View className="bg-amber-50 px-3 py-1 rounded-full flex-row items-center mr-3">
                                        <Text className="text-amber-900 font-bold mr-1">{barberData.averageRating.toFixed(1)}</Text>
                                        {renderStars(barberData.averageRating)}
                                    </View>
                                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                                        <Text className="text-gray-700 text-xs font-medium">
                                            {barberData.totalReviews} reviews
                                        </Text>
                                    </View>
                                </View>

                                {/* Rating Distribution */}
                                <View className="flex-row mt-3 flex-wrap">
                                    {[5, 4, 3, 2, 1].map(rating => (
                                        <View key={rating} className="flex-row items-center mr-3 mb-1">
                                            <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600' }}>{rating}★</Text>
                                            <View className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                                                <Text className="text-gray-700 text-xs font-semibold">
                                                    {barberData.ratingDistribution[rating] || 0}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View className="ml-3">
                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#6366F1"
                                />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Individual Reviews */}
                {isExpanded && (
                    <View className="border-t border-gray-100">
                        {barberData.reviews.map((review, index) => (
                            <View
                                key={review._id}

                                className={`p-4 ${index !== barberData.reviews.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <View className="flex-row items-start justify-between mb-2">
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-1">
                                            <View className="h-8 w-8 bg-indigo-100 rounded-full items-center justify-center mr-2">
                                                <Text className="text-indigo-600 font-bold text-xs">
                                                    {(review.userId?.name || 'A').charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className="font-semibold text-gray-900">
                                                    {review.userId?.name || 'Anonymous'}
                                                </Text>
                                                <Text className="text-xs text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center">
                                        {renderStars(review.rating)}
                                        <Text className="text-sm font-bold text-gray-900 ml-1">{review.rating}</Text>
                                    </View>
                                </View>

                                <Text className="text-gray-700 text-sm leading-5">{review.comment}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            {/* Header */}
            <View className="pt-12 pb-6 px-6">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black tracking-tight">Reviews</Text>
                        <Text className="text-gray-500 text-sm font-medium">Total: {totalReviews} reviews</Text>
                    </View>
                    <View className="h-12 w-12 bg-indigo-100 rounded-2xl items-center justify-center">
                        <Ionicons name="star" size={24} color="#4F46E5" />
                    </View>
                </View>
            </View>

            {/* Reviews List */}
            <View className="flex-1 px-4 pt-4">
                {barberReviews.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-center">No reviews yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={barberReviews}
                        keyExtractor={(item) => item.barberId}
                        renderItem={renderBarberItem}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => fetchBarberReviews(true)}
                                colors={['#6366F1']}
                                tintColor="#6366F1"
                            />
                        }
                    />
                )}
            </View>
        </View>
    );
}
