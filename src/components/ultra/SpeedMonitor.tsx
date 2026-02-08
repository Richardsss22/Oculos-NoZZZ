import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getTheme, ThemeType, AccentType } from '../../styles/UltraTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SpeedMonitorProps {
    speed: number;
    themeMode?: ThemeType;
    accent?: AccentType;
}

export const SpeedMonitor: React.FC<SpeedMonitorProps> = ({
    speed,
    themeMode = 'dark',
    accent = 'ocean'
}) => {
    const theme = getTheme(themeMode, accent);

    // Gauge Config
    const radius = 52;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    // Max speed 200km/h for full circle
    const maxSpeed = 200;

    const animatedStrokeDashoffset = useSharedValue(circumference);

    useEffect(() => {
        const offset = circumference - (speed / maxSpeed) * circumference;
        animatedStrokeDashoffset.value = withTiming(offset, {
            duration: 800,
            easing: Easing.out(Easing.exp),
        });
    }, [speed]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: animatedStrokeDashoffset.value,
    }));

    const getStatus = () => {
        if (speed === 0) return { text: 'PARADO', color: theme.textSecondary, bg: 'rgba(255,255,255,0.05)' };
        if (speed < 50) return { text: 'CONDUZIR', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
        return { text: 'RÁPIDO', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
    };

    const status = getStatus();

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>MONITOR DE VELOCIDADE</Text>
                <View style={styles.speedContainer}>
                    <Text style={[styles.speedValue, { color: theme.textPrimary }]}>{Math.round(speed)}</Text>
                    <Text style={[styles.unit, { color: theme.textTertiary }]}>km/h</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: status.bg }]}>
                    <Text style={[styles.pillText, { color: status.color }]}>{status.text}</Text>
                </View>
                <Text style={[styles.subtext, { color: theme.textTertiary }]}>Auto-ativação {'>'} 15 km/h</Text>
            </View>

            <View style={styles.gaugeContainer}>
                <Svg height="120" width="120" viewBox="0 0 120 120">
                    <Circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={theme.listBorderColor || 'rgba(128,128,128,0.2)'}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <AnimatedCircle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={theme.accent}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="60, 60"
                        animatedProps={animatedProps}
                    />
                </Svg>
                <View style={styles.iconContainer}>
                    <Ionicons name="speedometer-outline" size={32} color={theme.textTertiary} style={{ opacity: 0.5 }} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.7,
    },
    speedContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    speedValue: {
        fontSize: 42,
        fontWeight: 'bold',
        letterSpacing: -2,
    },
    unit: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 4,
    },
    pill: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 8,
    },
    pillText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    subtext: {
        fontSize: 10,
        opacity: 0.6,
    },
    gaugeContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        position: 'absolute',
    },
});
