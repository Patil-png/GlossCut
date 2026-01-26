import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Scroll, AlertCircle, Scale, FileText } from 'lucide-react';

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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Terms of Service</h1>
                    <p className="text-gray-400">Last Updated: January 26, 2026</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-12"
                >
                    <Section title="1. Agreement to Terms">
                        <p>
                            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and <strong>GlossCut</strong> ("we," "us," or "our"), concerning your access to and use of the GlossCut website and mobile application.
                            By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.
                        </p>
                    </Section>

                    <Section title="2. Description of Service">
                        <p>
                            GlossCut is a technology platform that connects users ("Clients") seeking grooming services with independent professionals ("Barbers" or "Shops").
                            <strong>GlossCut is not a salon or barber service provider.</strong> The services are provided by independent third parties who are not employed by GlossCut. We are not responsible for the quality or safety of the services provided by these third parties.
                        </p>
                    </Section>

                    <Section title="3. User Accounts">
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Registration:</strong> You must create an account to use certain features. You agree to provide accurate and complete information.</li>
                            <li><strong>Security:</strong> You are responsible for safeguarding your password. You agree not to disclose your password to any third party.</li>
                            <li><strong>Eligibility:</strong> You must be at least 13 years old to use the Platform.</li>
                        </ul>
                    </Section>

                    <Section title="4. Booking, Payments, and Cancellations">
                        <div className="space-y-4">
                            <Card icon={<FileText size={20} className="text-amber-500" />} title="Booking Appointments">
                                When you book an appointment, you are entering into a direct contract with the Barber. GlossCut acts as an agent to facilitate the transaction.
                            </Card>
                            <Card icon={<Scale size={20} className="text-amber-500" />} title="Payments">
                                Payments are processed by third-party gateways (e.g., Razorpay). You agree to pay all charges associated with your booking at the prices then in effect.
                            </Card>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-amber-500" /> Cancellation Policy
                                </h4>
                                <p className="text-sm">
                                    Cancellations made less than <strong>1 hour</strong> before the appointment may incur a cancellation fee up to 50%.
                                    "No-shows" (failure to attend without canceling) may be charged the full amount and risk account suspension.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="5. Prohibited Activities">
                        <p className="mb-2">You agree not to engage in any of the following prohibited activities:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>Systematic retrieval of data to create a collection, compilation, database, or directory without written permission.</li>
                            <li>Harassing, annoying, intimidating, or threatening any of our employees or agents engaged in providing the service.</li>
                            <li>Using the Platform for any illegal purpose or inciting others to commit illegal acts.</li>
                            <li>Attempting to bypass security measures of the Platform (e.g., hacking, password mining).</li>
                        </ul>
                    </Section>

                    <Section title="6. Intellectual Property Rights">
                        <p>
                            Unless otherwise indicated, the Platform is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Platform (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                        </p>
                    </Section>

                    <Section title="7. Disclaimer">
                        <p className="italic text-gray-400">
                            THE PLATFORM IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. YOU AGREE THAT YOUR USE OF THE PLATFORM SERVICES WILL BE AT YOUR SOLE RISK.
                            WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE PLATFORM AND YOUR USE THEREOF.
                        </p>
                    </Section>

                    <Section title="8. Governing Law">
                        <p>
                            These Terms shall be governed by and defined following the laws of India. GlossCut and yourself irrevocably consent that the courts of <strong>Nagpur, Maharashtra</strong> shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                        </p>
                    </Section>

                    <Section title="9. Contact Us">
                        <p>
                            To resolve a complaint regarding the Platform or to receive further information regarding use of the Platform, please contact us at:
                        </p>
                        <div className="mt-4">
                            <p className="font-bold text-white">GlossCut Support</p>
                            <p className="text-indigo-400"><a href="mailto:support@glosscut.com">support@glosscut.com</a></p>
                            <p className="text-gray-500 text-sm mt-1">Nagpur, Maharashtra, India</p>
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

