import { useState, useEffect, useRef, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring
} from 'framer-motion';
import {
  CreditCard,
  Sparkles,
  TrendingUp,
  Zap,
  Lock,
  Wifi,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// --- Utility for smoother class combination ---
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// 1. Light Theme Toast
const Toast = ({ message, type, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%", transition: { type: "spring", stiffness: 300, damping: 30 } }}
        exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%", transition: { duration: 0.2 } }}
        className="fixed bottom-6 left-1/2 z-[10000] flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl shadow-gray-200/50 w-[90%] max-w-md mx-auto"
      >
        <div className={cn("shrink-0 w-3 h-3 rounded-full shadow-sm", type === 'success' ? "bg-emerald-500" : "bg-rose-500")} />
        <span className="text-gray-900 font-medium text-sm truncate">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// 2. Shared Light Background (Orbs + Noise)
const Background = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0 w-full h-full block lg:hidden">
      <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
      <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />
    </div>
    <div className="hidden lg:block absolute inset-0">
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(20px, -20px) scale(1.1)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#4C763B]/10 rounded-full blur-[80px]" />
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(-20px, 30px) scale(1.2)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[90px]" />
      <div className="absolute bottom-[0%] right-[10%] w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px]" />
    </div>
    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
  </div>
));

// 3. Custom Cursor (Optional, but kept for consistency)
const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      requestAnimationFrame(() => {
        cursorX.set(e.clientX - 16);
        cursorY.set(e.clientY - 16);
      });
    };
    // Only add listener on non-touch devices
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", moveCursor);
    }
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border border-gray-900/30 bg-gray-900/5 rounded-full pointer-events-none z-[9999] hidden md:block will-change-transform"
      style={{ translateX: cursorXSpring, translateY: cursorYSpring }}
    >
      <div className="absolute inset-0 bg-gray-900/10 rounded-full" />
    </motion.div>
  );
};


