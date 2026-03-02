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

                // Add Premium Dark Tile Layer (CartoDB Dark Matter)
                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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

    // --- ROAD ROUTE VISUALIZATION ---
    useEffect(() => {
        if (!mapReady || !leafletMap.current || !window.L || !routeLayer.current || !userLocation || !selectedShop) {
            if (routeLayer.current) routeLayer.current.clearLayers();
            return;
        }

        const fetchAndDrawRoute = async () => {
            try {
                const [userLat, userLng] = userLocation;
                const [shopLng, shopLat] = selectedShop.location.coordinates;

                if (shopLat === 0 && shopLng === 0) return;

                const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
                const url = `${protocol}//router.project-osrm.org/route/v1/driving/${userLng},${userLat};${shopLng},${shopLat}?overview=full&geometries=geojson`;

                console.log("🛣️ Fetching Route Geometry...", { from: userLocation, to: [shopLat, shopLng] });
                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes?.[0]?.geometry) {
                    routeLayer.current.clearLayers();

                    const routeGeoJSON = data.routes[0].geometry;
                    const routeStyle = {
                        color: '#4C763B',
                        weight: 6,
                        opacity: 0.8,
                        lineJoin: 'round',
                        dashArray: '1, 12'
                    };

                    // Background line for glow effect
                    window.L.geoJSON(routeGeoJSON, {
                        style: { color: '#4C763B', weight: 10, opacity: 0.2 }
                    }).addTo(routeLayer.current);

                    // Main animated-style dashed line
                    window.L.geoJSON(routeGeoJSON, {
                        style: routeStyle
                    }).addTo(routeLayer.current);

                    // Fit bounds to show route
                    const routeBounds = window.L.geoJSON(routeGeoJSON).getBounds();
                    leafletMap.current.fitBounds(routeBounds.pad(0.2), { animate: true });

                    console.log("✅ Road Route Displayed on Map.");
                }
            } catch (err) {
                console.error("❌ Failed to fetch road route:", err);
            }
        };

        fetchAndDrawRoute();
    }, [selectedShop, userLocation, mapReady]);

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

                const marker = window.L.marker([lat, lng], { icon: customIcon })
                    .on('click', () => {
                        if (onShopClick) onShopClick(shop);
                    })
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
    }, [shops, mapReady, userLocation, onShopClick]);


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
