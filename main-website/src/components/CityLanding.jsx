import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Scissors, ArrowRight, CheckCircle2, Globe, Sparkles } from 'lucide-react';

const CityLanding = ({ city: propCity }) => {
    const { cityName } = useParams();
    // Use prop if provided (for static routes like /nagpur), otherwise param
    const city = propCity || cityName || "Nagpur";
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = `Best Salon in ${formattedCity} | GlossCut - Book Top Barbershops`;
    }, [formattedCity]);

    // Breadcrumb Schema for Google Hierarchy
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.glosscut.com"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": formattedCity,
                "item": `https://www.glosscut.com/${city.toLowerCase()}`
            }
        ]
    };

    // Premium LocalBusiness & Service Schema
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `GlossCut ${formattedCity}`,
        "description": `Book the best salons and barbershops in ${formattedCity} with GlossCut. Real-time slot booking and premium grooming services including haircuts, facials, and beard styling.`,
        "url": `https://www.glosscut.com/${city.toLowerCase()}`,
        "telephone": "+91 8799866811",
        "image": "https://www.glosscut.com/GlossCutCircle.png",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Rajapeth Area",
            "addressLocality": formattedCity,
            "addressRegion": "Maharashtra",
            "postalCode": "444601",
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
        "priceRange": "₹150 - ₹2000",
        "openingHours": "Mo-Su 09:00-21:00",
        "aggregateRating": formattedCity === "Amravati" ? {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "840",
            "bestRating": "5",
            "worstRating": "1"
        } : {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "1200",
            "bestRating": "5",
            "worstRating": "1"
        },
        "review": [
            {
                "@type": "Review",
                "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                "author": { "@type": "Person", "name": "Aditya Sharma" },
                "reviewBody": "Best grooming experience in the city. Real-time booking is a game changer!"
            },
            {
                "@type": "Review",
                "reviewRating": { "@type": "Rating", "ratingValue": "4", "bestRating": "5" },
                "author": { "@type": "Person", "name": "Snehal P." },
                "reviewBody": "Very convenient for finding verified salons. Highly recommended."
            }
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Elite Grooming Services",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Men's Haircut",
                        "description": "Professional haircuts and styling from top-rated barbers.",
                        "offers": { "@type": "Offer", "price": "199.00", "priceCurrency": "INR" }
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Beard Grooming",
                        "description": "Expert beard trimming, shaping, and luxury hot towel shave.",
                        "offers": { "@type": "Offer", "price": "149.00", "priceCurrency": "INR" }
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Luxury Hair Spa",
                        "description": "Deep conditioning and relaxing scalp massage for healthy hair.",
                        "offers": { "@type": "Offer", "price": "799.00", "priceCurrency": "INR" }
                    }
                }
            ]
        }
    };

    // City-specific content configuration
    const cityData = {
        Nagpur: {
            image: "/GlossCut.png",
            description: "We are bringing Nagpur's elite barbershops and premium grooming salons to your fingertips. Get ready for the Orange City's most advanced booking experience.",
            areas: ["Dharampeth", "Sadar", "Manish Nagar", "Itwari", "Sitabuldi"],
            stat: "Launching Soon in",
            isLaunched: false
        },
        Amravati: {
            image: "/GlossCut.png",
            description: "Experience premium salon services right here in Amravati. Book the city's highest-rated barbershops and salons instantly.",
            areas: ["Rajapeth", "Camp", "Rukmini Nagar", "Sai Nagar"],
            stat: "9+",
            isLaunched: true
        },
        // Fallback
        Default: {
            image: "/GlossCut.png",
            description: "Find the best salon near you. Premium grooming services at your fingertips with real-time slot tracking.",
            areas: [],
            stat: "500+",
            isLaunched: true
        }
    };

    const content = cityData[formattedCity] || cityData.Default;

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden">
            <Helmet>
                <title>Top 10+ Best Salons in {formattedCity} - Verified Barbers & Reviews | GlossCut</title>
                <meta name="description" content={`Find the best salons in ${formattedCity} on GlossCut. Top-rated barbershops, luxury hair spas, and beauty parlour services with real-time booking. View ratings, reviews, and book instantly!`} />
                <meta name="keywords" content={`Best Salon in ${formattedCity}, Top Barbers in ${formattedCity}, Haircut near me ${formattedCity}, Beauty Parlour ${formattedCity}, GlossCut ${formattedCity}, Salon reviews ${formattedCity}, Hair Spa ${formattedCity}`} />
                <link rel="canonical" href={window.location.href} />
                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": `How can I find the best salon in ${formattedCity}?`,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": `GlossCut curated the highest-rated salons in ${formattedCity}. You can browse verified shops, check their ratings, and book appointments instantly.`
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What services are available for booking?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "You can book haircuts, beard grooming, facials, hair spa, and more from professional barbers and salon experts."
                                }
                            }
                        ]
                    })}
                </script>
            </Helmet>

            {/* BACKGROUND SYSTEM */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Mobile Background */}
                <div className="absolute inset-0 block lg:hidden z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                    <div className="absolute top-[-10%] right-[-15%] w-[100vw] h-[100vw] rounded-full blur-[80px] opacity-30 mix-blend-multiply"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                </div>

                {/* Desktop Background */}
                <div className="hidden lg:block absolute inset-0 z-0 bg-gray-50 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-100/40" />
                    {/* Larger, more vibrant floating patches for desktop */}
                    <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[160px] opacity-[0.18] mix-blend-multiply animate-float"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[-15%] left-[-5%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.15] mix-blend-multiply animate-float-delayed"
                        style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
                    <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full blur-[120px] opacity-[0.08] mix-blend-multiply animate-pulse"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #1B3014 100%)' }} />
                </div>

                {/* Texture & Grid */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* HERO SECTION */}
            <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 md:pt-20">
                <div className="absolute inset-0 z-0 pt-12 md:pt-16">
                    <img
                        src={content.image}
                        alt={`Best Salon in ${formattedCity}`}
                        className="w-full h-full object-cover opacity-20 grayscale brightness-125 rounded-t-[3rem] md:rounded-t-[5rem]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 md:via-white/70 to-transparent pt-12 md:pt-16"></div>
                </div>

                <div className="relative z-10 text-center px-4 md:px-6 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full bg-[#4C763B]/10 backdrop-blur-md border border-[#4C763B]/20 mb-6 md:mb-10">
                            <MapPin size={14} className="text-[#4C763B]" />
                            <span className="text-xs md:text-base font-bold tracking-widest text-[#4C763B] uppercase">
                                {content.isLaunched ? `Top Rated Choice in ${formattedCity}` : `Coming Soon to ${formattedCity}`}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 md:mb-8 font-serif leading-[1.1] text-gray-900 tracking-tight">
                            The Finest Salons in <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] via-green-600 to-[#1B3014]">
                                {formattedCity}
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12 font-medium">
                            {content.description} Experience luxury grooming and instant bookings at the city's most elite locations.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center">
                            {content.isLaunched ? (
                                <Link
                                    to="/all-services-search"
                                    className="group px-8 py-4 md:px-14 md:py-6 bg-[#4C763B] text-white font-black text-lg md:text-xl rounded-2xl md:rounded-3xl hover:bg-[#3d5e2f] transition-all flex items-center justify-center gap-4 shadow-2xl hover:shadow-[0_20px_50px_rgba(76,118,59,0.3)] hover:-translate-y-1.5"
                                >
                                    <Scissors size={20} className="md:size-6 group-hover:rotate-12 transition-transform" />
                                    Start Booking in {formattedCity}
                                </Link>
                            ) : (
                                <button
                                    onClick={() => window.open('https://www.instagram.com/glosscut.india/', '_blank')}
                                    className="group px-8 py-4 md:px-14 md:py-6 bg-[#4C763B] text-white font-black text-lg md:text-xl rounded-2xl md:rounded-3xl hover:bg-[#3d5e2f] transition-all flex items-center justify-center gap-4 shadow-2xl hover:shadow-[0_20px_50px_rgba(76,118,59,0.3)] hover:-translate-y-1.5"
                                >
                                    <Sparkles size={20} className="md:size-6 group-hover:scale-110 transition-transform" />
                                    Notify Me on Launch
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CONDENSED SEO SUMMARY */}
            <section className="py-8 md:py-16 px-6 max-w-4xl mx-auto text-center relative z-10">
                <p className="text-sm md:text-lg text-gray-400 leading-relaxed italic font-light">
                    Redefining luxury grooming with GlossCut. From the <strong>best haircuts in {formattedCity}</strong> to professional <strong>beard styling</strong>, we connect you with
                    verified experts for a wait-free, premium experience.
                </p>
            </section>

            {/* PREMIUM PARTNER SECTION */}
            <section className="py-16 md:py-32 bg-gray-50/50 border-y border-gray-100 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col items-center mb-10 md:mb-20">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                            <Sparkles size={18} className="text-[#4C763B] md:size-6" />
                            <h2 className="text-[10px] md:text-base font-black text-[#4C763B] uppercase tracking-[0.4em]">
                                {content.isLaunched ? "Official Booking Partners" : "Coming Soon Partners"}
                            </h2>
                        </div>
                        <h3 className="text-2xl md:text-6xl font-serif font-black text-gray-900 text-center tracking-tight">
                            {content.isLaunched ? `Handpicked & Verified for ${formattedCity}` : `Launching Exclusive Partners in Amravati & Nagpur`}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {[
                            "Cut to Cut Salon", "The Razors Edge", "Bombay Salon",
                            "SV Unisex", "Ribhuni Unisex", "Shri SaiKrupa",
                            "One Hair Salon", "Glam N Glow", "Spiral Salon & Spa"
                        ].map((shop, i) => (
                            <motion.div
                                key={i}
                                whileHover={{
                                    scale: 1.05,
                                    rotateX: 5,
                                    rotateY: -5,
                                    translateZ: 20
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-4 px-6 py-5 md:px-8 md:py-7 bg-white border border-gray-200 rounded-xl md:rounded-3xl shadow-sm hover:border-[#4C763B]/40 hover:shadow-2xl hover:shadow-[#4C763B]/10 transition-all duration-300 group cursor-default perspective-1000"
                            >
                                <div className="p-2 md:p-2.5 bg-gray-50 rounded-xl group-hover:bg-[#4C763B]/10 transition-colors">
                                    <CheckCircle2 size={18} className="text-[#4C763B] group-hover:scale-110 transition-transform flex-shrink-0 md:size-5" />
                                </div>
                                <span className="font-bold text-base md:text-lg text-gray-700 group-hover:text-[#4C763B] transition-colors truncate">{shop}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 md:mt-20 flex justify-center">
                        <div className="inline-flex items-center gap-3 md:gap-5 px-6 py-3 md:px-8 md:py-4 bg-white rounded-full border border-[#4C763B]/10 shadow-lg backdrop-blur-sm">
                            <Globe size={18} className="text-[#4C763B] animate-spin-slow md:size-5" />
                            <span className="text-xs md:text-base font-bold text-gray-500 uppercase tracking-widest">
                                {content.isLaunched ? `Securely serving ${content.stat} locations in ${formattedCity}` : `${content.stat} ${formattedCity}`}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* LOCALIZED SEO AREA GRID (Justdial-style near-me optimization) */}
            <section className="py-20 md:py-32 px-4 relative z-10 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center mb-16">
                        <h2 className="text-sm font-black text-[#4C763B] uppercase tracking-[0.4em] mb-4">Elite Service Areas</h2>
                        <h3 className="text-3xl md:text-5xl font-serif font-black text-gray-900 text-center">Grooming Near You in {formattedCity}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                        {content.areas.map((area, i) => (
                            <Link
                                key={i}
                                to="/all-services-search"
                                className="group p-6 rounded-2xl border border-gray-100 hover:border-[#4C763B]/20 hover:bg-gray-50 transition-all text-center"
                            >
                                <span className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Best Salon in</span>
                                <span className="text-gray-700 font-bold group-hover:text-[#4C763B] transition-colors">{area}</span>
                            </Link>
                        ))}
                    </div>

                    {/* INTER-CITY SEO NAVIGATION */}
                    <div className="mt-24 pt-16 border-t border-gray-100 flex flex-col items-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Other Premium Destinations</p>
                        <div className="flex gap-12 text-center flex-wrap justify-center">
                            {["Nagpur", "Amravati"].filter(c => c !== formattedCity).map((otherCity, i) => (
                                <Link
                                    key={i}
                                    to={`/${otherCity.toLowerCase()}`}
                                    className="group flex items-center gap-3 text-gray-500 hover:text-[#4C763B] transition-colors"
                                >
                                    <Globe size={16} className="text-gray-300 group-hover:text-[#4C763B] transition-colors" />
                                    <span className="font-black text-lg">GlossCut {otherCity}</span>
                                    <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default CityLanding;
