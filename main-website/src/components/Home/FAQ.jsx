import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
    {
        q: "How do I find the best salon in Amravati or Nagpur?",
        a: "GlossCut lists the top-rated salons and barbershops in Amravati and Nagpur. You can filter by rating, price, and distance to find the perfect match near you."
    },
    {
        q: "Why book a haircut online with GlossCut?",
        a: "Booking online guarantees your slot, so you never have to wait in line. Plus, you can see real photos of work and verified reviews from other customers."
    },
    {
        q: "What is the price of a haircut in Nagpur?",
        a: "Haircut prices in Nagpur typically range from ₹100 to ₹500 depending on the salon. GlossCut shows you the exact menu price for every shop before you book."
    },
    {
        q: "Can I book a home service barber in Amravati?",
        a: "Yes! Many of our partner barbers in Amravati offer home services. Look for the 'Home Service' badge on their profile in the GlossCut app."
    },
    {
        q: "Is it safe to pay via UPI on GlossCut?",
        a: "Absolutely. We use banking-grade security for all UPI transactions, ensuring your payments are safe and instant."
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        // Compact: py-12/16
        <section className="py-12 lg:py-16 bg-[#020202]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 font-serif">Frequently Asked Questions</h2>
                    <p className="text-zinc-500 text-sm">Everything you need to know about booking with GlossCut.</p>
                </div>

                <div className="space-y-2">
                    {FAQS.map((faq, idx) => (
                        <div key={idx} className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors">
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full flex justify-between items-center p-4 text-left"
                            >
                                <span className={`font-medium text-sm pr-4 transition-colors ${openIndex === idx ? 'text-amber-400' : 'text-zinc-200'}`}>
                                    {faq.q}
                                </span>
                                <ChevronDown className={`text-zinc-600 transform transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? 'rotate-180 text-amber-400' : ''}`} size={16} />
                            </button>
                            <AnimatePresence>
                                {openIndex === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 text-zinc-400 text-sm leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
