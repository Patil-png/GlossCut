/* Standard Imports */
import { useState, useEffect, useRef, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  CreditCard, Sparkles, TrendingUp, Zap, Lock, Wifi
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) { return twMerge(clsx(inputs)); }

/* --- SHARED UI (Light Mode) --- */

const Background = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0 w-full h-full block lg:hidden">
      <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
    </div>
    <div className="hidden lg:block absolute inset-0">
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(20px, -20px) scale(1.1)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#4C763B]/10 rounded-full blur-[80px]" />
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(-20px, 30px) scale(1.2)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[90px]" />
    </div>
    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
  </div>
));

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

const Toast = ({ message, type, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%", transition: { type: "spring", stiffness: 300, damping: 30 } }}
        exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%", transition: { duration: 0.2 } }}
        className="fixed bottom-6 left-1/2 z-[10000] flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl shadow-gray-200/50 w-[90%] max-w-md mx-auto"
      >
        <div className={cn("shrink-0 w-3 h-3 rounded-full shadow-sm", type === 'success' ? "bg-emerald-500" : "bg-red-500")} />
        <span className="text-gray-800 font-bold text-sm truncate">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

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
      await new Promise(resolve => setTimeout(resolve, 1500));
      const coinsToAdd = amount;
      // Mock Success
      setSetkarCoins(prev => prev + coinsToAdd);
      setRechargeAmount('');
      showToast(`Successfully added ${coinsToAdd.toFixed(2)} Coins!`);
    } catch (error) {
      showToast('Connection failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [200, 500, 1500, 3000];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-x-hidden">
      <CustomCursor />
      <Background />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} />

      {/* Main Content - Added PT-24/PT-32 for Mobile Header Clearance */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4C763B]/5 border border-[#4C763B]/20 text-[#4C763B] text-xs font-bold mb-3">
              <Zap size={12} className="fill-[#4C763B]" />
              <span className="uppercase tracking-wider">Payments</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Wallet</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium">Your digital balance and quick recharge.</p>
          </div>

          <div className="self-start md:self-auto px-4 py-2 bg-white/80 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-bold text-gray-600 tracking-wide uppercase">Secure Connection</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Left Column: Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Credit Card */}
            <div className="select-none w-full group cursor-pointer perspective-1000">
              <div
                ref={cardRef}
                className="relative h-[220px] sm:h-[250px] w-full rounded-[24px] sm:rounded-[32px] shadow-2xl shadow-green-900/20 transition-transform duration-500 group-hover:scale-[1.02] overflow-hidden"
              >
                {/* Emerald Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a472a] via-[#0d2e1b] to-[#051c0f]">
                  <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(76,118,59,0.4)_0%,transparent_50%)] blur-[80px]"></div>
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                  />
                </div>

                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <Wifi className="text-white/50 rotate-90" size={20} />
                    <span className="font-bold text-lg text-white/90 tracking-widest">GlossCut</span>
                  </div>

                  <div className="mt-2">
                    <p className="text-emerald-200/80 text-xs font-bold uppercase tracking-[0.2em] mb-1">Total Balance</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-light tracking-tighter text-white">
                        {setkarCoins.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-emerald-400">Coins</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="flex gap-2 text-white/50 font-mono text-sm tracking-widest mb-1">
                        <span>••••</span><span>••••</span><span>8842</span>
                      </div>
                      <p className="font-bold text-white/80 text-xs tracking-wider uppercase">{user?.name || 'Premium Member'}</p>
                    </div>
                    <div className="w-10 h-8 rounded bg-gradient-to-tr from-yellow-200/80 to-yellow-600/80 flex items-center justify-center border border-yellow-400/30 shadow-lg">
                      <Sparkles size={14} className="text-yellow-100 opacity-90 mix-blend-overlay" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-lg shadow-gray-200/50 flex flex-col gap-1">
                <div className="self-start p-2 bg-[#4C763B]/10 rounded-xl text-[#4C763B] mb-1">
                  <TrendingUp size={18} />
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Exchange Rate</p>
                <p className="text-gray-900 font-bold">1 INR = 1 Coin</p>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-lg shadow-gray-200/50 flex flex-col gap-1">
                <div className="self-start p-2 bg-amber-500/10 rounded-xl text-amber-600 mb-1">
                  <Zap size={18} />
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Processing</p>
                <p className="text-gray-900 font-bold">Instant Credit</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Add Funds */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="h-full bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 sm:p-10 shadow-2xl shadow-gray-200/50 flex flex-col">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Funds</h2>
                <p className="text-gray-500 text-sm">Securely top up your wallet balance.</p>
              </div>

              <div className="space-y-8 flex-grow">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 block ml-1">Enter Amount</label>
                  <div className={cn(
                    "relative group rounded-2xl transition-all duration-300",
                    rechargeAmount ? "bg-white shadow-lg ring-1 ring-[#4C763B]/20" : "bg-gray-50 hover:bg-white hover:shadow-md"
                  )}>
                    <input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="0"
                      className="relative w-full bg-transparent border-none rounded-2xl py-6 pl-12 pr-6 text-4xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 transition-all tracking-tight"
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 ml-1">Quick Select</p>
                  <div className="grid grid-cols-4 gap-3">
                    {quickAmounts.map((amount) => {
                      const isActive = rechargeAmount === amount.toString();
                      return (
                        <button
                          key={amount}
                          onClick={() => setRechargeAmount(amount.toString())}
                          className={cn(
                            "py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm border",
                            isActive
                              ? 'bg-[#4C763B] text-white border-[#4C763B] shadow-lg shadow-green-900/20 scale-105'
                              : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                          )}
                        >
                          ₹{amount}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    onClick={handleRecharge}
                    disabled={loading || !rechargeAmount}
                    className={cn(
                      "w-full py-5 rounded-2xl text-white font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2",
                      (loading || !rechargeAmount)
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#4C763B] to-green-600 hover:shadow-xl hover:shadow-green-900/20 hover:-translate-y-1"
                    )}
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <CreditCard size={20} />
                        <span>{rechargeAmount ? `Pay ₹${rechargeAmount}` : 'Proceed to Payment'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wide">
                  <Lock size={12} />
                  <span>SSL Encrypted & Secure</span>
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
