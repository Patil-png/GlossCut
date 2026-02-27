import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    Scissors, Star, TrendingUp, Users, Calendar, Shield,
    Smartphone, Bell, CreditCard, BarChart2, MapPin, Clock,
    CheckCircle, ArrowRight, Zap, Award, ChevronDown, ChevronUp,
    Package, Headphones, QrCode, Mic, Sparkles,
    Store, Heart, UserCheck, Globe, Lock
} from 'lucide-react';

// ── Animation helpers ──────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, direction = 'up', className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
            x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
        },
        visible: { opacity: 1, y: 0, x: 0 },
    };
    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};



// ── FAQ Item ──────────────────────────────────────────────────────────────────
const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${open ? 'border-[#4C763B]/30 bg-[#4C763B]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
                <span className="font-semibold text-gray-900 text-sm md:text-base">{q}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${open ? 'bg-[#4C763B] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">{a}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Benefit card ──────────────────────────────────────────────────────────────
const BenefitCard = ({ icon: Icon, title, description, accent = '#4C763B', delay = 0 }) => (
    <FadeIn delay={delay}>
        <div className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/80 transition-all duration-300 hover:-translate-y-1 h-full">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: `${accent}18` }}>
                <Icon size={22} style={{ color: accent }} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
    </FadeIn>
);

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ text, color = '#4C763B' }) => (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-4"
        style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
        <Sparkles size={11} />
        {text}
    </div>
);

