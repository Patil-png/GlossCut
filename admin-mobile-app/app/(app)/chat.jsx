import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, Linking } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ChatScreen() {
    const { admin } = useAuth();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isListView, setIsListView] = useState(true);

    const scrollViewRef = useRef();

    // Fetch conversations
    const fetchConversations = useCallback(async (showIndicator = false) => {
        if (showIndicator) setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/chat/admin/conversations`);

            // Format to match web structure for consistency
            const formatted = response.data.map(conv => ({
                user: {
                    _id: conv._id,
                    name: String(conv.name || 'Unknown User'),
                    email: typeof conv.email === 'string' ? conv.email : (conv.email?.email || conv.email?.value || ''),
                    phone: conv.phone || '',
                },
                lastMessage: {
                    message: String(conv.lastMessage || ''),
                    timestamp: conv.timestamp,
                }
            }));

            setConversations(formatted);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl]);

    // Fetch messages for selected user
    const fetchMessages = async (userId) => {
        try {
            const response = await axios.get(`${apiUrl}/api/chat/${userId}`);
            setMessages(response.data);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;

        setSending(true);
        try {
            const response = await axios.post(`${apiUrl}/api/chat/send`, {
                receiverId: selectedUser._id,
                message: newMessage,
                appType: 'admin-panel'
            });

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            fetchConversations(); // Update last message in background
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCall = () => {
        if (selectedUser?.phone) {
            // Clean phone number: remove all non-numeric except leading +
            const cleanPhone = selectedUser.phone.replace(/[^\d+]/g, '');
            Linking.openURL(`tel:${cleanPhone}`);
        } else {
            alert('Phone number not available for this user');
        }
    };

    useEffect(() => {
        fetchConversations(true);
    }, [fetchConversations]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setIsListView(false);
        fetchMessages(user._id);
    };

    const filteredConversations = conversations.filter(conv =>
        conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    // Render Conversation List
    const renderConversationList = () => (
        <View className="flex-1 bg-[#F4F5F7]">
            <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
                <Text className="text-3xl font-black text-gray-900 tracking-tight">Live Chat</Text>
                <Text className="text-sm text-gray-500 font-medium">Customer Support</Text>

                <View className="mt-4 flex-row items-center bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search conversations..."
                        className="flex-1 ml-2 text-gray-900 text-sm py-1"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && !refreshing ? (
                    <View className="mt-20"><ActivityIndicator color="#4F46E5" /></View>
                ) : filteredConversations.length === 0 ? (
                    <View className="items-center justify-center mt-20 px-10">
                        <Ionicons name="chatbubbles-outline" size={60} color="#E5E7EB" />
                        <Text className="text-gray-400 mt-4 text-center">No conversations found</Text>
                    </View>
                ) : (
                    <View className="px-4 py-4">
                        {filteredConversations.map((conv) => (
                            <TouchableOpacity
                                key={conv.user._id}
                                onPress={() => handleSelectUser(conv.user)}
                                className="bg-white rounded-3xl p-4 mb-3 flex-row items-center shadow-sm shadow-gray-200 border border-gray-100"
                            >
                                <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100">
                                    <Text className="text-indigo-600 font-bold text-lg">
                                        {conv.user.name?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="ml-4 flex-1">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
                                            {conv.user.name}
                                        </Text>
                                        <Text className="text-[10px] text-gray-400">
                                            {conv.lastMessage?.timestamp ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
                                        {conv.lastMessage?.message || 'No messages yet...'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );

    // Render Chat View
    const renderChatView = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-white"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View className="bg-white pt-12 pb-4 px-6 border-b border-gray-100 flex-row items-center">
                <TouchableOpacity
                    onPress={() => setIsListView(true)}
                    className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-3"
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="font-black text-xl text-gray-900 tracking-tight" numberOfLines={1}>
                        {selectedUser.name}
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
                        {selectedUser.email}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleCall}
                    className={`w-10 h-10 items-center justify-center rounded-xl ${selectedUser.phone ? 'bg-indigo-50' : 'bg-gray-50 opacity-50'}`}
                >
                    <Ionicons name="call-outline" size={20} color={selectedUser.phone ? '#4F46E5' : '#9CA3AF'} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 bg-[#F9FAFB] p-4"
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {messages.map((msg, index) => {
                    const isAdmin = msg.sender === admin?._id || msg.sender === 'admin';
                    return (
                        <View
                            key={msg._id || index}
                            className={`flex mb-4 ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                            <View
                                className={`max-w-[80%] p-4 rounded-3xl ${isAdmin
                                    ? 'bg-indigo-600 rounded-tr-none'
                                    : 'bg-white rounded-tl-none border border-gray-100 shadow-sm shadow-gray-100'
                                    }`}
                            >
                                <Text className={`text-[15px] ${isAdmin ? 'text-white' : 'text-gray-800'}`}>
                                    {msg.message}
                                </Text>
                                <Text className={`text-[10px] mt-1.5 font-medium ${isAdmin ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Input */}
            <SafeAreaView>
                <View className="p-4 border-t border-gray-100 bg-white flex-row items-center space-x-3">
                    <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 flex-row items-center">
                        <TextInput
                            placeholder="Type a message..."
                            className="flex-1 text-gray-900 text-[15px]"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            maxHeight={100}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className={`w-12 h-12 rounded-2xl items-center justify-center ${!newMessage.trim() || sending ? 'bg-gray-200' : 'bg-indigo-600 shadow-md shadow-indigo-200'
                            }`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );

    return isListView ? renderConversationList() : renderChatView();
}
