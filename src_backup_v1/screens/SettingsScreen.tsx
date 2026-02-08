import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal, Switch, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useDrowsinessStore } from '../services/DrowsinessDetector';
import { useThemeStore, getTheme } from '../styles/theme';
import { useI18nStore } from '../i18n/i18nStore';
import { useCustomSettingsStore } from '../services/CustomSettingsStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCoffeeRadarStore } from '../services/CoffeeRadarService';
import { useEyeDetectionStore } from '../services/EyeDetectionService'; // ADDED
import { useVoiceCompanionStore } from '../services/VoiceCompanionService';
import { useSettingsStore } from '../services/SettingsStore';
import { useBLEStore } from '../services/BLEService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CameraViewComponent from '../components/CameraView'; // ADDED

export default function SettingsScreen() {
    const { emergencyContact, setEmergencyContact } = useDrowsinessStore();
    const {
        globalThreshold,
        setGlobalThreshold,
        startCalibration,
        isCalibrating,
        calibrationProgress
    } = useEyeDetectionStore(); // ADDED
    const { isDarkMode, toggleDarkMode } = useThemeStore();
    const { language, setLanguage, t } = useI18nStore();
    const { settings, isCustomMode, setCustomMode, updateSettings } = useCustomSettingsStore();
    const { settings: coffeeRadarSettings, updateSettings: updateCoffeeRadarSettings } = useCoffeeRadarStore();
    const { userName, setUserName } = useVoiceCompanionStore();
    const { settings: appSettings, updateSettings: updateAppSettings } = useSettingsStore();
    const {
        isScanning,
        scannedDevices,
        isConnecting,
        connectedDevice,
        error: bleError,
        isConnected,
        startScanning,
        stopScanning,
        connect,
        disconnect,
        savedDevices,
        saveDevice,
        removeSavedDevice,
        connectToSavedDevices
    } = useBLEStore();

    const [name, setName] = useState(userName);
    const [strobeEnabled, setStrobeEnabled] = useState(true); // Default to ON
    const colors = getTheme(isDarkMode);
    const [contact, setContact] = useState(emergencyContact);
    const [showAbout, setShowAbout] = useState(false);
    const [operationMode, setOperationMode] = useState<'drive' | 'study' | 'custom'>(isCustomMode ? 'custom' : 'drive');

    React.useEffect(() => {
        // Load persistend settings on mount
        useDrowsinessStore.getState().loadSettings().then(() => {
            setContact(useDrowsinessStore.getState().emergencyContact);
        });

        setName(userName);
        setOperationMode(isCustomMode ? 'custom' : 'drive');
        // Load strobe setting (Default to true if null)
        AsyncStorage.getItem('strobe_enabled').then(val => {
            if (val === null) {
                setStrobeEnabled(true);
            } else {
                setStrobeEnabled(val === 'true');
            }
        });
    }, [isCustomMode, userName]); // Removed emergencyContact from dependency to avoid loop

    const handleModeChange = (mode: 'drive' | 'study' | 'custom') => {
        setOperationMode(mode);
        setCustomMode(mode === 'custom');
    };

    const handleSave = async () => {
        await setEmergencyContact(contact); // This now persists to AsyncStorage
        useVoiceCompanionStore.getState().setUserName(name);
        await AsyncStorage.setItem('strobe_enabled', strobeEnabled.toString());
        Alert.alert(t('success'), t('settingsSaved'));
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>



                {/* Language Selector */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('language')}</Text>
                    <View style={styles.languageButtons}>
                        <TouchableOpacity
                            style={[
                                styles.langButton,
                                { backgroundColor: colors.inputBg, borderColor: language === 'pt' ? colors.primary : 'transparent' }
                            ]}
                            onPress={() => setLanguage('pt')}
                        >
                            <Text style={[styles.langText, { color: language === 'pt' ? colors.primary : colors.textSecondary }]}>
                                🇵🇹 Português
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.langButton,
                                { backgroundColor: colors.inputBg, borderColor: language === 'en' ? colors.primary : 'transparent' }
                            ]}
                            onPress={() => setLanguage('en')}
                        >
                            <Text style={[styles.langText, { color: language === 'en' ? colors.primary : colors.textSecondary }]}>
                                🇬🇧 English
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Theme Toggle */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('appearance')}</Text>
                    <View style={styles.setting}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('darkMode')}</Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: '#767577', true: '#2196F3' }}
                            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                        />
                    </View>


                </View>

                {/* Eye Calibration - ALWAYS VISIBLE */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        👁️ {language === 'pt' ? 'Calibração de Deteção' : 'Detection Calibration'}
                    </Text>
                    <View style={styles.sliderContainer}>
                        <View style={styles.sliderHeader}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {language === 'pt' ? 'Sensibilidade (Olhos Fechados)' : 'Sensitivity (Closed Eyes)'}
                            </Text>
                            <Text style={[styles.sliderValue, { color: colors.primary }]}>
                                {(globalThreshold * 100).toFixed(0)}%
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: '#2196F3', marginTop: 10 }]}
                            onPress={startCalibration}
                        >
                            <Text style={styles.saveButtonText}>📏 Calibrar Automaticamente (3s)</Text>
                        </TouchableOpacity>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('eyeSensitivity')} (Manual)</Text>
                        <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
                            {((globalThreshold || 0.35) * 100).toFixed(0)}% (Default: 35%)
                        </Text>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0.10}
                            maximumValue={0.80}
                            step={0.01}
                            value={globalThreshold || 0.35}
                            onValueChange={setGlobalThreshold}
                            minimumTrackTintColor="#2196F3"
                            maximumTrackTintColor="#000000"
                        />
                        <View style={styles.sliderLabels}>
                            <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>
                                {language === 'pt' ? 'Menos Sensível' : 'Less Sensitive'}
                            </Text>
                            <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>
                                {language === 'pt' ? 'Mais Sensível' : 'More Sensitive'}
                            </Text>
                        </View>
                        <Text style={[styles.customHint, { color: colors.inactive }]}>
                            {language === 'pt'
                                ? '💡 Se o alarme toca com os olhos abertos, reduz este valor.'
                                : '💡 If alarm triggers with eyes open, reduce this value.'}
                        </Text>
                    </View>
                </View>

                {/* Operation Mode */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('operationMode')}</Text>
                    <View style={styles.modeButtons}>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                { backgroundColor: colors.inputBg, borderColor: operationMode === 'drive' ? colors.primary : 'transparent' }
                            ]}
                            onPress={() => handleModeChange('drive')}
                        >
                            <Text style={styles.modeEmoji}>🚗</Text>
                            <Text style={[styles.modeText, { color: operationMode === 'drive' ? colors.primary : colors.textSecondary }]}>
                                {t('driving')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                { backgroundColor: colors.inputBg, borderColor: operationMode === 'study' ? colors.primary : 'transparent' }
                            ]}
                            onPress={() => handleModeChange('study')}
                        >
                            <Text style={styles.modeEmoji}>📚</Text>
                            <Text style={[styles.modeText, { color: operationMode === 'study' ? colors.primary : colors.textSecondary }]}>
                                {language === 'pt' ? 'Estudar' : 'Studying'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                { backgroundColor: colors.inputBg, borderColor: operationMode === 'custom' ? colors.primary : 'transparent' }
                            ]}
                            onPress={() => handleModeChange('custom')}
                        >
                            <Text style={styles.modeEmoji}>⚙️</Text>
                            <Text style={[styles.modeText, { color: operationMode === 'custom' ? colors.primary : colors.textSecondary }]}>
                                {language === 'pt' ? 'Personalizado' : 'Custom'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Custom Mode Settings */}
                {operationMode === 'custom' && (
                    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {language === 'pt' ? '⚙️ Configurações Personalizadas' : '⚙️ Custom Settings'}
                        </Text>

                        {/* Bluetooth Section */}
                        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                📡 {language === 'pt' ? 'Oculus Bluetooth' : 'Oculus Bluetooth'}
                            </Text>

                            <View style={styles.setting}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>
                                    {language === 'pt' ? 'Estado' : 'Status'}:
                                </Text>
                                <Text style={{ color: isConnected ? '#4CAF50' : colors.inactive, fontWeight: 'bold' }}>
                                    {isConnected
                                        ? (language === 'pt' ? 'Conectado' : 'Connected')
                                        : (isConnecting
                                            ? (language === 'pt' ? 'A conectar...' : 'Connecting...')
                                            : (language === 'pt' ? 'Desconectado' : 'Disconnected'))
                                    }
                                </Text>
                            </View>

                            {/* Scan Controls */}
                            <TouchableOpacity
                                style={[styles.button, {
                                    backgroundColor: isScanning ? colors.inactive : colors.primary,
                                    marginTop: 15,
                                    marginBottom: 15
                                }]}
                                onPress={isScanning ? stopScanning : startScanning}
                            >
                                <Text style={styles.buttonText}>
                                    {isScanning
                                        ? (language === 'pt' ? 'Parar Procura' : 'Stop Scanning')
                                        : (language === 'pt' ? 'Procurar Dispositivos' : 'Scan Devices')}
                                </Text>
                            </TouchableOpacity>

                            {/* Error Message */}
                            {bleError && (
                                <Text style={[styles.errorText, { color: '#F44336' }]}>
                                    {bleError}
                                </Text>
                            )}

                            {/* Devices List */}
                            {scannedDevices.length > 0 && (
                                <View style={styles.deviceList}>
                                    <Text style={[styles.subDate, { color: colors.textSecondary, marginBottom: 10 }]}>
                                        {language === 'pt' ? 'Dispositivos Encontrados:' : 'Found Devices:'}
                                    </Text>
                                    {scannedDevices.map((device) => (
                                        <TouchableOpacity
                                            key={device.id}
                                            style={[styles.deviceItem, {
                                                backgroundColor: colors.inputBg,
                                                borderColor: connectedDevice?.id === device.id ? '#4CAF50' : colors.border
                                            }]}
                                            onPress={() => connect(device.id)}
                                            disabled={isConnecting || connectedDevice?.id === device.id}
                                        >
                                            <View>
                                                <Text style={[styles.deviceName, { color: colors.text }]}>
                                                    {device.name || (language === 'pt' ? 'Dispositivo Sem Nome' : 'Unnamed Device')}
                                                </Text>
                                                <Text style={[styles.deviceId, { color: colors.textSecondary }]}>
                                                    {device.id}
                                                </Text>
                                            </View>
                                            {connectedDevice?.id === device.id ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</Text>
                                                    {!savedDevices.includes(device.id) && (
                                                        <TouchableOpacity
                                                            style={[styles.smallButton, { backgroundColor: colors.primary, paddingVertical: 5, paddingHorizontal: 10 }]}
                                                            onPress={() => saveDevice(device.id)}
                                                        >
                                                            <Text style={{ color: '#FFF', fontSize: 12 }}>
                                                                {language === 'pt' ? 'Guardar' : 'Save'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ) : null}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Connected Device Actions */}
                            {isConnected && (
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: '#FF3B30', marginTop: 10 }]}
                                    onPress={disconnect}
                                >
                                    <Text style={styles.buttonText}>
                                        {language === 'pt' ? 'Desconectar' : 'Disconnect'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Saved Devices Section */}
                            {savedDevices.length > 0 && (
                                <View style={styles.deviceList}>
                                    <Text style={[styles.subDate, { color: colors.textSecondary, marginBottom: 10 }]}>
                                        {language === 'pt' ? 'Meus Dispositivos:' : 'My Devices:'}
                                    </Text>
                                    {savedDevices.map((deviceId) => (
                                        <View
                                            key={deviceId}
                                            style={[styles.deviceItem, {
                                                backgroundColor: colors.inputBg,
                                                borderColor: connectedDevice?.id === deviceId ? '#4CAF50' : colors.border
                                            }]}
                                        >
                                            <View>
                                                <Text style={[styles.deviceName, { color: colors.text }]}>
                                                    {language === 'pt' ? 'Óculos Guardado' : 'Saved Glasses'}
                                                </Text>
                                                <Text style={[styles.deviceId, { color: colors.textSecondary }]}>
                                                    {deviceId}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                {connectedDevice?.id !== deviceId && (
                                                    <TouchableOpacity
                                                        style={[styles.smallButton, { backgroundColor: colors.primary }]}
                                                        onPress={() => connect(deviceId)}
                                                        disabled={isConnecting}
                                                    >
                                                        <Text style={{ color: '#FFF' }}>
                                                            {language === 'pt' ? 'Conectar' : 'Connect'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    onPress={() => removeSavedDevice(deviceId)}
                                                >
                                                    <Text style={{ fontSize: 20 }}>❌</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 15 }} />

                            <Text style={[styles.customHint, { color: colors.inactive, marginTop: 15 }]}>
                                {language === 'pt'
                                    ? '💡 Certifica-te que os óculos estão ligados.'
                                    : '💡 Make sure the glasses are turned on.'}
                            </Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <View style={styles.sliderHeader}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>
                                    {language === 'pt' ? 'Duração (olhos fechados)' : 'Duration (eyes closed)'}
                                </Text>
                                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                                    {settings.eyeClosureDuration}s
                                </Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={3}
                                maximumValue={30}
                                step={1}
                                value={settings.eyeClosureDuration}
                                onValueChange={(value: number) => updateSettings({ eyeClosureDuration: value })}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.inactive}
                                thumbTintColor={colors.primary}
                            />
                            <View style={styles.sliderLabels}>
                                <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>3s</Text>
                                <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>30s</Text>
                            </View>
                        </View>

                        {/* Eye Open Threshold (Sensitivity) */}
                        <View style={styles.sliderContainer}>
                            <View style={styles.sliderHeader}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>
                                    {language === 'pt' ? 'Sensibilidade' : 'Sensitivity'}
                                </Text>
                                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                                    {Math.round(settings.eyeOpenThreshold * 100)}%
                                </Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={0.2}
                                maximumValue={0.7}
                                step={0.05}
                                value={settings.eyeOpenThreshold}
                                onValueChange={(value: number) => updateSettings({ eyeOpenThreshold: value })}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.inactive}
                                thumbTintColor={colors.primary}
                            />
                            <View style={styles.sliderLabels}>
                                <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>
                                    {language === 'pt' ? 'Mais sensível' : 'More sensitive'}
                                </Text>
                                <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>
                                    {language === 'pt' ? 'Menos sensível' : 'Less sensitive'}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.customHint, { color: colors.inactive }]}>
                            {language === 'pt'
                                ? '💡 Ajuste estas configurações se o alarme disparar muito rápido ou lento.'
                                : '💡 Adjust these settings if the alarm triggers too fast or slow.'}
                        </Text>
                    </View>
                )}

                {/* Emergency Contact */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('emergencyContact')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                        value={contact}
                        onChangeText={setContact}
                        keyboardType="phone-pad"
                        placeholder={t('enterPhoneNumber')}
                        placeholderTextColor={colors.inactive}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Coffee Radar Settings */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        ☕ {t('coffeeRadar')}
                    </Text>

                    {/* Enable/Disable Coffee Radar */}
                    <View style={styles.setting}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>
                            {language === 'pt' ? 'Ativar Coffee Radar' : 'Enable Coffee Radar'}
                        </Text>
                        <Switch
                            value={coffeeRadarSettings.enabled}
                            onValueChange={(value) => updateCoffeeRadarSettings({ enabled: value })}
                            trackColor={{ false: '#767577', true: '#2196F3' }}
                            thumbColor={coffeeRadarSettings.enabled ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {coffeeRadarSettings.enabled && (
                        <>
                            {/* Search Radius */}
                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 10 }]}>
                                    {language === 'pt' ? 'Raio de Pesquisa' : 'Search Radius'}
                                </Text>
                                <View style={styles.modeButtons}>
                                    {[2, 5, 10].map((radius) => (
                                        <TouchableOpacity
                                            key={radius}
                                            style={[
                                                styles.radiusButton,
                                                {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: coffeeRadarSettings.searchRadiusKm === radius ? colors.primary : 'transparent'
                                                }
                                            ]}
                                            onPress={() => updateCoffeeRadarSettings({ searchRadiusKm: radius })}
                                        >
                                            <Text style={[styles.radiusText, { color: coffeeRadarSettings.searchRadiusKm === radius ? colors.primary : colors.textSecondary }]}>
                                                {radius}km
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Auto Dismiss Time */}
                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 10 }]}>
                                    {language === 'pt' ? 'Fechar Automaticamente Após' : 'Auto Dismiss After'}
                                </Text>
                                <View style={styles.modeButtons}>
                                    {[0, 15, 30, 60].map((seconds) => (
                                        <TouchableOpacity
                                            key={seconds}
                                            style={[
                                                styles.radiusButton,
                                                {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: coffeeRadarSettings.autoDismissSeconds === seconds ? colors.primary : 'transparent'
                                                }
                                            ]}
                                            onPress={() => updateCoffeeRadarSettings({ autoDismissSeconds: seconds })}
                                        >
                                            <Text style={[styles.radiusText, { color: coffeeRadarSettings.autoDismissSeconds === seconds ? colors.primary : colors.textSecondary }]}>
                                                {seconds === 0 ? (language === 'pt' ? 'Nunca' : 'Never') : `${seconds}s`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <Text style={[styles.customHint, { color: colors.inactive }]}>
                                {language === 'pt'
                                    ? '💡 O Coffee Radar sugere pausas quando deteta fadiga média, antes de atingir níveis críticos.'
                                    : '💡 Coffee Radar suggests breaks when it detects medium fatigue, before reaching critical levels.'}
                            </Text>
                        </>
                    )}
                </View>



                {/* Voice Companion Settings */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        🗣️ {language === 'pt' ? 'Conversa Comigo' : 'Voice Companion'}
                    </Text>

                    {/* Enable/Disable Voice Companion */}
                    <View style={styles.setting}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>
                            {language === 'pt' ? 'Ativar Voz' : 'Enable Voice'}
                        </Text>
                        <Switch
                            value={useVoiceCompanionStore((state) => state.isEnabled)}
                            onValueChange={(value) => useVoiceCompanionStore.getState().setEnabled(value)}
                            trackColor={{ false: '#767577', true: '#2196F3' }}
                        />
                    </View>



                    {/* User Name Input */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 10 }]}>
                            {language === 'pt' ? 'O teu nome (para a IA)' : 'Your Name (for AI)'}
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder={language === 'pt' ? 'Como queres ser tratado?' : 'How should I call you?'}
                            placeholderTextColor={colors.inactive}
                        />
                    </View>

                    {useVoiceCompanionStore((state) => state.isEnabled) && (
                        <>
                            {/* Mode Selector */}
                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 10 }]}>
                                    {language === 'pt' ? 'Modo' : 'Mode'}
                                </Text>
                                <View style={styles.modeButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.radiusButton,
                                            {
                                                backgroundColor: colors.inputBg,
                                                borderColor: useVoiceCompanionStore((state) => state.mode) === 'challenge' ? colors.primary : 'transparent'
                                            }
                                        ]}
                                        onPress={() => useVoiceCompanionStore.getState().setMode('challenge')}
                                    >
                                        <Text style={[styles.radiusText, { color: useVoiceCompanionStore((state) => state.mode) === 'challenge' ? colors.primary : colors.textSecondary }]}>
                                            {language === 'pt' ? 'Desafios' : 'Challenge'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.radiusButton,
                                            {
                                                backgroundColor: colors.inputBg,
                                                borderColor: useVoiceCompanionStore((state) => state.mode) === 'companion' ? colors.primary : 'transparent'
                                            }
                                        ]}
                                        onPress={() => useVoiceCompanionStore.getState().setMode('companion')}
                                    >
                                        <Text style={[styles.radiusText, { color: useVoiceCompanionStore((state) => state.mode) === 'companion' ? colors.primary : colors.textSecondary }]}>
                                            {language === 'pt' ? 'Companheiro' : 'Companion'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Interval Slider */}
                            <View style={styles.sliderContainer}>
                                <View style={styles.sliderHeader}>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'pt' ? 'Intervalo' : 'Interval'}
                                    </Text>
                                    <Text style={[styles.sliderValue, { color: colors.primary }]}>
                                        {useVoiceCompanionStore((state) => state.intervalMinutes)} min
                                    </Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={15}
                                    maximumValue={60}
                                    step={5}
                                    value={useVoiceCompanionStore((state) => state.intervalMinutes)}
                                    onValueChange={(value) => useVoiceCompanionStore.getState().setIntervalMinutes(value)}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor={colors.inactive}
                                    thumbTintColor={colors.primary}
                                />
                            </View>

                            <Text style={[styles.customHint, { color: colors.inactive }]}>
                                {language === 'pt'
                                    ? '💡 A app fará perguntas ou comentários para te manter alerta.'
                                    : '💡 The app will ask questions or make comments to keep you alert.'}
                            </Text>
                        </>
                    )}
                </View>

                {/* About */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setShowAbout(true)}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('about')}</Text>
                        <Text style={[styles.infoText, { color: colors.inactive }]}>Oculus V1.0.RM</Text>
                    </TouchableOpacity>
                </View>

                {/* About Modal */}
                <Modal visible={showAbout} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Oculus V1.0.RM</Text>
                            <Text style={[styles.modalText, { color: colors.textSecondary, marginTop: 20 }]}>
                                {language === 'pt'
                                    ? 'Sistema Inteligente de Deteção de Sonolência'
                                    : 'Intelligent Drowsiness Detection System'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={() => setShowAbout(false)}
                            >
                                <Text style={styles.modalButtonText}>{t('ok')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </ScrollView>
            {/* CALIBRATION MODAL */}
            <Modal visible={isCalibrating} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                        {language === 'pt' ? 'Olhe para a câmara' : 'Look at the camera'}
                    </Text>

                    {/* CAMERA PREVIEW FOR CALIBRATION */}
                    <View style={{ width: 200, height: 260, borderRadius: 20, overflow: 'hidden', marginBottom: 30, borderWidth: 2, borderColor: '#2196F3' }}>
                        <CameraViewComponent isCalibration={true} />
                    </View>

                    <Text style={{ color: '#FFF', fontSize: 16, marginBottom: 10 }}>
                        {language === 'pt' ? 'A medir abertura...' : 'Measuring openness...'}
                    </Text>

                    <View style={{ width: '80%', height: 10, backgroundColor: '#333', borderRadius: 5 }}>
                        <View style={{ width: `${calibrationProgress}%`, height: '100%', backgroundColor: '#2196F3', borderRadius: 5 }} />
                    </View>
                    <Text style={{ color: '#aaa', marginTop: 10 }}>{calibrationProgress}%</Text>

                    <TouchableOpacity onPress={useEyeDetectionStore.getState().cancelCalibration} style={{ marginTop: 30, padding: 10 }}>
                        <Text style={{ color: '#F44336', fontSize: 16 }}>{language === 'pt' ? 'Cancelar' : 'Cancel'}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    section: {
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    languageButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    langButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
    },
    langText: {
        fontSize: 14,
        fontWeight: '600',
    },
    setting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
    },
    modeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    modeButton: {
        minWidth: '30%',
        flex: 1,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    modeEmoji: {
        fontSize: 40,
        marginBottom: 10,
    },
    modeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
    },
    saveButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 14,
        marginBottom: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
    },
    modalButton: {
        marginTop: 30,
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 10,
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sliderContainer: {
        marginBottom: 20,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sliderValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -5,
    },
    sliderLabelText: {
        fontSize: 12,
    },
    customHint: {
        fontSize: 13,
        marginTop: 10,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    radiusButton: {
        minWidth: '22%',
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
    },
    radiusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deviceList: {
        marginTop: 10,
    },
    deviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
    },
    deviceId: {
        fontSize: 12,
        marginTop: 2,
    },
    subDate: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
});
