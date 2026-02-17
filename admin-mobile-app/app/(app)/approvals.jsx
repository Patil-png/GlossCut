import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function ApprovalsScreen() {
    const [pendingCards, setPendingCards] = useState({ barberCards: [], shops: [], deleteRequests: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState(null);
    const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'shops', 'deletes'
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [rejectionData, setRejectionData] = useState({ type: null, id: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    const fetchPendingData = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);
        try {
            const timestamp = new Date().getTime();
            // Fetch both card approvals and delete requests
            const [cardsRes, deleteRequestsRes] = await Promise.all([
                axios.get(`/api/admin/cards?t=${timestamp}`),
                axios.get(`/api/admin/delete-requests?t=${timestamp}`)
            ]);

            setPendingCards({
                ...cardsRes.data,
                deleteRequests: deleteRequestsRes.data
            });
        } catch (err) {
            console.error('Error fetching pending data:', err);
            Alert.alert('Error', 'Failed to load pending requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingData();
    }, [fetchPendingData]);

    const handleApprove = async (type, id) => {
        Alert.alert(
            'Confirm Approval',
            `Are you sure you want to approve this ${type}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setProcessing({ type, id, action: 'approve' });
                        try {
                            const endpoint = type === 'barber' ? `/api/admin/cards/barber/${id}/approve` : `/api/admin/cards/shop/${id}/approve`;
                            await axios.put(endpoint);
                            fetchPendingData(true);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to approve');
                        } finally {
                            setProcessing(null);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = (type, id) => {
        setRejectionData({ type, id });
        setRejectionReason('');
        setRejectionModalVisible(true);
    };

    const submitRejection = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a rejection reason');
            return;
        }

        const { type, id } = rejectionData;
        setProcessing({ type, id, action: 'reject' });
        setRejectionModalVisible(false);

        try {
            let endpoint;
            if (type === 'delete') {
                endpoint = `/api/admin/delete-requests/${id}/reject`;
            } else {
                endpoint = type === 'barber' ? `/api/admin/cards/barber/${id}/reject` : `/api/admin/cards/shop/${id}/reject`;
            }
            await axios.put(endpoint, { rejectionReason });
            fetchPendingData(true);
        } catch (err) {
            console.error('Rejection error:', err);
            Alert.alert('Error', 'Failed to reject request');
        } finally {
            setProcessing(null);
            setRejectionData({ type: null, id: null });
        }
    };

    const handleDeleteApprove = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to approve this delete request? The card will be permanently removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing({ type: 'delete', id, action: 'approve' });
                        try {
                            await axios.put(`/api/admin/delete-requests/${id}/approve`);
                            fetchPendingData(true);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete');
                        } finally {
                            setProcessing(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    const { barberCards = [], shops = [], deleteRequests = [] } = pendingCards;

    const renderChangeDetails = (changeDetails = []) => {
        if (changeDetails.length === 0) return null;

        const formatValue = (field, value) => {
            if (value === undefined || value === null) return 'N/A';
            if (field === 'image' || field === 'profilePicture') {
                const url = typeof value === 'string' && !value.startsWith('http') ? `${apiUrl}${value}` : value;
                return String(url);
            }
            if (field === 'services' && Array.isArray(value)) {
                return value.map(s => `${s.name || 'Service'} (${s.price || '0'})`).join(', ');
            }
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        };

        return (
            <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-gray-900 font-bold text-xs uppercase mb-3 tracking-wider">What Changed?</Text>
                {changeDetails.map((change, index) => (
                    <View key={index} className="mb-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                        <View className="flex-row items-center mb-1">
                            <View className="w-1 h-4 bg-amber-400 rounded-full mr-2" />
                            <Text className="text-amber-900 font-bold text-xs capitalize">{change.field.replace(/([A-Z])/g, ' $1')}</Text>
                        </View>
                        <View className="ml-3 space-y-1">
                            {change.oldValue !== undefined && (
                                <Text className="text-gray-500 text-[10px] line-through" numberOfLines={2}>
                                    From: {formatValue(change.field, change.oldValue)}
                                </Text>
                            )}
                            <Text className="text-amber-800 text-[10px] font-semibold" numberOfLines={2}>
                                To: {formatValue(change.field, change.newValue)}
                            </Text>
                            {change.description && (
                                <Text className="text-amber-700/60 text-[9px] italic mt-1">{change.description}</Text>
                            )}
                        </View>

                        {/* Visual comparison for images */}
                        {(change.field === 'image' || change.field === 'profilePicture') && (
                            <View className="flex-row mt-3 gap-4 justify-center">
                                {change.oldValue && (
                                    <View className="items-center">
                                        <Text className="text-[8px] text-gray-400 uppercase font-bold mb-1">Old</Text>
                                        <Image
                                            source={{ uri: formatValue(change.field, change.oldValue) }}
                                            className="w-16 h-16 rounded-lg opacity-60 border border-gray-200"
                                        />
                                    </View>
                                )}
                                {change.newValue && (
                                    <View className="items-center">
                                        <Text className="text-[8px] text-amber-500 uppercase font-bold mb-1">New</Text>
                                        <Image
                                            source={{ uri: formatValue(change.field, change.newValue) }}
                                            className="w-16 h-16 rounded-lg border border-amber-200"
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchPendingData(true)} />
            }
        >
            {/* Header */}
            <View className="bg-white px-6 pt-6 pb-6 rounded-b-3xl shadow-sm mb-6">
                <Text className="text-gray-900 text-2xl font-black tracking-tight mb-1">Approvals</Text>
                <Text className="text-gray-500 text-sm font-medium">Review and verify requests</Text>

                <View className="flex-row gap-3 mt-6">
                    <View className="flex-1 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <Text className="text-blue-800 font-bold text-2xl">{barberCards.length}</Text>
                        <Text className="text-blue-600 text-[10px] font-bold uppercase">Cards</Text>
                    </View>
                    <View className="flex-1 bg-green-50 p-4 rounded-2xl border border-green-100">
                        <Text className="text-green-800 font-bold text-2xl">{shops.length}</Text>
                        <Text className="text-green-600 text-[10px] font-bold uppercase">Shops</Text>
                    </View>
                    <View className="flex-1 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <Text className="text-purple-800 font-bold text-2xl">{deleteRequests.length}</Text>
                        <Text className="text-purple-600 text-[10px] font-bold uppercase">Deletes</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row px-4 mb-4 gap-2">
                {['cards', 'shops', 'deletes'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-xl items-center ${activeTab === tab ? 'bg-indigo-600' : 'bg-white border border-gray-100'}`}
                    >
                        <Text className={`font-bold capitalize ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
                            {tab === 'deletes' ? 'Deletes' : tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Section */}
            <View className="px-4 pb-10">
                {activeTab === 'cards' && (
                    <View>
                        {barberCards.length === 0 ? (
                            <View className="items-center py-10">
                                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                                <Text className="text-gray-500 mt-2">No pending barber cards</Text>
                            </View>
                        ) : (
                            barberCards.map(card => (
                                <View key={card._id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden">
                                            {card.barberId?.profilePicture ? (
                                                <Image
                                                    source={{ uri: card.barberId.profilePicture.startsWith('http') ? card.barberId.profilePicture : `${apiUrl}${card.barberId.profilePicture}` }}
                                                    className="w-12 h-12"
                                                />
                                            ) : (
                                                <Ionicons name="person" size={24} color="#9CA3AF" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-bold text-base">{card.name}</Text>
                                            <View className="flex-row items-center mt-0.5">
                                                <Ionicons name="mail-outline" size={10} color="#9CA3AF" />
                                                <Text className="text-gray-500 text-[10px] ml-1">{card.barberId?.email || 'N/A'}</Text>
                                            </View>
                                            {card.barberId?.phone && (
                                                <View className="flex-row items-center">
                                                    <Ionicons name="call-outline" size={10} color="#9CA3AF" />
                                                    <Text className="text-gray-500 text-[10px] ml-1">{card.barberId.phone}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="bg-blue-50 px-2 py-1 rounded-lg self-start">
                                            <Text className="text-blue-700 text-[10px] font-bold uppercase">{card.services?.length || 0} Services</Text>
                                        </View>
                                    </View>

                                    {card.shopId && (
                                        <View className="bg-gray-50 p-3 rounded-xl mb-4 flex-row items-center border border-gray-100">
                                            <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3 shadow-sm">
                                                <Ionicons name="business" size={16} color="#4F46E5" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Base Shop</Text>
                                                <Text className="text-gray-900 font-bold text-sm">{card.shopId.name}</Text>
                                                <Text className="text-gray-500 text-[10px]" numberOfLines={1}>{card.shopId.address}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Specialties & Info */}
                                    <View className="flex-row gap-2 mb-4">
                                        {(card.specialties || []).slice(0, 2).map((s, i) => (
                                            <View key={i} className="bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">
                                                <Text className="text-indigo-600 text-[10px] font-bold uppercase">{s}</Text>
                                            </View>
                                        ))}
                                        <View className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200/50 flex-row items-center">
                                            <Ionicons name="time-outline" size={10} color="#6B7280" className="mr-1" />
                                            <Text className="text-gray-600 text-[10px] font-bold uppercase ml-1">{card.avgAppointmentTime || '30 min'}</Text>
                                        </View>
                                    </View>

                                    {/* SHOW CHANGES IF ANY */}
                                    {renderChangeDetails(card.changeDetails)}

                                    <View className="flex-row gap-3 mt-4">
                                        <TouchableOpacity
                                            onPress={() => handleApprove('barber', card._id)}
                                            disabled={!!processing}
                                            className="flex-1 bg-indigo-600 h-12 rounded-2xl items-center justify-center shadow-md shadow-indigo-200"
                                        >
                                            <Text className="text-white font-bold text-base">Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleReject('barber', card._id)}
                                            disabled={!!processing}
                                            className="w-20 bg-white h-12 rounded-2xl items-center justify-center border border-gray-200"
                                        >
                                            <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'shops' && (
                    <View>
                        {shops.length === 0 ? (
                            <View className="items-center py-10">
                                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                                <Text className="text-gray-500 mt-2">No pending shops</Text>
                            </View>
                        ) : (
                            shops.map(shop => (
                                <View key={shop._id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                                    <View className="mb-4">
                                        <Text className="text-gray-900 font-bold text-lg">{shop.name}</Text>
                                        <Text className="text-gray-500 text-sm mt-1">{shop.address}</Text>
                                        <View className="flex-row mt-2">
                                            <View className="bg-indigo-50 px-2 py-1 rounded-lg mr-2">
                                                <Text className="text-indigo-700 text-[10px] font-bold uppercase">{shop.category}</Text>
                                            </View>
                                            <View className="bg-gray-50 px-2 py-1 rounded-lg">
                                                <Text className="text-gray-700 text-[10px] font-bold lowercase">Owner: {shop.owner?.name || 'Unknown'}</Text>
                                                {shop.owner?.email && (
                                                    <Text className="text-gray-500 text-[8px]">{shop.owner.email}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* SHOW CHANGES IF ANY */}
                                    {renderChangeDetails(shop.changeDetails)}

                                    <View className="flex-row gap-3 mt-4">
                                        <TouchableOpacity
                                            onPress={() => handleApprove('shop', shop._id)}
                                            disabled={!!processing}
                                            className="flex-1 bg-green-600 h-12 rounded-2xl items-center justify-center shadow-md shadow-green-100"
                                        >
                                            <Text className="text-white font-bold text-base">Approve Shop</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleReject('shop', shop._id)}
                                            disabled={!!processing}
                                            className="w-20 bg-white h-12 rounded-2xl items-center justify-center border border-gray-200"
                                        >
                                            <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'deletes' && (
                    <View>
                        {deleteRequests.length === 0 ? (
                            <View className="items-center py-10">
                                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                                <Text className="text-gray-500 mt-2">No pending delete requests</Text>
                            </View>
                        ) : (
                            deleteRequests.map(request => (
                                <View key={request._id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                                    <View className="mb-4">
                                        <View className="flex-row justify-between items-start">
                                            <View className="flex-1">
                                                <Text className="text-red-600 font-bold text-base uppercase mb-1">Delete Request</Text>
                                                <Text className="text-gray-900 font-bold text-lg">{request.barberCardId?.name || 'Card Removed'}</Text>
                                            </View>
                                            <View className="bg-red-50 px-2 py-1 rounded-lg">
                                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                            </View>
                                        </View>
                                        <Text className="text-gray-500 text-sm mt-2 font-medium italic">"{request.reason || 'No reason provided'}"</Text>
                                        <View className="mt-3 pt-3 border-t border-gray-50 flex-row">
                                            <View className="mr-4">
                                                <Text className="text-gray-400 text-[10px] uppercase font-bold">Barber</Text>
                                                <Text className="text-gray-700 text-xs font-bold">{request.barberId?.name || 'Unknown'}</Text>
                                            </View>
                                            <View>
                                                <Text className="text-gray-400 text-[10px] uppercase font-bold">Shop</Text>
                                                <Text className="text-gray-700 text-xs font-bold">{request.shopId?.name || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            onPress={() => handleDeleteApprove(request._id)}
                                            disabled={!!processing}
                                            className="flex-1 bg-red-600 py-3 rounded-xl items-center justify-center"
                                        >
                                            <Text className="text-white font-bold">Confirm Delete</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleReject('delete', request._id)}
                                            disabled={!!processing}
                                            className="flex-1 bg-gray-100 py-3 rounded-xl items-center justify-center border border-gray-200"
                                        >
                                            <Text className="text-gray-600 font-bold">Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </View>

            {/* Rejection Reason Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={rejectionModalVisible}
                onRequestClose={() => setRejectionModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 items-center justify-center px-6">
                    <View className="bg-white w-full rounded-3xl p-6 shadow-2xl">
                        <View className="items-center mb-4">
                            <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mb-2">
                                <Ionicons name="close-circle" size={32} color="#EF4444" />
                            </View>
                            <Text className="text-gray-900 text-xl font-bold">Reject Request</Text>
                            <Text className="text-gray-500 text-sm text-center mt-1">
                                Give a reason for rejecting this {rejectionData.type === 'delete' ? 'delete request' : rejectionData.type === 'barber' ? 'barber' : 'shop'}.
                            </Text>
                        </View>

                        <TextInput
                            multiline
                            numberOfLines={4}
                            placeholder="Type reason here..."
                            className="bg-gray-50 rounded-2xl p-4 text-gray-900 text-sm min-h-[100px] border border-gray-100 mb-6"
                            textAlignVertical="top"
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setRejectionModalVisible(false)}
                                className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-gray-600 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={submitRejection}
                                className="flex-1 bg-red-600 py-4 rounded-2xl items-center shadow-lg shadow-red-100"
                            >
                                <Text className="text-white font-bold">Reject Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
