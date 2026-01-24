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
  return (
    <div className="min-h-screen bg-[#020202] font-sans text-zinc-200 selection:bg-amber-500/30 selection:text-amber-100">
      <Helmet>
        <title>GlossCut | Book Best Salons & Barbers Near You</title>
        <meta name="description" content="Discover and book top-rated salons and barbershops in Amravati and Nagpur. Real-time slots, UPI payments, and verified reviews." />
      </Helmet>

      <main>
        {/* Above the fold - Eager loaded */}
        <Hero />
        <div className="relative -mt-24 z-20 hidden md:block">
          <SearchTeaser />
        </div>

        {/* Below the fold - Lazy loaded */}
        <Suspense fallback={<div className="h-40" />}>
          <ValueProps />
        </Suspense>

        <Suspense fallback={<div className="py-12 bg-[#050505] flex justify-center"><div className="w-6 h-6 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div></div>}>
          <LazyFeaturedBarbers />
        </Suspense>

        <Suspense fallback={<div className="h-40" />}>
          <BarberOnboarding />
        </Suspense>

        <Suspense fallback={<div className="h-40" />}>
          <FAQ />
        </Suspense>
      </main>

      <footer className="py-6 text-center border-t border-zinc-900 bg-[#020202]">
        <p className="text-zinc-600 text-[10px] sm:text-xs">© 2024 GlossCut Technologies. Made with precision.</p>
      </footer>
    </div>
  );
}

export default HomeScreen;
