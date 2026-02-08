import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Easing, useWindowDimensions, Platform, StatusBar } from 'react-native';
import { useBLEStore } from '../services/BLEService';
import { useLocationStore } from '../services/LocationService';
import { useDrowsinessStore } from '../services/DrowsinessDetector';
import { useEyeDetectionStore } from '../services/EyeDetectionService'; // ADDED
import { useThemeStore, getTheme } from '../styles/theme';
import { useI18nStore } from '../i18n/i18nStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCognitiveStore } from '../services/CognitiveService';
import { useWeatherStore } from '../services/WeatherService';
import CameraViewComponent from '../components/CameraView';
import { useCoffeeRadarStore } from '../services/CoffeeRadarService';
import CalibrationButton from '../components/CalibrationButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PermissionService } from '../services/PermissionService';
import VolumeModule from '../native/VolumeModule';
import { useVoiceCompanionStore } from '../services/VoiceCompanionService';
import { sendEmergencyNotification } from '../services/NotificationService';

import BluetoothConnectionModal from '../components/BluetoothConnectionModal';

export default function DashboardScreen({ navigation }: any) {
    const { isConnected, isScanning, startScanning, disconnect, gyroData, batteryLevel } = useBLEStore();
    const { isDriving, speed, startTracking, stopTracking } = useLocationStore();
    const { isDrowsy, resetAlert, countdown } = useDrowsinessStore();
    const { alarmPlaying, stopAlarm: stopEyeAlarm, suggestRestStop, dismissRestStop } = useEyeDetectionStore(); // LISTENING TO EYE SERVICE

    const { nearbyPlaces, isSearching, dismissSuggestion, navigateToPlace, error } = useCoffeeRadarStore();
    const { isDarkMode } = useThemeStore();
    const { t, language } = useI18nStore();
    const { triggerOnDemand, forceListen, isEnabled: isVoiceEnabled } = useVoiceCompanionStore();
    const colors = getTheme(isDarkMode);

    const [modalVisible, setModalVisible] = useState(false);
    const { height } = useWindowDimensions(); // ADDED
    const isPip = height < 400; // ADDED
    const [autoCallCountdown, setAutoCallCountdown] = useState<number | null>(null);

    // RED FLASH ANIMATION FOR DANGER MODAL
    const flashAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (alarmPlaying) { // Trigger flash when alarm is playing
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: false, easing: Easing.linear }),
                    Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false, easing: Easing.linear })
                ])
            ).start();
        } else {
            flashAnim.setValue(0);
        }
    }, [alarmPlaying]);

    const backgroundColorInterp = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FF0000', '#800000'] // Bright Red to Dark Red pulse
    });


    useEffect(() => {
        const init = async () => {
            if (Platform.OS === 'android') {
                StatusBar.setTranslucent(true);
                StatusBar.setBackgroundColor('transparent');
            }

            await PermissionService.requestAllPermissions();

            // Start Advanced Services
            useCognitiveStore.getState().setupListeners(); // Setup Voice listeners
            useCognitiveStore.getState().startMonitoring();
            useWeatherStore.getState().startMonitoring();

            // Initialize BLE and try to auto-connect
            const bleStore = useBLEStore.getState();
            await bleStore.initialize();
            await bleStore.connectToSavedDevices();

            // Load persisted settings (Emergency Contact)
            await useDrowsinessStore.getState().loadSettings();

            startTracking();

            // Check DND Permission (Android M+)
            try {
                const hasDndAccess = await VolumeModule.checkNotificationPolicyAccess();
                if (!hasDndAccess) {
                    // Ideally we show a dialog, but for now let's just log or request
                    // VolumeModule.requestNotificationPolicyAccess(); 
                    // Keeping it manual for now to avoid spamming the user on startup
                    console.log('⚠️ DND Access missing. Alarm might not override Silent mode.');
                }
            } catch (e) {
                console.log('Error checking DND:', e);
            }
        };
        init();
        return () => stopTracking();
    }, []);

    // --- ALARM LOGIC (Sync Drowsiness with EyeAlarm) ---
    // If EyeDetection triggers 'alarmPlaying', we consider the user in DANGER state.
    // We can also trigger notifications here if not driven by EyeDetectionService.
    useEffect(() => {
        if (alarmPlaying) {
            console.log('🚨 UI: ALARM IS PLAYING (Synced from EyeDetection)');
            sendEmergencyNotification().catch(console.error);
        }
    }, [alarmPlaying]);

    useEffect(() => {
        if (alarmPlaying) {
            setAutoCallCountdown(20);
            const interval = setInterval(() => {
                setAutoCallCountdown(prev => {
                    // Stop at 0
                    if (prev !== null && prev <= 0) return 0;
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setAutoCallCountdown(null);
        }
    }, [alarmPlaying]);

    const handleStopAlarm = async () => {
        console.log('User stopping alarm...');
        await stopEyeAlarm(); // Stop siren + strobe + reset tracking
        setAutoCallCountdown(null);
        try {
            await VolumeModule.stopAlarm();
            await VolumeModule.stopStrobe();
        } catch { }
    };



    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* HOISTED CAMERA - Keeps instance alive during PiP transition */}
            {!isDrowsy && (
                <View style={isPip ? { flex: 1 } : { paddingHorizontal: 20, paddingTop: 20 }}>
                    <CameraViewComponent isPip={isPip} />
                </View>
            )}

            {!isPip && (
                <>
                    <BluetoothConnectionModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                    />

                    {/* DANGER MODAL */}
                    <Modal
                        visible={alarmPlaying} // Show when alarm is playing (from EyeService)
                        transparent={false}
                        animationType="fade"
                        statusBarTranslucent
                    >
                        <Animated.View style={[styles.dangerContainer, { backgroundColor: backgroundColorInterp }]}>
                            <View style={styles.dangerContent}>
                                <Text style={styles.dangerTitle}>⚠️ PERIGO ⚠️</Text>
                                <Text style={styles.dangerText}>
                                    {language === 'pt'
                                        ? 'Olhos fechados por mais de 2.5s!\nACORDE!'
                                        : 'Eyes closed for >2.5s!\nWAKE UP!'}
                                </Text>

                                <TouchableOpacity style={styles.cancelButton} onPress={handleStopAlarm}>
                                    <Text style={styles.cancelButtonText}>
                                        {language === 'pt' ? 'CANCELAR ALARME' : 'STOP ALARM'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </Modal>

                    {/* REST STOP SUGGESTION MODAL */}
                    <Modal
                        visible={suggestRestStop}
                        transparent={true}
                        animationType="slide"
                        statusBarTranslucent
                    >
                        <View style={[styles.dangerContainer, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                            <View style={[styles.dangerContent, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                                <Text style={{ fontSize: 50, marginBottom: 10 }}>☕</Text>
                                <Text style={[styles.dangerTitle, { fontSize: 24, color: colors.text, marginBottom: 10 }]}>
                                    {language === 'pt' ? 'Pausa Recomendada' : 'Rest Recommended'}
                                </Text>
                                <Text style={[styles.dangerText, { fontSize: 16, color: colors.text, fontWeight: 'normal' }]}>
                                    {language === 'pt'
                                        ? 'Detetámos sinais de fadiga frequente (2 alarmes em 15min).'
                                        : 'We detected frequent fatigue signs (2 alarms in 15min).'}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.button, { width: '100%', marginBottom: 10, backgroundColor: '#FFC107' }]}
                                    onPress={() => {
                                        dismissRestStop();
                                        useCoffeeRadarStore.getState().searchNearbyPlaces();
                                    }}
                                >
                                    <Text style={[styles.buttonText, { color: '#000' }]}>
                                        {language === 'pt' ? '📍 Procurar Café Próximo' : '📍 Find Nearby Coffee'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, { width: '100%', backgroundColor: colors.border }]}
                                    onPress={dismissRestStop}
                                >
                                    <Text style={styles.buttonText}>
                                        {language === 'pt' ? 'Dispensar' : 'Dismiss'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text }]}>{t('appName')} <Text style={{ fontSize: 12, color: 'red' }}></Text></Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                <Text style={styles.icon}>⚙️</Text>
                            </TouchableOpacity>
                        </View>


                        {/* Alert Placeholder */}
                        {isDrowsy && (
                            <View style={[styles.card, { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
                                <Text style={{ fontSize: 40 }}>🚨</Text>
                                <Text style={{ color: '#FFF', marginTop: 10 }}>ALARM ACTIVE</Text>
                            </View>
                        )}

                        {/* Status Cards */}
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('glassesStatus')}</Text>
                            <View style={styles.row}>
                                <Text style={[styles.statusText, isConnected ? styles.connected : styles.disconnected]}>
                                    {isConnected ? t('connected') : isScanning ? t('searching') : t('disconnected')}
                                </Text>
                                {isConnected && <Text style={styles.batteryText}>🔋 {Math.round(batteryLevel)}%</Text>}
                            </View>
                            {!isConnected && (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => setModalVisible(true)}
                                    disabled={false}
                                >
                                    <Text style={styles.buttonText}>{t('connectGlasses')}</Text>
                                </TouchableOpacity>
                            )}
                            {isConnected && (
                                <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={disconnect}>
                                    <Text style={[styles.buttonText, styles.textOutline]}>{t('disconnect')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Calibration Button RE-ORDERED */}
                        <CalibrationButton />

                        {/* Sensor Data RE-ORDERED */}
                        {isConnected && (
                            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('realtimeData')}</Text>
                                <View style={styles.sensorRow}>
                                    <View style={styles.sensorItem}>
                                        <Text style={[styles.sensorLabel, { color: colors.inactive }]}>{t('pitch')}</Text>
                                        <Text style={[styles.sensorValue, { color: colors.text }]}>{gyroData.pitch.toFixed(1)}°</Text>
                                    </View>
                                    <View style={styles.sensorItem}>
                                        <Text style={[styles.sensorLabel, { color: colors.inactive }]}>{t('roll')}</Text>
                                        <Text style={[styles.sensorValue, { color: colors.text }]}>{gyroData.roll.toFixed(1)}°</Text>
                                    </View>
                                    <View style={styles.sensorItem}>
                                        <Text style={[styles.sensorLabel, { color: colors.inactive }]}>{t('yaw')}</Text>
                                        <Text style={[styles.sensorValue, { color: colors.text }]}>{gyroData.yaw.toFixed(1)}°</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Driving Data */}
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('drivingMonitoring')}</Text>
                            <View style={styles.row}>
                                <View>
                                    <Text style={[styles.label, { color: colors.inactive }]}>{t('speed')}</Text>
                                    {/* SPEED FIX: Filter noise below 1 m/s (~3.6 km/h) */}
                                    <Text style={[styles.value, { color: colors.text }]}>
                                        {Math.round(speed < 3.6 ? 0 : speed)} km/h
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.label, { color: colors.inactive }]}>{t('status')}</Text>
                                    <Text style={[styles.statusText, isDriving ? styles.driving : styles.idle]}>
                                        {isDriving ? t('driving') : t('stopped')}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.smallButtonText, { color: colors.inactive, marginTop: 8 }]}>
                                {language === 'pt'
                                    ? 'Modo condução é detetado automaticamente quando a velocidade ultrapassa os 15 km/h.'
                                    : 'Driving mode is detected automatically when speed exceeds 15 km/h.'}
                            </Text>

                        </View>

                        {/* Talk Now Button */}
                        {isVoiceEnabled && (
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                <TouchableOpacity
                                    style={[styles.button, { flex: 1, backgroundColor: '#9C27B0' }]}
                                    onPress={triggerOnDemand}
                                >
                                    <Text style={styles.buttonText}>🗣️ {language === 'pt' ? 'Falar' : 'Talk'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { flex: 1, backgroundColor: '#E91E63' }]}
                                    onPress={forceListen}
                                >
                                    <Text style={styles.buttonText}>🎤 {language === 'pt' ? 'Ouvir' : 'Listen'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}



                        {/* Coffee Radar */}
                        <View style={[styles.coffeeRadarCard, {
                            backgroundColor: nearbyPlaces.length > 0 ? '#FFF3CD' : colors.card,
                            borderColor: nearbyPlaces.length > 0 ? '#FFC107' : colors.border
                        }]}>
                            <View style={styles.coffeeRadarHeader}>
                                <Text style={styles.coffeeRadarIcon}>☕</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.coffeeRadarTitle, { color: nearbyPlaces.length > 0 ? '#856404' : colors.text }]}>
                                        {t('coffeeRadar')}
                                    </Text>
                                    <Text style={[styles.coffeeRadarSubtitle, { color: nearbyPlaces.length > 0 ? '#856404' : colors.textSecondary }]}>
                                        {nearbyPlaces.length > 0
                                            ? `${nearbyPlaces.length} ${language === 'pt' ? 'cafés encontrados' : 'cafes found'} `
                                            : (language === 'pt' ? 'Procurar cafés próximos' : 'Find nearby cafes')
                                        }
                                    </Text>
                                </View>
                                {!isSearching && (
                                    <TouchableOpacity
                                        style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                                        onPress={() => useCoffeeRadarStore.getState().searchNearbyPlaces()}
                                    >
                                        <Text style={{ fontSize: 20 }}>🔄</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isSearching && (
                                <Text style={[styles.searchingText, { color: colors.textSecondary }]}>
                                    {t('searchingNearbyPlaces')}
                                </Text>
                            )}

                            {error && !isSearching && (
                                <Text style={[styles.errorText, { color: '#D32F2F' }]}>
                                    ❌ {error === 'API key not configured' ? 'API key não configurada' :
                                        error === 'Location not available' ? 'GPS não disponível. Ativa a localização.' :
                                            error === 'No places found' ? 'Nenhum café encontrado próximo.' :
                                                `Erro: ${error} `}
                                </Text>
                            )}

                            {nearbyPlaces.length > 0 && !isSearching && (
                                <>
                                    <ScrollView
                                        style={styles.placesScrollView}
                                        nestedScrollEnabled={true}
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {nearbyPlaces.map((place, index) => (
                                            <View
                                                key={place.placeId}
                                                style={[
                                                    styles.placeItem,
                                                    { backgroundColor: index === 0 ? '#FFF9E6' : 'transparent', borderBottomColor: '#E0E0E0' }
                                                ]}
                                            >
                                                <View style={styles.placeInfo}>
                                                    <View style={styles.placeHeader}>
                                                        <Text style={styles.placeRank}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</Text>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.placeName}>{place.name}</Text>
                                                            {place.address && (
                                                                <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
                                                            )}
                                                        </View>
                                                        <Text style={styles.placeDistance}>{place.distance}km</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.placeNavigateButton, { backgroundColor: colors.primary }]}
                                                    onPress={() => navigateToPlace(place)}
                                                >
                                                    <Text style={styles.placeNavigateText}>🗺️ {t('navigate')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity
                                        style={[styles.dismissAllButton, { borderColor: colors.border }]}
                                        onPress={dismissSuggestion}
                                    >
                                        <Text style={[styles.dismissAllText, { color: colors.textSecondary }]}>{t('dismiss')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {nearbyPlaces.length === 0 && !isSearching && (
                                <Text style={[styles.coffeeHint, { color: colors.inactive }]}>
                                    {language === 'pt' ? '💡 Toca no botão para procurar cafés próximos' : '💡 Tap the button to find nearby cafes'}
                                </Text>
                            )}
                        </View>


                        {/* Alert Overlay */}
                        {isDrowsy && (
                            <View style={styles.alertBox}>
                                <Text style={styles.alertTitle}>⚠️ {t('drowsinessAlert')} ⚠️</Text>
                                <Text style={styles.alertText}>{t('extremeFatigue')}</Text>
                                <Text style={styles.countdownText}>
                                    {t('emergencyCallIn')}: {countdown}s
                                </Text>
                                <TouchableOpacity style={styles.resetButton} onPress={resetAlert}>
                                    <Text style={styles.resetButtonText}>{t('imOk')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                    {/* DANGER MODAL (Duplicate removed/handled above) */}
                </>
            )
            }
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    icon: {
        fontSize: 24,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    connected: { color: '#4CAF50' },
    disconnected: { color: '#F44336' },
    driving: { color: '#2196F3' },
    idle: { color: '#9E9E9E' },
    batteryText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#F44336',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    textOutline: {
        color: '#F44336',
    },
    label: {
        fontSize: 14,
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    smallButton: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    smallButtonText: {
        fontSize: 12,
    },
    sensorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sensorItem: {
        alignItems: 'center',
    },
    sensorLabel: {
        marginBottom: 5,
    },
    sensorValue: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    alertBox: {
        backgroundColor: '#FF3B30',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    alertTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    alertText: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
    countdownText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 10,
        borderRadius: 8,
    },
    resetButton: {
        backgroundColor: '#FFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    resetButtonText: {
        color: '#FF3B30',
        fontWeight: 'bold',
        fontSize: 16,
    },
    historyButton: {
        alignItems: 'center',
        padding: 20,
    },
    historyButtonText: {
        color: '#2196F3',
        fontSize: 16,
    },
    // Coffee Radar Styles
    coffeeRadarCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    coffeeRadarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 12,
    },
    coffeeRadarIcon: {
        fontSize: 36,
    },
    coffeeRadarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    coffeeRadarSubtitle: {
        fontSize: 14,
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchingText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    coffeeRadarLocation: {
        marginBottom: 15,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: 8,
    },
    locationAddress: {
        fontSize: 13,
        color: '#666',
    },
    coffeeRadarActions: {
        flexDirection: 'row',
        gap: 10,
    },
    coffeeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    navigateButton: {
        backgroundColor: '#2196F3',
    },
    navigateButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    dismissButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#856404',
    },
    dismissButtonText: {
        color: '#856404',
        fontWeight: '600',
        fontSize: 15,
    },
    coffeeHint: {
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    placesScrollView: {
        maxHeight: 360, // ~4 items visible (each item ~90px)
    },
    placeItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    placeInfo: {
        marginBottom: 8,
    },
    placeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    placeRank: {
        fontSize: 20,
        fontWeight: 'bold',
        width: 30,
    },
    placeName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    placeAddress: {
        fontSize: 12,
        color: '#666',
    },
    placeDistance: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2196F3',
        minWidth: 50,
        textAlign: 'right',
    },
    placeNavigateButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    placeNavigateText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    dismissAllButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
    },
    dismissAllText: {
        fontWeight: '600',
        fontSize: 14,
    },
    // DANGER MODAL STYLES
    dangerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerContent: {
        padding: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        alignItems: 'center',
        width: '90%',
    },
    dangerTitle: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    dangerText: {
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 50,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    cancelButton: {
        backgroundColor: '#FFF',
        paddingVertical: 30,
        paddingHorizontal: 40,
        borderRadius: 50,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    cancelButtonText: {
        color: '#F44336',
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
        textAlign: 'center', // Added centering
    }
});
