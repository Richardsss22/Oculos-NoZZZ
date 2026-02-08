import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../styles/theme';
import { getTheme, ThemeType, AccentType } from '../styles/UltraTheme';
import { AmbientBackground } from '../components/ultra/AmbientBackground';
import { GlassPane } from '../components/ultra/GlassPane';
import { GradientCard } from '../components/ultra/GradientCard';

// Integration
import { useTripStore } from '../services/TripHistoryStore';
// Assuming useTripStore is correct based on file list (src/services/TripHistoryStore.ts)
// If store structure differs, we might need adjustments. Using mock data structure for UI first.

export default function UltraHistoryScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useThemeStore();

    const themeMode: ThemeType = isDarkMode ? 'dark' : 'light';
    const accent: AccentType = 'ocean';
    const theme = getTheme(themeMode, accent);

    // Mock Data for UI Dev (replace with store data later)
    const stats = {
        distance: 22.2,
        time: 80,
        alarms: 1,
        trips: 2
    };

    const trips = [
        { id: 1, date: '22 de dezembro, 2025', time: '11:21 — 11:49', distance: 7.9, duration: 28, avgSpeed: 17, maxSpeed: 57, alerts: 1, safe: false },
        { id: 2, date: '22 de dezembro, 2025', time: '11:52 — 12:44', distance: 14.3, duration: 52, avgSpeed: 17, maxSpeed: 113, alerts: 0, safe: true },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.bgGradient[0] }]}>
            <AmbientBackground themeMode={themeMode} accent={accent} />

            <GlassPane
                intensity={80}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
                themeMode={themeMode}
                accent={accent}
            >
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Histórico</Text>
                <GlassPane intensity={50} style={styles.filterBtn} themeMode={themeMode}>
                    <Ionicons name="filter" size={20} color={theme.textSecondary} />
                </GlassPane>
            </GlassPane>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>

                {/* Monthly Stats Hero Card */}
                <GradientCard themeMode={themeMode} accent={accent} variant="glass" style={{ overflow: 'hidden' }}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>FEVEREIRO 2026</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statBig, { color: theme.textPrimary }]}>{stats.distance} <Text style={styles.statUnit}>km</Text></Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distância total</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statBig, { color: theme.textPrimary }]}>{stats.time} <Text style={styles.statUnit}>min</Text></Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tempo ao volante</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statBig, { color: '#f43f5e' }]}>{stats.alarms}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Alarmes de sonolência</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statBig, { color: theme.textPrimary }]}>{stats.trips}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Viagens realizadas</Text>
                        </View>
                    </View>
                </GradientCard>

                {/* Safety Analysis */}
                <GradientCard themeMode={themeMode} accent={accent} variant="elevated">
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 }}>
                        <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Análise de Segurança</Text>
                    </View>

                    <View style={{ gap: 16 }}>
                        {/* Analysis Item Mock 1 */}
                        <View style={[styles.analysisItem, { backgroundColor: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.1)' }]}>
                            <View style={[styles.rankBox, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                                <Text style={{ fontWeight: 'bold', color: '#f43f5e' }}>#2</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>22 Dez</Text>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f43f5e' }}>1</Text>
                                </View>
                                <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3 }}>
                                    <View style={{ height: '100%', width: '100%', backgroundColor: '#f43f5e', borderRadius: 3 }} />
                                </View>
                            </View>
                        </View>

                        {/* Analysis Item Mock 2 */}
                        <View style={[styles.analysisItem, { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <View style={[styles.rankBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Text style={{ fontWeight: 'bold', color: '#10b981' }}>#1</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>22 Dez</Text>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>0</Text>
                                </View>
                                <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3 }}>
                                    <View style={{ height: '100%', width: '5%', backgroundColor: '#10b981', borderRadius: 3 }} />
                                </View>
                            </View>
                        </View>
                    </View>
                </GradientCard>

                {/* Recent Trips List */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 10, marginBottom: 10, paddingHorizontal: 4 }]}>VIAGENS RECENTES</Text>

                {trips.map((trip) => (
                    <GradientCard
                        key={trip.id}
                        themeMode={themeMode}
                        accent={accent}
                        variant="glass"
                        style={{ borderLeftWidth: 4, borderLeftColor: trip.safe ? '#10b981' : '#f43f5e' }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <View>
                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>{trip.date}</Text>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.accentDark, marginTop: 4 }}>{trip.time}</Text>
                            </View>
                            <View style={[
                                styles.pill,
                                { backgroundColor: trip.safe ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)' }
                            ]}>
                                <Ionicons
                                    name={trip.safe ? "shield-checkmark" : "alert-circle"}
                                    size={12}
                                    color={trip.safe ? '#10b981' : '#f43f5e'}
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: trip.safe ? '#10b981' : '#f43f5e' }}>
                                    {trip.safe ? 'Segura' : `${trip.alerts} Alerta`}
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={styles.tripLabel}>DISTÂNCIA</Text>
                                <Text style={[styles.tripValue, { color: theme.textPrimary }]}>{trip.distance} km</Text>
                            </View>
                            <View>
                                <Text style={styles.tripLabel}>DURAÇÃO</Text>
                                <Text style={[styles.tripValue, { color: theme.textPrimary }]}>{trip.duration} min</Text>
                            </View>
                            <View>
                                <Text style={styles.tripLabel}>MÉDIA</Text>
                                <Text style={[styles.tripValue, { color: theme.textPrimary }]}>{trip.avgSpeed} km/h</Text>
                            </View>
                            <View>
                                <Text style={styles.tripLabel}>MÁXIMA</Text>
                                <Text style={[styles.tripValue, { color: '#f97316' }]}>{trip.maxSpeed} km/h</Text>
                            </View>
                        </View>
                    </GradientCard>
                ))}

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
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: -1,
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 16,
        opacity: 0.6,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statItem: {
        width: '47%',
        marginBottom: 8,
    },
    statBig: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: -1,
        marginBottom: 2,
    },
    statUnit: {
        fontSize: 14,
        fontWeight: 'normal',
        opacity: 0.6,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.7,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    analysisItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    rankBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tripLabel: {
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.5,
        marginBottom: 4,
    },
    tripValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
