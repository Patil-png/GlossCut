import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { ArrowLeft, Search, Star, Clock, MapPin, Tag, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { salonsData } from '../data/salons.js';
import LottieView from 'lottie-react-native';

const WomenSalonSearchScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 2 : 1;

  const { forFriend } = route.params || {};
  const { theme } = useTheme();
  const [showLottie, setShowLottie] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState('Rating');
  const [filteredSalons, setFilteredSalons] = useState([]);

  useEffect(() => {
    if (!showLottie) {
      setFilteredSalons([...salonsData].sort((a, b) => b.rating - a.rating));
    } else {
        setTimeout(() => {
            setShowLottie(false);
        }, 2000); // Animation duration
    }
  }, [showLottie]);

  // Refined sorting logic
  const performSortAndFilter = (query, sortOption) => {
    let list = [...salonsData];

    // 1. Filter
    if (query) {
      list = list.filter(salon =>
        salon.name.toLowerCase().includes(query.toLowerCase()) ||
        salon.address.toLowerCase().includes(query.toLowerCase())
      );
    }

    // 2. Sort
    switch (sortOption) {
      case 'Rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'Customers Served':
        list.sort((a, b) => b.customersServed - a.customersServed);
        break;
      case 'Number of Reviews':
        list.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'Number of Services':
        list.sort((a, b) => b.totalServices - a.totalServices);
        break;
      case 'Avg. Appointment Time':
        // Sort by shortest time
        list.sort((a, b) => parseInt(a.avgAppointmentTime) - parseInt(b.avgAppointmentTime));
        break;
      default:
        list.sort((a, b) => b.rating - a.rating);
    }
    setFilteredSalons(list);
  };

  const handleSort = (sortOption) => {
    setActiveSort(sortOption);
    performSortAndFilter(searchQuery, sortOption);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    performSortAndFilter(query, activeSort);
  };

  const renderSalonItem = ({ item }) => (
    // Zomato cards are typically plain white with strong images and shadows
    <TouchableOpacity onPress={() => navigation.navigate('Booking', { salonId: item.id, forFriend })}>
    <View style={styles.salonCard}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.salonImage} />
        {/* Zomato-style Rating Badge */}
        <View style={styles.ratingBadge}>
            <Star size={12} color="#fff" fill="#fff" />
            <Text style={styles.ratingBadgeText}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.salonInfo}>
        <Text style={[styles.salonName, { color: theme.colors.text }]}>{item.name}</Text>
        
        {/* Secondary Info: Tag, Listing Tier and Address */}
        <View style={styles.secondaryInfoRow}>
            <Text style={styles.tagText}>{item.tag}</Text>
            {item.listingTier && (
              <>
                <Zap size={12} color={theme.colors.textSecondary} style={{marginLeft: 10}} />
                <Text style={styles.listingTierText}>{item.listingTier}</Text>
              </>
            )}
            <MapPin size={12} color={theme.colors.textSecondary} style={{marginLeft: 10}} />
            <Text style={styles.addressText}>{item.address}</Text>
        </View>

        {/* Tertiary Info: Reviews and Time */}
        <View style={styles.tertiaryInfoRow}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Avg. {item.avgAppointmentTime}</Text>
            <Text style={styles.separator}>|</Text>
            <Text style={styles.detailText}>{item.reviews} Reviews</Text>
            <Text style={styles.separator}>|</Text>
            <Text style={styles.detailText}>{item.totalServices} Services</Text>
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );

  const getStyles = (currentTheme) => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 35,
      borderBottomWidth: 0, // Keep it clean
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 10,
      borderRadius: 10,
      paddingHorizontal: 15,
      backgroundColor: currentTheme.colors.card,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: currentTheme.colors.text,
    },
    // --- Zomato style: Filters below search, highly scannable ---
    filterBarContainer: {
        paddingVertical: 8,
        paddingLeft: 16,
        borderBottomWidth: 0,
        backgroundColor: currentTheme.colors.background,
    },
    sortOption: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8, // More squared corners for options
      borderWidth: 1.5,
      borderColor: currentTheme.colors.border,
      marginRight: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sortOptionText: {
      fontSize: 13,
      fontWeight: '600',
    },
    salonsList: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: '#f8f8f8', // Very light off-white background
    },
    // --- Zomato Card Design ---
    salonCard: {
      backgroundColor: '#fff',
      borderRadius: 10,
      marginBottom: 15,
      overflow: 'hidden', // Crucial for image corners
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, // Subtle, wide shadow
      shadowRadius: 10,
      elevation: 5,
    },
    imageContainer: {
        height: 150, // Tall image is the hero
        width: '100%',
        position: 'relative',
    },
    salonImage: {
      width: '100%',
      height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#006600', // Zomato-style green/dark color
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    ratingBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    salonInfo: {
      padding: 12,
    },
    salonName: {
      fontSize: 18,
      fontWeight: '700', // Strong name
      marginBottom: 6,
    },
    secondaryInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#e23744', // Zomato red accent color
        borderWidth: 1,
        borderColor: '#f2999f',
        backgroundColor: '#fee6e8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    addressText: {
        fontSize: 13,
        color: currentTheme.colors.textSecondary,
        marginLeft: 4,
        fontWeight: '500',
    },
    tertiaryInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    animationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 13,
        color: currentTheme.colors.textSecondary,
        marginLeft: 4,
    },
    separator: {
        color: currentTheme.colors.textSecondary,
        marginHorizontal: 8,
    },
    listingTierText: {
      fontSize: 13,
      color: currentTheme.colors.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
    }
  });

  const styles = getStyles(theme);

  const sortOptions = [
    { label: 'Rating', value: 'Rating' },
    { label: 'Total Reviews', value: 'Number of Reviews' },
    { label: 'Average Time', value: 'Avg. Appointment Time' },
    { label: 'Number of Services Provided', value: 'Number of Services' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Women's Salons Near You</Text>
      </View>

      {/* Search Input - Clean and prominent */}
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by salon name or area..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Sort Options - Minimalist filter bar */}
      <View style={styles.filterBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                { borderColor: activeSort === option.value ? theme.colors.primary : theme.colors.border },
                activeSort === option.value ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card },
              ]}
              onPress={() => handleSort(option.value)}
            >
              {activeSort === option.value && <Tag size={12} color={theme.colors.onPrimary} style={{marginRight: 4}} />}
              <Text style={[styles.sortOptionText, activeSort === option.value ? { color: theme.colors.onPrimary } : { color: theme.colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Salon List / Animation Container */}
      <View style={{ flex: 1 }}>
        {showLottie ? (
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../assets/Employee Search.json')}
              autoPlay
              loop={false}
              onAnimationFinish={() => setShowLottie(false)}
              style={{ width: 300, height: 300 }} // Adjust size as needed
            />
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={filteredSalons}
            renderItem={renderSalonItem}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between', paddingHorizontal: 16 } : null}
            contentContainerStyle={styles.salonsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default WomenSalonSearchScreen;
