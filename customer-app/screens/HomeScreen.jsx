import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import {
  Search,
  Bell,
  MapPin,
  ChevronRight,
  Zap,
  Scissors,
  Sparkles,
  Dog,
  Bot,
  Leaf,
  Baby,
  Calendar,
  Heart,
  Wand2,
} from "lucide-react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';
import PromoCard from '../src/components/PromoCard';
import ServiceChip from '../src/components/ServiceChip';
import SalonCard from '../src/components/SalonCard';
import QuickActionRow from '../src/components/QuickActionRow';
import BottomNav from '../src/components/BottomNav';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [nearbyShops, setNearbyShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    { id: 'All', title: 'All', Icon: null, variant: 'white' },
    { id: 'Barber', title: 'Barbers', Icon: Scissors, variant: 'lime' },
    { id: 'Women', title: 'Women', Icon: Sparkles, variant: 'pink' },
    { id: 'Pets', title: 'Pets', Icon: Dog, variant: 'green' },
    { id: 'AI', title: 'AI Style', Icon: Bot, variant: 'blue' },
    { id: 'Spa', title: 'Spa', Icon: Leaf, variant: 'purple' },
    { id: 'Kids', title: 'Kids', Icon: Baby, variant: 'orange' },
  ];

  // Logic from old HomeScreen kept for data fetching
  const fetchNearbyShops = async (lat, lng) => {
    try {
      setLoadingShops(true);
      const res = await api.get("/api/shop/all");
      if (Array.isArray(res.data)) {
        const approved = res.data.filter(s => s.approvalStatus === "approved");
        setNearbyShops(approved);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    fetchNearbyShops(20.9136, 77.768);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.LIME_PRIMARY} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HERO HEADER */}
        <View style={styles.heroHeader}>
          <View style={styles.headerRow}>
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.[0] || 'B'}</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'Bhagyashree'} 👋</Text>
                <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate("MapScreen")}>
                  <View style={styles.statusDot} />
                  <Text style={styles.locationText}>Amravati, Maharashtra ›</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate("Notifications")}>
              <Bell size={20} color={Colors.CHARCOAL} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.coinsBadge}>
            <Zap size={14} color={Colors.LIME_PRIMARY} fill={Colors.LIME_PRIMARY} />
            <Text style={styles.coinsText}>1,240 Coins</Text>
          </View>

          <TouchableOpacity style={styles.searchBar} activeOpacity={0.9} onPress={() => navigation.navigate("BarberSearch")}>
            <Search size={18} color="rgba(0,0,0,0.35)" strokeWidth={2.5} />
            <Text style={styles.searchPlaceholder}>Find your style...</Text>
            <TouchableOpacity style={styles.micBtn}>
              <View style={styles.micIcon} />
              <Text style={{color: Colors.LIME_PRIMARY, fontWeight: '900'}}>●</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* PROMO SECTION */}
        <View style={{ marginTop: 20 }}>
          <PromoCard 
            title="+ FREE Service"
            discount="50%"
            subtext="Only for new bookings today"
            onClaim={() => {}}
          />
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={Typography.SECTION_HEADER}>Categories</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
          >
            {categories.map(cat => (
              <ServiceChip 
                key={cat.id} 
                title={cat.title} 
                Icon={cat.Icon} 
                active={activeCategory === cat.id}
                onPress={() => setActiveCategory(cat.id)}
                colorVariant={cat.variant}
              />
            ))}
          </ScrollView>
        </View>

        {/* TOP RATED */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={Typography.SECTION_HEADER}>Top Rated Salons</Text>
            <TouchableOpacity onPress={() => navigation.navigate("BarberSearch")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={nearbyShops}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
            renderItem={({ item }) => (
              <SalonCard 
                name={item.name}
                address={item.address || "Prakruti Heritage, Amravati"}
                rating={item.rating || 4.8}
                image={item.image}
                isAvailable={true}
                onPress={() => navigation.navigate("Booking", { shop: item })}
              />
            )}
            keyExtractor={item => item._id}
          />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={Typography.SECTION_HEADER}>Quick Actions</Text>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <QuickActionRow 
              title="My Bookings"
              subtitle="Check your upcoming slots"
              Icon={Calendar}
              iconBg={Colors.LIME_PRIMARY}
              iconColor={Colors.TEXT_ON_LIME}
              onPress={() => navigation.navigate("History")}
            />
            <QuickActionRow 
              title="Favourites"
              subtitle="Salons you love"
              Icon={Heart}
              iconBg="#FFF0F0"
              iconColor={Colors.DANGER}
              onPress={() => navigation.navigate("LikedBarbers")}
            />
            <QuickActionRow 
              title="AI Style Suggestor"
              subtitle="Find your perfect look"
              Icon={Wand2}
              iconBg={Colors.CHARCOAL}
              iconColor={Colors.LIME_PRIMARY}
              hasBadge={true}
              onPress={() => navigation.navigate("FaceSuggestor")}
            />
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav activeTab="Home" onTabPress={(tab) => navigation.navigate(tab === 'Home' ? 'Home' : tab === 'Search' ? 'BarberSearch' : tab)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_PAGE,
  },
  heroHeader: {
    backgroundColor: Colors.LIME_PRIMARY,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.CHARCOAL,
    backgroundColor: Colors.BG_CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.FONT_BLACK,
    fontSize: 14,
    color: Colors.CHARCOAL,
  },
  greeting: {
    ...Typography.FONT_BLACK,
    fontSize: 20,
    color: Colors.CHARCOAL,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.DANGER,
  },
  locationText: {
    ...Typography.FONT_SEMI,
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
  },
  bellBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  coinsText: {
    ...Typography.FONT_BOLD,
    fontSize: 12,
    color: Colors.LIME_ON_DARK,
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchPlaceholder: {
    ...Typography.FONT_MED,
    fontSize: 13,
    color: 'rgba(0,0,0,0.3)',
    flex: 1,
  },
  micBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.CHARCOAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  seeAll: {
    ...Typography.FONT_BOLD,
    fontSize: 11,
    color: Colors.LIME_DEEP,
  }
});

export default HomeScreen;
