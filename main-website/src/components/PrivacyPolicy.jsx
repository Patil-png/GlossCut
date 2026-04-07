import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Smartphone, Mail, MapPin } from 'lucide-react';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden">
            {/* BACKGROUND SYSTEM */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Mobile Background */}
                <div className="absolute inset-0 block lg:hidden z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                    <div className="absolute top-[-10%] right-[-15%] w-[100vw] h-[100vw] rounded-full blur-[80px] opacity-30 mix-blend-multiply"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[0%] left-[-20%] w-[90vw] h-[90vw] rounded-full blur-[90px] opacity-20 mix-blend-multiply"
                        style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
                </div>

                {/* Desktop Background */}
                <div className="hidden lg:block absolute inset-0 z-0 bg-gray-50">
                    <div className="absolute inset-0 bg-gray-100/60" />
                    <div className="absolute top-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-25 mix-blend-multiply animate-float"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-20 mix-blend-multiply animate-float-delayed"
                        style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
                    <div className="absolute top-[30%] left-[25%] w-[35vw] h-[35vw] rounded-full blur-[110px] opacity-10 mix-blend-multiply animate-float-slow"
                        style={{ background: 'radial-gradient(circle, #86efac 0%, #4ade80 100%)' }} />
                </div>

                {/* Texture & Grid */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto pt-28 pb-24 px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="flex justify-center mb-8">
                        <div className="p-5 rounded-2xl bg-[#4C763B]/10 border border-[#4C763B]/20 shadow-sm">
                            <Shield size={36} className="text-[#4C763B]" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight font-serif">Privacy Policy</h1>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-1 w-16 bg-gradient-to-r from-[#4C763B] to-green-500 rounded-full mb-2" />
                        <p className="text-gray-500 text-sm font-medium tracking-wide">Last Updated: April 8, 2026</p>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-16"
                >
                    <Section title="1. Introduction">
                        <p>
                            Welcome to <strong>GlossCut</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website
                            (collectively, the "Platform"). By using our Platform, you consent to the data practices described in this policy.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <p className="mb-8 text-gray-700">We collect information to provide better services to all our users:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card icon={<Eye size={20} className="text-[#4C763B]" />} title="Personal Data">
                                Name, email address, phone number, and profile picture provided during registration.
                            </Card>
                            <Card icon={<MapPin size={20} className="text-[#4C763B]" />} title="Location Data">
                                Precise location data (GPS) to find nearby salons and barbers. Collected only when the app is in use.
                            </Card>
                            <Card icon={<Smartphone size={20} className="text-[#4C763B]" />} title="Device Info">
                                Device ID, model, operating system version, and IP address for security and optimization.
                            </Card>
                            <Card icon={<Lock size={20} className="text-[#4C763B]" />} title="Payments">
                                Transaction history. <strong className="text-gray-900">Processed by Razorpay.</strong>
                            </Card>
                        </div>
                    </Section>

                    <Section title="3. App Permissions">
                        <p className="mb-6 text-gray-700">To provide the full GlossCut experience, we may request the following permissions:</p>
                        <ul className="space-y-4">
                            {[
                                { label: "Camera & Photos", text: "To allow you to upload profile pictures or shop images." },
                                { label: "Location Services", text: "To show you the nearest barbershops and estimate travel time." },
                                { label: "Notifications", text: "To send booking confirmations, reminders, and exclusive deals." }
                            ].map((perm, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4C763B] flex-shrink-0" />
                                    <span><strong className="text-gray-900 font-semibold">{perm.label}:</strong> {perm.text}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-100">
                            You can revoke these permissions at any time in your device settings, though some features may become unavailable.
                        </p>
                        <p className="mt-3 p-4 bg-[#4C763B]/5 rounded-xl text-xs text-gray-600 border border-[#4C763B]/10">
                            <strong className="text-gray-800">Important:</strong> We do not collect location data in the background or when the app is closed. Location access is used only while the app is actively in use.
                        </p>
                    </Section>

                    <Section title="4. How We Use Your Data">
                        <ul className="space-y-4">
                            {[
                                { label: "Service Delivery", text: "To facilitate bookings, process payments, and manage user accounts." },
                                { label: "Communication", text: "To send appointment reminders and booking confirmations via SMS/WhatsApp." },
                                { label: "Optimization", text: "To improve our queue management algorithms and overall efficiency." },
                                { label: "Personalization", text: "To analyze usage trends and improve our AI-driven recommendations." },
                                { label: "Security", text: "To detect and prevent fraud, abuse, and security incidents." }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4C763B] flex-shrink-0" />
                                    <span><strong className="text-gray-900 font-semibold">{item.label}:</strong> {item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="5. Data Sharing & Disclosure">
                        <p className="mb-6 text-gray-700">We do not sell your personal data. We may share information with:</p>
                        <div className="space-y-4">
                            {[
                                { label: "Barbers/Shops", text: "Your name and booking details are shared with the service provider." },
                                { label: "Service Providers", text: "Trusted partners like Razorpay, Firebase, and cloud hosting services." },
                                { label: "Legal Requirements", text: "If required by law, court order, or government regulation." }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4C763B]" />
                                    <p className="text-sm text-gray-600"><strong className="text-gray-900">{item.label}:</strong> {item.text}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">
                            We are not responsible for the privacy practices of third-party websites or social media pages linked from our platform.
                        </p>
                    </Section>

                    <Section title="6. Data Security">
                        <div className="bg-[#4C763B]/5 p-8 rounded-2xl border border-[#4C763B]/10 flex gap-6 items-start">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <Lock className="text-[#4C763B]" size={24} />
                            </div>
                            <div>
                                <h4 className="text-gray-900 font-bold mb-2">Security Measures</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    We implement industry-standard security measures, including <strong className="text-[#4C763B]">AES-256 encryption</strong> for data in transit and at rest.
                                    Sensitive data like passwords are hashed using bcrypt. Access is restricted to authorized personnel only.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="7. Data Retention">
                        <p className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-600 leading-relaxed">
                            We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy.
                            We will delete or anonymize your personal data once the purpose for its collection has been served, unless further retention is required by law.
                            If you delete your account, we will delete your personal data within 30 days.
                        </p>
                        <div className="mt-4 p-5 bg-[#4C763B]/5 rounded-2xl border border-[#4C763B]/10">
                            <h4 className="font-bold text-gray-900 text-sm mb-2">How to Delete Your Account</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                To request account deletion, email{' '}
                                <a href="mailto:support@glosscut.com?subject=Delete%20My%20Account" className="text-[#4C763B] font-semibold hover:underline">support@glosscut.com</a>{' '}
                                with the subject line <strong>"Delete My Account"</strong>, or use the{' '}
                                <strong>Delete Account</strong> option in the app under <strong>Settings &gt; Account</strong>.
                            </p>
                        </div>
                    </Section>

                    <Section title="8. Children's Privacy">
                        <p className="text-gray-600">
                            Our Platform is not intended for children under <strong>13 years of age</strong>. We do not knowingly collect or solicit personal data from children under 13. If we learn that we have collected personal data from a child under 13 without verifiable parental consent, we will delete that information as quickly as possible.
                        </p>
                    </Section>

                    <Section title="9. Your Rights (DPDPA 2023)">
                        <p className="mb-6 text-gray-700">Under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: "Right to Correction", desc: "Correct, complete, or update your personal data at any time." },
                                { title: "Right to Erasure", desc: "Request the deletion of your data when it's no longer necessary." },
                                { title: "Right to Withdraw", desc: "Withdraw your consent for data processing as easily as you gave it." },
                                { title: "Right to Nomination", desc: "Nominate an individual to exercise your rights in case of death or incapacity." }
                            ].map((right, i) => (
                                <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">{right.title}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">{right.desc}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="10. Grievance Redressal">
                        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C763B]/5 rounded-bl-full"></div>
                            <p className="mb-6 text-gray-700 font-medium">In accordance with the Information Technology Act and DPDPA 2023, if you have any grievances, please contact our Grievance Officer:</p>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-32">Officer</span>
                                    <span className="text-gray-900 font-bold">Grievance Redressal Officer, GlossCut</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-32">Email</span>
                                    <a href="mailto:support@glosscut.com" className="text-[#4C763B] font-bold hover:underline">support@glosscut.com</a>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-32">Address</span>
                                    <span className="text-gray-600 text-xs leading-relaxed max-w-xs">MIDC Road, Amravati, Maharashtra - 444606</span>
                                </div>
                            </div>
                            <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Acknowledgment within 24 hours • Resolution within 15 days</p>
                        </div>
                    </Section>

                    <Section title="11. Contact Us">
                        <p className="mb-8 text-gray-600">If you have any questions about this Privacy Policy, please contact us:</p>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <a href="mailto:support@glosscut.com" className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#4C763B]/30 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Mail className="text-[#4C763B]" size={20} />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Support</span>
                                </div>
                                <p className="text-[#4C763B] font-bold text-lg group-hover:underline">support@glosscut.com</p>
                            </a>
                            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <MapPin className="text-[#4C763B]" size={20} />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</span>
                                </div>
                                <p className="text-gray-700 font-bold">Amravati, Maharashtra, India</p>
                            </div>
                        </div>
                        <div className="mt-12 text-center">
                            <p className="text-gray-400 text-[10px] tracking-widest uppercase">© 2026 GlossCut Technologies. Your privacy is our priority.</p>
                        </div>
                    </Section>
                </motion.div>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#4C763B]/10 text-[#4C763B] flex items-center justify-center text-sm font-sans">
                {title.split('.')[0]}
            </span>
            {title.includes('.') ? title.split('.').slice(1).join('.').trim() : title}
        </h2>
        <div className="text-base sm:text-lg leading-relaxed text-gray-600">
            {children}
        </div>
    </section>
);

const Card = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            <div className="font-bold text-gray-900">{title}</div>
        </div>
        <div className="text-sm text-gray-500 leading-relaxed">{children}</div>
    </div>
);

export default PrivacyPolicy;

