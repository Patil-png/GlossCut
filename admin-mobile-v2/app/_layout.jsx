import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

const MainLayout = () => {
    const { admin, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!admin && !inAuthGroup) {
            // Redirect to the sign-in page if not signed in
            router.replace('/sign-in');
        } else if (admin && inAuthGroup) {
            // Redirect away from the sign-in page if signed in
            router.replace('/');
        }
    }, [admin, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return <Slot />;
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}
