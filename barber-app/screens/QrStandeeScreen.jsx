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
    Linking
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Share2, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const { width } = Dimensions.get('window');

const QrStandeeScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shopId, setShopId] = useState(null);
    const [shopName, setShopName] = useState('');

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

    const qrUrl = `https://glosscut.com/?source=qr&salon_id=${shopId}`;

    const handleDownload = () => {
        // In a real app, this would use Expo FileSystem/MediaLibrary to save the view as an image.
        // For now, we'll just open the URL so they can test it.
        Linking.openURL(qrUrl);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!shopId) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text style={[styles.errorText, { color: theme.colors.text }]}>Could not load Shop ID. please try again later.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { marginTop: 20, backgroundColor: theme.colors.card }]}>
                    <Text style={{ color: theme.colors.text }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
                >
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>QR Standee</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                    Place this QR code at your reception. Customers can scan it to view your salon profile and book appointments.
                </Text>

                <View style={[styles.qrContainer, { backgroundColor: '#fff' }]}>
                    <View style={styles.qrBorder}>
                        <QRCode
                            value={qrUrl}
                            size={220}
                            color="black"
                            backgroundColor="white"
                            logo={require('../assets/SetKarr.png')}
                            logoSize={50}
                            logoBackgroundColor='white'
                            logoBorderRadius={25}
                        />
                    </View>
                    <Text style={styles.scanMeText}>SCAN TO BOOK</Text>
                    <Text style={styles.shopNameText}>{shopName}</Text>
                </View>

                <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                    <LinearGradient
                        colors={['#4f46e5', '#7c3aed']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Download size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Order Standee Print</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Linking.openURL(qrUrl)} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>Test QR Link</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
    },
    description: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 40,
        lineHeight: 24,
    },
    qrContainer: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        width: width * 0.8,
    },
    qrBorder: {
        padding: 10,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 8,
        marginBottom: 16
    },
    scanMeText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
        marginBottom: 4
    },
    shopNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    downloadButton: {
        width: '100%',
        marginTop: 40,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center'
    }
});

export default QrStandeeScreen;
