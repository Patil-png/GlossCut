import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Alert,
    Platform,
    Animated,
    Easing
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Printer, Download } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QrStandeeScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [shopId, setShopId] = useState(null);
    const [shopName, setShopName] = useState('');
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    // Ref to capture the on-screen QR code as base64 for the PDF
    const qrRef = useRef(null);

    useEffect(() => {
        fetchShopDetails();

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -15, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
            ])
        ).start();
    }, []);

    const fetchShopDetails = async () => {
        try {
            const res = await api.get('/api/shop/my-shop');
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
    const qrImageApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(qrData)}`;

    const generateAndSharePdf = async () => {
        if (!shopId) return;
        setGeneratingPdf(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const asset = Asset.fromModule(require('../assets/GlossCutQr.png'));
            await asset.downloadAsync();
            const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, { encoding: 'base64' });
            const logoSrc = `data:image/png;base64,${logoBase64}`;

            // Capture the on-screen QR code (value = https://glosscut.com/checkin/${shopId})
            // as a base64 PNG so it embeds reliably in the PDF — no external network call needed.
            const qrSrc = await new Promise((resolve, reject) => {
                if (!qrRef.current) {
                    reject(new Error('QR ref not ready'));
                    return;
                }
                qrRef.current.toDataURL((data) => {
                    resolve(`data:image/png;base64,${data}`);
                });
            });

            // Clean Shop Name (Remove @ if present)
            const cleanShopName = shopName.replace(/^@/, '').trim();

            // Icons
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
                        
                        body {
                            margin: 0;
                            padding: 10mm;
                            width: 210mm;
                            height: 297mm;
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            background: white;
                        }

                        .grid-container {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            grid-template-rows: repeat(3, 1fr);
                            gap: 15px;
                            width: 100%;
                            height: 100%; /* Fill the page */
                        }

                        .standee-card {
                            border: 2px dashed #cbd5e1;
                            border-radius: 16px;
                            position: relative;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: space-between;
                            padding: 15px;
                            padding-top: 20px;
                            background: #fff;
                        }

                        /* Decorative Corners */
                        .corner-tl, .corner-tr, .corner-bl, .corner-br {
                            position: absolute;
                            width: 10px; height: 10px;
                            border: 2px solid #0f172a;
                        }
                        .corner-tl { top: -1px; left: -1px; border-right: 0; border-bottom: 0; border-top-left-radius: 14px; }
                        .corner-tr { top: -1px; right: -1px; border-left: 0; border-bottom: 0; border-top-right-radius: 14px; }
                        .corner-bl { bottom: -1px; left: -1px; border-right: 0; border-top: 0; border-bottom-left-radius: 14px; }
                        .corner-br { bottom: -1px; right: -1px; border-left: 0; border-top: 0; border-bottom-right-radius: 14px; }

                        /* Header */
                        .header {
                            text-align: center;
                            width: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }

                        .glosscut-logo {
                            width: 35px;
                            height: 35px;
                            object-fit: contain;
                            margin-bottom: 8px;
                        }

                        .shop-title {
                            font-size: 18px;
                            font-weight: 800;
                            color: #0f172a;
                            text-transform: uppercase;
                            letter-spacing: -0.5px;
                            line-height: 1.1;
                            margin-bottom: 2px;
                        }

                        .sub-text {
                            font-size: 10px;
                            color: #64748b;
                            font-weight: 500;
                        }

                        /* QR Section */
                        .qr-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 10px;
                        }

                        .qr-section {
                            position: relative;
                            padding: 8px;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                            background: white;
                        }

                        .qr-code {
                            width: 110px;
                            height: 110px;
                            display: block;
                        }

                        .center-logo {
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 28px; height: 28px;
                            background: white;
                            border-radius: 6px;
                            padding: 2px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }

                        .scan-instruction {
                            font-size: 11px;
                            font-weight: 700;
                            color: #0f172a;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            background: #f1f5f9;
                            padding: 4px 12px;
                            border-radius: 8px;
                        }

                        /* Footer */
                        .footer {
                            text-align: center;
                            width: 100%;
                            padding-top: 8px;
                            border-top: 1px solid #f1f5f9;
                        }

                        .insta-pill {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        }

                        .insta-handle {
                            font-size: 11px;
                            color: #be185d;
                            font-weight: 700;
                        }

                        .cut-guide {
                            position: absolute;
                            bottom: -9px;
                            right: -9px;
                            background: white;
                            padding: 2px;
                            transform: rotate(-45deg);
                        }

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
            console.error('PDF Generation Error:', error);
            Alert.alert('Error', 'Could not generate premium standee PDF.');
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

    // --- RENDER COMPONENT ---
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <LinearGradient colors={isDark ? ['#0f172a', '#020617'] : ['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: theme.colors.card }]}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Reception Standee</Text>
                <View style={{ width: 44 }} />
            </View>

            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                showsVerticalScrollIndicator={false}
            >
                {/* PREVIEW CARD (Visual Only) */}
                <Animated.View style={[styles.previewContainer, { transform: [{ translateY: floatAnim }] }]}>
                    <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.premiumCard}>
                        <View style={styles.premiumBorderInner}>
                            <View style={styles.cardBranding}>
                                {/* Updated Preview to match PDF roughly */}
                                <Text style={styles.brandingText}>GLOSSCUT PARTNER</Text>
                                <View style={styles.brandingLine} />
                            </View>

                            <View style={styles.qrGlassBox}>
                                <View style={styles.qrWhiteFrame}>
                                    <QRCode
                                        value={qrData}
                                        size={220}
                                        color="#000"
                                        backgroundColor="white"
                                        logo={require('../assets/GlossCutQr.png')}
                                        logoSize={55}
                                        logoBackgroundColor='white'
                                        logoBorderRadius={12}
                                        getRef={(ref) => { qrRef.current = ref; }}
                                    />
                                </View>
                            </View>

                            <View style={styles.shopBranding}>
                                <Text style={styles.shopInText}>FOR YOUR BEST EXPERIENCE AT</Text>
                                <Text style={styles.shopTitleText}>{shopName ? shopName.replace(/^@/, '').trim() : 'YOUR SHOP NAME'}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                    <View style={styles.cardShadow} />
                </Animated.View>

                {/* Print Action */}
                <View style={styles.actionSection}>
                    <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>PREMIUM PRINT READY</Text>
                    <TouchableOpacity onPress={generateAndSharePdf} style={styles.actionButton} activeOpacity={0.8} disabled={generatingPdf}>
                        <LinearGradient colors={['#4f46e5', '#3730a3']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            {generatingPdf ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Printer size={20} color="#fff" strokeWidth={2.5} />
                                    <View style={styles.buttonTextContainer}>
                                        <Text style={styles.buttonTitle}>Print Official Standee</Text>
                                        <Text style={styles.buttonDesc}>High-quality A4 PDF (6 Cards)</Text>
                                    </View>
                                    <Download size={20} color="rgba(255,255,255,0.5)" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.tipCard}>
                    <Text style={styles.tipText}>
                        <Text style={{ fontWeight: 'bold' }}>Pro Tip:</Text> Cut along the dashed lines. Place them on mirrors or reception desks for easy customer check-in!
                    </Text>
                </View>
                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 30 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, zIndex: 10 },
    iconButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    previewContainer: { marginTop: 40, alignItems: 'center', position: 'relative' },
    premiumCard: { width: 320, height: 480, borderRadius: 40, padding: 4, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 20 },
    premiumBorderInner: { flex: 1, borderRadius: 36, padding: 24, alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)' },
    cardShadow: { position: 'absolute', bottom: -20, width: 200, height: 15, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 100, transform: [{ scaleX: 1.2 }] },
    cardBranding: { alignItems: 'center', marginTop: 10 },
    brandingText: { color: 'white', fontSize: 12, fontWeight: '800', letterSpacing: 3, opacity: 0.6 },
    brandingLine: { width: 40, height: 2, backgroundColor: '#fbcb0d', marginTop: 8, borderRadius: 1 },
    qrGlassBox: { alignItems: 'center', width: '100%' },
    qrWhiteFrame: { padding: 25, backgroundColor: '#fff', borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
    shopBranding: { alignItems: 'center', marginBottom: 20, width: '100%' },
    shopInText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
    shopTitleText: { color: '#fbcb0d', fontSize: 24, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
    actionSection: { marginTop: 40, width: '100%' },
    actionLabel: { fontSize: 12, fontWeight: '800', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
    actionButton: { width: '100%', marginBottom: 16 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', padding: 22, borderRadius: 24, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    buttonTextContainer: { flex: 1, paddingHorizontal: 16 },
    buttonTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    buttonDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, fontWeight: '500' },
    tipCard: { marginTop: 30, padding: 20, borderRadius: 20, backgroundColor: 'rgba(124, 58, 237, 0.05)', borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.1)' },
    tipText: { color: '#4f46e5', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});

export default QrStandeeScreen;