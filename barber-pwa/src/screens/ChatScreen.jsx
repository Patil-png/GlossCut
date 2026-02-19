import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send, ChevronLeft, ShieldCheck, AlertCircle,
    CheckCircle2, Info, Loader2, User,
    MoreVertical, Smile, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const ChatScreen = () => {
    const navigate = useNavigate();
    const { user, token: authToken } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [adminId, setAdminId] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const messagesEndRef = useRef(null);
    const socket = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.glosscut.com';

    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (!user || !authToken) {
            navigate('/login');
            return;
        }

        const initChat = async () => {
            try {
                const res = await api.get('/api/chat/support-id');
                const supportId = res.data.adminId;
                setAdminId(supportId);

                const msgRes = await api.get(`/api/chat/${supportId}`);
                setMessages(msgRes.data);

                setupSocket(supportId);
            } catch (err) {
                console.error('Failed to initialize chat:', err);
                showToast('Chat initialization failed.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        initChat();

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [user, authToken, navigate, showToast]);

    const setupSocket = (currentSupportId) => {
        try {
            if (!currentSupportId) return;

            socket.current = io(API_URL, {
                query: { token: authToken },
                reconnectionAttempts: 3,
                timeout: 10000,
            });

            socket.current.on('message', (message) => {
                if (
                    (message.sender === user._id && message.receiver === currentSupportId) ||
                    (message.sender === currentSupportId && message.receiver === user._id)
                ) {
                    setMessages((prev) => [...prev, message]);
                }
            });
        } catch (error) {
            console.error("Socket initialization failed", error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (newMessage.trim() === '' || !adminId) return;

        const messageData = {
            receiverId: adminId,
            message: newMessage,
            appType: 'barber-pwa',
        };

        try {
            const response = await api.post('/api/chat/send', messageData);
            const savedMsg = response.data;

            setMessages((prev) => [...prev, savedMsg]);

            if (socket.current?.connected) {
                socket.current.emit('sendMessage', savedMsg);
            }

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message.', 'error');
        }
    };

    const MessageBubble = ({ item, index }) => {
        const isMyMessage = item.sender === user?._id;
        const isSameSenderAsPrev = index > 0 && messages[index - 1].sender === item.sender;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-4'}`}
            >
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed relative ${isMyMessage
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none shadow-sm'
                    }`}>
                    {item.message}
                    <div className={`text-[10px] mt-1.5 opacity-60 flex justify-end`}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                                    toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                                        'bg-gray-900/90 border-gray-700 text-white'
                                }`}>
                                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                            <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white relative">
                                <ShieldCheck size={20} />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-black text-gray-900 leading-tight">Support</h2>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Online</p>
                            </div>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 active:bg-gray-100">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Opening Secure Line...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-10">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                <Smile size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">How can we help?</h3>
                            <p className="text-[11px] font-bold text-gray-500 mt-2 leading-relaxed">
                                Our support team is here for you. Send a message to start a conversation.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((item, idx) => (
                                <MessageBubble key={item._id || idx} item={item} index={idx} />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="px-6 py-6 pb-10 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <button type="button" className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <div className="flex-1 h-13 bg-gray-50 rounded-[24px] border border-gray-100 px-4 flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write a message..."
                                className="flex-1 bg-transparent border-none text-[14px] font-medium outline-none placeholder:text-gray-300"
                            />
                            <button type="button" className="p-2 text-gray-300 hover:text-amber-500 transition-colors">
                                <Smile size={20} />
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !adminId}
                            className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${newMessage.trim() ? 'bg-indigo-600 shadow-indigo-200' : 'bg-gray-900/10 text-gray-300'
                                }`}
                        >
                            <Send size={20} className={newMessage.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatScreen;
