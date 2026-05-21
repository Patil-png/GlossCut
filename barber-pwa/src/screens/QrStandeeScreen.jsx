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
                                    src: "/GlossCut.png",
                                    height: 55,
                                    width: 55,
                                    excavate: true,
                                }}
                            />
                            {/* ROUNDED LOGO OVERLAY */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55px] h-[55px] bg-white rounded-2xl p-1 shadow-md flex items-center justify-center">
                                <img src="/GlossCut.png" alt="logo" className="w-full h-full object-contain rounded-xl" />
                            </div>
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
                            <p className="text-xs text-white/60 font-bold">Premium A4 Layout (3 Large Cards)</p>
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

            {/* PRINT ONLY LAYOUT — BUSINESS CARD STYLE */}
            <div className="hidden print:block print:w-full print:m-0 print:p-0">
                <style>{`
                    @media print {
                        @page { size: A4 portrait; margin: 0; }
                        body { background: white; }
                        .print-page {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 0;
                            width: 210mm;
                            height: 297mm;
                            padding: 14mm 12mm;
                            box-sizing: border-box;
                            background: #f1f1f1;
                        }
                        .print-card {
                            width: fit-content;
                            height: 72mm;
                            background: #111111;
                            border-radius: 10px;
                            display: flex;
                            flex-direction: row;
                            align-items: stretch;
                            overflow: visible;
                            position: relative;
                            flex-shrink: 0;
                        }
                        .card-wrap {
                            position: relative;
                            display: inline-flex;
                            margin: 2mm 0;
                            padding: 1px;
                            border: 1.5px dotted #94a3b8;
                            border-radius: 12px;
                        }
                        .card-left {
                            width: 70mm;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            padding: 8mm 3mm 8mm 8mm;
                            gap: 5px;
                            flex-shrink: 0;
                        }
                        .card-logo-circle {
                            width: 64px;
                            height: 64px;
                            background: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                            margin-bottom: 6px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        .card-logo-circle img {
                            width: 44px;
                            height: 44px;
                            object-fit: contain;
                        }
                        .card-brand-label {
                            font-size: 7px;
                            font-weight: 700;
                            color: rgba(255,255,255,0.35);
                            text-transform: uppercase;
                            letter-spacing: 2.5px;
                        }
                        .card-shop-name {
                            font-size: 18px;
                            font-weight: 900;
                            color: #ffffff;
                            text-transform: uppercase;
                            letter-spacing: -0.3px;
                            line-height: 1.05;
                        }
                        .card-subtitle {
                            font-size: 8px;
                            font-weight: 600;
                            color: rgba(255,255,255,0.35);
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                        }
                        .card-features {
                            display: flex;
                            flex-direction: column;
                            gap: 2px;
                            margin-top: 4px;
                        }
                        .card-feature {
                            font-size: 8px;
                            font-weight: 700;
                            color: #cbd5e1;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        .card-feature-normal {
                            text-transform: none;
                            letter-spacing: 0;
                        }
                        .card-right {
                            width: 58mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 5mm 4mm 5mm 2mm;
                            flex-shrink: 0;
                        }
                        .card-qr-wrap {
                            background: white;
                            border-radius: 8px;
                            padding: 6px;
                            position: relative;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .card-logo-overlay {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 48px;
                            height: 48px;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            border: 2px solid white;
                        }
                        .card-logo-overlay img {
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        }
                        .card-gold-strip {
                            width: 7px;
                            background: #c8992a;
                            flex-shrink: 0;
                        }
                        .card-url {
                            font-size: 6px;
                            color: rgba(255,255,255,0.25);
                            letter-spacing: 0.5px;
                            margin-top: 5px;
                            font-weight: 600;
                        }
                    }
                `}</style>
                <div className="print-page">
                    {[1, 2, 3].map((i) => (
                        <React.Fragment key={i}>
                            <div className="card-wrap">
                                <div className="print-card">
                                    {/* LEFT: Logo + Name */}
                                    <div className="card-left">
                                        <div className="card-logo-circle">
                                            <img src="/GlossCut.png" alt="GlossCut" />
                                        </div>
                                        <div className="card-brand-label">GlossCut Partner</div>
                                        <div className="card-shop-name">{cleanShopName}</div>
                                        <div className="card-subtitle">Self Check-in &amp; Booking</div>
                                        {/* Contact Info */}
                                        <div className="card-features">
                                            <div className="card-feature">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                <span className="card-feature-normal">support@glosscut.com</span>
                                            </div>
                                            <div className="card-feature">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                                                <span className="card-feature-normal">@gloss_cut</span>
                                            </div>
                                            <div className="card-feature">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                <span className="card-feature-normal">8799866811</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* RIGHT: QR Code */}
                                    <div className="card-right">
                                        <div className="card-qr-wrap">
                                            <QRCodeSVG
                                                value={qrData}
                                                size={195}
                                                level="H"
                                                includeMargin={false}
                                                imageSettings={{
                                                    src: "/GlossCut.png",
                                                    height: 34,
                                                    width: 34,
                                                    excavate: true,
                                                }}
                                            />
                                            <div className="card-logo-overlay">
                                                <img src="/GlossCut.png" alt="logo" />
                                            </div>
                                        </div>
                                        <div className="card-url">glosscut.com/checkin</div>
                                    </div>
                                    {/* GOLD STRIP */}
                                    <div className="card-gold-strip" />
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QrStandeeScreen;
