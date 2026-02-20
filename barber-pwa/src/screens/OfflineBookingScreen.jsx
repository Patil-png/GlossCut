import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Calendar, Clock, User, Phone,
    CheckCircle2, AlertCircle, XCircle, Check,
    Scissors, ChevronRight, Zap, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const OfflineBookingScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
    const [services, setServices] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [appointmentType, setAppointmentType] = useState('Basic');
    const [isExpressFull, setIsExpressFull] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (type, title, message) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 3000);
    };

    const totalPrice = useMemo(() => {
        return services.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
    }, [services]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get('/api/barber-card/my-card');
                if (res.data && res.data.services) {
                    setAvailableServices(res.data.services);
                }
            } catch (err) {
                console.log('Error fetching services:', err);
            }
        };
        fetchServices();
    }, []);

    useEffect(() => {
        const checkExpressLimitAndAutoFill = async () => {
            if (!user?._id) return;
            try {
                const res = await api.get(`/api/booking/barber-appointments/${user._id}?date=${selectedDate}`);
                const data = res.data || [];

                // 1. Check Express Limit
                const expressCount = data.filter(app =>
                    app.status !== 'cancelled' &&
                    ((app.appointmentType && app.appointmentType.toLowerCase().includes('express')) || app.isPromoted)
                ).length;

                const full = expressCount >= 2;
                setIsExpressFull(full);
                if (full && appointmentType === 'Express') setAppointmentType('Basic');

                // 2. Auto-fill Name and Phone (Only if first load for "Today")
                if (selectedDate === format(new Date(), 'yyyy-MM-dd')) {
                    if (!customerPhone && user.phone) setCustomerPhone(user.phone);

                    if (!customerName) {
                        const walkInCount = data.filter(app =>
                            app.isOfflineBooking &&
                            app.customerName &&
                            app.customerName.toLowerCase().startsWith('walk-in -')
                        ).length;
                        setCustomerName(`Walk-in - ${walkInCount + 1}`);
                    }
                }
            } catch (err) {
                console.log('Error in checkExpressLimitAndAutoFill:', err);
            }
        };
        checkExpressLimitAndAutoFill();
    }, [selectedDate, user?._id, appointmentType, user.phone]);

    const toggleService = (s) => {
        const isSelected = services.some(item => item.id === (s._id || s.id));
        if (isSelected) {
            setServices(services.filter(item => item.id !== (s._id || s.id)));
        } else {
            setServices([...services, { id: s._id || s.id, name: s.name, price: s.price }]);
        }
    };

    const handleBooking = async () => {
        if (!customerName.trim()) return showToast('error', 'Required', 'Please enter customer name');
        if (!customerPhone.trim() || customerPhone.length < 10) return showToast('error', 'Required', 'Enter valid phone number');
        if (services.length === 0) return showToast('error', 'Service', 'Select at least one service');

        setLoading(true);
        try {
            await api.post('/api/booking', {
                barberId: user._id,
                date: selectedDate,
                time: selectedTime,
                services,
                totalPrice,
                appointmentType,
                isOfflineBooking: true,
                customerName,
                customerPhone
            });
            showToast('success', 'Confirmed', 'Booking added successfully!');
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            showToast('error', 'Failed', err.response?.data?.msg || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                        <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">New Booking</h1>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 mx-auto w-fit mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Walk-in Mode</span>
                        </div>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-6 py-6 space-y-8">
                {/* CUSTOMER DETAILS */}
                <section>
                    <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Customer Details</h3>
                    <div className="space-y-3">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full h-16 pl-12 pr-4 bg-white rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-semibold text-gray-900 shadow-sm transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Phone size={20} />
                            </div>
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full h-16 pl-12 pr-4 bg-white rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-semibold text-gray-900 shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* SCHEDULE */}
                <section>
                    <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Schedule</h3>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <Calendar size={18} className="text-indigo-500" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                            </div>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full h-8 bg-transparent border-none outline-none font-black text-gray-900"
                            />
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <Clock size={18} className="text-indigo-500" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</span>
                            </div>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full h-8 bg-transparent border-none outline-none font-black text-gray-900"
                            />
                        </div>
                    </div>
                </section>

                {/* SERVICES */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Select Services</h3>
                        {services.length > 0 && (
                            <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                                {services.length} Selected
                            </div>
                        )}
                    </div>
                    <div className="grid gap-3">
                        {availableServices.map((s, idx) => {
                            const isSelected = services.some(item => item.id === (s._id || s.id));
                            return (
                                <motion.div
                                    key={s._id || s.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleService(s)}
                                    className={`p-4 rounded-[24px] flex items-center border-2 transition-all cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${isSelected ? 'bg-indigo-100' : 'bg-gray-50'}`}>
                                        <Scissors size={20} className={isSelected ? 'text-indigo-600' : 'text-gray-400'} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[15px] font-bold text-gray-900">{s.name}</h4>
                                        <span className="text-[11px] font-semibold text-gray-400 tracking-tighter uppercase">• {s.time || s.duration || 30} mins</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[17px] font-black text-gray-900 mb-1">₹{s.price}</div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-100'
                                            }`}>
                                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>

                {/* PRIORITY LEVEL */}
                <section>
                    <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">Priority Level</h3>
                    <div className="flex gap-4">
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAppointmentType('Basic')}
                            className={`flex-1 p-5 rounded-[28px] border-2 transition-all cursor-pointer ${appointmentType === 'Basic' ? 'bg-indigo-500 border-indigo-500 text-white shadow-xl rotate-[-2deg]' : 'bg-white border-transparent text-gray-900 shadow-sm'
                                }`}
                        >
                            <ShieldCheck size={20} className={appointmentType === 'Basic' ? 'text-white' : 'text-gray-400'} />
                            <div className="mt-4">
                                <div className="text-[17px] font-black">Basic</div>
                                <div className={`text-[11px] font-bold uppercase tracking-wider ${appointmentType === 'Basic' ? 'text-white/80' : 'text-gray-400'}`}>Standard</div>
                            </div>
                        </motion.div>
                        <motion.div
                            whileTap={!isExpressFull ? { scale: 0.95 } : {}}
                            onClick={() => !isExpressFull && setAppointmentType('Express')}
                            className={`flex-1 p-5 rounded-[28px] border-2 transition-all cursor-pointer relative ${isExpressFull ? 'bg-gray-100 border-transparent opacity-50 grayscale' :
                                appointmentType === 'Express' ? 'bg-purple-600 border-purple-600 text-white shadow-xl rotate-[2deg]' : 'bg-white border-transparent text-gray-900 shadow-sm'
                                }`}
                        >
                            <Zap size={20} className={appointmentType === 'Express' ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
                            <div className="mt-4">
                                <div className="text-[17px] font-black">Express</div>
                                <div className={`text-[11px] font-bold uppercase tracking-wider ${appointmentType === 'Express' ? 'text-white/80' : 'text-gray-400'}`}>Priority</div>
                            </div>
                            {isExpressFull && (
                                <div className="absolute top-4 right-4 text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded shadow-sm">FULL</div>
                            )}
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* FOOTER ACTION */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent z-40">
                <div className="max-w-[500px] mx-auto bg-white rounded-[32px] p-4 flex items-center justify-between border border-gray-100 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
                    <div className="pl-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Total Payable</span>
                        <div className="flex items-baseline">
                            <span className="text-sm font-bold text-indigo-500 mr-0.5">₹</span>
                            <span className="text-3xl font-black text-gray-900">{totalPrice}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleBooking}
                        disabled={loading}
                        className="h-16 px-8 bg-[#1C1C1E] text-white rounded-[24px] font-black tracking-tight flex items-center gap-2 active:scale-95 transition-transform shadow-xl shadow-black/10 disabled:opacity-50"
                    >
                        {loading ? 'Booking...' : 'Confirm'}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* TOAST */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        className="fixed top-8 left-6 right-6 z-[100] flex justify-center"
                    >
                        <div className={`px-6 py-4 rounded-3xl flex items-center gap-4 bg-gray-900 text-white shadow-2xl min-w-[300px]`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}>
                                {toast.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black">{toast.title}</h4>
                                <p className="text-xs text-gray-400 font-bold">{toast.message}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OfflineBookingScreen;
