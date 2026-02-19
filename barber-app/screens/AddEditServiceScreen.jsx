import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  SectionList,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft,
  Tag,
  IndianRupee,
  Clock,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  X,
  Scissors,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';

// ─── Category accent colours ─────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Hair': '#6366F1',
  'Beard': '#F59E0B',
  'Skin': '#10B981',
  'Color': '#EC4899',
  'Shave': '#3B82F6',
  'Kids': '#8B5CF6',
  'Eyebrow': '#14B8A6',
  'Massage': '#F97316',
  'General': '#64748B',
  'Other': '#64748B',
};

const getCategoryColor = (cat) =>
  CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];

// ─── Collapsible Category Section Header ─────────────────────────────────────
const CategoryHeader = ({ title, count, selectedCount, isOpen, onPress }) => {
  const color = getCategoryColor(title);
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.catHeader}>
      <View style={[styles.catDot, { backgroundColor: color }]} />
      <Text style={[styles.catTitle, { color }]}>{title}</Text>
      <View style={[styles.catCountBadge, { backgroundColor: color + '18' }]}>
        <Text style={[styles.catCountText, { color }]}>{count}</Text>
      </View>
      {selectedCount > 0 && (
        <View style={[styles.catSelectedBadge, { backgroundColor: color }]}>
          <Text style={styles.catSelectedText}>✓ {selectedCount}</Text>
        </View>
      )}
      <Animated.View style={{ transform: [{ rotate }], marginLeft: 'auto' }}>
        <ChevronRight size={18} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Service Row ──────────────────────────────────────────────────────────────
const ServiceRow = ({ item, isSelected, onPress }) => {
  const color = getCategoryColor(item.category);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.serviceRow,
        isSelected && { backgroundColor: color + '12', borderColor: color },
      ]}
    >
      <View style={styles.serviceRowLeft}>
        <Text style={styles.serviceRowName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.serviceRowDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.serviceRowCheck,
          { borderColor: isSelected ? color : '#D1D5DB', backgroundColor: isSelected ? color : 'transparent' },
        ]}
      >
        {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AddEditServiceScreen = ({ route, navigation }) => {
  const { theme, isDark } = useTheme();
  const { service, shopId } = route.params;

  const [availableServices, setAvailableServices] = useState([]);
  const [selectedService, setSelectedService] = useState(service?.serviceId || null);
  const [price, setPrice] = useState(service?.price || '');
  const [time, setTime] = useState(service?.time || '');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // Which categories are open in the accordion
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  const fetchAvailableServices = async () => {
    try {
      const res = await api.get('/api/barber-card/services');
      const data = res.data || [];
      setAvailableServices(data);

      // Auto-open all categories on first load
      const cats = {};
      data.forEach((s) => {
        const cat = s.category || 'General';
        cats[cat] = true;
      });
      setOpenCategories(cats);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Group services by category, with search filter ───────────────────────
  const groupedSections = useMemo(() => {
    const filtered = availableServices.filter((s) => {
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });

    const map = {};
    filtered.forEach((s) => {
      const cat = s.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });

    return Object.entries(map).map(([title, data]) => ({ title, data }));
  }, [availableServices, searchText]);

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSave = async () => {
    if (!selectedService) {
      alert('Please select a service');
      return;
    }

    const selectedServiceData = availableServices.find((s) => s._id === selectedService);
    const serviceToSave = {
      ...service,
      serviceId: selectedService,
      name: selectedServiceData.name,
      price,
      time: time.replace(/[^0-9]/g, ''),
    };

    try {
      const barberCardRes = await api.get('/api/barber-card/my-card');
      const barberCard = barberCardRes.data;
      const services = barberCard.services || [];
      let updatedServices;
      if (serviceToSave.id) {
        updatedServices = services.map((s) => (s.id === serviceToSave.id ? serviceToSave : s));
      } else {
        updatedServices = [...services, { ...serviceToSave, id: Date.now().toString() }];
      }
      await api.put('/api/barber-card', { services: updatedServices });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save service', err);
    }
  };

  const selectedServiceObj = availableServices.find((s) => s._id === selectedService);
  const selectedCatColor = selectedServiceObj ? getCategoryColor(selectedServiceObj.category || 'General') : theme.colors.primary;

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {service ? 'Edit Service' : 'Add Service'}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>Loading services…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {service ? 'Edit Service' : 'Add Service'}
        </Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

        {/* SERVICE SELECTOR */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>SELECT SERVICE</Text>
        <TouchableOpacity
          style={[
            styles.selectorCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: selectedService ? selectedCatColor : theme.colors.border,
            },
          ]}
          onPress={() => setShowServiceModal(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.selectorIcon, { backgroundColor: selectedCatColor + '18' }]}>
            <Scissors size={18} color={selectedCatColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.selectorMainText, { color: selectedService ? theme.colors.text : '#9E9E9E' }]}>
              {selectedServiceObj ? selectedServiceObj.name : 'Tap to choose a service'}
            </Text>
            {selectedServiceObj?.category && (
              <Text style={[styles.selectorSubText, { color: selectedCatColor }]}>
                {selectedServiceObj.category}
              </Text>
            )}
          </View>
          <ChevronDown size={20} color={selectedCatColor} />
        </TouchableOpacity>

        {/* PRICE */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>YOUR PRICE (₹)</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <IndianRupee color={theme.colors.primary} size={20} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 300"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
          />
        </View>

        {/* TIME */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>AVERAGE TIME (MINUTES)</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Clock color={theme.colors.primary} size={20} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 30"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
          />
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={{ marginBottom: 50 }}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary || theme.colors.primary]}
            style={styles.saveButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.saveButtonText}>SAVE SERVICE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ── SERVICE SELECTION MODAL ── */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>

            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Select Service
                </Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {availableServices.length} services in {groupedSections.length} categories
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowServiceModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
              >
                <X size={18} color={isDark ? '#CBD5E1' : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#0F172A' : '#FFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <Search size={16} color={isDark ? '#64748B' : '#94A3B8'} />
              <TextInput
                style={[styles.searchInput, { color: isDark ? '#F1F5F9' : '#1E293B' }]}
                placeholder="Search services…"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <X size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category-Grouped SectionList */}
            <SectionList
              sections={groupedSections}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section: { title, data } }) => {
                const color = getCategoryColor(title);
                const isOpen = openCategories[title] !== false;
                const selectedCount = data.filter((s) => s._id === selectedService).length;
                return (
                  <CategoryHeader
                    title={title}
                    count={data.length}
                    selectedCount={selectedCount}
                    isOpen={isOpen}
                    onPress={() => toggleCategory(title)}
                  />
                );
              }}
              renderItem={({ item, section }) => {
                if (openCategories[section.title] === false) return null;
                const isSelected = selectedService === item._id;
                return (
                  <ServiceRow
                    item={item}
                    isSelected={isSelected}
                    onPress={() => {
                      setSelectedService(item._id);
                      setShowServiceModal(false);
                    }}
                  />
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    No services match your search.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  form: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
    marginLeft: 2,
  },

  // Service Selector Card
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 28,
  },
  selectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorMainText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectorSubText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    marginLeft: 12,
    fontWeight: '500',
  },

  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  // Category header
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  catCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catSelectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catSelectedText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Service row
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  serviceRowLeft: { flex: 1, marginRight: 12 },
  serviceRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  serviceRowDesc: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  serviceRowCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, fontWeight: '500' },
});

export default AddEditServiceScreen;
