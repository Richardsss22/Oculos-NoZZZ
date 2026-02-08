import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withSequence
} from 'react-native-reanimated';
import { getTheme, ThemeType, AccentType } from '../../styles/UltraTheme';

const { width, height } = Dimensions.get('window');

interface AmbientBackgroundProps {
    themeMode?: ThemeType;
    accent?: AccentType;
}

const Blob = ({ color, size, top, left, delay, duration }: any) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translateX.value = withRepeat(
            withSequence(
                withTiming(50, { duration: duration, easing: Easing.inOut(Easing.ease) }),
                withTiming(-50, { duration: duration, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        translateY.value = withRepeat(
            withSequence(
                withTiming(-30, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
                withTiming(30, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.9, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value }
            ],
        };
    });

    return (
        <Animated.View
            style={[
                styles.blob,
                {
                    backgroundColor: color,
                    width: size,
                    height: size,
                    top,
                    left,
                },
                style,
            ]}
        />
    );
};

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
    themeMode = 'dark',
    accent = 'ocean'
}) => {
    const theme = getTheme(themeMode, accent);
    const canRender = true; // Could add optimize check here

    if (!canRender) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bgGradient[0] }]}>
                {/* Simple gradient simulation if needed, but solid bg for now as base */}
            </View>

            {/* Blobs */}
            <Blob
                color={theme.blobs[0]}
                size={width * 1.2}
                top={-height * 0.1}
                left={width * 0.2}
                duration={10000}
            />
            <Blob
                color={theme.blobs[1]}
                size={width}
                top={height * 0.5}
                left={-width * 0.4}
                duration={12000}
            />
            <Blob
                color={theme.blobs[2]}
                size={width * 0.8}
                top={height * 0.2}
                left={width * 0.1}
                duration={15000}
            />

            {/* Blur Overlay to smooth everything out */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    blob: {
        position: 'absolute',
        borderRadius: 9999,
        opacity: 0.4,
        // Add strong blur
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
});
