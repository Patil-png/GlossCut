import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Users, ChevronLeft, ChevronRight, Scissors, ShieldCheck, Sparkles } from 'lucide-react';
import Image from './Image';
import BarberCard from './BarberCard';

// Helper function to get valid image URL
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
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-xl"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: 80, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 80, opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-4xl h-[92vh] md:h-[88vh] bg-[#0f0f0f] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/10 will-change-transform"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 z-50 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/10 shadow-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* ── GALLERY / HERO ── */}
                    <div className="relative h-[55%] md:h-[52%] shrink-0 bg-black overflow-hidden">
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
                                            <div key={idx} className="w-full h-full shrink-0 snap-center relative flex items-center justify-center overflow-hidden bg-black">
                                                {/* blurred bg */}
                                                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50" aria-hidden="true" />
                                                {/* main image */}
                                                <Image src={url} fallbackSrc="/GlossCut.png" className="relative z-10 max-w-full max-h-full object-contain" alt={`shop-${idx}`} style={{ userSelect: 'none', pointerEvents: 'none' }} />
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
                                            className={`w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white pointer-events-auto hover:bg-black/80 active:scale-90 transition-all shadow-xl ${dis ? 'opacity-25 cursor-not-allowed' : ''}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>

                                {/* Slide counter pill */}
                                <div className="absolute top-5 left-5 z-20 bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full text-[10px] font-bold text-white/90 border border-white/15 tracking-widest">
                                    {activeIndex + 1} / {shop.shopImages.length}
                                </div>

                                {/* Dots */}
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                                    {shop.shopImages.map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="relative h-full w-full">
                                <Image src={getValidImageUrl(shop.image || shop.owner?.profilePicture)} fallbackSrc="/GlossCut.png" className="w-full h-full object-cover opacity-60" alt="cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-black/30 to-transparent" />
                            </div>
                        )}
                        {/* Bottom fade into card */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f0f0f] to-transparent pointer-events-none z-10" />
                    </div>

                    {/* ── CONTENT AREA ── */}
                    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Shop Identity Section */}
                        <div className="px-6 pt-2 pb-5 border-b border-white/8">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C763B]/20 text-[#7fc96d] border border-[#4C763B]/30 text-[10px] font-black uppercase tracking-widest">
                                    <Scissors className="w-3 h-3" />
                                    {shop.category || 'Barber Shop'}
                                </span>
                                {shop.verifiedShop && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-400/20 text-[10px] font-black uppercase tracking-widest">
                                        <ShieldCheck className="w-3 h-3" /> Verified
                                    </span>
                                )}
                                {displayRating > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/20 text-[10px] font-bold">
                                        <Star className="w-3 h-3 fill-amber-400" /> {displayRating.toFixed(1)} <span className="text-white/40">({displayReviews} reviews)</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-400/20 text-[10px] font-black uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3" /> New Shop
                                    </span>
                                )}
                            </div>

                            {/* Name */}
                            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none mb-3">
                                {shop.name}
                            </h2>

                            {/* Address */}
                            <div className="flex items-start gap-2.5 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                                <MapPin className="w-4 h-4 text-[#7fc96d] mt-0.5 shrink-0" />
                                <p className="text-sm text-white/60 font-medium leading-snug">{shop.address}</p>
                            </div>
                        </div>

                        {/* Pro Selection */}
                        <div className="px-6 pt-5 pb-8">
                            {/* Section heading */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4C763B] to-[#6aab55] flex items-center justify-center shadow-lg shadow-[#4C763B]/30">
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white leading-none">Select a Professional</h3>
                                        <p className="text-[11px] text-white/40 mt-0.5">Choose who you want to book with</p>
                                    </div>
                                </div>
                                <div className="bg-white/8 border border-white/10 rounded-xl px-4 py-2 text-center">
                                    <div className="text-xl font-black text-white tabular-nums leading-none">{shopBarbers.length}</div>
                                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Available</div>
                                </div>
                            </div>

                            {shopBarbers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {shopBarbers.map((barber) => (
                                        <BarberCard
                                            key={barber.id}
                                            barber={barber}
                                            onClick={onBarberClick}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-white/3 rounded-2xl border border-dashed border-white/10">
                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-3 border border-white/10">
                                        <Users className="w-7 h-7 text-white/20" />
                                    </div>
                                    <p className="text-white/30 font-semibold text-sm">No staff currently available</p>
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
