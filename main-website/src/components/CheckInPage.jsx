import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchShopDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopId]);

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
            if (res.ok) {
                setBookingId(data.bookingId);
                setStep('success');
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
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-3 text-blue-500" />
                <span className="text-lg">Locating shop...</span>
            </div>
        );
    }

    if (step === 'location' || errorType) {
        if (errorType) {
            return <LocationError type={errorType} distance={distance} onRetry={verifyLocation} />;
        }
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <MapPin size={32} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Verifying Location...</h2>
                <p className="text-gray-400 text-center max-w-xs">
                    Please wait while we confirm you are at the shop.
                </p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={48} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-center">Request Sent!</h2>
                <p className="text-gray-400 text-center max-w-md mb-8">
                    Sit tight! The barber has received your request. You'll be added to the queue once confirmed.
                </p>
                <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-800">
                    <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Status</div>
                    <div className="flex items-center text-yellow-500 font-semibold">
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Waiting for barber...
                    </div>
                </div>
                {bookingId && (
                    <div className="mt-4 text-xs text-gray-600">
                        Request ID: #{bookingId.slice(-6).toUpperCase()}
                    </div>
                )}
            </div>
        );
    }

    // FORM STEP
    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
            <div className="max-w-md mx-auto">
                <header className="mb-8 pt-4">
                    <h1 className="text-3xl font-bold mb-2">{shop?.name || 'Barber Shop'}</h1>
                    <div className="flex items-center text-green-400 text-sm bg-green-400/10 px-3 py-1 rounded-full w-fit">
                        <CheckCircle size={14} className="mr-2" />
                        Location Verified
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <span className="bg-blue-600 text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3">1</span>
                            Your Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Rahul Sharma"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="Ex: 9876543210"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <span className="bg-blue-600 text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3">2</span>
                            Select Professional
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                onClick={() => setFormData({ ...formData, selectedBarberId: null })}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${!formData.selectedBarberId
                                    ? 'bg-blue-600/20 border-blue-500'
                                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <div className="font-medium text-sm">Any Available</div>
                            </div>

                            {shop?.professionals?.map(pro => (
                                <div
                                    key={pro.id}
                                    onClick={() => setFormData({ ...formData, selectedBarberId: pro.id })}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${formData.selectedBarberId === pro.id
                                        ? 'bg-blue-600/20 border-blue-500'
                                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                                        }`}
                                >
                                    {pro.image ? (
                                        <img src={pro.image.startsWith('http') ? pro.image : `${API_URL}${pro.image}`} alt={pro.name} className="w-12 h-12 rounded-full mb-2 object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                            <span className="text-lg font-bold text-gray-500">{pro.name?.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div className="font-medium text-sm truncate w-full">{pro.name}</div>
                                    <div className="text-xs text-gray-500">{pro.role}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <span className="bg-blue-600 text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3">3</span>
                            Select Services
                        </h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {shop?.services
                                ?.filter(service => {
                                    // 1. If "Any Available" is selected, show ALL services
                                    if (!formData.selectedBarberId) return true;

                                    // 2. Generic Services (no ID or empty string) - Show to everyone
                                    if (!service.barberId || service.barberId === "") return true;

                                    const serviceBarberId = typeof service.barberId === 'object' ? service.barberId.toString() : service.barberId;

                                    // 3. Exact Match - Service belongs to the selected barber
                                    if (serviceBarberId === formData.selectedBarberId) return true;

                                    return false;
                                })
                                .map(service => (
                                    <div
                                        key={service.id || service._id}
                                        onClick={() => toggleService(service.id || service._id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.serviceIds.includes(service.id || service._id)
                                            ? 'bg-blue-600/20 border-blue-500'
                                            : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <Scissors size={18} className={`mr-3 ${formData.serviceIds.includes(service.id || service._id) ? 'text-blue-400' : 'text-gray-500'}`} />
                                            <div>
                                                <div className="font-medium">{service.name}</div>
                                                <div className="text-xs text-gray-400">{service.time || '15 min'}</div>
                                            </div>
                                        </div>
                                        <div className="font-semibold text-gray-300">₹{service.price}</div>
                                    </div>
                                ))}
                        </div>
                        {shop?.services?.length === 0 && (
                            <div className="text-center text-gray-500 py-4">No services available</div>
                        )}
                    </section>

                    <button
                        type="submit"
                        disabled={step === 'submitting'}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {step === 'submitting' ? (
                            <>
                                <Loader2 className="animate-spin mr-2" /> Sending Request...
                            </>
                        ) : 'Request to Join Line'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CheckInPage;
