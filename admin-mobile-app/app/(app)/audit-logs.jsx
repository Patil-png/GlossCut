import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Modal,
    Dimensions,
    Platform
} from 'react-native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    List,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    ChevronLeft,
    User,
    Database,
    AlertCircle,
    X,
    Eye,
    Globe,
    Info
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get("window");

const ENTITIES = [
    'All Entities', 'User', 'Booking', 'Shop', 'BarberCard', 'Review', 'Service', 'Admin', 'API'
];

const ACTIONS = [
    'All Actions', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS'
];

export default function AuditLogsScreen() {
    const insets = useSafeAreaInsets();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20
    });

    const [tempFilters, setTempFilters] = useState({ ...filters });
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const fetchLogs = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            // Using full URL for absolute certainty and adding timeout
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.glosscut.com';
            const res = await axios.get(`${apiUrl}/api/admin/audit-logs?${queryParams.toString()}`, {
                timeout: 10000 // 10s timeout
            });
            setLogs(res.data.auditLogs || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleApplyFilters = () => {
        setFilters({ ...tempFilters, page: 1 });
        setShowFilterModal(false);
    };

    const handleResetFilters = () => {
        const reset = {
            entity: '',
            action: '',
            startDate: '',
            endDate: '',
            page: 1,
            limit: 20
        };
        setTempFilters(reset);
        setFilters(reset);
        setShowFilterModal(false);
    };

    const getActionBadgeColor = (action) => {
        switch (action) {
            case 'CREATE': return ['#DCFCE7', '#166534'];
            case 'UPDATE': return ['#DBEAFE', '#1E40AF'];
            case 'DELETE': return ['#FEE2E2', '#991B1B'];
            case 'LOGIN': return ['#F3E8FF', '#6B21A8'];
            case 'LOGOUT': return ['#F3F4F6', '#374151'];
            case 'ACCESS': return ['#FEF3C7', '#92400E'];
            default: return ['#F3F4F6', '#111827'];
        }
    };

    const getEntityIcon = (entity) => {
        switch (entity) {
            case 'User': return <User size={14} color="#6366F1" />;
            case 'Booking': return <Calendar size={14} color="#6366F1" />;
            case 'Shop': return <Database size={14} color="#6366F1" />;
            default: return <Info size={14} color="#6366F1" />;
        }
    };

    const generateSimpleSummary = (log) => {
        if (!log) return "";
        const actor = log.userId?.name || "The System";
        const entity = log.entity || "record";

        switch (log.action) {
            case 'CREATE': return `${actor} created a new ${entity}.`;
            case 'UPDATE': return `${actor} updated the ${entity} details.`;
            case 'DELETE': return `${actor} removed a ${entity} from the system.`;
            case 'LOGIN': return `${actor} signed into the application.`;
            case 'LOGOUT': return `${actor} signed out of the application.`;
            case 'ACCESS': return `${actor} accessed ${entity} information.`;
            default: return `${actor} performed a ${log.action} action on ${entity}.`;
        }
    };

    const renderHumanReadableChanges = (changes) => {
        if (!changes || typeof changes !== 'object') return null;

        const formatVal = (val) => {
            if (val === true) return 'Yes / Active';
            if (val === false) return 'No / Inactive';
            if (val === null || val === undefined) return 'None';
            if (typeof val === 'object') return 'Complex Data...';
            return String(val);
        };

        const items = [];

        // Handle common update patterns
        if (changes.before && changes.after) {
            const beforeKeys = Object.keys(changes.before);
            beforeKeys.forEach(key => {
                if (key === '_id' || key === 'updatedAt' || key === '__v' || key === 'password') return;

                const oldVal = changes.before[key];
                const newVal = changes.after[key];

                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    items.push({
                        field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                        old: formatVal(oldVal),
                        new: formatVal(newVal)
                    });
                }
            });
        } else {
            // Flat object changes or other formats
            Object.entries(changes).forEach(([key, value]) => {
                if (key === '_id' || key === 'updatedAt' || key === '__v' || key === 'password') return;
                items.push({
                    field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                    new: formatVal(value)
                });
            });
        }

        if (items.length === 0) return <Text className="text-gray-400 italic text-xs text-center py-4">No specific property changes detected</Text>;

        return items.map((item, idx) => (
            <View key={idx} className="mb-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{item.field}</Text>
                <View className="flex-row items-center flex-wrap">
                    {item.old !== undefined && (
                        <>
                            <Text className="text-red-500 line-through text-xs font-medium mr-2">
                                {item.old}
                            </Text>
                            <ChevronRight size={12} color="#9CA3AF" className="mr-2" />
                        </>
                    )}
                    <Text className="text-green-600 text-sm font-black">
                        {item.new}
                    </Text>
                </View>
            </View>
        ));
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F4F5F7]">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-gray-400 text-xs mt-4 font-bold">Loading system logs...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F4F5F7]">
            {/* Header */}
            <View style={{ paddingTop: insets.top + 10, paddingBottom: 20, paddingHorizontal: 24 }} className="bg-white border-b border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-900 text-2xl font-black">Audit Logs</Text>
                        <Text className="text-gray-500 text-xs font-medium">System activities & changes</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilterModal(true)}
                        className="bg-indigo-600 p-3 rounded-2xl shadow-md flex-row items-center"
                    >
                        <Filter size={20} color="white" />
                        {(filters.entity || filters.action || filters.startDate) && (
                            <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchLogs(true)} tintColor="#4F46E5" />
                }
            >
                {logs.length === 0 ? (
                    <View className="items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <List size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 mt-4 font-bold">No logs found</Text>
                        <TouchableOpacity onPress={handleResetFilters} className="mt-4">
                            <Text className="text-indigo-600 font-bold">Clear all filters</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    logs.map((log) => (
                        <View key={log._id} className="bg-white rounded-3xl mb-4 p-5 shadow-sm border border-gray-100">
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-row items-center">
                                    <View
                                        style={{ backgroundColor: getActionBadgeColor(log.action)[0] }}
                                        className="px-3 py-1 rounded-full mr-2"
                                    >
                                        <Text
                                            style={{ color: getActionBadgeColor(log.action)[1] }}
                                            className="text-[10px] font-black"
                                        >
                                            {log.action}
                                        </Text>
                                    </View>
                                    <View className="bg-indigo-50 px-3 py-1 rounded-full flex-row items-center">
                                        {getEntityIcon(log.entity)}
                                        <Text className="text-indigo-600 text-[10px] font-bold ml-1">{log.entity}</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-400 text-[10px] font-medium">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>

                            <View className="mb-4">
                                <Text className="text-gray-900 font-bold text-sm">
                                    {log.userId?.name || 'System Auto'}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <Globe size={10} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-[10px] ml-1">{log.ipAddress || 'Internal'}</Text>
                                    <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                                    <Calendar size={10} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-[10px] ml-1">
                                        {new Date(log.timestamp).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>

                            {log.changes && (
                                <TouchableOpacity
                                    onPress={() => setSelectedLog(log)}
                                    className="bg-gray-50 p-3 rounded-2xl flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <Eye size={14} color="#6366F1" />
                                        <Text className="text-indigo-600 text-xs font-bold ml-2">View Changes</Text>
                                    </View>
                                    <ChevronRight size={14} color="#6366F1" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <View className="flex-row justify-between items-center mt-6 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <TouchableOpacity
                            disabled={!pagination.hasPrev}
                            onPress={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
                            className={`p-2 rounded-xl ${!pagination.hasPrev ? 'bg-gray-50' : 'bg-indigo-50'}`}
                        >
                            <ChevronLeft size={20} color={!pagination.hasPrev ? '#D1D5DB' : '#4F46E5'} />
                        </TouchableOpacity>

                        <View className="items-center">
                            <Text className="text-gray-900 font-black text-xs">Page {pagination.currentPage}</Text>
                            <Text className="text-gray-400 text-[10px]">Total {pagination.totalRecords} logs</Text>
                        </View>

                        <TouchableOpacity
                            disabled={!pagination.hasNext}
                            onPress={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
                            className={`p-2 rounded-xl ${!pagination.hasNext ? 'bg-gray-50' : 'bg-indigo-50'}`}
                        >
                            <ChevronRight size={20} color={!pagination.hasNext ? '#D1D5DB' : '#4F46E5'} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[40px] p-8 pb-10 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-2xl font-black text-gray-900">Filters</Text>
                                <Text className="text-gray-500 text-xs font-medium">Refine log view</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(false)}
                                className="bg-gray-100 p-2 rounded-full"
                            >
                                <X size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-6 mb-8">
                            <View>
                                <Text className="text-gray-900 font-bold mb-3 ml-1 text-sm">Entity Type</Text>
                                <View className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                    <Picker
                                        selectedValue={tempFilters.entity === '' ? 'All Entities' : tempFilters.entity}
                                        onValueChange={(val) => setTempFilters({ ...tempFilters, entity: val === 'All Entities' ? '' : val })}
                                        style={{ height: 50 }}
                                    >
                                        {ENTITIES.map(item => <Picker.Item key={item} label={item} value={item} />)}
                                    </Picker>
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-900 font-bold mb-3 ml-1 text-sm">Action Type</Text>
                                <View className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                    <Picker
                                        selectedValue={tempFilters.action === '' ? 'All Actions' : tempFilters.action}
                                        onValueChange={(val) => setTempFilters({ ...tempFilters, action: val === 'All Actions' ? '' : val })}
                                        style={{ height: 50 }}
                                    >
                                        {ACTIONS.map(item => <Picker.Item key={item} label={item} value={item} />)}
                                    </Picker>
                                </View>
                            </View>

                            <View className="flex-row space-x-4">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-bold mb-3 ml-1 text-sm">From Date</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowStartDatePicker(true)}
                                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center"
                                    >
                                        <Calendar size={16} color="#9CA3AF" />
                                        <Text className="ml-3 text-gray-600 text-xs font-bold">
                                            {tempFilters.startDate || 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-bold mb-3 ml-1 text-sm">To Date</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowEndDatePicker(true)}
                                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center"
                                    >
                                        <Calendar size={16} color="#9CA3AF" />
                                        <Text className="ml-3 text-gray-600 text-xs font-bold">
                                            {tempFilters.endDate || 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={handleResetFilters}
                                className="flex-1 bg-gray-100 p-4 rounded-2xl items-center"
                            >
                                <Text className="text-gray-600 font-bold">Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleApplyFilters}
                                className="flex-[2] bg-indigo-600 p-4 rounded-2xl items-center shadow-lg"
                            >
                                <Text className="text-white font-black">Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {showStartDatePicker && (
                    <DateTimePicker
                        value={tempFilters.startDate ? new Date(tempFilters.startDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowStartDatePicker(false);
                            if (date) setTempFilters({ ...tempFilters, startDate: date.toISOString().split('T')[0] });
                        }}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        value={tempFilters.endDate ? new Date(tempFilters.endDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowEndDatePicker(false);
                            if (date) setTempFilters({ ...tempFilters, endDate: date.toISOString().split('T')[0] });
                        }}
                    />
                )}
            </Modal>

            {/* Details Modal */}
            <Modal
                visible={!!selectedLog}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedLog(null)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 p-6">
                    <View className="bg-white w-full rounded-[30px] overflow-hidden max-h-[80%]">
                        <View className="p-6 bg-indigo-600">
                            <View className="flex-row justify-between items-center mb-4">
                                <View>
                                    <Text className="text-white text-lg font-black">Record Details</Text>
                                    <Text className="text-indigo-100 text-[10px] font-bold">ID: {selectedLog?._id}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedLog(null)}>
                                    <X size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* View Toggle */}
                            <View className="flex-row bg-indigo-700/50 p-1 rounded-xl">
                                <TouchableOpacity
                                    onPress={() => setShowTechnicalDetails(false)}
                                    className={`flex-1 py-1.5 items-center rounded-lg ${!showTechnicalDetails ? 'bg-white' : ''}`}
                                >
                                    <Text className={`text-[10px] font-black ${!showTechnicalDetails ? 'text-indigo-600' : 'text-indigo-100'}`}>
                                        SIMPLE VIEW
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowTechnicalDetails(true)}
                                    className={`flex-1 py-1.5 items-center rounded-lg ${showTechnicalDetails ? 'bg-white' : ''}`}
                                >
                                    <Text className={`text-[10px] font-black ${showTechnicalDetails ? 'text-indigo-600' : 'text-indigo-100'}`}>
                                        TECHNICAL DATA
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView className="p-6">
                            {showTechnicalDetails ? (
                                <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <Text className="text-gray-400 text-[10px] font-bold mb-4 uppercase tracking-widest">RAW JSON DATA</Text>
                                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} className="text-gray-700 text-xs leading-5">
                                        {JSON.stringify(selectedLog?.changes, null, 2)}
                                    </Text>
                                </View>
                            ) : (
                                <View>
                                    <View className="bg-indigo-50 p-5 rounded-3xl mb-6 border border-indigo-100 italic">
                                        <Text className="text-indigo-900 font-bold text-base leading-6">
                                            "{generateSimpleSummary(selectedLog)}"
                                        </Text>
                                    </View>

                                    <Text className="text-gray-900 font-bold mb-4 ml-1">Changes breakdown:</Text>
                                    {renderHumanReadableChanges(selectedLog?.changes)}
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setSelectedLog(null)}
                            className="margin-6 p-4 bg-indigo-50 rounded-2xl items-center mx-6 mb-6"
                        >
                            <Text className="text-indigo-600 font-bold">Close Window</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
