import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Helper to determine device type
const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/iPad|tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
};

const QrTracker = () => {
    const location = useLocation();
    // Ref to ensure we don't track the same visit multiple times on re-renders
    const trackedRef = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const source = params.get('source');
        const salonId = params.get('salon_id');

        if (source === 'qr' && salonId && !trackedRef.current) {
            trackedRef.current = true;

            // 1. Store locally for future attribution (conversion tracking)
            localStorage.setItem('referred_by_salon', salonId);
            localStorage.setItem('referral_source', 'qr');

            // 2. Send Beacon (Fire and Forget)
            const data = JSON.stringify({
                salon_id: salonId,
                device_type: getDeviceType()
            });

            // Use navigator.sendBeacon if available for reliable background sending
            if (navigator.sendBeacon) {
                // Blob is sometimes required for correct Content-Type header with sendBeacon
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon('https://api.glosscut.com/api/qr/track-visit', blob);
            } else {
                // Fallback to fetch
                fetch('https://api.glosscut.com/api/qr/track-visit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true // Important for background requests
                }).catch(err => console.error('Tracking failed', err));
            }
        }
    }, [location]);

    return null; // This component renders nothing
};

export default QrTracker;
