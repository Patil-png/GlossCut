import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-amber-500/30 pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30">
                            <Shield size={40} className="text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Privacy Protocol</h1>
                    <p className="text-gray-400">Last Updated: January 24, 2026</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-12"
                >
                    <Section title="1. Information We Collect">
                        <p className="mb-4">We collect information that you provide directly to us:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card icon={<EqualIcon />} title="Personal Data">Name, email, phone number, and location data for service matching.</Card>
                            <Card icon={<CreditCardIcon />} title="Payment Info">Transaction history and method (processed securely via Razorpay).</Card>
                        </div>
                    </Section>

                    <Section title="2. How We Use Your Data">
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>To facilitate bookings and payments between you and barbers.</li>
                            <li>To provide customer support and respond to inquiries.</li>
                            <li>To improve our AI matching algorithms and service recommendations.</li>
                            <li>To send you updates, security alerts, and administrative messages.</li>
                        </ul>
                    </Section>

                    <Section title="3. Data Security">
                        <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex gap-4 items-start">
                            <Lock className="text-amber-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="text-white font-bold mb-2">Encryption Standards</h4>
                                <p className="text-sm">
                                    We use industry-standard encryption (AES-256) to protect your data in transit and at rest. Your password and sensitivity information are hashed and never stored in plain text.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="4. Data Sharing">
                        We do not sell your personal data. We only share information with:
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Barbers/Salons:</strong> To fulfill your appointment requests (Name, Service details).</li>
                            <li><strong>Service Providers:</strong> Cloud hosting, payment processing, and analytics.</li>
                            <li><strong>Legal Authorities:</strong> If required by law or to protect rights and safety.</li>
                        </ul>
                    </Section>

                    <Section title="5. Your Rights">
                        You have the right to access, correct, or delete your personal data. You can manage your preferences in the "Profile" section of the app or contact us to request full data deletion.
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
        <div className="font-bold text-white mb-1">{title}</div>
        <div className="text-sm text-gray-500">{children}</div>
    </div>
);

const EqualIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
); // User icon as placeholder

const CreditCardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
);

export default PrivacyPolicy;
