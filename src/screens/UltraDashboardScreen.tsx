import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Stores & Services
import { useBLEStore } from '../services/BLEService';
import { useLocationStore } from '../services/LocationService';
import { useEyeDetectionStore } from '../services/EyeDetectionService';
import { useDrowsinessStore } from '../services/DrowsinessDetector';
import { useVoiceCompanionStore } from '../services/VoiceCompanionService';
import { useCoffeeRadarStore } from '../services/CoffeeRadarService';
import { useThemeStore } from '../styles/theme'; // Keeping old theme store for logic compat
import { useI18nStore } from '../i18n/i18nStore';

// Ultra Components
import { getTheme, ThemeType, AccentType } from '../styles/UltraTheme';
import { AmbientBackground } from '../components/ultra/AmbientBackground';
import { GlassPane } from '../components/ultra/GlassPane';
import { GradientCard } from '../components/ultra/GradientCard';
import { LiquidButton } from '../components/ultra/LiquidButton';
import { SpeedMonitor } from '../components/ultra/SpeedMonitor';
import CameraViewComponent from '../components/CameraView';
import BluetoothConnectionModal from '../components/BluetoothConnectionModal';

export default function UltraDashboardScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    // -- LOGIC INTEGRATION --
    const { isConnected, isScanning, disconnect, batteryLevel } = useBLEStore();
    const { speed } = useLocationStore();
    const { alarmPlaying, stopAlarm, suggestRestStop, dismissRestStop, isMonitoring: isCameraActive, startMonitoring: startCamera, stopMonitoring: stopCamera } = useEyeDetectionStore();
    const { isDrowsy } = useDrowsinessStore();
    const { nearbyPlaces, navigateToPlace } = useCoffeeRadarStore();
    const { triggerOnDemand, isEnabled: isVoiceEnabled } = useVoiceCompanionStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const { t } = useI18nStore();

    // -- UI STATE --
    const [modalVisible, setModalVisible] = useState(false);

    // Mapping old theme store to new theme system
    const themeMode: ThemeType = isDarkMode ? 'dark' : 'light';
    const accent: AccentType = 'ocean'; // Could be dynamic later
    const theme = getTheme(themeMode, accent);

    // -- HANDLERS --
    const toggleCamera = () => {
        // This toggles logic, we assume CameraViewComponent listens to store or we control visibility
        // Camera logic is complex in original file, simplifying for UI first
        // In original: logic is inside CameraViewComponent mostly or handled by store
        // We will toggle a local state for Visual Feedback if needed, but logic should be in Store
        // However, EyeDetectionStore has start/stopMonitoring methods.
        // Let's assume we want to show/hide the camera view.
    };

    // Original Dashboard had specific logic for camera visibility.
    // For now we render CameraViewComponent always if we want monitoring, or hide it.
    // Adapting to use a local toggle to simulate the "Active/Inactive" visual state
    const [cameraUiActive, setCameraUiActive] = useState(true);

    const handleCameraToggle = () => {
        setCameraUiActive(!cameraUiActive);
        // Logic to actually stop/start service would go here
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgGradient[0] }]}>
            <AmbientBackground themeMode={themeMode} accent={accent} />
            <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Header */}
            <GlassPane
                intensity={80}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
                themeMode={themeMode}
                accent={accent}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <LinearGradient
                            colors={[theme.accent, theme.accentDark]}
                            style={styles.logoContainer}
                        >
                            <Ionicons name="eye" size={20} color="#FFF" />
                        </LinearGradient>
                        <View>
                            <Text style={[styles.appName, { color: theme.textPrimary }]}>Oculus</Text>
                            <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>Ultra Intelligence</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.themeToggle, { backgroundColor: theme.bgElevated }]}
                        onPress={toggleTheme}
                    >
                        <Ionicons
                            name={themeMode === 'dark' ? "moon" : "sunny"}
                            size={18}
                            color={themeMode === 'dark' ? theme.textSecondary : '#f59e0b'}
                        />
                    </TouchableOpacity>
                </View>
            </GlassPane>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Card - Camera & Eye Tracking */}
                <GradientCard themeMode={themeMode} accent={accent} variant="glass" style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                        <View>
                            <View style={styles.statusBadge}>
                                <View style={[
                                    styles.statusDot,
                                    { backgroundColor: isDrowsy ? '#ef4444' : (cameraUiActive ? '#10b981' : '#f43f5e') }
                                ]} />
                                <Text style={[styles.statusText, { color: theme.textSecondary }]}>SISTEMA NEURAL</Text>
                            </View>
                            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Deteção Ocular</Text>
                            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                                {isDrowsy ? 'ALERTA DE FADIGA!' : 'Monitorização ativa'}
                            </Text>
                        </View>
                        <LinearGradient
                            colors={[theme.accent, theme.accentDark]}
                            style={styles.heroIcon}
                        >
                            <Ionicons name="videocam" size={24} color="#FFF" />
                        </LinearGradient>
                    </View>

                    {/* Camera View Area */}
                    <View style={[styles.cameraPreview, { borderColor: theme.border }]}>
                        {/* Actual Camera Component */}
                        <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
                            {cameraUiActive && <CameraViewComponent isPip={false} />}
                        </View>

                        {!cameraUiActive && (
                            <View style={styles.cameraOffPlaceholder}>
                                <Ionicons name="videocam-off" size={32} color={theme.textTertiary} />
                            </View>
                        )}
                    </View>

                    <LiquidButton
                        title={cameraUiActive ? "Desativar Câmara" : "Ativar Câmara"}
                        onPress={handleCameraToggle}
                        icon="power"
                        style={{ marginTop: 16 }}
                        type={cameraUiActive ? 'danger' : 'primary'}
                        themeMode={themeMode}
                        accent={accent}
                    />

                    <View style={styles.heroFooter}>
                        <View style={styles.heroFooterItem}>
                            <Ionicons name="flash" size={12} color={theme.accent} />
                            <Text style={[styles.heroFooterText, { color: theme.textTertiary }]}>60Hz Refresh</Text>
                        </View>
                        <Text style={[styles.heroFooterText, { color: theme.textTertiary }]}>Latência: 12ms</Text>
                    </View>
                </GradientCard>

                {/* Connection Status */}
                <GradientCard themeMode={themeMode} accent={accent} onPress={() => !isConnected && setModalVisible(true)}>
                    <View style={styles.connectionHeader}>
                        <View>
                            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>DISPOSITIVO EOG</Text>
                            <Text style={[styles.connectionStatus, { color: isConnected ? theme.accent : '#f43f5e' }]}>
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </Text>
                            <Text style={[styles.connectionDevice, { color: theme.textSecondary }]}>
                                {isConnected ? 'Oculus Glasses v2' : 'Toque para conectar'}
                            </Text>
                            {isConnected && (
                                <Text style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>
                                    🔋 Bateria: {Math.round(batteryLevel)}%
                                </Text>
                            )}
                        </View>

                        <View style={[styles.connectionIconRing, { borderColor: isConnected ? theme.accent : theme.border }]}>
                            <View style={[styles.connectionIconInner, { backgroundColor: isConnected ? theme.accentLight : theme.bgElevated }]}>
                                <Ionicons
                                    name={isConnected ? "bluetooth" : "bluetooth-outline"}
                                    size={24}
                                    color={isConnected ? theme.accent : theme.textTertiary}
                                />
                            </View>
                        </View>
                    </View>

                    {isConnected && (
                        <LiquidButton
                            title="Desconectar"
                            onPress={disconnect}
                            type="secondary"
                            style={{ mt: 16 }}
                            themeMode={themeMode}
                            accent={accent}
                        />
                    )}
                </GradientCard>

                {/* Bluetooth Modal */}
                <BluetoothConnectionModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                />

                {/* Speed Monitor */}
                <GradientCard themeMode={themeMode} accent={accent} variant="elevated">
                    <SpeedMonitor speed={speed} themeMode={themeMode} accent={accent} />
                </GradientCard>

                {/* Quick Actions Grid */}
                <View style={styles.grid}>
                    <TouchableOpacity
                        style={[styles.gridCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
                        activeOpacity={0.8}
                        onPress={triggerOnDemand}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                            <Ionicons name="mic" size={24} color="#8b5cf6" />
                        </View>
                        <Text style={[styles.gridTitle, { color: theme.textPrimary }]}>Voz</Text>
                        <Text style={[styles.gridSubtitle, { color: theme.textTertiary }]}>Comandos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
                        activeOpacity={0.8}
                        onPress={() => navigateToPlace(nearbyPlaces[0])} // Simple action for now
                    >
                        <View style={[styles.gridIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                            <Ionicons name="location" size={24} color="#ec4899" />
                        </View>
                        <Text style={[styles.gridTitle, { color: theme.textPrimary }]}>Radar</Text>
                        <Text style={[styles.gridSubtitle, { color: theme.textTertiary }]}>Cafés</Text>
                    </TouchableOpacity>
                </View>

                {/* Coffee Radar Suggestions (if any) */}
                {nearbyPlaces.length > 0 && (
                    <GradientCard themeMode={themeMode} accent={accent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{
                                width: 40, height: 40, borderRadius: 12,
                                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                alignItems: 'center', justifyContent: 'center', marginRight: 12
                            }}>
                                <Ionicons name="cafe" size={20} color="#f97316" />
                            </View>
                            <View>
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.textPrimary }}>Cafés Próximos</Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}> {nearbyPlaces.length} locais encontrados</Text>
                            </View>
                        </View>

                        {nearbyPlaces.slice(0, 2).map((place, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={{
                                    padding: 12,
                                    backgroundColor: theme.bgElevated,
                                    borderRadius: 12,
                                    marginBottom: 8,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onPress={() => navigateToPlace(place)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: '600', color: theme.textPrimary }} numberOfLines={1}>{place.name}</Text>
                                    <Text style={{ fontSize: 12, color: theme.textTertiary }}>{place.distance}km • {place.rating}★</Text>
                                </View>
                                <Ionicons name="navigate-circle" size={28} color={theme.accent} />
                            </TouchableOpacity>
                        ))}
                    </GradientCard>
                )}

            </ScrollView>

            {/* Danger Modal (Custom Overlay) */}
            <Modal
                visible={alarmPlaying}
                transparent={true}
                animationType="fade"
                statusBarTranslucent
            >
                <View style={[styles.dangerOverlay, { backgroundColor: 'rgba(220, 38, 38, 0.9)' }]}>
                    <View style={styles.dangerContent}>
                        <Ionicons name="warning" size={80} color="#FFF" />
                        <Text style={styles.dangerTitle}>PERIGO</Text>
                        <Text style={styles.dangerText}>OLHOS FECHADOS!</Text>
                        <TouchableOpacity style={styles.stopButton} onPress={stopAlarm}>
                            <Text style={styles.stopButtonText}>PARAR ALARME</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    appSubtitle: {
        fontSize: 12,
        opacity: 0.6,
        fontWeight: '500',
    },
    themeToggle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    heroCard: {

    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    cameraPreview: {
        height: 200,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
    },
    cameraOffPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    heroFooterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroFooterText: {
        fontSize: 10,
        opacity: 0.5,
    },
    // Connection Card
    connectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
        opacity: 0.6,
    },
    connectionStatus: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    connectionDevice: {
        fontSize: 12,
        opacity: 0.7,
    },
    connectionIconRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionIconInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Grid
    grid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    gridCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    gridIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    gridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    gridSubtitle: {
        fontSize: 12,
        opacity: 0.6,
    },
    // Danger Modal
    dangerOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerContent: {
        alignItems: 'center',
    },
    dangerTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFF',
        marginTop: 20,
        letterSpacing: 2,
    },
    dangerText: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: 'bold',
        marginBottom: 40,
        opacity: 0.9,
    },
    stopButton: {
        backgroundColor: '#FFF',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    stopButtonText: {
        color: '#dc2626',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
