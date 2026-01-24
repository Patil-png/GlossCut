import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Star, Users, MapPin, Award, Clock } from 'lucide-react';

const AboutUs = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const teamMembers = [
        {
            name: "Om Patil",
            role: "Founder & Lead Developer",
            image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
            bio: "Visionary behind GlossCut, merging technology with the art of grooming."
        },
        {
            name: "Sarah Jenkins",
            role: "Head of Partnerships",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
            bio: "Connecting the finest barbers with clients who appreciate quality."
        },
        {
            name: "David Chen",
            role: "Senior Barber Consultant",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
            bio: "Ensuring every service standard meets the 'GlossCut' premium benchmark."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-amber-500/30">

            {/* HERO SECTION */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=1600&q=80"
                        alt="Barber Shop Interior"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/50 to-[#0a0a0a]"></div>
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <div className="flex justify-center mb-6">
                            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
                                <Scissors size={32} className="text-amber-500" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight">
                            Crafting <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">Confidence</span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            GlossCut isn't just an app. It's a movement to elevate the grooming experience for the modern individual.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* OUR STORY / MISSION */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif">The GlossCut Philosophy</h2>
                        <div className="h-1 w-20 bg-amber-500 mb-8"></div>
                        <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                            Founded in 2024, GlossCut emerged from a simple observation: finding a quality haircut was harder than it should be. We saw talented barbers struggling to get noticed and customers tired of waiting in lines.
                        </p>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            We built a bridge. A platform that honors the craft of barbering while bringing the convenience of modern technology to your fingertips. Whether you're in Amravati looking for a quick trim or in Nagpur seeking a luxury spa experience, GlossCut connects you with the best.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="space-y-4 mt-8">
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                <Users className="text-amber-500 mb-4" size={28} />
                                <h3 className="text-xl font-bold mb-2">Community First</h3>
                                <p className="text-sm text-gray-500">Supporting local businesses and building lasting relationships.</p>
                            </div>
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                <Award className="text-amber-500 mb-4" size={28} />
                                <h3 className="text-xl font-bold mb-2">Quality Assured</h3>
                                <p className="text-sm text-gray-500">Only the top-rated, vetted professionals make it to our platform.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                <Clock className="text-amber-500 mb-4" size={28} />
                                <h3 className="text-xl font-bold mb-2">Zero Wait Time</h3>
                                <p className="text-sm text-gray-500">Book your slot and walk in. Your time is as valuable as your look.</p>
                            </div>
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                <Star className="text-amber-500 mb-4" size={28} />
                                <h3 className="text-xl font-bold mb-2">Premium Experience</h3>
                                <p className="text-sm text-gray-500">Luxury isn't a price tag. It's a standard of service we uphold.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* STATS STRIP */}
            <section className="py-12 bg-amber-500/5 border-y border-amber-500/10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-4xl font-bold text-amber-500 mb-2">500+</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Partner Salons</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-amber-500 mb-2">50k+</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Happy Clients</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-amber-500 mb-2">2</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Major Cities</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-amber-500 mb-2">4.9</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">App Rating</div>
                    </div>
                </div>
            </section>

            {/* TEAM SECTION (Optional, makes it feel human) */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Meet the Minds</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        The passionate individuals working behind the scenes to revolutionize your grooming routine.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 group hover:border-amber-500/30 transition-all"
                        >
                            <div className="h-64 overflow-hidden relative">
                                <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                                <div className="text-amber-500 text-sm font-medium mb-3">{member.role}</div>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {member.bio}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-20 px-6 text-center">
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-900/20 to-amber-700/20 p-12 rounded-3xl border border-amber-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/10 blur-[100px] rounded-full"></div>

                    <h2 className="text-3xl md:text-5xl font-bold mb-6 font-serif relative z-10">Join the Revolution</h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                        Whether you're a stylist looking to grow or someone looking for their next best look, there's a place for you at GlossCut.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                        <button
                            onClick={() => window.location.href = '/all-services-search'}
                            className="px-8 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
                        >
                            Find a Salon
                        </button>
                        <button
                            onClick={() => window.location.href = '/barber-account-creation'}
                            className="px-8 py-3 bg-transparent border border-amber-500/50 text-amber-500 font-bold rounded-lg hover:bg-amber-500/10 transition-colors"
                        >
                            Partner With Us
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AboutUs;
