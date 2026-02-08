import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SensorScreen from './screens/SensorScreen';

// Services
import { useThemeStore, getTheme } from './styles/theme';
import { useI18nStore } from './i18n/i18nStore';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';



import { setupNotifications } from './services/NotificationService';

const Tab = createBottomTabNavigator();

export default function App() {
    const { isDarkMode } = useThemeStore();
    const { loadLanguage } = useI18nStore();
    const colors = getTheme(isDarkMode);

    useEffect(() => {
        loadLanguage();
        setupNotifications(); // Initialize notifications channel
    }, []);

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarStyle: {
                            backgroundColor: colors.card,
                            borderTopColor: colors.border,
                            paddingBottom: 5,
                            height: 60,
                        },
                        tabBarActiveTintColor: colors.primary,
                        tabBarInactiveTintColor: colors.textSecondary,
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName;

                            if (route.name === 'Dashboard') {
                                iconName = focused ? 'speedometer' : 'speedometer-outline';
                            } else if (route.name === 'History') {
                                iconName = focused ? 'time' : 'time-outline';
                            } else if (route.name === 'Settings') {
                                iconName = focused ? 'settings' : 'settings-outline';
                            } else if (route.name === 'Sensor') {
                                iconName = focused ? 'pulse' : 'pulse-outline';
                            }

                            return <Ionicons name={iconName as any} size={size} color={color} />;
                        },
                    })}
                >
                    <Tab.Screen name="Dashboard" component={DashboardScreen} />
                    <Tab.Screen name="Sensor" component={SensorScreen} />
                    <Tab.Screen name="History" component={HistoryScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
