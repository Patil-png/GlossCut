import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Scissors, CheckCircle, Loader2, User } from 'lucide-react';
import LocationError from './LocationError.jsx';

// Environment variable handling for CRA
const API_URL = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

const CheckInPage = () => {
    const { shopId } = useParams();

    const [step, setStep] = useState('loading'); // loading, location, form, submitting, success
    const [shop, setShop] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', serviceIds: [], selectedBarberId: null });
    const [errorType, setErrorType] = useState(null);
    const [distance, setDistance] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [trackingId, setTrackingId] = useState(null);
    const [selectedGender, setSelectedGender] = useState('male'); // male, female, unisex
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchShopDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopId]);

    useEffect(() => {
        let interval;
        if ((step === 'success' || step === 'confirmed') && bookingId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_URL}/api/offlinetools/booking-status/${bookingId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === 'confirmed') {
                            setStep('confirmed');
                        } else if (data.status === 'cancelled' || data.status === 'rejected') {
                            setStep('cancelled');
                            clearInterval(interval);
                        } else if (data.status === 'completed' || data.status === 'started') {
                            // Appointment is in progress or done - redirect to home
                            clearInterval(interval);
                            setTimeout(() => {
                                window.location.href = '/';
                            }, 2000); // Give user 2 seconds to see current screen
                        }
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, bookingId]);

    // Check booking status when user returns to this page (e.g., from Track page)
    useEffect(() => {
        const checkStatusOnReturn = async () => {
            if (bookingId && (step === 'success' || step === 'confirmed')) {
                try {
                    const res = await fetch(`${API_URL}/api/offlinetools/booking-status/${bookingId}`);
                    if (res.ok) {
                        const data = await res.json();
                        console.log('📍 Status check on page return:', data.status);
                        if (data.status === 'completed' || data.status === 'started') {
                            // Redirect immediately if appointment is done
                            window.location.href = '/';
                        } else if (data.status === 'cancelled' || data.status === 'rejected') {
                            setStep('cancelled');
                        } else if (data.status === 'confirmed' && step !== 'confirmed') {
                            setStep('confirmed');
                        }
                    }
                } catch (err) {
                    console.error("Status check error:", err);
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkStatusOnReturn();
            }
        };

        // Check status when component mounts or page becomes visible
        checkStatusOnReturn();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [bookingId, step]);


    const fetchShopDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/api/offlinetools/shop-details/${shopId}`);
            if (!res.ok) throw new Error('Shop not found');
            const data = await res.json();
            setShop(data);
            verifyLocation();
        } catch (err) {
            console.error(err);
            // Determine if network error or 404
            setStep('error');
        }
    };

    const verifyLocation = () => {
        setStep('location');
        setErrorType(null);

        if (!navigator.geolocation) {
            setErrorType('permission');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`${API_URL}/api/offlinetools/verify-location`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shopId, latitude, longitude })
                    });
                    const data = await res.json();

                    if (data.allowed) {
                        setStep('form');
                    } else {
                        console.log("Distance failure:", data.distance);
                        setDistance(data.distance);
                        // If close but drifting (e.g. within 100m) show drift message, else blocking
                        // Plan said > 40m is Scenario C (Drift) or B (Cheater)
                        // Let's treat < 100m as drift/interference
                        if (data.distance < 100) {
                            setErrorType('drift');
                        } else {
                            setErrorType('distance');
                        }
                    }
                } catch (err) {
                    console.error("Verification API Error", err);
                    setErrorType('drift'); // Assume network issue or server error matches drift UI
                }
            },
            (err) => {
                console.error("Geolocation Error", err);
                setErrorType('permission');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const toggleService = (id) => {
        setFormData(prev => {
            const exists = prev.serviceIds.includes(id);
            if (exists) {
                return { ...prev, serviceIds: prev.serviceIds.filter(s => s !== id) };
            } else {
                return { ...prev, serviceIds: [...prev.serviceIds, id] };
            }
        });
    };

    const getCatMeta = (cat) => {
        const metas = {
            'Haircut': { emoji: '✂️', color: '#6366F1' },
            'Shave': { emoji: '🪒', color: '#8B5CF6' },
            'Facial': { emoji: '✨', color: '#EC4899' },
            'Massage': { emoji: '💆', color: '#10B981' },
            'Coloring': { emoji: '🎨', color: '#F59E0B' },
            'Beard': { emoji: '🧔', color: '#3B82F6' },
            'Treatment': { emoji: '🏥', color: '#EF4444' },
            'General': { emoji: '💈', color: '#6B7280' }
        };
        return metas[cat] || metas['General'];
    };

    // Filter services based on selected gender and barber
    const filteredServicesByGender = (shop?.services || []).filter(service => {
        // Gender filter
        const serviceGender = service.gender?.toLowerCase() || 'unisex';
        if (selectedGender !== 'unisex' && serviceGender !== 'unisex' && serviceGender !== selectedGender) return false;

        // Barber filter
        if (!formData.selectedBarberId) return true;
        if (!service.barberId || service.barberId === "") return true;
        const serviceBarberId = typeof service.barberId === 'object' ? service.barberId.toString() : service.barberId;
        return serviceBarberId === formData.selectedBarberId;
    });

    // Get categories available for current gender selection
    const availableCategories = useMemo(() => {
        const cats = new Set();
        filteredServicesByGender.forEach(s => {
            if (s.category && s.category.trim() !== '' && s.category !== 'General') {
                cats.add(s.category);
            }
        });

        const sorted = Array.from(cats).sort((a, b) => {
            const order = shop?.categoryOrder || [];
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        return ['All', ...sorted];
    }, [filteredServicesByGender, shop?.categoryOrder]);

    const finalFilteredServices = filteredServicesByGender.filter(service => {
        if (selectedCategory === 'All') return true;
        return service.category === selectedCategory;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.serviceIds.length === 0) {
            alert("Please select at least one service.");
            return;
        }

        setStep('submitting');
        try {
            const res = await fetch(`${API_URL}/api/offlinetools/request-join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId,
                    name: formData.name,
                    phone: formData.phone,
                    serviceIds: formData.serviceIds,
                    selectedBarberId: formData.selectedBarberId
                })
            });

            const data = await res.json();
            console.log('📦 Booking Response:', data); // Debug log
            if (res.ok) {
                setBookingId(data.bookingId);
                setTrackingId(data.trackingId);
                setStep('success');

                // Record as a QR Lead automatically
                try {
                    const ua = navigator.userAgent;
                    const deviceType = /mobile/i.test(ua) ? 'Mobile' : (/iPad|tablet/i.test(ua) ? 'Tablet' : 'Desktop');

                    fetch(`${API_URL}/api/qr/track-visit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            salon_id: shopId,
                            device_type: deviceType,
                            customer_name: formData.name,
                            customer_phone: formData.phone
                        })
                    }).then(() => {
                        localStorage.setItem('qr_lead_captured', 'true');
                    });
                } catch (qrErr) {
                    console.error("Silent QR lead capture failed", qrErr);
                }
            } else {
                alert(data.msg || "Failed to join queue");
                setStep('form');
            }
        } catch (err) {
            alert("Network error. Please try again.");
            setStep('form');
        }
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[80px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                <div className="relative z-10 min-h-screen flex items-center justify-center text-gray-900">
                    <Loader2 className="animate-spin mr-3 text-[#4C763B]" size={32} />
                    <span className="text-xl font-medium">Locating shop...</span>
                </div>
            </div>
        );
    }

    if (step === 'location' || errorType) {
        if (errorType) {
            return <LocationError type={errorType} distance={distance} onRetry={verifyLocation} />;
        }
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[80px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-gray-900 p-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#4C763B]/20 to-[#22C55E]/20 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-lg">
                        <MapPin size={36} className="text-[#4C763B]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verifying Location...</h2>
                    <p className="text-gray-600 text-center max-w-xs">
                        Please wait while we confirm you are at the shop.
                    </p>
                </div>
            </div>
        );
    }


    if (step === 'success') {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[80px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #22C55E 0%, #10b981 100%)' }} />
                <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />

                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-gray-900 p-6">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/20 animate-pulse">
                        <CheckCircle size={56} className="text-green-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-3 text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Request Sent!</h2>
                    <p className="text-gray-600 text-center max-w-md mb-10 text-lg">
                        Sit tight! The barber has received your request. You'll be added to the queue once confirmed.
                    </p>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 w-full max-w-sm border-2 border-gray-200 shadow-2xl">
                        <div className="text-sm text-gray-500 uppercase tracking-wider mb-2 font-semibold">Status</div>
                        <div className="flex items-center text-yellow-600 font-bold text-lg">
                            <Loader2 size={22} className="animate-spin mr-3" />
                            Waiting for barber...
                        </div>
                    </div>

                    {/* Always show tracking card */}
                    <div className="mt-8 w-full max-w-sm">
                        <div className="bg-gradient-to-br from-[#4C763B]/10 to-[#22C55E]/10 rounded-2xl p-6 border-2 border-[#4C763B]/20 shadow-lg">
                            <div className="text-xs uppercase tracking-widest text-gray-600 mb-2 font-bold">Queue Tracking ID</div>
                            {trackingId ? (
                                <>
                                    <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-inner mb-4">
                                        <span className="text-3xl font-black text-[#4C763B] tracking-wider font-mono">#{trackingId}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 text-center mb-4">Save this ID to track your queue position anytime</p>
                                    <a
                                        href={`/track-queue/${trackingId}`}
                                        className="block w-full bg-gradient-to-r from-[#4C763B] to-[#22C55E] text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl transition-all duration-300 text-center hover:scale-105"
                                    >
                                        Track Your Queue Position →
                                    </a>
                                </>
                            ) : (
                                <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-inner mb-4">
                                    <Loader2 size={24} className="animate-spin text-[#4C763B] mr-2" />
                                    <span className="text-sm text-gray-600">Generating tracking ID...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'confirmed') {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[90px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #3b82f6 0%, #8b5cf6 100%)' }} />

                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-gray-900 p-6">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#4C763B]/20 to-[#22C55E]/20 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-2xl shadow-[#4C763B]/30">
                        <Scissors size={56} className="text-[#4C763B]" />
                    </div>
                    <h2 className="text-4xl font-bold mb-3 text-center bg-gradient-to-r from-[#4C763B] to-[#22C55E] bg-clip-text text-transparent">You're In Line!</h2>
                    <p className="text-gray-600 text-center max-w-md mb-10 text-lg">
                        Your booking has been confirmed by the barber. Please stay nearby.
                    </p>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 w-full max-w-sm border-2 border-green-200 shadow-2xl shadow-green-200/50 text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Confirmed</div>
                        <div className="text-base text-gray-600">The barber will call you shortly.</div>
                    </div>

                    {/* Tracking ID Card - Also show on confirmed screen */}
                    {trackingId && (
                        <div className="mt-8 w-full max-w-sm">
                            <div className="bg-gradient-to-br from-[#4C763B]/10 to-[#22C55E]/10 rounded-2xl p-6 border-2 border-[#4C763B]/20 shadow-lg">
                                <div className="text-xs uppercase tracking-widest text-gray-600 mb-2 font-bold">Queue Tracking ID</div>
                                <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-inner mb-4">
                                    <span className="text-3xl font-black text-[#4C763B] tracking-wider font-mono">#{trackingId}</span>
                                </div>
                                <p className="text-xs text-gray-600 text-center mb-4">Track your live queue position anytime</p>
                                <a
                                    href={`/track-queue/${trackingId}`}
                                    className="block w-full bg-gradient-to-r from-[#4C763B] to-[#22C55E] text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl transition-all duration-300 text-center hover:scale-105"
                                >
                                    Track Your Queue Position →
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (step === 'cancelled') {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[80px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #ef4444 0%, #dc2626 100%)' }} />
                <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f97316 0%, #ea580c 100%)' }} />

                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-gray-900 p-6">
                    <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-red-500/20">
                        <User size={56} className="text-red-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-3 text-center text-red-600">Request Declined</h2>
                    <p className="text-gray-600 text-center max-w-md mb-10 text-lg">
                        Sorry, the barber could not accept your request at this time.
                    </p>
                    <button
                        onClick={() => setStep('form')}
                        className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-bold py-4 px-10 rounded-2xl transition-all hover:shadow-xl shadow-lg active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // FORM STEP
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
            <div className="relative z-10 min-h-screen text-gray-900 p-4 md:p-8 pt-24 lg:pt-12">
                <div className="max-w-md mx-auto">
                    {/* Header - Mobile: Simple, Desktop: Gradient */}
                    <header className="mb-8 lg:mb-10 text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 lg:bg-gradient-to-r lg:from-[#4C763B] lg:via-[#22C55E] lg:to-[#4C763B] lg:bg-clip-text lg:text-transparent">
                            {shop?.name || 'Barber Shop'}
                        </h1>
                        <div className="inline-flex items-center text-green-600 text-sm bg-green-50 lg:bg-green-50 px-4 py-2 rounded-full border border-green-200 shadow-sm">
                            <CheckCircle size={16} className="mr-2" />
                            Location Verified
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                        {/* Your Details - Mobile: White card, Desktop: Glassmorphism */}
                        <section className="bg-white lg:bg-white/80 lg:backdrop-blur-sm p-5 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-200 shadow-sm lg:shadow-lg lg:shadow-gray-200/50">
                            <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-5 flex items-center text-gray-900">
                                <span className="bg-gradient-to-br from-[#4C763B] to-[#22C55E] text-white text-sm w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center mr-3 shadow-md">1</span>
                                Your Details
                            </h3>
                            <div className="space-y-3 lg:space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g., Rahul Sharma"
                                        className="w-full bg-white border-2 border-gray-200 rounded-xl lg:rounded-2xl px-4 py-3 lg:py-3.5 text-gray-900 focus:border-[#4C763B] focus:ring-2 focus:ring-[#4C763B]/20 focus:outline-none transition-all placeholder:text-gray-400"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="e.g., 9876543210"
                                        className="w-full bg-white border-2 border-gray-200 rounded-xl lg:rounded-2xl px-4 py-3 lg:py-3.5 text-gray-900 focus:border-[#4C763B] focus:ring-2 focus:ring-[#4C763B]/20 focus:outline-none transition-all placeholder:text-gray-400"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed italic mt-2">
                                    * By providing your details, you agree that we may use this information to send you relevant advertisements and marketing updates Related to GlossCut.
                                </p>
                            </div>
                        </section>

                        {/* Select Professional */}
                        <section className="bg-white lg:bg-white/80 lg:backdrop-blur-sm p-5 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-200 shadow-sm lg:shadow-lg lg:shadow-gray-200/50">
                            <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-5 flex items-center text-gray-900">
                                <span className="bg-gradient-to-br from-[#4C763B] to-[#22C55E] text-white text-sm w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center mr-3 shadow-md">2</span>
                                Select Professional
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    onClick={() => setFormData({ ...formData, selectedBarberId: null })}
                                    className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center hover:shadow-md ${!formData.selectedBarberId
                                        ? 'bg-gradient-to-br from-[#4C763B]/10 to-[#22C55E]/10 border-[#4C763B] shadow-lg shadow-[#4C763B]/20'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-2 shadow-sm">
                                        <User size={20} className="text-gray-500 lg:w-6 lg:h-6" />
                                    </div>
                                    <div className="font-semibold text-xs lg:text-sm text-gray-900">Any Available</div>
                                </div>

                                {shop?.professionals?.map(pro => (
                                    <div
                                        key={pro.id}
                                        onClick={() => setFormData({ ...formData, selectedBarberId: pro.id })}
                                        className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center hover:shadow-md ${formData.selectedBarberId === pro.id
                                            ? 'bg-gradient-to-br from-[#4C763B]/10 to-[#22C55E]/10 border-[#4C763B] shadow-lg shadow-[#4C763B]/20'
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {pro.image && pro.image.trim() !== '' ? (
                                            <img
                                                src={pro.image.startsWith('http') ? pro.image : `${API_URL}${pro.image}`}
                                                alt={pro.name}
                                                className="w-12 h-12 lg:w-14 lg:h-14 rounded-full mb-2 object-cover shadow-md border-2 border-white"
                                                onError={(e) => {
                                                    // Fallback to gradient avatar on image load error
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-[#4C763B] to-[#22C55E] flex items-center justify-center mb-2 shadow-md"
                                            style={{ display: (pro.image && pro.image.trim() !== '') ? 'none' : 'flex' }}
                                        >
                                            <span className="text-base lg:text-lg font-bold text-white">{pro.name?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                        <div className="font-semibold text-xs lg:text-sm truncate w-full text-gray-900">{pro.name}</div>
                                        <div className="text-xs text-gray-500">{pro.role}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Select Services */}
                        <section className="bg-white lg:bg-white/80 lg:backdrop-blur-sm p-5 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-200 shadow-sm lg:shadow-lg lg:shadow-gray-200/50">
                            <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-5 flex items-center text-gray-900">
                                <span className="bg-gradient-to-br from-[#4C763B] to-[#22C55E] text-white text-sm w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center mr-3 shadow-md">3</span>
                                Select Services
                            </h3>

                            {/* Gender Filter */}
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6 shadow-inner">
                                {['male', 'female', 'unisex'].map(gender => (
                                    <button
                                        key={gender}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGender(gender);
                                            setSelectedCategory('All');
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${selectedGender === gender
                                            ? 'bg-white text-gray-900 shadow-md'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {gender === 'male' ? '🧔 Men' : gender === 'female' ? '👩 Women' : '👫 Unisex'}
                                    </button>
                                ))}
                            </div>

                            {/* Category Filter */}
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                                {availableCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 text-xs font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                            ? 'bg-gray-900 border-gray-900 text-white shadow-lg scale-105'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {cat !== 'All' && <span>{getCatMeta(cat).emoji}</span>}
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {finalFilteredServices.map(service => (
                                    <div
                                        key={service.id || service._id}
                                        onClick={() => toggleService(service.id || service._id)}
                                        className={`group flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${formData.serviceIds.includes(service.id || service._id)
                                            ? 'bg-gradient-to-br from-[#4C763B]/5 to-[#22C55E]/5 border-[#4C763B] shadow-lg shadow-[#4C763B]/10'
                                            : 'bg-white border-gray-50 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4C763B] to-[#22C55E] opacity-0 group-hover:opacity-100 transition-opacity" style={{ display: formData.serviceIds.includes(service.id || service._id) ? 'block' : '' }} />

                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center mr-4 transition-transform duration-300 ${formData.serviceIds.includes(service.id || service._id) ? 'bg-gradient-to-br from-[#4C763B] to-[#22C55E] scale-110 shadow-lg shadow-[#4C763B]/30' : 'bg-gray-50'}`}>
                                                {service.category && service.category !== 'General' ? (
                                                    <span className="text-xl">{getCatMeta(service.category).emoji}</span>
                                                ) : (
                                                    <Scissors size={20} className={formData.serviceIds.includes(service.id || service._id) ? 'text-white' : 'text-gray-400'} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-sm lg:text-base text-gray-900">{service.name}</div>
                                                    {service.gender && service.gender !== 'unisex' && (
                                                        <span className={`text-[8px] uppercase px-1 rounded font-black ${service.gender === 'male' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                                                            {service.gender === 'male' ? 'Men' : 'Women'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{service.time || '15 min'}</div>
                                                    {service.category && service.category !== 'General' && (
                                                        <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 uppercase">{service.category}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-black text-base lg:text-lg bg-gradient-to-r from-[#4C763B] to-[#22C55E] bg-clip-text text-transparent">₹{service.price}</div>
                                    </div>
                                ))}
                                {finalFilteredServices.length === 0 && (
                                    <div className="text-center text-gray-400 py-12">
                                        <div className="text-4xl mb-2">🔎</div>
                                        <p className="text-sm font-medium">No services found in this category.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={step === 'submitting'}
                            className="w-full bg-gradient-to-r from-[#4C763B] via-[#22C55E] to-[#4C763B] hover:shadow-xl lg:hover:shadow-2xl hover:shadow-[#4C763B]/20 lg:hover:shadow-[#4C763B]/30 text-white font-bold py-3.5 lg:py-4 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl shadow-[#4C763B]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base lg:text-lg"
                        >
                            {step === 'submitting' ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} /> Sending Request...
                                </>
                            ) : 'Request to Join Line'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #4C763B, #22C55E);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4C763B;
                }
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-none {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default CheckInPage;
