import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Alert,
    Platform
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Printer, ScanLine } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const QrStandeeScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shopId, setShopId] = useState(null);
    const [shopName, setShopName] = useState('');
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        fetchShopDetails();
    }, []);

    const fetchShopDetails = async () => {
        try {
            const res = await api.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`);
            if (res.status === 200 && res.data) {
                setShopId(res.data._id);
                setShopName(res.data.name);
            }
        } catch (e) {
            console.log('Failed to fetch shop details', e);
        } finally {
            setLoading(false);
        }
    };

    const qrData = `https://glosscut.com/checkin/${shopId}`;
    const qrImageApi = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=20&data=${encodeURIComponent(qrData)}`;

    const generateAndSharePdf = async () => {
        if (!shopId) return;
        setGeneratingPdf(true);

        try {
            // Load Logo as Base64
            const asset = Asset.fromModule(require('../assets/GlossCutQr.png'));
            await asset.downloadAsync();
            const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, { encoding: 'base64' });
            const logoSrc = `data:image/png;base64,${logoBase64}`;

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            margin: 0; padding: 0;
                            background-color: #fff;
                            display: flex; flex-direction: column;
                            align-items: center; justify-content: center;
                            height: 100vh; text-align: center;
                            border: 20px solid #4f46e5; box-sizing: border-box;
                        }
                        .container { width: 85%; max-width: 600px; }
                        .logo {
                            font-size: 18px; font-weight: 800; color: #4f46e5;
                            text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px;
                        }
                        .title {
                            font-size: 36px; margin-bottom: 10px; color: #1f2937;
                        }
                        .subtitle {
                            font-size: 28px; color: #666; margin-top: 15px; font-weight: 500;
                        }
                        
                        /* PINTEREST STYLE PDF */
                        .card {
                            background-color: #4f46e5;
                            border-radius: 40px;
                            padding: 40px;
                            display: inline-block;
                            box-shadow: 0 20px 40px rgba(79, 70, 229, 0.3);
                        }
                        .qr-box {
                            background: white;
                            border-radius: 30px;
                            padding: 30px;
                            margin-bottom: 30px;
                            position: relative; /* For absolute positioning of logo */
                        }
                        .qr-code {
                            width: 400px;
                            height: 400px;
                            object-fit: contain;
                        }
                        .qr-logo {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 90px;
                            height: 90px;
                            border-radius: 50%;
                            background: white;
                            border: 8px solid white;
                            object-fit: contain;
                        }
                        .scan-label {
                            color: white;
                            font-size: 60px;
                            font-weight: 900;
                            margin-top: 10px;
                            letter-spacing: 2px;
                            font-family: sans-serif;
                        }

                        .footer {
                            font-size: 16px; color: #999; margin-top: 60px; font-weight: 600;
                        }
                        .shop-name { color: #4f46e5; font-weight: 800; font-size: 24px; display:block; margin-top:10px;}
                        .shop-name { color: #4f46e5; font-weight: 800; font-size: 24px; display:block; margin-top:10px;}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">GlossCut Partner</div>
                        
                        <div class="card">
                            <div class="qr-box">
                                 <img src="${qrImageApi}" class="qr-code" />
                                 <img src="${logoSrc}" class="qr-logo" />
                            </div>
                            <div class="scan-label" style="font-size: 40px;">SCAN ME</div>
                        </div>

                        <div class="footer">
                            Official Booking Partner for <span class="shop-name">${shopName}</span>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error('PDF Generation Error:', error);
            Alert.alert('Error', 'Could not generate PDF.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!shopId) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background, padding: 20 }]}>
                <Text style={{ color: theme.colors.text }}>Could not load Shop Details.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: theme.colors.card }]}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>QR Standee</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                    Preview your reception standee.{"\n"}Download to print high-quality PDF.
                </Text>

                {/* --- PINTEREST/RED CARD STYLE PREVIEW --- */}
                <View style={styles.cardContainer}>
                    {/* The Card Body */}
                    <View style={[styles.pinterestCard, { backgroundColor: '#4f46e5' }]}>
                        {/* QR Box (White) */}
                        <View style={styles.whiteQrBox}>
                            <QRCode
                                value={qrData}
                                size={220}
                                color="#000" // Standard black for contrast
                                backgroundColor="white"
                                quietZone={5}
                                logo={require('../assets/GlossCutQr.png')}
                                logoSize={60}
                                logoBackgroundColor='white'
                                logoBorderRadius={30}
                            />
                        </View>

                        {/* Bottom Label inside the card */}
                        <View style={styles.scanMeContainer}>
                            <Text style={styles.scanMeText}>SCAN ME</Text>
                        </View>
                    </View>

                    {/* Tagline Below Card */}
                    <View style={styles.taglineContainer}>
                        <Text style={styles.taglineText}>
                            "Sab sochenge teri koi 'Setting' hai bhaari,{"\n"}
                            Tu bas Scan kar, yehi hai asli Samajhdari!" 🧠⚡
                        </Text>
                    </View>

                    {/* Footer Info (Outside Card) */}
                    <View style={styles.previewFooterOuter}>
                        <Text style={styles.shopNameText}>{shopName}</Text>
                        <Text style={styles.poweredByText}>Powered by GlossCut</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={generateAndSharePdf}
                    style={styles.downloadButton}
                    disabled={generatingPdf}
                >
                    <LinearGradient
                        colors={['#4f46e5', '#7c3aed']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {generatingPdf ? (
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                        ) : (
                            <Printer size={20} color="#fff" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.buttonText}>
                            {generatingPdf ? 'Generating PDF...' : 'Download PDF Standee'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 0
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15,
    },
    iconButton: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        elevation: 2, shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1, alignItems: 'center', padding: 24 },
    description: { textAlign: 'center', fontSize: 14, marginBottom: 30, lineHeight: 20 },

    // --- PINTEREST STYLE CARD ---
    cardContainer: {
        alignItems: 'center',
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    pinterestCard: {
        width: 340,
        borderRadius: 30,
        padding: 25,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 30,
        // Height is auto
    },
    whiteQrBox: {
        width: 280,
        height: 280,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25
    },
    scanMeContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)', // Slight frame or can be just text
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    scanMeText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black'
    },
    taglineContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
        alignItems: 'center'
    },
    taglineText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4f46e5',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 22
    },

    // Outer Footer
    previewFooterOuter: { alignItems: 'center', marginTop: 30 },
    shopNameText: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
    poweredByText: { fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },

    // Button
    downloadButton: {
        width: '100%', marginTop: 40, borderRadius: 16,
        overflow: 'hidden', elevation: 4,
        shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },
    gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default QrStandeeScreen;