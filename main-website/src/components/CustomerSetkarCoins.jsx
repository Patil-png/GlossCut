import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  motion, 
  AnimatePresence
} from 'framer-motion';
import { 
  CreditCard, 
  Sparkles, 
  TrendingUp,
  Zap,
  Lock,
  Wifi,
  ChevronRight
} from 'lucide-react';

// --- Utility for smoother class combination ---
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// 1. Ultra-Smooth Toast (Mobile Optimized width)
const Toast = ({ message, type, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%", transition: { type: "spring", stiffness: 300, damping: 30 } }}
        exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%", transition: { duration: 0.2 } }}
        className="fixed bottom-6 left-1/2 z-[10000] flex items-center gap-4 px-6 py-4 rounded-2xl bg-[#12142a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-indigo-500/10 w-[90%] max-w-md mx-auto"
      >
        <div className={cn("shrink-0 w-3 h-3 rounded-full shadow-[0_0_15px_currentColor]", type === 'success' ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500")} />
        <span className="text-white/90 font-medium text-sm truncate">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// 2. Optimized Background (Reduced animations and blur for better performance)
const Background = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#050714]">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay"></div>
    {/* Static gradient orbs - removed animations for performance */}
    <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[60px] mix-blend-screen" />
    <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[60px] mix-blend-screen" />
  </div>
);


// --- Main Page Component ---
const CustomerSetkarCoins = () => {
  const { user } = useAuth();
  const [setkarCoins, setSetkarCoins] = useState(user?.setkarCoins || 0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Simplified card interaction - removed expensive 3D transforms for better performance
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
      /* const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/user/recharge-setkar-coins`, {
        coins: coinsToAdd,
      }, { headers: { 'x-auth-token': token } });
      */
      const response = { data: { success: true } }; // MOCK

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
    <div className="min-h-screen text-slate-200 font-sans pt-20 pb-8 sm:pt-28 sm:pb-12 relative selection:bg-indigo-500/30 overflow-x-hidden">
      <Background />
      <Toast {...toast} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* --- Header --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 sm:mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-purple-300">
                My Wallet
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg font-light">Your digital balance and quick recharge.</p>
          </div>
          <div className="self-start md:self-auto px-5 py-2.5 bg-[#1a1c35]/60 rounded-full border border-indigo-500/20 backdrop-blur-md shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] flex items-center gap-3">
             <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
             <span className="text-sm font-medium text-emerald-300/90 tracking-wide">Secure Connection</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* --- Left Column: The Smooth Card --- */}
          <motion.div 
             initial={{ opacity: 0, x: -30 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
             className="lg:col-span-5 space-y-6 sm:space-y-8"
          >
            
            {/* Simplified Credit Card Container */}
            <div className="select-none w-full">
              <motion.div
                ref={cardRef}
                // Simple hover effect without expensive 3D transforms
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                className="relative h-[220px] sm:h-[260px] w-full rounded-[24px] sm:rounded-[32px] shadow-[0_30px_80px_-20px_rgba(60,50,150,0.4)] transition-all duration-300 group cursor-pointer"
              >
                {/* Card Background Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#24284b] via-[#16182e] to-[#0f101c] rounded-[24px] sm:rounded-[32px] overflow-hidden border border-white/10">
                   {/* Internal smooth gradients */}
                   <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_50%)] blur-[60px] sm:blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
                   <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2)_0%,transparent_60%)] blur-[60px] sm:blur-[80px]"></div>
                   
                   {/* Continuous Subtle Shimmer */}
                   <motion.div 
                     animate={{ x: ["-100%", "200%"] }}
                     transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                   />
                </div>

                {/* Card Content Layer (Pop out) */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <Wifi className="text-white/40 rotate-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" size={20} />
                    <span className="font-semibold text-lg sm:text-xl tracking-wider text-white/80 drop-shadow-md">GlossCut</span>
                  </div>

                  {/* Middle Row (Balance) */}
                  <div className="mt-2 sm:mt-4">
                    <p className="text-indigo-200/70 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] mb-1 sm:mb-2 drop-shadow-sm">Available Balance</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <motion.span 
                        key={setkarCoins}
                        initial={{ opacity: 0.5, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                      >
                        {setkarCoins.toFixed(2)}
                      </motion.span>
                      <span className="text-base sm:text-lg font-medium text-indigo-300/90">Coins</span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-end">
                    <div>
                        <div className="hidden sm:flex gap-3 text-white/40 font-mono text-base tracking-widest mb-1 drop-shadow-sm">
                           <span>••••</span><span>••••</span><span>8842</span>
                        </div>
                        <p className="font-medium text-white/70 text-xs sm:text-sm tracking-wider uppercase drop-shadow-sm">{user?.name || 'Premium Member'}</p>
                    </div>
                    {/* Holographic Chip */}
                    <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-md bg-gradient-to-tr from-yellow-200/80 to-yellow-600/80 relative overflow-hidden shadow-lg border border-yellow-300/30 flex items-center justify-center">
                        <Sparkles size={16} className="text-yellow-100 opacity-80 mix-blend-overlay" />
                    </div>
                  </div>
                </div>

                {/* Simple Glass Border Reflection */}
                <div className="absolute inset-0 rounded-[24px] sm:rounded-[32px] ring-1 ring-white/20 pointer-events-none"></div>
              </motion.div>
            </div>

            {/* Simple Stats - Clean and Smooth */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <div className="bg-[#1a1c35]/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shadow-sm transition-colors hover:bg-[#1a1c35]/60">
                  <div className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <TrendingUp size={16} />
                  </div>
                  <div>
                      <p className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Exchange Rate</p>
                      <p className="text-white text-sm sm:text-base font-medium">1 INR = 1 Coin</p>
                  </div>
               </div>
               <div className="bg-[#1a1c35]/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shadow-sm transition-colors hover:bg-[#1a1c35]/60">
                  <div className="p-2 sm:p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Zap size={16} />
                  </div>
                  <div>
                      <p className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Processing</p>
                      <p className="text-white text-sm sm:text-base font-medium">Instant Credit</p>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* --- Right Column: Smooth Action Area --- */}
          <motion.div 
             initial={{ opacity: 0, x: 30 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
             className="lg:col-span-7"
          >
            <div className="h-full bg-[#131528]/70 backdrop-blur-2xl border border-white/10 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
               
               {/* Decorative soft light blob */}
               <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-600/10 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-opacity duration-500 group-hover:opacity-70"></div>

               <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8 sm:mb-10">
                     <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-3">
                       Add Funds
                     </h2>
                     <p className="text-slate-400 text-sm sm:text-base font-light">Securely top up your wallet balance.</p>
                  </div>

                  {/* The Smooth Input Field */}
                  <div className="space-y-6 sm:space-y-8 flex-grow">
                     <div className="relative">
                        <label className="text-indigo-300/80 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 sm:mb-3 block ml-2">Enter Amount</label>
                        
                        {/* Input Container */}
                        <div className={cn(
                            "relative group rounded-[20px] sm:rounded-[24px] transition-all duration-300",
                            rechargeAmount ? "bg-[#1c1f3a] shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]" : "bg-[#181a30] hover:bg-[#1c1f3a]"
                        )}>
                           <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl"></div>
                           
                           <input
                             type="number"
                             value={rechargeAmount}
                             onChange={(e) => setRechargeAmount(e.target.value)}
                             placeholder="0"
                             className="relative w-full bg-transparent border-none rounded-[24px] py-6 sm:py-8 pl-12 sm:pl-14 pr-6 text-4xl sm:text-5xl font-light text-white placeholder-slate-700 focus:outline-none focus:ring-0 transition-all tracking-tight z-10"
                             style={{fontVariantNumeric: 'tabular-nums'}}
                           />
                           <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-extralight text-slate-600 z-10">₹</span>
                        </div>
                     </div>

                     {/* Quick Select - Gel Tabs */}
                     <div>
                        <p className="text-indigo-300/80 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 ml-2">Quick Select</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                           {quickAmounts.map((amount) => {
                              const isActive = rechargeAmount === amount.toString();
                              return (
                              <motion.button
                                 key={amount}
                                 whileHover={{ scale: 1.05, backgroundColor: isActive ? 'rgba(99, 102, 241, 1)' : 'rgba(30, 41, 59, 0.8)' }}
                                 whileTap={{ scale: 0.95 }}
                                 onClick={() => setRechargeAmount(amount.toString())}
                                 className={cn(
                                    "relative overflow-hidden py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-medium transition-all duration-300 border shadow-sm",
                                    isActive 
                                      ? 'bg-indigo-600 text-white border-indigo-500/50 shadow-[0_10px_25px_-10px_rgba(99,102,241,0.6)]' 
                                      : 'bg-[#1e293b]/40 text-slate-300 border-white/5 hover:text-white hover:border-white/10 hover:shadow-md'
                                 )}
                              >
                                  ₹{amount}
                              </motion.button>
                           )})}
                        </div>
                     </div>

                     {/* The Action Button - Soft and Glowing */}
                     <div className="pt-4 sm:pt-6 mt-auto">
                        <motion.button
                           whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(99,102,241,0.5)" }}
                           whileTap={{ scale: 0.97 }}
                           onClick={handleRecharge}
                           disabled={loading || !rechargeAmount}
                           className={cn(
                              "w-full relative overflow-hidden rounded-[20px] sm:rounded-[24px] py-5 sm:py-6 text-white font-bold text-lg transition-all duration-300",
                              (loading || !rechargeAmount) 
                                ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-600 via-[#6366f1] to-purple-600 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)]"
                           )}
                        >
                           {/* Subtle internal glow animation */}
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
                                       <CreditCard size={20} className="text-indigo-100" />
                                       <span className="tracking-wide text-base sm:text-lg">
                                            {rechargeAmount ? `Pay ₹${rechargeAmount}` : 'Proceed to Payment'}
                                       </span>
                                       <ChevronRight size={20} className="text-indigo-100 ml-1" />
                                    </>
                                 )}
                              </div>
                        </motion.button>
                     </div>
                     
                     <div className="flex items-center justify-center gap-2 text-slate-500/80 text-xs sm:text-sm font-medium">
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
