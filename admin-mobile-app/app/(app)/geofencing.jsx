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
import MapView, { Polygon, Marker } from 'react-native-maps';


export default function GeofencingScreen() {
    const insets = useSafeAreaInsets();
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDrawModalVisible, setIsDrawModalVisible] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);
    const [pricing, setPricing] = useState({});

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [draftPolygon, setDraftPolygon] = useState([]);
    const [newAreaName, setNewAreaName] = useState('');

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

    const handleMapPress = (e) => {
        if (!isDrawing) return;
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setDraftPolygon([...draftPolygon, { latitude, longitude }]);
    };

    const undoLastPoint = () => {
        setDraftPolygon(draftPolygon.slice(0, -1));
    };

    const startDrawing = () => {
        setDraftPolygon([]);
        setIsDrawing(true);
        setIsDrawModalVisible(true);
    };

    const finishDrawing = () => {
        if (draftPolygon.length < 3) {
            Alert.alert('Error', 'Please draw at least 3 points to form a polygon');
            return;
        }

        // Setup default pricing for new area
        const initialPricing = {};
        for (let i = 1; i <= 10; i++) {
            initialPricing[i] = 1000 - (i - 1) * 100;
        }
        setPricing(initialPricing);
        setNewAreaName('');
        setIsEditModalVisible(true);
    };

    const handleSaveNewArea = async () => {
        if (!newAreaName.trim()) {
            Alert.alert('Error', 'Please enter a name for the area');
            return;
        }

        try {
            // Convert to GeoJSON format [lng, lat]
            const coordinates = draftPolygon.map(p => [p.longitude, p.latitude]);
            // Close the polygon by adding the first point at the end
            coordinates.push(coordinates[0]);

            const tierPricingArray = Object.keys(pricing).map(id => ({
                tierId: parseInt(id),
                price: parseFloat(pricing[id])
            }));

            await axios.post('/api/areas', {
                name: newAreaName,
                polygon: {
                    type: 'Polygon',
                    coordinates: [coordinates]
                },
                tierPricing: tierPricingArray
            });

            Alert.alert('Success', 'New service area created');
            setIsEditModalVisible(false);
            setIsDrawModalVisible(false);
            setIsDrawing(false);
            setDraftPolygon([]);
            fetchAreas();
        } catch (err) {
            console.error('Error saving area:', err);
            Alert.alert('Error', 'Failed to save service area');
        }
    };

    const handleEditPricing = (area) => {
        setSelectedArea(area);
        const initialPricing = {};
        for (let i = 1; i <= 10; i++) {
            const tierData = area.tierPricing?.find(t => t.tierId === i);
            initialPricing[i] = tierData ? tierData.price : (1000 - (i - 1) * 100);
        }
        setPricing(initialPricing);
        setIsEditModalVisible(true);
    };

    const handleUpdateArea = async () => {
        try {
            const tierPricingArray = Object.keys(pricing).map(id => ({
                tierId: parseInt(id),
                price: parseFloat(pricing[id])
            }));

            await axios.put(`/api/areas/${selectedArea._id}`, {
                tierPricing: tierPricingArray
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
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black tracking-tight">Geofencing</Text>
                        <Text className="text-gray-500 text-sm font-medium">Regional Priority Management</Text>
                    </View>
                    <TouchableOpacity
                        onPress={startDrawing}
                        className="bg-indigo-600 w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200"
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Status List */}
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
                                    <Text className="text-2xl font-black text-indigo-600">
                                        ₹{area.tierPricing?.find(t => t.tierId === 1)?.price || 'N/A'}
                                    </Text>
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
                            <Text className="text-gray-300 text-xs mt-1">Tap + to draw your first service area</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Drawing Modal */}
            <Modal visible={isDrawModalVisible} animationType="fade">
                <View className="flex-1 bg-white">
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: 20.5937,
                            longitude: 78.9629,
                            latitudeDelta: 20,
                            longitudeDelta: 20,
                        }}
                        onPress={handleMapPress}
                    >
                        {/* Current Polygons */}
                        {areas.map(area => (
                            <Polygon
                                key={area._id}
                                coordinates={area.polygon.coordinates[0].map(c => ({ longitude: c[0], latitude: c[1] }))}
                                fillColor="rgba(99, 102, 241, 0.1)"
                                strokeColor="rgba(99, 102, 241, 0.5)"
                                strokeWidth={2}
                            />
                        ))}

                        {/* Draft Polygon */}
                        {draftPolygon.length > 0 && (
                            <>
                                <Polygon
                                    coordinates={draftPolygon}
                                    fillColor="rgba(79, 70, 229, 0.3)"
                                    strokeColor="#4F46E5"
                                    strokeWidth={3}
                                />
                                {draftPolygon.map((p, i) => (
                                    <Marker key={i} coordinate={p}>
                                        <View className="w-3 h-3 bg-white rounded-full border-2 border-indigo-600" />
                                    </Marker>
                                ))}
                            </>
                        )}
                    </MapView>

                    {/* Drawing HUD */}
                    <View style={{ position: 'absolute', top: insets.top + 20, left: 20, right: 20 }}>
                        <View className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-xl flex-row justify-between items-center">
                            <TouchableOpacity onPress={() => { setIsDrawModalVisible(false); setIsDrawing(false); }} className="w-10 h-10 bg-gray-100 rounded-2xl items-center justify-center">
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <View className="items-center">
                                <Text className="text-gray-900 font-black tracking-tight">Drawing Mode</Text>
                                <Text className="text-gray-500 text-[10px] font-bold uppercase">{draftPolygon.length} Points Added</Text>
                            </View>
                            <TouchableOpacity onPress={undoLastPoint} className="w-10 h-10 bg-gray-100 rounded-2xl items-center justify-center">
                                <Ionicons name="arrow-undo-outline" size={20} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ position: 'absolute', bottom: insets.bottom + 40, left: 40, right: 40 }}>
                        <TouchableOpacity
                            onPress={finishDrawing}
                            className="bg-indigo-600 py-5 rounded-3xl items-center shadow-2xl shadow-indigo-400"
                        >
                            <Text className="text-white font-black uppercase tracking-[2px]">Finish Polygon</Text>
                        </TouchableOpacity>
                        <Text className="text-center text-gray-500 text-[10px] font-bold mt-4 uppercase tracking-widest bg-white/80 py-1 rounded-full self-center px-4">Tap on map to place points</Text>
                    </View>
                </View>
            </Modal>

            {/* Save/Edit Modal */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-6 max-h-[85%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1">
                                {isDrawing ? (
                                    <TextInput
                                        placeholder="Region Name (e.g. Mumbai South)"
                                        value={newAreaName}
                                        onChangeText={setNewAreaName}
                                        className="text-xl font-black text-gray-900 p-0"
                                        autoFocus
                                    />
                                ) : (
                                    <Text className="text-xl font-black text-gray-900">{selectedArea?.name}</Text>
                                )}
                                <Text className="text-xs text-gray-500 font-bold uppercase tracking-widest">{isDrawing ? 'Finalize New Region' : 'Adjust Tier Pricing'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="mb-6" showsVerticalScrollIndicator={false}>
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
                            onPress={isDrawing ? handleSaveNewArea : handleUpdateArea}
                            className="bg-indigo-600 py-5 rounded-3xl items-center shadow-lg shadow-indigo-200 mb-6"
                        >
                            <Text className="text-white font-black uppercase tracking-widest">
                                {isDrawing ? 'Save Service Area' : 'Save Regional Prices'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
