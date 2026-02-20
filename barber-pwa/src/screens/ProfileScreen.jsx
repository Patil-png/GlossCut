import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LogOut, User, Mail, Phone, Store, Clock, ChevronRight, Bell,
    Shield, FileText, QrCode, BarChart3, Zap, Globe, Calendar,
    Users, History, MessageCircle, MailPlus, Smartphone, MapPin,
    Search, Eye, Edit, Sparkles, Crown, Key, Info, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isShopOwner] = useState(true); // Default to true for barber role, can be refined with API check if needed

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    const MenuSection = ({ title, children }) => (
        <motion.div variants={itemVariants} className="mb-8">
            {title && (
                <h3 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] mb-4 ml-4">
                    {title}
                </h3>
            )}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-2">
                {children}
            </div>
        </motion.div>
    );

    const MenuItem = ({ icon: Icon, title, subtitle, onClick, color = "indigo", isLast = false, isDestructive = false }) => (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] cursor-pointer ${isDestructive ? 'hover:bg-red-50' : 'hover:bg-gray-50'} ${!isLast ? 'border-b border-gray-50' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-red-50 text-red-600' : `bg-${color}-50 text-${color}-600`}`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className={`text-[15px] font-black tracking-tight ${isDestructive ? 'text-red-600' : 'text-gray-900'}`}>{title}</h4>
                    {subtitle && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {!isDestructive && <ChevronRight size={18} className="text-gray-300" strokeWidth={3} />}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center overflow-x-hidden">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-[450px] relative min-h-screen flex flex-col"
            >
                {/* PREMIUM HEADER BLOBS */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 pt-safe-top pt-16 pb-32 px-6 relative overflow-hidden rounded-b-[48px]">
                    {/* Abstract Blobs */}
                    <div className="absolute top-[-40px] right-[-30px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl" />
                    <div className="absolute top-10 left-[30%] w-20 h-20 bg-white/5 rounded-full blur-lg" />
                    <div className="absolute bottom-10 right-[-40px] w-28 h-28 bg-white/5 rounded-full blur-xl" />

                    <div className="relative z-10 flex items-center justify-between">
                        <h1 className="text-xl font-[950] text-white tracking-tight">Account Settings</h1>
                        <button
                            onClick={() => navigate('/personal-info')}
                            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform"
                        >
                            <Edit size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* PROFILE CARD (Floating) */}
                <motion.div
                    variants={itemVariants}
                    className="px-6 -mt-20 relative z-20 mb-10"
                >
                    <div className="bg-gray-900 rounded-[40px] p-6 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-[30px] overflow-hidden border-2 border-white/20">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-500 flex items-center justify-center">
                                            <User size={32} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-gray-900 flex items-center justify-center" />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-xl font-[950] tracking-tight">{user?.name || 'Partner Name'}</h2>
                                <p className="text-[11px] font-bold text-gray-400 mt-0.5">{user?.email}</p>

                                <div className="flex items-center gap-2 mt-4">
                                    {isShopOwner ? (
                                        <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Crown size={12} className="text-amber-900" strokeWidth={3} />
                                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Establishment Owner</span>
                                        </div>
                                    ) : (
                                        <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                                            <Sparkles size={12} className="text-white" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Verified Member</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Decorative background shapes */}
                        <div className="absolute top-[-60px] right-[-60px] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-[-30px] left-[-30px] w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    </div>
                </motion.div>

                {/* MENU SECTIONS */}
                <div className="px-6 flex-1">
                    <MenuSection title="General">
                        <MenuItem
                            icon={User}
                            title="Personal Info"
                            subtitle="Manage your identity"
                            onClick={() => navigate('/personal-info')}
                            color="emerald"
                        />
                        <MenuItem
                            icon={Store}
                            title="Shop Info"
                            subtitle="Workplace details"
                            onClick={() => navigate('/listed-card')}
                            color="indigo"
                        />
                        <MenuItem
                            icon={QrCode}
                            title="QR Standee"
                            subtitle="Shop Check-in Code"
                            onClick={() => navigate('/qr-standee')}
                            color="pink"
                        />
                        <MenuItem
                            icon={Eye}
                            title="Public Preview"
                            subtitle="See what customers see"
                            onClick={() => navigate(`/barber-profile/${user?._id || user?.id}`)}
                            color="emerald"
                            isLast
                        />
                    </MenuSection>

                    <MenuSection title="Performance & History">
                        <MenuItem
                            icon={Zap}
                            title="Performance"
                            subtitle="Customers served analytics"
                            onClick={() => navigate('/customers-served')}
                            color="indigo"
                        />
                        <MenuItem
                            icon={History}
                            title="History"
                            subtitle="Past activity archive"
                            onClick={() => navigate('/history')}
                            color="amber"
                        />
                        <MenuItem
                            icon={Search}
                            title="Barber Search"
                            subtitle="Explore nearby shops"
                            onClick={() => navigate('/barber-search')}
                            color="rose"
                            isLast
                        />
                    </MenuSection>

                    <MenuSection title="Security & Privacy">
                        <MenuItem
                            icon={Key}
                            title="2FA Security"
                            subtitle="Two-factor verification"
                            onClick={() => navigate('/two-factor-verification')}
                            color="red"
                        />
                        <MenuItem
                            icon={Shield}
                            title="Privacy Checkup"
                            subtitle="Security & permissions audit"
                            onClick={() => navigate('/privacy-checkup')}
                            color="slate"
                            isLast
                        />
                    </MenuSection>

                    <MenuSection title="Preferences">
                        <MenuItem
                            icon={Bell}
                            title="Alert Prefs"
                            subtitle="Notification preferences"
                            onClick={() => navigate('/manage-notifications')}
                            color="orange"
                        />
                        <MenuItem
                            icon={Clock}
                            title="Capacity Settings"
                            subtitle="Max daily appointments"
                            onClick={() => navigate('/edit-max-appointments')}
                            color="amber"
                        />
                        <MenuItem
                            icon={Calendar}
                            title="Availability"
                            subtitle="Manage your schedule"
                            onClick={() => navigate('/availability')}
                            color="purple"
                        />
                        <MenuItem
                            icon={Globe}
                            title="Language"
                            subtitle="Customize your experience"
                            onClick={() => navigate('/language-selection')}
                            color="emerald"
                            isLast
                        />
                    </MenuSection>

                    <MenuSection title="Support">
                        <MenuItem
                            icon={MessageCircle}
                            title="Live Chat"
                            subtitle="Instant portal assistance"
                            onClick={() => navigate('/chat')}
                            color="indigo"
                        />
                        <MenuItem
                            icon={FileText}
                            title="Refund Policy"
                            subtitle="Terms and conditions"
                            onClick={() => navigate('/refund-policy')}
                            color="blue"
                            isLast
                        />
                    </MenuSection>

                    {/* LOGOUT BUTTON */}
                    <motion.div variants={itemVariants} className="mt-8 mb-12 flex flex-col items-center">
                        <button
                            onClick={logout}
                            className="w-full bg-red-50 text-red-600 font-[900] py-5 rounded-[28px] flex items-center justify-center gap-3 border border-red-100 active:scale-95 transition-all shadow-sm"
                        >
                            <LogOut size={20} strokeWidth={3} />
                            <span className="uppercase tracking-widest text-xs">Sign Out of GlossCut</span>
                        </button>

                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-8">
                            V 2.4.1 • GlossCut Premium
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileScreen;
