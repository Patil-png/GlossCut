import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in React Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const LocationMarker = ({ position, onLocationSelect }) => {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const LeafletMap = ({ initialRegion, onRegionChangeComplete, ...props }) => {
    const defaultPosition = [20.5937, 78.9629]; // Center of India fallback
    const position = initialRegion ? [initialRegion.latitude, initialRegion.longitude] : defaultPosition;

    // Convert region format to LatLng if needed for internal logic
    const handleLocationSelect = (latlng) => {
        if (onRegionChangeComplete) {
            onRegionChangeComplete({
                latitude: latlng.lat,
                longitude: latlng.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            });
        }
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <MapContainer
                center={position}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                {...props}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={position} onLocationSelect={handleLocationSelect} />
            </MapContainer>
        </div>
    );
};

export default LeafletMap;
