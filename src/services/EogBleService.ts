import { create } from 'zustand';
import { Device, Characteristic, Subscription } from 'react-native-ble-plx';

const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // write
const TX_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // notify

export type Phase =
  | 'idle'              // Button: "Calibrar"
  | 'calibrating'       // Button: "Abortar" (countdown 20s + depois "A processar…")
  | 'ready_blink'       // Button: "Pisque"
  | 'baseline'          // Button: "Abortar" (countdown 30s)
  | 'ready_start'       // Button: "Iniciar"
  | 'running'           // Button: "Abortar" (sem countdown, sessão infinita)
  | 'done'
  | 'error';

// =========================
// Base64 helpers (sem deps)
// =========================
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function btoa_custom(input: string = '') {
  let str = input;
  let output = '';
  for (let block = 0, charCode: number, i = 0, map = chars;
    str.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))) {

    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xFF) throw new Error("'btoa' failed: contains characters outside Latin1 range.");
    block = (block << 8) | charCode;
  }
  return output;
}

function atob_custom(input: string = '') {
  const str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }

  let bc = 0;
  let bs = 0;
  let buffer = 0;
  let i = 0;

  while (i < str.length) {
    buffer = chars.indexOf(str.charAt(i++));
    if (buffer === -1) continue;

    bs = bc % 4 ? bs * 64 + buffer : buffer;

    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }

  return output;
}

// =========================
// Timers (fora do Zustand)
// =========================
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let phaseTimeout: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (phaseTimeout) {
    clearTimeout(phaseTimeout);
    phaseTimeout = null;
  }
}

// =========================
// Estado
// =========================
interface State {
  device: Device | null;
  rx: Characteristic | null;
  subscription: Subscription | null;

  phase: Phase;
  buttonLabel: string;
  countdownSec: number | null;

  // texto grande por cima do botão (para “Não mexa”, “Pisque”, “A processar…”)
  statusText: string;

  // últimos dados (se quiseres mostrar junto aos “dados em tempo real”)
  lastMinuteLabel: string | null;
  lastNormal: number | null;
  lastSlow: number | null;
  lastFlag: 'S-' | 'NS-' | null;

  sendEmailReport: () => void;
  attachToDevice: (device: Device) => Promise<void>;
  detach: () => void;

  history: {
    minute: number;
    normal: number;
    slow: number;
  }[];
  pressMainButton: () => Promise<void>;
  abort: () => Promise<void>;
}

