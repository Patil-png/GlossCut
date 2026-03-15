import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from './Home/Hero';
import SearchTeaser from './Home/SearchTeaser';
import FeaturedShops from './Home/FeaturedShops';
import axios from 'axios';

// Lazy loaded below-the-fold components
const BarberOnboarding = lazy(() => import('./Home/BarberOnboarding'));
const FAQ = lazy(() => import('./Home/FAQ'));
const LazyFeaturedBarbers = lazy(() => import('./FeaturedBarbers').catch(() => ({ default: () => <div className="py-10 text-center text-zinc-500">Loading Barbers...</div> })));

function HomeScreen() {
  const [featuredShops, setFeaturedShops] = React.useState([]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';
        const res = await axios.get(`${apiUrl}/api/settings`);
        setFeaturedShops(res.data.featuredShopIds || []);
      } catch (err) {
        console.error('Error fetching featured shops:', err);
      }
    };
    fetchSettings();
  }, []);
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
      <Helmet>
        <title>GlossCut | Best Salon Shop Near Me | Book Haircuts & Grooming</title>
        <meta name="description" content="Discover and book top-rated salons and barbershops in Amravati and Nagpur. Real-time slots, UPI payments, and verified reviews." />
        <link rel="canonical" href="https://www.glosscut.com/" />
      </Helmet>

      <main>
        {/* SHARED BACKGROUND WRAPPER */}
        <div className="relative w-full overflow-hidden">

          {/* ==================================================================================
              BACKGROUND LAYERS (SPLIT SYSTEM)
          ================================================================================== */}

          {/* 
              ----------------------------------------------------------------------------------
              1. MOBILE BACKGROUND (Premiere Gradient Design)
              Visible only on screens < 1024px
              ----------------------------------------------------------------------------------
           */}
          <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
            {/* Base Background - Subtle vertical fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

            {/* Top Right - Stronger Brand Green Glow */}
            <div
              className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply"
              style={{
                background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
              }}
            />

            {/* Bottom Left - Rich Purple/Pink Accent */}
            <div
              className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply"
              style={{
                background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)',
              }}
            />

            {/* Center Right - Warm Golden Glow for vibrancy */}
            <div
              className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply"
              style={{
                background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)',
              }}
            />

            {/* Texture Overlay (Noise) - Increased opacity slightly for visibility */}
            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

            {/* Grid Pattern Overlay for structure (Very subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          </div>

          {/* 
              ----------------------------------------------------------------------------------
              2. DESKTOP BACKGROUND (Whitish + Faint Green Patches)
              Visible only on screens >= 1024px
              ----------------------------------------------------------------------------------
           */}
          <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
            {/* Base Background */}
            <div className="absolute inset-0 bg-gray-100/60" />

            {/* Top Right - Faint Green Glow (Floating) */}
            <div
              className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float"
              style={{
                background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
              }}
            />

            {/* Bottom Left - Faint Green Glow (Floating Delayed) */}
            <div
              className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed"
              style={{
                background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)',
              }}
            />

            {/* Center Left - Very Faint Warmth (Floating Slow) - Adds depth */}
            <div
              className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply animate-float-slow"
              style={{
                background: 'radial-gradient(circle, #86efac 0%, #4ade80 100%)', // Very light green/mint
              }}
            />

            {/* Texture Overlay (Noise) - Very Faint */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

            {/* Grid Pattern Overlay for structure (Very subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          </div>



          {/* Above the fold - Eager loaded */}
          <div className="relative z-10">
            <Hero />
            <div className="relative -mt-12 md:-mt-24 z-20 block">
              <SearchTeaser />
            </div>
          </div>

        </div>

        <div className="relative z-20 bg-white">
          {featuredShops.length > 0 && <FeaturedShops shops={featuredShops} />}
          {featuredShops.length === 0 && (
            <Suspense fallback={<div className="py-12 bg-white flex justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-pink-500 rounded-full animate-spin"></div></div>}>
              <LazyFeaturedBarbers />
            </Suspense>
          )}

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
