import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scroll, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
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
                            <Scroll size={40} className="text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Terms of Service</h1>
                    <p className="text-gray-400">Last Updated: January 24, 2026</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-12"
                >
                    <Section title="1. Acceptance of Terms">
                        By accessing or using the GlossCut platform (website and mobile applications), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
                    </Section>

                    <Section title="2. Services Provided">
                        GlossCut serves as an intermediary platform connecting users ("Clients") with grooming professionals ("Barbers" or "Salons"). We facilitate booking, scheduling, and payment processing but do not directly provide grooming services.
                    </Section>

                    <Section title="3. User Accounts">
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You must provide accurate and complete information during registration.</li>
                            <li>We reserve the right to terminate accounts that violate our community guidelines.</li>
                        </ul>
                    </Section>

                    <Section title="4. Booking & Cancellations">
                        <div className="bg-[#111] p-6 rounded-xl border border-white/5 mt-4">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <AlertCircle size={16} className="text-amber-500" /> Cancellation Policy
                            </h4>
                            <p className="text-sm">
                                Cancellations made less than 1 hour before the scheduled appointment time may incur a cancellation fee of up to 50% of the service cost. No-shows may be charged the full amount.
                            </p>
                        </div>
                    </Section>

                    <Section title="5. Payments">
                        GlossCut uses secure third-party payment gateways (Razorpay/UPI) for transactions. We do not store your financial data on our servers. All fees are inclusive of applicable taxes unless stated otherwise.
                    </Section>

                    <Section title="6. User Conduct">
                        You agree not to use the platform for any unlawful purpose or to solicit others to perform or participate in any unlawful acts. harassment, abuse, or discrimination against any Barber or Client will result in immediate ban.
                    </Section>

                    <Section title="7. Limitation of Liability">
                        GlossCut shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the service or any services obtained through the platform.
                    </Section>

                </motion.div>

                {/* Footer */}
                <div className="mt-20 pt-10 border-t border-white/10 text-center">
                    <p className="text-sm text-gray-500">
                        Questions? Contact us at <a href="mailto:legal@glosscut.com" className="text-amber-500 hover:underline">legal@glosscut.com</a>
                    </p>
                </div>

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

export default TermsOfService;
