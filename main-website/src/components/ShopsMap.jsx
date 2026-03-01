import React, { useEffect, useRef } from 'react';

const ShopsMap = ({ shops = [], center = [20.9320, 77.7523], zoom = 13 }) => {
    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markersLayer = useRef(null);

    useEffect(() => {
        const initMap = () => {
            if (!leafletMap.current && window.L && mapRef.current) {
                leafletMap.current = window.L.map(mapRef.current, {
                    zoomControl: true,
                    attributionControl: false
                }).setView(center, zoom);

                // Add Tile Layer (Switching to standard OSM for debugging)
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(leafletMap.current);

                // Layer group for markers
                markersLayer.current = window.L.layerGroup().addTo(leafletMap.current);

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
            if (leafletMap.current) {
                // Keep the same map instance unless unmounting
            }
        };
    }, [center, zoom]);

    // Update markers when shops change
    useEffect(() => {
        if (!leafletMap.current || !window.L || !markersLayer.current) return;

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

                const popupContent = `
                    <div class="shop-popup">
                        <h3 style="font-weight: 800; font-size: 16px; margin-bottom: 4px; color: #fff; font-family: sans-serif;">${shop.name}</h3>
                        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px; font-family: sans-serif;">${shop.address || 'Location Verified'}</p>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: sans-serif;">★ ${shop.rating || '4.5'}</span>
                        </div>
                        <a href="/all-services-search?shopId=${shop._id}" 
                           style="display: block; width: 100%; text-align: center; background: #f59e0b; color: #000; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; transition: background 0.2s; font-family: sans-serif;">
                           Book Appointment
                        </a>
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
            const group = window.L.featureGroup(markerList);
            leafletMap.current.fitBounds(group.getBounds().pad(0.3));
        }

        // Ensure map size is correct
        leafletMap.current.invalidateSize();
    }, [shops]);


    return (
        <div
            ref={mapRef}
            id="shop-map"
            style={{ height: '100%', minHeight: '500px', width: '100%', position: 'relative', zIndex: 1 }}
            className="shop-map-container overflow-hidden rounded-3xl border border-white/10"
        />
    );
};

export default ShopsMap;
