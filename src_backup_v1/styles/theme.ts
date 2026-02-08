import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;

  primary: string;
  danger: string;
  success: string;

  inputBg: string;
  inactive: string;
};

interface ThemeState {
  isDarkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false, // default light como tinhas

      setDarkMode: (v) => set({ isDarkMode: v }),
      toggleDarkMode: () => set({ isDarkMode: !get().isDarkMode }),
    }),
    {
      name: 'themeStore-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const getTheme = (isDark: boolean): Theme => (isDark ? darkTheme : lightTheme);

const lightTheme: Theme = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',

  primary: '#2196F3',
  danger: '#FF3B30',
  success: '#4CAF50',

  inputBg: '#F0F0F0',
  inactive: '#999999',
};

const darkTheme: Theme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',

  primary: '#2196F3',
  danger: '#FF3B30',
  success: '#4CAF50',

  inputBg: '#2C2C2C',
  inactive: '#666666',
};