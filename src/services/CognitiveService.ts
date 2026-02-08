import { create } from 'zustand';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { useEyeDetectionStore } from './EyeDetectionService';

interface CognitiveState {
    isActive: boolean;
    lastCheckTime: number;
    checkIntervalMs: number;
    isListening: boolean;
    currentChallenge: { q: string, a: number } | null;

    startMonitoring: () => void;
    stopMonitoring: () => void;
    triggerCheck: () => Promise<void>;
    handleVoiceResult: (text: string) => Promise<void>;
    setupListeners: () => void;
}

// 20 minutes default
const DEFAULT_INTERVAL = 20 * 60 * 1000;

export const useCognitiveStore = create<CognitiveState>((set, get) => ({
    isActive: false,
    lastCheckTime: Date.now(),
    checkIntervalMs: DEFAULT_INTERVAL,
    isListening: false,
    currentChallenge: null,

    startMonitoring: () => {
        set({ isActive: true, lastCheckTime: Date.now() });
        // Loop check
        const interval = setInterval(() => {
            const { isActive, lastCheckTime, checkIntervalMs } = get();
            if (!isActive) {
                clearInterval(interval);
                return;
            }
            if (Date.now() - lastCheckTime > checkIntervalMs) {
                get().triggerCheck();
            }
        }, 60000); // Check every minute
    },

    stopMonitoring: () => {
        set({ isActive: false, isListening: false });
        try { Voice.stop(); } catch { }
        try { Speech.stop(); } catch { }
    },

    triggerCheck: async () => {
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        const sum = n1 + n2;

        set({
            currentChallenge: { q: `Quanto é ${n1} mais ${n2}?`, a: sum },
            lastCheckTime: Date.now(),
            isListening: true
        });

        // TTS
        Speech.speak(`Verificação de atenção. ${n1} mais ${n2}?`, {
            language: 'pt-PT',
            onDone: () => {
                try {
                    Voice.start('pt-PT');
                } catch (e) {
                    console.error(e);
                }
            }
        });

        // Timeout 10s -> Alert
        setTimeout(() => {
            const { isListening, currentChallenge } = get();
            if (isListening && currentChallenge) {
                // FAIL
                Speech.speak("Sem resposta. Alerta de atenção!");
                useEyeDetectionStore.getState().triggerAlarm();
                set({ isListening: false, currentChallenge: null });
            }
        }, 15000);
    },

    setupListeners: () => {
        Voice.onSpeechResults = (e) => {
            if (e.value && e.value.length > 0) {
                get().handleVoiceResult(e.value[0]);
            }
        };
    },

    handleVoiceResult: async (text: string) => {
        const { currentChallenge, isListening } = get();
        if (!isListening || !currentChallenge) return;

        console.log('[Cognitive] Heard:', text);

        // Simple parse
        const num = parseInt(text.replace(/[^0-9]/g, ''));
        const map: any = { 'um': 1, 'dois': 2, 'três': 3, 'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10, 'onze': 11, 'doze': 12, 'treze': 13, 'catorze': 14, 'quinze': 15, 'dezasseis': 16, 'dezassete': 17, 'dezoito': 18 };

        let val = isNaN(num) ? map[text.toLowerCase().trim()] : num;

        if (val === currentChallenge.a) {
            Speech.speak("Correto. Boa viagem.", { language: 'pt-PT' });
            set({ isListening: false, currentChallenge: null });
            try { await Voice.stop(); } catch { }
        } else {
            console.log('[Cognitive] Wrong answer');
            // Optionally retry
        }
    }
}));

// We need to hook up Voice.onSpeechResults somewhere globally or in a component.
// Since this is a store service, we can't easily hook events inside unless we init listeners in startMonitoring.
