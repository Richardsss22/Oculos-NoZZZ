import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getTheme, ThemeType, AccentType } from '../../styles/UltraTheme';

interface GradientCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    themeMode?: ThemeType;
    accent?: AccentType;
    variant?: 'elevated' | 'glass';
}

export const GradientCard: React.FC<GradientCardProps> = ({
    children,
    onPress,
    style,
    themeMode = 'dark',
    accent = 'ocean',
    variant = 'glass'
}) => {
    const theme = getTheme(themeMode, accent);
    const bgColor = variant === 'elevated' ? theme.bgElevated : theme.bgCard;

    const Content = (
        <View style={[
            styles.card,
            {
                borderColor: theme.border,
                backgroundColor: bgColor,
                shadowColor: theme.shadow.shadowColor,
                shadowOffset: theme.shadow.shadowOffset,
                shadowOpacity: theme.shadow.shadowOpacity,
                shadowRadius: theme.shadow.shadowRadius,
                elevation: theme.shadow.elevation
            },
            style
        ]}>
            <BlurView intensity={20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            {/* Shine Effect Placeholder - Animations would go here */}
            <View style={{ zIndex: 10 }}>
                {children}
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                {Content}
            </TouchableOpacity>
        );
    }

    return Content;
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 16,
    },
});
