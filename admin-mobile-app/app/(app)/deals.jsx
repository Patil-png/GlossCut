import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, ScrollView, Switch, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DealsScreen() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountPercentage: 0,
        bonusCoins: 0,
        minimumPurchase: 0,
        validUntil: '',
        isActive: true
    });

    const fetchDeals = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const res = await axios.get(`/api/admin/deals?t=${timestamp}`);
            setDeals(res.data);
        } catch (err) {
            console.error('Error fetching deals:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    const handleCreate = () => {
        setEditingDeal(null);
        setFormData({ title: '', description: '', discountPercentage: 0, bonusCoins: 0, minimumPurchase: 0, validUntil: '', isActive: true });
        setShowModal(true);
    };

    const handleEdit = (deal) => {
        setEditingDeal(deal);
        setFormData({
            title: deal.title || '',
            description: deal.description || '',
            discountPercentage: deal.discountPercentage || 0,
            bonusCoins: deal.bonusCoins || 0,
            minimumPurchase: deal.minimumPurchase || 0,
            validUntil: deal.validUntil ? new Date(deal.validUntil).toISOString().split('T')[0] : '',
            isActive: deal.isActive !== undefined ? deal.isActive : true
        });
        setShowModal(true);
    };

    const handleDelete = (dealId) => {
        Alert.alert('Delete Deal', 'Are you sure you want to delete this deal?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`/api/admin/deals/${dealId}`);
                        await fetchDeals(true);
                    } catch (err) {
                        console.error('Error deleting deal:', err);
                        Alert.alert('Error', 'Failed to delete deal');
                    }
                }
            }
        ]);
    };

    const handleSubmit = async () => {
        try {
            if (editingDeal) {
                await axios.put(`/api/admin/deals/${editingDeal._id}`, formData);
            } else {
                await axios.post(`/api/admin/deals`, formData);
            }
            setShowModal(false);
            await fetchDeals(true);
        } catch (err) {
            console.error('Error saving deal:', err);
            Alert.alert('Error', 'Failed to save deal');
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-500 mt-4">Loading deals...</Text>
            </View>
        );
    }

    const activeDeals = deals.filter(d => d.isActive).length;
    const avgDiscount = deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + (d.discountPercentage || 0), 0) / deals.length) : 0;
    const totalCoins = deals.reduce((sum, d) => sum + (d.bonusCoins || 0), 0);

    const renderDealCard = ({ item }) => {
        const isExpired = item.validUntil && new Date(item.validUntil) < new Date();

        return (
            <View
                style={{ backgroundColor: item.isActive && !isExpired ? '#6366F1' : '#9CA3AF' }}
                className="rounded-2xl p-4 mb-3"
            >
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                        <Text className="text-white text-lg font-bold mb-1">{item.title}</Text>
                        <Text className="text-white/80 text-sm">{item.description}</Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white font-bold">{item.discountPercentage}% OFF</Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between bg-white/10 rounded-xl p-3 mb-3">
                    <View className="flex-row items-center">
                        <Ionicons name="gift" size={16} color="white" />
                        <Text className="text-white ml-2 text-sm">{item.bonusCoins || 0} coins</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="cart" size={16} color="white" />
                        <Text className="text-white ml-2 text-sm">
                            Min: ₹{item.minimumPurchase || 0}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="white" />
                        <Text className="text-white ml-2 text-sm">
                            {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'No expiry'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        className="flex-1 bg-white/20 py-2 rounded-lg mr-2 flex-row items-center justify-center"
                    >
                        <Ionicons name="pencil" size={16} color="white" />
                        <Text className="text-white font-semibold ml-1">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item._id)}
                        className="flex-1 bg-red-500/30 py-2 rounded-lg flex-row items-center justify-center"
                    >
                        <Ionicons name="trash-outline" size={16} color="white" />
                        <Text className="text-white font-semibold ml-1">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <View className="pt-12 pb-6 px-6">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black tracking-tight">Deals</Text>
                        <Text className="text-gray-500 text-sm font-medium">Manage promotional offers</Text>
                    </View>
                    <TouchableOpacity onPress={handleCreate} className="h-12 w-12 bg-indigo-100 rounded-2xl items-center justify-center">
                        <Ionicons name="add" size={28} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row">
                    <View className="flex-1 bg-white rounded-xl p-3 mr-2 shadow-sm border border-gray-100">
                        <Text className="text-gray-500 text-xs font-bold">TOTAL</Text>
                        <Text className="text-gray-900 text-2xl font-bold">{deals.length}</Text>
                    </View>
                    <View className="flex-1 bg-green-50 rounded-xl p-3 mr-2 border border-green-100">
                        <Text className="text-green-800 text-xs font-bold">ACTIVE</Text>
                        <Text className="text-green-700 text-2xl font-bold">{activeDeals}</Text>
                    </View>
                    <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <Text className="text-blue-800 text-xs font-bold">AVG %</Text>
                        <Text className="text-blue-700 text-2xl font-bold">{avgDiscount}%</Text>
                    </View>
                </View>
            </View>

            <View className="flex-1 px-4 pt-4">
                {deals.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-center">No deals yet</Text>
                        <TouchableOpacity onPress={handleCreate} className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl">
                            <Text className="text-white font-semibold">Create First Deal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={deals}
                        keyExtractor={(item) => item._id}
                        renderItem={renderDealCard}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => fetchDeals(true)} colors={['#6366F1']} tintColor="#6366F1" />
                        }
                    />
                )}
            </View>

            <Modal visible={showModal} animationType="slide" transparent={true} onRequestClose={() => setShowModal(false)}>
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View className="bg-white rounded-t-3xl" style={{ maxHeight: '90%' }}>
                        <View className="p-6 border-b border-gray-200">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-2xl font-bold text-gray-900">{editingDeal ? 'Edit Deal' : 'New Deal'}</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={28} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">Title</Text>
                                <TextInput
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                    placeholder="Deal title"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.title}
                                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                                />
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                                <TextInput
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                    placeholder="Deal description"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View className="flex-row mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Discount %</Text>
                                    <TextInput
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.discountPercentage.toString()}
                                        onChangeText={(text) => setFormData({ ...formData, discountPercentage: parseInt(text) || 0 })}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Bonus Coins</Text>
                                    <TextInput
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.bonusCoins.toString()}
                                        onChangeText={(text) => setFormData({ ...formData, bonusCoins: parseInt(text) || 0 })}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl mb-6">
                                <Text className="font-semibold text-gray-900">Active Status</Text>
                                <Switch
                                    value={formData.isActive}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                                    trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                                    thumbColor={formData.isActive ? '#6366F1' : '#F3F4F6'}
                                />
                            </View>

                            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8}>

                                <View className="w-full py-4 rounded-xl items-center bg-indigo-600">
                                    <Text className="text-white font-bold text-base">{editingDeal ? 'Update Deal' : 'Create Deal'}</Text>
                                </View>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal >
        </View >
    );
}
