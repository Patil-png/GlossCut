import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Linking,
    Animated,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    RefreshCcw,
    ShieldCheck,
    AlertCircle,
    Coins,
    Scale,
    ExternalLink,
    FileText,
    Lock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Section config ─────────────────────────────────────────────────────────
const SECTIONS = [
    {
        number: '01',
        title: 'Aggregator Role',
        icon: ShieldCheck,
        accent: '#6366F1',
        bg: '#EEF2FF',
        darkBg: '#1E1B4B',
        content:
            "GlossCut acts strictly as a technology aggregator connecting customers with service providers (barbers/salons). We do not directly provide salon services and are not responsible for the service quality provided by individual shops.",
    },
    {
        number: '02',
        title: 'Cancellation Policy',
        icon: AlertCircle,
        accent: '#F59E0B',
        bg: '#FFFBEB',
        darkBg: '#2D1F00',
        content:
            "Appointments can be cancelled up to 2 hours before the scheduled time. Cancellations made within shorter windows may be subject to a cancellation fee as determined by the specific vendor.",
    },
    {
        number: '03',
        title: 'Refund as GlossCut Coins',
        icon: RefreshCcw,
        accent: '#10B981',
        bg: '#ECFDF5',
        darkBg: '#022C22',
        content:
            "GlossCut operates on a 'No Cash Refund' policy. In the event of a valid issue, authorized refunds will be issued exclusively in the form of GlossCut Coins. These coins can be used for future bookings and have no monetary value outside the GlossCut platform.",
    },
    {
        number: '04',
        title: 'Dispute Resolution',
        icon: Scale,
        accent: '#EF4444',
        bg: '#FEF2F2',
        darkBg: '#2D0A0A',
        content:
            "Any disputes regarding service quality must be settled directly with the shop owner. GlossCut will facilitate communication but cannot guarantee cash compensation for service-related grievances.",
    },
];

// ─── Animated Section Card ────────────────────────────────────────────────────
const SectionCard = ({ section, index, isDark }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 120,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay: index * 120,
                tension: 60,
                friction: 9,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const IconComp = section.icon;
    const cardBg = isDark ? section.darkBg : section.bg;

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    backgroundColor: cardBg,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    borderLeftColor: section.accent,
                },
            ]}
        >
            {/* Top row */}
            <View style={styles.cardTop}>
                <View style={[styles.iconBubble, { backgroundColor: section.accent + '22' }]}>
                    <IconComp size={22} color={section.accent} strokeWidth={2} />
                </View>
                <View style={styles.cardTopText}>
                    <Text style={[styles.cardNumber, { color: section.accent }]}>{section.number}</Text>
                    <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                        {section.title}
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View style={[styles.cardDivider, { backgroundColor: section.accent + '30' }]} />

            {/* Content */}
            <Text style={[styles.cardContent, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                {section.content}
            </Text>
        </Animated.View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const RefundPolicyScreen = () => {
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const headerFade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* ── GRADIENT HERO HEADER ── */}
            <LinearGradient
                colors={isDark ? ['#1E1B4B', '#312E81'] : ['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroGradient, { paddingTop: insets.top + (Platform.OS === 'android' ? 30 : 10) }]}
            >
                <Animated.View style={{ opacity: headerFade }}>
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Title block */}
                    <View style={styles.heroTextBlock}>
                        <View style={styles.heroBadge}>
                            <FileText size={13} color="#C7D2FE" strokeWidth={2} />
                            <Text style={styles.heroBadgeText}>LEGAL DOCUMENT</Text>
                        </View>
                        <Text style={styles.heroTitle}>Refund Policy</Text>
                        <Text style={styles.heroSubtitle}>
                            Please read our Refund and Cancellation policies carefully.{'\n'}
                            By using GlossCut, you agree to these terms.
                        </Text>
                    </View>

                    {/* Decorative circles */}
                    <View style={styles.circleTopRight} />
                    <View style={styles.circleBottomLeft} />
                </Animated.View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >

                {/* ── NO CASH REFUND HIGHLIGHT BANNER ── */}
                <View style={[styles.banner, { backgroundColor: isDark ? '#2D1F00' : '#FFF7ED', borderColor: '#F59E0B' }]}>
                    <View style={[styles.bannerIconBox, { backgroundColor: '#F59E0B22' }]}>
                        <Coins size={20} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.bannerTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                            No Cash Refund Policy
                        </Text>
                        <Text style={[styles.bannerBody, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                            All valid refunds are issued exclusively as GlossCut Coins.
                        </Text>
                    </View>
                </View>

                {/* ── SECTION CARDS ── */}
                {SECTIONS.map((section, index) => (
                    <SectionCard key={index} section={section} index={index} isDark={isDark} />
                ))}

                {/* ── LEGAL LINKS ── */}
                <View style={styles.legalSection}>
                    <View style={styles.legalTitleRow}>
                        <Lock size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                        <Text style={[styles.legalSectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Legal Resources
                        </Text>
                    </View>

                    <View style={styles.legalRow}>
                        <TouchableOpacity
                            style={[styles.legalCard, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                            onPress={() => Linking.openURL('https://www.glosscut.com/privacy')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.legalCardTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                                Privacy Policy
                            </Text>
                            <View style={[styles.legalCardPill, { backgroundColor: '#6366F1' + '18' }]}>
                                <ExternalLink size={12} color="#6366F1" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.legalCard, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                            onPress={() => Linking.openURL('https://www.glosscut.com/terms')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.legalCardTitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                                Terms & Conditions
                            </Text>
                            <View style={[styles.legalCardPill, { backgroundColor: '#6366F1' + '18' }]}>
                                <ExternalLink size={12} color="#6366F1" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── FOOTER ── */}
                <View style={styles.footer}>
                    <View style={[styles.footerDot, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />
                    <Text style={[styles.footerText, { color: isDark ? '#475569' : '#94A3B8' }]}>
                        Last Updated: 07 February 2026
                    </Text>
                    <View style={[styles.footerDot, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />
                </View>
            </ScrollView>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    // Hero
    heroGradient: {
        paddingHorizontal: 24,
        paddingBottom: 36,
        overflow: 'hidden',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroTextBlock: {
        paddingBottom: 4,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 12,
        gap: 6,
    },
    heroBadgeText: {
        color: '#C7D2FE',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 22,
        fontWeight: '400',
    },
    // Decorative circles
    circleTopRight: {
        position: 'absolute',
        top: -20,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    circleBottomLeft: {
        position: 'absolute',
        bottom: -60,
        left: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // Scroll
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },

    // Banner
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        marginBottom: 28,
    },
    bannerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    bannerBody: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18,
    },

    // Section cards
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 14,
    },
    iconBubble: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTopText: {
        flex: 1,
    },
    cardNumber: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    cardDivider: {
        height: 1,
        borderRadius: 1,
        marginBottom: 14,
    },
    cardContent: {
        fontSize: 14,
        lineHeight: 23,
        fontWeight: '400',
    },

    // Legal
    legalSection: {
        marginTop: 12,
        marginBottom: 10,
    },
    legalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    legalSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    legalRow: {
        flexDirection: 'row',
        gap: 12,
    },
    legalCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    legalCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    legalCardPill: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 30,
        paddingTop: 20,
    },
    footerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default RefundPolicyScreen;
