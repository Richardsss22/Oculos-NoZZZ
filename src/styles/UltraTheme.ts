import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export type ThemeType = 'light' | 'dark';
export type AccentType = 'ocean' | 'blue' | 'sunrise' | 'black';

export const PALETTE = {
    ocean: {
        accent: '#06b6d4',
        accentDark: '#0891b2',
        accentLight: 'rgba(6, 182, 212, 0.12)',
        accentGlow: 'rgba(6, 182, 212, 0.3)',
        bgPrimary: ['#f0fdfa', '#ccfbf1', '#a5f3fc', '#7dd3fc'], // Light gradients
        bgPrimaryDark: ['#020617', '#0c4a6e', '#164e63'], // Dark gradients
        blob1: 'rgba(6, 182, 212, 0.4)',
        blob2: 'rgba(59, 130, 246, 0.3)',
        blob3: 'rgba(168, 85, 247, 0.2)',
    },
    blue: {
        accent: '#3b82f6',
        accentDark: '#1d4ed8',
        accentLight: 'rgba(59, 130, 246, 0.12)',
        accentGlow: 'rgba(59, 130, 246, 0.3)',
        bgPrimary: ['#eff6ff', '#dbeafe', '#bfdbfe'],
        bgPrimaryDark: ['#020617', '#1e1b4b', '#312e81'],
        blob1: 'rgba(59, 130, 246, 0.4)',
        blob2: 'rgba(37, 99, 235, 0.3)',
        blob3: 'rgba(147, 51, 234, 0.2)',
    },
    sunrise: {
        accent: '#f97316',
        accentDark: '#ea580c',
        accentLight: 'rgba(249, 115, 22, 0.12)',
        accentGlow: 'rgba(249, 115, 22, 0.3)',
        bgPrimary: ['#fff7ed', '#ffedd5', '#fed7aa', '#fbcfe8'],
        bgPrimaryDark: ['#1a0b2e', '#4c1d95', '#7c2d12'],
        blob1: 'rgba(249, 115, 22, 0.4)',
        blob2: 'rgba(236, 72, 153, 0.3)',
        blob3: 'rgba(168, 85, 247, 0.2)',
    },
    black: { // Special OLED mode
        accent: '#ffffff',
        accentDark: '#e5e5e5',
        accentLight: 'rgba(255, 255, 255, 0.1)',
        accentGlow: 'rgba(255, 255, 255, 0.2)',
        bgPrimary: ['#000000', '#000000'],
        bgPrimaryDark: ['#000000', '#000000'],
        blob1: 'rgba(255, 255, 255, 0.03)',
        blob2: 'rgba(255, 255, 255, 0.02)',
        blob3: 'rgba(255, 255, 255, 0.01)',
    }
};

export const COMMON = {
    light: {
        bgCard: 'rgba(255, 255, 255, 0.92)',
        bgElevated: 'rgba(255, 255, 255, 0.7)',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textTertiary: '#94a3b8',
        border: 'rgba(255, 255, 255, 0.6)',
        shadow: {
            shadowColor: '#06b6d4',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 32,
            elevation: 8,
        }
    },
    dark: {
        bgCard: 'rgba(15, 23, 42, 0.75)',
        bgElevated: 'rgba(30, 41, 59, 0.6)',
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        textTertiary: '#64748b',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 32,
            elevation: 10,
        }
    }
};

export const getTheme = (mode: ThemeType, accent: AccentType) => {
    const common = COMMON[mode];
    const palette = PALETTE[accent];

    return {
        ...common,
        accent: palette.accent,
        accentDark: palette.accentDark,
        accentLight: palette.accentLight,
        accentGlow: palette.accentGlow,
        bgGradient: mode === 'light' ? palette.bgPrimary : palette.bgPrimaryDark,
        blobs: [palette.blob1, palette.blob2, palette.blob3],
        isDark: mode === 'dark',
        dimensions: { width, height }
    };
};
