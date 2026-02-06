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
    Crown, // Added for visual flair (if available in your version of lucide, else map to existing)
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
        <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>
            {title}
        </Text>
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
                borderBottomColor: theme.colors.border + "15", // Softer border
            },
        ]}
        onPress={canEdit ? onPress : undefined}
        activeOpacity={canEdit ? 0.7 : 1}
    >
        <View
            style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + "10" }, // Subtle tint
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
            <View style={styles.actionIconWrapper}>
                <ChevronRight size={18} color={theme.colors.textSecondary} opacity={0.5} />
            </View>
        )}
    </TouchableOpacity>
);

const BoostVisibilityScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user, setUser, isMainOwner, refreshUser } = useAuth();
    const isSubscribed = (user?.isSubscribed || user?.subscriptionStatus === 'active') &&
        (user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : true);

    const toggleDropdown = () => {
        const toValue = isDropdownExpanded ? 0 : 1;
        Animated.spring(dropdownAnim, {
            toValue,
            useNativeDriver: true,
            friction: 8,
            tension: 40
        }).start();
        setIsDropdownExpanded(!isDropdownExpanded);
    };

    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [shopData, setShopData] = useState(null);
    const [region, setRegion] = useState(null);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
    const dropdownAnim = React.useRef(new Animated.Value(0)).current;

    // Custom Alert State
    const [customAlert, setCustomAlert] = useState({ visible: false, title: "", message: "" });
    const alertAnim = React.useRef(new Animated.Value(-100)).current;

    const showCustomAlert = (title, message) => {
        setCustomAlert({ visible: true, title, message });
        Animated.spring(alertAnim, {
            toValue: insets.top + 10,
            useNativeDriver: true,
            tension: 50,
            friction: 8
        }).start();

        setTimeout(() => {
            Animated.timing(alertAnim, {
                toValue: -150,
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
                image: "https://glosscut.com/logo.png",
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
                    try {
                        const verifyRes = await api.post("/api/subscription/verify", {
                            razorpay_order_id: data.razorpay_order_id,
                            razorpay_payment_id: data.razorpay_payment_id,
                            razorpay_signature: data.razorpay_signature,
                        });

                        if (verifyRes.data.success) {
                            Alert.alert("Success", "Subscription activated successfully!");
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
                    if (error.code !== 2) {
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
        if (processing) return;
        setProcessing(true);
        try {
            const targetPlan = selectedPlan || (plans.length > 0 ? plans[0] : null);

            if (!targetPlan) {
                Alert.alert("Error", "Please select a specific plan first.");
                setProcessing(false);
                return;
            }

            const res = await api.post("/api/subscription/test-activate", {
                planId: targetPlan._id,
            });

            if (res.data.success) {
                Alert.alert("Success", `Test Mode: Activated ${targetPlan.name} for ${targetPlan.durationDays} ${targetPlan.durationUnit || 'days'}`);
                await refreshUser();
                await fetchShopData();
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
                            size={32}
                            color="#fff"
                            fill={theme.colors.primary}
                        />
                    </View>
                    <View style={styles.markerStem} />
                    <View style={styles.markerShadow} />
                </View>
                <View style={[styles.locationActionPanel, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.dragText, { color: theme.colors.text }]}>Move map to adjust pin position</Text>
                    <TouchableOpacity
                        style={styles.confirmLocationButtonWrapper}
                        onPress={handleConfirmLocation}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.primary]}
                            style={styles.confirmLocationButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.confirmLocationButtonText}>
                                Confirm Location
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.colors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Boost Visibility</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Intro Section - Modern Hero */}
                <LinearGradient
                    colors={isDark ? [theme.colors.primary + '20', 'transparent'] : [theme.colors.primary + '10', 'transparent']}
                    style={styles.introBox}
                >
                    <View style={[styles.zapIconContainer, { backgroundColor: theme.colors.background }]}>
                        <Zap size={32} color={theme.colors.primary} fill={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Unlock Your Growth</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {isMainOwner
                            ? "Get discovered on the explore map and unlock detailed shop analytics."
                            : "Access the shop's earning analytics once your shop owner subscribes."}
                    </Text>
                </LinearGradient>

                {isSubscribed && (
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primary + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeSubCard}
                    >
                        <View style={styles.activeSubHeader}>
                            <View style={styles.activeSubIcon}>
                                <ShieldCheck size={24} color="#FFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.activeSubTitle}>Premium Active</Text>
                                <Text style={styles.activeSubText}>
                                    {isMainOwner ? "Your shop is fully unlocked." : "Shop owner's plan covers you."}
                                </Text>
                            </View>
                            {timeLeft !== "" && (
                                <View style={[styles.timerBadge, { backgroundColor: timeLeft === "Expired" ? "#FF4444" : "rgba(255,255,255,0.2)" }]}>
                                    <Clock size={12} color="#FFF" />
                                    <Text style={styles.timerText}>{timeLeft}</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                )}

                {/* Plan Dropdown - Card Style */}
                <View style={styles.dropdownSection}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={toggleDropdown}
                        style={[
                            styles.dropdownHeader,
                            {
                                backgroundColor: theme.colors.card,
                                borderColor: selectedPlan ? theme.colors.primary : theme.colors.border,
                                borderWidth: selectedPlan ? 1.5 : 1,
                            }
                        ]}
                    >
                        <View style={styles.dropdownHeaderLeft}>
                            <View style={[styles.planIconWrapper, { backgroundColor: selectedPlan ? theme.colors.primary + '15' : theme.colors.border + '30' }]}>
                                <Zap size={22} color={selectedPlan ? theme.colors.primary : theme.colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={[styles.dropdownLabel, { color: theme.colors.textSecondary }]}>Selected Plan</Text>
                                <Text style={[styles.dropdownValue, { color: theme.colors.text }]}>
                                    {selectedPlan ? selectedPlan.name : "Select a Plan"}
                                </Text>
                                {selectedPlan && <Text style={[styles.dropdownPrice, { color: theme.colors.primary }]}>₹{selectedPlan.price} / {selectedPlan.durationDays} days</Text>}
                            </View>
                        </View>
                        <Animated.View style={{
                            transform: [{
                                rotate: dropdownAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '180deg']
                                })
                            }]
                        }}>
                            <ChevronRight size={20} color={theme.colors.textSecondary} />
                        </Animated.View>
                    </TouchableOpacity>

                    {(isDropdownExpanded || plans.length === 1) && (
                        <View style={[styles.dropdownContent, { backgroundColor: theme.colors.card }]}>
                            {plans.map((plan) => (
                                <TouchableOpacity
                                    key={plan._id}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        setSelectedPlan(plan);
                                        if (plans.length > 1) {
                                            toggleDropdown();
                                        }
                                    }}
                                    style={[
                                        styles.planListItem,
                                        {
                                            backgroundColor: selectedPlan?._id === plan._id ? theme.colors.primary + '08' : 'transparent',
                                            borderColor: selectedPlan?._id === plan._id ? theme.colors.primary : theme.colors.border + '30',
                                        }
                                    ]}
                                >
                                    <View style={styles.planListRow}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={[styles.planListName, { color: theme.colors.text }]}>{plan.name}</Text>
                                                {selectedPlan?._id === plan._id && (
                                                    <View style={[styles.miniBadge, { backgroundColor: theme.colors.primary }]}>
                                                        <CheckCircle2 size={10} color="#FFF" />
                                                        <Text style={styles.miniBadgeText}>SELECTED</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.planListDuration, { color: theme.colors.textSecondary }]}>
                                                Valid for {plan.durationDays} {plan.durationUnit || 'days'}
                                            </Text>
                                        </View>
                                        <Text style={[styles.planListPrice, { color: theme.colors.text }]}>₹{plan.price}</Text>
                                    </View>

                                    {/* Features visible in dropdown items */}
                                    <View style={styles.dropdownFeatures}>
                                        {plan.features?.slice(0, 3).map((feature, idx) => (
                                            <View key={idx} style={styles.miniFeature}>
                                                <CheckCircle2 size={14} color={theme.colors.primary} />
                                                <Text style={[styles.miniFeatureText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
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
                                        : "Not Listed";

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
                                            isLast={false}
                                        />
                                    );
                                });
                            })()}

                            <InfoRow
                                icon={Megaphone}
                                label="Featured Ad"
                                value="Boost Traffic"
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
                                        Map Visibility
                                    </Text>
                                    <Text style={[styles.locWidgetSubtitle, { color: !isSubscribed ? theme.colors.textSecondary : (shopData?.location?.coordinates ? "#4CAF50" : theme.colors.textSecondary) }]}>
                                        {!isSubscribed ? "Subscription Required" : (shopData?.location?.coordinates ? "● Active on Search" : "○ Not Pinned Yet")}
                                    </Text>
                                </View>
                                <View style={[styles.locIconBg, { backgroundColor: isSubscribed ? theme.colors.primary + '15' : theme.colors.border + '30' }]}>
                                    {!isSubscribed ? <Lock size={20} color={theme.colors.textSecondary} /> : <Navigation size={22} color={theme.colors.primary} />}
                                </View>
                            </View>

                            {shopData?.location?.coordinates && (
                                <View style={styles.coordBox}>
                                    <Text style={[styles.coordText, { color: theme.colors.textSecondary }]}>
                                        {shopData.location.coordinates[1]?.toFixed(5)}, {shopData.location.coordinates[0]?.toFixed(5)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.locationActions}>
                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { borderColor: theme.colors.border, opacity: isSubscribed ? 1 : 0.5 }]}
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
                                    activeOpacity={isSubscribed ? 0.8 : 1}
                                    style={[styles.filledActionBtnWrapper, { opacity: isSubscribed ? 1 : 0.8 }]}
                                    onPress={handlePinLocation}
                                >
                                    <LinearGradient
                                        colors={isSubscribed ? [theme.colors.primary, theme.colors.primary] : [theme.colors.border, theme.colors.border]}
                                        style={styles.filledActionBtn}
                                    >
                                        {isSubscribed ? <MapPin size={16} color="#fff" style={{ marginRight: 8 }} /> : <Lock size={16} color="#888" style={{ marginRight: 8 }} />}
                                        <Text style={[styles.filledActionText, { color: isSubscribed ? "#FFF" : "#888" }]}>
                                            {shopData?.location?.coordinates ? "Update Pin" : "Set Pin"}
                                        </Text>
                                    </LinearGradient>
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
                            backgroundColor: theme.colors.card,
                            shadowColor: "#000",
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

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: theme.colors.card }]}>
                {isMainOwner ? (
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            onPress={handleSubscribe}
                            disabled={processing || !selectedPlan}
                            activeOpacity={0.8}
                            style={{ flex: 1 }}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.primary]}
                                style={[styles.subscribeBtn, { opacity: processing ? 0.7 : 1 }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
                                        <ChevronRight size={20} color="#FFF" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* DEBUG BYPASS BUTTONS - Styled simpler to not distract */}
                        <View style={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={handleTestActivate}
                                disabled={processing || !selectedPlan}
                                style={[styles.bypassBtn, { borderColor: theme.colors.border }]}
                            >
                                <Text style={[styles.bypassBtnText, { color: theme.colors.primary }]}>Test</Text>
                            </TouchableOpacity>

                            {isSubscribed && (
                                <TouchableOpacity
                                    onPress={handleTestCancel}
                                    disabled={processing}
                                    style={[styles.bypassBtn, { borderColor: "#FF4444" }]}
                                >
                                    <Text style={[styles.bypassBtnText, { color: "#FF4444", fontSize: 10 }]}>End</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={[styles.staffNotice, { backgroundColor: theme.colors.background }]}>
                        <XCircle size={18} color={theme.colors.textSecondary} />
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    backBtn: {
        padding: 8,
        marginRight: 4,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    introBox: {
        alignItems: "center",
        marginBottom: 24,
        marginTop: 4,
        paddingVertical: 30,
        borderRadius: 24,
        overflow: 'hidden',
    },
    zapIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: 24,
        opacity: 0.8,
    },
    // --- DROPDOWN & PLANS ---
    dropdownSection: {
        marginBottom: 24,
        zIndex: 10,
    },
    dropdownHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 20,
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dropdownHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    planIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    dropdownLabel: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        opacity: 0.7,
        marginBottom: 2,
    },
    dropdownValue: {
        fontSize: 16,
        fontWeight: "700",
    },
    dropdownPrice: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 2,
    },
    dropdownContent: {
        marginTop: 12,
        borderRadius: 20,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    planListItem: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
    },
    planListRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    planListName: {
        fontSize: 15,
        fontWeight: "700",
        marginRight: 8,
    },
    planListDuration: {
        fontSize: 12,
        opacity: 0.7,
    },
    planListPrice: {
        fontSize: 16,
        fontWeight: "800",
    },
    dropdownFeatures: {
        marginTop: 4,
        gap: 6,
    },
    miniFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniFeatureText: {
        fontSize: 12,
        flex: 1,
    },
    miniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    miniBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '800',
    },
    // --- ACTIVE SUB CARD ---
    activeSubCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    activeSubHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        gap: 16,
    },
    activeSubIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeSubTitle: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    activeSubText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        lineHeight: 18,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 6,
        alignSelf: 'flex-start',
    },
    timerText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    // --- SECTIONS ---
    sectionHeaderContainer: {
        marginTop: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionHeaderTitle: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.6,
    },
    detailsIsland: {
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 24,
    },
    modernInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 18,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
        justifyContent: "center",
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 2,
        opacity: 0.6,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "600",
    },
    actionIconWrapper: {
        padding: 4,
    },
    // --- LOCATION WIDGET ---
    locationWidget: {
        marginBottom: 40,
        padding: 20,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    locationWidgetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    locWidgetTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },
    locWidgetSubtitle: {
        fontSize: 13,
        fontWeight: "500",
    },
    locIconBg: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    locationActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    smallActionBtn: {
        flex: 1,
        flexDirection: "row",
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    smallActionText: {
        fontSize: 13,
        fontWeight: "700",
    },
    filledActionBtnWrapper: {
        flex: 1.5,
        height: 48,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    filledActionBtn: {
        flex: 1,
        flexDirection: "row",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    filledActionText: {
        fontSize: 13,
        fontWeight: "700",
    },
    coordBox: {
        backgroundColor: "rgba(0,0,0,0.03)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: "flex-start",
        marginBottom: 16,
    },
    coordText: {
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
        fontWeight: "600",
        letterSpacing: -0.5,
    },
    // --- FOOTER & BUTTONS ---
    footer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    subscribeBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    subscribeBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.5,
        marginRight: 8,
    },
    bypassBtn: {
        height: 56,
        width: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    bypassBtnText: {
        fontSize: 12,
        fontWeight: "700",
    },
    staffNotice: {
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderStyle: 'dashed',
    },
    staffNoticeText: {
        fontSize: 13,
        fontWeight: "500",
        marginLeft: 10,
    },
    // --- MAP OVERLAY ---
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
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    markerFixed: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -24,
        marginTop: -48,
        alignItems: "center",
    },
    markerCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    markerStem: {
        width: 2,
        height: 24,
        backgroundColor: "rgba(0,0,0,0.8)",
        marginTop: -2,
        zIndex: 1,
    },
    markerShadow: {
        width: 20,
        height: 4,
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 2,
        marginTop: -2,
    },
    locationActionPanel: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    dragText: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 16,
        opacity: 0.8,
    },
    confirmLocationButtonWrapper: {
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        borderRadius: 16,
    },
    confirmLocationButton: {
        width: "100%",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
    },
    confirmLocationButtonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 16,
        letterSpacing: 0.5,
    },
    // --- ALERT ---
    customAlertContainer: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 9999,
        borderRadius: 20,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        elevation: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    alertIconBubble: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    alertTextContent: {
        flex: 1,
    },
    alertTitleText: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },
    alertMessageText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "500",
        opacity: 0.8,
    },
});

export default BoostVisibilityScreen;