import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const ADMIN_ID = '654a7e1c8e9d7b001f8e9d7b';

export default function ChatPage() {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const socket = useRef(null);
    const messagesEndRef = useRef(null);

    // Initialize Socket.IO - DISABLED due to CORS issues with production server
    // The chat will still work, just without real-time updates
    // Refresh the page to see new messages
    useEffect(() => {
        // socket.current = io(API_URL, {
        //     reconnectionAttempts: 3,
        //     timeout: 10000,
        // });

        // socket.current.on('message', (message) => {
        //     // Update messages if this conversation is open
        //     if (selectedUser && (message.sender === selectedUser._id || message.receiver === selectedUser._id)) {
        //         setMessages(prev => [...prev, message]);
        //         scrollToBottom();
        //     }

        //     // Update conversation list
        //     fetchConversations();
        // });

        // return () => {
        //     if (socket.current) {
        //         socket.current.disconnect();
        //     }
        // };
    }, [selectedUser]);

    // Fetch all conversations
    const fetchConversations = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/api/chat/admin/conversations`, {
                headers: {
                    'x-auth-token': localStorage.getItem('adminToken'),
                },
            });

            console.log('Raw conversations data:', response.data);

            // Format the data to match expected structure
            const formattedConversations = response.data.map(conv => ({
                user: {
                    _id: conv._id,
                    name: String(conv.name || 'Unknown User'),
                    email: String(conv.email || ''),
                },
                lastMessage: {
                    message: String(conv.lastMessage || ''),
                    timestamp: conv.timestamp,
                },
                unreadCount: 0, // Can be enhanced later
            }));

            setConversations(formattedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch messages for selected user
    const fetchMessages = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/api/chat/${userId}`, {
                headers: {
                    'x-auth-token': localStorage.getItem('adminToken'),
                },
            });
            setMessages(response.data);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;

        setIsSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/chat/send`,
                {
                    receiverId: selectedUser._id,
                    message: newMessage,
                    appType: 'admin-panel',
                },
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('adminToken'),
                    },
                }
            );

            setMessages(prev => [...prev, response.data]);

            // Socket.IO disabled - no real-time updates
            // if (socket.current?.connected) {
            //     socket.current.emit('sendMessage', response.data);
            // }

            setNewMessage('');
            scrollToBottom();
            fetchConversations(); // Update last message in list
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        fetchMessages(user._id);
    };

    const filteredConversations = conversations.filter(conv =>
        conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchConversations();
    }, []);

    return (
        <div className="flex h-[calc(100vh-180px)] bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>No conversations yet</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <div
                                key={conv.user._id}
                                onClick={() => handleSelectUser(conv.user)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?._id === conv.user._id ? 'bg-indigo-50' : ''
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {conv.user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">
                                                {conv.user.name || 'Unknown User'}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {new Date(conv.lastMessage?.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                            {conv.lastMessage?.message || 'No messages yet'}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {selectedUser.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                    <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {messages.map((msg, index) => {
                                const isAdmin = msg.sender === ADMIN_ID;
                                return (
                                    <div
                                        key={msg._id || index}
                                        className={`flex mb-4 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-lg ${isAdmin
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-900 border border-gray-200'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.message}</p>
                                            <p
                                                className={`text-xs mt-1 ${isAdmin ? 'text-indigo-200' : 'text-gray-500'
                                                    }`}
                                            >
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={isSending}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || isSending}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <p className="mt-4 text-lg font-medium">Select a conversation</p>
                            <p className="text-sm">Choose a conversation from the list to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
