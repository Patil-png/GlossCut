import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CameraOff, RefreshCw, Smartphone, CheckSquare, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRScannerPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // prompt, granted, denied

    useEffect(() => {
        // Permission Monitoring
        const checkPermission = async () => {
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({ name: 'camera' });
                    setPermissionStatus(result.state);
                    result.onchange = () => setPermissionStatus(result.state);
                } catch (e) { console.error("Permission query failed", e); }
            }
        };
        checkPermission();

        // Scanner Initialization
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true,
        });

        scanner.render(
            (decodedText) => {
                // Success logic
                let shopId = '';
                if (decodedText.includes('/checkin/')) {
                    shopId = decodedText.split('/checkin/')[1].split('?')[0];
                } else if (/^[a-f\d]{24}$/i.test(decodedText)) {
                    shopId = decodedText;
                }

                if (shopId && shopId.length === 24) {
                    setIsScanning(false);
                    scanner.clear().then(() => navigate(`/checkin/${shopId}`)).catch(() => navigate(`/checkin/${shopId}`));
                } else {
                    setError("Invalid GlossCut QR Code. Please try again.");
                }
            },
            (err) => {
                // Silent failure during continuous scan
                if (err?.toLowerCase?.().includes('permission')) setPermissionStatus('denied');
            }
        );

        setIsScanning(true);

        return () => {
            scanner.clear().catch(e => console.error("Scanner cleanup failure", e));
        };
    }, [navigate]);

    const handleRetry = () => window.location.reload();

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-[#1C1C1E] flex flex-col items-center p-6 relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
            {/* --- Premium Ambient Background --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Floating Soft Orbs */}
                <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -50, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[120vw] h-[120vw] bg-gradient-to-br from-amber-500/5 to-transparent blur-[140px] rounded-full"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-gradient-to-tr from-purple-500/5 to-transparent blur-[120px] rounded-full"
                />
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
            </div>

            {/* --- Main Content Portal --- */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[1000px] w-full relative z-10 pt-12 md:pt-24 pb-8 md:pb-12 flex flex-col"
            >
                {/* Header: Editorial Style */}
                <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4 lg:max-w-xl lg:mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2.5 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                    >
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Secure Scan Node</span>
                    </motion.div>

                    <h1 className="text-3xl md:text-[3.2rem] font-black tracking-tight leading-none text-gray-900 uppercase">
                        Scan <span className="text-amber-500 block lg:inline">Entrance</span>
                    </h1>

                    <p className="text-[11px] md:text-xs font-semibold text-gray-400 uppercase tracking-wide leading-relaxed max-w-[240px] md:max-w-[280px] mx-auto opacity-70">
                        Join the studio line instantly. Safe, secure, and touchless.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:items-center lg:justify-center">

                    {/* Left Column: Scanner Portal */}
                    <div className="w-full lg:max-w-[440px] flex flex-col items-center">
                        <div className="relative group w-full px-2 md:px-0">
                            {/* Glowing Aura behind the frame */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="relative aspect-square w-full bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-2 md:p-3 shadow-[0_30px_70px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden">
                                {/* The Scanner Frame */}
                                <div className="w-full h-full rounded-[2rem] md:rounded-[2.8rem] overflow-hidden bg-gray-50/50 relative border-2 border-white shadow-inner">
                                    <div id="reader" className="w-full h-full grayscale-[0.2] hover:grayscale-0 transition-all duration-700 flex flex-col items-center justify-center"></div>

                                    {/* Access State Overlays */}
                                    <AnimatePresence>
                                        {permissionStatus === 'denied' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 1.1 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute inset-0 bg-white/98 backdrop-blur-xl flex flex-col items-center justify-center p-8 md:p-12 text-center z-30"
                                            >
                                                <div className="mb-6 md:mb-8 relative group cursor-pointer" onClick={handleRetry}>
                                                    <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 rounded-full flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
                                                        <CameraOff className="text-red-500" size={36} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse z-0" />
                                                </div>

                                                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 md:mb-3 text-gray-900">Access Restricted</h3>
                                                <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-8 md:mb-10 px-2">
                                                    Enable camera access in settings to identify this studio.
                                                </p>

                                                <button
                                                    onClick={handleRetry}
                                                    className="group relative flex items-center gap-3 md:gap-4 bg-[#1C1C1E] text-white px-8 py-4 md:px-10 md:py-5 rounded-[18px] md:rounded-[22px] font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.3)] active:scale-95 transition-all"
                                                >
                                                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                                                    <span>Retry Handshake</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Pulsing Viewfinder UI (Responsive sizes) */}
                                    {isScanning && permissionStatus !== 'denied' && (
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                                            <div className="w-[70%] h-[70%] md:w-[260px] md:h-[260px] relative">
                                                {/* Corners: Custom Path Style */}
                                                <div className="absolute top-0 left-0 w-8 h-8 md:w-14 md:h-14 border-t-[4px] md:border-t-[5px] border-l-[4px] md:border-l-[5px] border-amber-500 rounded-tl-[1.5rem] md:rounded-tl-[2rem] shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
                                                <div className="absolute top-0 right-0 w-8 h-8 md:w-14 md:h-14 border-t-[4px] md:border-t-[5px] border-r-[4px] md:border-r-[5px] border-amber-500 rounded-tr-[1.5rem] md:rounded-tr-[2rem] shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
                                                <div className="absolute bottom-0 left-0 w-8 h-8 md:w-14 md:h-14 border-b-[4px] md:border-b-[5px] border-l-[4px] md:border-l-[5px] border-amber-500 rounded-bl-[1.5rem] md:rounded-bl-[2rem] shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
                                                <div className="absolute bottom-0 right-0 w-8 h-8 md:w-14 md:h-14 border-b-[4px] md:border-b-[5px] border-r-[4px] md:border-r-[5px] border-amber-500 rounded-br-[1.5rem] md:rounded-br-[2rem] shadow-[0_0_20px_rgba(245,158,11,0.2)]" />

                                                {/* Dynamic Scan Hub */}
                                                <motion.div
                                                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-6 md:inset-8 border-[0.5px] border-amber-500/20 rounded-full"
                                                />

                                                {/* Scanning Laser Line */}
                                                <motion.div
                                                    animate={{ top: ['5%', '95%', '5%'], opacity: [0.3, 1, 0.3] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                    className="absolute left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent z-10 shadow-[0_0_30px_rgba(245,158,11,0.8)]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Floating Pill Below Frame */}
                            <div className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 md:px-6 md:py-3 bg-[#1C1C1E] rounded-full shadow-2xl flex items-center gap-2 md:gap-3 border border-white/10">
                                <Smartphone size={12} className="text-amber-500" />
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap">Point at entrance QR</span>
                            </div>
                        </div>

                        {/* --- Mobile Status Footprint (Visible on small screens) --- */}
                        <div className="mt-12 lg:hidden grid grid-cols-2 gap-3 w-full">
                            <BenefitCard icon={CheckSquare} title="Verified" desc="Studio Identity" />
                            <BenefitCard icon={Fingerprint} title="Secure" desc="End-to-End" />
                        </div>
                    </div>

                    {/* Right Column: Desktop Info Panel */}
                    <div className="hidden lg:flex flex-col flex-1 max-w-[400px] gap-8">
                        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                    How it Works
                                </h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Follow these simple steps to join the studio line.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <StepItem
                                    number="01"
                                    title="Locate QR"
                                    desc="Find the GlossCut QR standee at the studio entrance."
                                />
                                <StepItem
                                    number="02"
                                    title="Automatic Link"
                                    desc="Point your camera. Our AI will identify the studio node."
                                    active
                                />
                                <StepItem
                                    number="03"
                                    title="Join Line"
                                    desc="Instantly view wait times and secure your position."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <BenefitCard icon={CheckSquare} title="Verified Node" desc="Authenticated Studio" />
                            <BenefitCard icon={Fingerprint} title="Encrypted" desc="Privacy Guard Active" />
                        </div>
                    </div>
                </div>

                {/* Return Nav: Integrated with Premium feel */}
                <div className="mt-8 md:mt-16 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-2 mx-auto px-4 py-2"
                    >
                        <RefreshCw size={12} className="rotate-45" /> Back Home
                    </button>
                </div>

                {/* Global Notification Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed bottom-10 left-6 right-6 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md bg-red-500 text-white p-5 rounded-3xl flex items-center gap-4 shadow-2xl z-50 animate-bounce"
                        >
                            <AlertCircle size={24} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="shrink-0 p-2 hover:bg-white/10 rounded-full"><AlertCircle className="rotate-45" size={18} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* --- Premium Overrides: Library Styling --- */}
            <style jsx>{`
                #reader { 
                    border: none !important; 
                    background: transparent !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 1.8rem !important;
                    filter: saturate(1.1) contrast(1.05);
                }
                @media (min-width: 768px) {
                    #reader video { border-radius: 2.22rem !important; }
                }
                #reader button { 
                    background: #DFB163 !important; 
                    color: white !important; 
                    border: none !important;
                    padding: 0.8rem 2rem !important;
                    border-radius: 1rem !important;
                    font-size: 9px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.2em !important;
                    cursor: pointer !important;
                    box-shadow: 0 10px 25px rgba(223, 177, 99, 0.3) !important;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
                    margin: 0 !important;
                }
                @media (min-width: 768px) {
                    #reader button {
                        padding: 1rem 2.5rem !important;
                        border-radius: 1.25rem !important;
                        font-size: 10px !important;
                        letter-spacing: 0.25em !important;
                        margin-top: 1rem !important;
                    }
                }
                #reader button:active { transform: scale(0.96); }
                #reader__dashboard { background: transparent !important; border: none !important; width: 100%; display: flex; justify-content: center; }
                #reader__status_span { display: none !important; }
                #reader__header_message { color: #1C1C1E !important; font-size: 11px !important; font-weight: 800 !important; font-family: inherit !important; text-align: center !important; }
                #reader__scan_region { background: transparent !important; width: 100% !important; }
                img[alt="Scanner backdrop"] { display: none !important; }
            `}</style>
        </div>
    );
};

// -- Helper: Step Item Component --
const StepItem = ({ number, title, desc, active }) => (
    <div className={`flex gap-4 p-4 rounded-2xl border transition-all duration-500 ${active ? 'bg-amber-500/5 border-amber-500/20' : 'bg-transparent border-transparent'}`}>
        <div className={`text-[10px] font-black shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${active ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
            {number}
        </div>
        <div className="flex-1">
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${active ? 'text-gray-900' : 'text-gray-500'}`}>{title}</h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed">{desc}</p>
        </div>
    </div>
);

// -- Helper: Benefit Card Component --
const BenefitCard = ({ icon: Icon, title, desc }) => (
    <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-gray-100 flex flex-col gap-2 md:gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-transform duration-500 hover:-translate-y-1">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100/50">
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <div>
            <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-gray-900 leading-none mb-1">{title}</h4>
            <p className="text-[8px] md:text-[9px] font-bold text-gray-400 tracking-tight uppercase whitespace-nowrap">{desc}</p>
        </div>
    </div>
);

export default QRScannerPage;
