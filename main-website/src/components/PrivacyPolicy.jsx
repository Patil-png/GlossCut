import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Smartphone, Mail, MapPin } from 'lucide-react';

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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Privacy Policy</h1>
                    <p className="text-gray-400">Last Updated: January 26, 2026</p>
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
                            Welcome to <strong>GlossCut</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website
                            (collectively, the "Platform"). By using our Platform, you consent to the data practices described in this policy.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <p className="mb-4">We collect information to provide better services to all our users:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card icon={<Eye size={20} className="text-amber-500" />} title="Personal Data">
                                Name, email address, phone number, and profile picture provided during registration.
                            </Card>
                            <Card icon={<MapPin size={20} className="text-amber-500" />} title="Location Data">
                                precise location data (GPS) to find nearby salons and barbers. This is collected only when the app is in use.
                            </Card>
                            <Card icon={<Smartphone size={20} className="text-amber-500" />} title="Device Information">
                                Device ID, model, operating system version, and IP address for security and optimization.
                            </Card>
                            <Card icon={<Smartphone size={20} className="text-amber-500" />} title="Payment Information">
                                Transaction history. <strong>We do not store complete credit card numbers.</strong> All payments are processed by Razorpay.
                            </Card>
                        </div>
                    </Section>

                    <Section title="3. App Permissions">
                        <p className="mb-4">To provide the full GlossCut experience, we may request the following permissions on your mobile device:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li><strong>Camera & Photo Library:</strong> To allow you to upload profile pictures or (for barbers) shop images and portfolio photos.</li>
                            <li><strong>Location Services:</strong> To show you the nearest barbershops and estimate travel time.</li>
                            <li><strong>Notifications:</strong> To send booking confirmations, reminders, and exclusive deals.</li>
                        </ul>
                        <p className="mt-2 text-sm text-gray-500">You can revoke these permissions at any time in your device settings, though some features may become unavailable.</p>
                    </Section>

                    <Section title="4. How We Use Your Data">
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li><strong>Service Delivery:</strong> To facilitate bookings, process payments, and manage user accounts.</li>
                            <li><strong>Communication:</strong> To send appointment reminders, booking confirmations (via SMS/WhatsApp), and support responses.</li>
                            <li><strong>Optimization & Efficiency:</strong> To analyze user behavior, improve our queue management algorithms, and enhance overall Platform efficiency for the "GlossCut" ecosystem.</li>
                            <li><strong>Improvement:</strong> To analyze usage trends and improve our AI-driven recommendations.</li>
                            <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents.</li>
                        </ul>
                    </Section>

                    <Section title="5. Data Sharing & Disclosure">
                        We do not sell your personal data. We may share information with:
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
                            <li><strong>Barbers/Shops:</strong> Your name and booking details are shared with the service provider you book with.</li>
                            <li><strong>Service Providers:</strong> Trusted third parties like Razorpay (payments), Google Firebase (authentication), and cloud hosting services.</li>
                            <li><strong>Legal Requirements:</strong> If required by law, court order, or government regulation.</li>
                        </ul>
                    </Section>

                    <Section title="6. Data Security">
                        <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex gap-4 items-start">
                            <Lock className="text-amber-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="text-white font-bold mb-2">Security Measures</h4>
                                <p className="text-sm">
                                    We implement industry-standard security measures, including <strong>AES-256 encryption</strong> for data in transit and at rest.
                                    Sensitive data like passwords are hashed using bcrypt. Access to personal data is restricted to authorized personnel only.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="7. Data Retention">
                        <p>
                            We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy.
                            If you delete your account, we will delete your personal data within 30 days, except for data required to be retained by law (e.g., tax records of transactions).
                        </p>
                    </Section>

                    <Section title="8. Children's Privacy">
                        <p>
                            Our Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.
                            If we discover that a child under 13 has provided us with personal information, we will immediately delete such information.
                        </p>
                    </Section>

                    <Section title="9. Contact Us">
                        <p className="mb-4">If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                        <div className="bg-[#111] p-6 rounded-xl border border-white/5 inline-block pr-12">
                            <div className="flex items-center gap-3 mb-2">
                                <Mail className="text-amber-500" size={20} />
                                <span className="text-white font-bold">Email:</span>
                                <a href="mailto:support@glosscut.com" className="text-indigo-400 hover:text-indigo-300">support@glosscut.com</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="text-amber-500" size={20} />
                                <span className="text-white font-bold">Address:</span>
                                <span>GlossCut HQ, Nagpur, Maharashtra, India</span>
                            </div>
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

export default PrivacyPolicy;

