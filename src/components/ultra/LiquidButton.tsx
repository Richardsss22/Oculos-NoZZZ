import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getTheme, ThemeType, AccentType } from '../../styles/UltraTheme';

interface LiquidButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    type?: 'primary' | 'secondary' | 'danger';
    themeMode?: ThemeType;
    accent?: AccentType;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
    title,
    onPress,
    icon,
    loading = false,
    style,
    textStyle,
    type = 'primary',
    themeMode = 'dark',
    accent = 'ocean'
}) => {
    const theme = getTheme(themeMode, accent);

    // Gradient Colors
    let colors: readonly [string, string] = [theme.accent, theme.accentDark];
    let textColor = '#ffffff';

    if (type === 'danger') {
        colors = ['#ef4444', '#dc2626'];
    } else if (type === 'secondary') {
        colors = ['transparent', 'transparent'];
        textColor = theme.accent;
    }

    const Content = (
        <>
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <>
                    {icon && <Ionicons name={icon} size={20} color={textColor} style={{ marginRight: 8 }} />}
                    <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
                </>
            )}
        </>
    );

    if (type === 'secondary') {
        return (
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accentLight, borderColor: 'transparent', borderWidth: 1 }, style]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                {Content}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.shadow,
                {
                    shadowColor: type === 'danger' ? '#ef4444' : theme.accent,
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                },
                style
            ]}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
            >
                {Content}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        overflow: 'hidden',
    },
    shadow: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
