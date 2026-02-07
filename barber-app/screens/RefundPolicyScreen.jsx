import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, RefreshCcw, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const RefundPolicyScreen = () => {
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();

    const sections = [
        {
            title: "1. Aggregator Role",
            icon: ShieldCheck,
            content: "GlossCut acts strictly as a technology aggregator connecting customers with service providers (barbers/salons). We do not directly provide salon services and are not responsible for the service quality provided by individual shops."
        },
        {
            title: "2. Cancellation Policy",
            icon: AlertCircle,
            content: "Appointments can be cancelled up to 2 hours before the scheduled time. Cancellations made within shorter windows may be subject to a cancellation fee as determined by the specific vendor."
        },
        {
            title: "3. Refund as GlossCut Coins",
            icon: RefreshCcw,
            content: "GlossCut operates on a 'No Cash Refund' policy. In the event of a valid issue, authorized refunds will be issued exclusively in the form of GlossCut Coins. These coins can be used for future bookings and have no monetary value outside the GlossCut platform."
        },
        {
            title: "4. Dispute Resolution",
            icon: AlertCircle,
            content: "Any disputes regarding service quality must be settled directly with the shop owner. GlossCut will facilitate communication but cannot guarantee cash compensation for service-related grievances."
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                >
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Refund Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
                    Please read our Refund and Cancellation policies carefully. By using GlossCut, you agree to these terms.
                </Text>

                {sections.map((section, index) => (
                    <View
                        key={index}
                        style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '40' }]}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                                <section.icon size={20} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
                        </View>
                        <Text style={[styles.sectionContent, { color: theme.colors.textSecondary }]}>
                            {section.content}
                        </Text>
                    </View>
                ))}

                <View style={[styles.legalContainer, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.legalHeader, { color: theme.colors.text }]}>Legal Resources</Text>
                    <View style={styles.legalLinks}>
                        <TouchableOpacity
                            style={[styles.legalButton, { backgroundColor: theme.colors.card }]}
                            onPress={() => Linking.openURL('https://www.glosscut.com/privacy')}
                        >
                            <Text style={[styles.legalButtonText, { color: theme.colors.primary }]}>Privacy Policy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.legalButton, { backgroundColor: theme.colors.card }]}
                            onPress={() => Linking.openURL('https://www.glosscut.com/terms')}
                        >
                            <Text style={[styles.legalButtonText, { color: theme.colors.primary }]}>Terms & Conditions</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                        Last Updated: 07 February 2026
                    </Text>
                </View>
            </ScrollView>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16, // Extra safe area for Android StatusBar
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        // Soft Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 10,
        paddingBottom: 60,
    },
    introText: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 30,
        fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
        opacity: 0.8,
    },
    sectionCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        // Modern Card Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-bold',
        flex: 1,
    },
    sectionContent: {
        fontSize: 15,
        lineHeight: 24,
        fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
        opacity: 0.9,
    },
    footer: {
        marginTop: 30,
        marginBottom: 50,
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.5,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    legalContainer: {
        marginTop: 10,
        marginBottom: 20,
        paddingTop: 24,
        borderTopWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    legalHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-bold',
    },
    legalLinks: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    legalButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    legalButtonText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    },
});

export default RefundPolicyScreen;
