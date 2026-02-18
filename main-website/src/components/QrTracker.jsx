import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import QrLeadModal from './QrLeadModal.jsx';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [salonId, setSalonId] = useState(null);
    const [salonName, setSalonName] = useState('Our Shop');
    const apiUrlBase = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const source = params.get('source');
        const sId = params.get('salon_id');

        if (source === 'qr' && sId && !trackedRef.current) {
            trackedRef.current = true;
            setSalonId(sId);

            // 1. Internal attribution
            localStorage.setItem('referred_by_salon', sId);
            localStorage.setItem('referral_source', 'qr');

            // 2. Fetch Shop Name for Modal
            fetch(`${apiUrlBase}/api/offlinetools/shop-details/${sId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.name) setSalonName(data.name);
                })
                .catch(err => console.error('Failed to fetch shop name', err));

            // 3. Track Initial Visit (Anonymous)
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

            // 4. Check if we should show Lead Modal (if not previously captured)
            if (localStorage.getItem('qr_lead_captured') !== 'true') {
                setIsModalOpen(true);
            }
        }
    }, [location, apiUrlBase]);

    const handleLeadSubmit = async ({ name, phone }) => {
        try {
            const data = {
                salon_id: salonId,
                device_type: getDeviceType(),
                customer_name: name,
                customer_phone: phone
            };

            const res = await fetch(`${apiUrlBase}/api/qr/track-visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                localStorage.setItem('qr_lead_captured', 'true');
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to save lead info', err);
            setIsModalOpen(false);
        }
    };

    return (
        <QrLeadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleLeadSubmit}
            salonName={salonName}
        />
    );
};

export default QrTracker;
