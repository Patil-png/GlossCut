import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Users, Clock, AlertCircle, Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';

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
            <div className="relative z-10 min-h-screen p-4 pt-24 lg:pt-12">
                {/* Header */}
                <div className="max-w-2xl mx-auto mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-gray-600 hover:text-[#4C763B] transition-colors mb-6"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Home
                    </button>
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
                                        placeholder="e.g., A12B34"
                                        maxLength={6}
                                        className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-xl focus:border-[#4C763B] focus:ring-2 focus:ring-[#4C763B]/20 outline-none transition-all uppercase"
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
                {queueData && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={() => {
                                setQueueData(null);
                                setTrackingId('');
                                setAutoRefresh(false);
                                navigate('/track-queue');
                            }}
                            className="text-sm text-gray-600 hover:text-[#4C763B] flex items-center transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Track different booking
                        </button>

                        {/* Position Card - Large & Prominent */}
                        <div className="bg-gradient-to-br from-[#4C763B] to-[#22C55E] rounded-3xl p-8 shadow-2xl text-white">
                            <div className="text-center">
                                <div className="text-sm uppercase tracking-widest mb-2 opacity-90">Your Position</div>
                                <div className="text-7xl lg:text-8xl font-black mb-2">#{queueData.queuePosition}</div>
                                <div className="text-lg opacity-90">
                                    {queueData.peopleAhead === 0 ? (
                                        <span className="font-bold">🎉 You're Next!</span>
                                    ) : (
                                        <span>{queueData.peopleAhead} {queueData.peopleAhead === 1 ? 'person' : 'people'} ahead</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Wait Time */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <Clock size={20} className="mr-2" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Est. Wait Time</span>
                                </div>
                                <div className="text-3xl font-black text-gray-900">
                                    {queueData.estimatedWaitMinutes === 0 ? 'Ready!' : `~${queueData.estimatedWaitMinutes} min`}
                                </div>
                            </div>

                            {/* Queue Status */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <Users size={20} className="mr-2" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Total in Queue</span>
                                </div>
                                <div className="text-3xl font-black text-gray-900">{queueData.totalInQueue}</div>
                            </div>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                            <h3 className="text-lg font-bold mb-4 text-gray-900">Booking Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tracking ID</span>
                                    <span className="font-mono font-bold text-[#4C763B]">#{queueData.trackingId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shop</span>
                                    <span className="font-semibold text-gray-900">{queueData.shopName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Barber</span>
                                    <span className="font-semibold text-gray-900">{queueData.barberName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Services</span>
                                    <span className="font-semibold text-gray-900 text-right">{queueData.services.join(', ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Booking Time</span>
                                    <span className="font-semibold text-gray-900">{queueData.bookingTime}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(queueData.status)}`}>
                                        {getStatusText(queueData.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Auto-refresh indicator & Manual Refresh */}
                        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200">
                            <div className="flex items-center text-sm text-gray-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                Auto-updating every 10s
                            </div>
                            <button
                                onClick={() => fetchQueuePosition(queueData.trackingId, false)}
                                className="flex items-center text-sm text-[#4C763B] hover:text-[#22C55E] font-semibold transition-colors"
                            >
                                <RefreshCcw size={16} className="mr-1" />
                                Refresh Now
                            </button>
                        </div>

                        {/* Current Token Info */}
                        <div className="text-center text-sm text-gray-500">
                            Currently serving token #{queueData.currentToken}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackQueue;
