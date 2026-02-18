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
    const trackedRef = useRef(false);
    const apiUrlBase = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        let source = params.get('source');
        let sId = params.get('salon_id');

        // Also detect /checkin/:id pattern from QR standees
        const checkInMatch = location.pathname.match(/\/checkin\/([a-f\d]{24})/i);
        if (!sId && checkInMatch) {
            sId = checkInMatch[1];
            source = 'qr';
        }

        if (source === 'qr' && sId && !trackedRef.current) {
            trackedRef.current = true;

            // 1. Internal attribution
            localStorage.setItem('referred_by_salon', sId);
            localStorage.setItem('referral_source', 'qr');

            // 2. Track Initial Visit (Anonymous)
            const data = JSON.stringify({
                salon_id: sId,
                device_type: getDeviceType()
            });

            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon(`${apiUrlBase}/api/qr/track-visit`, blob);
            } else {
                fetch(`${apiUrlBase}/api/qr/track-visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                }).catch(err => console.error('Tracking failed', err));
            }
        }
    }, [location, apiUrlBase]);

    return null; // This component handles background tracking only now
};

export default QrTracker;
