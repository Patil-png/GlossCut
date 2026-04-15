import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';
import { Layout } from '../src/theme/layout';

const FilterModal = ({ visible, onClose, onApplyFilters, initialFilters }) => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleSelectFilter = (category, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [category]: prevFilters[category] === value ? null : value}));
  };

  const handleClearFilters = () => {
    setFilters({
      rating: null,
      customersServed: null,
      reviews: null,
      avgAppointmentTime: null,
      sortBy: null});
  };

  const renderFilterOption = (category, value, text) => {
    const isSelected = filters[category] === value;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.filterOption,
          isSelected && styles.filterOptionSelected,
          pressed && !isSelected && styles.filterOptionPressed,
        ]}
        onPress={() => handleSelectFilter(category, value)}
      >
        <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
          {text}
        </Text>
      </Pressable>
    );
  };

  const renderSortOption = (value) => {
    const isSelected = filters.sortBy === value;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.filterOption,
          isSelected && styles.filterOptionSelected,
          pressed && !isSelected && styles.filterOptionPressed,
        ]}
        onPress={() => handleSelectFilter('sortBy', value)}
      >
        <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
          {value}
        </Text>
      </Pressable>
    );
  };

  const [activeCategory, setActiveCategory] = useState('Sort By');

  const getCategoryFilterCount = (category) => {
    let count = 0;
    if (category === 'Sort By' && filters.sortBy) count++;
    if (category === 'Rating' && filters.rating) count++;
    if (category === 'Customers Served' && filters.customersServed) count++;
    if (category === 'Number of Reviews' && filters.reviews) count++;
    if (category === 'Avg. Appointment Time' && filters.avgAppointmentTime) count++;
    return count;
  };

  const renderCategories = () => {
    const categories = ['Sort By', 'Rating', 'Customers Served', 'Number of Reviews', 'Avg. Appointment Time'];
    return categories.map(category => {
      const count = getCategoryFilterCount(category);
      return (
        <TouchableOpacity
          key={category}
          style={[styles.categoryButton, activeCategory === category ? styles.categoryButtonActive : null]}
          onPress={() => setActiveCategory(category)}
        >
          <Text style={styles.categoryText}>{category}</Text>
          {count > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  const renderOptionsForCategory = () => {
    switch (activeCategory) {
      case 'Sort By':
        return (
          <View style={styles.filterOptions}>
            {renderSortOption('Rating')}
            {renderSortOption('Customers Served')}
            {renderSortOption('Number of Reviews')}
            {renderSortOption('Avg. Appointment Time')}
          </View>
        );
      case 'Rating':
        return (
          <View style={styles.filterOptions}>
            {renderFilterOption('rating', 4.5, '4.5+')}
            {renderFilterOption('rating', 4.0, '4.0+')}
            {renderFilterOption('rating', 3.5, '3.5+')}
            {renderFilterOption('rating', 3.0, '3.0+')}
            {renderFilterOption('rating', 0, 'All')}
          </View>
        );
      case 'Customers Served':
        return (
          <View style={styles.filterOptions}>
            {renderFilterOption('customersServed', 1000, '1000+')}
            {renderFilterOption('customersServed', 500, '500+')}
            {renderFilterOption('customersServed', 100, '100+')}
          </View>
        );
      case 'Number of Reviews':
        return (
          <View style={styles.filterOptions}>
            {renderFilterOption('reviews', 200, '200+')}
            {renderFilterOption('reviews', 100, '100+')}
            {renderFilterOption('reviews', 50, '50+')}
          </View>
        );
      case 'Avg. Appointment Time':
        return (
          <View style={styles.filterOptions}>
            {renderFilterOption('avgAppointmentTime', 'Under 30 min', 'Under 30 min')}
            {renderFilterOption('avgAppointmentTime', '30-60 min', '30-60 min')}
            {renderFilterOption('avgAppointmentTime', 'Over 60 min', 'Over 60 min')}
          </View>
        );
      default:
        return null;
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(20,20,20,0.35)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: Colors.BG_CARD,
          borderTopLeftRadius: Layout.radiusSheet,
          borderTopRightRadius: Layout.radiusSheet,
          borderWidth: 0.5,
          borderColor: Colors.BORDER_CARD,
          overflow: 'hidden',
          ...Layout.noShadow,
        },
        handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
        handle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: Colors.DIVIDER,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Layout.screenPadding,
          paddingTop: 8,
          paddingBottom: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: Colors.DIVIDER,
        },
        headerTitle: {
          ...Typography.APP_BAR_TITLE,
        },
        textButton: {
          paddingVertical: 10,
          paddingHorizontal: 8,
        },
        clearText: {
          ...Typography.SMALL_LABEL,
          color: Colors.TEXT_SECONDARY,
        },
        closeBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.BG_HOVER,
          alignItems: 'center',
          justifyContent: 'center',
        },
        contentContainer: { flexDirection: 'row', minHeight: 360 },
        categoriesContainer: {
          width: 150,
          backgroundColor: Colors.BG_PAGE,
          borderRightWidth: 0.5,
          borderRightColor: Colors.DIVIDER,
        },
        categoryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          paddingHorizontal: 14,
        },
        categoryButtonActive: {
          backgroundColor: Colors.BG_CARD,
        },
        categoryText: {
          ...Typography.BODY,
          fontFamily: 'DMSans_500Medium',
          color: Colors.TEXT_PRIMARY,
          fontSize: 12,
        },
        filterCountBadge: {
          backgroundColor: Colors.CTA_BUTTON,
          borderRadius: 5,
          paddingHorizontal: 5,
          paddingVertical: 2,
          minWidth: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        filterCountText: {
          ...Typography.MICRO_LABEL,
          fontFamily: 'DMSans_700Bold',
          color: Colors.TEXT_ON_DARK,
        },
        optionsContainer: { flex: 1, padding: Layout.cardPadding },
        filterOptions: { flexDirection: 'row', flexWrap: 'wrap' },
        filterOption: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: Layout.radiusTag,
          borderWidth: 0.5,
          borderColor: Colors.BORDER_INPUT,
          backgroundColor: Colors.BG_CARD,
          marginRight: Layout.tagGap,
          marginBottom: Layout.tagGap,
        },
        filterOptionPressed: {
          backgroundColor: Colors.BG_HOVER,
        },
        filterOptionSelected: {
          backgroundColor: Colors.CTA_BUTTON,
          borderColor: Colors.CTA_BUTTON,
        },
        filterOptionText: {
          ...Typography.TAG_BADGE,
          color: Colors.TEXT_SECONDARY,
        },
        filterOptionTextSelected: {
          color: Colors.TEXT_ON_DARK,
        },
        footer: {
          padding: Layout.screenPadding,
          borderTopWidth: 0.5,
          borderTopColor: Colors.DIVIDER,
          backgroundColor: Colors.BG_CARD,
        },
        applyButton: {
          height: 52,
          borderRadius: Layout.radiusButton,
          backgroundColor: Colors.CTA_BUTTON,
          alignItems: 'center',
          justifyContent: 'center',
        },
        applyButtonPressed: {
          backgroundColor: Colors.CTA_PRESSED,
          transform: [{ scale: 0.97 }],
        },
        applyButtonText: {
          ...Typography.BUTTON,
        },
      }),
    []
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={handleClearFilters} style={styles.textButton} activeOpacity={0.85}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.85}>
              <X size={18} color={Colors.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.categoriesContainer}>{renderCategories()}</View>
            <View style={styles.optionsContainer}>{renderOptionsForCategory()}</View>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => onApplyFilters(filters)}
              style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default FilterModal;
