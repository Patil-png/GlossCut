import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  Dimensions,
  ActivityIndicator,
  Vibration,
  Platform,
  Easing
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from "../utils/api";
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, Check, AlertCircle, Info, Lock, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- 1. PREMIUM CARD COMPONENT ---
const PremiumCard = React.memo(({ item, isSelected, isDisabled, theme, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        if (Platform.OS === 'android') Vibration.vibrate(15);
        onPress(item);
      }}
      disabled={isDisabled}
      activeOpacity={1}
      style={{ marginBottom: 16 }}
    >
      <Animated.View style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.card,
          transform: [{ scale: scaleAnim }],
          borderColor: isSelected ? theme.colors.primary : 'transparent',
          borderWidth: 2,
          shadowColor: isSelected ? theme.colors.primary : "#000",
          shadowOpacity: isSelected ? 0.2 : 0.05,
        }
      ]}>
        <View style={styles.cardInner}>
          <Text style={[
            styles.cardTitle,
            {
              color: theme.colors.text,
              fontWeight: isSelected ? '700' : '600',
              opacity: isDisabled ? 0.5 : 1
            }
          ]}>{item}</Text>

          <View style={[
            styles.radioCircle,
            {
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              backgroundColor: isSelected ? theme.colors.primary : 'transparent'
            }
          ]}>
            {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const EditCategoryScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { updateProfile } = useAuth();
  const { currentCategory } = route.params || {};

  // State
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [listingConfirmed, setListingConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 2. ALERT SYSTEM ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'error', onConfirm: null
  });
  const slideAnim = useRef(new Animated.Value(-200)).current;

  const showAlert = useCallback((title, message, type = 'error', onConfirm = null) => {
    if (type === 'error') Vibration.vibrate([0, 50, 50, 50]);
    setAlertConfig({ visible: true, title, message, type, onConfirm });

    // Position alert exactly below our custom header
    const dropPosition = insets.top + 65;

    Animated.spring(slideAnim, {
      toValue: dropPosition,
      useNativeDriver: true,
      friction: 8,
      tension: 60
    }).start();

    if (type !== 'confirm') setTimeout(hideAlert, 3500);
  }, [insets.top]);

  const hideAlert = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setAlertConfig(prev => ({ ...prev, visible: false })));
  }, []);

  // --- DATA LOGIC ---
  useEffect(() => {
    const checkOwnership = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/shop/my-shop', {
          timeout: 8000
        });
        if (res.data && res.data.isMainOwner) {
          setSelectedCategory(res.data.category);
          setListingConfirmed(res.data.listingConfirmed);
        } else {
          showAlert('Access Denied', 'Only main shop owner can edit.', 'error');
        }
      } catch (err) {
        showAlert('Connection Error', 'Could not sync shop details.', 'error');
      } finally {
        setLoading(false);
      }
    };
    checkOwnership();
  }, []);

  const handleSave = async () => {
    if (listingConfirmed) return showAlert('Locked', 'Listing is confirmed and locked.', 'error');
    try {
      const res = await api.put('/api/shop/category',
        { category: selectedCategory }
      );
      if (res.data.success) {
        showAlert('Success', 'Category updated successfully!', 'success');
        updateProfile({ shopCategory: selectedCategory });
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showAlert('Error', res.data.message || 'Update failed.', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Failed to save changes.', 'error');
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await api.put('/api/shop/confirm-listing', {});
      if (res.data.success) {
        setListingConfirmed(true);
        hideAlert();
        setTimeout(() => {
          showAlert('Verified', 'Shop listing is now live!', 'success');
          setTimeout(() => navigation.goBack(), 1500);
        }, 300);
      } else {
        showAlert('Error', res.data.message || 'Confirmation failed.', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Server error.', 'error');
    }
  };

  const getAlertTheme = (type) => {
    switch (type) {
      case 'success': return { bg: '#121212', text: '#E8F5E9', icon: '#4CAF50' };
      case 'confirm': return { bg: '#121212', text: '#E3F2FD', icon: '#2196F3' };
      default: return { bg: '#121212', text: '#FFEBEE', icon: '#F44336' };
    }
  };
  const alertTheme = getAlertTheme(alertConfig.type);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* --- FLOATING ALERT --- */}
      <Animated.View style={[
        styles.floatingAlert,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: alertTheme.bg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)'
        }
      ]}>
        <View style={styles.alertIconBubble}>
          {alertConfig.type === 'success' ? <ShieldCheck size={20} color={alertTheme.icon} /> :
            alertConfig.type === 'confirm' ? <Info size={20} color={alertTheme.icon} /> :
              <AlertCircle size={20} color={alertTheme.icon} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: '#FFF' }]}>{alertConfig.title}</Text>
          <Text style={[styles.alertMsg, { color: '#AAA' }]}>{alertConfig.message}</Text>
        </View>
        {alertConfig.type === 'confirm' && (
          <View style={styles.alertBtnGroup}>
            <TouchableOpacity onPress={hideAlert} style={styles.alertBtnSmall}>
              <Text style={{ color: '#AAA', fontSize: 12, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={[styles.alertBtnSmall, { backgroundColor: alertTheme.icon, marginLeft: 8 }]}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* --- REFINED HEADER --- */}
      <View style={{
        paddingTop: insets.top,
        backgroundColor: theme.colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        zIndex: 10
      }}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <ChevronLeft size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Category</Text>
            {listingConfirmed && (
              <View style={styles.badgeRow}>
                <ShieldCheck size={10} color={theme.colors.primary} />
                <Text style={[styles.badgeText, { color: theme.colors.primary }]}>VERIFIED</Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={listingConfirmed || loading}
              style={styles.saveBtn}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.saveText, {
                  color: listingConfirmed ? theme.colors.textSecondary : theme.colors.primary,
                  opacity: listingConfirmed ? 0.5 : 1
                }]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- CONTENT --- */}
      <View style={styles.content}>
        <View style={styles.bannerContainer}>
          <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
            What type of shop do you manage?
          </Text>
          <Text style={[styles.bannerSub, { color: theme.colors.textSecondary }]}>
            This helps us tailor the booking experience for your customers.
          </Text>
        </View>

        {loading && !selectedCategory ? (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={['Barber', "Women's Salon", 'Pet Care', 'Unisex']}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <PremiumCard
                item={item}
                isSelected={selectedCategory === item}
                isDisabled={listingConfirmed}
                theme={theme}
                onPress={!listingConfirmed ? setSelectedCategory : () => { }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* --- BOTTOM DOCK --- */}
      {!loading && (
        <View style={[
          styles.bottomDock,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: Math.max(insets.bottom, 24)
          }
        ]}>
          <View style={[styles.dockBorder, { borderTopColor: theme.colors.border }]} />

          {listingConfirmed ? (
            <View style={[styles.lockedState, { backgroundColor: theme.colors.card }]}>
              <Lock size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.lockedText, { color: theme.colors.textSecondary }]}>
                Category Locked • Verified
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
              onPress={() => {
                Vibration.vibrate(50);
                showAlert('Permanent Lock', `Lock category to "${selectedCategory}"?`, 'confirm', handleConfirm);
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Confirm Listing</Text>
              <View style={styles.btnIconBubble}>
                <Check size={18} color={theme.colors.primary} strokeWidth={3} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bannerContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  bannerSub: {
    fontSize: 15,
    lineHeight: 22,
  },
  loaderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  cardContainer: {
    borderRadius: 20,
    padding: 22,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    letterSpacing: 0.3,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 5,
  },
  dockBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    opacity: 0.5,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnIconBubble: {
    backgroundColor: '#FFF',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedState: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  lockedText: {
    fontSize: 15,
    fontWeight: '600',
  },
  floatingAlert: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  alertIconBubble: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertMsg: {
    fontSize: 13,
    lineHeight: 18,
  },
  alertBtnGroup: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  alertBtnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
});

export default EditCategoryScreen;