import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UltraDashboardScreen from '../screens/UltraDashboardScreen';
import UltraSensorScreen from '../screens/UltraSensorScreen';
import UltraHistoryScreen from '../screens/UltraHistoryScreen';
import UltraSettingsScreen from '../screens/UltraSettingsScreen';
import { useThemeStore } from '../styles/theme';
import { getTheme } from '../styles/UltraTheme';
import { UltraDock } from '../components/ultra/UltraDock';

const Tab = createBottomTabNavigator();

export default function UltraAppNavigator() {
    const { isDarkMode } = useThemeStore();
    // In a real app we'd sync the accent color from a store too, defaulting to 'ocean' for now
    const theme = getTheme(isDarkMode ? 'dark' : 'light', 'ocean');

    return (
        <Tab.Navigator
            tabBar={(props) => <UltraDock {...props} themeMode={isDarkMode ? 'dark' : 'light'} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={UltraDashboardScreen} options={{ title: 'Início' }} />
            <Tab.Screen name="Sensor" component={UltraSensorScreen} options={{ title: 'Sensor' }} />
            <Tab.Screen name="History" component={UltraHistoryScreen} options={{ title: 'Histórico' }} />
            <Tab.Screen name="Settings" component={UltraSettingsScreen} options={{ title: 'Ajustes' }} />
        </Tab.Navigator>
    );
}
