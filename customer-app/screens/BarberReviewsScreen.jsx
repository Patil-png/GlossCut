import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Quote, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const safeStr = (val) => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null && 'content' in val) return val.content;
    return String(val);
};

const BarberReviewsScreen = ({ navigation, route }) => {
    const { barber } = route.params;
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const reviews = barber.reviews || [];

    const stats = {
        rating: barber.rating || 0,
        total: reviews.length,
        fiveStar: reviews.filter(r => (r.rating || 5) === 5).length,
        fourStar: reviews.filter(r => (r.rating || 5) === 4).length,
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                activeOpacity={0.7}
            >
                <ArrowLeft size={22} color="#1A1A1A" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{safeStr(barber.name)}</Text>
                <View style={styles.badge}>
                    <Text style={styles.headerSubtitle}>Verified Reviews</Text>
                </View>
            </View>
        </View>
    );

    const renderStats = () => (
        <View style={styles.statsContainer}>
            <View style={styles.ratingHero}>
                <Text style={styles.ratingLarge}>{stats.rating > 0 ? Number(stats.rating).toFixed(1) : 'NEW'}</Text>
                <View style={styles.starsHero}>
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={14}
                            color={i < Math.floor(stats.rating || 5) ? "#1A1A1A" : "#E2E8F0"}
                            fill={i < Math.floor(stats.rating || 5) ? "#1A1A1A" : "#E2E8F0"}
                        />
                    ))}
                </View>
                <Text style={styles.reviewCountHero}>{stats.total} Reviews</Text>
            </View>

            <View style={styles.statsDetails}>
                <View style={styles.statRow}>
                    <Text style={styles.statLabelText}>5 ★</Text>
                    <View style={styles.barContainer}>
                        <View style={[styles.barFill, { width: stats.total > 0 ? `${(stats.fiveStar / stats.total) * 100}%` : '0%' }]} />
                    </View>
                    <Text style={styles.statValueText}>{stats.fiveStar}</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={styles.statLabelText}>4 ★</Text>
                    <View style={styles.barContainer}>
                        <View style={[styles.barFill, { width: stats.total > 0 ? `${(stats.fourStar / stats.total) * 100}%` : '0%' }]} />
                    </View>
                    <Text style={styles.statValueText}>{stats.fourStar}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderHeader()}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {renderStats()}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Client Stories</Text>
                    <View style={styles.line} />
                </View>

                {reviews.length > 0 ? (
                    reviews.map((rev, index) => (
                        <View key={index} style={styles.reviewCard}>
                            <View style={styles.reviewMeta}>
                                <View style={styles.reviewerInfo}>
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarInitial}>
                                            {(safeStr(rev.userName) || safeStr(rev.userId?.name) || 'C')[0]}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.reviewerName}>
                                            {safeStr(rev.userName) || safeStr(rev.userId?.name) || 'Anonymous Client'}
                                        </Text>
                                        <Text style={styles.reviewDate}>
                                            {rev.createdAt ? new Date(safeStr(rev.createdAt)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Session'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.cardStars}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            color={i < (rev.rating || 5) ? "#BFA054" : "#E2E8F0"} // Subtle Gold for individual stars
                                            fill={i < (rev.rating || 5) ? "#BFA054" : "#E2E8F0"}
                                        />
                                    ))}
                                </View>
                            </View>

                            <View style={styles.commentContainer}>
                                <Quote size={24} color="#F1F5F9" style={styles.quoteIcon} />
                                <Text style={styles.commentText}>
                                    {safeStr(rev.comment) || safeStr(rev.commentary) || "Excellent service provided."}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Star size={32} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>New to the Spotlight</Text>
                        <Text style={styles.emptySubtitle}>Be the first to share your experience with {safeStr(barber.name)}.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#F8F9FA',
    },
    headerTextContainer: {
        flex: 1,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        // Neumorphic shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3
    },
    headerTitle: {
        fontFamily: 'Syne_700Bold',
        fontSize: 24,
        color: '#1A1A1A',
        letterSpacing: -0.5
    },
    badge: {
        backgroundColor: '#E2E8F0',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4
    },
    headerSubtitle: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40
    },
    statsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 4
    },
    ratingHero: {
        alignItems: 'center',
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: '#F1F5F9'
    },
    ratingLarge: {
        fontFamily: 'Syne_800ExtraBold',
        fontSize: 52,
        color: '#1A1A1A',
        lineHeight: 56
    },
    starsHero: {
        flexDirection: 'row',
        gap: 3,
        marginVertical: 6
    },
    reviewCountHero: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 11,
        color: '#94A3B8',
    },
    statsDetails: {
        flex: 1,
        paddingLeft: 24,
        gap: 14
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    statLabelText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 11,
        color: '#1A1A1A',
        width: 30
    },
    barContainer: {
        flex: 1,
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: '#1A1A1A'
    },
    statValueText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'right',
        width: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 15
    },
    sectionTitle: {
        fontFamily: 'Syne_700Bold',
        fontSize: 20,
        color: '#1A1A1A'
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#F1F5F9'
    },
    reviewCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
    },
    reviewMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 15, // Squircle look
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontFamily: 'Syne_700Bold',
        fontSize: 18,
        color: '#1A1A1A'
    },
    reviewerName: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 15,
        color: '#1A1A1A'
    },
    reviewDate: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2
    },
    cardStars: {
        flexDirection: 'row',
        gap: 2,
        backgroundColor: '#FBFBF9',
        padding: 4,
        borderRadius: 6
    },
    commentContainer: {
        position: 'relative',
        marginTop: 8,
        paddingTop: 8,
        paddingLeft: 4,
    },
    quoteIcon: {
        position: 'absolute',
        top: -4,
        left: -4,
        opacity: 0.6,
    },
    commentText: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    emptyTitle: {
        fontFamily: 'Syne_700Bold',
        fontSize: 22,
        color: '#1A1A1A',
        marginBottom: 8
    },
    emptySubtitle: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 22
    }
});

export default BarberReviewsScreen;