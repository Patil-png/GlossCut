import React from 'react';
import { MapPin, Wifi, AlertTriangle } from 'lucide-react';

const LocationError = ({ type, distance, onRetry }) => {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* ==================================================================================
                MOBILE BACKGROUND (Premiere Gradient Design) - Visible on screens < 1024px
            ================================================================================== */}
            <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
                {/* Base Background - Subtle vertical fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

                {/* Top Right - Stronger Brand Green Glow */}
                <div
                    className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply"
                    style={{
                        background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
                    }}
                />

                {/* Bottom Left - Rich Purple/Pink Accent */}
                <div
                    className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply"
                    style={{
                        background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)',
                    }}
                />

                {/* Center Right - Warm Golden Glow for vibrancy */}
                <div
                    className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply"
                    style={{
                        background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)',
                    }}
                />

                {/* Texture Overlay (Noise) */}
                <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                {/* Grid Pattern Overlay for structure */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            </div>

            {/* ==================================================================================
                DESKTOP BACKGROUND - Visible on screens >= 1024px
            ================================================================================== */}
            <div className="hidden lg:block absolute inset-0 w-full h-full z-0">
                {/* Base Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

                {/* Top Right - Brand Green Glow */}
                <div
                    className="absolute top-[-5%] right-[-15%] w-[600px] h-[600px] rounded-full blur-[80px] opacity-30 mix-blend-multiply"
                    style={{
                        background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
                    }}
                />

                {/* Bottom Left - Purple/Pink Accent */}
                <div
                    className="absolute bottom-[5%] left-[-15%] w-[500px] h-[500px] rounded-full blur-[90px] opacity-25 mix-blend-multiply"
                    style={{
                        background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)',
                    }}
                />

                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24 lg:pt-12 text-gray-900">
                <div className="bg-white/80 lg:backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center shadow-xl border-2 border-gray-200">
                    <div className="flex justify-center mb-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${type === 'permission'
                                ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 shadow-red-500/20'
                                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-amber-500/20'
                            }`}>
                            {type === 'permission' ? (
                                <MapPin size={48} className="text-red-600" />
                            ) : (
                                <AlertTriangle size={48} className="text-amber-600" />
                            )}
                        </div>
                    </div>

                    <h2 className={`text-3xl font-bold mb-4 ${type === 'permission'
                            ? 'bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent'
                            : 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent'
                        }`}>
                        {type === 'permission' ? 'Location Access Needed' : 'Location Not Verified'}
                    </h2>

                    <p className="text-gray-600 mb-8 leading-relaxed text-base">
                        {type === 'permission'
                            ? "We need your location to verify you are at the shop. Please allow location access in your browser settings."
                            : type === 'drift'
                                ? `We can't confirm your location. You seem to be ${Math.round(distance)}m away (Limit: 40m).`
                                : "You are too far from the shop to join the walk-in line."
                        }
                    </p>

                    {type === 'drift' && (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5 mb-8 text-left flex items-start shadow-lg shadow-blue-200/50">
                            <Wifi size={22} className="text-blue-600 mt-1 flex-shrink-0 mr-3" />
                            <div className="text-sm text-gray-700">
                                <span className="font-bold text-blue-600 block mb-2">Tip for better accuracy:</span>
                                Turn on Wi-Fi (even if not connected) and step closer to the entrance or a window.
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onRetry}
                        className="w-full bg-gradient-to-r from-[#4C763B] via-[#22C55E] to-[#4C763B] hover:shadow-xl hover:shadow-[#4C763B]/30 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#4C763B]/20"
                    >
                        {type === 'permission' ? 'Try Again' : 'Refresh Location'}
                    </button>

                    <div className="mt-5 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full inline-block">
                        If this persists, ask the barber to add you manually.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationError;
