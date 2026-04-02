import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user?._id || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Initialize socket
        const newSocket = io('https://api.glosscut.com', {
            transports: ['websocket'],
            reconnection: true,
            query: { token }
        });

        newSocket.on('connect', () => {
            console.log('✅ Global Socket Connected');
            newSocket.emit('join', `barber_${user._id}`);
        });

        // --- GLOBAL SOCKET NOTIFICATIONS ---
        // Request Permission if not already asked
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Listen for real-time bookings
        newSocket.on('new_booking', (data) => {
            const price = data?.totalPrice || data?.price || '...';
            const customer = data?.customerName || 'Customer';
            const time = data?.time || 'Now';
            const bodyText = `${customer} • ${time}\nTap to view details`;
            const title = `💳 Booking Confirmed • ₹${price}`;

            console.log("🔔 Socket triggered new booking notification:", title);

            // 1. Check if permissions are granted
            if ('Notification' in window && Notification.permission === 'granted') {
                const options = {
                    body: bodyText,
                    icon: '/GlossCutQr.png',
                    badge: '/ic_stat_notification_icon.png',
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    requireInteraction: true,
                    data: { url: '/queue' }
                };

                // 2. Trigger notification via Service Worker (MANDATORY on Android)
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, options);
                    }).catch(err => {
                        console.error("SW Notification failed:", err);
                        // Safe Desktop Fallback
                        try {
                            const notif = new Notification(title, options);
                            notif.onclick = function () {
                                window.focus();
                                window.location.href = '/queue';
                                notif.close();
                            };
                        } catch (e) {
                            console.error("Native notification also failed:", e);
                        }
                    });
                }
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?._id]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
