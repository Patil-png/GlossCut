import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { RefreshCcw, AlertCircle, Coins } from 'lucide-react';

const RefundPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-amber-500/30 pt-24 pb-20 px-6">
            <Helmet>
                <title>Refund & Cancellation Policy | GlossCut</title>
                <meta name="description" content="Read GlossCut's Refund and Cancellation Policy. Understand our role as an aggregator and our coin-based refund system." />
                <link rel="canonical" href="https://www.glosscut.com/refund-policy" />
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
                            <RefreshCcw size={40} className="text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Refund & Cancellation Policy</h1>
                    <p className="text-gray-400">Last Updated: February 6, 2026</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-12"
                >
                    <Section title="1. Aggregator Role">
                        <p>
                            <strong>GlossCut</strong> acts strictly as a technology aggregator connecting customers with independent service providers (barbers and salons).
                            We do not directly provide grooming or salon services and are not responsible for the actual service quality or results delivered by individual shops or professionals.
                        </p>
                    </Section>

                    <Section title="2. Cancellation Policy">
                        <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex gap-4 items-start">
                            <AlertCircle className="text-amber-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="text-white font-bold mb-2">Standard Cancellation Rules</h4>
                                <p className="text-sm">
                                    Appointments can be cancelled or rescheduled up to <strong>2 hours</strong> before the scheduled time without penalty.
                                    Cancellations made within the 2-hour window or "No-Shows" may be subject to a cancellation fee of up to 50% of the service value, which is paid directly to the service provider.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="3. Refund as GlossCut Coins">
                        <p className="mb-4">
                            GlossCut operates on a <strong>"No Cash Refund"</strong> policy for all prepayments and convenience fees.
                            In the event of a valid dispute or system error, authorized refunds will be processed as follows:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card icon={<Coins size={20} className="text-amber-500" />} title="GlossCut Coins">
                                All eligible refunds are issued exclusively in the form of <strong>GlossCut Coins</strong> credited back to your app wallet.
                            </Card>
                            <Card icon={<RefreshCcw size={20} className="text-amber-500" />} title="Usage">
                                These coins can be used 1:1 against any future booking on the Platform and have no expiration date while the account is active.
                            </Card>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 italic">
                            *GlossCut Coins are non-transferable and cannot be withdrawn or converted into Fiat currency (INR).
                        </p>
                    </Section>

                    <Section title="4. Disputes & Service Quality">
                        <p>
                            Since the contract for service is between you and the Barber Shop, any grievances regarding the quality of the haircut or salon service must be resolved directly with the shop management at the time of service.
                            GlossCut is not liable for unsatisfactory services, physical injuries, or any other damages occurring at the vendor's premises.
                        </p>
                    </Section>

                    <Section title="5. Contact for Support">
                        <p>
                            If you believe you have been wrongly charged or have experienced a technical payment failure, please reach out to our support team within 24 hours of the incident.
                        </p>
                        <div className="mt-4">
                            <p className="font-bold text-white">GlossCut Billing Support</p>
                            <p className="text-indigo-400"><a href="mailto:billing@glosscut.com">billing@glosscut.com</a></p>
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
    <div className="bg-[#111] p-4 rounded-lg border border-white/5 h-full">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <div className="font-bold text-white">{title}</div>
        </div>
        <div className="text-sm text-gray-500 leading-relaxed">{children}</div>
    </div>
);

export default RefundPolicy;
