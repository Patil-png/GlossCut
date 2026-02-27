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
            case 'started': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'confirmed': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'completed': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
            case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
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
        <div className="min-h-screen relative overflow-hidden bg-[#0A0A0B] text-white">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-[#0A0A0B]" />
            <div className="absolute top-[-10%] right-[-20%] w-[100vw] h-[100vw] lg:w-[60vw] lg:h-[60vw] rounded-full blur-[120px] opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #22C55E 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-10%] left-[-20%] w-[80vw] h-[80vw] lg:w-[50vw] lg:h-[50vw] rounded-full blur-[100px] opacity-10" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />

            {/* Content */}
            <div className="relative z-10 min-h-screen p-4 pt-24 lg:pt-32">
                {/* Header */}
                {!queueData && (
                    <div className="max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-top-4 duration-700 text-center">
                        <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-4 uppercase tracking-tighter">
                            Queue Tracker
                        </h1>
                        <p className="text-gray-400 font-medium text-lg tracking-wide">Enter your details to track your position live</p>
                    </div>
                )}

                {/* Search Form */}
                {!queueData && (
                    <div className="max-w-md mx-auto animate-in zoom-in-95 duration-700">
                        <div className="bg-[#1C1C1E]/80 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-8 text-center">
                                    <label className="block text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.3em]">
                                        Tracking / Order ID
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={trackingId}
                                            onChange={(e) => setQueueData(null) || setTrackingId(e.target.value)}
                                            placeholder="XXXXXX"
                                            maxLength={24}
                                            className="w-full bg-transparent border-b-2 border-white/10 py-4 text-center text-5xl font-black focus:border-[#22C55E] outline-none transition-all text-white uppercase placeholder:text-white/5 tracking-[0.2em] group-hover:border-white/20"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-500 mt-6 uppercase tracking-wider opacity-50">Found on your digital receipt or SMS</p>
                                </div>

                                {error && (
                                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center text-red-400 text-[11px] font-black uppercase tracking-widest">
                                        <AlertCircle size={14} className="mr-3 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || trackingId.trim().length < 6}
                                    className="w-full bg-white text-black font-black py-5 px-6 rounded-2xl hover:bg-[#22C55E] hover:text-black transition-all duration-500 disabled:opacity-5 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={16} className="mr-2" />
                                            Track Live Pulse
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Queue Display */}
                {queueData && (
                    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {/* Back Button */}
                        <div className="mb-8">
                            <button
                                onClick={() => {
                                    setQueueData(null);
                                    setTrackingId('');
                                    setAutoRefresh(false);
                                    navigate('/track-queue');
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white flex items-center transition-all bg-white/5 px-5 py-2.5 rounded-full border border-white/5 hover:bg-white/10 shadow-2xl"
                            >
                                <ArrowLeft size={14} className="mr-2" />
                                New Tracking
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left Column: Barber Brand */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-[#1C1C1E] rounded-[40px] p-8 shadow-2xl border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                        <Scissors size={180} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-28 h-28 rounded-[32px] border-4 border-white/5 shadow-2xl overflow-hidden mb-8 mx-auto lg:mx-0 bg-[#0A0A0B]">
                                            {queueData.barberImage ? (
                                                <img
                                                    src={queueData.barberImage.startsWith('http') ? queueData.barberImage : `${API_URL}/${queueData.barberImage.replace(/^\//, '')}`}
                                                    alt={queueData.barberName}
                                                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#0A0A0B] flex items-center justify-center">
                                                    <Users size={40} className="text-white/10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center lg:text-left">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full border border-[#22C55E]/20 mb-4 inline-block">Professional</span>
                                            <h2 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-1">{queueData.barberName}</h2>
                                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest leading-loose">{queueData.shopName}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                                        <div className="flex justify-between items-start text-sm">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selected Services</span>
                                            <span className="text-[11px] font-black text-white uppercase text-right leading-relaxed max-w-[180px]">{queueData.services.join(', ')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Check-in Time</span>
                                            <span className="text-[11px] font-black text-white uppercase tracking-wider">{queueData.bookingTime}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-white/5 pt-6">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Status</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(queueData.status)}`}>
                                                {getStatusText(queueData.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Card */}
                                <div className="bg-[#1C1C1E] rounded-[32px] p-6 shadow-2xl border border-white/5 relative overflow-hidden group">
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Live Tracking ID</p>
                                            <p className="text-2xl font-black text-white tracking-widest uppercase">#{queueData.trackingId}</p>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#22C55E]/10 transition-all duration-500 border border-white/5">
                                            <Search size={22} className="text-white/20 group-hover:text-[#22C55E] transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Column: Position Ticket */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="bg-[#1C1C1E] rounded-[50px] p-12 lg:p-20 shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/5 text-center relative overflow-hidden group min-h-[550px] flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform duration-[2000ms]">
                                        <RefreshCcw size={400} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-center gap-4 mb-12">
                                            <div className="h-[2px] w-12 bg-white/5 rounded-full" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-500">Live Ticket Position</span>
                                            <div className="h-[2px] w-12 bg-white/5 rounded-full" />
                                        </div>

                                        <div className="text-[15rem] lg:text-[20rem] font-black text-white leading-none tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                            #{queueData.queuePosition}
                                        </div>

                                        <div className="text-3xl lg:text-4xl font-black uppercase tracking-tighter italic">
                                            {queueData.peopleAhead === 0 ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-[#22C55E] animate-bounce tracking-widest">⚡ IT'S YOUR TURN NOW!</span>
                                                    <span className="text-[11px] not-italic font-black text-gray-500 uppercase tracking-[0.3em]">The chair is waiting for you</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-6">
                                                    <span className="text-[#22C55E] text-7xl lg:text-9xl font-black italic">{queueData.peopleAhead}</span>
                                                    <div className="text-left">
                                                        <p className="text-white leading-none text-4xl lg:text-5xl tracking-tighter">PEOPLE</p>
                                                        <p className="text-white opacity-20 leading-none text-4xl lg:text-5xl tracking-tighter">AHEAD</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pulse Indicator */}
                                    <div className="mt-16 flex items-center justify-center gap-3 bg-white/5 px-6 py-3 rounded-full w-fit mx-auto border border-white/5">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22C55E]"></span>
                                        </span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Synchronized with Live Pulse</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-[#1C1C1E] rounded-[40px] p-8 shadow-2xl border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
                                                <Users size={28} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Total Queue</p>
                                                <p className="text-3xl font-black text-white">{queueData.totalInQueue}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Serving</p>
                                            <p className="text-3xl font-black text-[#22C55E]">#{queueData.currentToken}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => fetchQueuePosition(queueData.trackingId, false)}
                                        className="bg-[#1C1C1E] rounded-[40px] p-8 shadow-2xl border border-white/5 flex items-center justify-center gap-4 hover:bg-white/10 transition-all group active:scale-95"
                                    >
                                        <RefreshCcw size={28} className={`text-gray-600 group-hover:text-[#22C55E] transition-all duration-700 ${loading ? 'animate-spin' : ''}`} />
                                        <div className="text-left font-black uppercase tracking-widest">
                                            <p className="text-[10px] text-gray-600 mb-1">Sync Status</p>
                                            <p className="text-xl text-white">Manual Refresh</p>
                                        </div>
                                    </button>
                                </div>

                                <div className="overflow-hidden rounded-[50px] shadow-[0_0_80px_rgba(0,0,0,0.4)] border border-white/5 bg-[#1C1C1E]">
                                    <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Interactive Queue Monitor</h3>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">{queueData.barberName} LIVE</span>
                                    </div>
                                    <div className="p-2">
                                        <QueueStatus barberId={queueData.barberId} />
                                    </div>
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
