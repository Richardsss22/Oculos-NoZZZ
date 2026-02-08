import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useEogBleStore } from '../services/EogBleService';
import { useBLEStore } from '../services/BLEService';
import { useThemeStore, getTheme } from '../styles/theme';

export default function CalibrationButton() {
    const { connectedDevice } = useBLEStore();
    const { isDarkMode } = useThemeStore();
    const colors = getTheme(isDarkMode);

    const {
        phase,
        buttonLabel,
        countdownSec,
        statusText,
        attachToDevice,
        detach,
        pressMainButton,
    } = useEogBleStore();

    // Auto-attach when device is connected
    useEffect(() => {
        if (connectedDevice) {
            attachToDevice(connectedDevice);
        } else {
            detach();
        }
    }, [connectedDevice]);

    if (!connectedDevice) return null;

    return (
        <View style={styles.container}>
            {/* Show instructional text (e.g. "Não pisque") if present */}
            {!!statusText && (
                <Text style={[styles.statusText, { color: colors.text }]}>
                    {statusText}
                    {typeof countdownSec === 'number' ? ` ${countdownSec}` : ''}
                </Text>
            )}

            <TouchableOpacity
                style={[
                    styles.button,
                    (phase === 'calibrating' || phase === 'baseline' || phase === 'running') && styles.buttonAbort
                ]}
                onPress={pressMainButton}
            >
                <Text style={styles.text}>
                    {buttonLabel}
                    {/* Hide countdown in button if it's already shown in statusText */}
                    {!statusText && typeof countdownSec === 'number' ? ` ${countdownSec}` : ''}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#2196F3', // Blue for normal actions
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 200,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    buttonAbort: {
        backgroundColor: '#F44336', // Red for abort
    },
    text: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});
