import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    RefreshCw,
    AlertCircle,
    CameraOff,
    ScanLine
} from 'lucide-react';

const QRScannerPage = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const navigate = useNavigate();

    const stopScanner = React.useCallback(async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error("Stop Error:", err);
            }
        }
    }, []);

    const handleScanSuccess = React.useCallback((decodedText) => {
        const studioId = decodedText.split('/').pop();
        if (studioId) {
            stopScanner();
            navigate(`/checkin/${studioId}`);
        } else {
            setError("Invalid QR Code. Please try the official GlossCut standee.");
        }
    }, [navigate, stopScanner]);

    const startScanner = React.useCallback(async () => {
        try {
            setIsScanning(true);
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const config = {
                fps: 20,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Ignore noisy frame errors
                }
            );
            setPermissionStatus('granted');
        } catch (err) {
            console.error("Scanner Error:", err);
            setPermissionStatus('denied');
            setIsScanning(false);
        }
    }, [handleScanSuccess]);

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, [startScanner, stopScanner]);

    const handleRetry = () => {
        setError(null);
        setPermissionStatus('prompt');
        startScanner();
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-amber-500/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-amber-500/5 blur-[80px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10 flex flex-col items-center"
            >
                {/* Minimalist Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 mb-4">
                        <ScanLine size={12} className="text-amber-600" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700">Studio Entrance</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">Scan QR</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Automatic sync with studio line</p>
                </div>

                {/* Main Scanner Container */}
                <div className="relative w-full aspect-square bg-white rounded-[3rem] p-3 shadow-2xl border border-gray-50 overflow-hidden">
                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-gray-50 relative border border-gray-100">
                        <div id="reader" className="w-full h-full"></div>

                        {/* Permission Overlay */}
                        <AnimatePresence>
                            {permissionStatus === 'denied' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-30"
                                >
                                    <CameraOff className="text-red-500 mb-4" size={32} />
                                    <h3 className="text-lg font-black uppercase text-gray-900 mb-2">Camera Access Denied</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-8">Enable camera in site settings</p>
                                    <button
                                        onClick={handleRetry}
                                        className="bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                    >
                                        Retry Access
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Viewfinder Overlay */}
                        {isScanning && permissionStatus !== 'denied' && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                                <div className="w-[80%] h-[80%] relative border-2 border-amber-500/30 rounded-3xl">
                                    {/* Pulse Effect */}
                                    <div className="absolute inset-0 bg-amber-500/5 animate-pulse rounded-3xl" />

                                    {/* Scan Line */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[2px] bg-amber-500 opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Pill */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-black rounded-full shadow-xl border border-white/10 flex items-center gap-2">
                        <Smartphone size={12} className="text-amber-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white whitespace-nowrap">Focus on Shop QR</span>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="mt-12">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 px-6 py-3 rounded-full hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group"
                    >
                        <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                        Back Home
                    </button>
                </div>
            </motion.div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-red-500 text-white p-5 rounded-3xl shadow-2xl z-50 flex items-center gap-4"
                    >
                        <AlertCircle size={20} />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-tight flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="p-2 bg-white/10 rounded-full">
                            <RefreshCw size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Overrides */}
            <style jsx>{`
                #reader { border: none !important; background: transparent !important; }
                #reader video { 
                    width: 100% !important; 
                    height: 100% !important; 
                    object-fit: cover !important; 
                }
                #reader button { display: none !important; }
                #reader__dashboard { background: transparent !important; border: none !important; }
                #reader__status_span { display: none !important; }
                img[alt="Scanner backdrop"] { display: none !important; }
            `}</style>
        </div>
    );
};

export default QRScannerPage;
