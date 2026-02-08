import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../styles/theme';
import { getTheme, ThemeType, AccentType } from '../styles/UltraTheme';
import { AmbientBackground } from '../components/ultra/AmbientBackground';
import { GlassPane } from '../components/ultra/GlassPane';
import { GradientCard } from '../components/ultra/GradientCard';
import { LiquidButton } from '../components/ultra/LiquidButton';

// Mock Data / Services
import { useDrowsinessStore } from '../services/DrowsinessDetector';
// Assuming useEyeDetectionStore has autoCalibrate or similar
import { useEyeDetectionStore } from '../services/EyeDetectionService';

const screenWidth = Dimensions.get('window').width;

export default function UltraSensorScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useThemeStore();

    // Theme setup
    const themeMode: ThemeType = isDarkMode ? 'dark' : 'light';
    const accent: AccentType = 'ocean';
    const theme = getTheme(themeMode, accent);

    // Logic Integration
    const [sensitivity, setSensitivity] = useState(0.35); // Default
    const { blinkRate } = useEyeDetectionStore(); // Assuming this exists or mocked for now

    // Chart Data (Mocked for visual parity with HTML design for now)
    const chartData = {
        labels: ['0s', '5s', '10s', '15s', '20s', '25s'],
        datasets: [{
            data: [3, 4, 2, 5, 3, 6],
            color: (opacity = 1) => theme.accent,
            strokeWidth: 3
        }]
    };

    const chartConfig = {
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => theme.textSecondary,
        strokeWidth: 2,
        decimalPlaces: 0,
        propsForDots: { r: "0" },
        propsForBackgroundLines: { strokeDasharray: "" } // solid lines
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgGradient[0] }]}>
            <AmbientBackground themeMode={themeMode} accent={accent} />

            <GlassPane
                intensity={80}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
                themeMode={themeMode}
                accent={accent}
            >
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Sensor EOG</Text>
                <View style={[styles.liveBadge, { backgroundColor: theme.accentLight }]}>
                    <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.liveText, { color: theme.accentDark }]}>AO VIVO</Text>
                </View>
            </GlassPane>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>

                {/* Calibration Card */}
                <GradientCard themeMode={themeMode} accent={accent}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Calibração Neural</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Ajuste fino de precisão</Text>
                        </View>
                        <View style={[styles.iconBox, { backgroundColor: theme.accentLight }]}>
                            <Ionicons name="options" size={24} color={theme.accentDark} />
                        </View>
                    </View>

                    <View style={styles.sliderContainer}>
                        <View style={styles.sliderLabels}>
                            <Text style={{ color: theme.textSecondary }}>Sensibilidade</Text>
                            <Text style={[styles.sensValue, { color: theme.accent }]}>{Math.round(sensitivity * 100)}%</Text>
                        </View>

                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={1}
                            value={sensitivity}
                            onValueChange={setSensitivity}
                            minimumTrackTintColor={theme.accent}
                            maximumTrackTintColor={theme.border}
                            thumbTintColor={theme.accent}
                        />

                        <View style={styles.sliderLabelsFooter}>
                            <Text style={[styles.footerLabel, { color: theme.textTertiary }]}>CONSERVADOR</Text>
                            <Text style={[styles.footerLabel, { color: theme.textTertiary }]}>AGRESSIVO</Text>
                        </View>
                    </View>

                    <LiquidButton
                        title="Calibração Automática (3s)"
                        onPress={() => { /* Auto Calibrate Logic */ }}
                        icon="color-wand"
                        style={{ marginTop: 10 }}
                        themeMode={themeMode}
                        accent={accent}
                    />
                </GradientCard>

                {/* Chart Card */}
                <GradientCard themeMode={themeMode} accent={accent} variant="elevated">
                    <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: 16 }]}>Histórico de Piscadelas</Text>

                    <View style={{ overflow: 'hidden', borderRadius: 16 }}>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 80} // Card padding compensation
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            withDots={false}
                            withInnerLines={false}
                            withOuterLines={false}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            style={{
                                paddingRight: 0,
                                paddingLeft: 0
                            }}
                        />
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <Text style={[styles.statValue, { color: '#10b981' }]}>68</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Normais</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.2)' }]}>
                            <Text style={[styles.statValue, { color: '#f43f5e' }]}>12</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Lentas</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: theme.accentLight, borderColor: theme.accentGlow }]}>
                            <Text style={[styles.statValue, { color: theme.accentDark }]}>80</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
                        </View>
                    </View>
                </GradientCard>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    liveText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 12,
        opacity: 0.6,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderContainer: {
        marginBottom: 16,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    sensValue: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    sliderLabelsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
});
