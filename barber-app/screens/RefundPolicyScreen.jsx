import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
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

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                        Last Updated: February 2026
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
        padding: 20,
        paddingTop: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        marginRight: 16,
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    introText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    sectionCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 10,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionContent: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        marginTop: 20,
        marginBottom: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        opacity: 0.6,
    },
});

export default RefundPolicyScreen;
