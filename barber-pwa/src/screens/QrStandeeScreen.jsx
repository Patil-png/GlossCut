import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Printer, Download,
    Share2, Info, CheckCircle2, Scissors
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const QrStandeeScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const res = await api.get('/api/shop/my-shop');
                setShop(res.data);
            } catch (err) {
                console.log('Error fetching shop:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchShop();
    }, []);

    const qrData = `https://glosscut.com/checkin/${shop?._id || ''}`;
    const cleanShopName = (shop?.name || 'Your Shop').replace(/^@/, '').trim();

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 print:bg-white print:pb-0">
            {/* IN-APP HEADER (Hidden during print) */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100 print:hidden">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                        <ChevronLeft size={20} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">Shop QR Standee</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-6 py-10 flex flex-col items-center print:hidden">
                {/* PREMIUM PREVIEW CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative w-full max-w-[340px] aspect-[1/1.5] bg-slate-900 rounded-[48px] p-1.5 shadow-2xl overflow-hidden mb-12"
                >
                    {/* Floating background elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-indigo-500 rounded-full blur-[80px]" />
                        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-emerald-500 rounded-full blur-[80px]" />
                    </div>

                    <div className="relative w-full h-full border-2 border-slate-800 rounded-[44px] flex flex-col items-center justify-between py-12 px-8 overflow-hidden">
                        <div className="text-center">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-2 block">GlossCut Partner</span>
                            <div className="w-8 h-1 bg-yellow-400 mx-auto rounded-full" />
                        </div>

                        <div className="w-full aspect-square bg-white rounded-[32px] p-6 shadow-2xl shadow-black/20 flex items-center justify-center relative">
                            <QRCodeSVG
                                value={qrData}
                                size={220}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: "/logo.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>

                        <div className="text-center w-full">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">For your best experience at</p>
                            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tight break-words">{cleanShopName}</h2>
                        </div>
                    </div>
                </motion.div>

                {/* ACTION SECTION */}
                <div className="w-full max-w-sm space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Print Actions</h4>
                    <button
                        onClick={handlePrint}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-[28px] shadow-xl shadow-indigo-600/20 flex items-center gap-4 transition-all active:scale-95"
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                            <Printer size={24} />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="text-lg font-black leading-tight">Print Official Standee</h3>
                            <p className="text-xs text-white/60 font-bold">Standard A4 Layout (6 Cards)</p>
                        </div>
                        <Download size={20} className="text-white/40" />
                    </button>

                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[28px] p-5 flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Info size={20} className="text-indigo-600" />
                        </div>
                        <p className="text-xs text-indigo-900/60 font-bold leading-relaxed">
                            <span className="text-indigo-900">Pro Tip:</span> Cut along dashed lines. Place them on mirrors or reception desks for easy customer check-in!
                        </p>
                    </div>
                </div>
            </main>

            {/* PRINT ONLY LAYOUT */}
            <div className="hidden print:block print:w-full print:m-0 print:p-0">
                <style>{`
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { background: white; }
                        .print-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            grid-template-rows: repeat(3, 1fr);
                            gap: 15px;
                            width: 210mm;
                            height: 297mm;
                            padding: 10mm;
                        }
                        .print-card {
                            border: 2px dashed #cbd5e1;
                            border-radius: 16px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: space-between;
                            padding: 20px;
                            background: white;
                            position: relative;
                        }
                        .print-card::after {
                            content: '✂';
                            position: absolute;
                            bottom: -9px;
                            right: -9px;
                            background: white;
                            font-size: 14px;
                            color: #94a3b8;
                            transform: rotate(-45deg);
                        }
                    }
                `}</style>
                <div className="print-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="print-card">
                            <div className="text-center">
                                <img src="/logo.png" alt="GlossCut" className="w-8 h-8 mx-auto mb-2 object-contain" />
                                <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">{cleanShopName}</h3>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Self Check-in & Booking</p>
                            </div>

                            <div className="border border-gray-100 p-2 rounded-xl shadow-sm bg-white">
                                <QRCodeSVG
                                    value={qrData}
                                    size={100}
                                    level="L"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="text-center">
                                <div className="text-[10px] font-black bg-gray-100 text-gray-900 px-3 py-1 rounded-lg uppercase tracking-wider mb-2">Scan to Check-in</div>
                                <div className="flex items-center justify-center gap-1.5 text-pink-600">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    <span className="text-[9px] font-black">@gloss_cut</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QrStandeeScreen;
