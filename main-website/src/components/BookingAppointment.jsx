import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

import {
  ArrowLeft,
  Crown,
  Scissors,
  Check,
  AlertCircle,
  Shield,
  ArrowRight,
  MapPin,
  Clock,
  Star,
  Lock,
} from "lucide-react";

// --- MODERN STYLES ---
// (No inline styles needed, utilizing Tailwind + standard classes)


const BookingAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const barberData = location.state?.barberData;
  const { isAuthenticated, user, token } = useAuth();


  const [currentStep, setCurrentStep] = useState(1);

  const [providerDetails, setProviderDetails] = useState(null);

  // Booking confirmation waiting states
  const [confirmationStatus, setConfirmationStatus] = useState("idle"); // 'idle', 'creating', 'waiting', 'confirmed', 'declined', 'timeout', 'error'
  const [bookingId, setBookingId] = useState(null);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Payment states
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Refs for timer management
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);
  const [shopPhone, setShopPhone] = useState(() => {
    const phone =
      barberData?.phone ||
      barberData?.owner?.phone ||
      barberData?.contact ||
      barberData?.mobile;
    return phone || "Contact shop for details";
  });

  const steps = [
    { number: 1, title: "Appointment Type" },
    { number: 2, title: "Choose Services" },
    { number: 3, title: "Confirm Booking" },
    { number: 4, title: "Complete Payment" },
  ];

  const appointmentTypes = [
    {
      id: "2",
      name: "Basic's Services",
      description: "Classic Styling Normal Queue.",
      priceIndicator: "Basic",
      priority: 2,
      icon: Scissors,
    },
    {
      id: "4",
      name: "Express Services",
      description: "Priority Chair. Skip Queue.",
      priceIndicator: "Express",
      priority: 4,
      icon: Crown,
    },
  ];

  const fetchProviderDetails = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/barber-card/${barberData.id}`
      );
      setProviderDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch provider details", err);
    }
  }, [barberData?.id]);

  useEffect(() => {
    if (!barberData) {
      navigate("/all-services-search");
    } else {
      fetchProviderDetails();
    }
  }, [barberData, navigate, fetchProviderDetails]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        notes: "",
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (providerDetails?.phone) {
      setShopPhone(providerDetails.phone);
    } else if (providerDetails?.contact) {
      setShopPhone(providerDetails.contact);
    } else if (providerDetails?.mobile) {
      setShopPhone(providerDetails.mobile);
    }
  }, [providerDetails]);

  // Cancel booking function
  const cancelBooking = useCallback(async () => {
    if (bookingId) {
      try {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/booking/cancel/${bookingId}`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        alert(
          "Appointment cancelled because payment was not completed within 1 minute."
        );
        navigate("/all-services-search");
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("Failed to cancel appointment. Please try again.");
      }
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    if (confirmationStatus === "confirmed") {
      const paymentTimer = setTimeout(() => {
        setCurrentStep(4); // Renumbered from 5 to 4
      }, 1000);

      return () => clearTimeout(paymentTimer);
    }
  }, [confirmationStatus]);

  // Timer logic for payment countdown
  useEffect(() => {
    if (currentStep === 4 && bookingId) { // Renumbered from 5 to 4
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + 60 * 1000;
      }

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(
          0,
          Math.ceil((endTimeRef.current - now) / 1000)
        );

        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          cancelBooking();
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, bookingId, cancelBooking]);

  // --- Helper Functions ---
  const calculateTotalPrice = useCallback(() => {
    if (!providerDetails?.services) return 0;
    return providerDetails.services
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => {
        const price = parseFloat(service.price.replace(/[^0-9.]/g, ""));
        return total + price;
      }, 0);
  }, [providerDetails?.services, selectedServices]);

  // Calculate tier-based payment amount
  const calculateTierPayment = useCallback(() => {
    if (!selectedAppointmentType) return 0;

    switch (selectedAppointmentType.id) {
      case "2": // Basic
        return 9;
      case "4": // Express
        return 19;
      default:
        return calculateTotalPrice(); // Fallback to full amount
    }
  }, [selectedAppointmentType, calculateTotalPrice]);

  // --- REAL-TIME UPDATES (Socket + Polling Fallback) ---
  useEffect(() => {
    if (!bookingId || confirmationStatus !== 'waiting') return;

    let pollInterval;
    let socket;

    const handleUpdate = (status) => {
      if (status === 'confirmed') setConfirmationStatus('confirmed');
      else if (status === 'declined' || status === 'cancelled') setConfirmationStatus('declined');
    };

    if (isAuthenticated && token) {
      // 1. Authenticated: Use Sockets (Zero API Calls)
      // Use the global socket or create a lightweight connection
      // We import io from socket.io-client at the top
      socket = io(process.env.REACT_APP_API_URL, {
        query: { token: token },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        // Connected
      });

      socket.on('booking_update', (data) => {
        if (data.bookingId === bookingId) {
          handleUpdate(data.status);
        }
      });

      // Fallback: Logic based on notifications
      socket.on('notification', (notif) => {
        // safety check in case the dedicated event fails
        if (notif.title && notif.title.includes('Confirmed')) handleUpdate('confirmed');
      });

    } else {
      // 2. Guest: Fallback to Polling (Reduced frequency to 4s)
      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`);
          handleUpdate(res.data.status);
        } catch (err) { console.error("Polling error", err); }
      }, 4000);
    }

    return () => {
      if (socket) socket.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [bookingId, confirmationStatus, isAuthenticated, user, token]);

  // ------------------------------------------------------------------------------------------

  const handleServiceSelect = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAppointmentTypeSelect = (type) => {
    setSelectedAppointmentType(type);
    setCurrentStep(2); // Jump directly to Services (was old step 3)
  };

  const createBookingForConfirmation = useCallback(async () => {
    try {
      setConfirmationStatus("creating");

      const services = selectedServices
        .map((serviceId) => {
          const service = providerDetails?.services?.find(
            (s) => s.id === serviceId
          );
          return service
            ? {
              id: service.id,
              name: service.name,
              price: service.price,
            }
            : null;
        })
        .filter(Boolean);

      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      const bookingData = {
        barberId: barberData.owner._id,
        // Removed shopId: Not in request schema
        services,
        totalPrice: calculateTotalPrice(),
        date: currentDate,
        time: currentTime,
        appointmentType: selectedAppointmentType?.priceIndicator, // Use 'priceIndicator' (Basic/Express) instead of 'name'
        customerInfo,
        // Removed status: Set by backend defaults
      };

      const endpoint = isAuthenticated ? "/api/booking" : "/api/booking/public";
      const headers = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && user?.token) {
        headers["x-auth-token"] = user.token;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        bookingData,
        { headers }
      );

      if (response.data && response.data._id) {
        setBookingId(response.data._id);
        setConfirmationStatus("waiting");

      } else {
        setConfirmationStatus("error");
      }
    } catch (err) {
      console.error("Booking creation failed:", err);
      setConfirmationStatus("error");
    }
  }, [
    barberData,
    selectedServices,
    selectedAppointmentType,
    customerInfo,
    isAuthenticated,
    user,
    calculateTotalPrice,

    providerDetails,
  ]);

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    setCurrentStep(3); // Renumbered from 4 to 3
    await createBookingForConfirmation();
  };

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError("");

    try {
      if (timerRef.current) clearInterval(timerRef.current);

      // Get auth token
      const authToken = token || localStorage.getItem('customerAuthToken');
      if (!authToken) {
        setPaymentError('Please login to continue with payment');
        setProcessing(false);
        return;
      }

      const headers = { 'x-auth-token': authToken };

      // 1. Get Razorpay Key
      const configRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/payment/config`,
        { headers }
      );
      const razorpayKey = configRes.data.key;

      // 2. Create Razorpay Order
      const orderRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payment/order`,
        {
          amount: calculateTierPayment(),
          currency: 'INR',
          receipt: `booking_${bookingId || Date.now()} `
        },
        { headers }
      );

      // 3. Razorpay Checkout Options
      const options = {
        key: razorpayKey,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        order_id: orderRes.data.id,
        name: 'GlossCut',
        description: `Booking with ${barberData.name} `,
        image: '/GlossCutCircle.png',
        handler: async function (response) {
          try {
            // 4. Verify Payment on Backend
            const verifyRes = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/payment/verify`,
              {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: bookingId
              },
              { headers }
            );

            if (verifyRes.data.status === 'success') {
              // 5. Navigate to success screen with OTP
              navigate("/booking-success", {
                state: {
                  otp: verifyRes.data.otp, // Add OTP from backend response
                  paymentData: {
                    success: true,
                    transactionId: response.razorpay_payment_id,
                    amount: calculateTierPayment(),
                    method: 'razorpay'
                  },
                  bookingData: {
                    _id: bookingId,
                    barberId: barberData.owner._id,
                    shopId: barberData.id,
                    services: selectedServices
                      .map((serviceId) => {
                        const service = providerDetails?.services?.find(
                          (s) => s.id === serviceId
                        );
                        return service
                          ? { id: service.id, name: service.name, price: service.price }
                          : null;
                      })
                      .filter(Boolean),
                    totalPrice: calculateTotalPrice(),
                    date: new Date().toISOString().split("T")[0],
                    time: new Date().toTimeString().slice(0, 5),
                    appointmentType: selectedAppointmentType?.name,
                    customerInfo,
                    status: "confirmed",
                  },
                  barberData: {
                    id: barberData.id,
                    name: barberData.name,
                    image: barberData.image,
                    address: barberData.address,
                    phone: shopPhone,
                    rating: barberData.rating
                  },
                  selectedServices: selectedServices
                    .map((serviceId) => {
                      const service = providerDetails?.services?.find(
                        (s) => s.id === serviceId
                      );
                      return service
                        ? { id: service.id, name: service.name, price: service.price }
                        : null;
                    })
                    .filter(Boolean),
                  selectedAppointmentType: {
                    id: selectedAppointmentType?.id,
                    name: selectedAppointmentType?.name,
                    priceIndicator: selectedAppointmentType?.priceIndicator
                  },
                  customerInfo,
                  totalPrice: calculateTotalPrice(),
                },
              });
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: customerInfo?.name || '',
          email: customerInfo?.email || '',
          contact: customerInfo?.phone || ''
        },
        theme: {
          color: '#1F6FEB'
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setPaymentError('Payment cancelled. Please try again.');
          }
        }
      };

      // 6. Open Razorpay Modal
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setProcessing(false);
        setPaymentError(response.error.description || 'Payment failed. Please try again.');
      });
      rzp.open();

    } catch (err) {
      console.error("Payment initiation failed:", err);
      setPaymentError(err.response?.data?.msg || "Payment initiation failed. Please try again.");
      setProcessing(false);
    }
  };



  if (!barberData) return null;



  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">
      {/* SHARED BACKGROUND WRAPPER */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        {/* MOBILE BACKGROUND */}
        <div className="absolute inset-0 w-full h-full block lg:hidden overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
          <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
          <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
          <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
        </div>

        {/* DESKTOP BACKGROUND */}
        <div className="hidden lg:block absolute inset-0 w-full h-full overflow-hidden bg-gray-50">
          <div className="absolute inset-0 bg-gray-100/60" />
          <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed" style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-3 group-hover:border-gray-400 group-hover:scale-110 transition-all shadow-sm">
              <ArrowLeft size={16} />
            </div>
            <span className="font-medium text-sm">Back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-[#4C763B] text-xs font-bold uppercase tracking-wider mb-3 border border-green-100">
                <Crown size={12} className="mr-1.5" />
                Premium Booking
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-2">
                {barberData?.owner?.shopName || "Book Appointment"}
              </h1>
              <div className="flex items-center text-gray-500 text-sm md:text-base font-medium">
                <MapPin size={16} className="mr-1.5 text-gray-400" />
                {barberData?.owner?.address || "Location Unavailable"}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Opening Hours</p>
                <p className="text-sm font-bold text-gray-900">09:00 - 21:00</p>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Rating</p>
                <div className="flex items-center justify-end font-bold text-gray-900 text-sm">
                  <Star size={12} className="text-orange-400 mr-1 fill-orange-400" />
                  4.9
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">

            {/* Step Indicator */}
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between relative">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
                {/* Progress Bar Active */}
                <div
                  className="absolute left-0 top-1/2 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step) => {
                  const isActive = step.number === currentStep;
                  const isCompleted = step.number < currentStep;

                  return (
                    <div key={step.number} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 z-10 ${isActive ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-110' :
                          isCompleted ? 'bg-green-100 border-green-600 text-green-700' :
                            'bg-white border-gray-200 text-gray-400'
                          }`}
                      >
                        {isCompleted ? <Check size={18} strokeWidth={3} /> : step.number}
                      </div>
                      <span className={`mt-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-green-700' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                        {step.title.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 1: Appointment Type */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-fade-in-up">
                {appointmentTypes.map((type) => {
                  const isSelected = selectedAppointmentType?.id === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleAppointmentTypeSelect(type)}
                      className={`relative group p-6 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${isSelected
                        ? 'bg-green-50 border-green-600 shadow-xl shadow-green-100'
                        : 'bg-white border-white hover:border-green-200 shadow-sm hover:shadow-md'
                        }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 p-3">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white shadow-sm">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 group-hover:bg-green-50 group-hover:text-green-600'
                        }`}>
                        <type.icon size={28} strokeWidth={1.5} />
                      </div>

                      <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                        {type.name}
                      </h3>
                      <p className={`text-sm leading-relaxed mb-6 ${isSelected ? 'text-green-800' : 'text-gray-500'}`}>
                        {type.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-200">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-green-700' : 'text-gray-400'}`}>
                          {type.priceIndicator}
                        </span>
                        <div className={`flex items-center text-sm font-semibold transition-transform duration-300 ${isSelected ? 'translate-x-1 text-green-600' : 'text-gray-300 group-hover:text-green-500'}`}>
                          Select <ArrowRight size={16} className="ml-1" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 2: Services */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up flex flex-col h-[600px]">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Select Services</h3>
                    <p className="text-sm text-gray-500">Choose from available treatments</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                    {selectedServices.length} Selected
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {providerDetails?.services?.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${isSelected
                          ? 'bg-green-50 border-green-500 shadow-md z-10'
                          : 'bg-white border-gray-100 hover:border-green-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <Scissors size={20} />
                          </div>
                          <div>
                            <h4 className={`font-bold text-base ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                              {service.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`font-bold text-lg ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                            {service.price}
                          </span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                            }`}>
                            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomerInfoSubmit}
                    disabled={selectedServices.length === 0 || confirmationStatus === 'creating'}
                    className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmationStatus === 'creating' ? (
                      <span className="loader mr-2"></span>
                    ) : (
                      <>
                        Confirm & Book <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in-up">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16"></div>

                  {(confirmationStatus === "creating" || confirmationStatus === "waiting") && (
                    <div className="space-y-6">
                      <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Clock className="text-green-500 animate-pulse" size={32} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Processing Booking</h3>
                        <p className="text-gray-500">Please wait while the shop confirms your request...</p>
                      </div>
                      {/* Simplified Waiting UI - removed OTP/Timer for cleaner look as per plan */}
                    </div>
                  )}

                  {confirmationStatus === "confirmed" && (
                    <div className="space-y-6">
                      <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
                        <Check size={48} className="text-green-600" strokeWidth={3} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h3>
                        <p className="text-gray-500">Redirecting to payment in a moment...</p>
                      </div>
                    </div>
                  )}

                  {confirmationStatus === "declined" && (
                    <div className="space-y-6">
                      <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle size={48} className="text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Booking Declined</h3>
                        <p className="text-gray-500">The shop is currently unavailable. Please try again later.</p>
                      </div>
                      <button
                        onClick={() => setConfirmationStatus("idle")}
                        className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && isAuthenticated && (
              <div className="max-w-xl mx-auto animate-fade-in-up">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                  <div className="bg-gray-50 p-6 border-b border-gray-200 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <h2 className="text-4xl font-black text-gray-900">₹{calculateTierPayment()}</h2>
                  </div>

                  <div className="p-8">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-8 flex items-start gap-3">
                      <Clock className="text-orange-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="font-bold text-orange-800 text-sm">Complete Payment in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p>
                        <p className="text-xs text-orange-600 mt-1">Booking will be cancelled if payment is not completed.</p>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                        <AlertCircle size={16} /> {paymentError}
                      </div>
                    )}

                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full bg-black hover:bg-zinc-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                      {processing ? (
                        <span className="loader"></span>
                      ) : (
                        <>
                          <Lock size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                          Pay Securely
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
                      <Shield size={12} /> Secured by Razorpay
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="mt-6 w-full text-center text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Cancel Payment & Go Back
                </button>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Summary Panel (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            {/* Booking Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Booking Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Service Type</span>
                  <span className="font-bold text-gray-900">{selectedAppointmentType?.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Services</span>
                  <span className="font-bold text-gray-900">{selectedServices.length} Selected</span>
                </div>
              </div>

              {selectedServices.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
                  {providerDetails?.services?.filter(s => selectedServices.includes(s.id)).map(s => (
                    <div key={s.id} className="flex justify-between text-xs">
                      <span className="text-gray-600">{s.name}</span>
                      <span className="font-medium text-gray-900">{s.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span>₹{providerDetails?.services?.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + parseInt(s.price.replace(/\D/g, '')), 0) + (selectedAppointmentType?.id === "4" ? 100 : 0)}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 text-center">
                Full refund available if cancelled 1 hour before.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAppointment;

