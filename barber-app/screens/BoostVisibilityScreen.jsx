import React, { useState, useEffect, useRef } from "react";
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
    CheckCircle2,
    ShieldCheck,
    Zap,
    ChevronRight,
    ArrowLeft,
    XCircle,
    Clock,
    MapPin,
    Tag,
    Megaphone,
    Navigation,
    Hash,
    Lock,
    Crown,
    Sparkles,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import RazorpayCheckout from "react-native-razorpay";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import LeafletMap from "../components/LeafletMap";
import { Ionicons } from "@expo/vector-icons";
import SwipeButton from "../components/SwipeButton";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 44;
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// --- HELPER COMPONENTS ---
const SectionHeader = ({ title, theme, icon: Icon }) => (
    <View style={styles.sectionHeaderContainer}>
        {Icon && <Icon size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />}
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
    subValue
}) => (
    <TouchableOpacity
        style={[
            styles.modernInfoRow,
            !isLast && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border + "10",
            },
        ]}
        onPress={canEdit ? onPress : undefined}
        activeOpacity={canEdit ? 0.7 : 1}
    >
        <View
            style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + "10" },
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
            {subValue && (
                <Text style={[styles.infoSubValue, { color: theme.colors.primary }]}>
                    {subValue}
                </Text>
            )}
        </View>
        {canEdit && (
            <View style={[styles.actionIconWrapper, { backgroundColor: theme.colors.card }]}>
                <ChevronRight size={16} color={theme.colors.textSecondary} opacity={0.6} />
            </View>
        )}
    </TouchableOpacity>
);

const SubscriptionAdvantageSection = ({ theme }) => (
    <View style={styles.advantageCard}>
        <LinearGradient
            colors={[theme.colors.card, theme.colors.background]}
            style={styles.advantageGradient}
        >
            <View style={styles.advantageHeader}>
                <Zap size={20} color={theme.colors.primary} />
                <Text style={[styles.advantageTitle, { color: theme.colors.text }]}>Boost Advantages</Text>
            </View>
            <View style={styles.advantageList}>
                <View style={styles.advantageItem}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text style={[styles.advantageText, { color: theme.colors.textSecondary }]}>
                        <Text style={{ fontWeight: "700", color: theme.colors.text }}>Priority Search:</Text> Appear at the top of local search results.
                    </Text>
                </View>
                <View style={styles.advantageItem}>
                    <MapPin size={16} color="#10B981" />
                    <Text style={[styles.advantageText, { color: theme.colors.textSecondary }]}>
                        <Text style={{ fontWeight: "700", color: theme.colors.text }}>Map Visibility:</Text> Your shop becomes visible on the customer map.
                    </Text>
                </View>
                <View style={styles.advantageItem}>
                    <Zap size={16} color="#10B981" />
                    <Text style={[styles.advantageText, { color: theme.colors.textSecondary }]}>
                        <Text style={{ fontWeight: "700", color: theme.colors.text }}>Instant Booking:</Text> Customers can find and book you 24/7.
                    </Text>
                </View>
            </View>

            <View style={[styles.visibilityBox, { backgroundColor: theme.colors.primary + '08' }]}>
                <Text style={[styles.visibilityTitle, { color: theme.colors.primary }]}>Visible Changes For Customers:</Text>
                <View style={styles.visibilityRow}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                    <Text style={[styles.visibilityText, { color: theme.colors.textSecondary }]}>Featured listing in search results</Text>
                </View>
                <View style={styles.visibilityRow}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                    <Text style={[styles.visibilityText, { color: theme.colors.textSecondary }]}>Active shop pin on the Map</Text>
                </View>
            </View>
        </LinearGradient>
    </View>
);

