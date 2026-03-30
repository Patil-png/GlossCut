import React, { useEffect, useState } from 'react';

const GlosscutPremiumSplash = () => {
  // Check storage immediately to avoid any delay or flicker
  const [isVisible, setIsVisible] = useState(() => {
    const played = sessionStorage.getItem('glosscut_splash_played');
    if (played) return false;
    // Set it immediately so that a refresh during the animation also counts as "played"
    sessionStorage.setItem('glosscut_splash_played', 'true');
    return true;
  });

  useEffect(() => {
    if (!isVisible) return;

    document.body.style.overflow = 'hidden';

    // Cinematic exit: starts at 2.7s for a 3.5s total feel
    const fadeOutTimer = setTimeout(() => {
      const el = document.getElementById('glosscut-splash-screen');
      if (el) el.classList.add('splash-exit');
    }, 2700);

    // Unmount completely
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 3500);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(unmountTimer);
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      id="glosscut-splash-screen"
      className="fixed inset-0 z-[99999] bg-[#0a0a0a] flex flex-col items-center justify-center pointer-events-auto transition-all duration-[800ms] ease-in-out overflow-hidden"
    >
      {/* Premium Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* High-end Dual Shimmer across the complete page */}
      <div className="absolute top-0 bottom-0 left-[-150%] w-[150%] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent opacity-[0.2] skew-x-[30deg] cinematic-light-sweep mix-blend-screen"></div>
      <div className="absolute top-0 bottom-0 left-[-150%] w-[100%] lg:w-[60%] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-[0.3] skew-x-[30deg] cinematic-light-sweep-2 mix-blend-screen pointer-events-none z-20"></div>

      <div className="relative flex flex-col items-center justify-center w-full z-10 cinematic-container">

        {/* Luxury Badge Container */}
        <div className="relative flex justify-center items-center cinematic-logo drop-shadow-[0px_0px_50px_rgba(245,158,11,0.2)]">
          
          {/* Animated Ring */}
          <div className="absolute inset-0 rounded-full border border-amber-500/30 scale-125 animate-ping-slow"></div>

          <div className="relative w-[120px] md:w-[170px] h-[120px] md:h-[170px] rounded-full overflow-hidden flex items-center justify-center bg-[#111] border-2 border-amber-500/20 shadow-2xl">
            <img
              src="/GlossCut.png"
              alt="GlossCut Logo"
              className="w-full h-full object-contain scale-[1.1]"
            />
          </div>

        </div>

        {/* High-Contrast Typography */}
        <div className="mt-10 flex flex-col items-center opacity-0 cinematic-text-container">
          <div className="h-[1px] w-[40px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-4"></div>
          <p className="text-amber-500 font-bold text-[11px] md:text-[13px] uppercase tracking-[5px] md:tracking-[8px] whitespace-nowrap drop-shadow-sm">
            The Premium Grooming Experience
          </p>
          <div className="mt-2 h-[1px] w-[20px] bg-amber-500/30"></div>
        </div>

      </div>

      <style>{`
        /* 1. Ultra-smooth fade and scale-in */
        @keyframes cinematic-fade-in {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cinematic-container {
          animation: cinematic-fade-in 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* 2. Soft Logo Blur Reveal */
        @keyframes cinematic-logo {
          0% { filter: blur(15px); transform: scale(0.8); }
          100% { filter: blur(0px); transform: scale(1); }
        }
        .cinematic-logo {
          animation: cinematic-logo 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* 3. True-minimal Text Fade */
        @keyframes text-fade {
          0% { opacity: 0; transform: translateY(15px); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        .cinematic-text-container {
          animation: text-fade 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s forwards;
        }

        /* 4. Multi-Layer Luxury Sweeps */
        @keyframes cinematic-sweep {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        .cinematic-light-sweep {
          animation: cinematic-sweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s infinite;
        }
        .cinematic-light-sweep-2 {
          animation: cinematic-sweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) 0.6s infinite;
        }

        @keyframes ping-slow {
          0% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        /* 5. Smooth Cinematic Exit */
        .splash-exit {
          opacity: 0 !important;
          transform: scale(1.1) !important;
          transition: all 0.8s cubic-bezier(0.7, 0, 0.3, 1) !important;
        }
      `}</style>
    </div>
  );
};

export default GlosscutPremiumSplash;
