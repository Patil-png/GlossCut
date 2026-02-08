import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Users, AlertCircle, Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

const TrackQueue = () => {
    const { trackingId: urlTrackingId } = useParams();
    const navigate = useNavigate();

    const [trackingId, setTrackingId] = useState(urlTrackingId || '');
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        if (urlTrackingId) {
            fetchQueuePosition(urlTrackingId);
        }
    }, [urlTrackingId]);

    // Auto-refresh every 10 seconds when tracking
    useEffect(() => {
        let interval;
        if (queueData && autoRefresh) {
            interval = setInterval(() => {
                fetchQueuePosition(queueData.trackingId, true);
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [queueData, autoRefresh]);

    const fetchQueuePosition = async (id, silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/booking/track/${id.toUpperCase()}`);
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
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (trackingId.trim()) {
            navigate(`/track-queue/${trackingId.trim().toUpperCase()}`);
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
                <div className="max-w-5xl mx-auto mb-8">
                    <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#4C763B] to-[#22C55E] bg-clip-text text-transparent mb-2">
                        Queue Tracker
                    </h1>
                    <p className="text-gray-600">Track your position in real-time</p>
                </div>

                {/* Search Form */}
                {!queueData && (
                    <div className="max-w-md mx-auto">
                        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-gray-200">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Enter Tracking ID
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={trackingId}
                                        onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                                        placeholder="e.g. A12B34"
                                        maxLength={6}
                                        className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-xl focus:border-[#4C763B] focus:ring-2 focus:ring-[#4C763B]/20 outline-none transition-all uppercase text-gray-900"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code from your booking confirmation</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
                                    <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || trackingId.trim().length < 6}
                                className="w-full bg-gradient-to-r from-[#4C763B] to-[#22C55E] text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin mr-2" />
                                        Tracking...
                                    </>
                                ) : (
                                    <>
                                        <Search size={20} className="mr-2" />
                                        Track Queue
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Queue Display */}
                {/* Queue Display */}
                {queueData && (
                    <div className="max-w-5xl mx-auto">
                        {/* Back Button */}
                        <div className="mb-6">
                            <button
                                onClick={() => {
                                    setQueueData(null);
                                    setTrackingId('');
                                    setAutoRefresh(false);
                                    navigate('/track-queue');
                                }}
                                className="text-sm text-gray-600 hover:text-[#4C763B] flex items-center transition-colors font-medium px-4 py-2 bg-white/50 hover:bg-white rounded-lg shadow-sm w-fit"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Track different booking
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            {/* Left Column - Position Card (Main Focus) */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Position Card - Large & Prominent */}
                                <div className="bg-black rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden group border border-gray-800">
                                    <div className="relative z-10 text-center flex flex-col justify-center h-full min-h-[300px]">
                                        <div className="flex items-center justify-center gap-2 mb-6">
                                            <div className="h-px w-8 bg-gray-600 rounded-full" />
                                            <div className="text-sm lg:text-base uppercase tracking-[0.3em] text-gray-400 font-bold">Your Status</div>
                                            <div className="h-px w-8 bg-gray-600 rounded-full" />
                                        </div>

                                        {/* Token Number - Simple White on Black */}
                                        <div className="mb-6">
                                            <div className="text-8xl lg:text-9xl font-black text-white tracking-tighter">
                                                #{queueData.queuePosition}
                                            </div>
                                        </div>

                                        <div className="text-xl lg:text-2xl font-medium text-gray-300">
                                            {queueData.peopleAhead === 0 ? (
                                                <span className="font-bold inline-flex items-center gap-2 text-white animate-pulse">
                                                    🎉 It's Your Turn!
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="text-white font-bold text-3xl">{queueData.peopleAhead}</span>
                                                    <span className="opacity-60 text-base uppercase tracking-wide mt-1">People Ahead</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Details */}
                            <div className="lg:col-span-5 space-y-4">
                                {/* Queue Status - Full Width */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-gray-200 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-gray-600">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 text-blue-600">
                                                <Users size={20} />
                                            </div>
                                            <span className="text-sm font-bold uppercase tracking-wider">Total in Queue</span>
                                        </div>
                                        <div className="text-4xl font-black text-gray-900">{queueData.totalInQueue}</div>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-100 space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Booking Details</h3>
                                    <div className="space-y-3.5">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-gray-500 text-sm">Tracking ID</span>
                                            <span className="font-mono font-bold text-[#4C763B] bg-green-50 px-2 py-1 rounded text-sm group-hover:bg-green-100 transition-colors">
                                                #{queueData.trackingId}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Shop</span>
                                            <span className="font-semibold text-gray-900 text-right">{queueData.shopName}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Barber</span>
                                            <span className="font-semibold text-gray-900">{queueData.barberName}</span>
                                        </div>
                                        <div className="flex justify-between items-start text-sm">
                                            <span className="text-gray-500 whitespace-nowrap mr-4">Services</span>
                                            <span className="font-semibold text-gray-900 text-right leading-tight">{queueData.services.join(', ')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Booked at</span>
                                            <span className="font-semibold text-gray-900">{queueData.bookingTime}</span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-gray-500 text-sm">Status</span>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(queueData.status)}`}>
                                                {getStatusText(queueData.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Auto-refresh indicator & Manual Refresh */}
                                <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200">
                                    <div className="flex items-center text-xs font-medium text-gray-500">
                                        <div className="relative flex h-2 w-2 mr-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </div>
                                        <span>Live Updates (10s)</span>
                                    </div>
                                    <button
                                        onClick={() => fetchQueuePosition(queueData.trackingId, false)}
                                        className="flex items-center text-xs text-[#4C763B] hover:text-[#22C55E] font-bold uppercase tracking-wide transition-colors hover:bg-green-50 px-2 py-1 rounded"
                                    >
                                        <RefreshCcw size={14} className="mr-1.5" />
                                        Refresh
                                    </button>
                                </div>

                                {/* Current Token Info */}
                                <div className="text-center text-xs text-gray-400 font-medium pt-2">
                                    Now Serving Token #{queueData.currentToken}
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
