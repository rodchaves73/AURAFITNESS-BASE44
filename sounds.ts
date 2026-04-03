
/**
 * @fileOverview AURA SOUND SYSTEM v5.6 - Tactical RPG Audio (High-Performance)
 * Gerencia a biblioteca de sons do sistema usando Web Audio API para latência zero.
 */

export const SOUND_URLS = {
  CLICK: '/buttonsfx.mp3', // Novo selo sonoro de interface (local)
  KEYBOARD: '/Keyboard 2.mp3',   // Rastro de clique único para sincronia de digitação
  CONFIRM: 'https://actions.google.com/sounds/v1/foley/key_in_lock.ogg',
  PORTAL_WHOOSH: '/Warp magic.mp3', // Som de carregamento do portal (local)
  LEVEL_UP: 'https://actions.google.com/sounds/v1/alarms/chime_short.ogg',
  BEEP: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
};

let audioCtx: AudioContext | null = null;
const soundBuffers: Record<string, AudioBuffer> = {};

/**
 * Inicializa o Contexto de Áudio e pré-carrega os sons essenciais.
 * Deve ser chamado via interação do usuário para desbloquear Autoplay.
 */
export async function initializeAudio() {
  if (typeof window === 'undefined') return;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  // Pré-carrega todos os sons para garantir resposta imediata
  const loadTasks = Object.values(SOUND_URLS).map(url => loadSoundIntoBuffer(url));
  await Promise.all(loadTasks);
}

/**
 * Decodifica o som para um buffer de áudio em memória.
 */
async function loadSoundIntoBuffer(url: string) {
  if (!audioCtx) return;
  if (soundBuffers[url]) return;

  try {
    const encodedUrl = url.includes(' ') ? encodeURI(url) : url;
    const response = await fetch(encodedUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    soundBuffers[url] = audioBuffer;
  } catch (e) {
    // Silêncio tático em caso de erro de carregamento
  }
}

/**
 * Dispara o som com latência zero usando BufferSource.
 */
export function playSound(url: string, volume: number = 0.4) {
  if (typeof window === 'undefined') return;

  // Se o contexto não existir, tenta criar
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Essencial para navegadores móveis: resume o contexto no clique
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Se o buffer não estiver pronto, tenta carregar para a próxima vez
  if (!soundBuffers[url]) {
    loadSoundIntoBuffer(url);
    return;
  }

  try {
    const source = audioCtx.createBufferSource();
    source.buffer = soundBuffers[url];

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(0);
  } catch (e) {
    // Prevenção de crash no Nexus
  }
}
