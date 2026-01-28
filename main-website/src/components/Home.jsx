import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from './Home/Hero';
import SearchTeaser from './Home/SearchTeaser';

// Lazy loaded below-the-fold components
const ValueProps = lazy(() => import('./Home/ValueProps'));
const BarberOnboarding = lazy(() => import('./Home/BarberOnboarding'));
const FAQ = lazy(() => import('./Home/FAQ'));
const LazyFeaturedBarbers = lazy(() => import('./FeaturedBarbers').catch(() => ({ default: () => <div className="py-10 text-center text-zinc-500">Loading Barbers...</div> })));

function HomeScreen() {
  // Configuration for the "Random Structure" of light beams
  const lightBeams = [
    { width: 'w-[80px]', opacity: 0.4, skew: '-skew-x-6', gradient: 'from-white/5' },
    { width: 'w-[140px]', opacity: 0.2, skew: '-skew-x-3', gradient: 'from-white/10' },
    { width: 'w-[40px]', opacity: 0.6, skew: 'skew-x-2', gradient: 'from-white/20' },
    { width: 'w-[200px]', opacity: 0.1, skew: '-skew-x-12', gradient: 'from-white/5' },
    { width: 'w-[60px]', opacity: 0.5, skew: '-skew-x-3', gradient: 'from-white/15' },
    { width: 'w-[120px]', opacity: 0.3, skew: 'skew-x-4', gradient: 'from-white/10' },
    { width: 'w-[90px]', opacity: 0.4, skew: '-skew-x-2', gradient: 'from-white/20' },
    { width: 'w-[160px]', opacity: 0.2, skew: 'skew-x-1', gradient: 'from-white/5' },
    { width: 'w-[50px]', opacity: 0.5, skew: '-skew-x-6', gradient: 'from-white/25' },
    { width: 'w-[100px]', opacity: 0.3, skew: '-skew-x-2', gradient: 'from-white/10' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
      <Helmet>
        <title>GlossCut | Book Best Salons & Barbers Near You</title>
        <meta name="description" content="Discover and book top-rated salons and barbershops in Amravati and Nagpur. Real-time slots, UPI payments, and verified reviews." />
        <link rel="canonical" href="https://www.glosscut.com/" />
      </Helmet>

      <main>
        {/* SHARED BACKGROUND WRAPPER */}
        <div className="relative w-full overflow-hidden">

          {/* BACKGROUND LAYERS */}
          {/* LAYER 0: Background Image (Unified for Mobile & Desktop) */}
          <div className="absolute inset-0 w-full h-[1200px] -z-10">
            <img
              src="/Background.jpg"
              alt="Background"
              className="w-full h-full object-cover object-center opacity-100"
            />
            {/* Optional Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-white/30 mix-blend-overlay" />
          </div>

          {/* LAYER 1: The "Organic" Color Blob */}
          <div
            className="absolute right-[-15%] top-[5%] w-[80%] h-[1200px] rounded-full pointer-events-none opacity-90 blur-[120px]"
            style={{
              background: 'conic-gradient(from 90deg at 50% 50%, #4C763B 0%, #22C55E 40%, #15803d 80%, #4C763B 100%)',
              zIndex: 0,
              transform: 'rotate(-20deg) scale(1.3)'
            }}
          />

          {/* LAYER 2: The "Random Structure" Texture */}
          <div className="absolute inset-0 pointer-events-none flex justify-end z-[1] overflow-hidden mix-blend-overlay opacity-70">
            <div className="flex w-3/4 h-full justify-end items-stretch">
              {lightBeams.map((beam, i) => (
                <div
                  key={i}
                  className={`h-full ${beam.width} ${beam.skew}`}
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, rgba(255,255,255,${beam.opacity}) 50%, transparent 100%)`,
                    marginLeft: '-15px',
                    filter: 'blur(4px)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* LAYER 3: The Left-Side Fade */}
          <div
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{
              background: 'linear-gradient(90deg, #FFFFFF 25%, rgba(255,255,255,0.8) 40%, transparent 70%)'
            }}
          />

          {/* LAYER 4: Bottom Fade Out (Smooth transition to white) */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[2]"
            style={{
              background: 'linear-gradient(to bottom, transparent, #FFFFFF)'
            }}
          />

          {/* Above the fold - Eager loaded */}
          <div className="relative z-10">
            <Hero />
            <div className="relative -mt-24 z-20 hidden md:block">
              <SearchTeaser />
            </div>
          </div>

          {/* Below the fold - Lazy loaded */}
          <div className="relative z-10">
            <Suspense fallback={<div className="h-40" />}>
              <ValueProps />
            </Suspense>
          </div>
        </div>

        <div className="relative z-20 bg-white">
          <Suspense fallback={<div className="py-12 bg-white flex justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-pink-500 rounded-full animate-spin"></div></div>}>
            <LazyFeaturedBarbers />
          </Suspense>

          <Suspense fallback={<div className="h-40" />}>
            <BarberOnboarding />
          </Suspense>

          <Suspense fallback={<div className="h-40" />}>
            <FAQ />
          </Suspense>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-gray-100 bg-white">
        <p className="text-gray-500 text-[10px] sm:text-xs">© 2024 GlossCut Technologies. Made with precision.</p>
      </footer>
    </div>
  );
}

export default HomeScreen;