// --- Main Page Component ---
const CustomerSetkarCoins = () => {
  const { user } = useAuth();
  const [setkarCoins, setSetkarCoins] = useState(user?.setkarCoins || 0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const cardRef = useRef(null);

  useEffect(() => {
    if (user) setSetkarCoins(user.setkarCoins || 0);
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const coinsToAdd = amount;
      // Mock success response
      const response = { data: { success: true } };

      if (response.data.success) {
        setSetkarCoins(prevCoins => prevCoins + coinsToAdd);
        setRechargeAmount('');
        showToast(`Successfully added ${coinsToAdd.toFixed(2)} Coins!`);
      } else {
        showToast(response.data.message || 'Transaction failed', 'error');
      }
    } catch (error) {
      showToast('Connection failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [200, 500, 1500, 3000];

  return (
    <div className="min-h-screen text-gray-900 font-sans pb-8 relative selection:bg-[#4C763B]/30 selection:text-[#4C763B] overflow-x-hidden">
      <CustomCursor />
      <Background />
      <Toast {...toast} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-20 sm:pt-28">

        {/* --- Header --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2 sm:mb-3">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">
                Wallet
              </span>
            </h1>
            <p className="text-gray-500 text-base sm:text-lg font-normal">Your digital balance and quick recharge.</p>
          </div>
          <div className="self-start md:self-auto px-5 py-2.5 bg-green-50 rounded-full border border-green-200 flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4C763B]"></span>
            </div>
            <span className="text-sm font-bold text-[#4C763B] tracking-wide">Secure Connection</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* --- Left Column: Green Brand Card --- */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5 space-y-6 sm:space-y-8"
          >

            {/* Dark Green Premium Card */}
            <div className="select-none w-full">
              <motion.div
                ref={cardRef}
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                className="relative h-[220px] sm:h-[260px] w-full rounded-[24px] sm:rounded-[32px] shadow-2xl shadow-green-900/20 transition-all duration-300 group cursor-pointer"
              >
                {/* Card Background Layer - Deep Green Brand Theme */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#022c22] rounded-[24px] sm:rounded-[32px] overflow-hidden border border-white/10">
                  {/* Internal smooth gradients */}
                  <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(76,118,59,0.4)_0%,transparent_50%)] blur-[60px] sm:blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>

                  {/* Continuous Subtle Shimmer */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                  />
                </div>

                {/* Card Content Layer */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <Wifi className="text-white/40 rotate-90 drop-shadow-md" size={20} />
                    <span className="font-bold text-lg sm:text-xl tracking-wider text-white drop-shadow-md flex items-center gap-2">
                      <ShieldCheck size={18} className="text-green-400" /> GlossCut
                    </span>
                  </div>

                  {/* Middle Row (Balance) */}
                  <div className="mt-2 sm:mt-4">
                    <p className="text-green-200/80 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] mb-1 sm:mb-2 drop-shadow-sm">Available Balance</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <motion.span
                        key={setkarCoins}
                        initial={{ opacity: 0.5, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                      >
                        {setkarCoins.toFixed(2)}
                      </motion.span>
                      <span className="text-base sm:text-lg font-medium text-green-200/90">Coins</span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="hidden sm:flex gap-3 text-white/50 font-mono text-base tracking-widest mb-1 drop-shadow-sm">
                        <span>••••</span><span>••••</span><span>8842</span>
                      </div>
                      <p className="font-medium text-white/80 text-xs sm:text-sm tracking-wider uppercase drop-shadow-sm">{user?.name || 'Premium Member'}</p>
                    </div>
                    {/* Chip */}
                    <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-md bg-gradient-to-tr from-yellow-200/80 to-yellow-600/80 relative overflow-hidden shadow-lg border border-yellow-300/30 flex items-center justify-center">
                      <Sparkles size={16} className="text-yellow-100 opacity-80 mix-blend-overlay" />
                    </div>
                  </div>
                </div>

                {/* Glass Reflection */}
                <div className="absolute inset-0 rounded-[24px] sm:rounded-[32px] ring-1 ring-white/10 pointer-events-none"></div>
              </motion.div>
            </div>

            {/* Stats - White Glass */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/60 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shadow-lg shadow-gray-200/40 transition-colors hover:bg-white/80">
                <div className="p-2 sm:p-2.5 bg-green-50 rounded-xl text-[#4C763B]">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Exchange Rate</p>
                  <p className="text-gray-900 text-sm sm:text-base font-bold">1 INR = 1 Coin</p>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/60 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shadow-lg shadow-gray-200/40 transition-colors hover:bg-white/80">
                <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Processing</p>
                  <p className="text-gray-900 text-sm sm:text-base font-bold">Instant Credit</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- Right Column: Action Area (White Glass) --- */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <div className="h-full bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl shadow-gray-200/50 relative overflow-hidden group">

              {/* Decorative soft light blob */}
              <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-green-600/5 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-opacity duration-500 group-hover:opacity-70"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-3">
                    Add Funds
                  </h2>
                  <p className="text-gray-500 text-sm sm:text-base font-medium">Securely top up your wallet balance.</p>
                </div>

                {/* Input Field */}
                <div className="space-y-6 sm:space-y-8 flex-grow">
                  <div className="relative">
                    <label className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 block ml-2">Enter Amount</label>

                    {/* Input Container */}
                    <div className={cn(
                      "relative group rounded-[20px] sm:rounded-[24px] transition-all duration-300",
                      rechargeAmount ? "bg-white shadow-lg shadow-green-900/5 border border-green-500/20" : "bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200"
                    )}>
                      <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl"></div>

                      <input
                        type="number"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        placeholder="0"
                        className="relative w-full bg-transparent border-none rounded-[24px] py-6 sm:py-8 pl-12 sm:pl-14 pr-6 text-4xl sm:text-5xl font-light text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 transition-all tracking-tight z-10"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      />
                      <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-light text-gray-400 z-10">₹</span>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4 ml-2">Quick Select</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {quickAmounts.map((amount) => {
                        const isActive = rechargeAmount === amount.toString();
                        return (
                          <motion.button
                            key={amount}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRechargeAmount(amount.toString())}
                            className={cn(
                              "relative overflow-hidden py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold transition-all duration-300 border shadow-sm",
                              isActive
                                ? 'bg-[#4C763B] text-white border-[#4C763B] shadow-lg shadow-green-900/20'
                                : 'bg-white text-gray-600 border-gray-100 hover:text-gray-900 hover:border-gray-300 hover:shadow-md'
                            )}
                          >
                            ₹{amount}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Pay Button */}
                  <div className="pt-4 sm:pt-6 mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(76,118,59,0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleRecharge}
                      disabled={loading || !rechargeAmount}
                      className={cn(
                        "w-full relative overflow-hidden rounded-[20px] sm:rounded-[24px] py-5 sm:py-6 text-white font-bold text-lg transition-all duration-300",
                        (loading || !rechargeAmount)
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#4C763B] to-green-600 shadow-xl shadow-green-900/20"
                      )}
                    >
                      {/* Subtle shimmer */}
                      <motion.div
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0"
                      />

                      <div className="relative flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="font-medium">Processing...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} className="text-green-50" />
                            <span className="tracking-wide text-base sm:text-lg">
                              {rechargeAmount ? `Pay ₹${rechargeAmount}` : 'Proceed to Payment'}
                            </span>
                            <ChevronRight size={20} className="text-green-50 ml-1" />
                          </>
                        )}
                      </div>
                    </motion.button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs sm:text-sm font-medium">
                    <Lock size={12} />
                    <span>SSL Encrypted & Secure</span>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default CustomerSetkarCoins;
