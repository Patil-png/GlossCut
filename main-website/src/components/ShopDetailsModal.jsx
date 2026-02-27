import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Users, ChevronLeft, ChevronRight, Scissors, ShieldCheck, Sparkles } from 'lucide-react';
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

const ShopDetailsModal = ({ isOpen, shop, onClose, barbers, onBarberClick }) => {
    const galleryRef = React.useRef(null);
    const [activeIndex, setActiveIndex] = React.useState(0);

    const handleScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.clientWidth;
        setActiveIndex(Math.round(scrollPosition / width));
    };

    const scrollGallery = (direction) => {
        if (galleryRef.current) {
            const scrollAmount = galleryRef.current.clientWidth;
            galleryRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

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
        const reviews = (shop.reviews > 0 ? shop.reviews : filteredBarbers.reduce((s, b) => s + (b.reviews || 0), 0)) || 0;
        return { shopBarbers: filteredBarbers, displayRating: rating, displayReviews: reviews };
    }, [shop, barbers]);

    const hasGallery = shop?.shopImages?.length > 0;

    // Reusable gallery panel
    const GalleryPanel = ({ className = '', innerClassName = '' }) => (
        <div className={`relative bg-gray-900 overflow-hidden ${className}`}>
            {hasGallery ? (
                <div className="group relative h-full">
                    <div
                        ref={galleryRef}
                        onScroll={handleScroll}
                        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
                        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {shop.shopImages.map((img, idx) => {
                            const url = getValidImageUrl(img);
                            return (
                                <div key={idx} className="w-full h-full shrink-0 snap-center relative flex items-center justify-center overflow-hidden">
                                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40" aria-hidden="true" />
                                    <Image src={url} fallbackSrc="/GlossCut.png" className="relative z-10 w-full h-full object-cover" alt={`shop-${idx}`} style={{ userSelect: 'none', pointerEvents: 'none' }} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Arrows */}
                    <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {[['left', activeIndex === 0, ChevronLeft], ['right', activeIndex === shop.shopImages.length - 1, ChevronRight]].map(([dir, dis, Icon]) => (
                            <button
                                key={dir}
                                onClick={(e) => { e.stopPropagation(); scrollGallery(dir); }}
                                disabled={dis}
                                className={`w-9 h-9 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 active:scale-90 transition-all shadow-xl ${dis ? 'opacity-25 cursor-not-allowed' : ''}`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="absolute top-4 left-4 z-30 bg-black/40 backdrop-blur-xl px-2.5 py-1 rounded-full text-[9px] font-bold text-white border border-white/15 tracking-widest">
                        {activeIndex + 1} / {shop.shopImages.length}
                    </div>

                    {/* Dots */}
                    <div className={`absolute left-1/2 -translate-x-1/2 flex gap-1.5 z-30 pointer-events-none ${innerClassName}`}>
                        {shop.shopImages.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                        ))}
                    </div>
                </div>
            ) : (
                <Image src={getValidImageUrl(shop.image || shop.owner?.profilePicture)} fallbackSrc="/GlossCut.png" className="w-full h-full object-cover opacity-90" alt="cover" />
            )}

            {/* Dark gradient fade from bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-20 pointer-events-none" />

            {/* Shop info overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-30 px-5 pb-5 pt-3">
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
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-sm mb-1.5">
                    {shop.name}
                </h2>
                <div className="flex items-center gap-2 text-white/65 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#7fc96d] shrink-0" />
                    <span className="truncate">{shop.address}</span>
                </div>
            </div>
        </div>
    );

    if (!isOpen || !shop) return null;

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

                {/* Modal */}
                <motion.div
                    initial={{ y: 80, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 80, opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-5xl h-[92vh] md:h-[88vh] bg-white rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 will-change-transform flex flex-col md:flex-row"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center bg-black/25 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/20 shadow-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* ── MOBILE: gallery on top (stacked) ── */}
                    <GalleryPanel
                        className="md:hidden h-[50%] shrink-0 rounded-t-[2rem]"
                        innerClassName="bottom-[88px]"
                    />

                    {/* ── DESKTOP: gallery on left panel ── */}
                    <GalleryPanel
                        className="hidden md:block w-[42%] shrink-0 rounded-l-[2rem]"
                        innerClassName="bottom-[96px]"
                    />

                    {/* ── CONTENT AREA (right on desktop, bottom on mobile) ── */}
                    <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="px-6 pt-6 pb-8">
                            {/* Section heading */}
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
                                        <BarberCard key={barber.id} barber={barber} onClick={onBarberClick} />
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