const AgreementCheckbox = ({ active, onToggle, theme }) => {
    const openTerms = () => {
        Linking.openURL("https://glosscut.com/terms").catch((err) =>
            console.error("Failed to open URL:", err)
        );
    };

    return (
        <TouchableOpacity
            style={styles.agreementContainer}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={[styles.checkbox, active && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                {active && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.agreementText, { color: theme.colors.textSecondary }]}>
                I agree to the{" "}
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }} onPress={openTerms}>
                    Terms & Conditions
                </Text>{" "}
                and understand that my shop visibility depends on this plan.
            </Text>
        </TouchableOpacity>
    );
};

const BoostVisibilityScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user, setUser, isMainOwner, refreshUser } = useAuth();
    const isSubscribed = (user?.isSubscribed || user?.subscriptionStatus === 'active') &&
        (user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : true);

    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [shopData, setShopData] = useState(null);
    const [region, setRegion] = useState(null);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [isAgreed, setIsAgreed] = useState(false);
    const [swipeKey, setSwipeKey] = useState(0);

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(headerSlide, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
        ]).start();
    }, []);

    // Custom Alert State

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
        if (!selectedPlan) {
            setSwipeKey(prev => prev + 1);
            return;
        }

        setProcessing(true);
        try {
            // 1. Get Key from Backend
            const configRes = await api.get("/api/payment/config");
            const rzpKey = configRes.data.key;

            // 2. Create Order
            const orderRes = await api.post("/api/subscription/order", {
                planId: selectedPlan._id,
            });

            const options = {
                description: `Subscription: ${selectedPlan.name}`,
                image: "https://glosscut.com/logo.png",
                currency: "INR",
                key: rzpKey, // Securely fetched from backend
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
                    setSwipeKey(prev => prev + 1);
                    if (error.code !== 2) {
                        Alert.alert("Payment Failed", error.description || "The payment could not be processed.");
                    }
                });
        } catch (err) {
            console.error("Order creation failed:", err);
            setSwipeKey(prev => prev + 1);
            Alert.alert("Error", "Could not initiate payment.");
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
                <LeafletMap
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
            {/* Premium Header */}
            <AnimatedGradient
                colors={[theme.colors.primary, theme.colors.primary + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerWrapper, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
            >
                <View style={styles.headerBlob1} />
                <View style={styles.headerBlob2} />
                <View style={styles.headerBlob3} />
                <View style={styles.headerBlob4} />

                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitleText}>Subscription Plans</Text>
                    </View>

                    <View style={{ width: 42 }} />
                </View>
            </AnimatedGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Intro Section - Modern Hero */}


                {isSubscribed && (
                    <View style={styles.activeSubContainer}>
                        <LinearGradient
                            colors={user?.isTrial ? ['#6366F1', '#8B5CF6'] : ['#4F46E5', '#6366F1']} // More vibrant indigo/violet
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activeSubCard}
                        >
                            <View style={styles.activeSubHeader}>
                                <View style={[styles.activeSubIcon, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                                    {user?.isTrial ? (
                                        <Sparkles size={30} color="#FFF" />
                                    ) : (
                                        <Crown size={30} color="#FFF" />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activeSubTitle}>
                                        {user?.isTrial ? "Trial Membership" : "Premium Member"}
                                    </Text>
                                    <View style={[styles.activeSubBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                                        <ShieldCheck size={14} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.activeSubText}>
                                            {user?.isTrial ? "Joining Bonus" : "Active Plan"}
                                        </Text>
                                    </View>
                                </View>
                                {timeLeft !== "" && (
                                    <View style={[styles.timerBadge, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                                        <Clock size={14} color="#FFF" />
                                        <Text style={styles.timerText}>{timeLeft}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.activeSubFooter}>
                                <Text style={styles.activeSubFooterText}>
                                    {isMainOwner ? "Your shop is fully unlocked and visible." : "Shop owner's premium plan covers you."}
                                </Text>
                            </View>
                        </LinearGradient>
                        <View style={[styles.cardShadow, { backgroundColor: user?.isTrial ? '#8B5CF6' : theme.colors.primary, opacity: 0.4 }]} />
                    </View>
                )}

                {(!isSubscribed || user?.isTrial) && (
                    <>
                        <SubscriptionAdvantageSection theme={theme} />
                        <SectionHeader title="Select Your Plan" theme={theme} icon={Tag} />
                        <View style={styles.planSelectionContainer}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.planCardsScroll}
                                snapToInterval={width - 20}
                                decelerationRate="fast"
                                snapToAlignment="center"
                            >
                                {user?.isTrial && (
                                    <View
                                        style={[
                                            styles.planCard,
                                            {
                                                backgroundColor: theme.colors.card,
                                                borderColor: theme.colors.primary,
                                                transform: [{ scale: 1 }]
                                            }
                                        ]}
                                    >
                                        <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
                                            <ShieldCheck size={12} color="#FFF" />
                                            <Text style={styles.selectedBadgeText}>ACTIVE</Text>
                                        </View>

                                        <View style={[styles.planCardHeader, { backgroundColor: theme.colors.primary + '10' }]}>
                                            <View style={[styles.planIconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                                                <Sparkles size={22} color={theme.colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={[styles.planCardName, { color: theme.colors.text }]}>Joining Bonus</Text>
                                                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' }}>Free Trial Access</Text>
                                            </View>
                                        </View>

                                        <View style={styles.planCardPriceSection}>
                                            <Text style={[styles.planCardPrice, { color: theme.colors.text }]}>₹0</Text>
                                            <Text style={[styles.planCardDuration, { color: theme.colors.textSecondary }]}>/ 1 Month</Text>
                                        </View>

                                        <View style={styles.planCardFeatures}>
                                            {[
                                                "Full Map Visibility",
                                                "Growth Tools Unlocked",
                                                "Premium Badge",
                                                "Priority Support"
                                            ].map((feature, idx) => (
                                                <View key={idx} style={styles.featureRow}>
                                                    <CheckCircle2 size={16} color={theme.colors.primary} />
                                                    <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {plans.map((plan) => {
                                    const isSelected = selectedPlan?._id === plan._id;
                                    return (
                                        <TouchableOpacity
                                            key={plan._id}
                                            activeOpacity={0.9}
                                            onPress={() => setSelectedPlan(plan)}
                                            style={[
                                                styles.planCard,
                                                {
                                                    backgroundColor: isSelected ? theme.colors.card : theme.colors.background,
                                                    borderColor: isSelected ? theme.colors.primary : theme.colors.border + '40',
                                                    transform: [{ scale: isSelected ? 1 : 0.98 }]
                                                }
                                            ]}
                                        >
                                            {isSelected && (
                                                <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
                                                    <CheckCircle2 size={12} color="#FFF" />
                                                    <Text style={styles.selectedBadgeText}>SELECTED</Text>
                                                </View>
                                            )}

                                            <View style={[styles.planCardHeader, { backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent' }]}>
                                                <View style={[styles.planIconCircle, { backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.border + '20' }]}>
                                                    <Sparkles size={20} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                                                </View>
                                                <Text style={[styles.planCardName, { color: theme.colors.text }]}>{plan.name}</Text>
                                            </View>

                                            <View style={styles.planCardPriceSection}>
                                                <Text style={[styles.planCardPrice, { color: theme.colors.primary }]}>₹{plan.price}</Text>
                                                <Text style={[styles.planCardDuration, { color: theme.colors.textSecondary }]}>/ {plan.durationDays} days</Text>
                                            </View>

                                            <View style={styles.planCardFeatures}>
                                                {plan.features?.slice(0, 3).map((feature, idx) => (
                                                    <View key={idx} style={styles.featureRow}>
                                                        <CheckCircle2 size={14} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                                                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                                            {feature}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </>
                )}

                {isMainOwner && (
                    <>
                        <SectionHeader title="Growth & Rankings" theme={theme} icon={Crown} />
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

                                    const subMsg = activeListing?.tierId
                                        ? "Maintained"
                                        : "Tap to boost ranking";

                                    return (
                                        <InfoRow
                                            key={section.category || idx}
                                            icon={Tag}
                                            label={section.label}
                                            value={displayValue}
                                            subValue={!activeListing?.tierId ? "Boost Visibility" : null}
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
                                value="Run an Ad Campaign"
                                subValue="Get more customers"
                                theme={theme}
                                onPress={() => navigation.navigate("AdPlacementBooking")}
                                isLast
                            />
                        </View>

                        <SectionHeader title="Location & Map Support" theme={theme} icon={MapPin} />
                        <View style={[styles.locationWidget, { backgroundColor: theme.colors.card }]}>
                            <View style={styles.locationWidgetHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.locWidgetTitle, { color: theme.colors.text }]}>
                                        Map Visibility
                                    </Text>
                                    <Text style={[styles.locWidgetSubtitle, { color: !isSubscribed ? theme.colors.textSecondary : (shopData?.location?.coordinates ? theme.colors.primary : theme.colors.textSecondary) }]}>
                                        {!isSubscribed ? "Subscription Required to Pin" : (shopData?.location?.coordinates ? "● Active on Search" : "○ Not Pinned Yet")}
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
            {
                customAlert.visible && (
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
                )
            }

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: theme.colors.card }]}>
                {isMainOwner ? (
                    <View style={styles.buttonGroup}>
                        {!isSubscribed ? (
                            <View style={{ flex: 1 }}>
                                <AgreementCheckbox
                                    active={isAgreed}
                                    onToggle={() => setIsAgreed(!isAgreed)}
                                    theme={theme}
                                />
                                <SwipeButton
                                    key={swipeKey}
                                    onSwipeSuccess={handleSubscribe}
                                    title={isAgreed ? "Swipe to Subscribe" : "Agree to Terms First"}
                                    disabled={!isAgreed || !selectedPlan || processing}
                                    thumbColor={theme.colors.primary}
                                    railBackgroundColor={isDark ? theme.colors.card : '#F8F9FA'}
                                    railBorderColor={theme.colors.border + '20'}
                                    titleColor={isAgreed ? theme.colors.text : theme.colors.textSecondary}
                                />
                            </View>
                        ) : (
                            <View style={[styles.staffNotice, { backgroundColor: theme.colors.background, flex: 1 }]}>
                                {user?.isTrial ? (
                                    <Sparkles size={20} color={theme.colors.primary} />
                                ) : (
                                    <ShieldCheck size={20} color={theme.colors.primary} />
                                )}
                                <Text style={[styles.staffNoticeText, { color: theme.colors.text }]}>
                                    {user?.isTrial ? "You are currently on a Free Trial" : "You already have an active plan"}
                                </Text>
                            </View>
                        )}
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
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // --- PREMIUM HEADER ---
    headerWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
        position: 'relative',
        paddingTop: STATUSBAR_HEIGHT + 10,
    },
    headerBlob1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -30 },
    headerBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20 },
    headerBlob3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', top: 20, left: '30%' },
    headerBlob4: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 40, right: -40 },
    headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: '100%' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitleText: { fontSize: 20, fontWeight: "900", color: '#FFF', letterSpacing: -0.5 },
    backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    // --- HERO ---
    heroContainer: {
        marginBottom: 24,
    },
    introBox: {
        alignItems: "center",
        paddingVertical: 32,
        borderRadius: 28,
        overflow: 'hidden',
    },
    zapIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 32,
        opacity: 0.8,
        fontWeight: "500",
    },
    // --- DROPDOWN & PLANS ---
    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
        opacity: 0.7,
    },
    // --- PLAN SELECTION (CARDS) ---
    planSelectionContainer: {
        marginBottom: 24,
    },
    planCardsScroll: {
        paddingRight: 20,
        paddingBottom: 10,
    },
    planCard: {
        width: width - 40,
        marginRight: 20,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1.5,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        position: 'relative',
        overflow: 'hidden',
    },
    selectedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderBottomLeftRadius: 16,
    },
    selectedBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
    },
    planCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 8,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    planIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    planCardName: {
        fontSize: 18,
        fontWeight: '700',
    },
    planCardPriceSection: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    planCardPrice: {
        fontSize: 32,
        fontWeight: '800',
    },
    planCardDuration: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    planCardFeatures: {
        marginTop: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '500',
    },
    miniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    miniBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // --- ACTIVE SUB CARD ---
    activeSubContainer: {
        marginBottom: 32,
    },
    activeSubCard: {
        padding: 24,
        borderRadius: 28,
        zIndex: 2,
    },
    cardShadow: {
        position: 'absolute',
        bottom: -8,
        left: 20,
        right: 20,
        height: 40,
        borderRadius: 28,
        zIndex: 1,
        filter: 'blur(20px)',
    },
    activeSubHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        gap: 16,
        marginBottom: 20,
    },
    activeSubIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeSubTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    activeSubBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeSubText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    timerText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    activeSubFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    activeSubFooterText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: "500",
    },
    // --- SECTIONS ---
    sectionHeaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    sectionHeaderTitle: {
        fontSize: 13,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.6,
    },
    detailsIsland: {
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    modernInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 22,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18,
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
        fontWeight: "700",
        marginBottom: 4,
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 17,
        fontWeight: "800",
    },
    infoSubValue: {
        fontSize: 12,
        fontWeight: "700",
        marginTop: 4,
    },
    actionIconWrapper: {
        padding: 10,
        borderRadius: 14,
    },
    // --- LOCATION WIDGET ---
    locationWidget: {
        marginBottom: 40,
        padding: 24,
        borderRadius: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    locationWidgetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    locWidgetTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 4,
    },
    locWidgetSubtitle: {
        fontSize: 13,
        fontWeight: "600",
    },
    locIconBg: {
        width: 48,
        height: 48,
        borderRadius: 18,
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
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    smallActionText: {
        fontSize: 14,
        fontWeight: "700",
    },
    filledActionBtnWrapper: {
        flex: 1.5,
        height: 52,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    filledActionBtn: {
        flex: 1,
        flexDirection: "row",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    filledActionText: {
        fontSize: 14,
        fontWeight: "700",
    },
    coordBox: {
        backgroundColor: "rgba(0,0,0,0.03)",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignSelf: "flex-start",
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coordText: {
        fontSize: 12,
        fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
        fontWeight: "600",
        letterSpacing: -0.5,
    },
    // --- FOOTER & BUTTONS ---
    footer: {
        paddingHorizontal: 24,
        paddingTop: 24,
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
        height: 64,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 15,
        elevation: 10,
    },
    subscribeBtnText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0.8,
        marginRight: 8,
    },
    staffNotice: {
        height: 64,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: 'rgba(99, 102, 241, 0.15)', // Light indigo border
        backgroundColor: 'rgba(99, 102, 241, 0.05)', // Very light indigo bg
    },
    staffNoticeText: {
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 12,
        letterSpacing: 0.2,
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
        width: 48,
        height: 48,
        borderRadius: 24,
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
        bottom: 50,
        left: 24,
        right: 24,
        borderRadius: 28,
        padding: 28,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    dragText: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 20,
        opacity: 0.8,
    },
    confirmLocationButtonWrapper: {
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        borderRadius: 18,
    },
    confirmLocationButton: {
        width: "100%",
        paddingVertical: 18,
        borderRadius: 18,
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
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: 24,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        elevation: 20,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    alertIconBubble: {
        width: 52,
        height: 52,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    alertTextContent: {
        flex: 1,
    },
    alertTitleText: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 4,
    },
    alertMessageText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "500",
        opacity: 0.8,
    },
    // --- ADVANTAGE SECTION ---
    advantageCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    advantageGradient: {
        padding: 20,
    },
    advantageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    advantageTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 10,
    },
    advantageList: {
        gap: 12,
        marginBottom: 20,
    },
    advantageItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    advantageText: {
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    visibilityBox: {
        padding: 14,
        borderRadius: 12,
    },
    visibilityTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    visibilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginRight: 8,
    },
    visibilityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // --- AGREEMENT ---
    agreementContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agreementText: {
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
});

export default BoostVisibilityScreen;