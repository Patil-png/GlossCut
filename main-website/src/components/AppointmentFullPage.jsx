import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Star, 
  User, Phone, Mail, MessageSquare, 
  CheckCircle2, AlertCircle, Sparkles, 
  CreditCard, Shield, ArrowRight, Gift,
  Circle, Crown, Diamond, Users, Zap, CalendarDays
} from 'lucide-react';

const AppointmentFullPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    barberId, 
    date, 
    time, 
    services, 
    totalPrice, 
    failedAppointmentType 
  } = location.state || {};

  const [barberAppointments, setBarberAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremiumAvailable, setIsPremiumAvailable] = useState(false);
  const [demoAppointments, setDemoAppointments] = useState(null);

  useEffect(() => {
    if (!barberId || !date) {
      navigate('/all-services-search');
      return;
    }
    
    fetchBarberAppointments();
    checkPremiumAvailability();
  }, [barberId, date, navigate]);

  const fetchBarberAppointments = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/barber-appointments/${barberId}`,
        {
          params: { date },
        }
      );
      setBarberAppointments(response.data);
    } catch (error) {
      console.error("Failed to fetch barber appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPremiumAvailability = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/check-premium-availability/${barberId}`,
        {
          params: { date },
        }
      );
      setIsPremiumAvailable(response.data.type === 'premium' && response.data.count > 0);
    } catch (error) {
      console.error("Failed to check premium availability:", error);
    }
  };

  const getAppointmentTypeIcon = (appointmentType) => {
    switch (appointmentType) {
      case "Free":
        return <Gift size={20} color="#6c757d" className="mr-2" />;
      case "Basic":
        return <Circle size={20} color="#17a2b8" className="mr-2" />;
      case "Premium":
        return <Star size={20} color="#ffc107" className="mr-2" />;
      case "Express":
        return <Crown size={20} color="#ffd700" className="mr-2" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleBookBlackPremium = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/booking`,
        {
          barberId,
          services,
          totalPrice,
          date,
          time,
          appointmentType: "Express",
        }
      );
      navigate('/booking-success', { state: { bookingId: res.data._id } });
    } catch (err) {
      console.error("Failed to create booking", err.response?.data || err.message);
      alert(`Failed to create booking: ${err.response?.data?.msg || err.message}. Please try again.`);
    }
  };

  const handleShowDemo = () => {
    const priority = ["Basic"];
    let bookingToCancel = null;
    let appointments = [...barberAppointments];

    for (const type of priority) {
      const bookings = appointments.filter(
        (booking) => booking.appointmentType === type
      );
      if (bookings.length > 0) {
        bookingToCancel = bookings[bookings.length - 1];
        break;
      }
    }

    if (bookingToCancel) {
      appointments = appointments.filter(
        (booking) => booking._id !== bookingToCancel._id
      );
    }

    const newBooking = {
      _id: "newBooking",
      userId: { name: "You" },
      appointmentType: "Express",
      date: date,
      time: time,
      totalPrice: totalPrice,
      status: "confirmed",
    };

    const blackPremiumAppointments = appointments.filter(
      (booking) => booking.appointmentType === "Express"
    );
    const insertIndex = blackPremiumAppointments.length;

    appointments.splice(insertIndex, 0, newBooking);
    setDemoAppointments(appointments);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1F6FEB] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading appointments...</p>
        </div>
      </div>
    );
  }

  const displayAppointments = demoAppointments || barberAppointments;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/booking-appointment')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Barber Fully Booked</h1>
            <p className="text-gray-400">Check appointment queue and alternatives</p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">Fully Booked</h2>
              <p className="text-gray-300">
                The barber is fully booked for the <strong>{failedAppointmentType}</strong> appointment type today. 
                Please consider booking a different type or try another day.
              </p>
            </div>
          </div>
        </div>

        {/* Premium Message */}
        {isPremiumAvailable && (
          <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Diamond className="w-6 h-6 text-[#FFD700] mt-1" />
              <div>
                <h3 className="text-lg font-bold text-[#FFD700] mb-2">Premium Option Available</h3>
                <p className="text-gray-300">
                  However, you can book an Express appointment to get a spot in the queue.
                  This will cancel the last booked 'Basic' appointment for You.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Appointments */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#1F6FEB]" />
            Today's Appointments
          </h3>
          
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 p-3 border-b border-white/20 font-semibold text-sm text-gray-400">
            <div>Customer</div>
            <div>Date & Time</div>
            <div>Amount</div>
            <div>Status</div>
          </div>

          {/* Appointments List */}
          <div className="space-y-2">
            {displayAppointments.length > 0 ? (
              displayAppointments.map((appointment) => {
                const customerName = appointment.isOfflineBooking
                  ? appointment.customerName || "Offline Customer"
                  : appointment.userId?.name || "Online Customer";

                return (
                  <div 
                    key={appointment._id} 
                    className="grid grid-cols-4 gap-4 p-3 border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center">
                      {getAppointmentTypeIcon(appointment.appointmentType)}
                      <span>{customerName}</span>
                    </div>
                    <div>
                      {appointment.date ? formatDate(appointment.date) : 'N/A'} at {appointment.time || "N/A"}
                    </div>
                    <div>₹{appointment.totalPrice || "N/A"}</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-500/20 text-green-400'
                          : appointment.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {appointment.status || "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isPremiumAvailable && (
          <div className="space-y-4">
            <button
              onClick={handleBookBlackPremium}
              className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-yellow-500/40 transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-6 h-6" />
              Book Express
            </button>
            
            <button
              onClick={handleShowDemo}
              className="w-full py-3 bg-[#0f172a]/40 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              Show Demo
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/booking-appointment')}
            className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all"
          >
            ← Back to Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentFullPage;
