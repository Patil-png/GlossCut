import React, { useEffect, useRef } from 'react';

const ShopsMap = ({ shops = [], center = [21.1458, 79.0882], zoom = 12 }) => {
    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markersLayer = useRef(null);

    useEffect(() => {
        // Initialize map only once
        if (!leafletMap.current && window.L) {
            leafletMap.current = window.L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView(center, zoom);

            // Add Dark Tile Layer
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
            }).addTo(leafletMap.current);

            // Layer group for markers
            markersLayer.current = window.L.layerGroup().addTo(leafletMap.current);
        }

        return () => {
            if (leafletMap.current) {
                // We keep it alive for better performance if reused, 
                // but if we really want to destroy it:
                // leafletMap.current.remove();
                // leafletMap.current = null;
            }
        };
    }, [center, zoom]);

    // Update markers when shops change
    useEffect(() => {
        if (!leafletMap.current || !window.L || !markersLayer.current) return;

        // Clear existing markers
        markersLayer.current.clearLayers();

        // Add new markers
        shops.forEach(shop => {
            if (shop.location && shop.location.coordinates && shop.location.coordinates.length === 2) {
                const [lng, lat] = shop.location.coordinates;

                // Filter out [0, 0] or invalid coordinates
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
                        <h3 style="font-weight: 800; font-size: 16px; margin-bottom: 4px; color: #fff;">${shop.name}</h3>
                        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">${shop.address || 'Amravati, Maharashtra'}</p>
                        <div style="display: flex; items-center: center; gap: 8px; margin-bottom: 12px;">
                            <span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700;">★ ${shop.rating || '4.5'}</span>
                            <span style="color: #6b7280; font-size: 12px;">${shop.totalReviews || shop.reviews || '50'}+ reviews</span>
                        </div>
                        <a href="/all-services-search?shopId=${shop._id}" 
                           style="display: block; width: 100%; text-align: center; background: #f59e0b; color: #000; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; transition: background 0.2s;">
                           Book Appointment
                        </a>
                    </div>
                `;

                window.L.marker([lat, lng], { icon: customIcon })
                    .bindPopup(popupContent)
                    .addTo(markersLayer.current);
            }
        });

        // Fit bounds if markers exist
        if (shops.length > 0) {
            const validMarkers = shops.filter(s => s.location?.coordinates?.[0] !== 0);
            if (validMarkers.length > 0) {
                // leafletMap.current.fitBounds(window.L.featureGroup(
                //     validMarkers.map(s => window.L.marker([s.location.coordinates[1], s.location.coordinates[0]]))
                // ).getBounds().pad(0.1));
            }
        }
    }, [shops]);

    return (
        <div
            ref={mapRef}
            id="shop-map"
            className="shop-map-container overflow-hidden rounded-3xl border border-white/10"
        />
    );
};

export default ShopsMap;
