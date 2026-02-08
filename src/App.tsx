import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Services
import { useThemeStore } from './styles/theme';
import { useI18nStore } from './i18n/i18nStore';
import { setupNotifications } from './services/NotificationService';

// New Ultra Navigator
import UltraAppNavigator from './navigation/UltraAppNavigator';

export default function App() {
    const { isDarkMode } = useThemeStore();
    const { loadLanguage } = useI18nStore();

    useEffect(() => {
        loadLanguage();
        setupNotifications(); // Initialize notifications channel
    }, []);

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                <UltraAppNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
