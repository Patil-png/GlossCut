import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    RefreshControl,
    Dimensions
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function GeofencingScreen() {
    const insets = useSafeAreaInsets();
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);
    const [pricing, setPricing] = useState({});

    const fetchAreas = useCallback(async () => {
        try {
            const res = await axios.get('/api/areas');
            setAreas(res.data);
        } catch (err) {
            console.error('Error fetching areas:', err);
            Alert.alert('Error', 'Failed to load service areas');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAreas();
    }, [fetchAreas]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAreas();
    };

    const handleEditPricing = (area) => {
        setSelectedArea(area);
        // Default pricing (1-10)
        const initialPricing = {};
        for (let i = 1; i <= 10; i++) {
            initialPricing[i] = area.tierPricing?.[i] || (1000 - (i - 1) * 100);
        }
        setPricing(initialPricing);
        setIsEditModalVisible(true);
    };

    const handleSavePricing = async () => {
        try {
            await axios.put(`/api/areas/${selectedArea._id}`, {
                tierPricing: pricing
            });
            Alert.alert('Success', 'Pricing updated successfully');
            setIsEditModalVisible(false);
            fetchAreas();
        } catch (err) {
            console.error('Error saving pricing:', err);
            Alert.alert('Error', 'Failed to update pricing');
        }
    };

    const toggleAreaStatus = async (area) => {
        try {
            await axios.put(`/api/areas/${area._id}`, {
                isActive: !area.isActive
            });
            fetchAreas();
        } catch (err) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const deleteArea = (area) => {
        Alert.alert(
            'Delete Area',
            `Are you sure you want to delete "${area.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/areas/${area._id}`);
                            fetchAreas();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete area');
                        }
                    }
                }
            ]
        );
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
            >
                <View className="mb-6">
                    <Text className="text-gray-900 text-2xl font-black tracking-tight">Geofencing</Text>
                    <Text className="text-gray-500 text-sm font-medium">Regional Priority Management</Text>
                </View>

                {/* Important Note */}
                <View className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex-row items-center mb-6">
                    <Ionicons name="information-circle" size={24} color="#4F46E5" />
                    <Text className="text-indigo-800 text-xs font-bold flex-1 ml-3 leading-4">
                        Drawing new polygons is currently optimized for the Web Admin Panel. Use the app for status and pricing management.
                    </Text>
                </View>

                <View className="space-y-4">
                    {areas.map((area) => (
                        <View key={area._id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <View>
                                    <View className="flex-row items-center">
                                        <Text className="text-lg font-black text-gray-900">{area.name}</Text>
                                        <View className={`ml-2 px-2 py-0.5 rounded-full ${area.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                            <Text className={`text-[8px] font-black uppercase ${area.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                                                {area.isActive ? 'Active' : 'Inactive'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        {area.polygon.coordinates[0].length} Points Area
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => toggleAreaStatus(area)}
                                        className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-2 border border-gray-100"
                                    >
                                        <Ionicons name={area.isActive ? "eye-off-outline" : "eye-outline"} size={20} color="#6366F1" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteArea(area)}
                                        className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center border border-red-100"
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tier 1 Pricing (Top Position)</Text>
                                <View className="flex-row items-baseline">
                                    <Text className="text-2xl font-black text-indigo-600">₹{area.tierPricing?.[1] || 'N/A'}</Text>
                                    <Text className="text-xs text-gray-500 font-bold ml-1">/ month</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleEditPricing(area)}
                                className="bg-indigo-600 py-4 rounded-xl items-center shadow-lg shadow-indigo-200"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Manage All Tiers</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {areas.length === 0 && (
                        <View className="items-center justify-center py-20">
                            <Ionicons name="map-outline" size={64} color="#E5E7EB" />
                            <Text className="text-gray-400 font-bold mt-4 tracking-tight">No Regions Defined</Text>
                            <Text className="text-gray-300 text-xs mt-1">Add polygons via the Web Web Dashboard</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Pricing Modal */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-6 max-h-[85%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-xl font-black text-gray-900">{selectedArea?.name}</Text>
                                <Text className="text-xs text-gray-500 font-bold uppercase tracking-widest">Adjust Tier Pricing</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="mb-6">
                            {Object.keys(pricing).map((tierId) => (
                                <View key={tierId} className="flex-row items-center justify-between py-3 border-b border-gray-50">
                                    <View>
                                        <Text className="text-sm font-black text-gray-700">Tier {tierId}</Text>
                                        <Text className="text-[10px] text-gray-400 font-bold uppercase">Rank Position {tierId}</Text>
                                    </View>
                                    <View className="flex-row items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <Text className="text-gray-400 font-bold mr-1">₹</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={pricing[tierId]?.toString()}
                                            onChangeText={(val) => setPricing({ ...pricing, [tierId]: val })}
                                            className="text-gray-900 font-black w-20 text-right"
                                        />
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleSavePricing}
                            className="bg-indigo-600 py-5 rounded-2xl items-center shadow-lg shadow-indigo-200 mb-6"
                        >
                            <Text className="text-white font-black uppercase tracking-widest">Save Regional Prices</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
