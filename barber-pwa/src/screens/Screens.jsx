import React from 'react';

export const AppointmentsScreen = () => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Appointments</h1>
        <p>List of appointments will go here.</p>
    </div>
);

export const ServicesScreen = () => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Services</h1>
        <p>Manage your services here.</p>
    </div>
);

export const ProfileScreen = () => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p>User profile settings.</p>
    </div>
);

export const LoginScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-dark p-4">
        <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold text-primary mb-2 text-center">GlossCut</h1>
            <p className="text-gray-400 text-center mb-8">Partner App</p>

            <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-card-dark p-4 rounded-xl mb-4 text-white placeholder-gray-500 border border-transparent focus:border-primary"
            />
            <input
                type="password"
                placeholder="Password"
                className="w-full bg-card-dark p-4 rounded-xl mb-6 text-white placeholder-gray-500 border border-transparent focus:border-primary"
            />

            <button className="w-full bg-primary text-black font-bold p-4 rounded-xl mb-4">
                Login
            </button>

            <p className="text-center text-gray-400 text-sm">
                Don't have an account? <span className="text-primary">Sign up</span>
            </p>
        </div>
    </div>
);
