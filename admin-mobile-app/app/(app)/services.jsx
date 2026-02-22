import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, ScrollView, Switch, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServicesScreen() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'General',
        isActive: true
    });
    const [categoriesList, setCategoriesList] = useState([]);
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [catFormData, setCatFormData] = useState({ name: '', emoji: '✨', color: '#6366F1', gender: 'unisex', isActive: true });

    const [targetService, setTargetService] = useState(null);

    // Shop filtering states
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState(''); // Default to 'All'

    const activeServices = services.filter(s => s.isActive).length;
    const categoriesCount = categoriesList.length;

    const fetchServices = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const shopQuery = selectedShopId ? `shopId=${selectedShopId}` : '';
            const res = await axios.get(`/api/admin/services?${shopQuery}&t=${timestamp}`);
            setServices(res.data);
        } catch (err) {
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedShopId]);

    const fetchCats = useCallback(async () => {
        try {
            const res = await axios.get(`/api/admin/categories?shopId=${selectedShopId || ''}`);
            setCategoriesList(res.data);
        } catch (err) {
            console.error('Error fetching categories for dropdown:', err);
        }
    }, [selectedShopId]);

    const fetchShops = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/shops');
            setShops(res.data);
        } catch (err) {
            console.error('Error fetching shops:', err);
        }
    }, []);

    useEffect(() => {
        fetchServices();
        fetchCats();
        fetchShops();
    }, [fetchServices, fetchCats, fetchShops]);

    const handleCreate = () => {
        setEditingService(null);
        setFormData({ name: '', description: '', category: 'General', isActive: true });
        setShowModal(true);
    };

    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name || '',
            description: service.description || '',
            category: service.category || 'General',
            isActive: service.isActive !== undefined ? service.isActive : true
        });
        setShowModal(true);
    };

    const handleDelete = (serviceId) => {
        Alert.alert(
            'Delete Service',
            'Are you sure you want to delete this service?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/admin/services/${serviceId}`);
                            await fetchServices(true);
                        } catch (err) {
                            console.error('Error deleting service:', err);
                            Alert.alert('Error', 'Failed to delete service');
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        try {
            const dataToSave = {
                ...formData,
                shopId: selectedShopId || null
            };

            if (editingService) {
                await axios.put(`/api/admin/services/${editingService._id}`, dataToSave);
            } else {
                await axios.post(`/api/admin/services`, dataToSave);
            }
            setShowModal(false);
            await fetchServices(true);
        } catch (err) {
            console.error('Error saving service:', err);
            const errorMessage = err.response?.data?.msg || err.message || 'Failed to save service';
            Alert.alert('Error', errorMessage);
        }
    };



    const handleCatDelete = (catId) => {
        Alert.alert(
            'Delete Category',
            'Are you sure you want to delete this category? This might affect services using it.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/admin/categories/${catId}`);
                            await fetchCats();
                        } catch (err) {
                            console.error('Error deleting category:', err);
                            Alert.alert('Error', 'Failed to delete category');
                        }
                    }
                }
            ]
        );
    };

    const handleCatEdit = (cat) => {
        setEditingCat(cat);
        setCatFormData({
            name: cat.name,
            emoji: cat.emoji || '✨',
            color: cat.color || '#6366F1',
            gender: cat.gender || 'unisex',
            isActive: cat.isActive !== undefined ? cat.isActive : true
        });
    };

    const handleCatSubmit = async () => {
        if (!catFormData.name.trim()) return Alert.alert('Error', 'Name is required');
        const dataToSave = {
            ...catFormData,
            shopId: selectedShopId || null
        };
        try {
            if (editingCat) {
                await axios.put(`/api/admin/categories/${editingCat._id}`, dataToSave);
            } else {
                await axios.post(`/api/admin/categories`, dataToSave);
            }
            setEditingCat(null);
            setCatFormData({ name: '', emoji: '✨', color: '#6366F1', gender: 'unisex', isActive: true });
            await fetchCats();
        } catch (err) {
            Alert.alert('Error', 'Failed to save category');
        }
    };

    const handleSyncCategories = async () => {
        const uniqueCats = [...new Set(services.map(s => s.category))].filter(Boolean);
        const missingCats = uniqueCats.filter(name => !categoriesList.find(c => c.name === name));

        if (missingCats.length === 0) {
            return Alert.alert('Sync Complete', 'All categories are already synced!');
        }

        try {
            setLoading(true);
            for (const name of missingCats) {
                await axios.post('/api/admin/categories', { name, emoji: '💈', color: '#6366F1', gender: 'unisex', shopId: selectedShopId || null });
            }
            await fetchCats();
            Alert.alert('Success', `Synced ${missingCats.length} new categories!`);
        } catch (err) {
            Alert.alert('Error', 'Sync failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-500 mt-4">Loading services...</Text>
            </View>
        );
    }


    const renderServiceCard = ({ item }) => (
        <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2">
                        <Text className="text-lg font-bold text-gray-900 flex-1">{item.name}</Text>
                        <View className={`px-2 py-1 rounded-full ${item.isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                            <Text className={`text-xs font-semibold ${item.isActive ? 'text-green-800' : 'text-gray-600'}`}>
                                {item.isActive ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-gray-600 text-sm mb-2">{item.description}</Text>

                    <View className="flex-row items-center">
                        <View className="bg-indigo-50 px-2 py-1 rounded-md">
                            <Text className="text-indigo-700 text-xs font-medium">{item.category}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs ml-2">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    className="flex-1 bg-indigo-50 py-2 rounded-lg mr-2 flex-row items-center justify-center"
                >
                    <Ionicons name="pencil" size={16} color="#6366F1" />
                    <Text className="text-indigo-600 font-semibold ml-1">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    className="flex-1 bg-red-50 py-2 rounded-lg flex-row items-center justify-center"
                >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text className="text-red-600 font-semibold ml-1">Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="pt-12 pb-6 px-6">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black tracking-tight">Services</Text>
                        <Text className="text-gray-500 text-sm font-medium">Manage available services</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowCatModal(true)}
                        className="h-12 w-12 bg-purple-100 rounded-2xl items-center justify-center mr-2"
                    >
                        <Ionicons name="apps" size={24} color="#A855F7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleCreate}
                        className="h-12 w-12 bg-indigo-100 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="add" size={28} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                {/* Stats */}
                <View className="flex-row">
                    <LinearGradient
                        colors={['#EFF6FF', '#DBEAFE']}
                        className="flex-1 rounded-xl p-3 mr-2 border border-blue-200"
                    >
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-blue-800 text-[10px] font-bold">TOTAL</Text>
                                <Text className="text-blue-600 text-2xl font-bold">{services.length}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#F0FDF4', '#DCFCE7']}
                        className="flex-1 rounded-xl p-3 mr-2 border border-green-200"
                    >
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-green-800 text-[10px] font-bold">ACTIVE</Text>
                                <Text className="text-green-600 text-2xl font-bold">{activeServices}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <TouchableOpacity
                        onPress={() => setShowCatModal(true)}
                        className="flex-1 rounded-xl"
                    >
                        <LinearGradient
                            colors={['#FAF5FF', '#F3E8FF']}
                            className="flex-1 rounded-xl p-3 border border-purple-200"
                        >
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Text className="text-purple-800 text-[10px] font-bold">CATS</Text>
                                    <Text className="text-purple-600 text-2xl font-bold">{categoriesCount}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Shop Filter */}
            <View className="px-6 mb-2">
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Filter by Shop</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <TouchableOpacity
                        onPress={() => setSelectedShopId('')}
                        className={`px-4 py-2 rounded-xl mr-2 ${selectedShopId === '' ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border border-gray-100'}`}
                    >
                        <Text className={`font-bold text-xs ${selectedShopId === '' ? 'text-white' : 'text-gray-600'}`}>ALL SERVICES</Text>
                    </TouchableOpacity>
                    {shops.map(shop => {
                        const shopName = typeof shop.name === 'string' ? shop.name : shop.name?.content || 'Unknown Shop';
                        return (
                            <TouchableOpacity
                                key={shop._id}
                                onPress={() => setSelectedShopId(shop._id)}
                                className={`px-4 py-2 rounded-xl mr-2 ${selectedShopId === shop._id ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border border-gray-100'}`}
                            >
                                <Text className={`font-bold text-xs ${selectedShopId === shop._id ? 'text-white' : 'text-gray-600'}`}>{shopName.toUpperCase()}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Services List */}
            <View className="flex-1 px-4 pt-4">
                {services.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="cut-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-center">No services yet</Text>
                        <TouchableOpacity onPress={handleCreate} className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl">
                            <Text className="text-white font-semibold">Create First Service</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={services}
                        keyExtractor={(item) => item._id}
                        renderItem={renderServiceCard}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => fetchServices(true)}
                                colors={['#6366F1']}
                                tintColor="#6366F1"
                            />
                        }
                    />
                )}
            </View>

            {/* Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View className="bg-white rounded-t-3xl" style={{ maxHeight: '90%' }}>
                        <View className="p-6 border-b border-gray-200">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-2xl font-bold text-gray-900">
                                    {editingService ? 'Edit Service' : 'New Service'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={28} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                            <View className="mb-5">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">Service Name</Text>
                                <TextInput
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                    placeholder="e.g., Hair Cut, Beard Trim"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                                <TextInput
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                                    placeholder="Describe the service"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View className="mb-5">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">Category (Select or Type New)</Text>
                                <TextInput
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 mb-3"
                                    placeholder="Enter custom category..."
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.category}
                                    onChangeText={(text) => setFormData({ ...formData, category: text })}
                                />
                                <View className="flex-row flex-wrap">
                                    {Array.from(new Set([
                                        'General',
                                        ...categoriesList.map(c => c.name),
                                        ...services.map(s => s.category)
                                    ])).filter(Boolean).sort().map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setFormData({ ...formData, category: cat })}
                                            className={`px-4 py-2 rounded-xl mr-2 mb-2 ${formData.category === cat ? 'bg-indigo-600' : 'bg-gray-100'
                                                }`}
                                        >
                                            <Text className={`font-medium ${formData.category === cat ? 'text-white' : 'text-gray-700'
                                                }`}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl mb-6">
                                <View>
                                    <Text className="font-semibold text-gray-900">Service Status</Text>
                                    <Text className="text-sm text-gray-500">Available for barbers to select</Text>
                                </View>
                                <Switch
                                    value={formData.isActive}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                                    trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                                    thumbColor={formData.isActive ? '#6366F1' : '#F3F4F6'}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                activeOpacity={0.8}
                            >
                                <View className="w-full py-4 rounded-xl items-center bg-indigo-600">
                                    <Text className="text-white font-bold text-base">
                                        {editingService ? 'Update Service' : 'Create Service'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Categories Management Modal */}
            <Modal
                visible={showCatModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCatModal(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View className="bg-white rounded-t-3xl h-[80%]">
                        <View className="p-6 border-b border-gray-200 flex-row items-center justify-between">
                            <Text className="text-2xl font-bold text-gray-900">Manage Categories</Text>
                            <TouchableOpacity onPress={() => setShowCatModal(false)}>
                                <Ionicons name="close" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                            {/* Sync Button */}
                            <TouchableOpacity
                                onPress={handleSyncCategories}
                                className="bg-indigo-600 p-4 rounded-xl flex-row items-center justify-center mb-6"
                            >
                                <Ionicons name="sync-outline" size={20} color="white" />
                                <Text className="text-white font-bold ml-2">Sync with Services</Text>
                            </TouchableOpacity>

                            {/* Editor Area */}
                            <View className="bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100">
                                <Text className="text-sm font-bold text-gray-400 uppercase mb-4">
                                    {editingCat ? 'Update Category' : 'Quick Add Category'}
                                </Text>
                                <View className="flex-row items-center mb-6">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category Name</Text>
                                        <TextInput
                                            className="bg-white px-4 py-3 border border-gray-200 rounded-xl font-bold"
                                            placeholder="Name"
                                            value={catFormData.name}
                                            onChangeText={(text) => setCatFormData({ ...catFormData, name: text })}
                                        />
                                    </View>
                                    <View className="w-20">
                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Emoji</Text>
                                        <TextInput
                                            className="bg-white px-4 py-3 border border-gray-200 rounded-xl text-center text-xl"
                                            placeholder="✨"
                                            value={catFormData.emoji}
                                            onChangeText={(text) => setCatFormData({ ...catFormData, emoji: text })}
                                        />
                                    </View>
                                </View>

                                <View className="mb-6">
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Gender Setting</Text>
                                    <View className="flex-row bg-white border border-gray-200 rounded-2xl p-1">
                                        {['unisex', 'male', 'female'].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                onPress={() => setCatFormData({ ...catFormData, gender: g })}
                                                className={`flex-1 py-3 rounded-xl items-center ${catFormData.gender === g ? 'bg-indigo-600' : ''}`}
                                            >
                                                <Text className={`text-xs font-bold capitalize ${catFormData.gender === g ? 'text-white' : 'text-gray-500'}`}>
                                                    {g}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Select Color</Text>
                                    <View className="flex-row flex-wrap justify-between">
                                        {[
                                            '#6366F1', '#F43F5E', '#10B981', '#F59E0B',
                                            '#0EA5E9', '#8B5CF6', '#D946EF', '#64748B',
                                            '#FB923C', '#14B8A6'
                                        ].map(color => (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setCatFormData({ ...catFormData, color })}
                                                style={{ backgroundColor: color }}
                                                className={`h-10 w-10 rounded-full mb-3 border-4 ${catFormData.color === color ? 'border-indigo-100 ring-2 ring-indigo-600' : 'border-transparent'}`}
                                            >
                                                {catFormData.color === color && (
                                                    <View className="flex-1 items-center justify-center">
                                                        <Ionicons name="checkmark" size={20} color="white" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        className="bg-white px-4 py-3 border border-gray-200 rounded-xl font-bold mt-1"
                                        placeholder="#6366F1"
                                        value={catFormData.color}
                                        onChangeText={(text) => setCatFormData({ ...catFormData, color: text })}
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={handleCatSubmit}
                                    className="bg-gray-900 py-3 rounded-xl items-center"
                                >
                                    <Text className="text-white font-bold">{editingCat ? 'Update' : 'Add'}</Text>
                                </TouchableOpacity>
                                {editingCat && (
                                    <TouchableOpacity
                                        onPress={() => { setEditingCat(null); setCatFormData({ name: '', emoji: '✨', color: '#6366F1', gender: 'unisex', isActive: true }); }}
                                        className="mt-2 items-center"
                                    >
                                        <Text className="text-gray-400 text-xs font-bold">Cancel Editing</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* List */}
                            <Text className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Defined Categories</Text>
                            {categoriesList.map(cat => (
                                <View key={cat._id} className="bg-white border border-gray-100 rounded-xl p-3 flex-row items-center mb-2 shadow-sm">
                                    <View style={{ backgroundColor: `${cat.color}20` }} className="w-10 h-10 rounded-lg items-center justify-center mr-3">
                                        <Text className="text-lg">{cat.emoji}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-800">{cat.name}</Text>
                                        <View className="flex-row mt-1">
                                            <Text className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${cat.gender === 'male' ? 'bg-blue-100 text-blue-600' :
                                                cat.gender === 'female' ? 'bg-pink-100 text-pink-600' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                {cat.gender || 'unisex'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleCatEdit(cat)} className="p-2 bg-indigo-50 rounded-lg mr-2">
                                        <Ionicons name="pencil" size={16} color="#4F46E5" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleCatDelete(cat._id)} className="p-2 bg-red-50 rounded-lg">
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View className="h-10" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
