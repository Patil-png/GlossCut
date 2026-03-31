import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Scroll, AlertCircle, Scale } from 'lucide-react';

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden">
            <Helmet>
                <title>Terms of Service | GlossCut</title>
                <meta name="description" content="Read GlossCut's Terms of Service. Understand our booking policies, cancellations, and user agreements." />
                <link rel="canonical" href="https://www.glosscut.com/terms" />
            </Helmet>

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
                            <Scroll size={36} className="text-[#4C763B]" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight font-serif">Terms and Conditions</h1>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-1 w-16 bg-gradient-to-r from-[#4C763B] to-green-500 rounded-full mb-2" />
                        <p className="text-gray-500 text-sm font-medium tracking-wide">Last Updated: February 7, 2026</p>
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
                            Welcome to GlossCut. These Terms and Conditions ("Terms") govern your use of the GlossCut mobile application and website (collectively, the "Platform").
                        </p>
                        <p className="mt-4">
                            By downloading, accessing, or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
                        </p>
                    </Section>

                    <Section title="2. Service Description">
                        <p className="mb-4 text-gray-700">
                            GlossCut acts as an intermediary connecting users ("Customers") with third-party service providers ("Partners," e.g., salons, barbers, spas).
                        </p>
                        <ul className="space-y-4">
                            {[
                                { label: "Digital Queue System", text: "We provide a live queue management and digital token system. We do not own, operate, or control the services provided by the Partners." },
                                { label: "No Fixed Appointments", text: "GlossCut is not an appointment-based service. When you book, you are securing a position (token) in the Partner's live queue." },
                                { label: "Wait Times", text: "All wait times displayed on the app are estimates only based on average service durations. Real-time conditions at the shop may alter your actual waiting time." }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4C763B] flex-shrink-0" />
                                    <span><strong className="text-gray-900 font-semibold">{item.label}:</strong> {item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="3. User Accounts">
                        <ul className="space-y-4">
                            {[
                                { label: "Eligibility", text: "You must be at least 18 years old to use this Platform. By using GlossCut, you represent and warrant that you have the right, authority, and capacity to enter into these Terms." },
                                { label: "Account Security", text: "You are responsible for maintaining the confidentiality of your login credentials (OTP/Phone Number). You are fully responsible for all activities that occur under your account." },
                                { label: "Accurate Information", text: "You agree to provide accurate, current, and complete information during the registration process to ensure valid bookings." }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4C763B] flex-shrink-0" />
                                    <span><strong className="text-gray-900 font-semibold">{item.label}:</strong> {item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="4. Booking, Queueing, and Payments">
                        <div className="space-y-8">
                            <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-2xl">
                                <h4 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#4C763B] rounded-full" />
                                    Platform Fee vs. Service Fee
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                        <span><strong className="text-gray-800">Platform Fee:</strong> GlossCut charges a non-refundable "Convenience Fee" for the use of our technology. This is paid directly to GlossCut.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                        <span><strong className="text-gray-800">Service Fee:</strong> The cost of the actual service is determined by the Partner and is payable directly at the shop.</span>
                                    </li>
                                </ul>
                            </div>

                            <Card icon={<Scale size={20} className="text-[#4C763B]" />} title="Queue Priority">
                                Buying an "Express" token prioritizes your position in the virtual queue but does not guarantee immediate service if the barber is currently engaged.
                            </Card>

                            <div className="bg-[#4C763B]/5 p-6 rounded-2xl border border-[#4C763B]/10">
                                <h4 className="text-[#4C763B] font-bold mb-3 flex items-center gap-2">
                                    <AlertCircle size={18} /> No-Show & Cancellation Policy
                                </h4>
                                <ul className="space-y-3 text-gray-600 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#4C763B]">•</span>
                                        <span><strong>No-Show:</strong> If you are not present when your token is called, you may lose your spot. The Platform Fee is non-refundable.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#4C763B]">•</span>
                                        <span><strong>By User:</strong> The Platform Fee is generally non-refundable if you cancel voluntarily.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#4C763B]">•</span>
                                        <span><strong>By Partner:</strong> If the Partner cancels, a refund will be processed in the form of GlossCut Coins within 5-7 business days.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section title="5. User Conduct">
                        <p className="mb-4 text-gray-700">You agree not to:</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                "Make fake/speculative bookings",
                                "Harass Partners or support staff",
                                "Use Platform for illegal purposes",
                                "Manipulate the queue algorithm"
                            ].map((rule, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-sm font-medium text-gray-700">{rule}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm italic border border-red-100">
                            <strong>Note:</strong> Violation of these rules may result in immediate suspension or permanent termination of your account.
                        </p>
                    </Section>

                    <Section title="6. Limitation of Liability & Indemnification">
                        <p className="mb-6 text-gray-700 font-medium font-serif leading-relaxed italic">"GlossCut provides the platform; the Partner provides the craft. We are the bridge, not the barber."</p>
                        <div className="space-y-6">
                            <div className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="mt-1"><Scale size={20} className="text-[#4C763B]" /></div>
                                <div>
                                    <h5 className="font-bold text-gray-900 mb-1">Service Quality & Safety</h5>
                                    <p className="text-sm text-gray-600 leading-relaxed">GlossCut is a technology aggregator. We are not liable for the quality, safety, hygiene, or outcome of the services. Any disputes, including personal injury or property damage at a shop, must be resolved directly with the Partner.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="mt-1"><AlertCircle size={20} className="text-[#4C763B]" /></div>
                                <div>
                                    <h5 className="font-bold text-gray-900 mb-1">Liability Cap</h5>
                                    <p className="text-sm text-gray-600 leading-relaxed">To the maximum extent permitted by law, GlossCut’s total liability for any claim arising out of these Terms shall be limited to the amount paid by you for the specific booking in question (Platform Fee).</p>
                                </div>
                            </div>
                            <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100">
                                <h5 className="font-bold text-red-900 mb-1 text-sm">Indemnification</h5>
                                <p className="text-xs text-red-700 leading-relaxed italic">You agree to indemnify and hold GlossCut harmless from any claims, losses, or legal fees arising from your misuse of the platform or violation of these Terms.</p>
                            </div>
                        </div>
                    </Section>

                    <Section title="7. Disclaimer of Warranties">
                        <p className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-600 text-sm leading-relaxed italic">
                            The Platform is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis. We make no warranties that the service will be uninterrupted, timely, or error-free. Wait times are estimates and not guarantees.
                        </p>
                    </Section>

                    <Section title="8. Intellectual Property">
                        <p className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-600 leading-relaxed">
                            All content on the Platform, including text, graphics, logos, the <span className="text-[#4C763B] font-bold">GlossCut</span> brand, and software, is the property of the Company or its licensors and is protected by Indian copyright and trademark laws.
                        </p>
                    </Section>

                    <Section title="9. Governing Law and Dispute Resolution">
                        <div className="bg-[#4C763B]/5 border border-[#4C763B]/10 p-6 rounded-2xl">
                            <p className="text-gray-800">
                                These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in <strong className="text-[#4C763B]">Amravati, Maharashtra</strong>.
                            </p>
                        </div>
                    </Section>

                    <Section title="10. Force Majeure">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            GlossCut shall not be liable for any failure to perform its obligations where such failure results from any cause beyond GlossCut’s reasonable control, including, without limitation, mechanical, electronic, or communications failure or degradation (including "line-noise" interference).
                        </p>
                    </Section>

                    <Section title="11. Changes to Terms">
                        <p className="text-gray-600">
                            We reserve the right to modify these Terms at any time. We will notify users of any significant changes by updating the "Last Updated" date or through an in-app notification.
                        </p>
                    </Section>

                    <Section title="12. Contact Us">
                        <p className="mb-6 text-gray-600">
                            For any questions regarding these Terms, please contact us at:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <a href="mailto:support@glosscut.com" className="group p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#4C763B]/30 transition-all">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Support</p>
                                <p className="text-[#4C763B] font-bold text-lg group-hover:underline">support@glosscut.com</p>
                            </a>
                            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm font-sans flex flex-col justify-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Social</p>
                                <p className="text-gray-700 font-bold text-lg">
                                    Instagram: <a href="https://www.instagram.com/glosscut.india/" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 transition-colors underline underline-offset-4 decoration-pink-200">@glosscut.india</a>
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 p-5 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm text-left">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Registered Operating Address</p>
                            <p className="text-gray-900 font-bold">Om Bhaulal Patil</p>
                            <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                GlossCut<br />
                                MIDC Road, Amravati, Maharashtra - 444606<br />
                            </p>
                        </div>
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-xs tracking-widest uppercase">© 2026 GlossCut Technologies. All rights reserved.</p>
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
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            <div className="font-bold text-gray-900">{title}</div>
        </div>
        <div className="text-sm text-gray-500 leading-relaxed">{children}</div>
    </div>
);

export default TermsOfService;

