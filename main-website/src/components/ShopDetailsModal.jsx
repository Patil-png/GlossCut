import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, ChevronLeft, ChevronRight, Scissors, ShieldCheck, Navigation } from 'lucide-react';
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

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const ticker = setInterval(() => {
            if (!scrollRef.current) return;
            const container = scrollRef.current;
            const width = container.clientWidth;
            const maxScroll = container.scrollWidth - width;
            if (Math.ceil(container.scrollLeft) >= maxScroll) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: width, behavior: 'smooth' });
            }
        }, 4000);
        return () => clearInterval(ticker);
    }, [images]);

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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 via-black/30 to-transparent z-20 pointer-events-none" />

            {/* Shop info overlay — z-30 sits above gradient */}
            <div className="absolute bottom-0 left-0 right-0 z-30 px-5 pb-5 pt-3 pointer-events-none">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 text-[8px] font-black uppercase tracking-widest">
                        <Scissors className="w-2 h-2" />{shop.category || 'Barber Shop'}
                    </span>
                    {shop.verifiedShop && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 backdrop-blur-md text-blue-100 border border-blue-300/10 text-[8px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-2 h-2" /> Verified
                        </span>
                    )}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
                        <span className="flex items-center gap-1 text-white text-[9px] font-bold">
                            <svg className="w-2.5 h-2.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {displayRating > 0 ? displayRating.toFixed(1) : '0'}
                        </span>
                        {displayReviews > 0 && (
                            <>
                                <span className="w-0.5 h-0.5 bg-white/30 rounded-full" />
                                <span className="text-white/80 text-[8px] font-bold">({displayReviews})</span>
                            </>
                        )}
                    </div>
                </div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight leading-none mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    {shop.name}
                </h2>
                <div className="flex items-center gap-1 text-white/90 text-[10px] font-medium">
                    <MapPin className="w-2.5 h-2.5 text-[#7fc96d] shrink-0" />
                    <span className="truncate">{shop.address}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                        onClick={() => window.location.href = `/shops-map?select=${shop._id || shop.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all w-fit pointer-events-auto shadow-lg"
                    >
                        <Navigation size={10} className="text-[#7fc96d]" />
                        Road Route
                    </button>
                    {distance && (
                        <span className="flex items-center gap-1 px-2.5 py-2 bg-black/40 backdrop-blur-md rounded-lg text-white border border-white/10 text-[9px] font-black uppercase tracking-widest shadow-sm">
                            <MapPin className="w-2.5 h-2.5 text-[#7fc96d]" /> {distance} km
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Modal ──
const ShopDetailsModal = ({ isOpen, shop, onClose, barbers, onBarberClick, roadDistances = {}, airDistances = {} }) => {
    const [fetchedBarbers, setFetchedBarbers] = useState([]);
    const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);

    const shopDistance = useMemo(() => {
        if (!shop) return null;
        const lookupId = shop.id || shop._id;
        const dist = (roadDistances?.[lookupId]) || (airDistances?.[lookupId]);
        return dist;
    }, [shop, roadDistances, airDistances]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && shop) {
            setIsLoadingBarbers(true);
            const shopId = shop._id || shop.id;
            fetch(`${process.env.REACT_APP_API_URL}/api/barber-card/all?shopId=${shopId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setFetchedBarbers(data);
                    }
                })
                .catch(err => console.error("Failed to fetch full barbers list for shop", err))
                .finally(() => setIsLoadingBarbers(false));
        } else {
            setFetchedBarbers([]);
        }
    }, [isOpen, shop]);

    const { shopBarbers, displayRating, displayReviews } = useMemo(() => {
        if (!shop) return { shopBarbers: [], displayRating: 0, displayReviews: 0 };

        let filteredBarbers = [];

        if (fetchedBarbers.length > 0) {
            filteredBarbers = fetchedBarbers;
        } else {
            const shopMemberIds = [shop.owner?._id, ...(shop.staff || []).map(s => s._id)].filter(Boolean);
            filteredBarbers = barbers.filter(b => shopMemberIds.includes(b.barberId) && b.approvalStatus === 'approved');
        }

        const validBarbersWithRatings = filteredBarbers.filter(b => {
            const r = Number(b.rating || b.avgRating || b.barberId?.rating || 0);
            return r > 0;
        });

        const aggregatedRating = validBarbersWithRatings.length > 0
            ? validBarbersWithRatings.reduce((s, b) => s + Number(b.rating || b.avgRating || b.barberId?.rating || 0), 0) / validBarbersWithRatings.length
            : 0;

        const rating = (shop.shopRating > 0 ? shop.shopRating : (shop.rating > 0 ? shop.rating : aggregatedRating)) || 0;
        const reviews = (shop.reviews > 0 ? shop.reviews : filteredBarbers.reduce((s, b) => s + (typeof b.reviews === 'number' ? b.reviews : (Array.isArray(b.reviews) ? b.reviews.length : (b.reviewCount || 0))), 0)) || 0;
        return { shopBarbers: filteredBarbers, displayRating: rating, displayReviews: reviews };
    }, [shop, barbers, fetchedBarbers]);

    // --- LIVE QUEUE WAIT TIMES: Single server-side batch call ---
    const [barberWaitTimes, setBarberWaitTimes] = useState({});

    const fetchWaitTimes = useCallback(async (barbersToFetch) => {
        const barberIds = barbersToFetch
            .map(b => b.barberId || b.owner?._id)
            .filter(Boolean);

        if (barberIds.length === 0) return;

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/booking/public/batch-wait-times`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barberIds }),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.success && data.waitTimes) {
                setBarberWaitTimes(data.waitTimes);
            }
        } catch (e) {
            // Silently fail — badge just won't show
        }
    }, []);

    // Initial fetch + re-fetch every 60s while modal is open (keeps badge ticking)
    useEffect(() => {
        if (!isOpen || shopBarbers.length === 0) return;

        fetchWaitTimes(shopBarbers); // fetch immediately on open

        const ticker = setInterval(() => {
            fetchWaitTimes(shopBarbers); // re-fetch every 60s to tick down
        }, 60000);

        return () => clearInterval(ticker); // stop when modal closes
    }, [isOpen, shopBarbers, fetchWaitTimes]);

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
                    className="relative w-full max-w-5xl h-[92vh] md:h-[88vh] bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-y-auto shadow-2xl border border-gray-200 will-change-transform flex flex-col md:flex-row"
                >
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center bg-black/25 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/20 shadow-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* ── MOBILE: gallery on top ── */}
                    <div className="md:hidden h-[300px] shrink-0 relative rounded-t-[2rem] overflow-hidden">
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
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 via-black/30 to-transparent z-10" />
                                <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-5">
                                    <h2 className="text-lg font-black text-white tracking-tight leading-none mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{shop.name}</h2>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-1 text-white/90 text-[10px] font-medium">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-2.5 h-2.5 text-[#7fc96d]" />
                                                <span className="truncate max-w-[200px]">{shop.address}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <button
                                                onClick={() => window.location.href = `/shops-map?select=${shop._id || shop.id}`}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-[9px] font-black uppercase border border-white/10 transition-all w-fit shadow-lg"
                                            >
                                                <Navigation size={10} className="text-[#7fc96d]" />
                                                Road Route
                                            </button>
                                            {shopDistance && (
                                                <span className="flex items-center gap-1 px-2.5 py-2 bg-black/40 backdrop-blur-md rounded-lg text-white border border-white/10 text-[9px] font-black uppercase shadow-sm">
                                                    <MapPin className="w-2.5 h-2.5 text-[#7fc96d]" /> {shopDistance} km
                                                </span>
                                            )}
                                        </div>
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
                                        <div className="flex flex-wrap items-center gap-2 text-white/70 text-sm">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-[#7fc96d]" />
                                                <span className="truncate max-w-[250px]">{shop.address}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <button
                                                onClick={() => window.location.href = `/shops-map?select=${shop._id || shop.id}`}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-[#4C763B] hover:bg-[#3b5c2e] rounded-xl text-white text-xs font-bold shadow-lg shadow-[#4C763B]/20 transition-all w-fit group"
                                            >
                                                <Navigation size={14} className="group-hover:rotate-12 transition-transform" />
                                                Visualize Live Road Route
                                            </button>
                                            {shopDistance && (
                                                <span className="flex items-center gap-1.5 px-4 py-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white border border-white/10 text-xs font-bold shadow-sm">
                                                    <MapPin className="w-3.5 h-3.5 text-[#7fc96d]" /> {shopDistance} km away
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── CONTENT: right on desktop, bottom on mobile ── */}
                    <div className="flex-1 bg-white">
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
                                    <div className="text-xl font-black text-gray-900 tabular-nums leading-none">{shopBarbers.filter(b => b.isAvailable).length}</div>
                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Available</div>
                                </div>
                            </div>

                            {shopBarbers.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {shopBarbers.map((barber) => (
                                        <BarberCard
                                            key={barber._id || barber.id}
                                            barber={barber}
                                            onClick={onBarberClick}
                                            shopRating={displayRating}
                                            shopReviews={displayReviews}
                                            waitTimeMinutes={barberWaitTimes[barber.barberId || barber.owner?._id]}
                                        />
                                    ))}
                                    {isLoadingBarbers && fetchedBarbers.length === 0 && (
                                        <div className="col-span-full py-4 text-center text-gray-500 text-sm animate-pulse">
                                            Loading more professionals...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 border border-gray-100 shadow-sm">
                                        <Users className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 font-semibold text-sm">
                                        {isLoadingBarbers ? 'Loading professionals...' : 'No staff currently available'}
                                    </p>
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
