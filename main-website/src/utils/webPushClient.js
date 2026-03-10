import axios from 'axios';

// Get Public Key from backend or env
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeUserToPush = async (token) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push messaging isn\'t supported.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Push notification permission denied.');
            return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');

        // Get public key from backend
        const { data: keyData } = await axios.get(`${process.env.REACT_APP_API_URL}/api/webpush/vapid-public-key`);

        const convertedVapidKey = urlBase64ToUint8Array(keyData.publicKey);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        // Send subscription to our backend
        await axios.post(`${process.env.REACT_APP_API_URL}/api/webpush/subscribe`, {
            subscription: subscription
        }, {
            headers: { 'x-auth-token': token }
        });

        console.log('User is subscribed to web push');
        return true;

    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        return false;
    }
};
