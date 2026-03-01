import React, { useEffect, useRef } from 'react';
import { Navigation } from 'lucide-react';

const ShopsMap = ({ shops = [], center = [20.9320, 77.7523], zoom = 13, userLocation = null }) => {
    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markersLayer = useRef(null);
    const userMarkerLayer = useRef(null);
    const [mapReady, setMapReady] = React.useState(false);

    useEffect(() => {
        const initMap = () => {
            if (!leafletMap.current && window.L && mapRef.current) {
                leafletMap.current = window.L.map(mapRef.current, {
                    zoomControl: true,
                    attributionControl: false
                }).setView(center, zoom);

                // Add Premium Dark Tile Layer (CartoDB Dark Matter)
                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }).addTo(leafletMap.current);

                // Layer groups
                markersLayer.current = window.L.layerGroup().addTo(leafletMap.current);
                userMarkerLayer.current = window.L.layerGroup().addTo(leafletMap.current);

                setMapReady(true);

                // Force a resize check after a small delay
                setTimeout(() => {
                    if (leafletMap.current) leafletMap.current.invalidateSize();
                }, 500);
            }
        };

        // Check if Leaflet is already loaded, otherwise wait a bit
        if (window.L) {
            initMap();
        } else {
            const checkL = setInterval(() => {
                if (window.L) {
                    initMap();
                    clearInterval(checkL);
                }
            }, 100);
            return () => clearInterval(checkL);
        }

        return () => {
            // Cleanup if needed
        };
    }, [center, zoom]);

    // Handle User Location Update
    useEffect(() => {
        if (!mapReady || !leafletMap.current || !window.L || !userMarkerLayer.current || !userLocation) return;

        // Clear previous user marker
        userMarkerLayer.current.clearLayers();

        const userIcon = window.L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-pulse"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        window.L.marker(userLocation, {
            icon: userIcon,
            zIndexOffset: 2000
        })
            .bindPopup('<div style="font-weight: 800; color: #3b82f6; font-family: sans-serif;">You are here</div>')
            .addTo(userMarkerLayer.current);

    }, [userLocation, mapReady]);

    const handleLocateMe = () => {
        if (userLocation && leafletMap.current) {
            leafletMap.current.setView(userLocation, 16, { animate: true });
        }
    };

    // Update markers when shops or mapReady change
    useEffect(() => {
        if (!mapReady || !leafletMap.current || !window.L || !markersLayer.current) return;

        // Clear existing markers
        markersLayer.current.clearLayers();

        // Add new markers
        const markerList = [];
        shops.forEach(shop => {
            if (shop.location && shop.location.coordinates && shop.location.coordinates.length === 2) {
                const [lng, lat] = shop.location.coordinates;

                if (lat === 0 && lng === 0) return;

                const customIcon = window.L.divIcon({
                    className: 'custom-shop-marker',
                    html: `
                        <div class="marker-pin-wrapper">
                            <div class="marker-pin"></div>
                            <div class="marker-shadow"></div>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                });

                // Get shop image (backend uses "image" field for shops)
                const DEFAULT_SHOP_IMAGE = '/GlossCut.png';
                let shopImg = DEFAULT_SHOP_IMAGE;
                const imagePath = shop.image || (shop.shopImages && shop.shopImages[0]) || shop.owner?.profilePicture;

                if (imagePath) {
                    shopImg = imagePath.startsWith('http')
                        ? imagePath
                        : `${process.env.REACT_APP_API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
                }

                // Use the correct fields from backend (shopRating and totalReviews are aggregated)
                const rating = Number(shop.shopRating || shop.rating || 0);
                const reviewsCount = shop.totalReviews || shop.reviews || 0;

                const starsHtml = Array.from({ length: 5 }).map((_, i) => `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${i < Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.1)'}" stroke="${i < Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.2)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                `).join('');

                const popupContent = `
                    <div class="shop-popup-premium">
                        <div class="shop-image-container" style="background: #1a1a1a; display: flex; align-items: center; justify-content: center;">
                            <img src="${shopImg}" alt="${shop.name}" onerror="this.src='/GlossCut.png'" class="shop-modal-img" style="max-height: 100%; object-fit: cover;" />
                            <div class="shop-status-badge">Verified</div>
                        </div>
                        <div class="shop-info-content">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <h3 style="font-weight: 800; font-size: 18px; color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0;">${shop.name}</h3>
                                ${shop.isVerified ? `
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6" style="margin-top: 2px;">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                ` : ''}
                            </div>
                            <div class="shop-rating-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <div style="display: flex; align-items: center; gap: 2px;">${starsHtml}</div>
                                <span style="font-size: 15px; font-weight: 900; color: #f59e0b; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1;">${rating > 0 ? rating.toFixed(1) : 'New'}</span>
                                <span style="font-size: 11px; color: #94a3b8; font-family: 'Plus Jakarta Sans', sans-serif; opacity: 0.8;">(${reviewsCount} reviews)</span>
                            </div>
                            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 16px; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.4;">${shop.address || 'Premium Partner Site'}</p>
                            <a href="/all-services-search?shopId=${shop._id}" 
                               style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; text-align: center; background: #f59e0b; color: #000; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; transition: transform 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                               <span>Book Appointment</span>
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </a>
                        </div>
                    </div>
                `;

                const marker = window.L.marker([lat, lng], { icon: customIcon })
                    .bindPopup(popupContent)
                    .addTo(markersLayer.current);

                markerList.push(marker);
            }
        });

        // Fit bounds if markers exist
        if (markerList.length > 0) {
            try {
                const markerLatLngs = markerList.map(m => m.getLatLng());
                const bounds = window.L.latLngBounds(markerLatLngs);

                if (userLocation) {
                    bounds.extend(userLocation);
                }

                if (bounds.isValid()) {
                    leafletMap.current.fitBounds(bounds.pad(0.3), { maxZoom: 16 });
                }
            } catch (err) { }
        }

        // Ensure map size is correct
        setTimeout(() => {
            if (leafletMap.current) leafletMap.current.invalidateSize();
        }, 100);
    }, [shops, mapReady, userLocation]);


    return (
        <div className="relative w-full h-full">
            <div
                ref={mapRef}
                id="shop-map"
                style={{ height: '100%', minHeight: '500px', width: '100%', position: 'relative', zIndex: 1 }}
                className="shop-map-container overflow-hidden rounded-3xl border border-gray-100 shadow-2xl"
            />
            {userLocation && (
                <button
                    onClick={handleLocateMe}
                    className="absolute bottom-10 right-10 z-[1000] bg-white text-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-100 hover:bg-amber-500 hover:text-white transition-all transform hover:scale-110 active:scale-95 group"
                    title="Find My Location"
                >
                    <Navigation className="group-hover:rotate-12 transition-transform" size={24} />
                </button>
            )}
        </div>
    );
};

export default ShopsMap;
