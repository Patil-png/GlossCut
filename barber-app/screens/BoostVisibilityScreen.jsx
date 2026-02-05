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
    Platform,
    StatusBar,
    SafeAreaView,
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
    Star,
    Clock,
    MapPin,
    Store,
    Phone,
    Tag,
    Megaphone,
    Navigation,
    Hash,
    CheckCircle,
    Lock,
    AlertCircle,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import RazorpayCheckout from "react-native-razorpay";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import MapView from "react-native-maps";

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 44;

// --- HELPER COMPONENTS ---
const SectionHeader = ({ title, theme }) => (
    <View style={styles.sectionHeaderContainer}>
        <Text style={[styles.sectionHeaderTitle, { color: theme.colors.text }]}>
            {title}
        </Text>
        <View
            style={[
                styles.sectionHeaderLine,
                { backgroundColor: theme.colors.border },
            ]}
        />
    </View>
);

const InfoRow = ({
    icon: Icon,
    label,
    value,
    theme,
    onPress,
    canEdit = true,
    isLast,
}) => (
    <TouchableOpacity
        style={[
            styles.modernInfoRow,
            !isLast && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border + "20",
            },
        ]}
        onPress={canEdit ? onPress : undefined}
        activeOpacity={canEdit ? 0.6 : 1}
    >
        <View
            style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.iconBackground },
            ]}
        >
            <Icon size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                {label}
            </Text>
            <Text
                style={[styles.infoValue, { color: theme.colors.text }]}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
        {canEdit && (
            <View
                style={[
                    styles.actionIcon,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <ChevronRight size={16} color={theme.colors.textSecondary} />
            </View>
        )}
    </TouchableOpacity>
);

const BoostVisibilityScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user, setUser, isMainOwner } = useAuth();
    const isSubscribed = user?.isSubscribed || user?.subscriptionStatus === 'active';
    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [shopData, setShopData] = useState(null);
    const [region, setRegion] = useState(null);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    // Custom Alert State
    const [customAlert, setCustomAlert] = useState({ visible: false, title: "", message: "" });
    const alertAnim = React.useRef(new Animated.Value(-100)).current;

    const showCustomAlert = (title, message) => {
        setCustomAlert({ visible: true, title, message });
        Animated.spring(alertAnim, {
            toValue: insets.top + 20,
            useNativeDriver: true,
            tension: 50,
            friction: 8
        }).start();

        setTimeout(() => {
            Animated.timing(alertAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true
            }).start(() => setCustomAlert({ ...customAlert, visible: false }));
        }, 3000);
    };

    useEffect(() => {
        fetchPlans();
        fetchShopData();
    }, []);

    useEffect(() => {
        let interval;
        if (isSubscribed && user?.subscriptionExpiry) {
            const calculateTime = () => {
                const now = new Date();
                const expiry = new Date(user.subscriptionExpiry);
                const diff = expiry - now;

                if (diff <= 0) {
                    setTimeLeft("Expired");
                    // Trigger refresh to lock UI if it just expired while looking
                    if (isSubscribed) fetchShopData();
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);

                if (hours > 24) {
                    setTimeLeft(`${Math.floor(hours / 24)} days left`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${mins}m left`);
                } else {
                    setTimeLeft(`${mins}m ${secs}s remaining`);
                }
            };

            calculateTime();
            interval = setInterval(calculateTime, 1000);
        }
        return () => clearInterval(interval);
    }, [isSubscribed, user?.subscriptionExpiry]);

    const fetchShopData = async () => {
        try {
            const res = await api.get("/api/shop/my-shop");
            setShopData(res.data);
            setLocationConfirmed(!!res.data?.location?.coordinates);
        } catch (err) {
            console.error("Error fetching shop data:", err);
        }
    };

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

    const handleTestActivate = async () => {
        if (!selectedPlan) return;

        setProcessing(true);
        try {
            const res = await api.post("/api/subscription/test-activate", {
                planId: selectedPlan._id,
            });

            if (res.data.success) {
                Alert.alert("Success", "Test subscription activated!");
                setUser({
                    ...user,
                    subscriptionStatus: "active",
                    subscriptionExpiry: res.data.subscription.endDate,
                    isSubscribed: true,
                });
                fetchShopData();
            }
        } catch (err) {
            console.error("Test activation failed:", err);
            Alert.alert("Error", "Bypass failed. Check backend console.");
        } finally {
            setProcessing(false);
        }
    };

    const handleTestCancel = async () => {
        setProcessing(true);
        try {
            const res = await api.post("/api/subscription/test-cancel");
            if (res.data.success) {
                Alert.alert("Success", "Subscription expired for testing!");
                setUser({
                    ...user,
                    subscriptionStatus: "expired",
                    subscriptionExpiry: new Date(Date.now() - 1000).toISOString(),
                    isSubscribed: false,
                });
                fetchShopData();
            }
        } catch (err) {
            console.error("Test cancel failed:", err);
            Alert.alert("Error", "Expiring failed.");
        } finally {
            setProcessing(false);
        }
    };

    const handlePinLocation = async () => {
        if (!isSubscribed) {
            showCustomAlert("Premium Feature", "Shop Mapping and Search Pinning requires an active Boost Visibility plan.");
            return;
        }
        try {
            if (shopData?.location?.coordinates) {
                setRegion({
                    latitude: shopData.location.coordinates[1],
                    longitude: shopData.location.coordinates[0],
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            } else {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Error", "Location permission denied");
                    return;
                }
                let location = await Location.getCurrentPositionAsync({});
                setRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            }
        } catch (e) {
            Alert.alert("Error", "Error accessing maps");
        }
    };

    const handleConfirmLocation = async () => {
        try {
            await api.put(
                '/api/shop',
                {
                    location: {
                        type: "Point",
                        coordinates: [region.longitude, region.latitude],
                    },
                }
            );

            Alert.alert("Success", "Location pinned successfully!");
            setRegion(null);
            setLocationConfirmed(true);
            fetchShopData();
        } catch (err) {
            Alert.alert("Error", "Failed to update location");
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: "center" }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (region) {
        return (
            <View style={styles.container}>
                <MapView
                    style={StyleSheet.absoluteFill}
                    initialRegion={region}
                    onRegionChangeComplete={setRegion}
                />
                <SafeAreaView style={styles.mapOverlay}>
                    <TouchableOpacity
                        onPress={() => setRegion(null)}
                        style={styles.mapBackButton}
                    >
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                </SafeAreaView>
                <View style={styles.markerFixed}>
                    <View style={styles.markerCircle}>
                        <MapPin
                            size={40}
                            color={theme.colors.primary}
                            fill={theme.colors.primary}
                        />
                    </View>
                    <View style={styles.markerStem} />
                </View>
                <View style={[styles.locationActionPanel, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.dragText, { color: theme.colors.text }]}>Move the map to place the pin</Text>
                    <TouchableOpacity
                        style={[
                            styles.confirmLocationButton,
                            { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={handleConfirmLocation}
                    >
                        <Text style={styles.confirmLocationButtonText}>
                            Confirm Location
                        </Text>
                    </TouchableOpacity>
                </View>
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
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Boost Visibility</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introBox}>
                    <Zap size={48} color={theme.colors.primary} style={styles.zapIcon} />
                    <Text style={[styles.title, { color: theme.colors.text }]}>Unlock Your Growth</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {isMainOwner
                            ? "Get detailed earnings analytics for your entire shop and get listed on the explore map."
                            : "Access the shop's earning analytics once your shop owner subscribes."}
                    </Text>
                </View>

                {user?.isSubscribed && (
                    <View style={[styles.activeSubBox, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}>
                        <ShieldCheck size={24} color={theme.colors.primary} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.activeSubTitle, { color: theme.colors.text }]}>Active Subscription</Text>
                                {timeLeft !== "" && (
                                    <View style={[styles.timerBadge, { backgroundColor: timeLeft === "Expired" ? "#FF4444" : theme.colors.primary }]}>
                                        <Clock size={12} color="#FFF" />
                                        <Text style={styles.timerText}>{timeLeft}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.activeSubText, { color: theme.colors.textSecondary }]}>
                                {isMainOwner ? "Your shop-wide plan is active." : "Shop owner's subscription covers you."}
                            </Text>
                        </View>
                    </View>
                )}

                {plans.length === 1 ? (
                    <View
                        style={[
                            styles.planCard,
                            {
                                backgroundColor: theme.colors.card,
                                borderColor: theme.colors.primary,
                                borderWidth: 2,
                            },
                        ]}
                    >
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={[styles.planName, { color: theme.colors.text }]}>{plans[0].name}</Text>
                                <Text style={[styles.planDuration, { color: theme.colors.textSecondary }]}>{plans[0].durationDays} Days</Text>
                            </View>
                            <Text style={[styles.planPrice, { color: theme.colors.primary }]}>₹{plans[0].price}</Text>
                        </View>

                        <View style={styles.featuresList}>
                            {plans[0].features?.map((feature, idx) => (
                                <View key={idx} style={styles.featureItem}>
                                    <CheckCircle2 size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    plans.map((plan) => (
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
                    ))
                )}

                <View style={styles.securityNote}>
                    <ShieldCheck size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
                        Secure payment via Razorpay. All data is encrypted.
                    </Text>
                </View>

                {isMainOwner && (
                    <>
                        <SectionHeader title="Growth & Ads" theme={theme} />
                        <View style={[styles.detailsIsland, { backgroundColor: theme.colors.card }]}>
                            {(() => {
                                // Determine which ranking sections to show
                                const rankingSections = [];
                                const shopCategory = shopData?.category?.trim();

                                if (shopCategory?.toLowerCase() === "unisex") {
                                    rankingSections.push({
                                        label: "Barber Section Rank",
                                        category: "Barber",
                                        screen: "ListingTier"
                                    });
                                    rankingSections.push({
                                        label: "Women's Salon Rank",
                                        category: "Women's Salon",
                                        screen: "WomenSalonListingTier"
                                    });
                                } else {
                                    let screen = "ListingTier";
                                    if (shopCategory?.toLowerCase() === "women's salon") screen = "WomenSalonListingTier";
                                    else if (shopCategory?.toLowerCase() === "pet care") screen = "PetCareListingTier";

                                    rankingSections.push({
                                        label: "Current Rank",
                                        category: shopCategory,
                                        screen
                                    });
                                }

                                return rankingSections.map((section, idx) => {
                                    const activeListing = shopData?.selectedListingPlaces?.find(
                                        lp => lp.category === section.category ||
                                            (section.category === "Barber" && lp.category === "Barber") ||
                                            (section.category === "Women's Salon" && lp.category === "Women's Salon")
                                    );

                                    const displayValue = activeListing?.tierId
                                        ? `Tier ${activeListing.tierId} Active`
                                        : "Click to List";

                                    return (
                                        <InfoRow
                                            key={section.category || idx}
                                            icon={Tag}
                                            label={section.label}
                                            value={displayValue}
                                            theme={theme}
                                            onPress={() => {
                                                if (activeListing && activeListing.tierId) {
                                                    navigation.navigate("BarberProfileViewScreen", {
                                                        barberId: shopData.owner._id || shopData.owner,
                                                    });
                                                    return;
                                                }
                                                navigation.navigate(section.screen, {
                                                    category: section.category
                                                });
                                            }}
                                            isLast={idx === rankingSections.length - 1 && false} // Featured Ad is usually last
                                        />
                                    );
                                });
                            })()}

                            <InfoRow
                                icon={Megaphone}
                                label="Featured Ad"
                                value="Create Ad Campaign"
                                theme={theme}
                                onPress={() => navigation.navigate("AdPlacementBooking")}
                                isLast
                            />
                        </View>

                        <SectionHeader title="Location Setting" theme={theme} />
                        <View style={[styles.locationWidget, { backgroundColor: theme.colors.card }]}>
                            <View style={styles.locationWidgetHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.locWidgetTitle, { color: theme.colors.text }]}>
                                        Map Visibility {!isSubscribed && <Lock size={12} color={theme.colors.textSecondary} />}
                                    </Text>
                                    <Text style={[styles.locWidgetSubtitle, { color: !isSubscribed ? theme.colors.textSecondary : (shopData?.location?.coordinates ? "#4CAF50" : theme.colors.textSecondary) }]}>
                                        {!isSubscribed ? "Locked (Subscription Required)" : (shopData?.location?.coordinates ? "● Active on Search" : "○ Not Pinned Yet")}
                                    </Text>
                                </View>
                                <View style={[styles.locIconBg, { backgroundColor: theme.colors.iconBackground }]}>
                                    <Navigation size={22} color={theme.colors.primary} />
                                </View>
                            </View>

                            {shopData?.location?.coordinates && (
                                <View style={styles.coordBox}>
                                    <Text style={[styles.coordText, { color: theme.colors.textSecondary }]}>
                                        LAT: {shopData.location.coordinates[1]?.toFixed(5)} LONG: {shopData.location.coordinates[0]?.toFixed(5)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.locationActions}>
                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { borderColor: theme.colors.border, opacity: isSubscribed ? 1 : 0.6 }]}
                                    onPress={() => {
                                        if (!isSubscribed) {
                                            showCustomAlert("Action Locked", "Subscribe to unlock manual coordinate entry.");
                                            return;
                                        }
                                        navigation.navigate("ManualLocationInput", { currentLocation: shopData?.location });
                                    }}
                                >
                                    <Hash size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.smallActionText, { color: theme.colors.text }]}>Manual</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filledActionBtn, { backgroundColor: isSubscribed ? theme.colors.primary : "#CCC" }]}
                                    onPress={handlePinLocation}
                                >
                                    {isSubscribed ? <MapPin size={16} color="#fff" style={{ marginRight: 8 }} /> : <Lock size={16} color="#666" style={{ marginRight: 8 }} />}
                                    <Text style={[styles.filledActionText, { color: isSubscribed ? "#FFF" : "#666" }]}>
                                        {shopData?.location?.coordinates ? "Update Pin" : "Set Pin"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Premium Animated Alert */}
            {customAlert.visible && (
                <Animated.View
                    style={[
                        styles.customAlertContainer,
                        {
                            transform: [{ translateY: alertAnim }],
                            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                            shadowColor: theme.colors.primary,
                        }
                    ]}
                >
                    <View style={[styles.alertIconBubble, { backgroundColor: theme.colors.primary + "15" }]}>
                        <Lock size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.alertTextContent}>
                        <Text style={[styles.alertTitleText, { color: theme.colors.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessageText, { color: theme.colors.textSecondary }]}>{customAlert.message}</Text>
                    </View>
                </Animated.View>
            )}

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {isMainOwner ? (
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            onPress={handleSubscribe}
                            disabled={processing || !selectedPlan}
                            style={[styles.subscribeBtn, { backgroundColor: theme.colors.primary, opacity: processing ? 0.7 : 1, flex: 1 }]}
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

                        {/* DEBUG BYPASS BUTTONS */}
                        <View style={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={handleTestActivate}
                                disabled={processing || !selectedPlan}
                                style={[styles.bypassBtn, { borderColor: theme.colors.primary, opacity: processing ? 0.7 : 1 }]}
                            >
                                <Text style={[styles.bypassBtnText, { color: theme.colors.primary }]}>Test Activate</Text>
                            </TouchableOpacity>

                            {isSubscribed && (
                                <TouchableOpacity
                                    onPress={handleTestCancel}
                                    disabled={processing}
                                    style={[styles.bypassBtn, { borderColor: "#FF4444", opacity: processing ? 0.7 : 1 }]}
                                >
                                    <Text style={[styles.bypassBtnText, { color: "#FF4444" }]}>Test Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={[styles.staffNotice, { backgroundColor: theme.colors.card }]}>
                        <XCircle size={20} color={theme.colors.textSecondary} />
                        <Text style={[styles.staffNoticeText, { color: theme.colors.textSecondary }]}>
                            Only shop owners can manage subscriptions.
                        </Text>
                    </View>
                )}
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
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    bypassBtn: {
        height: 56,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    bypassBtnText: {
        fontSize: 14,
        fontWeight: "700",
    },
    subscribeBtnText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "700",
        marginRight: 8,
    },
    activeSubBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    activeSubTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    activeSubText: {
        fontSize: 13,
        marginTop: 2,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    timerText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    staffNotice: {
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    staffNoticeText: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 10,
    },
    // --- GROWTH & LOCATION STYLES ---
    sectionHeaderContainer: {
        marginTop: 30,
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    sectionHeaderTitle: {
        fontSize: 14,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.8,
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
        opacity: 0.3,
    },
    detailsIsland: {
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    modernInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 18,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
        justifyContent: "center",
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: "500",
        marginBottom: 4,
        opacity: 0.7,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "600",
    },
    actionIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    locationWidget: {
        marginBottom: 40,
        padding: 20,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    locationWidgetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    locWidgetTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },
    locWidgetSubtitle: {
        fontSize: 12,
        fontWeight: "600",
    },
    locIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    locationActions: {
        flexDirection: "row",
        gap: 12,
    },
    smallActionBtn: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    smallActionText: {
        fontSize: 13,
        fontWeight: "700",
    },
    filledActionBtn: {
        flex: 1.5,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    filledActionText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    coordBox: {
        backgroundColor: "rgba(0,0,0,0.03)",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: "flex-start",
        marginBottom: 20,
    },
    coordText: {
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        fontWeight: "600",
        letterSpacing: -0.5,
    },
    // --- Map Overlay ---
    mapOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: 20,
        zIndex: 10,
    },
    mapBackButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        marginTop: STATUSBAR_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    markerFixed: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -20,
        marginTop: -40,
        alignItems: "center",
    },
    markerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255,255,255,0.9)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    markerStem: {
        width: 2,
        height: 10,
        backgroundColor: "#000",
        marginTop: -1,
    },
    locationActionPanel: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    dragText: {
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 16,
    },
    confirmLocationButton: {
        width: "100%",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    confirmLocationButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    // --- CUSTOM ALERT STYLES ---
    customAlertContainer: {
        position: "absolute",
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        elevation: 10,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    alertIconBubble: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    alertTextContent: {
        flex: 1,
    },
    alertTitleText: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    alertMessageText: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "500",
    },
});

export default BoostVisibilityScreen;
