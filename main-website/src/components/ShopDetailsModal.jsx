import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Users, ChevronLeft, ChevronRight, Scissors, ShieldCheck, Sparkles, Navigation } from 'lucide-react';
import Image from './Image';
import BarberCard from './BarberCard';

const getValidImageUrl = (imageField) => {
    if (typeof imageField === 'string' && imageField.trim()) {
        if (imageField.includes('gloss_cut.png')) return '/GlossCut.png';
        if (imageField.startsWith('http://') || imageField.startsWith('https://')) return imageField;
        if (imageField.startsWith('/')) return `${process.env.REACT_APP_API_URL}${imageField}`;
        return imageField;
    }
    return '/GlossCut.png';
};

// ── Gallery + shop info overlay as one stable component ──
const ShopGallery = ({ images, className, dotsClassName, shop, displayRating, displayReviews, distance }) => {
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = useCallback((e) => {
        const w = e.target.clientWidth;
        if (w > 0) setActiveIndex(Math.round(e.target.scrollLeft / w));
    }, []);

    const scroll = (dir) => {
        if (!scrollRef.current) return;
        const w = scrollRef.current.clientWidth;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -w : w, behavior: 'smooth' });
    };

    return (
        <div className={`relative bg-gray-900 overflow-hidden ${className}`}>
            <div className="group relative h-full">
                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex h-full overflow-x-auto snap-x snap-mandatory"
                    style={{
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {images.map((img, idx) => {
                        const url = getValidImageUrl(img);
                        return (
                            <div
                                key={idx}
                                className="relative shrink-0 snap-center overflow-hidden"
                                style={{ minWidth: '100%', height: '100%' }}
                            >
                                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 pointer-events-none" aria-hidden="true" />
                                <img src={url} alt={`shop-${idx}`} className="relative w-full h-full object-cover z-10" style={{ userSelect: 'none' }} />
                            </div>
                        );
                    })}
                </div>

                {/* Arrows */}
                <div className="absolute inset-0 z-30 flex items-center justify-between px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {[['left', activeIndex === 0], ['right', activeIndex === images.length - 1]].map(([dir, dis]) => (
                        <button
                            key={dir}
                            onClick={(e) => { e.stopPropagation(); scroll(dir); }}
                            disabled={dis}
                            className={`w-9 h-9 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 active:scale-90 transition-all shadow-xl ${dis ? 'opacity-25 cursor-not-allowed' : ''}`}
                        >
                            {dir === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    ))}
                </div>

                {/* Slide counter */}
                <div className="absolute top-4 left-4 z-30 bg-black/40 backdrop-blur-xl px-2.5 py-1 rounded-full text-[9px] font-bold text-white border border-white/15 tracking-widest select-none">
                    {activeIndex + 1} / {images.length}
                </div>

                {/* Dots */}
                <div className={`absolute left-1/2 -translate-x-1/2 z-30 flex gap-1.5 pointer-events-none ${dotsClassName}`}>
                    {images.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                    ))}
                </div>
            </div>

            {/* Dark gradient from bottom — z-20 sits above images but below dots/arrows */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none" />

            {/* Shop info overlay — z-30 sits above gradient */}
            <div className="absolute bottom-0 left-0 right-0 z-30 px-5 pb-5 pt-3 pointer-events-none">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 text-[9px] font-black uppercase tracking-widest">
                        <Scissors className="w-2.5 h-2.5" />{shop.category || 'Barber Shop'}
                    </span>
                    {shop.verifiedShop && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/30 backdrop-blur-md text-blue-100 border border-blue-300/20 text-[9px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-2.5 h-2.5" /> Verified
                        </span>
                    )}
                    {displayRating > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/30 backdrop-blur-md text-amber-100 border border-amber-300/20 text-[9px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-300" /> {displayRating.toFixed(1)} <span className="opacity-60">({displayReviews})</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/30 backdrop-blur-md text-purple-100 border border-purple-300/20 text-[9px] font-black uppercase tracking-widest">
                            <Sparkles className="w-2.5 h-2.5" /> New Shop
                        </span>
                    )}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight mb-1.5" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                    {shop.name}
                </h2>
                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#7fc96d] shrink-0" />
                    <span className="truncate">{shop.address}</span>
                    {distance && (
                        <span className="flex items-center gap-1 text-[#7fc96d] ml-1">
                            <span className="w-1 h-1 bg-white/30 rounded-full mx-1" />
                            {distance} km away
                        </span>
                    )}
                </div>
                <button
                    onClick={() => window.location.href = `/shops-map?select=${shop._id || shop.id}`}
                    className="flex items-center gap-2 mt-4 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all w-fit pointer-events-auto shadow-lg"
                >
                    <Navigation size={12} className="text-[#7fc96d]" />
                    View Road Route
                </button>
            </div>
        </div>
    );
};

