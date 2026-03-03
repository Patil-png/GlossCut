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

    // Filtering states
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [catSearch, setCatSearch] = useState('');
    const [modalGenderFilter, setModalGenderFilter] = useState('all');

    // Shop filtering states
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState(''); // Default to 'All'

    // UI visibility states
    const [showFilterSection, setShowFilterSection] = useState(false);

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

    const handleCreate = useCallback(() => {
        setEditingService(null);
        setFormData({ name: '', description: '', category: 'General', isActive: true });
        setShowModal(true);
    }, []);

    const handleEdit = useCallback((service) => {
        setEditingService(service);
        setFormData({
            name: service.name || '',
            description: service.description || '',
            category: service.category || 'General',
            isActive: service.isActive !== undefined ? service.isActive : true
        });
        setShowModal(true);
    }, []);

    const handleDelete = useCallback((serviceId) => {
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
    }, [fetchServices]);

    const handleSubmit = useCallback(async () => {
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
    }, [formData, selectedShopId, editingService, fetchServices]);



    const handleCatDelete = useCallback((catId) => {
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
    }, [fetchCats]);

    const handleCatEdit = useCallback((cat) => {
        setEditingCat(cat);
        setCatFormData({
            name: cat.name,
            emoji: cat.emoji || '✨',
            color: cat.color || '#6366F1',
            gender: cat.gender || 'unisex',
            isActive: cat.isActive !== undefined ? cat.isActive : true
        });
    }, []);

    const handleCatSubmit = useCallback(async () => {
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
    }, [catFormData, editingCat, selectedShopId, fetchCats]);

    const handleSyncCategories = useCallback(async () => {
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
    }, [services, categoriesList, selectedShopId, fetchCats]);


    // Memoized Filtered Services
    const filteredServices = React.useMemo(() => {
        return services.filter(service => {
            // 1. Gender Filter
            if (selectedGender !== 'all') {
                const category = categoriesList.find(c => c.name === service.category);
                if (!category || category.gender !== selectedGender) {
                    return false;
                }
            }

            // 2. Category Filter
            if (selectedCategory !== 'all' && service.category !== selectedCategory) {
                return false;
            }

            // 3. Search Query (filters by name OR category OR shop name)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName = service.name.toLowerCase().includes(query);
                const matchesCategory = (service.category || '').toLowerCase().includes(query);

                // Find shop name for comparison
                const shop = shops.find(s => s._id === service.shopId);
                const shopName = typeof shop?.name === 'string' ? shop.name : shop?.name?.content || '';
                const matchesShop = shopName.toLowerCase().includes(query);

                if (!matchesName && !matchesCategory && !matchesShop) return false;
            }

            return true;
        });
    }, [services, selectedGender, selectedCategory, searchQuery, categoriesList, shops]);

    // Memoized Gender-Filtered Categories for the UI filter bar
    const genderFilteredCategories = React.useMemo(() => {
        const uniqueCats = Array.from(new Set(services.map(s => s.category))).filter(Boolean);
        if (selectedGender === 'all') return uniqueCats.sort();

        return uniqueCats.filter(catName => {
            const catData = categoriesList.find(c => c.name === catName);
            return catData && catData.gender === selectedGender;
        }).sort();
    }, [services, selectedGender, categoriesList]);

    const renderServiceCard = useCallback(({ item }) => (
        <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 mx-1">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2.5">
                        <View className="flex-1">
                            <Text className="text-lg font-black text-gray-900 leading-6">{item.name}</Text>
                        </View>
                        <View className={`px-3 py-1.5 rounded-2xl ${item.isActive ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                            <View className="flex-row items-center">
                                <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                <Text className={`text-[10px] font-black uppercase tracking-tighter ${item.isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-gray-500 text-xs leading-5 mb-4 font-medium" numberOfLines={2}>
                        {item.description || "No description provided for this service."}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <LinearGradient
                                colors={['#EEF2FF', '#E0E7FF']}
                                className="px-3 py-1.5 rounded-xl border border-indigo-100"
                            >
                                <Text className="text-indigo-700 text-[10px] font-black uppercase tracking-widest">{item.category}</Text>
                            </LinearGradient>
                            <View className="w-1 h-1 rounded-full bg-gray-300 mx-3" />
                            <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                            <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase tracking-tighter">
                                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className="flex-row mt-5 pt-5 border-t border-gray-50 space-x-3">
                <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    activeOpacity={0.7}
                    className="flex-1 bg-white border border-indigo-100 py-3 rounded-2xl flex-row items-center justify-center shadow-sm"
                >
                    <Ionicons name="pencil-sharp" size={16} color="#6366F1" />
                    <Text className="text-indigo-600 font-black text-xs ml-2 uppercase tracking-widest">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    activeOpacity={0.7}
                    className="flex-1 bg-red-50/50 py-3 rounded-2xl flex-row items-center justify-center"
                >
                    <Ionicons name="trash-sharp" size={16} color="#EF4444" />
                    <Text className="text-red-600 font-black text-xs ml-2 uppercase tracking-widest">Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    ), [handleEdit, handleDelete]);

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-500 mt-4">Loading services...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="pt-14 pb-8 px-6 bg-white shadow-sm shadow-gray-100/50 rounded-b-[40px] mb-6">
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-gray-900 text-3xl font-black tracking-tighter">Services</Text>
                        <View className="flex-row items-center mt-1">
                            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                            <Text className="text-gray-400 text-xs font-black uppercase tracking-widest">Management Hub</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => setShowFilterSection(!showFilterSection)}
                            activeOpacity={0.7}
                            className={`h-12 w-12 rounded-2xl items-center justify-center mr-3 border shadow-sm ${showFilterSection ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-100'}`}
                        >
                            <Ionicons name="filter" size={20} color={showFilterSection ? "white" : "#4F46E5"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowCatModal(true)}
                            activeOpacity={0.7}
                            className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center mr-3 shadow-sm"
                        >
                            <Ionicons name="grid-outline" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleCreate}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                className="h-12 px-5 rounded-2xl items-center justify-center flex-row shadow-lg shadow-indigo-200"
                            >
                                <Ionicons name="add" size={24} color="white" />
                                <Text className="text-white font-black text-xs ml-1 uppercase tracking-widest">New</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats */}
                <View className="flex-row space-x-3">
                    {[
                        { label: 'TOTAL', value: services.length, colors: ['#F8FAFC', '#F1F5F9'], border: '#E2E8F0', text: '#475569', icon: 'list' },
                        { label: 'ACTIVE', value: activeServices, colors: ['#F0FDF4', '#DCFCE7'], border: '#BBF7D0', text: '#166534', icon: 'checkmark-circle' },
                        { label: 'CATEGORIES', value: categoriesCount, colors: ['#FAF5FF', '#F3E8FF'], border: '#E9D5FF', text: '#6B21A8', icon: 'apps' }
                    ].map((stat, idx) => (
                        <View key={idx} className="flex-1">
                            <LinearGradient
                                colors={stat.colors}
                                className="rounded-3xl p-4 border shadow-sm"
                                style={{ borderColor: stat.border }}
                            >
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text style={{ color: stat.text }} className="text-[9px] font-black uppercase tracking-widest">{stat.label}</Text>
                                    <Ionicons name={stat.icon} size={10} color={stat.text} opacity={0.5} />
                                </View>
                                <Text style={{ color: stat.text }} className="text-2xl font-black tracking-tighter">{stat.value}</Text>
                            </LinearGradient>
                        </View>
                    ))}
                </View>
            </View>

            {/* Filter & Search Section */}
            {showFilterSection && (
                <View className="px-6 mb-6 mt-2 space-y-6">
                    {/* Search Bar */}
                    <View className="flex-row items-center bg-gray-100/50 border border-gray-100/50 rounded-[24px] px-5 py-2.5">
                        <Ionicons name="search-sharp" size={18} color="#94A3B8" />
                        <TextInput
                            className="flex-1 h-10 ml-3 text-gray-900 font-bold text-xs"
                            placeholder="Search services or categories..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} className="bg-gray-200/50 rounded-full p-1">
                                <Ionicons name="close-sharp" size={14} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Gender Filter Tags */}
                    <View>
                        <View className="flex-row items-center justify-between mb-3 px-1">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Gender Segment</Text>
                            <View className="h-[1px] flex-1 bg-gray-100 mx-4" />
                        </View>
                        <View className="flex-row space-x-2">
                            {[
                                { id: 'all', label: 'All', icon: 'layers-outline' },
                                { id: 'male', label: 'Men', icon: 'man-outline' },
                                { id: 'female', label: 'Women', icon: 'woman-outline' },
                                { id: 'unisex', label: 'Unisex', icon: 'transgender-outline' }
                            ].map((gender) => (
                                <TouchableOpacity
                                    key={gender.id}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedGender(gender.id)}
                                    className={`flex-1 flex-row items-center justify-center py-3.5 rounded-[20px] shadow-sm ${selectedGender === gender.id ? 'bg-indigo-600 shadow-indigo-300' : 'bg-white border border-gray-100'}`}
                                >
                                    <Ionicons
                                        name={gender.icon}
                                        size={12}
                                        color={selectedGender === gender.id ? 'white' : '#64748B'}
                                    />
                                    <Text className={`font-black text-[9px] ml-1.5 uppercase tracking-widest ${selectedGender === gender.id ? 'text-white' : 'text-gray-600'}`}>
                                        {gender.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Category Filter Tags */}
                    <View>
                        <View className="flex-row items-center justify-between mb-3 px-1">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Category Filter</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedCategory('all')}
                                className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"
                            >
                                <Text className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Reset</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" contentContainerStyle={{ paddingBottom: 4 }}>
                            <TouchableOpacity
                                onPress={() => setSelectedCategory('all')}
                                activeOpacity={0.8}
                                className={`px-5 py-3 rounded-[18px] mr-2 shadow-sm ${selectedCategory === 'all' ? 'bg-gray-900 shadow-gray-400' : 'bg-white border border-gray-100'}`}
                            >
                                <Text className={`font-black text-[9px] uppercase tracking-widest ${selectedCategory === 'all' ? 'text-white' : 'text-gray-500'}`}>All Types</Text>
                            </TouchableOpacity>
                            {genderFilteredCategories.map((cat, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setSelectedCategory(cat)}
                                    activeOpacity={0.8}
                                    className={`px-5 py-3 rounded-[18px] mr-2 shadow-sm ${selectedCategory === cat ? 'bg-indigo-600 shadow-indigo-300' : 'bg-white border border-gray-100'}`}
                                >
                                    <Text className={`font-black text-[9px] uppercase tracking-widest ${selectedCategory === cat ? 'text-white' : 'text-gray-600'}`}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Shop Filter */}
                    <View>
                        <View className="flex-row items-center justify-between mb-3 px-1">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Shop Context</Text>
                            <View className="h-[1px] flex-1 bg-gray-100 mx-4" />
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" contentContainerStyle={{ paddingBottom: 4 }}>
                            <TouchableOpacity
                                onPress={() => setSelectedShopId('')}
                                activeOpacity={0.8}
                                className={`px-5 py-3 rounded-[18px] mr-2 shadow-sm ${selectedShopId === '' ? 'bg-indigo-600 shadow-indigo-300' : 'bg-white border border-gray-100'}`}
                            >
                                <Text className={`font-black text-[9px] uppercase tracking-widest ${selectedShopId === '' ? 'text-white' : 'text-gray-600'}`}>Global View</Text>
                            </TouchableOpacity>
                            {shops.map(shop => {
                                const shopName = typeof shop.name === 'string' ? shop.name : shop.name?.content || 'Unknown Shop';
                                return (
                                    <TouchableOpacity
                                        key={shop._id}
                                        onPress={() => setSelectedShopId(shop._id)}
                                        activeOpacity={0.8}
                                        className={`px-5 py-3 rounded-[18px] mr-2 shadow-sm ${selectedShopId === shop._id ? 'bg-indigo-600 shadow-indigo-300' : 'bg-white border border-gray-100'}`}
                                    >
                                        <View className="flex-row items-center">
                                            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedShopId === shop._id ? 'bg-white' : 'bg-indigo-400'}`} />
                                            <Text className={`font-black text-[9px] uppercase tracking-widest ${selectedShopId === shop._id ? 'text-white' : 'text-gray-600'}`}>{shopName}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            )}

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
                        data={filteredServices}
                        keyExtractor={(item) => item._id}
                        renderItem={renderServiceCard}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center py-20 bg-white rounded-[32px] border border-gray-50 shadow-sm mx-2">
                                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="search-outline" size={32} color="#94A3B8" />
                                </View>
                                <Text className="text-gray-900 font-black text-lg tracking-tight">No services found</Text>
                                <Text className="text-gray-400 text-xs font-bold mt-1 text-center px-10">Try adjusting your filters or search query to find what you're looking for.</Text>
                                <TouchableOpacity
                                    onPress={() => { setSearchQuery(''); setSelectedGender('all'); setSelectedCategory('all'); }}
                                    activeOpacity={0.7}
                                    className="mt-8 bg-indigo-50 px-8 py-4 rounded-2xl border border-indigo-100"
                                >
                                    <Text className="text-indigo-600 font-black text-xs uppercase tracking-widest">Clear all filters</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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

            {/* Service Edit/Create Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-[40px] px-6 pt-8 pb-10 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-gray-900 text-2xl font-black tracking-tighter">
                                    {editingService ? 'Edit Service' : 'New Service'}
                                </Text>
                                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    {editingService ? 'Refine service details' : 'Add a fresh new service'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowModal(false)}
                                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                            >
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="max-h-[70vh]">
                            <View className="space-y-6">
                                <View>
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Service Name</Text>
                                    <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
                                        <TextInput
                                            className="h-12 text-gray-900 font-bold text-sm"
                                            value={formData.name}
                                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                                            placeholder="Enter service name (e.g. Skin Fade)"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Description</Text>
                                    <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                                        <TextInput
                                            className="min-h-[80px] text-gray-900 font-medium text-sm text-start"
                                            value={formData.description}
                                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                                            placeholder="Describe what's included in this service..."
                                            placeholderTextColor="#94A3B8"
                                            multiline
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Service Category</Text>

                                    {/* Category Selection Filter */}
                                    <View className="flex-row items-center justify-between mb-3 px-1">
                                        <View className="flex-row space-x-1.5">
                                            {['all', 'male', 'female', 'unisex'].map((g) => (
                                                <TouchableOpacity
                                                    key={g}
                                                    onPress={() => setModalGenderFilter(g)}
                                                    className={`px-3 py-1.5 rounded-full border ${modalGenderFilter === g ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'bg-white border-gray-100'}`}
                                                >
                                                    <Text className={`text-[9px] font-black uppercase tracking-tighter ${modalGenderFilter === g ? 'text-white' : 'text-gray-400'}`}>
                                                        {g === 'all' ? 'All' : g}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => { setCatSearch(''); setModalGenderFilter('all'); }}
                                            className="px-2 py-1"
                                        >
                                            <Text className="text-[9px] font-bold text-indigo-600 uppercase">Reset</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Category Search in Modal */}
                                    <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1 mb-3">
                                        <Ionicons name="search-outline" size={14} color="#94A3B8" />
                                        <TextInput
                                            className="flex-1 h-8 ml-2 text-gray-900 font-bold text-[11px]"
                                            placeholder="Quick search category..."
                                            placeholderTextColor="#94A3B8"
                                            value={catSearch}
                                            onChangeText={setCatSearch}
                                        />
                                    </View>

                                    <View className="flex-row flex-wrap">
                                        {Array.from(new Set([
                                            'General',
                                            ...categoriesList.map(c => c.name),
                                            ...services.map(s => s.category)
                                        ]))
                                            .filter(Boolean)
                                            .filter(cat => {
                                                const matchesSearch = cat.toLowerCase().includes(catSearch.toLowerCase());
                                                if (!matchesSearch) return false;
                                                if (modalGenderFilter !== 'all') {
                                                    const categoryData = categoriesList.find(c => c.name === cat);
                                                    if (modalGenderFilter && (!categoryData || categoryData.gender !== modalGenderFilter)) {
                                                        return false;
                                                    }
                                                }
                                                return true;
                                            })
                                            .sort()
                                            .map((cat) => (
                                                <TouchableOpacity
                                                    key={cat}
                                                    onPress={() => setFormData({ ...formData, category: cat })}
                                                    className={`mr-2 mb-2 px-4 py-2.5 rounded-xl border ${formData.category === cat ? 'bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-white border-gray-100'}`}
                                                >
                                                    <Text className={`text-xs font-black uppercase tracking-widest ${formData.category === cat ? 'text-white' : 'text-gray-600'}`}>
                                                        {cat}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-[24px] border border-gray-100">
                                    <View>
                                        <Text className="text-gray-900 font-black text-sm tracking-tight">Active Status</Text>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Visibility on the map</Text>
                                    </View>
                                    <Switch
                                        value={formData.isActive}
                                        onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                                        trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                            className="mt-8"
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                className="py-4 rounded-[20px] items-center justify-center shadow-lg shadow-indigo-200"
                            >
                                <Text className="text-white font-black text-sm uppercase tracking-[2px]">
                                    {editingService ? 'Update Service' : 'Create Service'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Category Management Modal */}
            <Modal
                visible={showCatModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowCatModal(false)}
            >
                <View className="flex-1 justify-center bg-black/60 px-6">
                    <View className="bg-white rounded-[40px] p-8 shadow-2xl max-h-[85vh]">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-gray-900 text-2xl font-black tracking-tighter">Categories</Text>
                                <View className="flex-row items-center mt-1">
                                    <View className="w-1 h-1 rounded-full bg-indigo-500 mr-2" />
                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Configuration Tool</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCatModal(false);
                                    setEditingCat(null);
                                    setCatFormData({ name: '', emoji: '✨', color: '#6366F1', gender: 'unisex', isActive: true });
                                }}
                                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-indigo-50/50 p-5 rounded-[24px] border border-indigo-100 mb-8">
                            <Text className="text-indigo-900 font-bold text-xs mb-3">
                                {editingCat ? 'Modify Category' : 'Quick Add Segment'}
                            </Text>

                            <View className="flex-row items-center mb-4">
                                <View className="flex-1 mr-3">
                                    <View className="bg-white rounded-[16px] border border-indigo-100 flex-row items-center px-4 shadow-sm">
                                        <Ionicons name="pricetags-outline" size={16} color="#6366F1" />
                                        <TextInput
                                            className="flex-1 h-12 ml-3 text-gray-900 font-bold text-sm"
                                            placeholder="Name (e.g. Ritual)"
                                            placeholderTextColor="#94A3B8"
                                            value={catFormData.name}
                                            onChangeText={(text) => setCatFormData({ ...catFormData, name: text })}
                                        />
                                    </View>
                                </View>
                                <View className="w-16">
                                    <View className="bg-white rounded-[16px] border border-indigo-100 items-center justify-center px-1 shadow-sm">
                                        <TextInput
                                            className="h-12 text-gray-900 font-black text-lg text-center"
                                            placeholder="✨"
                                            value={catFormData.emoji}
                                            onChangeText={(text) => setCatFormData({ ...catFormData, emoji: text })}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Gender Selection for Category */}
                            <View className="mb-4 ml-1">
                                <Text className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Gender Context</Text>
                                <View className="flex-row space-x-2">
                                    {['male', 'female', 'unisex'].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => setCatFormData({ ...catFormData, gender: g })}
                                            className={`flex-1 py-3 rounded-xl border items-center justify-center ${catFormData.gender === g ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-100'}`}
                                        >
                                            <Text className={`text-[10px] font-black uppercase tracking-tighter ${catFormData.gender === g ? 'text-white' : 'text-indigo-600'}`}>
                                                {g}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View className="flex-row space-x-2">
                                <TouchableOpacity
                                    onPress={handleCatSubmit}
                                    activeOpacity={0.8}
                                    className="flex-[1.5]"
                                >
                                    <LinearGradient
                                        colors={['#6366F1', '#4F46E5']}
                                        className="py-3.5 rounded-[16px] items-center justify-center flex-row shadow-md shadow-indigo-200"
                                    >
                                        <Ionicons name={editingCat ? "checkmark-circle" : "add-circle"} size={16} color="white" />
                                        <Text className="text-white font-black text-[10px] ml-2 uppercase tracking-widest">
                                            {editingCat ? 'Save Change' : 'Confirm Add'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSyncCategories}
                                    activeOpacity={0.7}
                                    className="flex-1 bg-white border border-indigo-200 py-3.5 rounded-[16px] items-center justify-center flex-row shadow-sm"
                                >
                                    <Ionicons name="sync" size={14} color="#6366F1" />
                                    <Text className="text-indigo-600 font-black text-[9px] ml-2 uppercase tracking-widest">Sync</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-1">Live Categories</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-4">
                                {categoriesList.length === 0 ? (
                                    <View className="py-12 items-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                                        <Ionicons name="apps-outline" size={32} color="#CBD5E1" />
                                        <Text className="text-gray-400 text-xs font-bold mt-3">No segments defined yet</Text>
                                    </View>
                                ) : (
                                    categoriesList.map((cat) => (
                                        <View key={cat._id} className="bg-white border border-gray-100 rounded-[24px] p-4 flex-row items-center justify-between shadow-sm">
                                            <View className="flex-row items-center flex-1">
                                                <View style={{ backgroundColor: `${cat.color || '#6366F1'}20` }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                                    <Text className="text-xl">{cat.emoji || '✨'}</Text>
                                                </View>
                                                <View className="ml-4 flex-1">
                                                    <Text className="text-gray-900 font-black text-sm tracking-tight">{cat.name}</Text>
                                                    <View className="flex-row space-x-1 mt-1.5">
                                                        {['male', 'female', 'unisex'].map((g) => (
                                                            <View
                                                                key={g}
                                                                className={`px-2.5 py-1 rounded-lg border ${cat.gender === g ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-100 border-gray-100'}`}
                                                            >
                                                                <Text className={`text-[8px] font-black uppercase tracking-tighter ${cat.gender === g ? 'text-white' : 'text-gray-400'}`}>
                                                                    {g}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="flex-row space-x-2">
                                                <TouchableOpacity
                                                    onPress={() => handleCatEdit(cat)}
                                                    className="w-10 h-10 bg-indigo-50/50 items-center justify-center rounded-xl border border-indigo-50 shadow-sm"
                                                >
                                                    <Ionicons name="pencil" size={16} color="#6366F1" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleCatDelete(cat._id)}
                                                    className="w-10 h-10 bg-red-50/50 items-center justify-center rounded-xl border border-red-50 shadow-sm"
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                            <View className="h-6" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
