import React, { useState, useEffect } from "react";
import axios from "axios";

const OverviewPage = () => {
  // ==========================================
  // LOGIC SECTION (UNCHANGED)
  // ==========================================
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverviewData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const timestamp = new Date().getTime();
      const results = {};

      try {
        const earningsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/earnings?t=${timestamp}`
        );
        results.earnings = earningsRes.data;
      } catch (err) {
        console.warn("Earnings API failed:", err.message);
        results.earnings = {
          totalBookings: 0,
          totalEarnings: 0,
          totalPlatformFees: 0,
          pendingBookingsCount: 0,
          appointmentTypes: [],
        };
      }

      try {
        const usersRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/users?t=${timestamp}`
        );
        results.users = usersRes.data || [];
      } catch (err) {
        console.warn("Users API failed:", err.message);
        results.users = [];
      }

      try {
        const bookingsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/bookings?t=${timestamp}`
        );
        results.bookings = bookingsRes.data || [];
      } catch (err) {
        console.warn("Bookings API failed:", err.message);
        results.bookings = [];
      }

      try {
        const reviewsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/reviews?t=${timestamp}`
        );
        results.reviews = reviewsRes.data || [];
      } catch (err) {
        console.warn("Reviews API failed:", err.message);
        results.reviews = [];
      }

      try {
        const adsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/ads?t=${timestamp}`
        );
        results.ads = adsRes.data || [];
      } catch (err) {
        console.warn("Ads API failed:", err.message);
        results.ads = [];
      }

      try {
        const tiersRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/listing-tiers?t=${timestamp}`
        );
        results.tiers = tiersRes.data || [];
      } catch (err) {
        console.warn("Listing tiers API failed:", err.message);
        results.tiers = [];
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyBookings = results.bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear &&
          booking.status === "completed"
        );
      });
      const monthlyBookingRevenue = monthlyBookings.reduce(
        (sum, booking) => sum + (booking.totalPrice || 0),
        0
      );

      const monthlyAds = results.ads.filter((ad) => {
        const adDate = new Date(ad.bookedAt);
        return (
          adDate.getMonth() === currentMonth &&
          adDate.getFullYear() === currentYear &&
          (ad.status === "active" || ad.status === "expired")
        );
      });
      const monthlyAdRevenue = monthlyAds.reduce(
        (sum, ad) => sum + (ad.price || 0),
        0
      );

      const monthlyTiers = results.tiers.filter((tier) => {
        const tierDate = new Date(tier.lockedAt);
        return (
          tierDate.getMonth() === currentMonth &&
          tierDate.getFullYear() === currentYear
        );
      });
      const monthlyTierRevenue = monthlyTiers.reduce(
        (sum, tier) => sum + (tier.tierDetails?.price || 0),
        0
      );

      const totalMonthlyRevenue =
        monthlyBookingRevenue + monthlyAdRevenue + monthlyTierRevenue;

      const data = {
        totalUsers: results.users.length,
        totalBookings: results.earnings.totalBookings || 0,
        completedBookings: results.bookings.filter(
          (b) => b.status === "completed"
        ).length,
        totalReviews: results.reviews.length,
        totalRevenue: results.earnings.totalEarnings || 0,
        platformFees: results.earnings.totalPlatformFees || 0,
        pendingBookings: results.earnings.pendingBookingsCount || 0,
        activeAds: results.ads.filter((ad) => ad.status === "active").length,
        totalAds: results.ads.length,
        listingTiers: results.tiers.length,
        recentBookings: results.bookings.slice(0, 5),
        recentReviews: results.reviews.slice(0, 3),
        appointmentTypes: results.earnings.appointmentTypes || [],
        monthlyRevenue: {
          total: totalMonthlyRevenue,
          bookings: monthlyBookingRevenue,
          ads: monthlyAdRevenue,
          tiers: monthlyTierRevenue,
        },
        hourlyBookings: calculateHourlyBookings(results.bookings),
      };

      setOverviewData(data);
    } catch (err) {
      console.error("Error fetching overview data:", err);
      setOverviewData({
        totalUsers: 0,
        totalBookings: 0,
        completedBookings: 0,
        totalReviews: 0,
        totalRevenue: 0,
        platformFees: 0,
        pendingBookings: 0,
        activeAds: 0,
        totalAds: 0,
        listingTiers: 0,
        recentBookings: [],
        recentReviews: [],
        appointmentTypes: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateHourlyBookings = (bookings) => {
    const hourlyStats = {};
    for (let hour = 0; hour <= 23; hour++) {
      let hourLabel =
        hour === 0
          ? "12 AM"
          : hour < 12
          ? `${hour} AM`
          : hour === 12
          ? "12 PM"
          : `${hour - 12} PM`;
      hourlyStats[hour] = {
        hour: hour,
        label: hourLabel,
        count: 0,
        percentage: 0,
      };
    }

    bookings.forEach((booking) => {
      if (booking.time !== undefined && booking.time !== null) {
        try {
          let hour;
          const timeStr = booking.time.toString().toLowerCase().trim();
          if (timeStr.includes(":")) {
            const timeParts = timeStr.split(":");
            hour = parseInt(timeParts[0]);
            if (timeStr.includes("pm") && hour !== 12) hour += 12;
            else if (timeStr.includes("am") && hour === 12) hour = 0;
          } else if (!isNaN(parseInt(timeStr))) {
            hour = parseInt(timeStr);
          } else {
            const hourMatch = timeStr.match(/(\d+)/);
            if (hourMatch) {
              hour = parseInt(hourMatch[1]);
              if (timeStr.includes("pm") && hour !== 12) hour += 12;
              else if (timeStr.includes("am") && hour === 12) hour = 0;
            }
          }
          if (hour >= 0 && hour <= 23 && hourlyStats[hour]) {
            hourlyStats[hour].count++;
          }
        } catch (error) {
          console.warn("Failed to parse booking time:", booking.time, error);
        }
      }
    });

    const totalBookings = Object.values(hourlyStats).reduce(
      (sum, hour) => sum + hour.count,
      0
    );
    const hourlyArray = Object.values(hourlyStats).map((hour) => ({
      ...hour,
      percentage:
        totalBookings > 0 ? ((hour.count / totalBookings) * 100).toFixed(1) : 0,
    }));
    return hourlyArray.sort((a, b) => b.count - a.count);
  };

  // ==========================================
  // UI COMPONENTS (PREMIUM STARTUP STYLE)
  // ==========================================

  // Custom Card Component with Hover Lift
  const StatCard = ({ title, value, subtext, icon, gradient, delay }) => (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-gray-100`}
    >
      <div
        className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20`}
      ></div>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
            {value}
          </h3>
          <p className="mt-2 text-xs font-medium px-2 py-1 rounded-full bg-gray-50 inline-block text-gray-600 border border-gray-100">
            {subtext}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transform transition-transform duration-300 group-hover:rotate-6`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  // Quick Action Tile
  const ActionTile = ({ icon, label, colorClass, borderClass, bgClass }) => (
    <button
      className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border ${borderClass} ${bgClass} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg w-full`}
    >
      <div
        className={`mb-3 text-3xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110`}
      >
        {icon}
      </div>
      <span className={`text-sm font-bold ${colorClass}`}>{label}</span>
    </button>
  );

  // Loading State - Premium Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-8 space-y-8 animate-pulse">
        <div className="h-12 w-1/3 bg-gray-200 rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (!overviewData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-xl border border-dashed border-gray-300 m-6">
        <div className="text-5xl mb-4">😵</div>
        <h2 className="text-xl font-bold text-gray-800">
          Something went wrong
        </h2>
        <p className="text-gray-500 mb-6">
          We couldn't load your dashboard data.
        </p>
        <button
          onClick={() => fetchOverviewData()}
          className="px-6 py-2 bg-black text-white rounded-full font-medium hover:shadow-lg transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Welcome back, here's what's happening today.
            </p>
          </div>

          <button
            onClick={() => fetchOverviewData(true)}
            disabled={refreshing}
            className={`
              flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/30 
              transition-all duration-300 hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
              ${
                refreshing
                  ? "bg-indigo-400"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600"
              }
            `}
          >
            {refreshing ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {refreshing ? "Syncing..." : "Refresh Data"}
          </button>
        </div>

        {/* Hero Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={overviewData.totalUsers.toLocaleString()}
            subtext="Active Accounts"
            gradient="from-blue-500 to-cyan-400"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Bookings Done"
            value={overviewData.completedBookings.toLocaleString()}
            subtext={`${overviewData.pendingBookings} Pending`}
            gradient="from-emerald-500 to-teal-400"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overviewData.platformFees)}
            subtext="Platform Fees"
            gradient="from-violet-600 to-fuchsia-500"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Reviews"
            value={overviewData.totalReviews.toLocaleString()}
            subtext="Avg. 4.8 Rating"
            gradient="from-amber-400 to-orange-500"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            }
          />
        </div>

        {/* Bento Grid Layout for Secondary Metrics & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Quick Actions & Secondary Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                    📢
                  </span>
                  <span className="text-gray-600 font-medium text-sm">
                    Active Ads
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {overviewData.activeAds}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    🏆
                  </span>
                  <span className="text-gray-600 font-medium text-sm">
                    Listing Tiers
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {overviewData.listingTiers}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-green-100 text-green-600 rounded-lg">
                    💵
                  </span>
                  <span className="text-gray-600 font-medium text-sm">
                    This Month
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(overviewData.monthlyRevenue?.total || 0)}
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600 mr-2">
                  ⚡
                </span>{" "}
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ActionTile
                  icon="👤"
                  label="Add User"
                  bgClass="bg-blue-50"
                  borderClass="border-blue-100"
                  colorClass="text-blue-700"
                />
                <ActionTile
                  icon="📅"
                  label="New Booking"
                  bgClass="bg-emerald-50"
                  borderClass="border-emerald-100"
                  colorClass="text-emerald-700"
                />
                <ActionTile
                  icon="📊"
                  label="Reports"
                  bgClass="bg-amber-50"
                  borderClass="border-amber-100"
                  colorClass="text-amber-700"
                />
                <ActionTile
                  icon="⚙️"
                  label="Settings"
                  bgClass="bg-gray-50"
                  borderClass="border-gray-200"
                  colorClass="text-gray-700"
                />
              </div>
            </div>

            {/* Booking Hours Visualizer - transformed from list to progress bars */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="bg-red-100 p-1.5 rounded-lg text-red-600 mr-2">
                    🕐
                  </span>{" "}
                  Peak Hours
                </h3>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Top 5 Times
                </span>
              </div>

              <div className="space-y-4">
                {overviewData.hourlyBookings &&
                overviewData.hourlyBookings.length > 0 ? (
                  overviewData.hourlyBookings
                    .slice(0, 5)
                    .map((hourData, index) => (
                      <div key={hourData.hour} className="group">
                        <div className="flex justify-between text-sm mb-1">
                          <span
                            className={`font-semibold ${
                              index === 0 ? "text-red-600" : "text-gray-700"
                            }`}
                          >
                            {hourData.label} {index === 0 && "🔥"}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {hourData.count} bookings ({hourData.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                              index === 0
                                ? "bg-gradient-to-r from-red-500 to-orange-500 w-[95%]"
                                : index === 1
                                ? "bg-gradient-to-r from-orange-400 to-yellow-400"
                                : "bg-indigo-400"
                            }`}
                            style={{
                              width: `${Math.max(
                                Number(hourData.percentage),
                                5
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No data available
                  </div>
                )}
              </div>

              {overviewData.hourlyBookings &&
                overviewData.hourlyBookings.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                      Busiest time is{" "}
                      <span className="font-bold text-gray-800">
                        {overviewData.hourlyBookings[0]?.label}
                      </span>{" "}
                      with {overviewData.hourlyBookings[0]?.count} bookings.
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Right Column: Appointment Types (Donut Chart Style List) */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-violet-100 p-1.5 rounded-lg text-violet-600 mr-2">
                🎯
              </span>{" "}
              Categories
            </h3>

            <div className="flex-1">
              {overviewData.appointmentTypes &&
              overviewData.appointmentTypes.length > 0 ? (
                <div className="space-y-4">
                  {overviewData.appointmentTypes.map((type, index) => (
                    <div
                      key={type.appointmentType}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default border border-transparent hover:border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            index % 3 === 0
                              ? "bg-blue-100 text-blue-600"
                              : index % 3 === 1
                              ? "bg-pink-100 text-pink-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {type.appointmentType.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 capitalize">
                            {type.appointmentType}
                          </p>
                          <p className="text-xs text-gray-500">
                            {type.bookingCount} bookings
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-gray-900">
                          {type.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <span className="text-4xl mb-2">📁</span>
                  <p>No categories found</p>
                </div>
              )}
            </div>

            {/* Pro Tip Card at bottom of sidebar */}
            <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
              <h4 className="font-bold text-lg mb-1 relative z-10">Pro Tip</h4>
              <p className="text-indigo-100 text-sm opacity-90 relative z-10">
                Review active ads on weekends to boost revenue by ~15%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
