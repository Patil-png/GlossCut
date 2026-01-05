import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Gift, Circle, Star, Crown, Diamond, AlertTriangle,
  RefreshCw, Clock, IndianRupee
} from 'lucide-react';
import { format } from "date-fns";

// Define priority mapping for appointment types outside the component
const appointmentTypePriorities = {
  "Black Premium": 4,
  "Premium": 3,
  "Basic": 2,
  "Free": 1,
};

// Define priority mapping for appointment statuses
const appointmentStatusPriorities = {
  "completed": 0, // Completed appointments have the lowest priority
  "cancelled": 0, // Cancelled appointments also have lowest priority, similar to completed
  "Pending (Demo)": 1, // Demo appointments should appear with other active appointments
  "confirmed": 1, // Confirmed appointments have higher priority
  "Pending": 1, // Regular pending appointments have higher priority
  // Add other statuses here with appropriate priorities, default is 1 for non-completed/non-cancelled
};

const getAppointmentTypePriority = (type) => appointmentTypePriorities[type] || 0;
const getAppointmentStatusPriority = (status) => appointmentStatusPriorities[status] ?? 1;

const QueueStatus = ({ barberId, showPreviewPosition = false, previewAppointmentType = null, previewCustomerInfo = {} }) => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Ensure date is consistent for comparison by using today
  const effectiveDate = format(new Date(), "yyyy-MM-dd");

  const sortAppointments = (appointments) => {
    return [...appointments].sort((a, b) => {
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
  };

  const [barberAppointments, setBarberAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayedAppointments, setDisplayedAppointments] = useState([]);
  const [demoAppointmentId, setDemoAppointmentId] = useState(null);

  const fetchBarberAppointments = useCallback(async () => {
    if (!barberId) {
      console.log(
        "QueueStatus: Barber ID is missing. Cannot fetch appointments."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(
        "QueueStatus: Attempting to fetch appointments with:"
      );
      console.log("  barberId:", barberId);
      console.log("  date:", effectiveDate);

      // Use the website endpoint for queue status (no auth required, same logic as mobile Appointmentcheckpage)
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/website/barber-queue/${barberId}`,
        {
          params: { date: effectiveDate },
        }
      );
      setBarberAppointments(Array.isArray(response.data) ? response.data : []);
      console.log(
        "QueueStatus: API response for appointments:",
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error(
        "QueueStatus: Failed to fetch barber appointments:",
        error.response?.data || error.message
      );
      // Don't show alert for public endpoint failures, just log
      console.log("Failed to load queue. Backend may be unavailable.");
    } finally {
      setLoading(false);
    }
  }, [barberId, effectiveDate]);

  useEffect(() => {
    if (!isLoading && barberId) {
      fetchBarberAppointments();
    } else if (!isLoading && !barberId) {
      console.log(
        "QueueStatus: Cannot fetch appointments. Barber ID is missing.",
        { barberId }
      );
      setLoading(false);
    }
  }, [barberId, isLoading, effectiveDate, fetchBarberAppointments]);

  useEffect(() => {
    let combinedAppointments = [...barberAppointments];
    let actualUserBooking = null;

    if (user) {
      // Check if user already has a booking (not a demo) and get their actual position
      actualUserBooking = barberAppointments.find(
        (apt) => apt.userId?._id === user._id && !apt.isDemo
      );

      if (actualUserBooking) {
        // User has an actual booking, find its position in the priority-sorted list
        const sortedActualAppointments = sortAppointments(barberAppointments);
        setDisplayedAppointments(sortedActualAppointments);
        setDemoAppointmentId(null);
        return;
      }
    }

    // If no actual booking and preview mode is enabled, add preview appointment
    if (showPreviewPosition && previewAppointmentType && previewCustomerInfo.name) {
      const previewAppointment = {
        _id: 'preview-customer',
        userId: { _id: 'preview-user', name: previewCustomerInfo.name },
        customerName: previewCustomerInfo.name,
        appointmentType: previewAppointmentType.name,
        status: 'Pending (Preview)',
        time: new Date().toTimeString().slice(0, 5),
        totalPrice: '0',
        isPreview: true
      };
      combinedAppointments.push(previewAppointment);
    }

    // Filter out appointments with "Payment Pending" status
    const filteredAppointments = combinedAppointments.filter(
      (appointment) => appointment.status !== "Payment Pending"
    );
    // Sort the combined list (including potential demo/preview) by priority and then by time
    const sortedCombinedAppointments = sortAppointments(filteredAppointments);
    setDisplayedAppointments(sortedCombinedAppointments);
  }, [barberAppointments, demoAppointmentId, user, showPreviewPosition, previewAppointmentType, previewCustomerInfo]);

  // --- UI Logic Functions ---
  const getAppointmentTypeIcon = (appointmentType) => {
    let IconComponent;
    let color;
    let size = 12; // Adjusted size for mobile

    switch (appointmentType) {
      case "Free":
        IconComponent = Gift;
        color = '#94a3b8'; // slate-400
        break;
      case "Basic":
        IconComponent = Circle;
        color = '#22d3ee'; // cyan-400
        break;
      case "Premium":
        IconComponent = Star;
        color = '#facc15'; // yellow-400
        size = 13;
        break;
      case "Black Premium":
        IconComponent = Crown;
        color = '#fbbf24'; // amber-400
        size = 14;
        break;
      default:
        IconComponent = Diamond;
        color = '#94a3b8';
    }
    return <IconComponent size={size} color={color} className="shrink-0" />;
  };

  const getStatusDisplay = (status) => {
    // Revised colors for dark mode aesthetic
    let statusClasses = "bg-slate-800 text-slate-400";
    let statusText = status;

    switch (status) {
      case 'confirmed':
        statusClasses = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        statusText = 'Confirmed';
        break;
      case 'Pending':
      case 'Pending (Demo)':
        statusClasses = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        statusText = 'Waiting';
        break;
      case 'Pending (Preview)':
        statusClasses = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        statusText = 'Preview';
        break;
      case 'completed':
        statusClasses = "bg-slate-700/50 text-slate-400 border border-slate-600/30";
        statusText = 'Done';
        break;
      case 'cancelled':
        statusClasses = "bg-red-500/10 text-red-400 border border-red-500/20";
        statusText = 'Cancelled';
        break;
      default:
        statusClasses = "bg-slate-800 text-slate-400 border border-slate-700";
        statusText = status || 'N/A';
    }

    return { statusClasses, statusText };
  };

  if (loading) {
    return (
      <div className="min-h-0 bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold animate-pulse">Updating Queue...</p>
      </div>
    );
  }

  // Display an error message if barberId is missing
  if (!barberId) {
    return (
      <div className="min-h-0 bg-slate-950 text-slate-200 font-sans">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
             <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">Missing Information</h2>
          <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mb-6">We couldn't find the barber details to display the queue.</p>
          <button
            onClick={() => navigate('/all-services-search')}
            className="px-6 py-2.5 bg-slate-100 text-slate-900 hover:bg-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 pb-safe-area">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 h-14 px-4 flex items-center justify-between supports-[backdrop-filter]:bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Live Queue</h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               Real-time updates
            </p>
          </div>
        </div>
        <button
          onClick={fetchBarberAppointments}
          className="p-2 bg-slate-900 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-4 max-w-lg mx-auto">
        {/* Empty State */}
        {displayedAppointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 md:py-20 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-2xl">
               <Gift className="w-8 h-8 text-indigo-500/50" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Queue is Empty</h2>
            <p className="text-xs text-slate-500 max-w-[200px]">No active appointments for today. Be the first to book a slot!</p>
          </div>
        )}

        {/* Appointments List */}
        {displayedAppointments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Today's List</h2>
                <span className="text-[10px] font-medium text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                    {displayedAppointments.length} Active
                </span>
            </div>

            {displayedAppointments.map((appointment, index) => {
              const customerNameDisplay = appointment.isOfflineBooking
                ? appointment.customerName || "Offline Customer"
                : appointment.userId?.name || `Customer ${index + 1}`;

              const isCurrentUser = appointment.userId?._id === user?._id && !appointment.isDemo;
              const isDemoAppointment = appointment.isDemo;
              const isPreviewAppointment = appointment.isPreview;
              // High priority check logic remains same, just used for styling if needed
              // const isHighPriority = getAppointmentTypePriority(appointment.appointmentType) >= 3;

              const { statusClasses, statusText } = getStatusDisplay(appointment.status);

              return (
                <div
                  key={appointment._id}
                  className={`relative group overflow-hidden rounded-2xl transition-all duration-200 ${
                    isCurrentUser
                      ? 'bg-slate-900 ring-1 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                      : isDemoAppointment
                        ? 'bg-slate-900 ring-1 ring-amber-500/50'
                        : isPreviewAppointment
                          ? 'bg-gradient-to-r from-emerald-900/20 to-teal-900/20 ring-1 ring-emerald-500/50 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                          : 'bg-slate-900/40 border border-white/5'
                  }`}
                >
                  {/* Current User Indicator Strip */}
                  {isCurrentUser && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600"></div>
                  )}

                  <div className={`p-3 ${isCurrentUser ? 'pl-4' : ''}`}>
                    <div className="flex items-start gap-3">
                      
                      {/* Left: Queue Number Badge */}
                      <div className="shrink-0 flex flex-col items-center gap-1">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner ${
                             isCurrentUser ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 border border-white/5'
                         }`}>
                            {index + 1}
                         </div>
                         <div className="text-[10px] text-slate-600 font-mono">#{appointment._id.slice(-4)}</div>
                      </div>

                      {/* Middle: Info */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className={`text-sm font-semibold truncate ${
                                    isCurrentUser ? 'text-white' : 'text-slate-200'
                                }`}>
                                    {customerNameDisplay}
                                    {(isCurrentUser || isDemoAppointment) && <span className="text-[10px] font-normal text-slate-500 ml-1">(You)</span>}
                                    {isPreviewAppointment && <span className="text-[10px] font-normal text-emerald-400 ml-1">(Your Position)</span>}
                                </h3>
                                {isCurrentUser && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                {isPreviewAppointment && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                             </div>
                             {/* Status Badge */}
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusClasses}`}>
                                {statusText}
                             </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-y-1 gap-x-3 text-xs text-slate-400">
                           <div className="flex items-center gap-1">
                              {getAppointmentTypeIcon(appointment.appointmentType)}
                              <span className="text-[11px] font-medium">{appointment.appointmentType}</span>
                           </div>
                           <div className="w-0.5 h-2.5 bg-slate-700 rounded-full"></div>
                           <div className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-500" />
                              <span className="text-slate-300 font-medium font-mono tracking-tight">{appointment.time || "--:--"}</span>
                           </div>
                           <div className="w-0.5 h-2.5 bg-slate-700 rounded-full"></div>
                           <div className="flex items-center gap-0.5">
                              <IndianRupee size={11} className="text-slate-500" />
                              <span className="text-slate-300 font-medium">{appointment.totalPrice || "0"}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Bottom Gradient Overlay for scrolling */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-20"></div>
    </div>
  );
};

export default QueueStatus;
