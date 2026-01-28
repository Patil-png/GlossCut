import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Star, Users } from 'lucide-react';
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

                {/* Banner Header */}
                <div className="relative h-48 md:h-64 shrink-0 bg-gray-900">
                    <Image
                        src={getValidImageUrl(shop.image || shop.owner?.profilePicture)}
                        fallbackSrc="/gloss_cut.png"
                        className="w-full h-full object-cover opacity-80"
                        alt="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/20 text-white border border-white/20 backdrop-blur-md uppercase tracking-wider shadow-sm">
                                        {shop.category || 'Barber Shop'}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-amber-400 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                                        <span className="text-xs font-bold text-white">{displayRating.toFixed(1)}</span>
                                        <span className="text-[10px] text-gray-400">({displayReviews} reviews)</span>
                                    </div>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">{shop.name}</h2>
                                <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                                    <MapPin className="w-4 h-4" />
                                    {shop.address}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-20 bg-white">

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
        </div>,
        document.body // This renders the modal directly into the <body>
    );
};

export default ShopDetailsModal;