export const useEogBleStore = create<State>((set, get) => ({
  device: null,
  rx: null,
  subscription: null,

  phase: 'idle',
  buttonLabel: 'Calibrar',
  countdownSec: null,
  statusText: '',

  lastMinuteLabel: null,
  lastNormal: null,
  lastSlow: null,
  lastFlag: null,
  history: [],

  sendEmailReport: () => {
    const { history, lastMinuteLabel } = get();
    if (history.length === 0 && !lastMinuteLabel) {
      console.log('[EOG] Sem dados para reportar.');
      return;
    }

    // Importar stores aqui para garantir acesso ao estado mais recente e evitar ciclos
    const { useLocationStore } = require('./LocationService');

    let body = `Relatório de Sessão Oculus\n\n`;
    body += `Estado Final: ${get().lastFlag === 'S-' ? 'SONO DETETADO' : 'Normal'}\n`;
    body += `Duração: ~${history.length} minutos\n\n`;

    body += `--- Histórico de Piscadelas ---\n`;
    body += `Minuto | Normais | Lentas\n`;
    history.forEach(h => {
      body += `M${h.minute} | ${h.normal} | ${h.slow}\n`;
    });

    // Dados de Condução
    const locState = useLocationStore.getState();
    if (locState.isDriving || locState.distanceKmThisTrip > 0) {
      body += `\n--- Relatório de Condução ---\n`;
      body += `Estado: ${locState.isDriving ? 'Em Viagem' : 'Parado'}\n`;
      body += `Velocidade Atual: ${Math.round(locState.speed)} km/h\n`;
      body += `Distância Sessão: ${locState.distanceKmThisTrip.toFixed(2)} km\n`;
      body += `Velocidade Máx: ${Math.round(locState.maxSpeedThisTrip)} km/h\n`;
    }

    console.log('[EOG] Gerando email de relatório...');
    const subject = `Relatório Oculus - ${new Date().toLocaleString()}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Tenta abrir o cliente de email
    const { Linking } = require('react-native');
    Linking.openURL(url).catch((err: any) => console.log('Erro ao abrir email:', err));
  },

  attachToDevice: async (device: Device) => {
    // se já está ligado a este device, não faz nada
    if (get().device?.id === device.id) return;

    try {
      const connected = await device.isConnected();
      if (!connected) return;

      await device.discoverAllServicesAndCharacteristics();

      // Forma mais robusta de obter chars por serviço
      const charsForService = await device.characteristicsForService(SERVICE_UUID);
      const rx = charsForService.find(c => c.uuid.toLowerCase() === RX_UUID.toLowerCase()) || null;
      const tx = charsForService.find(c => c.uuid.toLowerCase() === TX_UUID.toLowerCase()) || null;

      if (!rx || !tx) {
        console.log('[EOG] RX/TX não encontrados no serviço NUS.');
        return;
      }

      // limpar timers de sessões anteriores
      clearTimers();

      // monitorizar TX (notify)
      const sub = tx.monitor((e, c) => {
        if (e) {
          console.log('[EOG] Monitor error:', e);
          return;
        }
        const valueB64 = c?.value;
        if (!valueB64) return;

        let line = '';
        try {
          line = atob_custom(valueB64).trim();
        } catch (err) {
          console.log('[EOG] Decode error:', err);
          return;
        }

        if (!line) return;
        handleIncomingLine(line);
      });

      set({
        device,
        rx,
        subscription: sub,

        phase: 'idle',
        buttonLabel: 'Calibrar',
        countdownSec: null,
        statusText: '',
        lastMinuteLabel: null,
        lastNormal: null,
        lastSlow: null,
        lastFlag: null,
        history: [],
      });

      console.log('[EOG] Attached OK.');

    } catch (err) {
      console.log('[EOG] Error attaching:', err);
      set({ phase: 'error', statusText: 'Erro a ligar ao sensor.' });
    }

    function handleIncomingLine(line: string) {
      console.log('[EOG] RX:', line);

      // 1) Mensagens finais de calibração
      // REGEX MUITO PERMISSIVO (ignora "Calibração" se estiver estragado o encoding)

      if (/mal.*efetuada/i.test(line) || /tente\s*novamente/i.test(line)) {
        clearTimers();
        set({
          phase: 'idle',
          buttonLabel: 'Calibrar',
          countdownSec: null,
          statusText: 'Calibração mal efetuada',
        });
        return;
      }

      if (/conclu/i.test(line) || /sucesso/i.test(line)) {
        clearTimers();
        set({
          phase: 'ready_blink',
          buttonLabel: 'Pisque',
          countdownSec: null,
          statusText: 'Calibração concluída',
        });
        return;
      }

      // 2) Arrays por minuto vindos do S:
      // formato: ["M1",12,3,"S-"]
      if (line.startsWith('[') && line.endsWith(']')) {
        try {
          const arr = JSON.parse(line);
          const label = String(arr?.[0] ?? '');
          const normal = Number(arr?.[1] ?? NaN);
          const slow = Number(arr?.[2] ?? NaN);
          const flag = String(arr?.[3] ?? '') as 'S-' | 'NS-';

          if (label.startsWith('M') && Number.isFinite(normal) && Number.isFinite(slow) && (flag === 'S-' || flag === 'NS-')) {
            const minuteNum = parseInt(label.substring(1), 10) || 0;

            set(state => {
              const newHistory = [
                ...state.history,
                { minute: minuteNum, normal, slow }
              ];
              // Optional: limit history size if needed, e.g. slice(-60)
              return {
                lastMinuteLabel: label,
                lastNormal: normal,
                lastSlow: slow,
                lastFlag: flag,
                history: newHistory,
              };
            });

            // TRIGGER ALARM IF DROWSY
            if (flag === 'S-') {
              console.log('[EOG] Drowsiness Detected! Triggering Alarm...');
              // Import directly to avoid circular dependency issues at top level if any
              const { useEyeDetectionStore } = require('./EyeDetectionService');
              useEyeDetectionStore.getState().triggerAlarm();
            }
          }
        } catch {
          // ignora
        }
      }
    }
  },

  detach: () => {
    clearTimers();
    const { subscription } = get();
    subscription?.remove();
    set({
      device: null,
      rx: null,
      subscription: null,
      phase: 'idle',
      buttonLabel: 'Calibrar',
      countdownSec: null,
      statusText: '',
      lastMinuteLabel: null,
      lastNormal: null,
      lastSlow: null,
      lastFlag: null,
      history: [],
    });
  },

  pressMainButton: async () => {
    const { phase, rx } = get();
    if (!rx) return;

    const write = async (cmd: string) => {
      const payload = btoa_custom(cmd + '\n');
      // Tenta enviar SEM bloquear (evita crash do BLE em loop ou se ocupado)
      try {
        await rx.writeWithoutResponse(payload);
        return;
      } catch { }
      // Fallback
      await rx.writeWithResponse(payload);
    };

    // =========================
    // CALIBRAR (C)
    // =========================
    if (phase === 'idle') {
      clearTimers();

      set({
        phase: 'calibrating',
        buttonLabel: 'Abortar',
        countdownSec: 10,
        statusText: 'Não mexa nem pisque',
      });

      // countdown local 10s
      let sec = 10;
      countdownTimer = setInterval(() => {
        sec -= 1;
        if (sec >= 0) {
          set({ countdownSec: sec });
        }
        if (sec <= 0) {
          // passa para a fase “pisque 10s”
          clearTimers();
          set({
            phase: 'calibrating',
            buttonLabel: 'Abortar',
            countdownSec: 10,
            statusText: 'Pisque normalmente',
          });

          let sec2 = 10;
          countdownTimer = setInterval(() => {
            sec2 -= 1;
            if (sec2 >= 0) {
              set({ countdownSec: sec2 });
            }
            if (sec2 <= 0) {
              // terminou o tempo — agora o ESP32 vai “processar” e depois manda:
              // "Calibração concluída" OU "Calibração mal efetuada"
              clearTimers();
              set({
                phase: 'calibrating',
                buttonLabel: 'Abortar',
                countdownSec: null,
                statusText: 'A processar…',
              });
            }
          }, 1000);
        }
      }, 1000);

      try {
        await write('C');
      } catch (e) {
        console.log('[EOG] erro a enviar C:', e);
        clearTimers();
        set({ phase: 'idle', buttonLabel: 'Calibrar', countdownSec: null, statusText: 'Falha ao enviar C.' });
      }

      return;
    }

    // =========================
    // PISQUE (P)
    // =========================
    if (phase === 'ready_blink') {
      clearTimers();
      set({
        phase: 'baseline',
        buttonLabel: 'Abortar',
        countdownSec: 30,
        statusText: 'Pisque normalmente',
      });

      // countdown local 30s
      let sec = 30;
      countdownTimer = setInterval(() => {
        sec -= 1;
        if (sec >= 0) set({ countdownSec: sec });
        if (sec <= 0) {
          clearTimers();
          // acabou o P — mostramos “Iniciar”
          set({
            phase: 'ready_start',
            buttonLabel: 'Iniciar',
            countdownSec: null,
            statusText: '',
          });
        }
      }, 1000);

      try {
        await write('P');
      } catch (e) {
        console.log('[EOG] erro a enviar P:', e);
        clearTimers();
        set({ phase: 'ready_blink', buttonLabel: 'Pisque', countdownSec: null, statusText: 'Falha ao enviar P.' });
      }

      return;
    }

    // =========================
    // INICIAR (S)
    // =========================
    if (phase === 'ready_start' || phase === 'done') {
      clearTimers();
      set({
        phase: 'running',
        buttonLabel: 'Abortar',
        countdownSec: null,
        statusText: '',
      });

      try {
        await write('S');
      } catch (e) {
        console.log('[EOG] erro a enviar S:', e);
        set({ phase: 'ready_start', buttonLabel: 'Iniciar', statusText: 'Falha ao enviar S.' });
      }

      return;
    }

    // =========================
    // ABORTAR (X)
    // =========================
    if (phase === 'calibrating' || phase === 'baseline' || phase === 'running') {
      await get().abort();
      return;
    }
  },

  abort: async () => {
    const { rx, phase } = get();
    clearTimers();

    // manda X para o sensor (é isto que te faltava)
    if (rx) {
      const payload = btoa_custom('X\n');
      try {
        await rx.writeWithoutResponse(payload);
      } catch {
        try { await rx.writeWithResponse(payload); } catch (e) { console.log('[EOG] X fail', e); }
      }
    }

    // reset UI
    // - se estava a correr S: volta a “Iniciar”
    // - se estava em C ou P: volta a “Calibrar”
    if (phase === 'running') {
      set({
        phase: 'ready_start',
        buttonLabel: 'Iniciar',
        countdownSec: null,
        statusText: '',
      });
      return;
    }

    set({
      phase: 'idle',
      buttonLabel: 'Calibrar',
      countdownSec: null,
      statusText: '',
    });
  },
}));
