import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { X } from 'lucide-react-native';

const FilterModal = ({ visible, onClose, onApplyFilters, initialFilters }) => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleSelectFilter = (category, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [category]: prevFilters[category] === value ? null : value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      rating: null,
      customersServed: null,
      reviews: null,
      avgAppointmentTime: null,
      sortBy: null,
    });
  };

  const renderFilterOption = (category, value, text) => {
    const isSelected = filters[category] === value;
    return (
      <TouchableOpacity
        style={[styles.filterOption, isSelected ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : { borderColor: theme.colors.border }]}
        onPress={() => handleSelectFilter(category, value)}
      >
        <Text style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.text }}>{text}</Text>
      </TouchableOpacity>
    );
  };

  const renderSortOption = (value) => {
    const isSelected = filters.sortBy === value;
    return (
      <TouchableOpacity
        style={[styles.filterOption, isSelected ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : { borderColor: theme.colors.border }]}
        onPress={() => handleSelectFilter('sortBy', value)}
      >
        <Text style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.text }}>{value}</Text>
      </TouchableOpacity>
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
          style={[styles.categoryButton, activeCategory === category ? { backgroundColor: theme.colors.card } : {}]}
          onPress={() => setActiveCategory(category)}
        >
          <Text style={[styles.categoryText, { color: theme.colors.text }]}>{category}</Text>
          {count > 0 && <View style={styles.filterCountBadge}><Text style={styles.filterCountText}>{count}</Text></View>}
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

  const getStyles = (currentTheme) => StyleSheet.create({
    modalContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    clearButton: {
      fontSize: 16,
      fontWeight: '500',
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    categoriesContainer: {
      width: 140,
      backgroundColor: currentTheme.colors.background,
      borderRightWidth: 1,
      borderRightColor: currentTheme.colors.border,
    },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterCountBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
    optionsContainer: {
      flex: 1,
      padding: 25,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterOption: {
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 30,
      borderWidth: 1,
      marginRight: 15,
      marginBottom: 15,
    },
    applyButton: {
      margin: 16,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
    },
    applyButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  const styles = getStyles(theme);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={[styles.clearButton, { color: theme.colors.primary }]}>Clear Filters</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.categoriesContainer}>
            {renderCategories()}
          </View>
          <View style={styles.optionsContainer}>
            {renderOptionsForCategory()}
          </View>
        </View>
        <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.colors.primary }]} onPress={() => onApplyFilters(filters)}>
          <Text style={[styles.applyButtonText, { color: theme.colors.onPrimary }]}>Apply Filters</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

export default FilterModal;
