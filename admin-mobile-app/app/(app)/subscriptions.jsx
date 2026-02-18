import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Switch,
    Alert,
    Modal,
    Image,
    Dimensions
} from 'react-native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import {
    Ticket,
    Plus,
    Users,
    Trash2,
    Edit3,
    Check,
    X,
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get("window");

export default function SubscriptionsScreen() {
    const insets = useSafeAreaInsets();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [subscriberModal, setSubscriberModal] = useState({ show: false, plan: null, list: [] });

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationDays: '30',
        durationUnit: 'days',
        features: '',
        isActive: true
    });

    const fetchPlans = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const res = await axios.get('/api/admin/subscription-plans');
            setPlans(res.data);

            const statsRes = await axios.get('/api/admin/subscription-stats');
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error fetching plans or stats:', err);
            Alert.alert('Error', 'Failed to load subscription data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleCreate = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            price: '',
            durationDays: '30',
            durationUnit: 'days',
            features: '',
            isActive: true
        });
        setShowModal(true);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name || '',
            price: String(plan.price || ''),
            durationDays: String(plan.durationDays || 30),
            durationUnit: plan.durationUnit || 'days',
            features: plan.features?.join(', ') || '',
            isActive: plan.isActive !== undefined ? plan.isActive : true
        });
        setShowModal(true);
    };

    const handleDelete = (planId) => {
        Alert.alert(
            'Confirm Deactivation',
            'Are you sure you want to deactivate this plan?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/admin/subscription-plans/${planId}`);
                            fetchPlans(true);
                        } catch (err) {
                            console.error('Error deleting plan:', err);
                            Alert.alert('Error', 'Failed to deactivate plan');
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.durationDays) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        const payload = {
            ...formData,
            price: Number(formData.price),
            durationDays: Number(formData.durationDays),
            features: formData.features.split(',').map(f => f.trim()).filter(f => f !== '')
        };

        try {
            if (editingPlan) {
                await axios.put(`/api/admin/subscription-plans/${editingPlan._id}`, payload);
            } else {
                await axios.post('/api/admin/subscription-plans', payload);
            }

            setShowModal(false);
            fetchPlans(true);
        } catch (err) {
            console.error('Error saving plan:', err);
            Alert.alert('Error', err.response?.data?.msg || 'Failed to save plan');
        }
    };

    const handleViewSubscribers = async (plan) => {
        try {
            const res = await axios.get('/api/admin/subscriptions');
            const planSubscribers = res.data.filter(sub => String(sub.planId?._id || sub.planId) === String(plan._id));
            setSubscriberModal({ show: true, plan, list: planSubscribers });
        } catch (err) {
            console.error('Error fetching subscribers:', err);
            Alert.alert('Error', 'Failed to load subscriber list');
        }
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F4F5F7]">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-gray-400 text-xs mt-4">Loading Subscription Plans...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F4F5F7]">
            {/* Header */}
            <View style={{ paddingTop: insets.top + 10, paddingBottom: 20, paddingHorizontal: 24 }} className="bg-white border-b border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black">Subscriptions</Text>
                        <Text className="text-gray-500 text-xs font-medium">Manage growth plans</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleCreate}
                        className="bg-indigo-600 p-3 rounded-full shadow-md"
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchPlans(true)} tintColor="#4F46E5" />
                }
            >
                {plans.length === 0 ? (
                    <View className="items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <Ticket size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 mt-4 font-bold">No plans found</Text>
                        <TouchableOpacity
                            onPress={handleCreate}
                            className="mt-4 bg-indigo-50 px-6 py-2 rounded-full"
                        >
                            <Text className="text-indigo-600 font-bold">Create your first plan</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    plans.map(plan => (
                        <View key={plan._id} className="bg-white rounded-3xl mb-6 shadow-sm border border-gray-100 overflow-hidden">
                            <LinearGradient
                                colors={plan.isActive ? ['#4F46E5', '#6366F1'] : ['#9CA3AF', '#6B7280']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-1.5"
                            />
                            <View className="p-6">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1">
                                        <Text className="text-xl font-bold text-gray-900">{plan.name}</Text>
                                        <Text className="text-gray-500 text-xs mt-0.5 capitalize">
                                            {plan.durationDays} {plan.durationUnit || 'days'}
                                        </Text>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${plan.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <Text className={`text-[10px] font-bold ${plan.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                            {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-end mb-6">
                                    <Text className="text-3xl font-black text-indigo-600">₹{plan.price}</Text>
                                    <Text className="text-gray-400 text-xs mb-1.5 ml-1 lowercase">
                                        / {plan.durationDays}{plan.durationUnit === 'minutes' ? 'min' : 'd'}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleViewSubscribers(plan)}
                                    className="bg-indigo-50 rounded-2xl p-4 flex-row items-center justify-between mb-6"
                                >
                                    <View className="flex-row items-center">
                                        <View className="bg-indigo-200/50 p-2 rounded-xl mr-3">
                                            <Users size={18} color="#4F46E5" />
                                        </View>
                                        <View>
                                            <Text className="text-indigo-900 font-bold text-sm">Active Subscribers</Text>
                                            <Text className="text-indigo-600 text-xs">Tap to view members</Text>
                                        </View>
                                    </View>
                                    <View className="bg-white px-3 py-1 rounded-lg">
                                        <Text className="text-indigo-900 font-black text-lg">{stats[plan._id] || 0}</Text>
                                    </View>
                                </TouchableOpacity>

                                <View className="space-y-3 mb-6">
                                    {plan.features?.map((feature, i) => (
                                        <View key={i} className="flex-row items-center">
                                            <View className="bg-green-100 p-1 rounded-full mr-3">
                                                <Check size={12} color="#059669" />
                                            </View>
                                            <Text className="text-gray-600 text-sm">{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View className="flex-row justify-end border-t border-gray-50 pt-4 space-x-4">
                                    <TouchableOpacity
                                        onPress={() => handleEdit(plan)}
                                        className="flex-row items-center"
                                    >
                                        <Edit3 size={16} color="#4F46E5" />
                                        <Text className="text-indigo-600 font-bold ml-1.5 text-sm">Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(plan._id)}
                                        className="flex-row items-center"
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                        <Text className="text-red-500 font-bold ml-1.5 text-sm">Deactivate</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Plan Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6" style={{ height: '85%' }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-gray-900">
                                {editingPlan ? 'Edit Plan' : 'Create Plan'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-5">
                                <View>
                                    <Text className="text-gray-600 text-sm font-bold mb-2">Plan Name</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-900"
                                        placeholder="e.g. Premium Monthly"
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    />
                                </View>

                                <View className="flex-row space-x-3">
                                    <View className="flex-[2]">
                                        <Text className="text-gray-600 text-sm font-bold mb-2">Price (₹)</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-900"
                                            placeholder="599"
                                            keyboardType="numeric"
                                            value={formData.price}
                                            onChangeText={(text) => setFormData({ ...formData, price: text })}
                                        />
                                    </View>
                                    <View className="flex-[2]">
                                        <Text className="text-gray-600 text-sm font-bold mb-2">Duration</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-900"
                                            placeholder="30"
                                            keyboardType="numeric"
                                            value={formData.durationDays}
                                            onChangeText={(text) => setFormData({ ...formData, durationDays: text })}
                                        />
                                    </View>
                                    <View className="flex-[3]">
                                        <Text className="text-gray-600 text-sm font-bold mb-2">Unit</Text>
                                        <View className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden justify-center h-[58px]">
                                            <Picker
                                                selectedValue={formData.durationUnit}
                                                onValueChange={(itemValue) =>
                                                    setFormData({ ...formData, durationUnit: itemValue })
                                                }
                                                style={{ height: 50, width: '100%' }}
                                                mode="dropdown"
                                            >
                                                <Picker.Item label="Days" value="days" />
                                                <Picker.Item label="Minutes" value="minutes" />
                                            </Picker>
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-600 text-sm font-bold mb-2">Features (Comma separated)</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-900"
                                        placeholder="Earnings, Map Visibility, Support"
                                        multiline
                                        numberOfLines={3}
                                        value={formData.features}
                                        onChangeText={(text) => setFormData({ ...formData, features: text })}
                                    />
                                </View>

                                <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl">
                                    <Text className="text-gray-900 font-bold">Plan Active</Text>
                                    <Switch
                                        trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                                        thumbColor={formData.isActive ? '#4F46E5' : '#F3F4F6'}
                                        onValueChange={(val) => setFormData({ ...formData, isActive: val })}
                                        value={formData.isActive}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="bg-indigo-600 p-4 rounded-2xl items-center mt-6 shadow-lg"
                        >
                            <Text className="text-white font-black text-lg">Save Plan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Subscriber Modal */}
            <Modal
                visible={subscriberModal.show}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSubscriberModal({ show: false, plan: null, list: [] })}
            >
                <View className="flex-1 justify-center items-center bg-black/60 p-6">
                    <View className="bg-white w-full rounded-3xl overflow-hidden" style={{ maxHeight: '80%' }}>
                        <View className="p-6 bg-indigo-600 flex-row justify-between items-center">
                            <View>
                                <Text className="text-white text-lg font-black">{subscriberModal.plan?.name}</Text>
                                <Text className="text-indigo-100 text-xs">Members List</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSubscriberModal({ show: false, plan: null, list: [] })}>
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                            {subscriberModal.list.length === 0 ? (
                                <View className="py-20 items-center">
                                    <Users size={48} color="#D1D5DB" />
                                    <Text className="text-gray-400 mt-4 font-bold">No active subscribers</Text>
                                </View>
                            ) : (
                                subscriberModal.list.map((sub, idx) => (
                                    <View key={idx} className="flex-row items-center p-4 border-b border-gray-50 last:border-0">
                                        <Image
                                            source={{ uri: sub.barberId?.profilePicture || 'https://via.placeholder.com/40' }}
                                            className="w-12 h-12 rounded-full bg-gray-100"
                                        />
                                        <View className="ml-4 flex-1">
                                            <Text className="text-gray-900 font-bold">{sub.barberId?.name || 'Unknown'}</Text>
                                            <Text className="text-gray-500 text-[10px]">{sub.barberId?.email}</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Calendar size={10} color="#9CA3AF" />
                                                <Text className="text-gray-400 text-[10px] ml-1">
                                                    Expires: {new Date(sub.endDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setSubscriberModal({ show: false, plan: null, list: [] })}
                            className="m-4 p-4 bg-gray-100 rounded-2xl items-center"
                        >
                            <Text className="text-gray-600 font-bold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
