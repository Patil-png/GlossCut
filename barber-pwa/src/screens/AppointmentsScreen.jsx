import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { Calendar, Clock, Scissors, Search, Filter, Phone, User, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

const AppointmentsScreen = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

    const fetchAppointments = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await api.get(`/api/booking/barber-appointments/${user._id}?date=${today}`);
            if (Array.isArray(res.data)) {
                // Determine status priority for sorting
                const getStatusWeight = (status) => {
                    if (status === 'started') return 1;
                    if (status === 'confirmed') return 2;
                    if (status === 'pending') return 3;
                    return 4;
                };

                const sortedData = res.data.sort((a, b) => {
                    const weightA = getStatusWeight(a.status);
                    const weightB = getStatusWeight(b.status);
                    if (weightA !== weightB) return weightA - weightB;
                    return new Date(a.date) - new Date(b.date);
                });
                setAppointments(sortedData);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const filteredAppointments = appointments.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    const getStatusColor = (status, isBg = false) => {
        switch (status) {
            case 'confirmed': return isBg ? 'bg-green-500/10' : 'text-green-500';
            case 'pending': return isBg ? 'bg-yellow-500/10' : 'text-yellow-500';
            case 'started': return isBg ? 'bg-blue-500/10' : 'text-blue-500';
            case 'completed': return isBg ? 'bg-gray-500/10' : 'text-gray-500';
            case 'cancelled': return isBg ? 'bg-red-500/10' : 'text-red-500';
            default: return isBg ? 'bg-gray-500/10' : 'text-gray-500';
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen bg-bg-dark">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Appointments</h1>
                <button
                    onClick={fetchAppointments}
                    className="p-2 bg-card-dark rounded-full text-primary"
                >
                    <Clock size={20} />
                </button>
            </div>

            {/* Date Selector (Simplified for now to just Today) */}
            <div className="bg-card-dark p-3 rounded-xl flex justify-between items-center mb-6 border border-white/5">
                <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-primary" />
                    <span className="font-bold text-white">{format(new Date(), 'EEEE, d MMM')}</span>
                </div>
                <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">TODAY</span>
            </div>

            {/* Filters */}
            <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
                {['all', 'confirmed', 'pending', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filter === f
                                ? 'bg-primary text-black'
                                : 'bg-card-dark text-gray-400 hover:text-white'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-card-dark h-32 rounded-2xl animate-pulse"></div>
                    ))
                ) : filteredAppointments.length > 0 ? (
                    filteredAppointments.map(app => (
                        <div key={app._id} className="bg-card-dark rounded-2xl p-4 border border-white/5 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">
                                            {app.isOfflineBooking ? app.customerName : app.userId?.name || 'Unknown'}
                                        </h3>
                                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                                            {app.isOfflineBooking && <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">WALK-IN</span>}
                                            <span>#{app._id.slice(-4)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${getStatusColor(app.status, true)} ${getStatusColor(app.status)}`}>
                                    {app.status}
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-bg-dark/50 p-3 rounded-xl mb-3">
                                <div className="flex items-center space-x-2">
                                    <Clock size={16} className="text-gray-400" />
                                    <span className="font-bold text-white">{app.time}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Scissors size={16} className="text-gray-400" />
                                    <span className="text-sm text-gray-300 truncate max-w-[120px]">
                                        {app.services?.map(s => s.name).join(', ')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="font-bold text-primary">
                                    ₹{app.totalPrice}
                                </div>
                                {app.status === 'confirmed' && (
                                    <button className="bg-primary text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#b88e2b]">
                                        START
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No appointments found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentsScreen;
