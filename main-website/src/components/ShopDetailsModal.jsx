import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Star, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from './Image';
import BarberCard from './BarberCard';

// Helper function to get valid image URL (duplicated from parent, should ideally be a util)
const getValidImageUrl = (imageField) => {
    if (typeof imageField === 'string' && imageField.trim()) {
        // Check for known local assets first
        if (imageField.includes('gloss_cut.png') || imageField.includes('gloss_cut.png')) {
            return '/GlossCut.png';
        }
        // If it's already a full URL (starts with http), return as-is
        if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
            return imageField;
        }
        // If it's a relative path, prepend the API URL
        if (imageField.startsWith('/')) {
            return `${process.env.REACT_APP_API_URL}${imageField}`;
        }
        // For other cases, return the field as-is
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
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

    const scrollGallery = (direction) => {
        if (galleryRef.current) {
            const scrollAmount = galleryRef.current.clientWidth;
            galleryRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Optimize: Memoize filtering and rating calculation to avoid re-work on every render
    const { shopBarbers, displayRating, displayReviews } = useMemo(() => {
        if (!shop) return { shopBarbers: [], displayRating: 0, displayReviews: 0 };

        const shopMemberIds = [shop.owner?._id, ...(shop.staff || []).map(staff => staff._id)].filter(id => id);

        const filteredBarbers = barbers.filter(barber =>
            shopMemberIds.includes(barber.barberId) && barber.approvalStatus === 'approved'
        );

        // --- AGGREGATE RATING LOGIC ---
        // If shop has no direct rating, calculate it from its approved barbers
        const validBarberRatings = filteredBarbers.filter(b => b.rating > 0);
        const aggregatedRating = validBarberRatings.length > 0
            ? validBarberRatings.reduce((sum, b) => sum + b.rating, 0) / validBarberRatings.length
            : 0;

        // Use shop.shopRating if available, otherwise shop.rating, otherwise aggregated
        const rating = (shop.shopRating > 0 ? shop.shopRating : (shop.rating > 0 ? shop.rating : aggregatedRating)) || 0;

        // Aggregate reviews if shop total is 0
        const aggregatedReviews = filteredBarbers.reduce((sum, b) => sum + (typeof b.reviews === 'number' ? b.reviews : 0), 0);
        const reviews = (shop.reviews > 0 ? shop.reviews : aggregatedReviews) || 0;

        return { shopBarbers: filteredBarbers, displayRating: rating, displayReviews: reviews };
    }, [shop, barbers]);

    if (!isOpen || !shop) return null;

    // Render outside the main DOM hierarchy using createPortal
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-5xl h-[85vh] md:h-[85vh] bg-white rounded-t-3xl md:rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col will-change-transform"
            >
                {/* Close Button - Positioned safely with high Z-Index */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Banner Header / Gallery */}
                <div className="relative h-64 md:h-[400px] shrink-0 bg-gray-900 border-b border-gray-100/10">
                    {shop.shopImages && shop.shopImages.length > 0 ? (
                        <div className="group relative h-full">
                            <div
                                ref={galleryRef}
                                onScroll={handleScroll}
                                className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide"
                                style={{
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                            >
                                {shop.shopImages.map((img, idx) => {
                                    const imageUrl = getValidImageUrl(img);
                                    return (
                                        <div key={idx} className="w-full h-full shrink-0 snap-center relative flex items-center justify-center overflow-hidden bg-black">
                                            {/* Blurred background layer */}
                                            <Image
                                                src={imageUrl}
                                                fallbackSrc="/gloss_cut.png"
                                                className="absolute inset-0 w-full h-full object-cover blur-[30px] opacity-40 scale-110"
                                                alt="blur-bg"
                                            />
                                            {/* Foreground contained layer */}
                                            <Image
                                                src={imageUrl}
                                                fallbackSrc="/gloss_cut.png"
                                                className="relative z-10 max-w-full max-h-full object-contain"
                                                alt={`shop-view-${idx}`}
                                                style={{ userSelect: 'none', pointerEvents: 'none' }}
                                            />
                                            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20 shadow-lg">
                                                {idx + 1} / {shop.shopImages.length}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Navigation Arrows */}
                            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <button
                                    onClick={(e) => { e.stopPropagation(); scrollGallery('left'); }}
                                    className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 active:scale-95 transition-all shadow-xl ${activeIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    disabled={activeIndex === 0}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); scrollGallery('right'); }}
                                    className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 active:scale-95 transition-all shadow-xl ${activeIndex === shop.shopImages.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    disabled={activeIndex === shop.shopImages.length - 1}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Navigation Dots Indicator */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                                {shop.shopImages.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full border border-black/10 shadow-sm transition-all duration-300 ${i === activeIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Image
                            src={getValidImageUrl(shop.image || shop.owner?.profilePicture)}
                            fallbackSrc="/gloss_cut.png"
                            className="w-full h-full object-cover opacity-80"
                            alt="cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
                    {/* Shop Info Header Section */}
                    <div className="p-6 pb-0">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#4C763B]/10 text-[#4C763B] border border-[#4C763B]/20 uppercase tracking-wider">
                                    {shop.category || 'Barber Shop'}
                                </span>
                                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                                    <span className="text-xs font-bold">{displayRating.toFixed(1)}</span>
                                    <span className="text-[10px] text-gray-500">({displayReviews} reviews)</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                                    {shop.name}
                                </h2>
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <MapPin className="w-4 h-4 text-[#4C763B]" />
                                    {shop.address}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Professional Selection Header */}
                        <div className="mb-8 relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#4C763B]/20 via-green-500/10 to-transparent rounded-2xl blur-sm opacity-50"></div>
                            <div className="relative bg-gray-50 border border-gray-200 rounded-2xl p-5 overflow-hidden shadow-sm">
                                <div className="relative flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-1">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#4C763B] to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20 ring-1 ring-white/20">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Select a Professional</h3>
                                                <p className="text-[#4C763B] text-sm font-bold">Choose who you want to book with</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Counter Badge */}
                                    <div className="ml-4">
                                        <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-md">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{shopBarbers.length}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Available</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {shopBarbers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {shopBarbers.map((barber) => (
                                    <BarberCard
                                        key={barber.id}
                                        barber={barber}
                                        onClick={onBarberClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">No staff currently available.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShopDetailsModal;
