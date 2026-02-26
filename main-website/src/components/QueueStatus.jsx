import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Gift, Circle, Star, Crown, Diamond, AlertTriangle,
  RefreshCw, Clock
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
    <div className="min-h-screen bg-[#FDFDFD] text-[#1C1C1E] selection:bg-[#22C55E]/20 pb-safe-area relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-gradient-to-br from-[#22C55E]/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-gradient-to-tr from-purple-500/5 to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Premium Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-100 h-16 px-5 flex items-center justify-between shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C1C1E] flex items-center justify-center shadow-lg shadow-gray-200">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-black tracking-tight text-[#1C1C1E] uppercase leading-none">Live Queue</h1>
              <p className="text-[9px] text-[#22C55E] font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                Syncing Live
              </p>
            </div>
          </div>
          <button
            onClick={fetchBarberAppointments}
            className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-full text-gray-400 hover:text-[#1C1C1E] hover:bg-white hover:shadow-md active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#22C55E]' : ''}`} />
          </button>
        </div>

        <div className="px-5 py-6 max-w-xl mx-auto space-y-6">
          {/* Empty State */}
          {displayedAppointments.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-white/50 backdrop-blur-xl rounded-[40px] flex items-center justify-center mb-6 border border-white shadow-[0_20px_40px_rgba(0,0,0,0.03)] scale-110">
                <Diamond className="w-10 h-10 text-gray-200" />
              </div>
              <h2 className="text-xl font-black text-[#1C1C1E] mb-2 uppercase tracking-tight">Queue is Empty</h2>
              <p className="text-sm text-gray-400 font-medium max-w-[240px] leading-relaxed">No active appointments for today. Be the first to book a slot!</p>
            </div>
          )}

          {/* Appointments List */}
          {displayedAppointments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Today's Schedule</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white bg-[#1C1C1E] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-gray-200">
                    {displayedAppointments.length} Active
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {displayedAppointments.map((appointment, index) => {
                  const customerNameDisplay = appointment.isOfflineBooking
                    ? appointment.customerName || "Offline Customer"
                    : appointment.userId?.name || `Customer ${index + 1}`;

                  const isCurrentUser = (appointment.userId?._id === user?._id && !appointment.isDemo) || appointment.isPreview;
                  const isDemoAppointment = appointment.isDemo;
                  const { statusClasses, statusText } = getStatusDisplay(appointment.status);

                  return (
                    <div
                      key={appointment._id}
                      className={`relative group overflow-hidden rounded-[32px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${isCurrentUser
                        ? 'bg-white border-2 border-[#1C1C1E] shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-10 scale-[1.02]'
                        : 'bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]'
                        }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Selection Highlight for User */}
                      {isCurrentUser && (
                        <div className="absolute top-0 right-0 p-4">
                          <div className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_10px_#22C55E]" />
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-center gap-4">

                          {/* Left: Queue Position with Ring */}
                          <div className="relative shrink-0">
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${isCurrentUser
                              ? 'bg-[#1C1C1E] text-white shadow-xl shadow-gray-400/20'
                              : 'bg-gray-50 text-gray-400 border border-gray-100'
                              }`}>
                              <span className="text-xs font-black uppercase tracking-tighter opacity-40 leading-none mb-0.5">Pos</span>
                              <span className="text-xl font-black leading-none">{index + 1}</span>
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -bottom-1 -right-1 bg-[#22C55E] text-white p-1 rounded-lg shadow-lg">
                                <Star size={8} fill="currentColor" strokeWidth={0} />
                              </div>
                            )}
                          </div>

                          {/* Middle: Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className={`text-[15px] font-black uppercase tracking-tight truncate ${isCurrentUser ? 'text-[#1C1C1E]' : 'text-gray-800'
                                  }`}>
                                  {customerNameDisplay}
                                </h3>
                                {(isCurrentUser || isDemoAppointment) && (
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isCurrentUser ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    You
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded-md bg-gray-50 border border-gray-100">
                                  {getAppointmentTypeIcon(appointment.appointmentType)}
                                </div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{appointment.appointmentType}</span>
                              </div>

                              <div className="flex items-center gap-1.5 bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-100/50">
                                <Clock size={10} className="text-gray-400" />
                                <span className="text-[10px] font-black text-[#1C1C1E] tabular-nums uppercase">{appointment.time || "--:--"}</span>
                              </div>

                              <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.15em] border ${statusClasses.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>

                          {/* Right: ID/Price */}
                          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 px-2">
                            <span className="text-[14px] font-black text-[#1C1C1E]">₹{appointment.totalPrice || "0"}</span>
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">#{appointment._id.slice(-4)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Gradient Overlays */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FDFDFD] to-transparent pointer-events-none z-20" />

      <style jsx>{`
        .pb-safe-area {
          padding-bottom: env(safe-area-inset-bottom);
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-bottom {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation-duration: 600ms;
          animation-fill-mode: both;
          animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
        }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-bottom-4 { animation-name: slide-in-bottom; }
      `}</style>
    </div>
  );
};

export default QueueStatus;
