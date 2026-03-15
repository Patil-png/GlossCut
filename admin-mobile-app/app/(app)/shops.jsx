import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Dimensions,
    Image,
    Alert,
    Modal,
    Platform
} from 'react-native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Store,
    Search,
    QrCode,
    ChevronRight,
    MapPin,
    Phone,
    User,
    Printer,
    Download,
    X,
    Star
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { LOGO_BASE64 } from '../../assets/images/logoBase64';

const { width: screenWidth } = Dimensions.get("window");

export default function ShopsScreen() {
    const insets = useSafeAreaInsets();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const [selectedShop, setSelectedShop] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [globalSettings, setGlobalSettings] = useState(null);
    const [togglingFeature, setTogglingFeature] = useState(null); // ID of shop being toggled

    const qrRef = useRef(null);

    const fetchShops = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const [shopsRes, settingsRes] = await Promise.all([
                axios.get('/api/admin/shops', { timeout: 10000 }),
                axios.get('/api/settings')
            ]);

            setShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
            setGlobalSettings(settingsRes.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.msg || "Could not load data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    const filteredShops = shops.filter(shop =>
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [savingLocation, setSavingLocation] = useState(false);

    const handleViewQr = (shop) => {
        setSelectedShop(shop);
        setShowQrModal(true);
    };

    const handleOpenLocationModal = (shop) => {
        setSelectedShop(shop);
        if (shop.location?.coordinates?.length === 2) {
            setLongitude(shop.location.coordinates[0].toString());
            setLatitude(shop.location.coordinates[1].toString());
        } else {
            setLatitude('');
            setLongitude('');
        }
        setShowLocationModal(true);
    };

    const handleSaveLocation = async () => {
        if (!latitude || !longitude) {
            Alert.alert('Error', 'Please enter both latitude and longitude');
            return;
        }

        setSavingLocation(true);
        try {
            await axios.put(`/api/admin/shops/${selectedShop._id}/location`, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            });
            Alert.alert('Success', 'Shop location updated');
            setShowLocationModal(false);
            fetchShops(true);
        } catch (err) {
            console.error('Failed to update location:', err);
            Alert.alert('Error', 'Failed to update location');
        } finally {
            setSavingLocation(false);
        }
    };

    const handleToggleFeatured = async (shop) => {
        if (!globalSettings) return;

        const currentFeaturedIds = globalSettings.featuredShopIds?.map(s => typeof s === 'object' ? s._id : s) || [];
        const isCurrentlyFeatured = currentFeaturedIds.includes(shop._id);

        let newFeaturedIds;
        if (isCurrentlyFeatured) {
            newFeaturedIds = currentFeaturedIds.filter(id => id !== shop._id);
        } else {
            if (currentFeaturedIds.length >= 3) {
                Alert.alert('Limit Reached', 'You can only feature up to 3 shops. Please unfeature another shop first.');
                return;
            }
            newFeaturedIds = [...currentFeaturedIds, shop._id];
        }

        Alert.prompt(
            'Admin Authentication',
            'Enter admin password to update featured shops:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async (password) => {
                        setTogglingFeature(shop._id);
                        try {
                            const res = await axios.put('/api/settings', {
                                featuredShopIds: newFeaturedIds,
                                password
                            });
                            setGlobalSettings(res.data);
                            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Success', isCurrentlyFeatured ? 'Shop unfeatured' : 'Shop featured');
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.msg || 'Failed to update featured status');
                        } finally {
                            setTogglingFeature(null);
                        }
                    }
                }
            ],
            'secure-text'
        );
    };

    const generateAndSharePdf = async (shop) => {
        if (!shop) return;
        setGeneratingPdf(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const logoSrc = LOGO_BASE64;

            // Always generate a fresh, clean QR code for the PDF to ensure scannability.
            // Using the qrRef can sometimes capture an improperly scaled image.
            const qrData = `https://glosscut.com/checkin/${shop._id}`;
            // Add &ecc=H for High Error Correction Level to allow the logo overlay without breaking scannability
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&ecc=H&data=${qrData}`;

            let qrSrc;
            try {
                const tempFileUri = FileSystem.documentDirectory + `qr_${shop._id}.png`;
                const { uri } = await FileSystem.downloadAsync(qrUrl, tempFileUri);
                const base64Qr = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                qrSrc = `data:image/png;base64,${base64Qr}`;
            } catch (e) {
                console.log('Failed to download QR code image, falling back to URL', e);
                qrSrc = qrUrl;
            }

            const cleanShopName = shop.name.replace(/^@/, '').trim();


            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        * { box-sizing: border-box; }
                        body { margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #f1f1f1; }
                        .print-page {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 0;
                            width: 210mm;
                            height: 297mm;
                            padding: 14mm 12mm;
                            box-sizing: border-box;
                            background: #f1f1f1;
                        }
                        .print-card {
                            width: 135mm;
                            height: 72mm;
                            background: #111111;
                            border-radius: 10px;
                            display: flex;
                            flex-direction: row;
                            align-items: stretch;
                            overflow: visible;
                            position: relative;
                            flex-shrink: 0;
                        }
                        .card-wrap {
                            position: relative;
                            display: inline-flex;
                            margin: 2mm 0;
                            padding: 1px;
                            border: 1.5px dotted #94a3b8;
                            border-radius: 12px;
                        }
                        .card-left {
                            width: 70mm;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            padding: 8mm 3mm 8mm 8mm;
                            gap: 5px;
                            flex-shrink: 0;
                        }
                        .card-logo-circle {
                            width: 50px;
                            height: 50px;
                            background: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                            margin-bottom: 6px;
                        }
                        .card-logo-circle img {
                            width: 36px;
                            height: 36px;
                            object-fit: contain;
                        }
                        .card-brand-label {
                            font-size: 7px;
                            font-weight: 700;
                            color: rgba(255,255,255,0.35);
                            text-transform: uppercase;
                            letter-spacing: 2.5px;
                        }
                        .card-shop-name {
                            font-size: 18px;
                            font-weight: 900;
                            color: #ffffff;
                            text-transform: uppercase;
                            letter-spacing: -0.3px;
                            line-height: 1.05;
                        }
                        .card-subtitle {
                            font-size: 8px;
                            font-weight: 600;
                            color: rgba(255,255,255,0.35);
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                        }
                        .card-features {
                            display: flex;
                            flex-direction: column;
                            gap: 2px;
                            margin-top: 4px;
                        }
                        .card-feature {
                            font-size: 8px;
                            font-weight: 700;
                            color: #cbd5e1;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        .card-feature-normal {
                            text-transform: none;
                            letter-spacing: 0;
                        }
                        .card-right {
                            width: 58mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 5mm 4mm 5mm 2mm;
                            flex-shrink: 0;
                        }
                        .card-qr-wrap {
                            background: white;
                            border-radius: 8px;
                            padding: 6px;
                            position: relative;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .card-logo-overlay {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 48px;
                            height: 48px;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            border: 2px solid white;
                        }
                        .card-logo-overlay img {
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        }
                        .card-gold-strip {
                            width: 7px;
                            background: #c8992a;
                            flex-shrink: 0;
                        }
                        .card-url {
                            font-size: 6px;
                            color: rgba(255,255,255,0.25);
                            letter-spacing: 0.5px;
                            margin-top: 5px;
                            font-weight: 600;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-page">
                        ${[1, 2, 3].map(() => `
                            <div class="card-wrap">
                                <div class="print-card">
                                    <div class="card-left">
                                        <div class="card-logo-circle">
                                            <img src="${logoSrc}" alt="GlossCut" />
                                        </div>
                                        <div class="card-brand-label">GlossCut Partner</div>
                                        <div class="card-shop-name">${cleanShopName}</div>
                                        <div class="card-subtitle">Self Check-in & Booking</div>
                                        <div class="card-features">
                                            <div class="card-feature">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                <span class="card-feature-normal">support@glosscut.com</span>
                                            </div>
                                            <div class="card-feature">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                <span class="card-feature-normal">@gloss_cut</span>
                                            </div>
                                            <div class="card-feature">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                <span class="card-feature-normal">8799866811</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-right">
                                        <div class="card-qr-wrap">
                                            <img src="${qrSrc}" style="width: 195px; height: 195px;" />
                                            <div class="card-logo-overlay">
                                                <img src="${logoSrc}" alt="logo" />
                                            </div>
                                        </div>
                                        <div class="card-url">glosscut.com/checkin</div>
                                    </div>
                                    <div class="card-gold-strip"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error('PDF Error:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F4F5F7]">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F4F5F7]">
            {/* Header */}
            <View style={{ paddingTop: insets.top + 10, paddingBottom: 20, paddingHorizontal: 24 }} className="bg-white border-b border-gray-100 shadow-sm">
                <Text className="text-gray-900 text-2xl font-black">Shops Management</Text>
                <Text className="text-gray-500 text-xs font-medium mb-4">Manage Shop QR Standees</Text>

                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <Search size={18} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 text-sm"
                        placeholder="Search shops or owners..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchShops(true)} tintColor="#4F46E5" />
                }
            >
                {filteredShops.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Store size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 mt-4 font-bold">No shops found</Text>
                    </View>
                ) : (
                    filteredShops.map((shop) => (
                        <View key={shop._id} className="bg-white rounded-3xl mb-4 p-5 shadow-sm border border-gray-100">
                            <View className="flex-row items-start mb-4">
                                <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
                                    {shop.image ? (
                                        <Image source={{ uri: shop.image }} className="w-full h-full rounded-2xl" />
                                    ) : (
                                        <Store size={28} color="#4F46E5" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-black text-lg" numberOfLines={1}>{shop.name}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <User size={12} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-[10px] ml-1">{shop.owner?.name || 'Unknown Owner'}</Text>
                                    </View>
                                    <View className="flex-row items-center mt-1">
                                        <MapPin size={12} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-[10px] ml-1" numberOfLines={1}>{shop.address}</Text>
                                    </View>
                                </View>
                                    <View className={`px-2 py-1 rounded-md ${shop.approvalStatus === 'approved' ? 'bg-green-50' : 'bg-amber-50'}`}>
                                        <Text className={`text-[8px] font-black uppercase ${shop.approvalStatus === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {shop.approvalStatus}
                                        </Text>
                                    </View>
                                </View>
                                {globalSettings?.featuredShopIds?.some(s => (s._id || s) === shop._id) && (
                                    <View className="absolute top-2 right-2 bg-amber-100 p-1.5 rounded-full z-10">
                                        <Star size={14} color="#D97706" fill="#D97706" />
                                    </View>
                                )}

                            <View className="flex-row justify-between pt-4 border-t border-gray-50 flex-wrap">
                                <TouchableOpacity
                                    onPress={() => handleToggleFeatured(shop)}
                                    className={`flex-1 min-w-[120px] mr-2 py-3 rounded-2xl flex-row items-center justify-center mb-2 ${
                                        globalSettings?.featuredShopIds?.some(s => (s._id || s) === shop._id)
                                            ? 'bg-amber-50 border border-amber-100'
                                            : 'bg-gray-50 border border-gray-100'
                                    }`}
                                    disabled={togglingFeature === shop._id}
                                >
                                    {togglingFeature === shop._id ? (
                                        <ActivityIndicator size="small" color="#D97706" />
                                    ) : (
                                        <>
                                            <Star size={16} color={globalSettings?.featuredShopIds?.some(s => (s._id || s) === shop._id) ? "#D97706" : "#9CA3AF"} fill={globalSettings?.featuredShopIds?.some(s => (s._id || s) === shop._id) ? "#D97706" : "transparent"} />
                                            <Text className={`font-black text-xs ml-2 ${globalSettings?.featuredShopIds?.some(s => (s._id || s) === shop._id) ? 'text-amber-700' : 'text-gray-500'}`}>
                                                {globalSettings?.featuredShopIds?.some(s => (s._id || s) === shop._id) ? 'Featured' : 'Feature Shop'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleViewQr(shop)}
                                    className="flex-1 min-w-[120px] ml-2 bg-indigo-50 py-3 rounded-2xl flex-row items-center justify-center mb-2"
                                >
                                    <QrCode size={16} color="#4F46E5" />
                                    <Text className="text-indigo-600 font-black text-xs ml-2">View QR</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => generateAndSharePdf(shop)}
                                    className="flex-1 min-w-[120px] ml-2 bg-gray-900 py-3 rounded-2xl flex-row items-center justify-center mb-2"
                                    disabled={generatingPdf}
                                >
                                    {generatingPdf ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Printer size={16} color="#fff" />
                                            <Text className="text-white font-black text-xs ml-2">Print PDF</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleOpenLocationModal(shop)}
                                    className="w-full bg-amber-50 py-3 rounded-2xl flex-row items-center justify-center border border-amber-100"
                                >
                                    <MapPin size={16} color="#D97706" />
                                    <Text className="text-amber-700 font-black text-xs ml-2">Configure Location</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* QR Modal */}
            <Modal
                visible={showQrModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowQrModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="bg-white w-full rounded-[40px] overflow-hidden">
                        <View className="p-6 flex-row justify-between items-center border-b border-gray-100">
                            <View>
                                <Text className="text-gray-900 font-black text-xl">{selectedShop?.name}</Text>
                                <Text className="text-gray-500 text-xs">Official Display QR</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowQrModal(false)} className="bg-gray-100 p-2 rounded-full">
                                <X size={20} color="#1F2937" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-10 items-center">
                            <View className="bg-white p-6 rounded-[32px] shadow-2xl shadow-indigo-200 border border-gray-100">
                                <QRCode
                                    value={`https://glosscut.com/checkin/${selectedShop?._id}`}
                                    size={screenWidth * 0.5}
                                    color="#000"
                                    backgroundColor="white"
                                    logo={require('../../assets/images/GlossCutQr.png')}
                                    logoSize={screenWidth * 0.12}
                                    logoBackgroundColor='white'
                                    logoBorderRadius={12}
                                    getRef={(ref) => { qrRef.current = ref; }}
                                />
                            </View>

                            <Text className="text-gray-400 text-center text-xs mt-8 font-medium">
                                Position on reception or mirrors for customers to scan and check-in.
                            </Text>
                        </View>

                        <View className="px-6 pb-6">
                            <TouchableOpacity
                                onPress={() => generateAndSharePdf(selectedShop)}
                                className="bg-indigo-600 w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-300"
                                disabled={generatingPdf}
                            >
                                {generatingPdf ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Printer size={20} color="#fff" />
                                        <View className="ml-3">
                                            <Text className="text-white font-black text-base">Print Official Standee</Text>
                                            <Text className="text-indigo-200 text-[10px] font-bold">Premium 2x3 Grid A4 PDF</Text>
                                        </View>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Location Update Modal */}
            <Modal
                visible={showLocationModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-xl font-black text-gray-900">Configure Location</Text>
                                <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{selectedShop?.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowLocationModal(false)} className="bg-gray-100 p-2 rounded-full">
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 text-xs mb-6 leading-4 font-medium italic">
                            Set precise coordinates for better map routing and distance-based sorting.
                        </Text>

                        <View className="space-y-4 mb-8">
                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Latitude</Text>
                                <View className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4">
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="e.g. 19.0760"
                                        value={latitude}
                                        onChangeText={setLatitude}
                                        className="text-gray-900 font-black text-base"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Longitude</Text>
                                <View className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4">
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="e.g. 72.8777"
                                        value={longitude}
                                        onChangeText={setLongitude}
                                        className="text-gray-900 font-black text-base"
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveLocation}
                            disabled={savingLocation}
                            className="bg-indigo-600 py-5 rounded-3xl items-center shadow-lg shadow-indigo-200"
                        >
                            {savingLocation ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black uppercase tracking-widest">Update Shop Location</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
