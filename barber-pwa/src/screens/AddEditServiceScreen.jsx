import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Tag,
    IndianRupee,
    Clock,
    ChevronDown,
    ChevronRight,
    Check,
    Search,
    X,
    Scissors,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const CATEGORY_COLORS = {
    'Hair': 'text-indigo-600 bg-indigo-50 border-indigo-100',
    'Beard': 'text-amber-600 bg-amber-50 border-amber-100',
    'Skin': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'Color': 'text-pink-600 bg-pink-50 border-pink-100',
    'Shave': 'text-blue-600 bg-blue-50 border-blue-100',
    'Kids': 'text-purple-600 bg-purple-50 border-purple-100',
    'Eyebrow': 'text-teal-600 bg-teal-50 border-teal-100',
    'Massage': 'text-orange-600 bg-orange-50 border-orange-100',
    'General': 'text-slate-600 bg-slate-50 border-slate-100',
    'Other': 'text-slate-600 bg-slate-50 border-slate-100',
};

const getCategoryStyles = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];

const AddEditServiceScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { theme } = useTheme();

    // params from location state
    const params = location.state || {};
    const existingService = params.service || null;
    const shopId = params.shopId || '';

    const [availableServices, setAvailableServices] = useState([]);
    const [selectedService, setSelectedService] = useState(existingService?.serviceId || null);
    const [price, setPrice] = useState(existingService?.price || '');
    const [time, setTime] = useState(existingService?.time || '');
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [openCategories, setOpenCategories] = useState({});

    useEffect(() => {
        fetchAvailableServices();
    }, []);

    const fetchAvailableServices = async () => {
        try {
            const res = await api.get(`/api/barber-card/services?shopId=${user?.shopId || ''}`);
            const data = res.data || [];
            setAvailableServices(data);

            const cats = {};
            data.forEach((s) => {
                const cat = s.category || 'General';
                cats[cat] = true;
            });
            setOpenCategories(cats);
        } catch (err) {
            console.error('Failed to fetch services', err);
        } finally {
            setLoading(false);
        }
    };

    const groupedSections = useMemo(() => {
        const filtered = availableServices.filter((s) => {
            if (!searchText.trim()) return true;
            const q = searchText.toLowerCase();
            return (
                s.name?.toLowerCase().includes(q) ||
                s.category?.toLowerCase().includes(q) ||
                s.description?.toLowerCase().includes(q)
            );
        });

        const map = {};
        filtered.forEach((s) => {
            const cat = s.category || 'General';
            if (!map[cat]) map[cat] = [];
            map[cat].push(s);
        });

        return Object.entries(map).map(([title, data]) => ({ title, data }));
    }, [availableServices, searchText]);

    const handleSave = async () => {
        if (!selectedService) {
            alert('Please select a service');
            return;
        }

        setSaving(true);
        const selectedServiceData = availableServices.find((s) => s._id === selectedService);
        const serviceToSave = {
            ...existingService,
            serviceId: selectedService,
            name: selectedServiceData.name,
            price,
            time: time.toString().replace(/[^0-9]/g, ''),
        };

        try {
            const barberCardRes = await api.get('/api/barber-card/my-card');
            const barberCard = barberCardRes.data;
            const services = barberCard.services || [];
            let updatedServices;

            if (existingService?.id) {
                updatedServices = services.map((s) => (s.id === existingService.id ? serviceToSave : s));
            } else {
                updatedServices = [...services, { ...serviceToSave, id: Date.now().toString() }];
            }

            await api.put('/api/barber-card', { services: updatedServices });
            navigate(-1);
        } catch (err) {
            console.error('Failed to save service', err);
            alert('Failed to save service. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const selectedServiceObj = availableServices.find((s) => s._id === selectedService);
    const catStyles = selectedServiceObj ? getCategoryStyles(selectedServiceObj.category || 'General') : 'text-indigo-600 bg-indigo-50 border-indigo-100';

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Loading Services</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center">
            <div className="w-full max-w-[450px] bg-slate-50 min-h-screen flex flex-col relative pb-32">

                {/* HEADER */}
                <div className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 active:scale-95 transition-transform">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {existingService ? 'Edit Service' : 'Add Service'}
                        </h1>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* SERVICE SELECTOR */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Service</p>
                        <button
                            onClick={() => setShowServiceModal(true)}
                            className={`w-full bg-white p-5 rounded-[24px] border-2 flex items-center gap-4 transition-all active:scale-[0.98] text-left ${selectedService ? 'border-indigo-100 shadow-lg shadow-indigo-100/50' : 'border-slate-100 shadow-sm'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedService ? catStyles.split(' ')[1] : 'bg-slate-50'} ${selectedService ? catStyles.split(' ')[0] : 'text-slate-400'}`}>
                                <Scissors size={24} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-base font-black uppercase tracking-tight ${selectedService ? 'text-slate-900' : 'text-slate-300'}`}>
                                    {selectedServiceObj ? selectedServiceObj.name : 'Choose a service'}
                                </p>
                                {selectedServiceObj && (
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${catStyles.split(' ')[0]}`}>
                                        {selectedServiceObj.category}
                                    </p>
                                )}
                            </div>
                            <ChevronDown className="text-slate-300" size={20} />
                        </button>
                    </div>

                    {/* PRICE & TIME */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Service Price (₹)</p>
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-600">
                                    <IndianRupee size={20} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-16 bg-white rounded-[24px] pl-14 pr-6 text-lg font-black text-slate-900 border-2 border-slate-100 focus:border-indigo-100 outline-none transition-all shadow-sm focus:shadow-lg focus:shadow-indigo-100/50 placeholder:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Avg. Duration (Mins)</p>
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-600">
                                    <Clock size={20} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="number"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    placeholder="30"
                                    className="w-full h-16 bg-white rounded-[24px] pl-14 pr-6 text-lg font-black text-slate-900 border-2 border-slate-100 focus:border-indigo-100 outline-none transition-all shadow-sm focus:shadow-lg focus:shadow-indigo-100/50 placeholder:text-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none z-30">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full max-w-[402px] h-16 bg-slate-900 rounded-[24px] flex items-center justify-center gap-3 text-white font-black text-sm uppercase tracking-widest pointer-events-auto active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Service'}
                    </button>
                </div>

                {/* MODAL */}
                <AnimatePresence>
                    {showServiceModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowServiceModal(false)}
                                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 top-20 bg-white rounded-t-[40px] z-50 overflow-hidden flex flex-col items-center"
                            >
                                <div className="w-full max-w-[450px] h-full flex flex-col">
                                    <div className="p-8 flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 leading-none">Select Service</h2>
                                                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">
                                                    {availableServices.length} Services Available
                                                </p>
                                            </div>
                                            <button onClick={() => setShowServiceModal(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Search size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search services..."
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-4 font-bold text-slate-900 outline-none border-2 border-transparent focus:border-indigo-100 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 pb-12 no-scrollbar">
                                        {groupedSections.map(({ title, data: services }) => {
                                            const isOpen = openCategories[title] !== false;
                                            const styles = getCategoryStyles(title);
                                            return (
                                                <div key={title} className="mb-6">
                                                    <button
                                                        onClick={() => setOpenCategories(prev => ({ ...prev, [title]: !isOpen }))}
                                                        className="w-full flex items-center gap-3 py-2 text-left"
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${styles.split(' ')[0].replace('text-', 'bg-')}`} />
                                                        <span className={`text-xs font-black uppercase tracking-widest flex-1 ${styles.split(' ')[0]}`}>{title}</span>
                                                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                                                            <ChevronDown size={16} className="text-slate-300" />
                                                        </motion.div>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden space-y-2 mt-2"
                                                            >
                                                                {services.map((item) => {
                                                                    const isSelected = selectedService === item._id;
                                                                    return (
                                                                        <button
                                                                            key={item._id}
                                                                            onClick={() => {
                                                                                setSelectedService(item._id);
                                                                                setShowServiceModal(false);
                                                                            }}
                                                                            className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-50 hover:border-slate-100'}`}
                                                                        >
                                                                            <div className="text-left">
                                                                                <p className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{item.name}</p>
                                                                                {item.description && <p className="text-[10px] font-bold text-slate-400 mt-1">{item.description}</p>}
                                                                            </div>
                                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-100'}`}>
                                                                                {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default AddEditServiceScreen;