// ── Main Modal ──
const ShopDetailsModal = ({ isOpen, shop, onClose, barbers, onBarberClick, roadDistances = {}, airDistances = {} }) => {

    const shopDistance = useMemo(() => {
        if (!shop) return null;
        const lookupId = shop.id || shop._id;
        const dist = (roadDistances?.[lookupId]) || (airDistances?.[lookupId]);
        console.log(`🔍 Modal Distance Lookup [${shop.name}]:`, { lookupId, dist, roadKeys: Object.keys(roadDistances) });
        return dist;
    }, [shop, roadDistances, airDistances]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const { shopBarbers, displayRating, displayReviews } = useMemo(() => {
        if (!shop) return { shopBarbers: [], displayRating: 0, displayReviews: 0 };
        const shopMemberIds = [shop.owner?._id, ...(shop.staff || []).map(s => s._id)].filter(Boolean);
        const filteredBarbers = barbers.filter(b => shopMemberIds.includes(b.barberId) && b.approvalStatus === 'approved');
        const validRatings = filteredBarbers.filter(b => b.rating > 0);
        const aggregatedRating = validRatings.length > 0 ? validRatings.reduce((s, b) => s + b.rating, 0) / validRatings.length : 0;
        const rating = (shop.shopRating > 0 ? shop.shopRating : (shop.rating > 0 ? shop.rating : aggregatedRating)) || 0;
        const reviews = (shop.reviews > 0 ? shop.reviews : filteredBarbers.reduce((s, b) => s + (typeof b.reviews === 'number' ? b.reviews : (Array.isArray(b.reviews) ? b.reviews.length : (b.reviewCount || 0))), 0)) || 0;
        return { shopBarbers: filteredBarbers, displayRating: rating, displayReviews: reviews };
    }, [shop, barbers]);

    if (!isOpen || !shop) return null;

    const hasGallery = shop.shopImages?.length > 0;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center sm:p-4"
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-lg" onClick={onClose} />

                {/* Modal shell */}
                <motion.div
                    initial={{ y: 80, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 80, opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-5xl h-[92vh] md:h-[88vh] bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 will-change-transform flex flex-col md:flex-row"
                >
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center bg-black/25 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/20 shadow-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* ── MOBILE: gallery on top ── */}
                    <div className="md:hidden h-[50%] shrink-0 relative rounded-t-[2rem] overflow-hidden">
                        {hasGallery ? (
                            <ShopGallery
                                images={shop.shopImages}
                                className="w-full h-full"
                                dotsClassName="bottom-[90px]"
                                shop={shop}
                                displayRating={displayRating}
                                displayReviews={displayReviews}
                                distance={shopDistance}
                            />
                        ) : (
                            <>
                                <Image src={getValidImageUrl(shop.image || shop.owner?.profilePicture)} fallbackSrc="/GlossCut.png" className="w-full h-full object-cover" alt="cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                                <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-5">
                                    <h2 className="text-xl font-black text-white tracking-tight">{shop.name}</h2>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center gap-2 text-white/70 text-sm">
                                            <MapPin className="w-3.5 h-3.5 text-[#7fc96d]" />
                                            {shop.address}
                                            {shopDistance && <span className="text-[#4C763B] font-bold ml-1">• {shopDistance} km</span>}
                                        </div>
                                        <button
                                            onClick={() => window.location.href = `/shops-map?select=${shop._id || shop.id}`}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-xs font-bold border border-white/10 transition-all w-fit mt-1"
                                        >
                                            <Navigation size={12} className="text-[#7fc96d]" />
                                            View Road Route on Map
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── DESKTOP: gallery on left ── */}
                    <div className="hidden md:block w-[42%] shrink-0 relative rounded-l-[2rem] overflow-hidden">
                        {hasGallery ? (
                            <ShopGallery
                                images={shop.shopImages}
                                className="w-full h-full"
                                dotsClassName="bottom-[100px]"
                                shop={shop}
                                displayRating={displayRating}
                                displayReviews={displayReviews}
                                distance={shopDistance}
                            />
                        ) : (
                            <>
                                <Image src={getValidImageUrl(shop.image || shop.owner?.profilePicture)} fallbackSrc="/GlossCut.png" className="w-full h-full object-cover" alt="cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                                <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-5">
                                    <h2 className="text-2xl font-black text-white tracking-tight">{shop.name}</h2>
                                    <div className="flex flex-col gap-3 mt-3">
                                        <div className="flex items-center gap-2 text-white/70 text-sm">
                                            <MapPin className="w-3.5 h-3.5 text-[#7fc96d]" />
                                            {shop.address}
                                            {shopDistance && <span className="text-[#4C763B] font-bold ml-1">• {shopDistance} km</span>}
                                        </div>
                                        <button
                                            onClick={() => window.location.href = `/shops-map?select=${shop._id || shop.id}`}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-[#4C763B] hover:bg-[#3b5c2e] rounded-xl text-white text-xs font-bold shadow-lg shadow-[#4C763B]/20 transition-all w-fit mt-2 group"
                                        >
                                            <Navigation size={14} className="group-hover:rotate-12 transition-transform" />
                                            Visualize Live Road Route
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── CONTENT: right on desktop, bottom on mobile ── */}
                    <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="px-6 pt-6 pb-8">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4C763B] to-green-500 flex items-center justify-center shadow-md shadow-[#4C763B]/20">
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 leading-none">Select a Professional</h3>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Choose who you want to book with</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center shadow-sm">
                                    <div className="text-xl font-black text-gray-900 tabular-nums leading-none">{shopBarbers.length}</div>
                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Available</div>
                                </div>
                            </div>

                            {shopBarbers.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {shopBarbers.map((barber) => (
                                        <BarberCard
                                            key={barber.id}
                                            barber={barber}
                                            onClick={onBarberClick}
                                            distance={shopDistance}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 border border-gray-100 shadow-sm">
                                        <Users className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 font-semibold text-sm">No staff currently available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default ShopDetailsModal;
