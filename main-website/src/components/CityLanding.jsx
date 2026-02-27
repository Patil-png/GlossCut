import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Scissors, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

const CityLanding = ({ city: propCity }) => {
    const { cityName } = useParams();
    // Use prop if provided (for static routes like /nagpur), otherwise param
    const city = propCity || cityName || "Nagpur";
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = `Best Salon in ${formattedCity} | GlossCut`;
    }, [formattedCity]);

    // LocalBusiness & Service Schema
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `GlossCut ${formattedCity}`,
        "description": `Premium salon and barbershop booking service in ${formattedCity}.`,
        "url": window.location.href,
        "telephone": "+91 8799866811",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": formattedCity,
            "addressRegion": "Maharashtra",
            "addressCountry": "IN"
        },
        "geo": formattedCity === "Nagpur" ? {
            "@type": "GeoCoordinates",
            "latitude": "21.1458",
            "longitude": "79.0882"
        } : {
            "@type": "GeoCoordinates",
            "latitude": "20.9320",
            "longitude": "77.7523"
        },
        "priceRange": "₹₹",
        "aggregateRating": formattedCity === "Amravati" ? {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "840",
            "bestRating": "5",
            "worstRating": "1"
        } : undefined,
        "mentions": formattedCity === "Amravati" ? [
            { "@type": "Thing", "name": "Cut to Cut Salon" },
            { "@type": "Thing", "name": "The Razors Edge Unisex Salon" },
            { "@type": "Thing", "name": "Bombay Salon" },
            { "@type": "Thing", "name": "SV Unisex salon" },
            { "@type": "Thing", "name": "Ribhuni unisex salon" },
            { "@type": "Thing", "name": "Shri SaiKrupa Salon" },
            { "@type": "Thing", "name": "One Hair Salon" },
            { "@type": "Thing", "name": "Glam N Glow Salon" },
            { "@type": "Thing", "name": "Spiral Salon & Spa" }
        ] : undefined,
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Grooming Services",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Professional Haircut"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Beard Styling & Trim"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Luxury Hair Spa"
                    }
                }
            ]
        }
    };

    // City-specific content configuration
    const cityData = {
        Nagpur: {
            image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&q=80",
            description: "From Dharampeth to Sadar, find the finest grooming experts in the Orange City.",
            areas: ["Dharampeth", "Sadar", "Manish Nagar", "Itwari", "Sitabuldi"],
            stat: "120+"
        },
        Amravati: {
            image: "https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=1600&q=80",
            description: "Experience premium salon services right here in Amravati. Top-rated barbers at your doorstep.",
            areas: ["Rajapeth", "Camp", "Rukmini Nagar", "Sai Nagar"],
            stat: "80+"
        },
        // Fallback
        Default: {
            image: "https://images.unsplash.com/photo-1599351436213-9971f64d6bad?w=1600&q=80",
            description: "Find the best salon near you. Premium grooming services at your fingertips.",
            areas: [],
            stat: "500+"
        }
    };

    const content = cityData[formattedCity] || cityData.Default;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-amber-500/30">
            <Helmet>
                <title>Best Salon in {formattedCity} | GlossCut | Book Haircuts & Grooming</title>
                <meta name="description" content={`Discover the highest-rated salons and barbershops in ${formattedCity}. Book professional grooming, haircuts, and beard styling with real-time slot tracking.`} />
                <meta name="keywords" content={`Salon in ${formattedCity}, Best Barber ${formattedCity}, Haircut ${formattedCity}, Grooming ${formattedCity}, ${content.areas.join(', ')}`} />
                <link rel="canonical" href={window.location.href} />
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": formattedCity === "Amravati" ? [
                            {
                                "@type": "Question",
                                "name": `How do I book a salon in ${formattedCity}?`,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": `You can book any premium salon or barbershop in ${formattedCity} through GlossCut. Simply search for your preferred shop, choose a service, and track your slot in real-time.`
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Is there a waiting time for haircuts?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "GlossCut uses an Express Slot tracking system which significantly reduces waiting time. You can view the live queue before you even reach the shop."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Can I book a salon near me from Home ?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes, GlossCut supports the customer to book the appoinment from the home and get complete access of the queue and get idea of where he is and how much time he has to wait."
                                }
                            }
                        ] : [
                            {
                                "@type": "Question",
                                "name": `When is GlossCut launching in ${formattedCity}?`,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": `GlossCut is officially launching in ${formattedCity} next month! We are bringing the most advanced salon booking and queue tracking system to your city.`
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Can I pre-register as a customer?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes, you can create your account now to be the first to know when booking goes live in Nagpur. Get exclusive early-bird grooming offers."
                                }
                            }
                        ]
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "HowTo",
                        "name": formattedCity === "Amravati"
                            ? `How to book a salon in ${formattedCity} with GlossCut`
                            : `How to get ready for GlossCut launch in ${formattedCity}`,
                        "description": formattedCity === "Amravati"
                            ? `Step-by-step guide to booking your favorite haircut or grooming session in ${formattedCity} without waiting.`
                            : `Get ready for the most advanced grooming experience launching in ${formattedCity} next month.`,
                        "step": formattedCity === "Amravati" ? [
                            {
                                "@type": "HowToStep",
                                "name": "Find your Salon",
                                "text": "Search for your favorite shop or discover new ones in your area.",
                                "url": window.location.href
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Choose a Service",
                                "text": "Select from haircuts, beard trims, spa, or other grooming services.",
                                "url": window.location.href
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Track your Slot",
                                "text": "Confirm your booking and track your place in the live queue in real-time with the tracking Id PRovided by the GlossCut without any tension.",
                                "url": window.location.href
                            }
                        ] : [
                            {
                                "@type": "HowToStep",
                                "name": "Create Account",
                                "text": "Set up your profile early to get ready for the launch.",
                                "url": "https://www.glosscut.com/create-customer-account"
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Follow us on Instagram",
                                "text": "Keep an eye on our official handle for launch date announcements.",
                                "url": "https://www.instagram.com/gloss_cut"
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Book your first slot",
                                "text": "Be the first to experience wait-free grooming in Nagpur next month.",
                                "url": window.location.href
                            }
                        ],
                        "totalTime": "PT2M",
                        "supply": [
                            {
                                "@type": "HowToSupply",
                                "name": "GlossCut App/Website"
                            }
                        ]
                    })}
                </script>
            </Helmet>

            {/* HERO SECTION */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={content.image}
                        alt={`Best Salon in ${formattedCity}`}
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                            <MapPin size={16} className="text-amber-500" />
                            <span className="text-sm font-medium tracking-wide">Top Rated in {formattedCity}</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif leading-tight">
                            The Best Salons in <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">
                                {formattedCity}
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
                            {content.description} Book trusted professionals instantly without waiting in line.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/all-services-search"
                                className="px-8 py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                            >
                                <Scissors size={20} />
                                Book Appointment in {formattedCity}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* BENEFITS GRID */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Star className="text-amber-500" size={32} />}
                        title={`Top Rated {formattedCity} Experts`}
                        desc={`We only list the highest-rated barbers in ${formattedCity}. Checked and verified for quality.`}
                    />
                    <FeatureCard
                        icon={<Calendar className="text-amber-500" size={32} />}
                        title="Instant Booking"
                        desc="See real-time availability. No phone calls, no waiting at the shop."
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="text-amber-500" size={32} />}
                        title="Safe Payments"
                        desc="Pay securely via UPI after your service. Satisfaction guaranteed."
                    />
                </div>
            </section>

            {/* LOCAL AREAS STRIP */}
            {content.areas.length > 0 && (
                <section className="py-16 bg-[#111] border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <h3 className="text-2xl font-serif font-bold mb-8 text-gray-400">Serving Top Locations in {formattedCity}</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {content.areas.map((area, idx) => (
                                <span key={idx} className="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-500/50 hover:text-amber-500 transition-colors cursor-default">
                                    {area}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* SEO CONTENT BLOCK (Hidden from prominent view but readable for bots/users) */}
            <section className="py-20 px-6 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 font-serif">Why GlossCut is the #1 Choice in {formattedCity}</h2>
                <div className="prose prose-invert prose-amber max-w-none text-gray-400 space-y-6">
                    <p>
                        Looking for a <strong>haircut in {formattedCity}</strong>? GlossCut is the city's premier platform for discovering and booking luxury salon services. Whether you need a beard trim, a facial, or a complete makeover, our app connects you with the <strong>best salon shop near you</strong>.
                    </p>
                    <p>
                        With over {content.stat} partner salons across {formattedCity}, we ensure that you are never far from a professional grooming experience. Say goodbye to long waiting times. With GlossCut, you can view the rate card of every salon in {formattedCity}, compare prices, and book your slot in seconds.
                    </p>
                    <p>
                        Download the GlossCut app today and experience the future of grooming in {formattedCity}.
                    </p>
                </div>
            </section>

            {/* VERIFIED PARTNERS SEO BLOCK (Visible to Bots, secondary for Users) */}
            <section className="py-12 bg-[#080808] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <h3 className="text-xl font-serif font-bold mb-6 text-gray-500">Official Booking Partner For:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 opacity-50">
                        {["Cut to Cut Salon", "The Razors Edge", "Bombay Salon", "SV Unisex", "Ribhuni Unisex", "Shri SaiKrupa", "One Hair Salon", "Glam N Glow", "Spiral Salon & Spa"].map((shop, i) => (
                            <span key={i} className="text-sm text-gray-400 border border-white/10 p-2 rounded text-center">
                                {shop}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 text-center border-t border-white/10">
                <h2 className="text-4xl font-serif font-bold mb-6">Ready to look your best?</h2>
                <Link
                    to="/all-services-search"
                    className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold text-lg group"
                >
                    Explore {formattedCity} Salons <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </section>

        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all hover:-translate-y-1">
        <div className="mb-6">{icon}</div>
        <h3 className="text-xl font-bold mb-3 text-white">{title.replace('{formattedCity}', '')}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

export default CityLanding;
