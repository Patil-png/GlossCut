import React, { useEffect, useRef } from 'react';
import { Navigation } from 'lucide-react';

const ShopsMap = ({ shops = [], center = [20.9320, 77.7523], zoom = 13, userLocation = null, onShopClick, selectedShop = null }) => {
    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markersLayer = useRef(null);
    const userMarkerLayer = useRef(null);
    const routeLayer = useRef(null);
    const [mapReady, setMapReady] = React.useState(false);

    useEffect(() => {
        const initMap = () => {
            if (!leafletMap.current && window.L && mapRef.current) {
                leafletMap.current = window.L.map(mapRef.current, {
                    zoomControl: true,
                    attributionControl: false
                }).setView(center, zoom);

                // Add Premium Clean Light Tile Layer (CartoDB Positron) - Zomato style
                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }).addTo(leafletMap.current);

                // Layer groups
                markersLayer.current = window.L.layerGroup().addTo(leafletMap.current);
                userMarkerLayer.current = window.L.layerGroup().addTo(leafletMap.current);
                routeLayer.current = window.L.layerGroup().addTo(leafletMap.current);

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

    const lastSelectedShopId = useRef(null);
    const hasInitialMarkersFit = useRef(false);

    const [loadingRoute, setLoadingRoute] = React.useState(false);

    // --- ROAD ROUTE VISUALIZATION ---
    useEffect(() => {
        if (!mapReady || !leafletMap.current || !window.L || !routeLayer.current || !userLocation || !selectedShop) {
            if (routeLayer.current) routeLayer.current.clearLayers();
            lastSelectedShopId.current = null;
            return;
        }

        const fetchAndDrawRoute = async () => {
            setLoadingRoute(true);
            try {
                const [userLat, userLng] = userLocation;
                const [shopLng, shopLat] = selectedShop.location.coordinates;

                if (shopLat === 0 && shopLng === 0) {
                    setLoadingRoute(false);
                    return;
                }

                const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
                const url = `${protocol}//router.project-osrm.org/route/v1/driving/${userLng},${userLat};${shopLng},${shopLat}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes?.[0]?.geometry) {
                    routeLayer.current.clearLayers();

                    const routeGeoJSON = data.routes[0].geometry;

                    // Background glow
                    window.L.geoJSON(routeGeoJSON, {
                        style: { color: '#ef4444', weight: 8, opacity: 0.2, lineJoin: 'round' }
                    }).addTo(routeLayer.current);

                    // Main road line
                    const line = window.L.geoJSON(routeGeoJSON, {
                        style: {
                            color: '#ef4444',
                            weight: 4,
                            opacity: 0.9,
                            lineJoin: 'round',
                            dashArray: '0, 0'
                        }
                    }).addTo(routeLayer.current);

                    // ONLY fit bounds if the selected shop JUST changed or it's the first route
                    const currentId = selectedShop._id || selectedShop.id;
                    if (lastSelectedShopId.current !== currentId) {
                        const routeBounds = line.getBounds();
                        leafletMap.current.fitBounds(routeBounds.pad(0.35), { animate: true });
                        lastSelectedShopId.current = currentId;
                    }
                }
            } catch (err) {
                // Silently catch network errors (e.g., adblockers or CORS) to prevent React from crashing
                console.warn("⚠️ Route fetch failed or blocked:", err.message);
            } finally {
                setLoadingRoute(false);
            }
        };

        fetchAndDrawRoute();
    }, [selectedShop, userLocation, mapReady]);

    // Update markers
    useEffect(() => {
        if (!mapReady || !leafletMap.current || !window.L || !markersLayer.current) return;

        markersLayer.current.clearLayers();

        const markerList = [];
        shops.forEach(shop => {
            if (shop.location?.coordinates?.length === 2) {
                const [lng, lat] = shop.location.coordinates;
                if (lat === 0 && lng === 0) return;

                const customIcon = window.L.divIcon({
                    className: 'custom-shop-marker',
                    html: `
                        <div class="marker-container ${selectedShop?._id === shop._id ? 'is-selected' : ''}">
                            <div class="marker-pin-outer">
                                <div class="marker-image-wrapper">
                                    <img src="${shop.image || '/GlossCut.png'}" alt="" onerror="this.src='/GlossCut.png'" class="marker-image" />
                                </div>
                                <div class="marker-bottom-arrow"></div>
                            </div>
                            ${shop.isPriority ? `
                            <div class="marker-label is-priority">
                                <span class="rating-dot">👑</span>
                                <span class="rating-val">FEATURED</span>
                            </div>
                            ` : (shop.shopRating === 0 ? `
                            <div class="marker-label is-new">
                                <span class="rating-dot">✨</span>
                                <span class="rating-val">NEW</span>
                            </div>
                            ` : '')}
                        </div>
                    `,
                    iconSize: [44, 54],
                    iconAnchor: [22, 54]
                });

                const marker = window.L.marker([lat, lng], { icon: customIcon })
                    .on('click', () => { if (onShopClick) onShopClick(shop); })
                    .addTo(markersLayer.current);

                markerList.push(marker);
            }
        });

        // ONLY fit bounds once on initial load or if shops change and we haven't fitted yet
        // DON'T refit every time userLocation changes
        if (markerList.length > 0 && !hasInitialMarkersFit.current) {
            try {
                const markerLatLngs = markerList.map(m => m.getLatLng());
                const bounds = window.L.latLngBounds(markerLatLngs);
                if (bounds.isValid()) {
                    leafletMap.current.fitBounds(bounds.pad(0.3), { maxZoom: 16 });
                    hasInitialMarkersFit.current = true;
                }
            } catch (err) { }
        }

        setTimeout(() => { if (leafletMap.current) leafletMap.current.invalidateSize(); }, 100);
    }, [shops, mapReady, onShopClick, selectedShop]);


    return (
        <div className="relative w-full h-full">
            <div
                ref={mapRef}
                id="shop-map"
                style={{ height: '100%', minHeight: '500px', width: '100%', position: 'relative', zIndex: 1 }}
                className="shop-map-container overflow-hidden rounded-3xl border border-gray-100 shadow-2xl"
            />
            {/* Loading Route Progress Bar */}
            {loadingRoute && (
                <div className="absolute top-0 left-0 right-0 z-[1001] h-1.5 overflow-hidden rounded-t-3xl">
                    <div className="h-full bg-amber-500 animate-loading-bar shadow-[0_0_10px_#f59e0b]" />
                </div>
            )}
            {userLocation && (
                <button
                    onClick={handleLocateMe}
                    className={`absolute ${selectedShop ? 'bottom-32 md:bottom-10' : 'bottom-10'} right-10 z-[1000] bg-white text-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-100 hover:bg-amber-500 hover:text-white transition-all transform hover:scale-110 active:scale-95 group`}
                    title="Find My Location"
                >
                    <Navigation className="group-hover:rotate-12 transition-transform" size={24} />
                </button>
            )}

            <style>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0%); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s infinite linear;
                }
            `}</style>
        </div>
    );
};

export default ShopsMap;
