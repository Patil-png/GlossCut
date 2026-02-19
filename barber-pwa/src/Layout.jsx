import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './components/BottomNavigation';

const Layout = () => {
    const location = useLocation();
    // Hide bottom nav on auth screens
    const hideNav = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark text-white">
            <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                <Outlet />
            </main>
            {!hideNav && <BottomNavigation />}
        </div>
    );
};

export default Layout;
