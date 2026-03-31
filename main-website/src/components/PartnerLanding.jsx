import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    Scissors, Star, TrendingUp, Users, Calendar, Shield,
    Smartphone, CreditCard, BarChart2, MapPin, Clock,
    CheckCircle, ArrowRight, Zap, Award, ChevronDown, ChevronUp,
    Package, Headphones, QrCode,
    Store, Heart, UserCheck, Globe, Lock, Sparkles
} from 'lucide-react';

const NotificationIcon = ({ size = 20, className = "" }) => (
    <img src="/ic_stat_notification_icon.png" style={{ width: size, height: size }} className={className} alt="Notification" />
);

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

// ── Benefit card (Compact) ────────────────────────────────────────────────────
const BenefitCard = ({ icon: Icon, title, description, accent = '#4C763B', delay = 0 }) => (
    <FadeIn delay={delay}>
        <div className="group flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
            <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${accent}12` }}>
                <Icon size={18} style={{ color: accent }} />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm mb-0.5">{title}</h3>
                <p className="text-gray-500 text-[12px] leading-relaxed">{description}</p>
            </div>
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

const PartnerLanding = () => {
    const benefits = {
        barber: [
            { icon: Calendar, title: 'Smart Booking System', description: 'Get bookings 24/7 even when you\'re busy cutting. Customers book themselves, you just show up and work.', accent: '#4C763B' },
            { icon: NotificationIcon, title: 'Smart Voice Notifications', description: 'Hear every update hands-free. Real-time voice alerts for new bookings and confirmations while you work.', accent: '#4C763B' },
            { icon: TrendingUp, title: 'Real-time Analytics', description: 'See your revenue trends, busiest hours, and top services — all from a sleek barber dashboard.', accent: '#4C763B' },
            { icon: CreditCard, title: 'Payments Issues', description: 'The Customer will pay all your services Price to you. We will not take a single penny from that.', accent: '#4C763B' },
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
            {/* ── BENEFITS SECTION ───────────────────────────────────────────── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <FadeIn>
                            <SectionLabel text="Benefits" />
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mt-2 mb-6">Built for everyone</h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">GlossCut streamlines the experience for barbers, shop owners, and customers alike.</p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Barbers Column */}
                        <div className="bg-gray-50/40 border border-gray-100 rounded-[32px] p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="w-10 h-10 rounded-xl bg-[#4C763B] flex items-center justify-center text-white shadow-lg shadow-[#4C763B]/20">
                                    <Scissors size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 leading-none">For Barbers</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Workspace</p>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                {benefits.barber.map((b, i) => (
                                    <BenefitCard key={b.title} {...b} delay={i * 0.05} />
                                ))}
                            </div>
                            <div className="mt-8 px-2">
                                <a href="/barber-account-creation" className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-2xl group hover:border-[#4C763B] transition-all">
                                    <span className="font-bold text-sm text-gray-900">Join as Barber</span>
                                    <ArrowRight size={16} className="text-[#4C763B] group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                        {/* Owners Column */}
                        <div className="bg-blue-50/30 border border-blue-100/50 rounded-[32px] p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                    <Store size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 leading-none">For Owners</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Scale Business</p>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                {benefits.owner.map((b, i) => (
                                    <BenefitCard key={b.title} {...b} delay={i * 0.05} />
                                ))}
                            </div>
                            <div className="mt-8 px-2">
                                <a href="/barber-account-creation" className="flex items-center justify-between w-full p-4 bg-white border border-blue-100 rounded-2xl group hover:border-blue-600 transition-all">
                                    <span className="font-bold text-sm text-gray-900">Join as Owner</span>
                                    <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                        {/* Customers Column */}
                        <div className="bg-purple-50/30 border border-purple-100/50 rounded-[32px] p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                                    <Heart size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 leading-none">For Partners</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enhance Experience</p>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                {benefits.customer.map((b, i) => (
                                    <BenefitCard key={b.title} {...b} delay={i * 0.05} />
                                ))}
                            </div>
                            <div className="mt-8 px-2">
                                <a href="/" className="flex items-center justify-between w-full p-4 bg-white border border-purple-100 rounded-2xl group hover:border-purple-600 transition-all">
                                    <span className="font-bold text-sm text-gray-900">Explore App</span>
                                    <ArrowRight size={16} className="text-purple-600 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
            <section id="how-it-works" className="py-24 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
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

                        <FadeIn direction="left">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: NotificationIcon, label: 'Live Notifications', sub: 'Never miss a booking', color: '#f59e0b' },
                                    { icon: QrCode, label: 'QR Check-in', sub: 'Walk-ins made effortless', color: '#2563EB' },
                                    { icon: BarChart2, label: 'Revenue Reports', sub: 'Data at your fingertips', color: '#7C3AED' },
                                    { icon: Shield, label: 'Secure Payments', sub: 'UPI, card, wallets', color: '#EF4444' },
                                    { icon: UserCheck, label: 'Staff Control', sub: 'Manage your whole team', color: '#0891B2' },
                                    { icon: Star, label: 'Verified Rep', sub: 'Build customer trust', color: '#4C763B' },
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
                    <div className="text-center mb-14">
                        <FadeIn>
                            <SectionLabel text="Pricing" color="#7fc96d" />
                            <h2 className="text-4xl font-black text-white mt-2 mb-4">Simple pricing, no surprises</h2>
                            <p className="text-gray-400 text-lg">Join free. Grow with us.</p>
                        </FadeIn>
                    </div>
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
                    <div className="text-center mb-12">
                        <FadeIn>
                            <SectionLabel text="FAQs" color="#4C763B" />
                            <h2 className="text-4xl font-black text-gray-900 mt-2">Common questions answered</h2>
                        </FadeIn>
                    </div>
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
