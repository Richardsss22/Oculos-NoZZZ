
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useEogBleStore } from '../services/EogBleService';
import { useThemeStore, getTheme } from '../styles/theme';
import { useI18nStore } from '../i18n/i18nStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalibrationButton from '../components/CalibrationButton';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SensorScreen() {
    const {
        phase,
        statusText,
        lastMinuteLabel,
        lastNormal,
        lastSlow,
        lastFlag,
        history
    } = useEogBleStore();

    const { isDarkMode } = useThemeStore();
    const { t } = useI18nStore();
    const colors = getTheme(isDarkMode);

    // Prepare chart data
    // We want to show Normal vs Slow over time
    // If history is empty, show dummy data to avoid crash or empty chart
    const dataPoints = history.length > 0 ? history : [{ minute: 0, normal: 0, slow: 0 }];

    // Take last 10 points for readability if needed, or show all
    const recentHistory = dataPoints.slice(-10);

    const labels = recentHistory.map(h => `M${h.minute}`);
    const normalData = recentHistory.map(h => h.normal);
    const slowData = recentHistory.map(h => h.slow);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* HEADER */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Sensor EOG</Text>
                    <View style={styles.statusBadge}>
                        <View style={[styles.dot, { backgroundColor: phase === 'idle' ? colors.textSecondary : '#4CAF50' }]} />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            {phase === 'idle' ? 'Desconectado' : 'Conectado'}
                        </Text>
                    </View>
                </View>

                {/* CALIBRATION SECTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Calibração</Text>
                    <CalibrationButton />
                    {/* Status Text from Store (e.g. "Calibração concluída") */}
                    {statusText ? (
                        <Text style={[styles.feedbackText, { color: colors.primary }]}>{statusText}</Text>
                    ) : null}
                </View>

                {/* REAL-TIME DATA POPUP */}
                {lastMinuteLabel && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="stats-chart" size={20} color={colors.primary} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                Último Minuto ({lastMinuteLabel})
                            </Text>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{lastNormal}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Normais</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.danger }]}>{lastSlow}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lentas</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: lastFlag === 'S-' ? '#FF4444' : '#4CAF50' }]}>
                                    {lastFlag === 'S-' ? 'SONO' : 'OK'}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Estado</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* GRAPH SECTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico (Piscadelas)</Text>
                    <LineChart
                        data={{
                            labels: labels,
                            datasets: [
                                {
                                    data: normalData,
                                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for Normal
                                    strokeWidth: 2
                                },
                                {
                                    data: slowData,
                                    color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`, // Red for Slow
                                    strokeWidth: 2
                                }
                            ],
                            legend: ["Normais", "Lentas"]
                        }}
                        width={SCREEN_WIDTH - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: colors.card,
                            backgroundGradientFrom: colors.card,
                            backgroundGradientTo: colors.card,
                            decimalPlaces: 0,
                            color: (opacity = 1) => colors.text,
                            labelColor: (opacity = 1) => colors.textSecondary,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: colors.card
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                </View>

                {/* SEND REPORT BUTTON */}
                {history.length > 0 && (
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View style={{
                            backgroundColor: colors.primary,
                            borderRadius: 12,
                            overflow: 'hidden',
                            elevation: 3
                        }}>
                            <Text
                                onPress={() => useEogBleStore.getState().sendEmailReport()}
                                style={{
                                    color: '#FFF',
                                    fontWeight: 'bold',
                                    paddingVertical: 14,
                                    paddingHorizontal: 30,
                                    textTransform: 'uppercase',
                                    fontSize: 16
                                }}>
                                Enviar Relatório
                            </Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
    },
    feedbackText: {
        marginTop: 10,
        textAlign: 'center',
        fontWeight: '600',
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 15,
        marginBottom: 25,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
});
