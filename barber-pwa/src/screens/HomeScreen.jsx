import React, { useState, useEffect } from 'react';
import { User, Bell, MapPin, Clock, Scissors, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        earnings: 0,
        appointments: 0,
        queueLength: 0
    });
    const [nextCustomer, setNextCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const today = format(new Date(), 'yyyy-MM-dd');

                // 1. Fetch Daily Earnings
                const earningsRes = await api.get('/api/earnings?filter=day&summaryOnly=true');

                // 2. Fetch Appointments/Queue
                const queueRes = await api.get(`/api/booking/barber-appointments/${user._id}?date=${today}`);

                let appointments = Array.isArray(queueRes.data) ? queueRes.data : [];

                // Filter active appointments
                const activeAppointments = appointments.filter(app =>
                    ['pending', 'confirmed', 'started'].includes(app.status) &&
                    app.paymentStatus !== 'failed'
                ).sort((a, b) => {
                    // Simple sort by status then time (mimicking simplified logic)
                    if (a.status === 'started') return -1;
                    if (b.status === 'started') return 1;
                    return new Date(a.date) - new Date(b.date);
                });

                const completedAppointments = appointments.filter(app => app.status === 'completed');

                setStats({
                    earnings: earningsRes.data?.totalEarnings || 0,
                    appointments: appointments.length,
                    queueLength: activeAppointments.length
                });

                if (activeAppointments.length > 0) {
                    setNextCustomer(activeAppointments[0]);
                } else {
                    setNextCustomer(null);
                }

            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    if (!user) return null;

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div onClick={() => navigate('/profile')}>
                    <h1 className="text-sm text-gray-400">Welcome back,</h1>
                    <h2 className="text-xl font-bold text-primary truncate max-w-[200px]">{user.name}</h2>
                </div>
                <div className="flex space-x-3">
                    <button className="p-2 bg-card-dark rounded-full relative">
                        <Bell size={20} className="text-white" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-dark"></span>
                    </button>
                    <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full border-2 border-primary/30 overflow-hidden">
                        {user.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <User size={20} className="text-gray-400" />
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card-dark p-4 rounded-2xl border border-white/5">
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Today's Earnings</h3>
                    <p className="text-2xl font-black text-primary mt-1">₹{stats.earnings}</p>
                </div>
                <div className="bg-card-dark p-4 rounded-2xl border border-white/5">
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Queue Length</h3>
                    <p className="text-2xl font-black text-white mt-1">{stats.queueLength} <span className="text-sm font-normal text-gray-500">People</span></p>
                </div>
            </div>

            {/* Current Token / Up Next */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-white">Live Queue</h3>
                    <button onClick={() => navigate('/appointments')} className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
                        VIEW ALL
                    </button>
                </div>

                {loading ? (
                    <div className="bg-card-dark p-6 rounded-2xl animate-pulse h-32"></div>
                ) : nextCustomer ? (
                    <div className="bg-card-dark rounded-2xl p-0 overflow-hidden border border-primary/20 shadow-lg shadow-black/20 relative">
                        {/* Status Strip */}
                        <div className={`h-1.5 w-full ${nextCustomer.status === 'started' ? 'bg-green-500' : 'bg-primary'}`}></div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${nextCustomer.status === 'started' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'
                                            }`}>
                                            {nextCustomer.status === 'started' ? 'In Progress' : 'Up Next'}
                                        </span>
                                        {nextCustomer.appointmentType?.toLowerCase().includes('express') && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-500">
                                                Express
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        {nextCustomer.isOfflineBooking ? nextCustomer.customerName : nextCustomer.userId?.name || 'Unknown'}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-white">{nextCustomer.time || 'Now'}</p>
                                    <p className="text-xs text-gray-400">Time</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 text-gray-300 text-sm bg-bg-dark/50 p-3 rounded-xl">
                                <Scissors size={16} className="text-gray-400" />
                                <span className="truncate">
                                    {nextCustomer.services?.map(s => s.name).join(', ') || nextCustomer.appointmentType}
                                </span>
                            </div>
                        </div>

                        {/* Dashed Separator */}
                        <div className="relative h-4 bg-bg-dark/30 overflow-hidden">
                            <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-gray-600/30 -translate-y-1/2"></div>
                            <div className="absolute -left-2 top-1/2 w-4 h-4 bg-bg-dark rounded-full -translate-y-1/2"></div>
                            <div className="absolute -right-2 top-1/2 w-4 h-4 bg-bg-dark rounded-full -translate-y-1/2"></div>
                        </div>

                        <div className="p-4 bg-bg-dark/10 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Payment Status</span>
                                <span className={`text-xs font-bold ${nextCustomer.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
                                    {nextCustomer.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                                </span>
                            </div>
                            <div className="text-xl font-black text-white">
                                ₹{nextCustomer.totalPrice}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card-dark p-8 rounded-2xl text-center border border-dashed border-gray-700">
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-white font-bold">Queue is Empty</h3>
                        <p className="text-gray-400 text-sm mt-1">No appointments scheduled for now.</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-3">
                    <button onClick={() => navigate('/appointments')} className="bg-card-dark p-3 rounded-xl flex flex-col items-center space-y-2 active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-300">Schedule</span>
                    </button>
                    <button className="bg-card-dark p-3 rounded-xl flex flex-col items-center space-y-2 active:scale-95 transition-transform opacity-50">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                            <Scissors size={20} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-300">Services</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
