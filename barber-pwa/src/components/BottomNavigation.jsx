import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, Scissors } from 'lucide-react';

const BottomNavigation = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card-dark border-t border-gray-800 pb-safe-area-inset-bottom z-50">
            <div className="flex justify-around items-center h-16">
                <NavItem to="/" icon={<Home size={24} />} label="Home" />
                <NavItem to="/appointments" icon={<Calendar size={24} />} label="Bookings" />
                <NavItem to="/services" icon={<Scissors size={24} />} label="Services" />
                <NavItem to="/profile" icon={<User size={24} />} label="Profile" />
            </div>
        </div>
    );
};

const NavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-400'
            }`
        }
    >
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </NavLink>
);

export default BottomNavigation;
