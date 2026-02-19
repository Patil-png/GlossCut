import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Star, Clock, MapPin, Tag, Users,
    Scissors, Map as MapIcon, ChevronRight, CheckCircle,
    Plus, Info, Phone, ShieldCheck
} from 'lucide-react';
import api from '../utils/api';

const BookingScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { barberId } = useParams();
    const { provider: initialProvider, forFriend } = location.state || {};

    const [provider, setProvider] = useState(initialProvider || null);
    const [loading, setLoading] = useState(!initialProvider);
    const [selectedServices, setSelectedServices] = useState([]);

    useEffect(() => {
        if (!provider && barberId) {
            fetchProviderDetails();
        }
    }, [barberId]);

    const fetchProviderDetails = async () => {
        try {
            // In the native app, this uses mock data or a fetch. 
            // Here we'll try to get it from the barber-card API if possible, 
            // or assume it's passed in state from the search screen.
            const res = await api.get(`/api/barber-card/${barberId}`);
            setProvider(res.data);
        } catch (err) {
            console.error("Failed to fetch provider details", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectService = (service) => {
        const isSelected = selectedServices.some(s => (s._id || s.id) === (service._id || service.id));
        if (isSelected) {
            setSelectedServices(prev => prev.filter(s => (s._id || s.id) !== (service._id || service.id)));
        } else {
            setSelectedServices(prev => [...prev, service]);
        }
    };

    const totalPrice = useMemo(() => {
        return selectedServices.reduce((total, service) => {
            const price = parseFloat(service.price) || 0;
            return total + price;
        }, 0);
    }, [selectedServices]);

    const totalTime = useMemo(() => {
        return selectedServices.reduce((total, service) => {
            const time = parseInt(service.time) || 0;
            return total + time;
        }, 0);
    }, [selectedServices]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );

    if (!provider) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <Info size={48} className="text-gray-200 mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Barber Not Found</h2>
            <p className="text-gray-500 text-sm mb-6">We couldn't retrieve the details for this barber.</p>
            <button onClick={() => navigate(-1)} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* HERO / HEADER */}
            <div className="relative h-[280px] w-full overflow-hidden">
                <img
                    src={provider.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop'}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-indigo-500 rounded text-[10px] font-black text-white uppercase tracking-widest">Premium</div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">
                            <Star size={10} className="text-amber-400" fill="currentColor" /> {provider.rating || '4.8'}
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white leading-tight">{provider.name}</h1>
                    <div className="flex items-center gap-1.5 text-gray-300 mt-1">
                        <MapPin size={14} />
                        <p className="text-xs font-bold truncate">{provider.address || "Main Street, NY"}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[450px] mx-auto">
                {/* QUICK STATS */}
                <div className="flex justify-between px-6 py-8 border-b border-gray-100">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                            <Clock size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wait Time</span>
                        <span className="text-sm font-black text-gray-900">{provider.avgAppointmentTime || "25 min"}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customers</span>
                        <span className="text-sm font-black text-gray-900">{provider.customersServed || "1.2k+"}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                            <Tag size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                        <span className="text-sm font-black text-gray-900">Elite</span>
                    </div>
                </div>

                {/* SERVICE LIST */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Select Services</h2>
                        <span className="text-xs font-bold text-gray-400">{provider.services?.length || 0} Total</span>
                    </div>

                    <div className="space-y-4">
                        {provider.services?.map((svc) => {
                            const isSelected = selectedServices.some(s => (s._id || s.id) === (svc._id || svc.id));
                            return (
                                <motion.div
                                    key={svc._id || svc.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectService(svc)}
                                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                            <Scissors size={20} />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{svc.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-indigo-500 uppercase">₹{svc.price}</span>
                                                <span className="text-gray-300 font-bold text-[10px]">•</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{svc.time} min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                                        {isSelected ? <CheckCircle size={14} className="text-white" /> : <Plus size={14} className="text-gray-400" />}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="px-6 py-8 bg-gray-50/50 rounded-t-[40px] space-y-6">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Contact</p>
                                <p className="text-sm font-black text-gray-900">{provider.phone || provider.shopPhone || "Not Listed"}</p>
                            </div>
                        </div>
                        <button className="text-xs font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-lg">Call</button>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase">Shop Location</h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1">
                                <MapIcon size={12} /> View Map
                            </button>
                        </div>
                        <p className="text-xs font-bold text-gray-500 leading-relaxed mb-4">
                            {provider.address || "123 Grooming Street, Central Plaza, Suite 405"}
                        </p>
                        <div className="h-[120px] bg-gray-100 rounded-2xl overflow-hidden relative">
                            {/* Static Map Mockup */}
                            <img src="https://images.glosscut.com/placeholder-map.png" className="w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-bounce">
                                    <MapPin size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION BAR */}
            <AnimatePresence>
                {selectedServices.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 p-6 z-50 flex justify-center"
                    >
                        <div className="w-full max-w-[450px] bg-[#1C1C1E] rounded-[32px] p-4 shadow-2xl flex items-center justify-between">
                            <div className="pl-4">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total to Pay</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-white">₹{totalPrice.toFixed(2)}</span>
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">({totalTime} min)</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/payment-confirmation', {
                                    state: {
                                        provider,
                                        selectedServices,
                                        totalPrice,
                                        totalTime,
                                        forFriend
                                    }
                                })}
                                className="h-14 px-8 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/40 flex items-center gap-2 active:scale-95 transition-transform"
                            >
                                Continue <ChevronRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingScreen;
