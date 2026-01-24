import React, { useState } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const SecuritySettings = () => {
    const { admin } = useAdminAuth();
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isEnabled, setIsEnabled] = useState(admin?.isTwoFactorEnabled || false);

    const enableTwoFactor = async () => {
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/auth/enable-2fa`);
            setQrCode(res.data.qrCode);
            setSecret(res.data.secret);
            setMessage({ type: '', text: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to generate 2FA secret' });
        }
    };

    const verifySetup = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/auth/verify-2fa-setup`, { token: verificationCode });
            setMessage({ type: 'success', text: 'Two-Factor Authentication enabled successfully!' });
            setIsEnabled(true);
            setQrCode(null);
            setSecret(null);
            setVerificationCode('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Invalid verification code' });
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h1>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Two-Factor Authentication (2FA)
                </h2>

                {isEnabled ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 font-medium">2FA is currently enabled on your account.</span>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-600 mb-4">
                            Add an extra layer of security to your account by enabling Two-Factor Authentication.
                            You will need an authenticator app like Google Authenticator or Authy.
                        </p>

                        {!qrCode ? (
                            <button
                                onClick={enableTwoFactor}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Enable 2FA
                            </button>
                        ) : (
                            <div className="mt-4 border-t pt-4">
                                <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
                                <div className="flex justify-center mb-4 bg-gray-100 p-4 rounded-lg inline-block">
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Or enter this code manually: <span className="font-mono bg-gray-100 px-1 rounded">{secret}</span>
                                </p>

                                <h3 className="font-semibold mb-2">Step 2: Verify Code</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        className="flex-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-widest text-center"
                                    />
                                    <button
                                        onClick={verifySetup}
                                        disabled={verificationCode.length !== 6}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Verify & Activate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {message.text && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecuritySettings;
