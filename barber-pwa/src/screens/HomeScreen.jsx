import React from 'react';
import { User, Bell, MapPin } from 'lucide-react';

const HomeScreen = () => {
    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-sm text-gray-400">Welcome back,</h1>
                    <h2 className="text-xl font-bold text-primary">GlossCut Barber</h2>
                </div>
                <div className="flex space-x-3">
                    <button className="p-2 bg-card-dark rounded-full">
                        <Bell size={20} />
                    </button>
                    <button className="p-2 bg-card-dark rounded-full">
                        <User size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card-dark p-4 rounded-xl">
                    <h3 className="text-gray-400 text-sm">Today's Earnings</h3>
                    <p className="text-2xl font-bold mt-1">₹1,250</p>
                </div>
                <div className="bg-card-dark p-4 rounded-xl">
                    <h3 className="text-gray-400 text-sm">Appointments</h3>
                    <p className="text-2xl font-bold mt-1">8</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar">
                    <button className="flex-shrink-0 bg-card-dark p-4 rounded-xl flex flex-col items-center w-24">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                            <MapPin size={20} className="text-primary" />
                        </div>
                        <span className="text-xs">Location</span>
                    </button>
                    <button className="flex-shrink-0 bg-card-dark p-4 rounded-xl flex flex-col items-center w-24">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                            <User size={20} className="text-primary" />
                        </div>
                        <span className="text-xs">Profile</span>
                    </button>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Upcoming</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card-dark p-4 rounded-xl flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                <div>
                                    <h4 className="font-medium">John Doe</h4>
                                    <p className="text-xs text-gray-400">Haircut • 10:00 AM</p>
                                </div>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                                Confirmed
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
