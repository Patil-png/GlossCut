import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  TrendingUp,
  Zap,
  Lock
} from 'lucide-react';

// Custom Cursor Component
const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border-2 border-indigo-500 rounded-full pointer-events-none z-[9999] hidden md:block mix-blend-difference"
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
      }}
    />
  );
};

const CustomerSetkarCoins = () => {
  const { user, token, updateProfile } = useAuth();
  const [setkarCoins, setSetkarCoins] = useState(user?.setkarCoins || 0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Card 3D tilt effect
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
  
  const handleCardMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleCardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    if (user) {
      setSetkarCoins(user.setkarCoins || 0);
    }
  }, [user]);

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount to recharge.');
      return;
    }

    setLoading(true);
    try {
      const coinsToAdd = amount; // 1 Rupee = 1 Setkar Coin
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/user/recharge-setkar-coins`, {
        coins: coinsToAdd,
      }, {
        headers: { 'x-auth-token': token },
      });

      if (response.data.success) {
        // Instantly update local state for immediate UI feedback
        setSetkarCoins(prevCoins => prevCoins + coinsToAdd);
        setRechargeAmount('');
        
        // Also refresh user data from server in background
        await updateProfile();
        
        alert(`${coinsToAdd.toFixed(2)} GlossCut Coins added to your balance!`);
      } else {
        alert(response.data.message || 'Could not recharge coins.');
      }
    } catch (error) {
      console.error('Error recharging coins:', error);
      alert('Failed to recharge coins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pt-20 sm:pt-28 pb-8 sm:pb-12 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Custom Cursor Effect */}
      <CustomCursor />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-indigo-600/10 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-purple-600/10 rounded-full blur-[60px] sm:blur-[100px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-lg sm:rounded-xl border border-indigo-500/20">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              </div>
              My Wallet
            </h1>
            <p className="text-slate-400 mt-2.5 sm:mt-2 ml-0.5 sm:ml-1 text-sm sm:text-base">Manage your digital balance securely.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Left Column: Digital Card */}
          <div className="md:col-span-5 space-y-4 sm:space-y-6">
            <div 
              className="relative group hidden sm:block"
              style={{ perspective: '1000px' }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl sm:rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              
              <motion.div 
                ref={cardRef}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={{
                  rotateX: rotateX,
                  rotateY: rotateY,
                  transformStyle: 'preserve-3d',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative h-48 sm:h-64 w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl sm:rounded-[1.75rem] p-5 sm:p-8 text-white shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10 cursor-pointer"
              >
                {/* Card Background Patterns */}
                <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-3xl -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-black/10 rounded-full blur-2xl -ml-8 sm:-ml-12 -mb-8 sm:-mb-12 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                {/* Shine effect on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none"
                  style={{
                    opacity: useTransform(mouseX, [-0.5, 0, 0.5], [0, 0, 0.3]),
                  }}
                />

                <div className="relative z-10 flex justify-between items-start" style={{ transform: 'translateZ(50px)' }}>
                  <div>
                    <p className="text-indigo-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 sm:mb-1">GlossCut Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-4xl font-bold tracking-tight">{setkarCoins.toFixed(2)}</span>
                      <span className="text-xs sm:text-sm font-medium opacity-80">Coins</span>
                    </div>
                  </div>
                  <Sparkles className="text-indigo-200 opacity-80 w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="relative z-10" style={{ transform: 'translateZ(30px)' }}>
                   <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                      <div className="h-6 w-10 sm:h-8 sm:w-12 bg-white/20 rounded-md backdrop-blur-sm border border-white/10 flex items-center justify-center">
                         <div className="w-5 h-3 sm:w-6 sm:h-4 border border-white/30 rounded-sm flex items-center justify-center">
                            <div className="w-3 h-1.5 sm:w-4 sm:h-2 bg-white/20"></div>
                         </div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-indigo-100 font-mono tracking-widest">**** **** 8842</div>
                   </div>

                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] sm:text-[10px] uppercase text-indigo-200 font-bold tracking-wider mb-0.5">Holder</p>
                        <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{user?.name || 'Valued Member'}</p>
                      </div>
                      <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold border border-white/10">
                        PREMIUM
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>
            
            {/* Mobile Card (without tilt effect) */}
            <div className="relative group sm:hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25"></div>
              
              <div className="relative h-48 w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-0.5">GlossCut Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight">{setkarCoins.toFixed(2)}</span>
                      <span className="text-xs font-medium opacity-80">Coins</span>
                    </div>
                  </div>
                  <Sparkles className="text-indigo-200 opacity-80 w-5 h-5" />
                </div>

                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-10 bg-white/20 rounded-md backdrop-blur-sm border border-white/10 flex items-center justify-center">
                         <div className="w-5 h-3 border border-white/30 rounded-sm flex items-center justify-center">
                            <div className="w-3 h-1.5 bg-white/20"></div>
                         </div>
                      </div>
                      <div className="text-[10px] text-indigo-100 font-mono tracking-widest">**** **** 8842</div>
                   </div>

                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] uppercase text-indigo-200 font-bold tracking-wider mb-0.5">Holder</p>
                        <p className="font-medium text-xs truncate max-w-[120px]">{user?.name || 'Valued Member'}</p>
                      </div>
                      <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/10">
                        PREMIUM
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
              <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5 sm:mt-1">
                <TrendingUp size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Exchange Rate</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Current value is stable.</p>
                <div className="mt-1.5 sm:mt-2 inline-block px-2 py-0.5 sm:py-1 bg-slate-800 rounded-md text-[10px] sm:text-xs font-mono text-emerald-400 border border-emerald-500/20">
                  1 Coin = ₹1.00 INR
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recharge Form */}
          <div className="md:col-span-7">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <Plus size={18} className="sm:w-5 sm:h-5 text-indigo-400" />
                Add Money
              </h2>

              <div className="space-y-5 sm:space-y-8">
                {/* Input Field */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3">Enter Amount</label>
                  <div className="relative group">
                    <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-slate-500 group-focus-within:text-indigo-400 transition-colors">₹</span>
                    <input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl sm:rounded-2xl py-4 sm:py-6 pl-10 sm:pl-12 pr-4 sm:pr-6 text-2xl sm:text-3xl font-bold text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all"
                    />
                  </div>
                </div>

                {/* Quick Selection */}
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3">Quick Select</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setRechargeAmount(amount.toString())}
                        className={`py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-bold transition-all duration-200 border ${
                          rechargeAmount === amount.toString()
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700 hover:border-white/10'
                        }`}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
                   <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-full text-indigo-400 shrink-0">
                      <Zap size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
                   </div>
                   <p className="text-[10px] sm:text-xs text-indigo-200 font-medium">
                      Coins are credited instantly to your wallet after successful payment.
                   </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleRecharge}
                  disabled={loading || !rechargeAmount}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm sm:text-lg shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} className="sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">{rechargeAmount ? `Pay ₹${rechargeAmount}` : 'Proceed to Payment'}</span>
                        <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Footer Security */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                  <Lock size={10} className="sm:w-3 sm:h-3" />
                  <span>256-bit SSL Encrypted Transaction</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerSetkarCoins;
