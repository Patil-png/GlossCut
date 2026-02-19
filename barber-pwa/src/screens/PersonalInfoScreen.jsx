import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, User, Mail, Phone,
    VenetianMask, Languages, ShieldCheck,
    Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PersonalInfoScreen = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Refresh user data
                await refreshUser();

                // Fetch barber card image
                const response = await api.get('/api/barber-card/my-card');
                if (response.data && response.data.image) {
                    const imageUrl = response.data.image.startsWith('http')
                        ? response.data.image
                        : `${import.meta.env.VITE_API_URL}${response.data.image}`;
                    setImage(imageUrl);
                }
            } catch (err) {
                console.log('Error loading profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [refreshUser]);

    // Calculate profile strength
    const profileStrength = useMemo(() => {
        const fields = [user?.name, user?.email, user?.phone, user?.gender, image];
        const filled = fields.filter(f => f).length;
        const total = fields.length;
        return (filled / total) * 100;
    }, [user, image]);

    const InfoCard = ({ icon: Icon, label, value, onClick, isLast }) => (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}
        >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-4">
                <Icon size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-[15px] font-semibold text-gray-900 truncate">
                    {value || (label === 'Email Address' ? 'No Email' : 'Tap to add')}
                </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                <ChevronRight size={16} className="text-gray-400" />
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">My Profile</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-6 py-8">
                {/* HERO SECTION */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6">
                        {/* Decorative pulses */}
                        <div className="absolute inset-[-15px] rounded-full border border-indigo-500/10 animate-pulse" />
                        <div className="absolute inset-[-30px] rounded-full border border-indigo-500/5 animate-pulse delay-150" />

                        <div className="w-32 h-32 rounded-full p-1 bg-white shadow-2xl relative z-10 overflow-hidden">
                            <img
                                src={image || '/logo.png'}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => { e.target.src = '/logo.png' }}
                            />
                        </div>
                    </div>

                    <h2 className="text-2xl font-[800] text-[#1C1C1E] mb-2 tracking-tight">
                        {user?.name || "User"}
                    </h2>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Verified Account</span>
                    </div>
                </div>

                {/* PROFILE STRENGTH */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-gray-900">Profile Strength</h3>
                        </div>
                        <span className="text-sm font-black text-indigo-600">{Math.round(profileStrength)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${profileStrength}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-indigo-500 rounded-full"
                        />
                    </div>
                    <p className="text-xs font-semibold text-gray-500">
                        {profileStrength === 100 ? "Your profile is looking great!" : "Complete your details for better trust."}
                    </p>
                </div>

                {/* PERSONAL DETAILS LIST */}
                <div className="mb-4 ml-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px]">Personal Details</h3>
                </div>
                <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-gray-100">
                    <InfoCard
                        icon={User}
                        label="Full Name"
                        value={user?.name}
                        onClick={() => navigate('/edit-name')}
                    />
                    <InfoCard
                        icon={Mail}
                        label="Email Address"
                        value={user?.email}
                        onClick={() => navigate('/edit-email')}
                    />
                    <InfoCard
                        icon={Phone}
                        label="Phone Number"
                        value={user?.phone}
                        onClick={() => navigate('/edit-shop-phone')}
                    />
                    <InfoCard
                        icon={VenetianMask}
                        label="Gender"
                        value={user?.gender || "Not provided"}
                        onClick={() => navigate('/gender-selection')}
                    />
                    <InfoCard
                        icon={Languages}
                        label="Language"
                        value={user?.language || "English"}
                        onClick={() => { }}
                        isLast={true}
                    />
                </div>
            </main>
        </div>
    );
};

export default PersonalInfoScreen;
