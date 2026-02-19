import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Mail, Phone, Store, Clock, ChevronRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="p-4 space-y-6 pb-24">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>

            {/* Profile Card */}
            <div className="bg-card-dark p-6 rounded-2xl flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 flex items-center justify-center border-4 border-primary/20">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User size={40} className="text-gray-400" />
                    )}
                </div>
                <h2 className="text-xl font-bold text-white">{user?.name || 'Barber Name'}</h2>
                <p className="text-primary text-sm font-medium">{user?.shopName || 'Shop Name'}</p>
            </div>

            {/* Shop Info link */}
            <div
                onClick={() => navigate('/listed-card')}
                className="bg-primary/10 border border-primary/20 p-5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Store className="text-primary" size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black">Shop Info</h3>
                        <p className="text-xs text-primary/70 font-bold uppercase tracking-wider mt-0.5">Edit Name, Address & Category</p>
                    </div>
                </div>
                <ChevronRight className="text-primary/40" size={20} />
            </div>

            {/* Notifications link */}
            <div
                onClick={() => navigate('/notifications')}
                className="bg-indigo-50/10 border border-indigo-100/20 p-5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50/20 flex items-center justify-center">
                        <Bell className="text-indigo-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black">Notifications</h3>
                        <p className="text-xs text-indigo-500/70 font-bold uppercase tracking-wider mt-0.5">Recent alerts & preferences</p>
                    </div>
                </div>
                <ChevronRight className="text-indigo-500/40" size={20} />
            </div>

            {/* Appointment Settings link */}
            <div
                onClick={() => navigate('/edit-max-appointments')}
                className="bg-amber-50/10 border border-amber-100/20 p-5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50/20 flex items-center justify-center">
                        <Clock className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black">Appointment Settings</h3>
                        <p className="text-xs text-amber-500/70 font-bold uppercase tracking-wider mt-0.5">Manage daily capacity</p>
                    </div>
                </div>
                <ChevronRight className="text-amber-500/40" size={20} />
            </div>

            {/* Info Group */}
            <div className="space-y-3">
                <div className="bg-card-dark p-4 rounded-xl flex items-center space-x-4">
                    <div className="p-2 bg-gray-800 rounded-lg">
                        <Mail size={20} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-medium">{user?.email}</p>
                    </div>
                </div>

                <div className="bg-card-dark p-4 rounded-xl flex items-center space-x-4">
                    <div className="p-2 bg-gray-800 rounded-lg">
                        <Phone size={20} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="font-medium">{user?.phone || 'Not set'}</p>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button
                onClick={logout}
                className="w-full bg-red-500/10 text-red-500 font-bold p-4 rounded-xl flex items-center justify-center space-x-2 mt-8"
            >
                <LogOut size={20} />
                <span>Log Out</span>
            </button>

            <div className="text-center text-xs text-gray-600 mt-4">
                App Version 1.0.0
            </div>
        </div>
    );
};

export default ProfileScreen;
