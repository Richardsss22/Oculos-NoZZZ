import { create } from 'zustand';
import axios from 'axios';
import { useLocationStore } from './LocationService';
import { useEyeDetectionStore } from './EyeDetectionService';

interface WeatherState {
    isActive: boolean;
    currentCondition: number | null; // WMO Code
    startMonitoring: () => void;
    stopMonitoring: () => void;
    checkWeather: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
    isActive: false,
    currentCondition: null,

    startMonitoring: () => {
        set({ isActive: true });
        get().checkWeather();
        // Check every 30 mins
        const interval = setInterval(() => {
            if (!get().isActive) {
                clearInterval(interval);
                return;
            }
            get().checkWeather();
        }, 30 * 60 * 1000);
    },

    stopMonitoring: () => {
        set({ isActive: false });
    },

    checkWeather: async () => {
        const { location } = useLocationStore.getState();
        if (!location) return;

        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        try {
            console.log(`[Weather] Checking for ${lat},${lon}...`);
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
            const res = await axios.get(url);

            if (res.data && res.data.current_weather) {
                const code = res.data.current_weather.weathercode;
                set({ currentCondition: code });

                // WMO Codes
                // 45, 48: Fog
                // 51-67: Rain / Drizzle / Freezing Rain
                // 71-77: Snow
                // 80-82: Rain Showers
                // 95-99: Thunderstorm

                const isSevere =
                    (code === 45 || code === 48) ||
                    (code >= 51 && code <= 67) ||
                    (code >= 71 && code <= 82) ||
                    (code >= 95 && code <= 99);

                console.log(`[Weather] Code: ${code}, Severe: ${isSevere}`);

                useEyeDetectionStore.getState().setWeatherCondition(isSevere ? 'severe' : 'normal');

                if (isSevere) {
                    // Notify user via TTS? "Modo chuva ativado"
                    // Maybe just log for now to be non-intrusive, user sees Sensitivity?
                }
            }
        } catch (e) {
            console.error('[Weather] Failed to fetch', e);
        }
    }
}));
