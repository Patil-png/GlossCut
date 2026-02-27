import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Users, AlertCircle, Loader2, ArrowLeft, RefreshCcw, Scissors } from 'lucide-react';
import io from 'socket.io-client';
import QueueStatus from './QueueStatus';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

const TrackQueue = () => {
    const { trackingId: urlTrackingId } = useParams();
    const navigate = useNavigate();

    const [trackingId, setTrackingId] = useState(urlTrackingId || '');
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchQueuePosition = useCallback(async (id, silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            // Only uppercase if it looks like a short code
            const searchId = id.length === 6 ? id.toUpperCase() : id;
            const res = await fetch(`${API_URL}/api/booking/track/${searchId}`);
            const data = await res.json();

            if (res.ok) {
                setQueueData(data.data);
                setAutoRefresh(true);
            } else {
                setError(data.msg || 'Booking not found');
                setQueueData(null);
                setAutoRefresh(false);
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setAutoRefresh(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (urlTrackingId) {
            fetchQueuePosition(urlTrackingId);
        } else {
            // Reset state if URL no longer contains trackingId
            setQueueData(null);
            setTrackingId('');
            setAutoRefresh(false);
            setError(null);
        }
    }, [urlTrackingId, fetchQueuePosition]);

    // Live Updates (Socket + Polling Fallback)
    useEffect(() => {
        let interval;
        let socket;

        if (queueData && autoRefresh) {
            // 1. WebSocket for Instant Updates
            socket = io(API_URL, { transports: ['websocket'] });

            socket.on('connect', () => {
                socket.emit('join', `booking_${queueData.bookingId}`);
            });

            socket.on('booking_status_update', (data) => {
                if (data.status) {
                    fetchQueuePosition(queueData.trackingId, true);
                }
            });

            // 2. Polling Fallback (15s)
            interval = setInterval(() => {
                fetchQueuePosition(queueData.trackingId, true);
            }, 15000);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (socket) socket.disconnect();
        };
    }, [queueData, autoRefresh, fetchQueuePosition]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (trackingId.trim()) {
            const searchId = trackingId.trim();
            const formattedId = searchId.length === 6 ? searchId.toUpperCase() : searchId;
            navigate(`/track-queue/${formattedId}`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'started': return 'text-blue-600 bg-blue-100';
            case 'confirmed': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'completed': return 'text-gray-600 bg-gray-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'started': return 'In Progress';
            case 'confirmed': return 'Confirmed';
            case 'pending': return 'Awaiting Approval';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
            <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] lg:w-[50vw] lg:h-[50vw] rounded-full blur-[80px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
            <div className="absolute bottom-[10%] left-[-10%] w-[70vw] h-[70vw] lg:w-[40vw] lg:h-[40vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #a855f7 0%, #ec4899 100%)' }} />

            {/* Content */}
            <div className="relative z-10 min-h-screen p-4 pt-24 lg:pt-32">
                {/* Header */}
                {!queueData && (
                    <div className="max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#4C763B] to-[#22C55E] bg-clip-text text-transparent mb-2 uppercase tracking-tighter">
                            Queue Tracker
                        </h1>
                        <p className="text-gray-600 font-medium">Track your position in real-time</p>
                    </div>
                )}

                {/* Search Form */}
                {!queueData && (
                    <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
                        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-2xl border border-gray-100">
                            <div className="mb-6">
                                <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
                                    Enter Tracking ID or Order ID
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={trackingId}
                                        onChange={(e) => setTrackingId(e.target.value)}
                                        placeholder="e.g. A12B34"
                                        maxLength={24}
                                        className="w-full px-4 py-4 text-center text-4xl font-black border-2 border-gray-50 rounded-2xl focus:border-[#22C55E] focus:ring-0 outline-none transition-all text-[#1C1C1E] uppercase placeholder:text-gray-100 tracking-widest"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-gray-300 mt-4 text-center uppercase tracking-wider">Check your digital receipt for the ID</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 text-[11px] font-black uppercase tracking-widest">
                                    <AlertCircle size={14} className="mr-3 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || trackingId.trim().length < 6}
                                className="w-full bg-[#1C1C1E] text-white font-black py-5 px-6 rounded-2xl hover:bg-[#22C55E] transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-[0.2em] text-xs"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Tracking...
                                    </>
                                ) : (
                                    <>
                                        <Search size={16} className="mr-2" />
                                        Track Live Position
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Queue Display */}
                {queueData && (
                    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Back Button */}
                        <div className="mb-8">
                            <button
                                onClick={() => {
                                    setQueueData(null);
                                    setTrackingId('');
                                    setAutoRefresh(false);
                                    navigate('/track-queue');
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#22C55E] flex items-center transition-all bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100"
                            >
                                <ArrowLeft size={14} className="mr-2" />
                                Track Different
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Barber Brand */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Scissors size={150} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-2xl overflow-hidden mb-6 mx-auto lg:mx-0 bg-gray-50">
                                            {queueData.barberImage ? (
                                                <img
                                                    src={queueData.barberImage.startsWith('http') ? queueData.barberImage : `${API_URL}/${queueData.barberImage.replace(/^\//, '')}`}
                                                    alt={queueData.barberName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                    <Users size={40} className="text-gray-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center lg:text-left">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#22C55E] bg-green-50 px-3 py-1 rounded-full border border-green-100 mb-4 inline-block">Professional</span>
                                            <h2 className="text-3xl font-black text-[#1C1C1E] uppercase tracking-tighter leading-none mb-1">{queueData.barberName}</h2>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{queueData.shopName}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Services</span>
                                            <span className="text-[11px] font-black text-[#1C1C1E] uppercase text-right leading-tight max-w-[150px]">{queueData.services.join(', ')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booked at</span>
                                            <span className="text-[11px] font-black text-[#1C1C1E] uppercase">{queueData.bookingTime}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(queueData.status)}`}>
                                                {getStatusText(queueData.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Card */}
                                <div className="bg-[#1C1C1E] rounded-[32px] p-6 shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Tracking ID</p>
                                            <p className="text-xl font-black text-white tracking-widest uppercase">#{queueData.trackingId}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-[#22C55E]/20 transition-colors">
                                            <Search size={20} className="text-white group-hover:text-[#22C55E] transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Column: Position Ticket */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white rounded-[40px] p-10 lg:p-14 shadow-2xl border border-gray-100 text-center relative overflow-hidden group min-h-[500px] flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
                                        <RefreshCcw size={300} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-center gap-3 mb-8">
                                            <div className="h-px w-8 bg-gray-200" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Position</span>
                                            <div className="h-px w-8 bg-gray-200" />
                                        </div>

                                        <div className="text-[12rem] lg:text-[15rem] font-black text-[#1C1C1E] leading-none tracking-tighter mb-8">
                                            #{queueData.queuePosition}
                                        </div>

                                        <div className="text-2xl lg:text-3xl font-black uppercase tracking-tighter italic">
                                            {queueData.peopleAhead === 0 ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[#22C55E] animate-bounce">⚡ It's Your Turn!</span>
                                                    <span className="text-[10px] not-italic font-black text-gray-400 uppercase tracking-[0.2em]">Step up to the chair</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-[#22C55E] text-5xl lg:text-7xl font-black italic">{queueData.peopleAhead}</span>
                                                    <div className="text-left">
                                                        <p className="text-[#1C1C1E] leading-none">PEOPLE</p>
                                                        <p className="text-[#1C1C1E] leading-none opacity-40">AHEAD</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pulse Indicator */}
                                    <div className="mt-12 flex items-center justify-center gap-2 bg-gray-50 px-4 py-2 rounded-full w-fit mx-auto border border-gray-100">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                                        </span>
                                        <span className="text-[9px] font-black text-[#1C1C1E] uppercase tracking-widest">Live Updates active</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Waiting</p>
                                                <p className="text-2xl font-black text-[#1C1C1E]">{queueData.totalInQueue}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Serving</p>
                                            <p className="text-2xl font-black text-[#22C55E]">#{queueData.currentToken}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => fetchQueuePosition(queueData.trackingId, false)}
                                        className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors group active:scale-95"
                                    >
                                        <RefreshCcw size={20} className={`text-gray-400 group-hover:text-[#22C55E] transition-colors ${loading ? 'animate-spin' : ''}`} />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#1C1C1E]">Refresh Pulse</span>
                                    </button>
                                </div>

                                <div className="overflow-hidden rounded-[40px] shadow-2xl border border-gray-100 bg-white">
                                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E]">Full Queue View</h3>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">{queueData.barberName}</span>
                                    </div>
                                    <QueueStatus barberId={queueData.barberId} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackQueue;
