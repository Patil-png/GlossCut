import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Bell, TestTube, Users, DollarSign, Calendar, MessageCircle } from 'lucide-react-native';

/**
 * Notification Testing Screen
 * Test all notification types and deep linking
 */
const NotificationTestScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const testNotification = async (type, config) => {
        setLoading(true);
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                    data: config.data,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    vibrate: [0, 250, 250, 250],
                    channelId: config.channelId || 'default',
                },
                trigger: null, // Immediate
            });

            Alert.alert('✅ Sent!', 'Notification scheduled. Check your notification tray!');
        } catch (error) {
            Alert.alert('❌ Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const tests = [
        {
            id: 'booking',
            icon: Calendar,
            title: 'New Booking',
            description: 'Test booking notification',
            color: '#10B981',
            config: {
                title: '💈 New Booking!',
                body: 'Rahul Kumar booked Haircut & Shave at 3:00 PM',
                data: { type: 'booking_new', bookingId: '123' },
                channelId: 'high_priority',
            },
        },
        {
            id: 'queue',
            icon: Users,
            title: 'Queue Update',
            description: 'Customer joined queue',
            color: '#3B82F6',
            config: {
                title: '👥 Customer in Queue',
                body: 'Amit Sharma joined the queue (Position 3)',
                data: { type: 'queue_joined', customerId: '456' },
                channelId: 'high_priority',
            },
        },
        {
            id: 'payment',
            icon: DollarSign,
            title: 'Payment Received',
            description: 'Test payment notification',
            color: '#8B5CF6',
            config: {
                title: '💰 Payment Received',
                body: 'You received ₹350 from Vikram Mehta',
                data: { type: 'payment_received', paymentId: '789' },
                channelId: 'high_priority',
            },
        },
        {
            id: 'message',
            icon: MessageCircle,
            title: 'Customer Message',
            description: 'Test chat notification',
            color: '#F59E0B',
            config: {
                title: '💬 New Message',
                body: 'Ravi: Can I reschedule my appointment?',
                data: { type: 'customer_message', customerId: '101' },
                channelId: 'default',
            },
        },
        {
            id: 'subscription',
            icon: Bell,
            title: 'Subscription Alert',
            description: 'Test low priority',
            color: '#EF4444',
            config: {
                title: '⚠️ Subscription Expiring',
                body: 'Your premium plan expires in 3 days',
                data: { type: 'subscription_expiring' },
                channelId: 'low_priority',
            },
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TestTube size={32} color="#231F7C" />
                <Text style={styles.headerTitle}>Notification Testing</Text>
                <Text style={styles.headerSubtitle}>
                    Test notifications in all app states
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>🧪 How to Test</Text>
                    <Text style={styles.infoText}>
                        1. Tap any notification below{'\n'}
                        2. Minimize the app or close it completely{'\n'}
                        3. Check your notification tray{'\n'}
                        4. Tap the notification to test deep linking
                    </Text>
                </View>

                {tests.map((test) => {
                    const Icon = test.icon;
                    return (
                        <TouchableOpacity
                            key={test.id}
                            style={[styles.testCard, { borderLeftColor: test.color }]}
                            onPress={() => testNotification(test.id, test.config)}
                            disabled={loading}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: test.color + '20' }]}>
                                <Icon size={24} color={test.color} />
                            </View>
                            <View style={styles.testContent}>
                                <Text style={styles.testTitle}>{test.title}</Text>
                                <Text style={styles.testDescription}>{test.description}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: test.color }]}>
                                <Text style={styles.badgeText}>Test</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View style={styles.bottomSpace} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    scrollContent: {
        padding: 16,
    },
    infoCard: {
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#312E81',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#4C1D95',
        lineHeight: 22,
    },
    testCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    testContent: {
        flex: 1,
    },
    testTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    testDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    bottomSpace: {
        height: 40,
    },
});

export default NotificationTestScreen;
