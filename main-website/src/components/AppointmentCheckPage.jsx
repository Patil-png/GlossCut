import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Gift, Circle, Star, Crown, Diamond,
  RefreshCw, Clock, IndianRupee, User, CheckCircle2,
  AlertTriangle, Sparkles, Scissors
} from 'lucide-react';
import { format } from 'date-fns';

// --- LOGIC CONSTANTS ---
const appointmentTypePriorities = {
  "Express": 4,
  Basic: 2,
};

const appointmentStatusPriorities = {
  completed: 0,
  cancelled: 0,
  "Pending (Demo)": 1,
  confirmed: 1,
  Pending: 1,
};

const getAppointmentTypePriority = (type) => appointmentTypePriorities[type] || 0;
const getAppointmentStatusPriority = (status) => appointmentStatusPriorities[status] ?? 1;

const AppointmentCheckPage = () => {
  const { theme } = { theme: { dark: false, colors: { background: '#f9fafb', text: '#111827', textSecondary: '#6b7280', primary: '#2563eb', border: '#e5e7eb', card: '#ffffff' } } };
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- DATA EXTRACTION ---
  const {
    barberId,
    barberData,
    services,
    totalPrice,
    date,
    time,
    selectedAppointmentType,
  } = location.state || {};

  const effectiveDate = useMemo(() =>
    date || format(new Date(), "yyyy-MM-dd"),
    [date]
  );

  // --- SORTING LOGIC ---
  const sortAppointments = useCallback((appointments) => {
    return [...appointments].sort((a, b) => {
      const statusAPriority = getAppointmentStatusPriority(a.status);
      const statusBPriority = getAppointmentStatusPriority(b.status);
      if (statusAPriority !== statusBPriority)
        return statusBPriority - statusAPriority;

      const typeAPriority = getAppointmentTypePriority(a.appointmentType);
      const typeBPriority = getAppointmentTypePriority(b.appointmentType);
      if (typeAPriority !== typeBPriority) return typeBPriority - typeAPriority;

      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });
  }, []);

  const [barberAppointments, setBarberAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- FETCH APPOINTMENTS ---
  const fetchBarberAppointments = useCallback(async () => {
    if (!barberId || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/barber-appointments/${barberId}`,
        {
          headers: { "x-auth-token": token },
          params: { date: effectiveDate },
          timeout: 10000,
        }
      );

      const data = Array.isArray(response.data) ? response.data : [];
      setBarberAppointments(data);
    } catch (error) {
      console.error("Queue Sync Error:", error);
      let errorMsg = "Could not sync the queue.";
      if (error.message === "Network Error" || !error.response) {
        errorMsg = "Internet seems to be offline.";
      }
      setError(errorMsg);
      if (barberAppointments.length === 0) setBarberAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [barberId, token, effectiveDate, barberAppointments.length]);

  useEffect(() => {
    if (barberId && token) {
      fetchBarberAppointments();
    } else {
      setLoading(false);
    }
  }, [barberId, token, fetchBarberAppointments]);

  // --- MEMOIZED QUEUE CALCULATION ---
  const { displayedAppointments, overallQueuePosition } = useMemo(() => {
    let combinedAppointments = [...barberAppointments];
    let userIndex = null;
    let actualUserBooking = null;

    if (user) {
      actualUserBooking = barberAppointments.find(
        (apt) => apt.userId?._id === user._id && !apt.isDemo
      );
    }

    // Logic to insert Demo User if needed
    if (
      !actualUserBooking &&
      selectedAppointmentType &&
      services &&
      totalPrice &&
      date &&
      time &&
      user
    ) {
      const stableDemoId = `demo-${user._id}-${selectedAppointmentType}-${date}-${time}`;
      const mockAppointment = {
        _id: stableDemoId,
        userId: { _id: user._id, name: user.name || "You (Demo)" },
        appointmentType: selectedAppointmentType,
        services: services,
        totalPrice: totalPrice,
        date: date,
        time: time,
        isDemo: true,
        status: "Pending (Demo)",
      };

      if (!combinedAppointments.some((apt) => apt._id === stableDemoId)) {
        combinedAppointments.push(mockAppointment);
      }
    }

    const filteredAppointments = combinedAppointments.filter(
      (appointment) => appointment.status !== "Payment Pending"
    );

    const sorted = sortAppointments(filteredAppointments);

    if (user) {
      const targetId = actualUserBooking
        ? user._id
        : `demo-${user._id}-${selectedAppointmentType}-${date}-${time}`;
      const foundIndex = sorted.findIndex(
        (apt) => apt._id === targetId || apt.userId?._id === user._id
      );
      userIndex = foundIndex !== -1 ? foundIndex + 1 : null;
    }

    return {
      displayedAppointments: sorted,
      overallQueuePosition: userIndex,
    };
  }, [
    barberAppointments,
    user,
    selectedAppointmentType,
    services,
    totalPrice,
    date,
    time,
    sortAppointments,
  ]);

  // --- UI HELPERS ---
  const getAppointmentTypeIcon = (appointmentType) => {
    let IconComponent;
    let color;
    let size = 14;

    switch (appointmentType) {
      case "Free":
        IconComponent = Gift;
        color = theme.colors.text;
        break;
      case "Basic":
        IconComponent = Circle;
        color = theme.colors.textSecondary;
        break;
      case "Premium":
        IconComponent = Star;
        color = "#F59E0B";
        size = 16;
        break;
      case "Express":
        IconComponent = Crown;
        color = theme.colors.text;
        size = 16;
        break;
      default:
        IconComponent = Diamond;
        color = theme.colors.primary;
    }
    return (
      <IconComponent size={size} color={color} style={{ marginRight: 6 }} />
    );
  };

  const getStatusDisplay = (status) => {
    let statusColor = "#64748B";
    let statusBgColor = "#F1F5F9";
    let statusText = status;

    switch (status) {
      case "confirmed":
        statusColor = "#15803d";
        statusBgColor = "#dcfce7";
        statusText = "Confirmed";
        break;
      case "Pending":
      case "Pending (Demo)":
        statusColor = "#b45309";
        statusBgColor = "#fef3c7";
        statusText = "Waiting";
        break;
      case "completed":
        statusColor = "#64748B";
        statusBgColor = "#F1F5F9";
        statusText = "Completed";
        break;
      case "cancelled":
        statusColor = "#b91c1c";
        statusBgColor = "#fee2e2";
        statusText = "Cancelled";
        break;
    }

    return (
      <div
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: theme.dark ? "transparent" : statusBgColor,
          backgroundColor: theme.dark ? "rgba(255,255,255,0.08)" : statusBgColor,
          gap: 6,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: statusColor,
          }}
        />
        <span
          style={{
            color: theme.dark ? "#e2e8f0" : statusColor,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          {statusText}
        </span>
      </div>
    );
  };

  // --- RENDER ITEM ---
  const renderAppointmentItem = useCallback(
    ({ item, index }) => {
      let formattedTime = item.time || "N/A";
      const customerNameDisplay = item.isOfflineBooking
        ? item.customerName || "In-Store Customer"
        : item.userId?.name || `Guest #${index + 1}`;

      const isCurrentUser = item.userId?._id === user?._id && !item.isDemo;
      const isDemoAppointment = item.isDemo;
      const isMe = isCurrentUser || isDemoAppointment;

      const cardColors = isMe
        ? theme.dark ? [theme.colors.primary, "#4338ca"] : ["#eff6ff", "#e0e7ff"]
        : theme.dark ? [theme.colors.card, theme.colors.card] : ["#ffffff", "#ffffff"];

      const cardBorderColor = isMe
        ? theme.colors.primary
        : theme.dark ? "rgba(255,255,255,0.05)" : "#e2e8f0";

      return (
        <div style={{ flexDirection: "row", marginBottom: 0, minHeight: 110 }}>
          <div style={{ width: 40, alignItems: "center", marginRight: 12 }}>
            <div style={{ width: 2, flex: 1, borderRadius: 1, backgroundColor: isMe ? theme.colors.primary : theme.colors.border, opacity: 0.4 }} />
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 3,
              position: "absolute",
              top: 24,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
              backgroundColor: isMe ? theme.colors.primary : theme.dark ? "#334155" : "#cbd5e1",
              borderColor: theme.colors.background,
              transform: [{ scale: isMe ? 1.2 : 1 }],
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: "800",
                color: isMe ? "#fff" : theme.colors.textSecondary
              }}>
                {index + 1}
              </span>
            </div>
          </div>

          <div style={{
            flex: 1,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: isMe ? 1.5 : 1,
            borderColor: cardBorderColor,
            backgroundColor: cardColors[0],
          }}>
            <div style={{ gap: 12 }}>
              <div style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: isMe ? theme.colors.primary + "20" : theme.colors.background,
                  }}>
                    <User size={16} color={isMe ? theme.colors.primary : theme.colors.textSecondary} />
                  </div>
                  <div>
                    <div style={{ flexDirection: "row", alignItems: "center" }}>
                      <span style={{
                        fontSize: 16,
                        fontWeight: "700",
                        maxWidth: 140,
                        color: theme.colors.text
                      }} numberOfLines={1}>
                        {isMe ? "You" : customerNameDisplay}
                      </span>
                      {isMe && (
                        <div style={{
                          backgroundColor: theme.colors.primary,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginLeft: 6,
                        }}>
                          <span style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>ME</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                      {getAppointmentTypeIcon(item.appointmentType)}
                      <span style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: theme.colors.textSecondary
                      }}>
                        {item.appointmentType}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ alignItems: "flex-end" }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.colors.text
                  }}>
                    {formattedTime}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: theme.colors.textSecondary,
                    marginTop: 2
                  }}>
                    Estimated
                  </span>
                </div>
              </div>

              <div style={{
                height: 1,
                width: "100%",
                backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "#f1f5f9"
              }} />

              <div style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                {getStatusDisplay(item.status)}
                {item.totalPrice && (
                  <span style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.colors.text
                  }}>
                    ₹{item.totalPrice}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [theme, user, displayedAppointments.length]
  );

  if (loading) {
    return (
      <div style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span style={{
          color: theme.colors.text,
          marginTop: 16,
          fontWeight: "600"
        }}>
          Syncing Queue...
        </span>
      </div>
    );
  }

  if (!barberId) {
    return (
      <div style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "#fee2e2",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <AlertTriangle size={32} color="#ef4444" />
        </div>
        <span style={{
          fontSize: 22,
          fontWeight: "800",
          color: theme.colors.text,
          marginBottom: 10,
          textAlign: "center"
        }}>
          Details Unavailable
        </span>
        <span style={{
          fontSize: 16,
          color: theme.colors.textSecondary,
          textAlign: "center",
          marginBottom: 30,
        }}>
          We couldn't retrieve the provider's schedule info.
        </span>
        <button
          onClick={() => navigate('/all-services-search')}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary,
          }}
        >
          <span style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      backgroundColor: theme.colors.background,
    }}>
      {/* 1. HEADER */}
      <div style={{
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <div style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            alignSelf: "flex-start",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 20,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#ef4444",
              marginRight: 6,
            }} />
            <span style={{
              fontSize: 10,
              fontWeight: "800",
              color: "#ef4444",
              letterSpacing: 0.5,
            }}>
              LIVE UPDATES
            </span>
          </div>
          <span style={{
            fontSize: 26,
            fontWeight: "800",
            color: theme.colors.text,
            letterSpacing: -0.5,
          }}>
            Today's Queue
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: "500",
            color: theme.colors.textSecondary,
            marginTop: 2,
          }}>
            {format(new Date(effectiveDate), "EEEE, d MMMM")}
          </span>
        </div>
        <button
          onClick={() => {
            fetchBarberAppointments();
            // Show toast
          }}
          style={{
            padding: 12,
            borderRadius: 16,
            backgroundColor: theme.dark ? "#1e293b" : "#f1f5f9",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <RefreshCw size={20} color={theme.colors.text} />
        </button>
      </div>

      {/* 2. THE GOLDEN TICKET (USER SUMMARY) */}
      {selectedAppointmentType && (
        <div style={{
          paddingHorizontal: 24,
          marginBottom: 25,
          marginTop: 5,
        }}>
          <div style={{
            borderRadius: 24,
            overflow: "hidden",
            position: "relative",
            zIndex: 2,
            backgroundColor: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          }}>
            <div style={{
              position: "absolute",
              top: -50,
              left: -50,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: "rgba(255,255,255,0.1)",
            }} />
            <Sparkles size={80} color="#fff" style={{
              position: "absolute",
              right: -20,
              top: -20,
              opacity: 0.15,
            }} />

            <div style={{ padding: 24, paddingBottom: 20 }}>
              <div style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}>
                <div style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}>
                  <span style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}>
                    ENTRY TICKET
                  </span>
                </div>
              </div>

              <div style={{ alignItems: "center", marginTop: 5 }}>
                <span style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 2,
                  marginBottom: 4,
                }}>
                  CURRENT POSITION
                </span>
                <span style={{
                  color: "#ffffff",
                  fontSize: 64,
                  fontWeight: "800",
                  lineHeight: 70,
                  letterSpacing: -2,
                  textShadowColor: "rgba(0,0,0,0.2)",
                  textShadowOffset: { width: 0, height: 4 },
                  textShadowRadius: 10,
                }}>
                  {overallQueuePosition !== null ? String(overallQueuePosition).padStart(2, "0") : "--"}
                </span>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginTop: 4,
                }}>
                  <span style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: "600"
                  }}>
                    People ahead: {overallQueuePosition ? overallQueuePosition - 1 : 0}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              height: 24,
              position: "relative",
              backgroundColor: "transparent",
              overflow: "hidden",
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                position: "absolute",
                left: -12,
                top: 0,
                backgroundColor: theme.colors.background,
                zIndex: 10,
              }} />
              <div style={{
                width: "84%",
                height: 1,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                borderStyle: "dashed",
                borderRadius: 1,
              }} />
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                position: "absolute",
                right: -12,
                top: 0,
                backgroundColor: theme.colors.background,
                zIndex: 10,
              }} />
            </div>

            <div style={{
              padding: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: "rgba(0,0,0,0.1)",
            }}>
              <div style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Clock size={16} color="#fff" />
                </div>
                <div>
                  <span style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}>
                    TIME
                  </span>
                  <span style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "700",
                    maxWidth: 70,
                  }} numberOfLines={1}>
                    {time}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <IndianRupee size={16} color="#fff" />
                </div>
                <div>
                  <span style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}>
                    AMOUNT
                  </span>
                  <span style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "700",
                  }}>
                    {totalPrice}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Scissors size={16} color="#fff" />
                </div>
                <div>
                  <span style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}>
                    SERVICE
                  </span>
                  <span style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "700",
                    maxWidth: 70,
                  }} numberOfLines={1}>
                    {selectedAppointmentType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN LIST */}
      <div style={{
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: theme.dark ? "#0f172a" : "#f8fafc",
        overflow: "hidden",
      }}>
        <div style={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 160, // Increased bottom padding for button
        }}>
          {displayedAppointments.length === 0 ? (
            <div style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}>
              <span style={{
                fontSize: 22,
                fontWeight: "800",
                color: theme.colors.text,
                marginBottom: 8,
              }}>
                Queue is Clear
              </span>
              <span style={{
                textAlign: "center",
                maxWidth: 260,
                lineHeight: 22,
                fontSize: 15,
                color: theme.colors.textSecondary,
              }}>
                No bookings yet for today. Be the first to book a slot!
              </span>
            </div>
          ) : (
            <div>
              <div style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: "800",
                  letterSpacing: 1,
                  opacity: 0.6,
                  color: theme.colors.textSecondary,
                }}>
                  UPCOMING APPOINTMENTS
                </span>
                <div style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: theme.dark ? "#334155" : "#e2e8f0",
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: theme.colors.text
                  }}>
                    {displayedAppointments.length}
                  </span>
                </div>
              </div>

              {displayedAppointments.map((item, index) => (
                <div key={item._id}>
                  {renderAppointmentItem({ item, index })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Proceed Button */}
      <div className="fixed bottom-6 left-6 right-6 bg-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50">
        <div>
          <p className="text-white text-sm font-semibold opacity-90">Ready to book?</p>
          <p className="text-white text-xl font-bold">₹{totalPrice?.toFixed(2)}</p>
        </div>
        <button
          onClick={() => navigate('/booking-confirmation-waiting', {
            state: {
              barberData,
              services,
              totalPrice,
              date,
              time,
              selectedAppointmentType,
            }
          })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <span>Proceed to Book</span>
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">→</span>
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          position: "absolute",
          top: 100,
          left: 20,
          right: 20,
          backgroundColor: "#fee2e2",
          borderRadius: 12,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 10,
        }}>
          <AlertTriangle size={20} color="#ef4444" style={{ marginRight: 12 }} />
          <span style={{ color: "#b91c1c", fontWeight: "600", flex: 1 }}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
};

export default AppointmentCheckPage;
