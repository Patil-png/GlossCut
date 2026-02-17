import { Drawer } from 'expo-router/drawer';
import { DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
    const { logout, admin } = useAuth();

    return (
        <Drawer
            screenOptions={{
                headerStyle: { backgroundColor: '#4F46E5' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                drawerActiveTintColor: '#4F46E5',
                drawerLabelStyle: { marginLeft: -10 },
            }}
            drawerContent={(props) => {
                return (
                    <SafeAreaView style={{ flex: 1 }}>
                        <View className="px-6 py-6 border-b border-gray-100 items-center">
                            <View className="h-16 w-16 bg-indigo-100 rounded-full items-center justify-center mb-3">
                                <Text className="text-2xl text-indigo-600 font-bold">
                                    {admin?.email?.charAt(0).toUpperCase() || 'A'}
                                </Text>
                            </View>
                            <Text className="text-lg font-bold text-gray-800">Admin Panel</Text>
                            <Text className="text-xs text-gray-500">{admin?.email}</Text>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingTop: 10 }}>
                            <DrawerItemList {...props} />
                        </ScrollView>

                        <View className="border-t border-gray-100 p-4">
                            <TouchableOpacity onPress={logout} className="flex-row items-center px-4 py-3">
                                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                                <Text className="ml-3 text-red-500 font-bold">Logout</Text>
                            </TouchableOpacity>
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
                name="settings"
                options={{
                    drawerLabel: 'Settings',
                    title: 'Settings',
                    drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
                }}
            />
        </Drawer>
    );
}
