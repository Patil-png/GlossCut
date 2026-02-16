
import React, { useRef, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Crosshair, Navigation } from 'lucide-react-native';

const LeafletMap = ({
    initialRegion,
    onRegionChangeComplete,
    style
}) => {
    const webViewRef = useRef(null);

    // Memoize the HTML content to prevent reloads on re-renders
    // We ONLY use initialRegion here, never the updating region
    const source = useMemo(() => {
        // Default to India center if no region provided
        const lat = initialRegion?.latitude || 20.5937;
        const lng = initialRegion?.longitude || 78.9629;
        const zoom = 15;

        return {
            html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; background-color: #f0f0f0; }
            .leaflet-control-attribution { font-size: 8px; }
            /* Center marker to indicate target */
            .center-marker {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 32px;
              height: 32px;
              margin-top: -32px; /* Bottom tip at center */
              margin-left: -16px; 
              z-index: 1000;
              pointer-events: none;
              background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366F1" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>');
              background-repeat: no-repeat;
              background-size: contain;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map', {
              zoomControl: false,
              attributionControl: false
            }).setView([${lat}, ${lng}], ${zoom});

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);

            // Debounce function to prevent flooding React Native with messages
            function debounce(func, timeout = 300){
              let timer;
              return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => { func.apply(this, args); }, timeout);
              };
            }

            // Notify React Native when map moves
            function sendCenter() {
              var center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'onRegionChangeComplete',
                latitude: center.lat,
                longitude: center.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              }));
            }

            // Only send update when movement ENDS to perform better
            map.on('moveend', sendCenter);
            
            // Initial sync
            setTimeout(sendCenter, 500);
          </script>
        </body>
      </html>
    `};
    }, []); // Empty dependency array ensures it NEVER changes references

    const handleMessage = (event) => {
        if (onRegionChangeComplete) {
            try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'onRegionChangeComplete') {
                    onRegionChangeComplete({
                        latitude: data.latitude,
                        longitude: data.longitude,
                        latitudeDelta: data.latitudeDelta,
                        longitudeDelta: data.longitudeDelta,
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    };

    const handleLocateMe = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to find your position.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Inject JS to center map
            if (webViewRef.current) {
                // We use standard Leaflet API: map.setView([lat, lng], zoom)
                // Use a slightly higher zoom for specific location
                webViewRef.current.injectJavaScript(`
                    if (typeof map !== 'undefined') {
                        map.setView([${latitude}, ${longitude}], 16);
                        // Trigger update manually since moveend might not fire if map doesn't technically "move" enough or if there's a race condition
                        setTimeout(sendCenter, 500); 
                    }
                    true; // note: required for injectJavaScript on iOS to not hang/warning
                `);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not fetch location.');
        }
    };

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={source}
                style={{ flex: 1 }}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6366F1" />
                    </View>
                )}
            />

            <TouchableOpacity
                style={styles.locateBtn}
                onPress={handleLocateMe}
                activeOpacity={0.8}
            >
                <Crosshair size={20} color="#FFF" />
                <Text style={styles.locateText}>Locate Me</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        position: 'relative' // Ensure absolute children position relative to this
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0'
    },
    locateBtn: {
        position: 'absolute',
        top: 60, // Moved to top to avoid overlap with bottom panels
        right: 20,
        backgroundColor: '#6366F1', // Primary Indigo
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 9999
    },
    locateText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8
    }
});

export default LeafletMap;