// ── Step card ─────────────────────────────────────────────────────────────────
const StepCard = ({ num, title, description, delay }) => (
    <FadeIn delay={delay}>
        <div className="flex gap-5">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-gray-900 text-white font-black text-sm flex items-center justify-center shadow-lg">{num}</div>
            <div>
                <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    </FadeIn>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const PartnerLanding = () => {

    // Tabs for the benefits section
    const [activeTab, setActiveTab] = useState('barber');

    const tabs = [
        { id: 'barber', label: 'For Barbers', icon: Scissors },
        { id: 'owner', label: 'For Shop Owners', icon: Store },
        { id: 'customer', label: 'For Customers', icon: Heart },
    ];

    const benefits = {
        barber: [
            { icon: Calendar, title: 'Smart Booking System', description: 'Get bookings 24/7 even when you\'re busy cutting. Customers book themselves, you just show up and work.', accent: '#4C763B' },
            { icon: Bell, title: 'Voice Acceptance', description: 'Use hands-free voice commands to accept new appointments while you\'re mid-cut. Say "Accept" and it\'s done.', accent: '#4C763B' },
            { icon: TrendingUp, title: 'Real-time Analytics', description: 'See your revenue trends, busiest hours, and top services — all from a sleek barber dashboard.', accent: '#4C763B' },
            { icon: CreditCard, title: 'Instant Payments', description: 'No more chasing payments. Customers pay digitally through the app before or after the session.', accent: '#4C763B' },
            { icon: Star, title: 'Build Your Reputation', description: 'Collect verified reviews and ratings that help new customers choose you over the competition.', accent: '#4C763B' },
            { icon: Clock, title: 'Live Queue Dashboard', description: 'Manage walk-ins and appointments from a single screen. Always know who\'s next, who\'s waiting.', accent: '#4C763B' },
        ],
        owner: [
            { icon: BarChart2, title: 'Shop-wide Analytics', description: 'Track every barber\'s revenue, bookings, and performance. Make data-driven decisions effortlessly.', accent: '#2563EB' },
            { icon: Users, title: 'Staff Management', description: 'Add, approve, and track your entire team from one dashboard. Promote staff changes in seconds.', accent: '#2563EB' },
            { icon: Globe, title: 'Discoverability on Map', description: 'Your shop appears on the GlossCut city map, available to thousands of nearby users actively searching.', accent: '#2563EB' },
            { icon: QrCode, title: 'QR-based Check-in', description: 'Customers scan a QR code at your shop to join the queue. Zero friction, zero paperwork.', accent: '#2563EB' },
            { icon: Shield, title: 'Verified Shop Badge', description: 'Earn a verified badge that builds trust instantly with potential customers browsing the platform.', accent: '#2563EB' },
            { icon: Package, title: 'Subscription Control', description: 'Simple monthly plan that activates your shop\'s full visibility. Cancel or change any time.', accent: '#2563EB' },
        ],
        customer: [
            { icon: Smartphone, title: 'Book in Under 60 Seconds', description: 'Find your barber, pick a time slot, confirm the booking — all without a single phone call.', accent: '#7C3AED' },
            { icon: MapPin, title: 'Discover Nearby Shops', description: 'Browse barber shops and salons near you on an interactive map with real ratings and photos.', accent: '#7C3AED' },
            { icon: Clock, title: 'Live Queue Tracking', description: 'Know exactly how long the wait is before you even leave home. Track your position in real time.', accent: '#7C3AED' },
            { icon: CreditCard, title: 'Secure Digital Payment', description: 'Pay securely through the app with UPI, card, or wallets. Keep a clear payment history forever.', accent: '#7C3AED' },
            { icon: Star, title: 'Setkar Coins Rewards', description: 'Earn loyalty coins on every booking that you can redeem for discounts on future appointments.', accent: '#7C3AED' },
            { icon: Headphones, title: 'Cancellation & Support', description: 'Plans change — cancel easily and get instant status updates. Our support team is always available.', accent: '#7C3AED' },
        ]
    };


    const faqs = [
        { q: 'Is GlossCut free for barbers to join?', a: 'Creating a barber profile is completely free. A subscription is only required for shop owners who want full map visibility and discoverability. Individual barbers joining an existing shop pay nothing.' },
        { q: 'How do customers find my shop?', a: 'Your shop appears on the GlossCut city map once your subscription is active. Customers can search by city, filter by category, and browse photos and ratings — right on the platform.' },
        { q: 'Can I manage walk-ins alongside online bookings?', a: 'Yes! GlossCut\'s queue system handles both online-booked and walk-in customers on the same live dashboard. You always see the full queue in real time.' },
        { q: 'How does the QR code check-in work?', a: 'Each shop gets a unique QR code. When a customer scans it, they\'re added to your live queue automatically. No app install required on the customer side — works entirely in the browser.' },
        { q: 'What happens when a customer cancels?', a: 'You\'re notified instantly via the barber PWA. The slot is freed and the next customer in queue moves up. Refunds are processed automatically for digital payments.' },
        { q: 'Do I need any special hardware?', a: 'None at all. GlossCut runs entirely on mobile browsers. Barbers use a PWA (installable app) on any smartphone. Customers use the main website or scan the QR code — no dedicated device needed.' },
    ];



    return (
        <div className="bg-white text-gray-900 overflow-x-hidden">

            {/* ── HERO ────────────────────────────────────────────────────────── */}
            <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gray-950">
                {/* Orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #4C763B, #22c55e)' }} />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-15" style={{ background: 'radial-gradient(circle, #2563EB, #7C3AED)' }} />
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                </div>

                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col lg:flex-row items-center gap-16">
                    {/* Left text */}
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4C763B]/30 bg-[#4C763B]/10 text-[#7fc96d] text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <Sparkles size={11} /> GlossCut Partner Program
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
                        >
                            Run Your Shop.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7fc96d] to-[#4C763B]">Own Your Growth.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10"
                        >
                            GlossCut is the complete operating system for barbers and salons — smart bookings, live queues, digital payments, and a customer community that finds you.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                        >
                            <a href="/barber-account-creation"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#4C763B] hover:bg-[#3b5c2e] text-white font-bold rounded-2xl transition-all hover:shadow-2xl hover:shadow-[#4C763B]/30 hover:-translate-y-0.5 text-sm">
                                Start for Free <ArrowRight size={16} />
                            </a>
                            <a href="#how-it-works"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all text-sm">
                                See How It Works
                            </a>
                        </motion.div>

                        {/* Trust badges */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            className="flex flex-wrap items-center gap-5 mt-10 justify-center lg:justify-start"
                        >
                            {['No hardware needed', 'Free to join', 'Setup in minutes'].map(t => (
                                <div key={t} className="flex items-center gap-2 text-gray-500 text-sm">
                                    <CheckCircle size={14} className="text-[#4C763B]" /> {t}
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right — floating dashboard mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                        className="w-full max-w-sm lg:max-w-md shrink-0"
                    >
                        <div className="relative">
                            {/* Main card */}
                            <div className="bg-gray-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-[#4C763B] flex items-center justify-center">
                                        <Scissors size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">GlossCut Dashboard</div>
                                        <div className="text-gray-500 text-xs">Today's Overview</div>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                </div>
                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    {[['₹4,280', 'Revenue', '#4C763B'], ['12', 'Bookings', '#2563EB'], ['4.8', 'Rating', '#f59e0b']].map(([v, l, c]) => (
                                        <div key={l} className="bg-white/5 rounded-xl p-3 text-center">
                                            <div className="text-lg font-black" style={{ color: c }}>{v}</div>
                                            <div className="text-gray-500 text-[10px] font-medium mt-0.5">{l}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Queue */}
                                <div className="space-y-2">
                                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Live Queue</div>
                                    {[['Rahul M.', '10:00 AM', 'In Chair', '#4C763B'], ['Priya S.', '10:30 AM', 'Waiting', '#f59e0b'], ['Om P.', '11:00 AM', 'Upcoming', '#6b7280']].map(([name, time, status, color]) => (
                                        <div key={name} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                                            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{name[0]}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-xs font-semibold truncate">{name}</div>
                                                <div className="text-gray-500 text-[10px]">{time}</div>
                                            </div>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, background: `${color}18` }}>{status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Floating badge */}
                            <motion.div
                                animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100"
                            >
                                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center"><Star size={16} className="text-amber-500" /></div>
                                <div>
                                    <div className="text-gray-900 font-black text-sm">4.9 ★</div>
                                    <div className="text-gray-400 text-[10px]">Shop Rating</div>
                                </div>
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100"
                            >
                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><TrendingUp size={16} className="text-[#4C763B]" /></div>
                                <div>
                                    <div className="text-gray-900 font-black text-sm">+32%</div>
                                    <div className="text-gray-400 text-[10px]">This Month</div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ── WHO IS IT FOR ────────────────────────────────────────────────── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <FadeIn>
                            <SectionLabel text="Benefits" />
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-2 mb-4">Built for everyone in the shop</h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Whether you're behind the chair, running the business, or booking an appointment — GlossCut has you covered.</p>
                        </FadeIn>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center mb-12">
                        <div className="inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                                        ${activeTab === id ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icon size={15} />
                                    <span className="hidden sm:block">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Benefit cards */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {benefits[activeTab].map((b, i) => (
                                <BenefitCard key={b.title} {...b} delay={i * 0.05} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
            <section id="how-it-works" className="py-24 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: steps */}
                        <div>
                            <FadeIn>
                                <SectionLabel text="How It Works" color="#2563EB" />
                                <h2 className="text-4xl font-black text-gray-900 mt-2 mb-4">From signup to first booking — in minutes</h2>
                                <p className="text-gray-500 mb-10">No complex setup. No hardware purchases. Just create your profile and start receiving bookings immediately.</p>
                            </FadeIn>
                            <div className="space-y-8">
                                {[
                                    ['01', 'Create Your Profile', 'Sign up as a barber, complete your personal details, and join or create your shop workspace. Takes under 3 minutes.'],
                                    ['02', 'Get Admin Approval', 'Our team quickly verifies your profile to keep the platform trusted and safe for customers.'],
                                    ['03', 'Go Live on the Map', 'Once approved, your shop appears on the GlossCut city map. Customers can find, view, and book you instantly.'],
                                    ['04', 'Manage from Anywhere', 'Accept bookings, track your queue, complete payments, and view your analytics — all from your phone.'],
                                ].map(([num, title, desc], i) => (
                                    <StepCard key={num} num={num} title={title} description={desc} delay={i * 0.1} />
                                ))}
                            </div>
                        </div>

                        {/* Right: feature highlights */}
                        <FadeIn direction="left">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: Mic, label: 'Voice Commands', sub: 'Accept bookings hands-free', color: '#4C763B' },
                                    { icon: QrCode, label: 'QR Check-in', sub: 'Walk-ins made effortless', color: '#2563EB' },
                                    { icon: Bell, label: 'Live Notifications', sub: 'Never miss a booking', color: '#f59e0b' },
                                    { icon: BarChart2, label: 'Revenue Reports', sub: 'Data at your fingertips', color: '#7C3AED' },
                                    { icon: Shield, label: 'Secure Payments', sub: 'UPI, card, wallets', color: '#EF4444' },
                                    { icon: UserCheck, label: 'Staff Control', sub: 'Manage your whole team', color: '#0891B2' },
                                ].map(({ icon: Icon, label, sub, color }, i) => (
                                    <motion.div
                                        key={label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.08 }}
                                        className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-0.5 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: `${color}15` }}>
                                            <Icon size={20} style={{ color }} />
                                        </div>
                                        <div className="font-bold text-gray-900 text-sm">{label}</div>
                                        <div className="text-gray-500 text-xs mt-0.5">{sub}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>


            {/* ── PRICING ──────────────────────────────────────────────────────── */}
            <section className="py-24 bg-gray-950">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn className="text-center mb-14">
                        <SectionLabel text="Pricing" color="#7fc96d" />
                        <h2 className="text-4xl font-black text-white mt-2 mb-4">Simple pricing, no surprises</h2>
                        <p className="text-gray-400 text-lg">Join free. Grow with us.</p>
                    </FadeIn>
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Free tier */}
                        <FadeIn>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-full">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Barber · Free</div>
                                <div className="text-4xl font-black text-white mb-1">₹0</div>
                                <div className="text-gray-500 text-sm mb-6">Forever free for individual barbers</div>
                                <div className="space-y-3 mb-8">
                                    {['Create your barber profile', 'Join an existing shop', 'Receive bookings from your shop', 'Queue management dashboard', 'Voice command acceptance', 'Customer ratings & reviews'].map(f => (
                                        <div key={f} className="flex items-center gap-3 text-gray-300 text-sm">
                                            <CheckCircle size={14} className="text-[#4C763B] shrink-0" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <a href="/barber-account-creation" className="block text-center py-3 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white/5 transition-colors">
                                    Join as Barber
                                </a>
                            </div>
                        </FadeIn>
                        {/* Pro tier */}
                        <FadeIn delay={0.1}>
                            <div className="relative bg-[#4C763B] border border-[#4C763B] rounded-3xl p-8 h-full overflow-hidden">
                                <div className="absolute top-5 right-5 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20">Recommended</div>
                                <div className="text-[#7fc96d]/80 text-xs font-bold uppercase tracking-widest mb-4">Shop Owner · Pro</div>
                                <div className="text-4xl font-black text-white mb-1">₹199<span className="text-xl font-semibold text-white/60">/mo</span></div>
                                <div className="text-white/60 text-sm mb-6">Full visibility + shop management</div>
                                <div className="space-y-3 mb-8">
                                    {['Everything in Free', 'Shop appears on city map', 'Manage unlimited staff', 'QR code walk-in check-in', 'Full revenue analytics', 'Verified shop badge', 'Priority customer support'].map(f => (
                                        <div key={f} className="flex items-center gap-3 text-white/90 text-sm">
                                            <CheckCircle size={14} className="text-white shrink-0" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <a href="/barber-account-creation" className="block text-center py-3 rounded-xl bg-white text-[#4C763B] font-black text-sm hover:bg-gray-100 transition-colors">
                                    Join as Shop Owner
                                </a>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────────────── */}
            <section className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-6">
                    <FadeIn className="text-center mb-12">
                        <SectionLabel text="FAQs" color="#4C763B" />
                        <h2 className="text-4xl font-black text-gray-900 mt-2">Common questions answered</h2>
                    </FadeIn>
                    <div className="space-y-3">
                        {faqs.map((faq) => <FAQItem key={faq.q} {...faq} />)}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────────── */}
            <section className="py-24 bg-gray-950 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(76,118,59,0.2)_0%,transparent_70%)]" />
                </div>
                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <div className="w-16 h-16 rounded-2xl bg-[#4C763B] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#4C763B]/40">
                            <Scissors size={28} className="text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                            Ready to upgrade<br />your barbering business?
                        </h2>
                        <p className="text-gray-400 text-lg mb-10">Join hundreds of barbers and shop owners already growing with GlossCut. Setup takes less than 5 minutes.</p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                            <a href="/barber-account-creation"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#4C763B] hover:bg-[#3b5c2e] text-white font-bold rounded-2xl transition-all hover:shadow-2xl hover:shadow-[#4C763B]/30 hover:-translate-y-0.5 text-sm">
                                Create Free Account <ArrowRight size={16} />
                            </a>
                            <a href="/"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all text-sm">
                                Learn More About GlossCut
                            </a>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-10 text-gray-600 text-sm">
                            <div className="flex items-center gap-2"><Lock size={13} /> Secure & Private</div>
                            <div className="flex items-center gap-2"><Zap size={13} /> 5-min Setup</div>
                            <div className="flex items-center gap-2"><Award size={13} /> Admin Verified</div>
                        </div>
                    </FadeIn>
                </div>
            </section>

        </div>
    );
};

export default PartnerLanding;
