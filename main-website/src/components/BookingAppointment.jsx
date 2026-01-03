import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import QueueStatus from './QueueStatus';
import {
  ArrowLeft, Calendar, Clock, MapPin, Star,
  User,CheckCircle2, AlertCircle,
  CreditCard, Shield, ArrowRight,
  Circle, Crown, Zap,
  Check, Scissors, ChevronRight
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
      id: '2',
      name: 'Basic',
      description: 'Standard appointment slot.',
      priceIndicator: 'Standard',
      priority: 2,
      icon: Circle,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20'
    },
    {
      id: '4',
      name: 'Express',
      description: 'VIP Lounge access, top priority & fastest service.',
      priceIndicator: 'Exclusive',
      priority: 4,
      icon: Crown,
      color: 'text-amber-400',
      bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30'
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

  const calculateQueuePosition = (appointments) => {
    if (!selectedAppointmentType) return;
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.status !== "Payment Pending"
    );
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
      const statusAPriority = getAppointmentStatusPriority(a.status);
      const statusBPriority = getAppointmentStatusPriority(b.status);
      if (statusAPriority !== statusBPriority) return statusBPriority - statusAPriority;
      const typeAPriority = getAppointmentTypePriority(a.appointmentType);
      const typeBPriority = getAppointmentTypePriority(b.appointmentType);
      if (typeAPriority !== typeBPriority) return typeBPriority - typeAPriority;
      const timeA = new Date(`2000/01/01 ${a.time}`);
      const timeB = new Date(`2000/01/01 ${b.time}`);
      return timeA - timeB;
    });

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

  const getAppointmentStatusPriority = (status) => {
    const appointmentStatusPriorities = {
      "completed": 0, "cancelled": 0, "Pending (Demo)": 1, "confirmed": 1, "Pending": 1,
    };
    return appointmentStatusPriorities[status] ?? 1;
  };

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
      const bookingData = {
        barberId: barberData.id,
        shopId: barberData.id,
        services,
        totalPrice: calculateTotalPrice(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        appointmentType: selectedAppointmentType.name,
        customerInfo,
        status: 'pending'
      };
      const endpoint = isAuthenticated ? '/api/booking' : '/api/booking/public';
      const response = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, bookingData);
      if (response.data) {
        setSuccess(true);
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Booking error:', err);
      if (err.response?.status === 400 &&
          (err.response.data.msg === 'This barber is fully booked for today.' ||
           err.response.data.msg === 'This barber is fully booked with high priority appointments.')) {
        navigate('/appointment-full', {
          state: {
            barberId: barberData.id,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
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
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  if (!barberData) return null;

  // --- Success UI ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative bg-[#0F0F12] border border-white/5 rounded-[2rem] p-8 text-center shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/30 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Booking Confirmed!</h1>
            <p className="text-gray-400 mb-8 font-light">
              Your <span className="text-emerald-400 font-medium">{selectedAppointmentType?.name}</span> appointment is secured.
            </p>
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5 space-y-4 backdrop-blur-sm">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Date</span>
                 <span className="text-white font-medium">{formatDate(new Date().toISOString().split('T')[0])}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-400">Time</span>
                 <span className="text-white font-medium">{new Date().toTimeString().slice(0, 5)}</span>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                 <span className="text-gray-400">Total</span>
                 <span className="text-emerald-400 font-bold text-xl">₹{calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            <div className="grid gap-3">
              <button onClick={() => navigate('/all-services-search')} className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all shadow-lg">Book Another</button>
              <button onClick={() => navigate('/')} className="w-full py-4 bg-transparent text-gray-400 hover:text-white rounded-xl font-semibold transition-all">Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
      { num: 1, label: "Tier", icon: Crown },
      { num: 2, label: "Queue", icon: Clock },
      { num: 3, label: "Services", icon: Scissors },
      { num: 4, label: "Details", icon: User },
      ...(isAuthenticated ? [{ num: 5, label: "Payment", icon: CreditCard }] : [])
  ];

  // --- Main Booking UI ---
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <button
              onClick={() => navigate('/all-services-search')}
              className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back</span>
            </button>
            <div className="text-right">
                <h1 className="text-xl font-bold text-white tracking-tight">Checkout</h1>
                <p className="text-gray-500 text-xs mt-1">Booking with {barberData.name}</p>
            </div>
        </div>

        {/* --- PREMIUM HOLOGRAPHIC STEPPER --- */}
        <div className="mb-10 lg:mb-14 relative z-20">
            {/* Container for the timeline */}
            <div className="relative bg-[#0F0F12]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden">
                
                {/* Connecting Line (Background) */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 z-0"></div>
                
                {/* Animated Progress Line (Foreground) */}
                <div 
                    className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 -translate-y-1/2 z-0 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                <div className="relative z-10 flex justify-between items-center w-full px-1">
                    {steps.map((step) => {
                        const isActive = currentStep === step.num;
                        const isCompleted = currentStep > step.num;
                        const isFuture = currentStep < step.num;
                        const Icon = step.icon;

                        return (
                            <div key={step.num} className="flex flex-col items-center group cursor-default">
                                {/* Step Circle */}
                                <div 
                                    className={`
                                        relative flex items-center justify-center rounded-full transition-all duration-500 ease-out
                                        ${isActive 
                                            ? 'w-10 h-10 sm:w-12 sm:h-12 bg-[#050505] border-2 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.6)] scale-110' 
                                            : isCompleted 
                                                ? 'w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 border-none shadow-lg' 
                                                : 'w-8 h-8 sm:w-10 sm:h-10 bg-[#0F0F12] border border-white/10'
                                        }
                                    `}
                                >
                                    {/* Icon / Content inside circle */}
                                    <div className="z-10 flex items-center justify-center">
                                        {isCompleted ? (
                                            <Check size={16} className="text-white animate-in zoom-in duration-300" strokeWidth={3} />
                                        ) : (
                                            <Icon 
                                                size={isActive ? 18 : 14} 
                                                className={`transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} 
                                            />
                                        )}
                                    </div>

                                    {/* Ripple Effect for Active Step */}
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-full border border-indigo-500/50 animate-ping"></span>
                                    )}
                                </div>

                                {/* Label - Smart Responsive */}
                                <div className={`
                                    mt-3 transition-all duration-500 flex flex-col items-center
                                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 md:opacity-50 md:scale-90 translate-y-2 md:translate-y-0'}
                                    ${isFuture && 'md:opacity-30'}
                                `}>
                                    <span className={`
                                        text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap
                                        ${isActive ? 'text-indigo-300' : isCompleted ? 'text-indigo-500' : 'text-gray-600'}
                                    `}>
                                        {step.label}
                                    </span>
                                    
                                    {/* Small indicator dot for inactive steps on mobile to save space */}
                                    {!isActive && (
                                        <div className="md:hidden w-1 h-1 bg-white/10 rounded-full mt-1"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            
            {/* Step 1: Appointment Type */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Crown size={20} className="text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Select Experience</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointmentTypes.map((type) => {
                    const IconComponent = type.icon;
                    const isSelected = selectedAppointmentType?.id === type.id;
                    const isExpress = type.name === 'Express';

                    return (
                      <button
                        key={type.id}
                        onClick={() => handleAppointmentTypeSelect(type)}
                        className={`
                            group relative p-6 rounded-[1.5rem] border text-left transition-all duration-300 overflow-hidden
                            ${isSelected 
                                ? 'bg-white/10 border-indigo-500 ring-1 ring-indigo-500/50 shadow-2xl shadow-indigo-500/10' 
                                : 'bg-[#0F0F12] border-white/5 hover:border-white/20 hover:bg-white/5'}
                        `}
                      >
                        {isExpress && <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">VIP Access</div>}
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${type.bg} ${type.color} ring-1 ring-inset ${type.border}`}>
                                <IconComponent size={24} />
                            </div>
                        </div>

                        <h4 className={`text-lg font-bold mb-2 ${isExpress ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500' : 'text-white'}`}>
                            {type.name}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 min-h-[40px]">{type.description}</p>
                        
                        <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isSelected ? 'text-indigo-400' : 'text-gray-600'}`}>
                            Select Plan <ArrowRight size={14} className={`transition-transform duration-300 ${isSelected ? 'translate-x-1' : ''}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Queue */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#0F0F12] border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Clock size={20} />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-white">Current Queue</h3>
                             <p className="text-gray-500 text-sm">Real-time status updates</p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <QueueStatus barberId={barberData?.owner?._id} />
                    </div>

                    {selectedAppointmentType?.name === 'Basic' && (
                    <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex gap-4">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-orange-400 text-sm mb-1">Priority Notice</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Wait times may fluctuate. <span className="text-white font-medium">Express</span> bookings take precedence in the queue.
                            </p>
                        </div>
                    </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-white/5">
                        <button onClick={() => setCurrentStep(1)} className="px-6 py-3 text-gray-400 hover:text-white rounded-xl font-medium transition-colors order-2 sm:order-1">Back</button>
                        <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all flex justify-center items-center gap-2 order-1 sm:order-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            Select Services <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
              </div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                            <Scissors size={20} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Select Services</h3>
                    </div>
                    <span className="text-sm text-gray-500">{selectedServices.length} Selected</span>
                </div>

                {providerDetails?.services?.length > 0 ? (
                    <div className="space-y-3 mb-8">
                        {providerDetails.services.map((service) => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                                <div
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service.id)}
                                    className={`
                                        group relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between
                                        ${isSelected 
                                            ? 'bg-indigo-900/10 border-indigo-500/50 shadow-inner' 
                                            : 'bg-[#0F0F12] border-white/5 hover:border-white/10 hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex-1 pr-4">
                                        <h4 className={`font-semibold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{service.name}</h4>
                                        <p className="text-gray-500 text-sm">{service.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="text-white text-sm font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">{service.price}</span>
                                        <div className={`
                                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                            ${isSelected ? 'bg-indigo-500 border-indigo-500 scale-110' : 'border-gray-600 group-hover:border-gray-400'}
                                        `}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[#0F0F12] rounded-3xl border border-dashed border-white/10 mb-8">
                        <p className="text-gray-400">No services available right now.</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setCurrentStep(2)} className="px-6 py-3 text-gray-400 hover:text-white rounded-xl font-medium transition-colors order-2 sm:order-1">Back</button>
                    <button
                        onClick={() => setCurrentStep(4)}
                        disabled={selectedServices.length === 0}
                        className="flex-1 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed order-1 sm:order-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        Continue to Details
                    </button>
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#0F0F12] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <User size={20} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Your Details</h3>
                    </div>

                    <form onSubmit={handleCustomerInfoSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-indigo-400 transition-colors">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-700"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-indigo-400 transition-colors">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-700"
                                    placeholder="(555) 000-0000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-indigo-400 transition-colors">Email Address</label>
                            <input
                                type="email"
                                required
                                value={customerInfo.email}
                                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-700"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-indigo-400 transition-colors">Notes (Optional)</label>
                            <textarea
                                rows={3}
                                value={customerInfo.notes}
                                onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-700 resize-none"
                                placeholder="Any special requests..."
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-pulse">
                                <AlertCircle size={20} />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button type="button" onClick={() => setCurrentStep(3)} className="px-6 py-3 text-gray-400 hover:text-white rounded-xl font-medium transition-colors order-2 sm:order-1">Back</button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex justify-center items-center gap-2 order-1 sm:order-2 transform active:scale-95"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                    <>Confirm & Continue <ArrowRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
              </div>
            )}

            {/* Step 5: Payment */}
            {currentStep === 5 && isAuthenticated && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#0F0F12] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Payment</h3>
                    </div>

                    <div className="bg-[#050505] rounded-2xl p-6 border border-white/10 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield size={100} className="text-white" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Shield className="text-emerald-400" size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Secure Transaction</h4>
                                <p className="text-gray-400 text-xs">256-bit SSL Encrypted</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Services Total</span>
                                <span className="text-white font-mono">₹{calculateTotalPrice().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                                <span className="text-gray-400">Taxes & Fees</span>
                                <span className="text-white font-mono">₹0.00</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-lg font-bold text-white">Total Due</span>
                                <span className="text-3xl font-bold text-white font-mono">₹{calculateTotalPrice().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePaymentSubmit}
                        disabled={loading}
                        className="w-full py-5 bg-white text-black hover:bg-emerald-50 hover:text-emerald-900 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 transform active:scale-95"
                    >
                        {loading ? 'Processing...' : (
                            <>Pay Now & Book <ChevronRight /></>
                        )}
                    </button>
                    <button onClick={() => setCurrentStep(4)} className="w-full mt-4 py-2 text-gray-500 hover:text-white transition-colors text-sm font-medium">
                        Cancel Transaction
                    </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar Summary */}
          <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-8">
              
              {/* Barber Profile Card */}
              <div className="bg-[#0F0F12] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="flex flex-col items-center text-center relative z-10">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 shadow-xl">
                       <img 
                         src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'} 
                         alt={barberData.name}
                         className="w-full h-full rounded-full object-cover border-4 border-[#0F0F12]"
                       />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{barberData.name}</h2>
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
                       <Star size={14} fill="currentColor" /> {barberData.rating?.toFixed(1) || '4.9'}
                    </div>
                 </div>
                 
                 <div className="mt-6 space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-start gap-4 text-sm text-gray-400">
                       <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                           <MapPin size={16} className="text-indigo-400" />
                       </div>
                       <span className="mt-1">{barberData.address}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                       <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                           <Calendar size={16} className="text-indigo-400" />
                       </div>
                       <span className="mt-1">{formatDate(new Date().toISOString())}</span>
                    </div>
                 </div>
              </div>

              {/* Live Booking Summary */}
              <div className="bg-[#0F0F12] border border-white/5 rounded-[2rem] p-6 shadow-xl">
                 <div className="flex items-center gap-2 mb-6">
                    <Zap size={16} className="text-indigo-500 fill-indigo-500" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Booking Summary</h4>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between text-sm items-center">
                       <span className="text-gray-500">Tier</span>
                       {selectedAppointmentType ? (
                           <span className={`font-bold px-2 py-0.5 rounded ${selectedAppointmentType.bg} ${selectedAppointmentType.color} text-xs border ${selectedAppointmentType.border}`}>
                               {selectedAppointmentType.name}
                           </span>
                       ) : <span className="text-gray-700">-</span>}
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Services</span>
                       <span className="text-white font-medium">{selectedServices.length} selected</span>
                    </div>
                    <div className="border-t border-dashed border-white/10 pt-4 mt-2">
                       <div className="flex justify-between items-end">
                          <span className="text-gray-400 font-medium mb-1">Total</span>
                          <span className="text-3xl font-bold text-white tracking-tight">₹{calculateTotalPrice().toFixed(2)}</span>
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
