import React from 'react';
import CreateBarberCardScreen from './CreateBarberCardScreen';

// Appointments and Services are still placeholders for now
export { default as AppointmentsScreen } from './AppointmentsScreen';
export { CreateBarberCardScreen };

export const ServicesScreen = () => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Services</h1>
        <p>Manage your services here.</p>
    </div>
);
