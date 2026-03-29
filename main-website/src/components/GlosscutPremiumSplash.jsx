import React, { useEffect, useState } from 'react';

// Module-level flag tracks whether the animation has played this session.
// It will reset to false on a hard refresh (F5), but remain true during SPA navigation.
let splashHasPlayed = false;

const GlosscutPremiumSplash = () => {
  const [isVisible, setIsVisible] = useState(!splashHasPlayed);

  useEffect(() => {
    // If it has already played, do nothing
    if (splashHasPlayed) {
      return;
    }

    // Mark as played for any subsequent navigations within the SPA
    splashHasPlayed = true;

    document.body.style.overflow = 'hidden';

    // Smooth, majestic exit phase
    const fadeOutTimer = setTimeout(() => {
      const el = document.getElementById('glosscut-splash-screen');
      if (el) el.classList.add('splash-exit');
    }, 2000);

    // Unmount completely
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 2800);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(unmountTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      id="glosscut-splash-screen"
      className="fixed inset-0 z-[99999] bg-[#ffffff] flex flex-col items-center justify-center pointer-events-none transition-all duration-[800ms] ease-in-out overflow-hidden"
    >
      {/* High-end Dual Shimmer across the complete page */}
      <div className="absolute top-0 bottom-0 left-[-150%] w-[150%] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent opacity-[0.05] skew-x-[30deg] cinematic-light-sweep mix-blend-overlay"></div>
      <div className="absolute top-0 bottom-0 left-[-150%] w-[100%] lg:w-[60%] bg-gradient-to-r from-transparent via-[#ffffff] to-transparent opacity-[0.4] skew-x-[30deg] cinematic-light-sweep-2 mix-blend-screen pointer-events-none z-20"></div>

      <div className="relative flex flex-col items-center justify-center w-full z-10 cinematic-container">

        {/* Luxury Badge Container */}
        <div className="relative flex justify-center items-center cinematic-logo drop-shadow-[0px_15px_35px_rgba(212,175,55,0.15)]">

          <div className="relative w-[110px] md:w-[160px] h-[110px] md:h-[160px] rounded-full overflow-hidden flex items-center justify-center bg-white border border-[#D4AF37]/20">

            <img
              src="/GlossCut.png"
              alt="GlossCut Logo"
              className="w-full h-full object-contain scale-[1.2] translate-y-[-2%]"
            />

          </div>

        </div>

        {/* Ultra-Minimalist Typography */}
        <div className="mt-8 flex flex-col items-center opacity-0 cinematic-text-container border-opacity-100">
          <div className="h-[2px] w-[24px] bg-[#D4AF37] mb-3"></div>
          <p className="text-[#685514] font-semibold text-[10px] md:text-[12px] uppercase tracking-[3px] md:tracking-[6px] whitespace-nowrap">
            The Premium Grooming Experience
          </p>
        </div>

      </div>

      <style>{`
        /* 1. Ultra-smooth fade and scale-in */
        @keyframes cinematic-fade-in {
          0% { opacity: 0; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        .cinematic-container {
          animation: cinematic-fade-in 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* 2. Soft Logo Blur Reveal */
        @keyframes cinematic-logo {
          0% { filter: blur(12px); }
          100% { filter: blur(0px); }
        }
        .cinematic-logo {
          animation: cinematic-logo 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* 3. True-minimal Text Fade */
        @keyframes text-fade {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .cinematic-text-container {
          animation: text-fade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s forwards;
        }

        /* 4. Multi-Layer Luxury Sweeps */
        @keyframes cinematic-sweep {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        .cinematic-light-sweep {
          animation: cinematic-sweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
        }
        .cinematic-light-sweep-2 {
          animation: cinematic-sweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
        }

        /* 5. Smooth Cinematic Exit */
        .splash-exit {
          opacity: 0 !important;
          transform: scale(1.04) !important;
          transition: all 0.8s cubic-bezier(0.7, 0, 0.3, 1) !important;
        }
      `}</style>
    </div>
  );
};

export default GlosscutPremiumSplash;
