import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from './Home/Hero';
import SearchTeaser from './Home/SearchTeaser';
import FeaturedShops from './Home/FeaturedShops';
import axios from 'axios';

// Lazy loaded below-the-fold components
const BarberOnboarding = lazy(() => import('./Home/BarberOnboarding'));
const FAQ = lazy(() => import('./Home/FAQ'));

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
              IMPROVED PERFORMANCE BACKGROUND
          ================================================================================== */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
            {/* Main Gradient - Soft and Premium without heavy blurring/mixing */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 80% 0%, rgba(76, 118, 59, 0.08) 0%, transparent 40%), radial-gradient(circle at 20% 100%, rgba(34, 197, 94, 0.05) 0%, transparent 40%)'
              }}
            />
            
            {/* Subtle Top-Right Glow - Static for performance */}
            <div
              className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-10 pointer-events-none animate-soft-pulse"
              style={{
                background: 'radial-gradient(circle, #4C763B 0%, transparent 70%)',
              }}
            />
          </div>



          {/* Above the fold - Eager loaded */}
          <div className="relative z-10">
            <Hero />
            <div className="relative -mt-12 md:-mt-24 z-20 block">
              <SearchTeaser />
            </div>
            {featuredShops.length > 0 && <FeaturedShops shops={featuredShops} />}
          </div>

        </div>

        <div className="relative z-20 bg-white" style={{ contentVisibility: 'auto' }}>
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
