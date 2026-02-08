import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { getTheme, ThemeType, AccentType } from '../../styles/UltraTheme';

const { width } = Dimensions.get('window');

interface UltraDockProps {
    state: any;
    descriptors: any;
    navigation: any;
    themeMode?: ThemeType;
    accent?: AccentType;
}

export const UltraDock: React.FC<UltraDockProps> = ({
    state,
    descriptors,
    navigation,
    themeMode = 'dark',
    accent = 'ocean'
}) => {
    const theme = getTheme(themeMode, accent);

    // Animation for entrance
    const translateY = useSharedValue(100);

    useEffect(() => {
        translateY.value = withSpring(0, { damping: 12 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <BlurView
                intensity={80}
                tint={theme.isDark ? 'dark' : 'light'}
                style={[styles.dock, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
            >
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate({ name: route.name, merge: true });
                        }
                    };

                    // Icons mapping
                    let iconName: keyof typeof Ionicons.glyphMap = 'square';
                    if (route.name === 'Dashboard') iconName = 'home';
                    if (route.name === 'Sensor') iconName = 'pulse';
                    if (route.name === 'History') iconName = 'stats-chart';
                    if (route.name === 'Settings') iconName = 'settings';

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={[
                                styles.tabItem,
                                isFocused && { backgroundColor: theme.accentLight }
                            ]}
                            activeOpacity={0.7}
                        >
                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                {isFocused && <View style={[styles.indicator, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />}
                                <Ionicons
                                    name={iconName}
                                    size={22}
                                    color={isFocused ? theme.accent : theme.textTertiary}
                                    style={{ marginBottom: 2 }}
                                />
                                <Text style={[
                                    styles.label,
                                    { color: isFocused ? theme.accent : theme.textTertiary, fontWeight: isFocused ? 'bold' : 'normal' }
                                ]}>
                                    {label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
    dock: {
        flexDirection: 'row',
        borderRadius: 32,
        padding: 6,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    tabItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        minWidth: 68,
        alignItems: 'center',
    },
    label: {
        fontSize: 10,
    },
    indicator: {
        position: 'absolute',
        top: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    }
});
