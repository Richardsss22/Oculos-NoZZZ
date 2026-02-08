import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeStore } from '../styles/theme';
import { getTheme, ThemeType, AccentType, PALETTE } from '../styles/UltraTheme';
import { AmbientBackground } from '../components/ultra/AmbientBackground';
import { GlassPane } from '../components/ultra/GlassPane';
import { GradientCard } from '../components/ultra/GradientCard';
import { LiquidButton } from '../components/ultra/LiquidButton';

export default function UltraSettingsScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode, toggleTheme } = useThemeStore();

    // Local State
    const [currentAccent, setCurrentAccent] = useState<AccentType>('ocean');
    const [coffeeRadarRadius, setCoffeeRadarRadius] = useState(5);
    const [emergencyContact, setEmergencyContact] = useState('935486611');

    const themeMode: ThemeType = isDarkMode ? 'dark' : 'light';
    const theme = getTheme(themeMode, currentAccent);

    // Theme Selector
    const ThemeCard = ({ accent, name }: { accent: AccentType, name: string }) => {
        const isActive = currentAccent === accent;
        return (
            <TouchableOpacity
                style={[styles.themeCard, { borderColor: isActive ? theme.accent : 'transparent', borderWidth: 2 }]}
                onPress={() => setCurrentAccent(accent)}
            >
                <View style={[styles.themePreview, { backgroundColor: PALETTE[accent].bgPrimary[1] }]} />
                <Text style={{ textAlign: 'center', fontSize: 10, marginTop: 4, color: theme.textPrimary }}>{name}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
            <AmbientBackground themeMode={themeMode} accent={currentAccent} />
            <GlassPane intensity={80} style={{ paddingTop: insets.top + 10, paddingBottom: 16, paddingHorizontal: 20 }} themeMode={themeMode} accent={currentAccent}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.textPrimary }}>Definições</Text>
            </GlassPane>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <GradientCard themeMode={themeMode} accent={currentAccent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }}>Aparência</Text>
                        <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: theme.accent }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <ThemeCard accent="ocean" name="Ocean" />
                        <ThemeCard accent="blue" name="Blue" />
                        <ThemeCard accent="sunrise" name="Sunrise" />
                    </View>
                </GradientCard>

                <GradientCard themeMode={themeMode} accent={currentAccent} style={{ marginTop: 16, borderColor: '#f43f5e', borderWidth: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f43f5e', marginBottom: 10 }}>Emergência</Text>
                    <TextInput
                        style={{ height: 50, backgroundColor: theme.bgElevated, borderRadius: 12, paddingHorizontal: 16, color: theme.textPrimary }}
                        value={emergencyContact}
                        onChangeText={setEmergencyContact}
                        keyboardType="phone-pad"
                    />
                </GradientCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    themeCard: { width: 80, padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
    themePreview: { height: 40, borderRadius: 8 }
});
