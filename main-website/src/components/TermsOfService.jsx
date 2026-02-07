import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Scroll, AlertCircle, Scale } from 'lucide-react';

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-amber-500/30 pt-24 pb-20 px-6">
            <Helmet>
                <title>Terms of Service | GlossCut</title>
                <meta name="description" content="Read GlossCut's Terms of Service. Understand our booking policies, cancellations, and user agreements." />
                <link rel="canonical" href="https://www.glosscut.com/terms" />
            </Helmet>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30">
                            <Scroll size={40} className="text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Terms and Conditions</h1>
                    <p className="text-gray-400">Last Updated: February 7, 2026</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-12"
                >
                    <Section title="1. Introduction">
                        <p>
                            Welcome to GlossCut. These Terms and Conditions ("Terms") govern your use of the GlossCut mobile application and website (collectively, the "Platform").
                        </p>
                        <p className="mt-4">
                            By downloading, accessing, or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
                        </p>
                    </Section>

                    <Section title="2. Service Description">
                        <p className="mb-4">
                            GlossCut acts as an intermediary connecting users ("Customers") with third-party service providers ("Partners," e.g., salons, barbers, spas).
                        </p>
                        <ul className="list-disc pl-5 space-y-3 text-gray-400">
                            <li><strong>Digital Queue System:</strong> We provide a live queue management and digital token system. We do not own, operate, or control the services provided by the Partners.</li>
                            <li><strong>No Fixed Appointments:</strong> GlossCut is not an appointment-based service. When you book, you are securing a position (token) in the Partner's live queue.</li>
                            <li><strong>Wait Times:</strong> All wait times displayed on the app are estimates only based on average service durations. Real-time conditions at the shop (e.g., a customer taking longer than expected) may alter your actual waiting time.</li>
                        </ul>
                    </Section>

                    <Section title="3. User Accounts">
                        <ul className="list-disc pl-5 space-y-3 text-gray-400">
                            <li><strong>Eligibility:</strong> You must be at least 15 years old to use this Platform, or use it under the supervision of a parent/guardian.</li>
                            <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials (OTP/Phone Number). You are fully responsible for all activities that occur under your account.</li>
                            <li><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete information during the registration process to ensure valid bookings.</li>
                        </ul>
                    </Section>

                    <Section title="4. Booking, Queueing, and Payments">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-white font-bold mb-2">Platform Fee vs. Service Fee:</h4>
                                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                                    <li><strong>Platform Fee:</strong> GlossCut charges a non-refundable "Convenience Fee" (e.g., for Basic or Express tokens) for the use of our technology to secure your spot in the queue. This fee is paid directly to GlossCut via Razorpay.</li>
                                    <li><strong>Service Fee:</strong> The cost of the actual service (e.g., haircut, shave) is determined by the Partner and is payable directly to the Partner at the shop, unless otherwise indicated.</li>
                                </ul>
                            </div>

                            <Card icon={<Scale size={20} className="text-amber-500" />} title="Queue Priority">
                                Buying an "Express" token (if available) prioritizes your position in the virtual queue but does not guarantee immediate service upon arrival if the barber is currently engaged.
                            </Card>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-amber-500" /> No-Show & Cancellation Policy
                                </h4>
                                <ul className="list-disc pl-5 space-y-2 text-gray-400 text-sm">
                                    <li><strong>No-Show:</strong> If you are not present at the Partner’s location when your token number is called, you may lose your spot. The Platform Fee is non-refundable in the event of a "No-Show."</li>
                                    <li><strong>By User:</strong> The Platform Fee is generally non-refundable if you cancel the booking voluntarily.</li>
                                    <li><strong>By Partner:</strong> If the Partner cancels your token or cannot fulfill the service due to unforeseen circumstances (e.g., shop closing early), a refund of the Platform Fee will be processed to you in the form of GlossCut Coins within 5-7 business days.</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section title="5. User Conduct">
                        <p className="mb-2">You agree not to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>Make fake or speculative bookings that disrupt the queue for others.</li>
                            <li>Harass, abuse, or threaten Partners or GlossCut support staff.</li>
                            <li>Use the Platform for any illegal purpose.</li>
                            <li>Attempt to reverse-engineer, hack, or manipulate the queue algorithm.</li>
                        </ul>
                        <p className="mt-4 text-amber-500/80 italic">Violation of these rules may result in immediate suspension or permanent termination of your account.</p>
                    </Section>

                    <Section title="6. Limitation of Liability">
                        <p className="mb-2">To the fullest extent permitted by Indian law:</p>
                        <ul className="list-disc pl-5 space-y-3 text-gray-400">
                            <li><strong>Service Quality:</strong> GlossCut is a technology provider, not a salon. We are not liable for the quality, safety, hygiene, or standard of the services provided by the Partner. Any dispute regarding the haircut or service itself must be resolved directly with the Partner.</li>
                            <li><strong>Platform Issues:</strong> We are not liable for any damages resulting from the use of, or inability to use, the Platform, including app failures, internet delays, or data loss.</li>
                        </ul>
                    </Section>

                    <Section title="7. Intellectual Property">
                        <p>
                            All content on the Platform, including text, graphics, logos, the "GlossCut" brand, and software, is the property of the Company or its licensors and is protected by Indian copyright and trademark laws.
                        </p>
                    </Section>

                    <Section title="8. Governing Law and Dispute Resolution">
                        <p>
                            These Terms shall be governed by the laws of India.
                        </p>
                        <p className="mt-2">
                            Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts located in <strong>Amravati, Maharashtra</strong>.
                        </p>
                    </Section>

                    <Section title="9. Changes to Terms">
                        <p>
                            We reserve the right to modify these Terms at any time. We will notify users of any significant changes by updating the "Last Updated" date or through an in-app notification.
                        </p>
                    </Section>

                    <Section title="10. Contact Us">
                        <p>
                            For any questions regarding these Terms, please contact us at:
                        </p>
                        <div className="mt-4">
                            <p className="font-bold text-white">GlossCut Support</p>
                            <p className="text-indigo-400"><a href="mailto:support@glosscut.com">support@glosscut.com</a></p>
                            <p className="text-gray-400 mt-1">Instagram: <span className="text-indigo-400">gloss_cut</span></p>
                        </div>
                    </Section>

                </motion.div>

            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <section>
        <h2 className="text-2xl font-bold text-white mb-4 font-serif">{title}</h2>
        <div className="text-lg leading-relaxed text-gray-400">
            {children}
        </div>
    </section>
);

const Card = ({ icon, title, children }) => (
    <div className="bg-[#111] p-4 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <div className="font-bold text-white">{title}</div>
        </div>
        <div className="text-sm text-gray-500 leading-relaxed">{children}</div>
    </div>
);

export default TermsOfService;

