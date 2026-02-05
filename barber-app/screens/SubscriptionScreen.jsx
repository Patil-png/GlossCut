import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    CreditCard,
    CheckCircle2,
    ShieldCheck,
    Zap,
    ChevronRight,
    ArrowLeft,
    XCircle,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import RazorpayCheckout from "react-native-razorpay";

const { width } = Dimensions.get("window");

const SubscriptionScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user, setUser } = useAuth();
    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get("/api/subscription/plans");
            setPlans(res.data);
            if (res.data.length > 0) {
                setSelectedPlan(res.data[0]);
            }
        } catch (err) {
            console.error("Error fetching plans:", err);
            Alert.alert("Error", "Could not fetch subscription plans.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!selectedPlan) return;

        setProcessing(true);
        try {
            const orderRes = await api.post("/api/subscription/order", {
                planId: selectedPlan._id,
            });

            const options = {
                description: `Subscription: ${selectedPlan.name}`,
                image: "https://glosscut.com/logo.png", // Replace with real logo
                currency: "INR",
                key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || "rzp_test_YOUR_KEY",
                amount: orderRes.data.amount,
                name: "SetKarr Barber Subscription",
                order_id: orderRes.data.id,
                prefill: {
                    email: user.email,
                    contact: user.phone,
                    name: user.name,
                },
                theme: { color: theme.colors.primary },
            };

            RazorpayCheckout.open(options)
                .then(async (data) => {
                    // Verify payment
                    try {
                        const verifyRes = await api.post("/api/subscription/verify", {
                            razorpay_order_id: data.razorpay_order_id,
                            razorpay_payment_id: data.razorpay_payment_id,
                            razorpay_signature: data.razorpay_signature,
                        });

                        if (verifyRes.data.success) {
                            Alert.alert("Success", "Subscription activated successfully!");
                            // Update local user state
                            setUser({
                                ...user,
                                subscriptionStatus: "active",
                                subscriptionExpiry: verifyRes.data.subscription.endDate,
                            });
                            navigation.goBack();
                        }
                    } catch (err) {
                        console.error("Verification failed:", err);
                        Alert.alert("Error", "Payment verification failed. Please contact support.");
                    }
                })
                .catch((error) => {
                    console.log("Payment failed or cancelled:", error);
                    if (error.code !== 2) { // 2 is usually user cancelled
                        Alert.alert("Payment Failed", error.description || "The payment could not be processed.");
                    }
                });
        } catch (err) {
            console.error("Order creation failed:", err);
            Alert.alert("Error", "Could not initiate payment.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: "center" }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Subscription</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introBox}>
                    <Zap size={48} color={theme.colors.primary} style={styles.zapIcon} />
                    <Text style={[styles.title, { color: theme.colors.text }]}>Unlock Your Growth</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Get detailed earnings analytics and get listed on the explore map to reach more customers.
                    </Text>
                </View>

                {plans.map((plan) => (
                    <TouchableOpacity
                        key={plan._id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedPlan(plan)}
                        style={[
                            styles.planCard,
                            {
                                backgroundColor: theme.colors.card,
                                borderColor: selectedPlan?._id === plan._id ? theme.colors.primary : "transparent",
                                borderWidth: 2,
                            },
                        ]}
                    >
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={[styles.planName, { color: theme.colors.text }]}>{plan.name}</Text>
                                <Text style={[styles.planDuration, { color: theme.colors.textSecondary }]}>{plan.durationDays} Days</Text>
                            </View>
                            <Text style={[styles.planPrice, { color: theme.colors.primary }]}>₹{plan.price}</Text>
                        </View>

                        <View style={styles.featuresList}>
                            {plan.features?.map((feature, idx) => (
                                <View key={idx} style={styles.featureItem}>
                                    <CheckCircle2 size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        {selectedPlan?._id === plan._id && (
                            <View style={styles.selectedBadge}>
                                <ShieldCheck size={14} color="#FFF" />
                                <Text style={styles.selectedBadgeText}>Selected</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={styles.securityNote}>
                    <ShieldCheck size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
                        Secure payment via Razorpay. All data is encrypted.
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    onPress={handleSubscribe}
                    disabled={processing || !selectedPlan}
                    style={[styles.subscribeBtn, { backgroundColor: theme.colors.primary, opacity: processing ? 0.7 : 1 }]}
                >
                    {processing ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
                            <ChevronRight size={20} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    backBtn: {
        padding: 8,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introBox: {
        alignItems: "center",
        marginBottom: 30,
        marginTop: 10,
    },
    zapIcon: {
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    planCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    planHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    planName: {
        fontSize: 20,
        fontWeight: "700",
    },
    planDuration: {
        fontSize: 14,
        marginTop: 2,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: "800",
    },
    featuresList: {
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        paddingTop: 15,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    featureText: {
        fontSize: 14,
    },
    selectedBadge: {
        position: "absolute",
        top: -12,
        right: 20,
        backgroundColor: "#007AFF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    selectedBadgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "700",
        marginLeft: 4,
    },
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    securityText: {
        fontSize: 12,
        marginLeft: 6,
    },
    footer: {
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        paddingTop: 15,
    },
    subscribeBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    subscribeBtnText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "700",
        marginRight: 8,
    },
});

export default SubscriptionScreen;
