import { Drawer } from 'expo-router/drawer';
import { DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity, Text, View, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

import { useRef, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { SecurityService } from '../../services/SecurityService';

export default function AppLayout() {
    const { logout, admin } = useAuth();
    const appState = useRef(AppState.currentState);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground!
                setIsLocked(true);
                const authenticated = await SecurityService.authenticateBiometrics();
                if (authenticated) {
                    setIsLocked(false);
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleUnlock = async () => {
        const authenticated = await SecurityService.authenticateBiometrics();
        if (authenticated) {
            setIsLocked(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Drawer
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#4F46E5',
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: '900',
                        fontSize: 16,
                        letterSpacing: 0.5,
                    },
                    drawerActiveTintColor: '#4F46E5',
                    drawerInactiveTintColor: '#64748b',
                    drawerActiveBackgroundColor: '#f5f7ff',
                    drawerLabelStyle: {
                        marginLeft: -10,
                        fontWeight: '800',
                        fontSize: 13,
                    },
                    drawerItemStyle: {
                        borderRadius: 12,
                        marginHorizontal: 12,
                        paddingHorizontal: 4,
                    },
                    drawerType: 'slide',
                }}
                drawerContent={(props) => {
                    return (
                        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                            {/* Premium Header */}
                            <LinearGradient
                                colors={['#4F46E5', '#6366F1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="pt-12 pb-8 px-6 rounded-br-[40px]"
                            >
                                <View className="flex-row items-center mb-6">
                                    <View className="h-16 w-16 bg-white/20 rounded-2xl items-center justify-center border border-white/30 backdrop-blur-md">
                                        <Text className="text-2xl text-white font-black">
                                            {admin?.email?.charAt(0).toUpperCase() || 'A'}
                                        </Text>
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <View className="bg-white/20 self-start px-2 py-0.5 rounded-full mb-1">
                                            <Text className="text-[8px] text-white font-black uppercase tracking-widest">Super Admin</Text>
                                        </View>
                                        <Text className="text-xl font-black text-white leading-tight">Admin Portal</Text>
                                        <Text className="text-xs text-indigo-100 font-medium opacity-80" numberOfLines={1}>{admin?.email}</Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center bg-white/10 p-3 rounded-2xl border border-white/10">
                                    <View className="items-center flex-1 border-r border-white/10">
                                        <Text className="text-white text-[10px] font-bold uppercase opacity-60">Status</Text>
                                        <View className="flex-row items-center mt-0.5">
                                            <View className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5" />
                                            <Text className="text-white text-xs font-black">Online</Text>
                                        </View>
                                    </View>
                                    <View className="items-center flex-1">
                                        <Text className="text-white text-[10px] font-bold uppercase opacity-60">Region</Text>
                                        <Text className="text-white text-xs font-black mt-0.5">India</Text>
                                    </View>
                                </View>
                            </LinearGradient>

                            <ScrollView
                                contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <DrawerItemList {...props} />
                            </ScrollView>

                            {/* Polished Footer */}
                            <View className="p-4 border-t border-gray-50">
                                <TouchableOpacity
                                    onPress={logout}
                                    className="flex-row items-center bg-red-50 p-4 rounded-2xl border border-red-100"
                                >
                                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-3 shadow-sm">
                                        <Ionicons name="log-out" size={20} color="#EF4444" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-red-500 font-black text-sm">Logout Session</Text>
                                        <Text className="text-red-400 text-[10px] font-bold">End active administration</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
                                </TouchableOpacity>
                                <View className="mt-4 items-center">
                                    <Text className="text-gray-300 text-[10px] font-black uppercase tracking-[2px]">Glosscut Admin v2.1.0</Text>
                                </View>
                            </View>
                        </SafeAreaView>
                    );
                }}
            >
                <Drawer.Screen
                    name="index"
                    options={{
                        drawerLabel: 'Overview',
                        title: 'Overview',
                        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="users"
                    options={{
                        drawerLabel: 'Users',
                        title: 'Users Management',
                        drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="shops"
                    options={{
                        drawerLabel: 'Shops & QR',
                        title: 'Shops Management',
                        drawerIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="bookings"
                    options={{
                        drawerLabel: 'Bookings',
                        title: 'Bookings',
                        drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="ads"
                    options={{
                        drawerLabel: 'Ads & Tiers',
                        title: 'Ads & Listing Tiers',
                        drawerIcon: ({ color, size }) => <Ionicons name="megaphone-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="services"
                    options={{
                        drawerLabel: 'Services',
                        title: 'Services',
                        drawerIcon: ({ color, size }) => <Ionicons name="cut-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="reviews"
                    options={{
                        drawerLabel: 'Reviews',
                        title: 'Reviews',
                        drawerIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="deals"
                    options={{
                        drawerLabel: 'Deals',
                        title: 'Deals & Offers',
                        drawerIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="earnings"
                    options={{
                        drawerLabel: 'Earnings',
                        title: 'Earnings Analytics',
                        drawerIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="chat"
                    options={{
                        drawerLabel: 'Live Chat',
                        title: 'Live Chat',
                        drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="subscriptions"
                    options={{
                        drawerLabel: 'Subscriptions',
                        title: 'Subscription Plans',
                        drawerIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="qr-analytics"
                    options={{
                        drawerLabel: 'QR Analytics',
                        title: 'QR Standee Analytics',
                        drawerIcon: ({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="audit-logs"
                    options={{
                        drawerLabel: 'Audit Logs',
                        title: 'System Audit Logs',
                        drawerIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="approvals"
                    options={{
                        drawerLabel: 'Approvals',
                        title: 'Approvals',
                        drawerIcon: ({ color, size }) => <Ionicons name="checkmark-done-circle-outline" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen
                    name="settings"
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings',
                        drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
                    }}
                />
            </Drawer>

            {/* Lock Screen Overlay */}
            {isLocked && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    backgroundColor: '#0F172A',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <LinearGradient
                        colors={['#0F172A', '#1E293B']}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />
                    <View className="items-center">
                        <View className="h-24 w-24 bg-indigo-500/20 rounded-full items-center justify-center mb-8 border border-indigo-500/30">
                            <Ionicons name="lock-closed" size={48} color="#818CF8" />
                        </View>
                        <Text className="text-white text-3xl font-black mb-2">App Locked</Text>
                        <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-12">Security Protocol Active</Text>

                        <TouchableOpacity
                            onPress={handleUnlock}
                            className="bg-indigo-600 px-8 py-4 rounded-2xl flex-row items-center border border-indigo-400 shadow-lg shadow-indigo-500/50"
                        >
                            <Ionicons name="finger-print" size={24} color="white" style={{ marginRight: 12 }} />
                            <Text className="text-white font-black uppercase tracking-widest">Unlock Session</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}
