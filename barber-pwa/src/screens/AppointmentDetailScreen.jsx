import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Clock, User, DollarSign, Calendar, RefreshCw,
    Phone, MessageSquare, Briefcase, CheckCircle, XCircle,
    MapPin, ShieldCheck, ChevronRight, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AppointmentDetailScreen = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { user } = useAuth();

    const [appointment, setAppointment] = useState(location.state?.appointment || null);
    const [loading, setLoading] = useState(!location.state?.appointment);
    const [refreshing, setRefreshing] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');

    // Add Services Modal States
    const [showAddServicesModal, setShowAddServicesModal] = useState(false);
    const [availableServices, setAvailableServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [isAddingServices, setIsAddingServices] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        if (id) {
            fetchAppointmentDetails();
        }
    }, [id]);

    const fetchAppointmentDetails = async () => {
        if (!id) return;
        setRefreshing(true);
        try {
            const res = await api.get(`/api/booking/${id}`);
            setAppointment(res.data);
        } catch (err) {
            console.error("Failed to fetch appointment details", err);
            showToast('Failed to refresh details', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleContact = (type) => {
        const customerPhone = appointment.isOfflineBooking ? appointment.customerPhone : appointment.userId?.phone;
        if (!customerPhone) return showToast("Phone not available", "error");

        if (type === 'call') {
            window.location.href = `tel:${customerPhone}`;
        } else if (type === 'whatsapp') {
            window.open(`https://wa.me/${customerPhone}`, '_blank');
        }
    };

    const handleStartPress = async () => {
        if (appointment.isOfflineBooking) {
            try {
                const response = await api.post(`/api/booking/verify-otp-and-start/${appointment._id}`, { otp: '000000' });
                if (response.status === 200) {
                    showToast('Appointment started!', 'success');
                    fetchAppointmentDetails();
                }
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to start', 'error');
            }
        } else {
            setShowOtpInput(true);
            setOtp(['', '', '', '', '', '']);
            setOtpError('');
        }
    };

    const verifyOtpAndStart = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setOtpError('Please enter 6 digits');
            return;
        }

        try {
            const response = await api.post(`/api/booking/verify-otp-and-start/${appointment._id}`, { otp: otpString });
            if (response.status === 200) {
                showToast('Appointment started!', 'success');
                setShowOtpInput(false);
                fetchAppointmentDetails();
            }
        } catch (error) {
            setOtpError(error.response?.data?.message || 'Verification failed');
        }
    };

    const handleCompletePress = async () => {
        if (!window.confirm("Mark this appointment as completed?")) return;

        try {
            const response = await api.put(`/api/booking/complete/${appointment._id}`, {});
            if (response.status === 200) {
                showToast('Appointment completed!', 'success');
                fetchAppointmentDetails();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to complete', 'error');
        }
    };


    const fetchAvailableServices = async () => {
        try {
            const response = await api.get('/api/barber-card/my-card');
            if (response.data && response.data.services) {
                const currentServiceIds = appointment.services.map(s => s.id);
                const newServices = response.data.services.filter(
                    service => !currentServiceIds.includes(service._id) && !currentServiceIds.includes(service.id)
                );
                setAvailableServices(newServices);
                if (newServices.length === 0) {
                    showToast('Customer has all available services', 'info');
                }
            }
        } catch (error) {
            showToast('Failed to load services', 'error');
        }
    };

    const handleOpenAddServices = () => {
        setSelectedServices([]);
        setAvailableServices([]);
        setShowAddServicesModal(true);
        fetchAvailableServices();
    };

    const toggleServiceSelection = (service) => {
        const isSelected = selectedServices.some(s => (s._id || s.id) === (service._id || service.id));
        if (isSelected) {
            setSelectedServices(selectedServices.filter(s => (s._id || s.id) !== (service._id || service.id)));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleAddServices = async () => {
        if (selectedServices.length === 0) return;
        setIsAddingServices(true);
        try {
            await api.put(`/api/booking/${appointment._id}/add-services`, { services: selectedServices });
            showToast(`Added ${selectedServices.length} service(s)`, 'success');
            setShowAddServicesModal(false);
            fetchAppointmentDetails();
        } catch (error) {
            showToast(error.response?.data?.msg || 'Failed to add services', 'error');
        } finally {
            setIsAddingServices(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return { text: '#2563EB', bg: '#EFF6FF', label: 'Confirmed' };
            case 'started': return { text: '#D97706', bg: '#FFFBEB', label: 'In Progress' };
            case 'completed': return { text: '#059669', bg: '#ECFDF5', label: 'Completed' };
            case 'cancelled': return { text: '#DC2626', bg: '#FEF2F2', label: 'Cancelled' };
            case 'pending': return { text: '#D97706', bg: '#FFFBEB', label: 'Pending' };
            default: return { text: '#6B7280', bg: '#F3F4F6', label: status };
        }
    };

    const getPaymentStyle = (status) => {
        switch (status) {
            case 'completed': return { text: '#059669', bg: '#ECFDF5', icon: <CheckCircle size={14} /> };
            case 'pending': return { text: '#DC2626', bg: '#FEF2F2', icon: <XCircle size={14} /> };
            default: return { text: '#6B7280', bg: '#F3F4F6', icon: null };
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    if (!appointment) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8F9FA]">
            <p className="text-gray-500 mb-4">Appointment not found</p>
            <button onClick={() => navigate(-1)} className="text-indigo-600 font-bold">Go Back</button>
        </div>
    );

    const statusStyle = getStatusStyle(appointment.status);
    const paymentStyle = getPaymentStyle(appointment.paymentStatus);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24">
            {/* TOAST */}
            <AnimatePresence>
                {toast.visible && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className={`fixed top-4 left-0 right-0 z-[100] flex justify-center px-4`}
                    >
                        <div className={`px-4 py-2 rounded-full shadow-lg text-white text-sm font-bold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                            {toast.message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-[#F8F9FA]/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                    <ArrowLeft size={20} className="text-[#1C1C1E]" />
                </button>
                <h1 className="text-lg font-bold text-[#1C1C1E]">Booking Details</h1>
                <button onClick={fetchAppointmentDetails} className="p-2 bg-gray-100 rounded-xl active:scale-95 transition-transform">
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="max-w-[450px] mx-auto p-4 space-y-5">
                {/* STATUS BANNER */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.text }} />
                        {statusStyle.label}
                    </div>
                    <span className="text-xs font-bold text-gray-400">ID: #{appointment._id.slice(-6).toUpperCase()}</span>
                </div>

                {/* CUSTOMER CARD */}
                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
                    <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <User size={28} className="text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#1C1C1E]">
                                    {appointment.isOfflineBooking ? appointment.customerName : (appointment.userId?.name || 'Customer')}
                                </h3>
                                <div className="flex items-center gap-1 text-green-600">
                                    <ShieldCheck size={12} />
                                    <span className="text-[11px] font-bold uppercase">Verified Customer</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleContact('call')}
                                disabled={appointment.status === 'completed'}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${appointment.status === 'completed'
                                        ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                                        : 'bg-green-50 text-green-600 active:scale-95'
                                    }`}
                            >
                                <Phone size={20} />
                            </button>
                            {!appointment.isOfflineBooking && (
                                <button
                                    onClick={() => navigate(`/chat/${appointment.userId?._id}`, { state: { recipientName: appointment.userId?.name } })}
                                    disabled={appointment.status === 'completed'}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${appointment.status === 'completed'
                                            ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                                            : 'bg-indigo-50 text-indigo-600 active:scale-95'
                                        }`}
                                >
                                    <MessageSquare size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-50 mx-5" />

                    <div className="bg-gray-50 p-5 grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center">
                            <Calendar size={16} className="text-gray-400 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                            <span className="text-sm font-bold text-gray-900">{format(new Date(appointment.date), 'dd MMM')}</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-gray-200">
                            <Clock size={16} className="text-gray-400 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Time</span>
                            <span className="text-sm font-bold text-gray-900">{appointment.time}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Briefcase size={16} className="text-gray-400 mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Type</span>
                            <span className="text-sm font-bold text-gray-900">{appointment.appointmentType || 'Standard'}</span>
                        </div>
                    </div>
                </div>

                {/* SERVICE RECEIPT */}
                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
                    <div className="p-5 flex items-center justify-between border-b border-gray-50">
                        <h3 className="text-[15px] font-black text-[#1C1C1E] uppercase tracking-wide">Service Details</h3>
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: paymentStyle.bg, color: paymentStyle.text }}>
                            {paymentStyle.icon}
                            {appointment.paymentStatus?.toUpperCase()}
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        {appointment.services?.map((svc, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-bold text-gray-700">{svc.name}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">₹{parseFloat(svc.price).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="relative h-4 overflow-hidden mb-[-1px]">
                        <div className="absolute top-0 left-0 right-0 border-t-2 border-dashed border-gray-200" />
                        <div className="absolute left-[-10px] w-5 h-5 rounded-full bg-[#F8F9FA]" />
                        <div className="absolute right-[-10px] w-5 h-5 rounded-full bg-[#F8F9FA]" />
                    </div>

                    <div className="p-5 bg-indigo-50/30 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                        <span className="text-2xl font-black text-indigo-600">₹{appointment.totalPrice?.toFixed(2)}</span>
                    </div>
                </div>

                {/* OTP VERIFICATION / ACTIONS */}
                <div className="space-y-4">
                    {showOtpInput ? (
                        <div className="bg-white rounded-[24px] p-6 shadow-xl border-2 border-indigo-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowOtpInput(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <h3 className="text-xl font-black text-[#1C1C1E] mb-1">Verify Customer</h3>
                            <p className="text-sm text-gray-500 font-medium mb-6">Enter the 6-digit OTP provided by the customer.</p>

                            <div className="flex justify-between gap-2 mb-6">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="tel"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.length <= 1) {
                                                const newOtp = [...otp];
                                                newOtp[idx] = val;
                                                setOtp(newOtp);
                                                if (val && idx < 5) document.getElementById(`otp-${idx + 1}`).focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                                                document.getElementById(`otp-${idx - 1}`).focus();
                                            }
                                        }}
                                        className="w-full h-14 bg-gray-50 border-2 border-gray-100 rounded-xl text-center text-2xl font-black text-indigo-600 focus:border-indigo-500 focus:outline-none transition-colors"
                                    />
                                ))}
                            </div>

                            {otpError && <p className="text-red-500 text-xs font-bold mb-4 flex items-center gap-1"><XCircle size={14} /> {otpError}</p>}

                            <button
                                onClick={verifyOtpAndStart}
                                className="w-full h-14 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
                            >
                                Verify & Start Appointment
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {appointment.status === 'confirmed' && (
                                <button
                                    onClick={handleStartPress}
                                    className="w-full h-16 bg-[#1C1C1E] text-white font-black rounded-[20px] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent" />
                                    <CheckCircle size={24} className="text-indigo-400" />
                                    START SERVICE
                                </button>
                            )}

                            {appointment.status === 'started' && (
                                <>
                                    <button
                                        onClick={handleOpenAddServices}
                                        className="w-full h-14 bg-indigo-50 text-indigo-600 border border-indigo-100 font-black rounded-[20px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                    >
                                        <Plus size={20} /> ADD SERVICES
                                    </button>
                                    <button
                                        onClick={handleCompletePress}
                                        className="w-full h-16 bg-green-600 text-white font-black rounded-[20px] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        MARK AS COMPLETED
                                    </button>
                                </>
                            )}

                        </div>
                    )}
                </div>
            </div>

            {/* ADD SERVICES MODAL */}
            <AnimatePresence>
                {showAddServicesModal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-white w-full max-w-[450px] h-[80vh] rounded-t-[30px] overflow-hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-[#1C1C1E]">Add Services</h3>
                                    <p className="text-xs text-gray-500 font-medium">Select additional items to add to bill</p>
                                </div>
                                <button onClick={() => setShowAddServicesModal(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {availableServices.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Briefcase size={40} className="mb-4 opacity-20" />
                                        <p className="font-bold">No services available to add</p>
                                    </div>
                                ) : (
                                    availableServices.map(svc => {
                                        const isSelected = selectedServices.some(s => (s._id || s.id) === (svc._id || svc.id));
                                        return (
                                            <div
                                                key={svc._id || svc.id}
                                                onClick={() => toggleServiceSelection(svc)}
                                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900">{svc.name}</h4>
                                                        <span className="text-xs text-indigo-600 font-black">₹{svc.price}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-bold text-gray-400">{svc.time} min</div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            <div className="p-5 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={handleAddServices}
                                    disabled={selectedServices.length === 0 || isAddingServices}
                                    className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl shadow-lg disabled:opacity-50"
                                >
                                    {isAddingServices ? 'Updating...' : `Add ${selectedServices.length} Services (+₹${selectedServices.reduce((acc, s) => acc + parseFloat(s.price), 0)})`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppointmentDetailScreen;
