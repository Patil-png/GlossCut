import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-bg-dark text-white">
            <main className="flex-1 overflow-y-auto no-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
