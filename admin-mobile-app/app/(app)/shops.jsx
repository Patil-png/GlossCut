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
    X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

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

    const qrRef = useRef(null);

    const fetchShops = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const res = await axios.get('/api/admin/shops', { timeout: 10000 });
            setShops(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.msg || "Could not load shops data.");
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

    const handleViewQr = (shop) => {
        setSelectedShop(shop);
        setShowQrModal(true);
    };

    const generateAndSharePdf = async (shop) => {
        if (!shop) return;
        setGeneratingPdf(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const logoAsset = Asset.fromModule(require('../../assets/images/GlossCutQr.png'));
            await logoAsset.downloadAsync();
            const logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri || logoAsset.uri, { encoding: 'base64' });
            const logoSrc = `data:image/png;base64,${logoBase64}`;

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
            const instaIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d946ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
            const scissorIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`;

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        @page { margin: 0; size: A4; }
                        * { box-sizing: border-box; }
                        body { margin: 0; padding: 10mm; width: 210mm; height: 297mm; font-family: 'Plus Jakarta Sans', sans-serif; background: white; }
                        .grid-container { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: 15px; width: 100%; height: 100%; }
                        .standee-card { border: 2px dashed #cbd5e1; border-radius: 16px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 15px; padding-top: 20px; background: #fff; }
                        .corner-tl, .corner-tr, .corner-bl, .corner-br { position: absolute; width: 10px; height: 10px; border: 2px solid #0f172a; }
                        .corner-tl { top: -1px; left: -1px; border-right: 0; border-bottom: 0; border-top-left-radius: 14px; }
                        .corner-tr { top: -1px; right: -1px; border-left: 0; border-bottom: 0; border-top-right-radius: 14px; }
                        .corner-bl { bottom: -1px; left: -1px; border-right: 0; border-top: 0; border-bottom-left-radius: 14px; }
                        .corner-br { bottom: -1px; right: -1px; border-left: 0; border-top: 0; border-bottom-right-radius: 14px; }
                        .header { text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; }
                        .glosscut-logo { width: 35px; height: 35px; object-fit: contain; margin-bottom: 8px; }
                        .shop-title { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 2px; }
                        .sub-text { font-size: 10px; color: #64748b; font-weight: 500; }
                        .qr-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }
                        .qr-section { position: relative; padding: 8px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background: white; }
                        .qr-code { width: 110px; height: 110px; display: block; }
                        .center-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px; background: white; border-radius: 6px; padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .scan-instruction { font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; background: #f1f5f9; padding: 4px 12px; border-radius: 8px; }
                        .footer { text-align: center; width: 100%; padding-top: 8px; border-top: 1px solid #f1f5f9; }
                        .insta-pill { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
                        .insta-handle { font-size: 11px; color: #be185d; font-weight: 700; }
                        .cut-guide { position: absolute; bottom: -9px; right: -9px; background: white; padding: 2px; transform: rotate(-45deg); }
                    </style>
                </head>
                <body>
                    <div class="grid-container">
                        ${[1, 2, 3, 4, 5, 6].map(() => `
                            <div class="standee-card">
                                <div class="corner-tl"></div><div class="corner-tr"></div>
                                <div class="corner-bl"></div><div class="corner-br"></div>
                                <div class="header">
                                    <img src="${logoSrc}" class="glosscut-logo" />
                                    <div class="shop-title">${cleanShopName}</div>
                                    <div class="sub-text">Self Check-in & Booking</div>
                                </div>
                                <div class="qr-container">
                                    <div class="qr-section">
                                        <img src="${qrSrc}" class="qr-code" />
                                        <img src="${logoSrc}" class="center-logo" />
                                    </div>
                                    <div class="scan-instruction">Scan to Check-in</div>
                                </div>
                                <div class="footer">
                                    <div class="insta-pill">
                                        ${instaIcon}
                                        <span class="insta-handle">@gloss_cut</span>
                                    </div>
                                </div>
                                <div class="cut-guide">${scissorIcon}</div>
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

                            <View className="flex-row justify-between pt-4 border-t border-gray-50">
                                <TouchableOpacity
                                    onPress={() => handleViewQr(shop)}
                                    className="flex-1 mr-2 bg-indigo-50 py-3 rounded-2xl flex-row items-center justify-center"
                                >
                                    <QrCode size={16} color="#4F46E5" />
                                    <Text className="text-indigo-600 font-black text-xs ml-2">View QR</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => generateAndSharePdf(shop)}
                                    className="flex-1 ml-2 bg-gray-900 py-3 rounded-2xl flex-row items-center justify-center"
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
        </View>
    );
}
