import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  // Try to recover barberData from LS if missing from state (for closed tab recovery)
  const [barberData] = useState(() => {
    const fromState = location.state?.barberData;
    if (fromState) return fromState;

    const saved = localStorage.getItem('pendingBarberData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only return if recent (< 30 mins) matching the pendingBooking logic
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return parsed.data;
        }
      } catch (e) {
        console.error("Failed to parse saved barber data", e);
      }
    }
    return null;
  });
  const { isAuthenticated, user, token } = useAuth();


  const [currentStep, setCurrentStep] = useState(1);

  const [providerDetails, setProviderDetails] = useState(null);

  // Booking confirmation waiting states
  const [confirmationStatus, setConfirmationStatus] = useState("idle"); // 'idle', 'creating', 'waiting', 'confirmed', 'declined', 'timeout', 'error'
  const [apiError, setApiError] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState({
    id: "2",
    name: "Basic Appointment",
    description: "Classic styling with standard queue priority.",
    priceIndicator: "Basic",
    priority: 2,
    icon: Scissors,
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE"
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Categorization states
  const [selectedGender, setSelectedGender] = useState("male");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("All");
  const [allCategories, setAllCategories] = useState([]);

  // Payment states
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [countdown, setCountdown] = useState(600);

  // Refs for timer management
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);
  const isRestoring = useRef(false);
  const [shopPhone, setShopPhone] = useState(() => {
    const phone =
      barberData?.phone ||
      barberData?.owner?.phone ||
      barberData?.contact ||
      barberData?.mobile;
    return phone || "Contact shop for details";
  });

  // Global Settings for Dynamic Pricing
  const [globalSettings, setGlobalSettings] = useState({
    basicAppointmentFee: 9,
    expressAppointmentFee: 19
  });

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings`);
        if (res.data) {
          setGlobalSettings(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch global settings", err);
      }
    };
    fetchGlobalSettings();
  }, []);

  const steps = [
    { number: 1, title: "Choose Services" },
    { number: 2, title: "Complete Payment" },
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
      // Persist barberData for refresh recovery
      localStorage.setItem('pendingBarberData', JSON.stringify({
        data: barberData,
        timestamp: Date.now()
      }));
      fetchProviderDetails();
    }
  }, [barberData, navigate, fetchProviderDetails]);

  // Fetch all categories for metadata (emojis/colors)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
        setAllCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Helper to get category metadata
  const getCatMeta = useCallback((catName) => {
    if (!catName) return { color: '#64748B', emoji: '💈', gender: 'unisex' };
    const found = allCategories.find(c => c.name === catName);
    if (found) return { color: found.color, emoji: found.emoji, gender: found.gender };
    return { color: '#64748B', emoji: '💈', gender: 'unisex' };
  }, [allCategories]);

  // Filter Categories by Gender
  const mainTabs = useMemo(() => {
    if (!providerDetails?.services) return ["All"];

    const servicesForGender = providerDetails.services.filter(s => {
      const meta = getCatMeta(s.category);
      return meta.gender === 'unisex' || meta.gender === selectedGender;
    });

    const cats = [...new Set(servicesForGender.map(s => s.category))]
      .filter(Boolean)
      .filter(cat => cat !== 'General');

    return ['All', ...cats.sort()];
  }, [providerDetails?.services, selectedGender, getCatMeta]);

  // Filter Services by Gender & Tab
  const filteredServices = useMemo(() => {
    if (!providerDetails?.services) return [];

    const genderMatched = providerDetails.services.filter(s => {
      const meta = getCatMeta(s.category);
      return meta.gender === 'unisex' || meta.gender === selectedGender;
    });

    if (selectedCategoryTab === 'All') return genderMatched;
    return genderMatched.filter(s => s.category === selectedCategoryTab);
  }, [providerDetails?.services, selectedCategoryTab, selectedGender, getCatMeta]);

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
        localStorage.removeItem('pendingSession'); // Clear persistent session
        navigate("/all-services-search");
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("Failed to cancel appointment. Please try again.");
      }
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    if (confirmationStatus === "confirmed") {
      // Background check successful, stay on Step 2 (which is now Payment)
      // No need to change Step, but could trigger UI reveal
    }
  }, [confirmationStatus]);

  // Timer logic for payment countdown
  useEffect(() => {
    if (currentStep === 2 && bookingId && confirmationStatus === 'confirmed') {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + 600 * 1000;
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
  }, [currentStep, bookingId, cancelBooking, confirmationStatus]);

  // --- Helper Functions ---
  const calculateTotalPrice = useCallback(() => {
    if (!providerDetails?.services) return 0;
    return providerDetails.services
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => {
        const price = parseFloat(service.price.toString().replace(/[^0-9.]/g, ""));
        return total + price;
      }, 0);
  }, [providerDetails?.services, selectedServices]);

  const getOpeningHours = useCallback(() => {
    if (!providerDetails?.operatingHours) return "07:00 - 21:00";

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = providerDetails.operatingHours[today];

    if (!hours || !hours.open || !hours.close) {
      return "Closed today";
    }

    return `${hours.open} - ${hours.close}`;
  }, [providerDetails?.operatingHours]);

  // Calculate tier-based payment amount
  const calculateTierPayment = useCallback(() => {
    if (!selectedAppointmentType) return 0;

    switch (selectedAppointmentType.id) {
      case "2": // Basic
        return globalSettings.basicAppointmentFee;
      case "4": // Express
        return globalSettings.expressAppointmentFee;
      default:
        return calculateTotalPrice(); // Fallback to full amount
    }
  }, [selectedAppointmentType, calculateTotalPrice, globalSettings]);

  useEffect(() => {
    // 1. Save FULL session state when waiting
    // Safeguard: Only save Step 3 or 4 if we HAVE a bookingId.
    // Also block saving while restoration is active to prevent race conditions.
    if (bookingId && barberData?.id && (confirmationStatus === 'waiting' || confirmationStatus === 'confirmed') && currentStep === 2 && !isRestoring.current) {
      const sessionData = {
        bookingId,
        barberData,
        selectedServices,
        selectedAppointmentType,
        customerInfo,
        currentStep: 2,
        paymentEndTime: endTimeRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem('pendingSession', JSON.stringify(sessionData));
    } else if (confirmationStatus === 'declined' || confirmationStatus === 'error') {
      localStorage.removeItem('pendingSession');
    }
  }, [confirmationStatus, bookingId, barberData, selectedServices, selectedAppointmentType, customerInfo, currentStep]);

  // 2. Comprehensive data restoration & sync on load
  useEffect(() => {
    const restoreSession = async () => {
      const saved = localStorage.getItem('pendingSession');
      if (!saved) return;

      isRestoring.current = true;
      try {
        const session = JSON.parse(saved);
        const { bookingId: savedId, barberData: savedBarber, timestamp } = session;

        // Check if valid, recent (< 30 mins), and same barber
        const isRecent = (Date.now() - timestamp) < 30 * 60 * 1000;

        if (savedId && isRecent && barberData?.id === savedBarber?.id) {
          console.log("Restoring full booking session:", savedId);

          // Restore Selections FIRST to prevent ₹0 display
          setSelectedServices(session.selectedServices || []);
          setSelectedAppointmentType(session.selectedAppointmentType || null);
          setCustomerInfo(session.customerInfo || { name: "", email: "", phone: "", notes: "" });

          setBookingId(savedId);

          // Handle direct restoration to payment step if valid
          if (session.currentStep === 2 && session.paymentEndTime > Date.now()) {
            endTimeRef.current = session.paymentEndTime;
            setConfirmationStatus('confirmed');
            setCurrentStep(2);
          } else {
            setConfirmationStatus('waiting');
            setCurrentStep(2);
          }

          // Force immediate status check
          try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/${savedId}`);
            if (res.data.status !== 'waiting' && res.data.status !== 'confirmed') {
              setConfirmationStatus(res.data.status);
              localStorage.removeItem('pendingSession');
            } else if (res.data.status === 'confirmed') {
              setConfirmationStatus('confirmed');
            }
          } catch (err) {
            console.error("Failed to sync restored booking status", err);
          }
        } else if (!isRecent) {
          localStorage.removeItem('pendingSession');
        }
      } catch (e) {
        console.error("Error parsing saved session", e);
        localStorage.removeItem('pendingSession');
      } finally {
        // Delay resetting the flag to ensure all state updates (Step 4) are processed
        setTimeout(() => {
          isRestoring.current = false;
        }, 1500);
      }
    };

    if (barberData?.id) {
      restoreSession();
    }
  }, [barberData?.id]);
  useEffect(() => {
    if (!bookingId || confirmationStatus !== 'waiting') return;

    let pollInterval;
    let socket;

    const handleUpdate = async (status) => {
      if (status === 'confirmed') setConfirmationStatus('confirmed');
      else if (status === 'declined' || status === 'cancelled') {
        try {
          // Fetch full booking details to get the cancellation reason
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`);
          setCancellationReason(res.data.cancellationReason || "The barber is unavailable at this time.");
          setConfirmationStatus('declined');
        } catch (err) {
          console.error("Failed to fetch cancellation reason", err);
          setCancellationReason("The barber is unavailable at this time.");
          setConfirmationStatus('declined');
        }
      }
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
              price: parseFloat(service.price.toString().replace(/[^0-9.]/g, "")),
              time: service.time || service.duration || "30",
            }
            : null;
        })
        .filter(Boolean);

      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      const barberId = barberData.barberId || barberData.owner?._id || barberData._id || barberData.id;

      const bookingData = {
        barberId,
        services,
        totalPrice: calculateTotalPrice(),
        date: currentDate,
        time: currentTime,
        appointmentType: selectedAppointmentType?.priceIndicator, // Use 'priceIndicator' (Basic/Express) instead of 'name'
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone
        }
      };

      const endpoint = isAuthenticated ? "/api/booking" : "/api/booking/public";
      const headers = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        headers["x-auth-token"] = token;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        bookingData,
        { headers }
      );

      if (response.data && response.data._id) {
        setBookingId(response.data._id);
        // Automate: Skip waiting for manual confirmation. 
        // Availability and slots were already checked in POST /api/booking.
        setConfirmationStatus("confirmed");
      } else {
        setConfirmationStatus("error");
      }
    } catch (err) {
      console.error("Booking creation failed:", err.response?.data || err.message);
      const msg = err.response?.data?.msg || err.response?.data?.message || "Booking creation failed";
      setApiError(msg);
      setConfirmationStatus("error");
    }
  }, [
    barberData,
    selectedServices,
    selectedAppointmentType,
    customerInfo,
    isAuthenticated,
    token,
    calculateTotalPrice,

    providerDetails,
  ]);

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    setCurrentStep(2); // Renumbered to 2
    await createBookingForConfirmation();
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError("");

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setPaymentError('Failed to load payment gateway. Please check your internet connection.');
        setProcessing(false);
        return;
      }

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
          receipt: `booking_${bookingId || Date.now()}`.trim()
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
        description: `Booking with ${barberData.name}`.replace(/[^\x20-\x7E]/g, '').trim(),
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
              localStorage.removeItem('pendingSession'); // Clear persistent session on success
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
                          ? { id: service.id, name: service.name, price: service.price, time: service.time || service.duration || "30" }
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
                    shopName: barberData.owner?.shopName || providerDetails?.shopName || barberData.shopName,
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
                        ? { id: service.id, name: service.name, price: service.price, time: service.time || service.duration || "30" }
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-12">
        {/* --- PREMIUM COMPACT HEADER --- */}
        <div className="mb-4 md:mb-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/40 shadow-xl p-5 md:p-7">
            {/* Decorative Gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl -mr-24 -mt-24" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-700 text-[9px] font-black uppercase tracking-[0.15em] mb-2.5 border border-green-500/10 backdrop-blur-sm shadow-sm animate-pulse-subtle">
                  <Crown size={12} className="mr-1.5" />
                  Premium Experience
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-3">
                  {barberData?.owner?.shopName || providerDetails?.shopName || "Book Appointment"}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-gray-500 text-xs md:text-sm font-medium">
                  <div className="flex items-center bg-gray-900/5 px-2.5 py-0.5 rounded-full border border-gray-900/5">
                    <MapPin size={14} className="mr-1.5 text-gray-400" />
                    {barberData?.owner?.address || barberData?.address || providerDetails?.address || "Location Unavailable"}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">
                      <Star size={12} className="mr-1 fill-orange-500 text-orange-500" />
                      {(providerDetails?.rating || barberData?.rating || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Quick Info Cards (Hidden on Mobile) */}
              <div className="hidden md:flex items-center gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 no-scrollbar">
                <div className="flex-1 md:flex-none flex flex-col justify-center min-w-[110px] md:min-w-[130px] p-3 rounded-xl bg-white/60 border border-white/60 shadow-sm backdrop-blur-md">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black text-gray-900">Open Now</span>
                  </div>
                </div>
                <div className="flex-1 md:flex-none flex flex-col justify-center min-w-[110px] md:min-w-[130px] p-3 rounded-xl bg-white/60 border border-white/60 shadow-sm backdrop-blur-md">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Schedule</p>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs font-black text-gray-900 line-clamp-1">{getOpeningHours()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">

            {/* --- FLOATING STEP COORDINATOR --- */}
            <div className="relative mb-6">
              <div className="inline-flex p-1.5 bg-gray-900/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-inner-lg">
                {steps.map((step, idx) => {
                  const isActive = step.number === currentStep;
                  const isCompleted = step.number < currentStep;

                  return (
                    <div key={idx} className="flex items-center">
                      <div
                        className={`
                          flex items-center gap-2.5 px-4 py-2 rounded-[1.25rem] transition-all duration-500 cursor-default
                          ${isActive
                            ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 scale-105'
                            : isCompleted
                              ? 'text-green-600 bg-green-500/10'
                              : 'text-gray-400 bg-transparent'
                          }
                        `}
                      >
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all
                          ${isActive ? 'bg-white text-gray-900 border-white' :
                            isCompleted ? 'bg-green-500 text-white border-green-500' :
                              'bg-transparent border-gray-300'}
                        `}>
                          {isCompleted ? <Check size={14} strokeWidth={4} /> : step.number}
                        </div>
                        <span className="text-xs font-black uppercase tracking-tighter hidden md:block">{step.title}</span>
                        {isActive && <span className="text-[10px] font-black uppercase tracking-tighter md:hidden">{step.title}</span>}
                      </div>

                      {idx < steps.length - 1 && (
                        <div className="mx-2 flex items-center gap-1 opacity-20">
                          <div className="w-1 h-1 rounded-full bg-gray-900" />
                          <div className="w-4 h-[2px] rounded-full bg-gray-900" />
                          <div className="w-1 h-1 rounded-full bg-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Step 1: Services */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up flex flex-col h-[700px]">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Select Services</h3>
                      <p className="text-sm text-gray-500">Choose from available treatments</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                      {selectedServices.length} Selected
                    </div>
                  </div>

                  {/* Gender Filter */}
                  <div className="flex bg-gray-200/50 p-1 rounded-xl mb-4">
                    {['male', 'female', 'unisex'].map(gen => (
                      <button
                        key={gen}
                        onClick={() => {
                          setSelectedGender(gen);
                          setSelectedCategoryTab('All'); // Reset tab on gender change
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${selectedGender === gen ? 'bg-white text-green-700 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                      >
                        {gen === 'male' ? '♂ Men' : gen === 'female' ? '♀ Women' : '✨ Unisex'}
                      </button>
                    ))}
                  </div>

                  {/* Category Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
                    {mainTabs.map(tab => {
                      const isActive = selectedCategoryTab === tab;
                      const meta = getCatMeta(tab === 'All' ? null : tab);
                      return (
                        <button
                          key={tab}
                          onClick={() => setSelectedCategoryTab(tab)}
                          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold whitespace-nowrap transition-all ${isActive ? `bg-gray-900 border-gray-900 text-white shadow-md` : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                          <span>{tab === 'All' ? '💈' : meta.emoji}</span>
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Scissors size={40} className="mb-2 opacity-20" />
                      <p className="font-medium text-sm">No services found in this category</p>
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      const meta = getCatMeta(service.category);
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          className={`group relative flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${isSelected
                            ? 'bg-green-50 border-green-500 shadow-sm ring-1 ring-green-500/20 z-10'
                            : 'bg-white border-gray-100 hover:border-green-200 hover:bg-gray-50'
                            }`}
                        >
                          {/* Color strip */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: meta.color }} />

                          <div className="flex items-center gap-3 md:gap-4 ml-2">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                              {isSelected ? <Check className="w-5 h-5" strokeWidth={3} /> : <span className="text-xl">{meta.emoji}</span>}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-sm md:text-base ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                  {service.name}
                                </h4>
                                {service.category && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 tracking-tighter">
                                    {service.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 line-clamp-1 md:line-clamp-none">
                                {service.time} min • Premium Service
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:gap-4">
                            <span className={`font-bold text-base md:text-lg ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                              {service.price}
                            </span>
                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300'
                              }`}>
                              {isSelected && <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" strokeWidth={4} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-4">
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed px-1 text-center">
                    By confirming, you agree to our <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-green-600 hover:underline">Terms</Link>.
                    We use your info for personalized services and GlossCut efficiency.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleCustomerInfoSubmit}
                      disabled={selectedServices.length === 0 || confirmationStatus === 'creating' || providerDetails?.isFullyBooked}
                      className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {confirmationStatus === 'creating' ? (
                        <span className="loader mr-2"></span>
                      ) : providerDetails?.isFullyBooked ? (
                        <>
                          <AlertCircle size={18} /> Fully Booked for Today
                        </>
                      ) : (
                        <>
                          Confirm & Book <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Confirmation & Payment */}
            {currentStep === 2 && (
              <div className="animate-fade-in-up">
                {/* 1. Background Verification State */}
                {(confirmationStatus === "creating" || confirmationStatus === "waiting") && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-center">
                    <div className="relative mx-auto w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="text-green-500 animate-pulse" size={32} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Verifying Slot Availability</h3>
                    <p className="text-gray-500">We're securing your spot with the barber. One moment...</p>
                  </div>
                )}

                {/* 2. Success / Payment State */}
                {confirmationStatus === "confirmed" && (
                  <div className="max-w-xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up">
                      <div className="bg-gray-50 p-6 border-b border-gray-200 text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                          <Check size={24} className="text-green-600" strokeWidth={3} />
                        </div>
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
                  </div>
                )}

                {/* 3. Declined State */}
                {confirmationStatus === "declined" && (
                  <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Booking Declined</h3>
                    <p className="text-gray-600 font-medium mb-4">Reason: <span className="text-red-600 italic">"{cancellationReason}"</span></p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl border border-gray-100 leading-relaxed mb-8">
                      We apologize for the inconvenience. You can try booking with another barber or a different time slot.
                    </p>
                    <button
                      onClick={() => navigate('/all-services-search')}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={18} /> Find Another Barber
                    </button>
                  </div>
                )}

                {/* 4. Error / Fully Booked State */}
                {confirmationStatus === "error" && (
                  <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
                    <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${apiError === "Fully booked" ? "bg-amber-100" : "bg-red-100"}`}>
                      <AlertCircle size={48} className={apiError === "Fully booked" ? "text-amber-600" : "text-red-600"} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      {apiError === "Fully booked" ? "Barber Fully Booked" : "Booking Failed"}
                    </h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                      {apiError === "Fully booked"
                        ? "While you were choosing services, the last slot for today was taken. Please explore other available barbers nearby!"
                        : "Something went wrong while creating your booking. This could be due to a network error or session timeout."}
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setConfirmationStatus("idle");
                          if (apiError === "Fully booked") {
                            navigate("/all-services-search");
                          } else {
                            setCurrentStep(1);
                          }
                        }}
                        className="px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors w-full"
                      >
                        {apiError === "Fully booked" ? "Search Other Barbers" : "Back to Services"}
                      </button>
                    </div>
                  </div>
                )}
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
                    <span className="text-gray-500">Total Service Cost</span>
                    <span>₹{providerDetails?.services?.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + parseInt(s.price.replace(/\D/g, '')), 0) + (selectedAppointmentType?.id === "4" ? 100 : 0)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg mt-3 border border-green-100">
                    <span className="text-green-800 font-bold text-sm">Amount to Pay Now</span>
                    <span className="text-green-700 font-black text-lg">₹{calculateTierPayment()}</span>
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

