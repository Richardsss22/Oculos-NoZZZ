import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { getTheme, ThemeType, AccentType } from '../../styles/UltraTheme';

interface GlassPaneProps {
    children: React.ReactNode;
    intensity?: number;
    style?: ViewStyle;
    themeMode?: ThemeType;
    accent?: AccentType;
}

export const GlassPane: React.FC<GlassPaneProps> = ({
    children,
    intensity = 20,
    style,
    themeMode = 'dark',
    accent = 'ocean'
}) => {
    const theme = getTheme(themeMode, accent);

    return (
        <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.bgCard }, style]}>
            <BlurView intensity={intensity} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderWidth: 1,
    },
});
