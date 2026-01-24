import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import QueueStatus from "./QueueStatus";
import {
  ArrowLeft,
  Crown,
  Scissors,
  Check,
  AlertCircle,
  Shield,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  Star,
  CreditCard,
  Lock,
} from "lucide-react";

// --- PREMIUM VINTAGE STYLES ---
const Styles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=Caveat:wght@500;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap');
      
      :root {
        --leather-primary: #3E2723;
        --leather-secondary: #281815;
        --leather-highlight: #5D4037;
        --gold-light: #F9E79F;
        --gold-mid: #D4AF37;
        --gold-dark: #886F28;
        --paper-bg: #F3E5AB;
        --ink-color: #2C1E16;
        --stamp-red: #D32F2F;
      }

      body {
        background-color: #1a120e;
        font-family: 'Playfair Display', serif;
        overflow-x: hidden;
        color: #e5e5e5;
      }

      /* --- TEXTURES & SURFACES --- */
      .mahogany-desk {
        background-color: #1a120e;
        background-image: 
          radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent 70%),
          url("https://www.transparenttextures.com/patterns/wood-pattern.png");
        min-height: 100vh;
      }

      .leather-texture {
        background-color: var(--leather-primary);
        background-image: url("https://www.transparenttextures.com/patterns/black-leather.png");
        box-shadow: 
          inset 0 0 80px rgba(0,0,0,0.8),
          0 20px 50px rgba(0,0,0,0.6);
        position: relative;
        border-radius: 4px;
      }
      
      .stitch-border {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        border: 2px dashed #6d4c41;
        border-radius: 4px;
        pointer-events: none;
        box-shadow: 0 1px 0 rgba(255,255,255,0.1);
      }

      .gold-foil-text {
        background: linear-gradient(to bottom, var(--gold-light) 0%, var(--gold-mid) 40%, var(--gold-dark) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        font-family: 'Cinzel', serif;
        letter-spacing: 0.05em;
      }

      /* --- COMPONENTS --- */
      .gold-spine {
        width: 12px;
        background: linear-gradient(to right, #6b5321, #f9e79f, #886f28, #4a3812);
        border-radius: 6px;
        box-shadow: inset 0 0 2px rgba(0,0,0,0.5), 2px 0 5px rgba(0,0,0,0.4);
        position: relative; z-index: 10;
      }

      .leather-patch-btn {
        background: linear-gradient(145deg, #4a302a, #36221d);
        border: 1px solid #5d4037;
        border-radius: 12px;
        position: relative;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        overflow: hidden;
      }
      .leather-patch-btn::after {
        content: ''; position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px;
        border: 1px dashed #6d4c41; border-radius: 8px;
        box-shadow: 0 1px 0 rgba(255,255,255,0.05);
      }
      .leather-patch-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.4); border-color: var(--gold-mid); }
      .leather-patch-btn.selected {
        border-color: var(--gold-light);
        box-shadow: 0 0 0 1px var(--gold-mid), 0 10px 20px rgba(0,0,0,0.5);
        background: linear-gradient(145deg, #3e2723, #281815);
      }
      .leather-patch-btn.selected .check-badge {
        background: linear-gradient(to bottom, var(--gold-light), var(--gold-mid));
        color: #281815;
      }

      .check-badge {
        position: absolute; top: 0; right: 0; width: 30px; height: 30px;
        background: #2a1b12; border-bottom-left-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        border-left: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);
        color: #555; transition: all 0.3s; z-index: 5;
      }

      .paper-scroll {
        background-color: var(--paper-bg);
        background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png");
        color: var(--ink-color);
        position: relative;
        box-shadow: inset 0 0 40px rgba(139, 69, 19, 0.1), -5px 0 15px rgba(0,0,0,0.2);
        --mask: linear-gradient(#000 0 0) 50% / calc(100% - 20px) 100% no-repeat,
                radial-gradient(farthest-side, #000 98%, #0000) 0 0/20px 20px round;
        -webkit-mask: var(--mask); mask: var(--mask);
      }
      
      .royal-seal {
        width: 70px; height: 70px;
        background: radial-gradient(circle at 35% 35%, #bf360c, #7f0000);
        border-radius: 50%; border: 4px solid #7f0000;
        box-shadow: inset 0 2px 5px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Cinzel', serif; font-weight: 700; color: rgba(0,0,0,0.4);
        font-size: 24px; text-shadow: 0 1px 0 rgba(255,255,255,0.2);
        transform: rotate(-10deg);
      }

      /* THE RED PENDING STAMP */
      .ink-stamp-pending {
        border: 3px solid var(--stamp-red);
        color: var(--stamp-red);
        font-family: 'Courier Prime', monospace;
        font-weight: bold;
        text-transform: uppercase;
        padding: 5px 15px;
        border-radius: 8px;
        transform: rotate(-15deg);
        opacity: 0.8;
        mix-blend-mode: multiply;
        font-size: 1.2rem;
        letter-spacing: 2px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-15deg);
        z-index: 20;
        mask-image: url("https://www.transparenttextures.com/patterns/black-felt.png");
      }
      
      /* Mobile Adjustment for Stamp */
      @media (max-width: 640px) {
        .ink-stamp-pending {
          font-size: 0.9rem;
          padding: 3px 8px;
          border-width: 2px;
        }
      }

      .script-font { font-family: 'Caveat', cursive; color: #1a237e; transform: rotate(-1deg); display: inline-block; }
      .typewriter-font { font-family: 'Courier Prime', monospace; color: #3e2723; }

      .embossed-input {
        background: rgba(0,0,0,0.2); border: none; border-bottom: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px; padding: 12px 16px; width: 100%; color: #e5e5e5;
        font-family: 'Playfair Display', serif;
        box-shadow: inset 1px 1px 3px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.05);
        transition: all 0.3s;
      }
      .embossed-input:focus { outline: none; background: rgba(0,0,0,0.3); border-bottom-color: var(--gold-mid); }

      .btn-gold-plate {
        background: linear-gradient(to bottom, #f9e79f 0%, #d4af37 50%, #886f28 100%);
        color: #281815; font-family: 'Cinzel', serif; font-weight: bold; text-transform: uppercase;
        letter-spacing: 0.1em; border: 1px solid #886f28;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 6px rgba(0,0,0,0.4);
        text-shadow: 0 1px 0 rgba(255,255,255,0.3); transition: all 0.2s;
      }
      .btn-gold-plate:hover { transform: translateY(-1px); filter: brightness(1.1); box-shadow: 0 6px 12px rgba(0,0,0,0.5); }
      .btn-gold-plate:disabled { filter: grayscale(1); opacity: 0.6; }

      .fade-in { animation: fadeIn 0.5s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .receipt-line { border-bottom: 1px dotted #8d6e63; padding-bottom: 4px; margin-bottom: 4px; }
      .receipt-grid { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
    `}
  </style>
);

const BookingAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const barberData = location.state?.barberData;
  const { isAuthenticated, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading] = useState(false);
  const [success] = useState(false);
  const [error] = useState("");
  const [providerDetails, setProviderDetails] = useState(null);

  // Booking confirmation waiting states
  const [confirmationStatus, setConfirmationStatus] = useState("idle"); // 'idle', 'creating', 'waiting', 'confirmed', 'declined', 'timeout', 'error'
  const [bookingId, setBookingId] = useState(null);
  const [waitingTime, setWaitingTime] = useState(0);
  const [, setTimeLeft] = useState(300); // 5 minutes countdown
  const [, setOtp] = useState(null);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Refs for timer management
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);

  const [ticketId] = useState(
    `TK-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [shopPhone, setShopPhone] = useState(() => {
    const phone =
      barberData?.phone ||
      barberData?.owner?.phone ||
      barberData?.contact ||
      barberData?.mobile;
    return phone || "Contact shop for details";
  });

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
        setCurrentStep(6);
      }, 1000);

      return () => clearTimeout(paymentTimer);
    }
  }, [confirmationStatus]);

  // Timer logic for payment countdown
  useEffect(() => {
    if (currentStep === 6 && bookingId) {
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

  const calculateRemainingAmount = useCallback(() => {
    return Math.max(0, calculateTotalPrice() - calculateTierPayment());
  }, [calculateTotalPrice, calculateTierPayment]);

  const startPolling = useCallback(
    (bookingId) => {
      const pollInterval = setInterval(async () => {
        try {
          const headers = {
            "Content-Type": "application/json",
          };

          if (isAuthenticated && user?.token) {
            headers["x-auth-token"] = user.token;
          }

          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`,
            { headers }
          );

          const booking = response.data;
          setWaitingTime((prev) => prev + 3);
          setTimeLeft((prev) => Math.max(0, prev - 3));

          if (booking.status === "confirmed") {
            setConfirmationStatus("confirmed");
            clearInterval(pollInterval);
          } else if (
            booking.status === "declined" ||
            booking.status === "cancelled"
          ) {
            setConfirmationStatus("declined");
            clearInterval(pollInterval);
          }

          if (waitingTime >= 297) {
            clearInterval(pollInterval);
            setConfirmationStatus("timeout");
          }
        } catch (err) {
          console.error("Failed to check booking status:", err);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    },
    [isAuthenticated, user, waitingTime, setTimeLeft]
  );

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
    setCurrentStep(2);
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
        setOtp(response.data.otp);
        setConfirmationStatus("waiting");
        startPolling(response.data._id);
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
    startPolling,
    providerDetails,
    setOtp,
  ]);

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    setCurrentStep(5);
    await createBookingForConfirmation();
  };

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError("");

    try {
      if (timerRef.current) clearInterval(timerRef.current);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const paymentResponse = {
        success: true,
        transactionId: "txn_" + Date.now(),
        amount: calculateTotalPrice(),
        method: paymentMethod,
      };

      if (bookingId) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/booking/update-payment/${bookingId}`,
          {
            paymentStatus: "completed",
            paymentMethod: paymentMethod,
            transactionId: paymentResponse.transactionId,
            paymentAmount: calculateTierPayment(),
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      navigate("/booking-success", {
        state: {
          paymentData: paymentResponse,
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
          barberData,
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
          selectedAppointmentType,
          customerInfo,
          totalPrice: calculateTotalPrice(),
        },
      });
    } catch (err) {
      console.error("Payment failed:", err);
      setPaymentError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!barberData) return null;

  if (success) {
    return (
      <div className="min-h-screen mahogany-desk flex items-center justify-center p-4">
        <Styles />
        <div className="paper-scroll max-w-md w-full text-center p-8 md:p-12 rounded relative">
          <div className="royal-seal mx-auto mb-6">PAID</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 font-serif text-[#3e2723]">
            Confirmed
          </h1>
          <p className="text-[#5d4037] mb-8 font-serif italic">
            Your booking is secured in the ledger.
          </p>

          <div className="text-left mb-8 p-6 border border-[#8d6e63] bg-[#fff8e1]/50 typewriter-font text-sm">
            <p className="mb-2">
              <strong>REF:</strong> {ticketId}
            </p>
            <p className="mb-2">
              <strong>SERVICE:</strong> {selectedAppointmentType?.name}
            </p>
            <p className="mb-2">
              <strong>DATE:</strong>{" "}
              {formatDate(new Date().toISOString().split("T")[0])}
            </p>
            <p>
              <strong>BARBER:</strong> {barberData.name}
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="text-[#3e2723] border-b-2 border-[#3e2723] pb-1 hover:text-[#5d4037] font-bold uppercase tracking-widest text-sm"
          >
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mahogany-desk pb-20 overflow-x-hidden">
      <Styles />
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={() => navigate("/all-services-search")}
            className="group flex items-center gap-3 text-[#d4af37] hover:text-[#f9e79f] transition-colors"
          >
            <div className="w-10 h-10 border border-[#886f28] rounded-full flex items-center justify-center bg-[#281815] group-hover:bg-[#3e2723]">
              <ArrowLeft size={18} />
            </div>
            <span className="font-cinzel font-bold text-sm tracking-widest hidden md:inline">
              Return
            </span>
          </button>
        </div>

        {/* MAIN BOOKING CONTAINER - Stack on Mobile, Row on Desktop */}
        <div className="flex flex-col lg:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.9)] rounded-xl overflow-hidden min-h-0 lg:min-h-[750px] mb-8 lg:mb-0">
          {/* LEFT: Leather Panel (Menu) */}
          <div className="w-full lg:w-7/12 leather-texture p-4 md:p-8 lg:p-12 relative z-10 flex flex-col order-1">
            <div className="stitch-border"></div>

            {/* Header */}
            <div className="relative z-10 mb-6 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl lg:text-4xl gold-foil-text mb-2">
                Service Ledger
              </h2>
              <div className="w-20 md:w-32 h-1 bg-gradient-to-r from-[#d4af37] to-transparent mx-auto lg:mx-0"></div>
            </div>

            {/* Step Indicator - Mobile Optimized */}
            <div className="relative z-10 mb-8">
              <div className="flex justify-center items-center gap-2 md:gap-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div key={step} className="flex items-center shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step === currentStep
                          ? "bg-[#d4af37] border-[#d4af37] text-[#281815]"
                          : step < currentStep
                            ? "bg-[#5d4037] border-[#5d4037] text-[#f3e5ab]"
                            : "border-[#5d4037] text-[#5d4037]"
                        }`}
                    >
                      {step}
                    </div>
                    {step < 6 && (
                      <div
                        className={`w-4 md:w-8 h-0.5 mx-1 md:mx-2 transition-all ${step < currentStep ? "bg-[#d4af37]" : "bg-[#5d4037]"
                          }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <p className="text-[#a1887f] text-xs md:text-sm font-cinzel">
                  {currentStep === 1 && "Select Service Type"}
                  {currentStep === 2 && "Check Queue Position"}
                  {currentStep === 3 && "Choose Services"}
                  {currentStep === 4 && "Enter Details"}
                  {currentStep === 5 && "Confirm Booking"}
                  {currentStep === 6 && "Complete Payment"}
                </p>
              </div>
            </div>

            {/* Step 1: Type Selection */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10 fade-in h-auto">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleAppointmentTypeSelect(type)}
                    className={`leather-patch-btn p-4 md:p-6 text-left group flex flex-col justify-between ${selectedAppointmentType?.id === type.id ? "selected" : ""
                      }`}
                  >
                    <div className="check-badge">
                      {selectedAppointmentType?.id === type.id ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#5d4037]"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-[#d4af37] mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        <type.icon size={28} className="md:w-8 md:h-8" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-serif text-[#f3e5ab] mb-2">
                        {type.name}
                      </h3>
                      <p className="text-[#a1887f] text-xs md:text-sm leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-6 pt-4 border-t border-[#5d4037]/50 flex justify-between items-center">
                      <span className="text-[#d4af37] font-cinzel text-xs uppercase">
                        {type.priceIndicator}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-[#a1887f] group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Queue */}
            {currentStep === 2 && (
              <div className="relative z-10 fade-in h-full flex flex-col">
                <div className="bg-[#281815] border border-[#5d4037] rounded-lg p-4 md:p-6 mb-8 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl gold-foil-text">
                      Queue Position
                    </h3>
                  </div>
                  <div className="bg-black/40 rounded p-2 md:p-4 border border-[#3e2723]">
                    <QueueStatus
                      barberId={barberData?.owner?._id}
                      showPreviewPosition={true}
                      previewAppointmentType={selectedAppointmentType}
                      previewCustomerInfo={customerInfo}
                    />
                  </div>
                </div>

                <div className="mt-auto flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 md:px-6 py-4 text-[#a1887f] hover:text-[#f3e5ab] font-cinzel text-xs md:text-sm uppercase tracking-widest border border-transparent hover:border-[#5d4037] rounded transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="btn-gold-plate flex-1 py-4 rounded shadow-lg text-sm md:text-base"
                  >
                    View Services
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <div className="relative z-10 fade-in h-full flex flex-col">
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 md:space-y-4 mb-8 custom-scrollbar max-h-[50vh] lg:max-h-none">
                  {providerDetails?.services?.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`leather-patch-btn p-3 md:p-4 cursor-pointer flex justify-between items-center group ${isSelected ? "selected" : ""
                          }`}
                      >
                        <div className="check-badge">
                          {isSelected ? <Check size={14} /> : null}
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-2">
                          <div
                            className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded flex items-center justify-center border transition-colors ${isSelected
                                ? "border-[#d4af37] bg-[#3e2723]"
                                : "border-[#5d4037] bg-[#281815]"
                              }`}
                          >
                            <Scissors
                              size={16}
                              className={`md:w-[18px] md:h-[18px] ${isSelected ? "text-[#d4af37]" : "text-[#5d4037]"
                                }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4
                              className={`text-base md:text-lg font-serif truncate ${isSelected ? "text-[#f3e5ab]" : "text-[#d7ccc8]"
                                }`}
                            >
                              {service.name}
                            </h4>
                            <p className="text-[10px] md:text-xs text-[#a1887f] truncate">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-[#d4af37] font-cinzel text-base md:text-lg mr-6 md:mr-8 whitespace-nowrap">
                          {service.price}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-auto flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 md:px-6 py-4 text-[#a1887f] hover:text-[#f3e5ab] font-cinzel text-xs md:text-sm uppercase tracking-widest border border-transparent hover:border-[#5d4037] rounded transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    disabled={selectedServices.length === 0}
                    className="btn-gold-plate flex-1 py-4 rounded shadow-lg text-sm md:text-base"
                  >
                    Details
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Details Form */}
            {currentStep === 4 && (
              <form
                onSubmit={handleCustomerInfoSubmit}
                className="relative z-10 fade-in h-full flex flex-col"
              >
                <div className="space-y-4 md:space-y-6 mb-8">
                  <div>
                    <input
                      type="text"
                      required
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value,
                        })
                      }
                      className="embossed-input"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <input
                      type="tel"
                      required
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        })
                      }
                      className="embossed-input"
                      placeholder="Telephone"
                    />
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      className="embossed-input"
                      placeholder="Email Address"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      value={customerInfo.notes}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          notes: e.target.value,
                        })
                      }
                      className="embossed-input resize-none"
                      placeholder="Special Requests..."
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-red-400 mb-4 text-sm bg-red-900/20 p-2 border border-red-900/50 rounded flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <div className="mt-auto flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 md:px-6 py-4 text-[#a1887f] hover:text-[#f3e5ab] font-cinzel text-xs md:text-sm uppercase tracking-widest border border-transparent hover:border-[#5d4037] rounded transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold-plate flex-1 py-4 rounded shadow-lg text-sm md:text-base"
                  >
                    {loading ? "Processing..." : "Review"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 5: Booking Confirmation Waiting */}
            {currentStep === 5 && (
              <div className="relative z-10 fade-in h-full flex flex-col items-center justify-center text-center py-8 lg:py-0">
                <div className="leather-patch-btn w-full max-w-md p-6 md:p-8 flex flex-col items-center border-[#d4af37]">
                  {(confirmationStatus === "creating" ||
                    confirmationStatus === "waiting") && (
                      <>
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-[#5d4037] flex items-center justify-center mb-6 relative">
                          <div className="absolute inset-0 rounded-full border-t-4 border-[#d4af37] animate-spin"></div>
                          <Clock
                            size={32}
                            className="text-[#d4af37] md:w-10 md:h-10"
                          />
                        </div>

                        <h3 className="text-xl md:text-2xl gold-foil-text mb-2">
                          Requesting Audience
                        </h3>
                        <p className="text-[#a1887f] font-serif italic mb-2 text-sm md:text-base">
                          Dispatching courier to {barberData.name}...
                        </p>
                        <p className="text-[#d4af37] text-xs md:text-sm font-mono tracking-wider mb-6">
                          Contact: {shopPhone}
                        </p>
                      </>
                    )}

                  {(confirmationStatus === "declined" ||
                    confirmationStatus === "timeout" ||
                    confirmationStatus === "error") && (
                      <>
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-red-900/50 bg-[#281815] flex items-center justify-center mb-6">
                          <AlertCircle
                            size={40}
                            className="text-red-800 md:w-12 md:h-12"
                          />
                        </div>

                        <h3 className="text-xl md:text-2xl text-red-800 font-serif font-bold mb-2 uppercase tracking-widest">
                          {confirmationStatus === "declined"
                            ? "Request Declined"
                            : "Connection Lost"}
                        </h3>
                        <p className="text-[#a1887f] font-serif italic mb-8 text-sm md:text-base">
                          {confirmationStatus === "declined"
                            ? "The barber is currently unavailable for this slot."
                            : "The telegraph line has gone silent."}
                        </p>

                        <button
                          onClick={() => navigate("/all-services-search")}
                          className="btn-gold-plate px-8 py-3 rounded text-sm w-full"
                        >
                          Select Different Barber
                        </button>
                      </>
                    )}
                </div>

                <div className="mt-8 flex items-center gap-2 text-[#5d4037] opacity-60">
                  <Shield size={12} />
                  <span className="text-[10px] uppercase tracking-widest typewriter-font">
                    Secure Channel:{" "}
                    {bookingId ? bookingId.slice(-6).toUpperCase() : "INIT..."}
                  </span>
                </div>
              </div>
            )}

            {/* Step 6: Payment */}
            {currentStep === 6 && isAuthenticated && (
              <div className="relative z-10 fade-in h-full flex flex-col">
                <div className="max-w-2xl mx-auto w-full px-2 md:px-4">
                  {countdown > 0 && countdown <= 60 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-3">
                      <Clock className="w-5 h-5 md:w-6 md:h-6 text-orange-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-orange-400 font-semibold text-sm md:text-base">
                          Complete payment in
                        </p>
                        <p className="text-orange-300 text-xs md:text-sm">
                          00:{countdown < 10 ? `0${countdown}` : countdown} to
                          secure slot
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Barber & Service Summary */}
                  <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={
                          barberData.image ||
                          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
                        }
                        alt={barberData.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm md:text-base truncate">
                          {barberData.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                          <Star className="w-3 h-3 md:w-4 md:h-4 fill-[#FFB703] text-[#FFB703]" />
                          <span>{barberData.rating?.toFixed(1) || "4.5"}</span>
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{barberData.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3 border-t border-white/10 pt-4">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-400">Appointment Type:</span>
                        <span className="truncate ml-2">
                          {selectedAppointmentType?.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-400">Services:</span>
                        <span>{selectedServices?.length || 0} selected</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-400">Date:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-400">Time:</span>
                        <span>{new Date().toTimeString().slice(0, 5)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-lg font-semibold">
                        Advance Payment
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-[#FFB703]">
                        ₹{calculateTierPayment().toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 mt-2">
                      Remaining ₹{calculateRemainingAmount().toFixed(2)} to be
                      paid at the barber
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-bold mb-4">
                      Payment Method
                    </h3>

                    <div className="space-y-3">
                      {["card", "upi", "netbanking"].map((method) => (
                        <label
                          key={method}
                          className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-[#1F6FEB] focus:ring-[#1F6FEB] w-4 h-4 md:w-5 md:h-5"
                          />
                          {method === "card" && (
                            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-[#1F6FEB] flex-shrink-0" />
                          )}
                          {method === "upi" && (
                            <div className="w-5 h-5 md:w-6 md:h-6 bg-[#1F6FEB] rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">
                                U
                              </span>
                            </div>
                          )}
                          {method === "netbanking" && (
                            <div className="w-5 h-5 md:w-6 md:h-6 bg-[#1F6FEB] rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">
                                ₹
                              </span>
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base">
                              {method === "card"
                                ? "Credit/Debit Card"
                                : method === "upi"
                                  ? "UPI"
                                  : "Net Banking"}
                            </p>
                            <p className="text-xs md:text-sm text-gray-400">
                              {method === "card"
                                ? "Visa, Mastercard, RuPay"
                                : method === "upi"
                                  ? "PhonePe, GPay, Paytm"
                                  : "All major banks"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
                    <Shield className="w-5 h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm md:text-base text-green-400">
                        Secure Payment
                      </p>
                      <p className="text-xs md:text-sm text-green-300">
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 mb-6">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{paymentError}</span>
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={processing || countdown === 0}
                    className="w-full py-4 bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 md:w-5 md:h-5" />
                        Pay ₹{calculateTotalPrice().toFixed(2)}
                      </>
                    )}
                  </button>

                  <p className="text-[10px] md:text-xs text-gray-500 text-center mt-4 px-2">
                    By clicking Pay, you agree to our Terms of Service and
                    Privacy Policy
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MIDDLE: Gold Rod Binding (Hidden on mobile) */}
          <div className="gold-spine hidden lg:block h-auto"></div>

          {/* RIGHT: Detailed Paper Receipt (Stacks at bottom on mobile) */}
          <div className="w-full lg:w-5/12 paper-scroll p-6 md:p-8 lg:p-12 relative flex flex-col order-2">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div className="text-left">
                <h2 className="text-[#3e2723] font-bold text-xl md:text-2xl tracking-widest uppercase font-cinzel">
                  {barberData.name}
                </h2>
                <div className="flex items-center gap-2 text-[#5d4037] text-xs typewriter-font mt-1">
                  <MapPin size={12} /> {barberData.address}
                </div>
                <div className="flex items-center gap-2 text-[#5d4037] text-xs typewriter-font mt-1">
                  <Phone size={12} /> {shopPhone}
                </div>
              </div>
              <div className="text-right">
                <div className="border border-[#3e2723] p-1 px-2 inline-block">
                  <p className="typewriter-font font-bold text-[10px] md:text-xs uppercase">
                    Ticket No.
                  </p>
                  <p className="typewriter-font text-base md:text-lg text-[#800000]">
                    {ticketId}
                  </p>
                </div>
                <p className="typewriter-font text-[10px] text-[#5d4037] mt-1 text-right">
                  Status: Awaiting Payment
                </p>
              </div>
            </div>

            {/* Date/Time Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 border-b-2 border-[#3e2723] pb-4 relative z-10">
              <div>
                <p className="font-bold text-[#3e2723] uppercase text-xs tracking-widest">
                  Date
                </p>
                <p className="typewriter-font text-base md:text-lg">
                  {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#3e2723] uppercase text-xs tracking-widest">
                  Time
                </p>
                <p className="typewriter-font text-base md:text-lg">
                  {selectedAppointmentType?.name || "Select Service"}
                </p>
              </div>
            </div>

            {/* Client Details */}
            <div className="space-y-2 mb-6 relative z-10">
              <div className="receipt-grid receipt-line">
                <span className="font-bold text-[#3e2723] uppercase text-xs">
                  Client Name
                </span>
                <span className="typewriter-font text-xs md:text-sm">
                  {customerInfo.name || "Guest"}
                </span>
              </div>
              <div className="receipt-grid receipt-line">
                <span className="font-bold text-[#3e2723] uppercase text-xs">
                  Phone
                </span>
                <span className="typewriter-font text-xs md:text-sm">
                  {customerInfo.phone || "---"}
                </span>
              </div>
              <div className="receipt-grid receipt-line">
                <span className="font-bold text-[#3e2723] uppercase text-xs">
                  Email
                </span>
                <span className="typewriter-font text-xs md:text-sm truncate max-w-[120px] md:max-w-[150px]">
                  {customerInfo.email || "---"}
                </span>
              </div>
            </div>

            {/* Services Table */}
            <div className="flex-1 relative z-10">
              <div className="bg-[#e8dac0] p-1 mb-2 border-b border-[#3e2723] flex justify-between text-xs font-bold uppercase text-[#3e2723]">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="space-y-3 min-h-[100px] md:min-h-[120px]">
                {selectedServices.length > 0 ? (
                  providerDetails?.services
                    ?.filter((s) => selectedServices.includes(s.id))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex justify-between items-end text-[#3e2723] receipt-line"
                      >
                        <span className="typewriter-font text-xs md:text-sm">
                          {s.name}
                        </span>
                        <span className="typewriter-font font-bold text-xs md:text-sm">
                          {s.price}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="script-font text-lg md:text-xl opacity-50 text-center mt-4">
                    Selection pending...
                  </p>
                )}
              </div>

              {/* Notes Area */}
              {customerInfo.notes && (
                <div className="mt-4 p-2 border border-dashed border-[#8d6e63] bg-[#fff8e1]/60">
                  <p className="text-[10px] uppercase text-[#5d4037] font-bold">
                    Notes:
                  </p>
                  <p className="script-font text-base md:text-lg leading-tight">
                    {customerInfo.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-auto pt-4 relative z-10">
              {selectedAppointmentType && currentStep >= 1 && (
                <>
                  <div className="flex justify-between text-xs text-[#5d4037] mb-1">
                    <span>Booking Fee ({selectedAppointmentType.name})</span>
                    <span className="typewriter-font text-[#d4af37] font-bold">
                      ₹{calculateTierPayment().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#5d4037] mb-2">
                    <span>Service Amount</span>
                    <span className="typewriter-font">
                      ₹{calculateTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {!selectedAppointmentType && (
                <div className="flex justify-between text-xs text-[#5d4037] mb-1">
                  <span>Estimated Total</span>
                  <span className="typewriter-font">
                    ₹{calculateTotalPrice().toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-[#3e2723] pt-2 flex justify-between items-center relative">
                <span className="font-bold text-base md:text-xl text-[#3e2723] uppercase font-cinzel">
                  {selectedAppointmentType && currentStep >= 1
                    ? "Amount to Pay Now"
                    : "Select Service Type"}
                </span>
                <div className="text-right">
                  <span className="text-2xl md:text-3xl font-bold text-[#800000] font-mono tracking-wider">
                    ₹
                    {selectedAppointmentType && currentStep >= 1
                      ? calculateTierPayment().toFixed(2)
                      : "0.00"}
                  </span>
                </div>

                {/* PENDING STAMP OVERLAY */}
                {!success && calculateTotalPrice() > 0 && (
                  <div className="ink-stamp-pending">PAYMENT PENDING</div>
                )}
              </div>
              {selectedAppointmentType && currentStep >= 1 && (
                <div className="text-center mt-2">
                  <p className="text-[10px] text-[#5d4037] uppercase tracking-widest">
                    Remaining ₹{calculateRemainingAmount().toFixed(2)} to be
                    paid at the barber shop
                  </p>
                </div>
              )}
            </div>

            {/* Footer / Signature */}
            <div className="mt-6 md:mt-8 pt-4 border-t border-[#8d6e63] relative z-10">
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <img
                    src="/signature.png"
                    alt="Authorized Signature"
                    className="w-24 md:w-32 h-auto mb-1"
                  />
                  <p className="text-[10px] uppercase text-[#5d4037]">
                    Authorized Signature
                  </p>
                </div>
                <div
                  className={`royal-seal scale-75 border-[#3e2723] text-[#3e2723] opacity-60 ${success ? "text-[#800000] border-[#800000] opacity-90" : ""
                    }`}
                >
                  {success ? "PAID" : "OPEN"}
                </div>
              </div>
              <p className="text-center text-[10px] text-[#8d6e63] mt-4 uppercase typewriter-font">
                Thank you for your patronage
              </p>
            </div>

            {/* Decorative Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <Scissors size={150} className="md:w-[200px] md:h-[200px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAppointment;
