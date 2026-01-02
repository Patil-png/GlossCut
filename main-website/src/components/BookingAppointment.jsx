import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import QueueStatus from './QueueStatus';
import {
  ArrowLeft, Calendar, Clock, MapPin, Star,
  User, Phone, Mail, MessageSquare,
  CheckCircle2, AlertCircle, Sparkles,
  CreditCard, Shield, ArrowRight, Gift,
  Circle, Crown, Diamond, Users, Zap,
  Check, Scissors
} from 'lucide-react';

const BookingAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const barberData = location.state?.barberData;
  const { isAuthenticated, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [providerDetails, setProviderDetails] = useState(null);

  // Queue checking states
  const [barberAppointments, setBarberAppointments] = useState([]);
  const [overallQueuePosition, setOverallQueuePosition] = useState(null);
  const [isQueueLoading, setIsQueueLoading] = useState(false);

  // Form states
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Appointment types matching customer-app
  const appointmentTypes = [
    {
      id: '1',
      name: 'Free',
      description: 'A free consultation.',
      priceIndicator: 'Free',
      priority: 1,
      icon: Gift,
      color: '#9ca3af'
    },
    {
      id: '2',
      name: 'Basic',
      description: 'A standard appointment.',
      priceIndicator: 'Standard',
      priority: 2,
      icon: Circle,
      color: '#38bdf8'
    },
    {
      id: '3',
      name: 'Premium',
      description: 'Includes additional services & priority.',
      priceIndicator: 'Popular',
      priority: 3,
      icon: Star,
      color: '#fbbf24'
    },
    {
      id: '4',
      name: 'Express',
      description: 'VIP Lounge access, top priority & fastest service!',
      priceIndicator: 'Exclusive',
      priority: 4,
      icon: Crown,
      color: '#FFD700'
    },
  ];

  useEffect(() => {
    if (!barberData) {
      navigate('/all-services-search');
    } else {
      fetchProviderDetails();
    }
  }, [barberData, navigate]);

  // Pre-fill customer info when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        notes: ''
      });
    }
  }, [isAuthenticated, user]);

  const fetchProviderDetails = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/${barberData.id}`);
      setProviderDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch provider details", err);
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAppointmentTypeSelect = (type) => {
    setSelectedAppointmentType(type);
    fetchBarberAppointments(); // Fetch queue data when type is selected
    setCurrentStep(2);
  };

  // Fetch barber appointments for queue checking
  const fetchBarberAppointments = async () => {
    if (!barberData?.owner?._id) return;

    setIsQueueLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/public/barber-queue/${barberData.owner._id}`,
        {
          params: { date: new Date().toISOString().split('T')[0] }, // Today's date
        }
      );
      setBarberAppointments(Array.isArray(response.data) ? response.data : []);
      calculateQueuePosition(response.data || []);
    } catch (error) {
      console.error('Failed to fetch barber appointments:', error);
      setBarberAppointments([]);
      setOverallQueuePosition(null);
    } finally {
      setIsQueueLoading(false);
    }
  };

  // Calculate queue position based on appointment type priority (matching Appointmentcheckpage.jsx logic)
  const calculateQueuePosition = (appointments) => {
    if (!selectedAppointmentType) return;

    // Filter out appointments with "Payment Pending" status
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.status !== "Payment Pending"
    );

    // Sort appointments by priority (matching Appointmentcheckpage.jsx)
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
      // Primary sort: by status (completed/cancelled at the very end)
      const statusAPriority = getAppointmentStatusPriority(a.status);
      const statusBPriority = getAppointmentStatusPriority(b.status);

      if (statusAPriority !== statusBPriority) {
        return statusBPriority - statusAPriority; // Higher status priority comes first
      }

      // Secondary sort: by appointment type priority (higher number means higher in queue)
      const typeAPriority = getAppointmentTypePriority(a.appointmentType);
      const typeBPriority = getAppointmentTypePriority(b.appointmentType);
      if (typeAPriority !== typeBPriority) {
        return typeBPriority - typeAPriority;
      }

      // Tertiary sort: by time (earlier time means higher in queue)
      const timeA = new Date(`2000/01/01 ${a.time}`);
      const timeB = new Date(`2000/01/01 ${b.time}`);
      return timeA - timeB;
    });

    // Find position where this appointment type would fit
    let position = 1;
    for (const appointment of sortedAppointments) {
      if (getAppointmentTypePriority(appointment.appointmentType) > selectedAppointmentType.priority) {
        position++;
      } else {
        break;
      }
    }

    setOverallQueuePosition(position);
  };

  // Helper function to get appointment status priority (matching Appointmentcheckpage.jsx)
  const getAppointmentStatusPriority = (status) => {
    const appointmentStatusPriorities = {
      "completed": 0, // Completed appointments have the lowest priority
      "cancelled": 0, // Cancelled appointments also have lowest priority, similar to completed
      "Pending (Demo)": 1, // Demo appointments should appear with other active appointments
      "confirmed": 1, // Confirmed appointments have higher priority
      "Pending": 1, // Regular pending appointments have higher priority
      // Add other statuses here with appropriate priorities, default is 1 for non-completed/non-cancelled
    };
    return appointmentStatusPriorities[status] ?? 1;
  };

  // Helper function to get appointment type priority
  const getAppointmentTypePriority = (typeName) => {
    const type = appointmentTypes.find(t => t.name === typeName);
    return type ? type.priority : 0;
  };

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();

    if (isAuthenticated) {
      navigate('/booking-confirmation-waiting', {
        state: {
          barberData: {
            id: barberData.id,
            name: barberData.name,
            image: barberData.image,
            address: barberData.address,
            rating: barberData.rating,
            services: providerDetails?.services || [],
            owner: barberData.owner
          },
          selectedServices: selectedServices.map(serviceId => {
            const service = providerDetails?.services?.find(s => s.id === serviceId);
            return service ? { id: service.id, name: service.name, price: service.price } : null;
          }).filter(Boolean),
          selectedAppointmentType: {
            id: selectedAppointmentType?.id,
            name: selectedAppointmentType?.name,
            priority: selectedAppointmentType?.priority
          },
          customerInfo,
          totalPrice: calculateTotalPrice()
        }
      });
    } else {
      await createBooking();
    }
  };

  const createBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const services = providerDetails?.services?.filter(s => selectedServices.includes(s.id)) || [];

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      const bookingData = {
        barberId: barberData.id,
        shopId: barberData.id,
        services,
        totalPrice: calculateTotalPrice(),
        date: currentDate,
        time: currentTime,
        appointmentType: selectedAppointmentType.name,
        customerInfo,
        status: 'pending'
      };

      const endpoint = isAuthenticated ? '/api/booking' : '/api/booking/public';

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
        setSuccess(true);
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Booking error:', err);

      if (err.response?.status === 400 &&
          (err.response.data.msg === 'This barber is fully booked for today.' ||
           err.response.data.msg === 'This barber is fully booked with high priority appointments.')) {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        navigate('/appointment-full', {
          state: {
            barberId: barberData.id,
            date: currentDate,
            time: currentTime,
            services: providerDetails?.services?.filter(s => selectedServices.includes(s.id)) || [],
            totalPrice: calculateTotalPrice(),
            failedAppointmentType: selectedAppointmentType.name
          }
        });
        return;
      }

      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    navigate('/payment', {
      state: {
        barberData: {
          id: barberData.id,
          name: barberData.name,
          image: barberData.image,
          address: barberData.address,
          rating: barberData.rating,
          services: providerDetails?.services?.filter(s => selectedServices.includes(s.id)) || []
        },
        selectedServices: selectedServices.map(serviceId => {
          const service = providerDetails?.services?.find(s => s.id === serviceId);
          return service ? { id: service.id, name: service.name, price: service.price } : null;
        }).filter(Boolean),
        selectedAppointmentType: {
          id: selectedAppointmentType?.id,
          name: selectedAppointmentType?.name,
          priority: selectedAppointmentType?.priority
        },
        customerInfo,
        totalPrice: calculateTotalPrice()
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!providerDetails?.services) return 0;
    return providerDetails.services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => {
        const price = parseFloat(service.price.replace(/[^0-9.]/g, ''));
        return total + price;
      }, 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!barberData) {
    return null;
  }

  // --- Success UI ---
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h1>
            <p className="text-gray-400 mb-8">
              Your {selectedAppointmentType?.name} appointment is set.
            </p>
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Date</span>
                 <span className="text-white font-medium">{formatDate(new Date().toISOString().split('T')[0])}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Time</span>
                 <span className="text-white font-medium">{new Date().toTimeString().slice(0, 5)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                 <span className="text-gray-400">Total</span>
                 <span className="text-green-400 font-bold text-lg">₹{calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            <div className="grid gap-3">
              <button
                onClick={() => navigate('/all-services-search')}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                Book Another
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Booking UI ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pt-20 lg:pt-24 pb-8 lg:pb-12">
      {/* Background Decor - Optimized for mobile */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-indigo-600/8 lg:bg-indigo-600/10 rounded-full blur-[80px] lg:blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-blue-600/8 lg:bg-blue-600/10 rounded-full blur-[80px] lg:blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">

        {/* Header & Navigation - Mobile Optimized */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={() => navigate('/all-services-search')}
              className="p-2 lg:p-3 bg-slate-900/50 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
            >
              <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">Checkout</h1>
              <p className="text-gray-400 text-xs lg:text-sm">Step {currentStep} of {isAuthenticated ? 5 : 4}</p>
            </div>
          </div>

          {/* Mobile Stepper - Hidden on tablets and desktop */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-xl">
              {[1, 2, 3, 4, ...(isAuthenticated ? [5] : [])].map((step, index) => (
                <div key={step} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                     currentStep === step
                     ? 'bg-indigo-600 text-white shadow-lg'
                     : currentStep > step
                       ? 'bg-indigo-600/50 text-indigo-300 border border-indigo-500/30'
                       : 'bg-slate-800 text-gray-600 border border-white/10'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${
                    currentStep === step ? 'text-indigo-400' : 'text-gray-500'
                  }`}>
                    {step === 1 && 'Tier'}
                    {step === 2 && 'Queue'}
                    {step === 3 && 'Services'}
                    {step === 4 && 'Details'}
                    {step === 5 && 'Pay'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden md:flex justify-center">
            <div className="relative bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl max-w-4xl w-full overflow-hidden">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-transparent to-blue-600/5 pointer-events-none" />

              {/* Progress line background */}
              <div className="absolute top-12 left-6 right-6 h-1 bg-slate-700/50 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep - 1) / ([1, 2, 3, 4, ...(isAuthenticated ? [5] : [])].length - 1)) * 100}%` }}
                />
              </div>

              <div className="relative flex items-center justify-between">
                {[1, 2, 3, 4, ...(isAuthenticated ? [5] : [])].map((step, index) => {
                  const isCompleted = currentStep > step;
                  const isCurrent = currentStep === step;
                  const isUpcoming = currentStep < step;

                  return (
                    <div key={step} className="flex flex-col items-center gap-3 flex-1 relative">
                      {/* Step Circle */}
                      <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                          : isCurrent
                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-500/40 animate-pulse'
                            : 'bg-slate-800/80 text-gray-500 border-2 border-slate-600/50'
                      }`}>
                        {isCompleted ? (
                          <Check size={24} className="text-white" />
                        ) : (
                          step
                        )}

                        {/* Active ring animation */}
                        {isCurrent && (
                          <div className="absolute inset-0 rounded-full border-3 border-indigo-400/30 animate-ping" />
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="text-center min-h-[2.5rem] flex flex-col justify-center">
                        <span className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                          isCompleted
                            ? 'text-emerald-400'
                            : isCurrent
                              ? 'text-indigo-400'
                              : 'text-gray-500'
                        }`}>
                          {step === 1 && 'Select Tier'}
                          {step === 2 && 'Check Queue'}
                          {step === 3 && 'Choose Services'}
                          {step === 4 && 'Your Details'}
                          {step === 5 && 'Payment'}
                        </span>
                        <span className={`text-xs mt-0.5 transition-all duration-300 ${
                          isCompleted
                            ? 'text-emerald-300/70'
                            : isCurrent
                              ? 'text-indigo-300/70'
                              : 'text-gray-600'
                        }`}>
                          {step === 1 && 'Appointment Type'}
                          {step === 2 && 'Position Status'}
                          {step === 3 && 'Service Selection'}
                          {step === 4 && 'Contact Info'}
                          {step === 5 && 'Secure Checkout'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Appointment Type */}
            {currentStep === 1 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 text-amber-500">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Select Experience</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {appointmentTypes.map((type) => {
                    const IconComponent = type.icon;
                    const isSelected = selectedAppointmentType?.id === type.id;
                    const isExpress = type.name === 'Express';

                    return (
                      <button
                        key={type.id}
                        onClick={() => handleAppointmentTypeSelect(type)}
                        className={`group relative p-3 sm:p-4 md:p-6 rounded-2xl border text-left transition-all duration-300 ${
                          isSelected
                            ? 'bg-white/10 border-indigo-500 ring-1 ring-indigo-500/50 shadow-xl shadow-indigo-900/20'
                            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                        } overflow-hidden`}
                      >
                        {/* Interactive Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative z-10">
                           <div className="flex justify-between items-start mb-3 sm:mb-4">
                              <div className={`p-2 sm:p-3 rounded-xl transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                                 <IconComponent size={20} className="sm:w-6 sm:h-6" color={isSelected ? 'white' : type.color} />
                              </div>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                 isExpress
                                 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                 : isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/10 text-gray-400'
                              }`}>
                                 {type.priceIndicator}
                              </span>
                           </div>
                           <h4 className={`text-base sm:text-lg font-bold mb-2 ${isExpress ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500' : 'text-white'}`}>
                              {type.name}
                           </h4>
                           <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{type.description}</p>
                           {isExpress && (
                              <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
                                <Diamond size={10} className="sm:w-3 sm:h-3" /> VIP Priority
                              </div>
                           )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Queue */}
            {currentStep === 2 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Queue Status</h3>
                </div>

                {/* Show QueueStatus component */}
                <QueueStatus barberId={barberData?.owner?._id} />

                {/* Warning */}
                {(selectedAppointmentType?.name === 'Free' || selectedAppointmentType?.name === 'Basic') && (
                  <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-6 sm:mb-8">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-orange-400 mb-1 text-sm sm:text-base">Priority Notice</h4>
                      <p className="text-sm text-orange-200/70 leading-relaxed">
                         Wait times may fluctuate. <strong>Express</strong> bookings take precedence in the queue.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-3 lg:pt-4 border-t border-white/5">
                  <button onClick={() => setCurrentStep(1)} className="px-4 lg:px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all order-2 sm:order-1 text-sm sm:text-base">Back</button>
                  <button onClick={() => setCurrentStep(3)} className="flex-1 py-3.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all flex justify-center items-center gap-2 order-1 sm:order-2 text-sm sm:text-base min-h-[48px]">
                    Select Services <ArrowRight size={18} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 rounded-xl bg-pink-500/10 text-pink-500">
                    <Scissors size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Select Services</h3>
                </div>

                {providerDetails?.services?.length > 0 ? (
                   <div className="grid gap-3 mb-6 sm:mb-8">
                      {providerDetails.services.map((service) => {
                         const isSelected = selectedServices.includes(service.id);
                         return (
                            <div
                               key={service.id}
                               onClick={() => handleServiceSelect(service.id)}
                               className={`relative p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                                  isSelected
                                  ? 'bg-indigo-600/10 border-indigo-500/50'
                                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                               }`}
                            >
                               <div className="flex-1 pr-3 sm:pr-4">
                                  <h4 className={`font-semibold text-sm sm:text-md mb-1 ${isSelected ? 'text-indigo-400' : 'text-white'}`}>{service.name}</h4>
                                  <p className="text-gray-400 text-xs sm:text-sm">{service.description}</p>
                               </div>
                               <div className="flex flex-col items-end gap-2">
                                  <span className="text-white text-xs sm:text-sm font-bold bg-white/10 px-2 sm:px-3 py-1 rounded-lg">{service.price}</span>
                                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                     isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500 group-hover:border-gray-400'
                                  }`}>
                                     {isSelected && <Check size={8} className="text-white" />}
                                  </div>
                               </div>
                            </div>
                         )
                      })}
                   </div>
                ) : (
                   <div className="text-center py-8 sm:py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-gray-400 text-sm sm:text-base">No services available right now.</p>
                   </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-3 lg:pt-4 border-t border-white/5">
                   <button onClick={() => setCurrentStep(2)} className="px-4 lg:px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all order-2 sm:order-1 text-sm sm:text-base">Back</button>
                   <button
                     onClick={() => setCurrentStep(4)}
                     disabled={selectedServices.length === 0}
                     className="flex-1 py-3.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 text-sm sm:text-base min-h-[48px] flex items-center justify-center"
                   >
                     Continue ({selectedServices.length})
                   </button>
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {currentStep === 4 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-2xl">
                 <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <div className="p-2 lg:p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <User size={20} />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-white">Your Details</h3>
                </div>

                  <form onSubmit={handleCustomerInfoSubmit} className="space-y-4 lg:space-y-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                           <input
                              type="text"
                              required
                              value={customerInfo.name}
                              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg lg:rounded-xl px-3 lg:px-4 py-3 lg:py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600 text-sm lg:text-base"
                              placeholder="John Doe"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
                           <input
                              type="tel"
                              required
                              value={customerInfo.phone}
                              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg lg:rounded-xl px-3 lg:px-4 py-3 lg:py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600 text-sm lg:text-base"
                              placeholder="(555) 000-0000"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                        <input
                           type="email"
                           required
                           value={customerInfo.email}
                           onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                           className="w-full bg-slate-950 border border-white/10 rounded-lg lg:rounded-xl px-3 lg:px-4 py-3 lg:py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600 text-sm lg:text-base"
                           placeholder="john@example.com"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Notes (Optional)</label>
                        <textarea
                           rows={3}
                           value={customerInfo.notes}
                           onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                           className="w-full bg-slate-950 border border-white/10 rounded-lg lg:rounded-xl px-3 lg:px-4 py-3 lg:py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600 resize-none text-sm lg:text-base"
                           placeholder="Any special requests..."
                        />
                     </div>

                     {error && (
                       <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 bg-red-500/10 border border-red-500/20 rounded-lg lg:rounded-xl text-red-400">
                         <AlertCircle size={16} />
                         <span className="text-xs lg:text-sm font-medium">{error}</span>
                       </div>
                     )}

                     <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-3 lg:pt-4 border-t border-white/5">
                        <button type="button" onClick={() => setCurrentStep(3)} className="px-4 lg:px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all order-2 sm:order-1 text-sm sm:text-base">Back</button>
                        <button
                           type="submit"
                           disabled={loading}
                           className="flex-1 py-3.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex justify-center items-center gap-2 order-1 sm:order-2 text-sm sm:text-base min-h-[48px]"
                        >
                           {loading ? <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                              <>Confirm Details <ArrowRight size={18} className="sm:w-4 sm:h-4" /></>
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            )}

            {/* Step 5: Payment */}
            {currentStep === 5 && isAuthenticated && (
               <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Payment</h3>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/5 mb-4 sm:mb-6">
                     <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-lg">
                           <Shield className="text-emerald-400" size={18} />
                        </div>
                        <div>
                           <h4 className="font-bold text-white text-sm">Secure Transaction</h4>
                           <p className="text-gray-400 text-xs">256-bit SSL Encrypted</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 text-sm">
                           <span className="text-gray-400">Services Total</span>
                           <span className="text-white font-medium">₹{calculateTotalPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-sm border-b border-white/5 pb-4">
                           <span className="text-gray-400">Taxes & Fees</span>
                           <span className="text-white font-medium">₹0.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                           <span className="text-lg font-bold text-white">Total Due</span>
                           <span className="text-xl sm:text-2xl font-bold text-emerald-400">₹{calculateTotalPrice().toFixed(2)}</span>
                        </div>
                     </div>
                  </div>

                  <button
                     onClick={handlePaymentSubmit}
                     disabled={loading}
                     className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 text-sm sm:text-base"
                  >
                     {loading ? 'Processing...' : (
                        <>Pay Now & Book</>
                     )}
                  </button>
                  <button onClick={() => setCurrentStep(4)} className="w-full mt-3 sm:mt-4 py-2 text-gray-500 hover:text-white transition-colors text-sm font-medium">
                     Cancel
                  </button>
               </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar Summary */}
          <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-28">
             {/* Barber Profile Card */}
             <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
                <div className="flex flex-col items-center text-center relative z-10">
                   <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 shadow-xl">
                      <img 
                        src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'} 
                        alt={barberData.name}
                        className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                      />
                   </div>
                   <h2 className="text-xl font-bold text-white mb-1">{barberData.name}</h2>
                   <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      <Star size={14} fill="currentColor" /> {barberData.rating?.toFixed(1) || '4.9'}
                   </div>
                </div>
                <div className="mt-6 space-y-3 pt-6 border-t border-white/5">
                   <div className="flex items-start gap-3 text-sm text-gray-400">
                      <MapPin size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                      <span>{barberData.address}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Calendar size={16} className="text-indigo-500 shrink-0" />
                      <span>{formatDate(new Date().toISOString())}</span>
                   </div>
                </div>
             </div>

             {/* Live Booking Summary */}
             <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Summary</h4>
                <div className="space-y-4">
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Type</span>
                      <span className="text-white font-medium">{selectedAppointmentType ? selectedAppointmentType.name : '-'}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Services</span>
                      <span className="text-white font-medium">{selectedServices.length} selected</span>
                   </div>
                   <div className="border-t border-white/10 pt-4 mt-2">
                      <div className="flex justify-between items-center">
                         <span className="text-gray-300 font-medium">Total</span>
                         <span className="text-2xl font-bold text-white">₹{calculateTotalPrice().toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingAppointment;
