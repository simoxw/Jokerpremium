// ===============================
// SISTEMA AUDIO PREMIUM CON GENERAZIONE PROGRAMMATICA
// ===============================

const AUDIO_SYSTEM = {
  enabled: true,
  volume: 0.3,
  audioContext: null,

  // Cache audio elements
  cache: {}
};

/**
 * Inizializza AudioContext per generazione suoni programmatica
 */
function initAudioContext() {
  if (!AUDIO_SYSTEM.audioContext) {
    try {
      AUDIO_SYSTEM.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API non supportata:", e);
    }
  }
  return AUDIO_SYSTEM.audioContext;
}

/**
 * Genera suono whoosh leggero per hover
 */
function generateWhooshSound() {
  const ctx = initAudioContext();
  if (!ctx) return null;
  
  const duration = 0.15;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Frequenza che scende rapidamente (whoosh)
    const freq = 800 - (t * 600);
    data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration) * 0.3;
  }
  
  return buffer;
}

/**
 * Genera suono ding celebrativo per vittoria
 */
function generateDingSound() {
  const ctx = initAudioContext();
  if (!ctx) return null;
  
  const duration = 0.4;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Due frequenze armoniche per suono celebrativo
    const freq1 = 523.25; // Do5
    const freq2 = 659.25; // Mi5
    const envelope = Math.exp(-t * 3);
    data[i] = (Math.sin(2 * Math.PI * freq1 * t) + 0.5 * Math.sin(2 * Math.PI * freq2 * t)) * envelope * 0.4;
  }
  
  return buffer;
}

/**
 * Genera suono blip soft per sconfitta
 */
function generateBlipSound() {
  const ctx = initAudioContext();
  if (!ctx) return null;
  
  const duration = 0.1;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Frequenza bassa e morbida
    const freq = 200;
    const envelope = Math.exp(-t * 15);
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25;
  }
  
  return buffer;
}

/**
 * Genera suono pop delicato per pescare
 */
function generatePopSound() {
  const ctx = initAudioContext();
  if (!ctx) return null;
  
  const duration = 0.08;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Frequenza che sale rapidamente (pop)
    const freq = 300 + (t * 200);
    const envelope = Math.exp(-t * 20);
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
  }
  
  return buffer;
}

/**
 * Riproduci buffer audio generato
 */
function playAudioBuffer(buffer) {
  if (!AUDIO_SYSTEM.enabled || !buffer) return;
  
  const ctx = initAudioContext();
  if (!ctx) return;
  
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  
  source.buffer = buffer;
  gainNode.gain.value = AUDIO_SYSTEM.volume;
  
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start(0);
}

/**
 * Crea un Audio element senza scaricare fino al necessario
 */
function createAudioElement(soundName) {
  if (AUDIO_SYSTEM.cache[soundName]) {
    return AUDIO_SYSTEM.cache[soundName];
  }

  const audio = new Audio();
  
  // Mappa suoni base (data URIs e file audio)
  const soundMap = {
    "card-play": "assets/sounds/carddrop2-92718.mp3",
    "card-win": "data:audio/wav;base64,UklGRjYAAABXQVZFZm10IBAAAAABAAEAQB8AAADdAAAAIgAZAEEAOgBIAEgAOgA+ADQAIgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYA",
    "card-flip": "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
    "hover": "assets/sounds/pageturn-102978.mp3",
    "hand-end": "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
  };

  audio.src = soundMap[soundName] || "";
  audio.volume = AUDIO_SYSTEM.volume;
  
  AUDIO_SYSTEM.cache[soundName] = audio;
  return audio;
}

/**
 * Riproduci suono (con error handling e generazione programmatica)
 */
function playSound(soundName) {
  if (!AUDIO_SYSTEM.enabled) return;
  
  // Suoni generati programmaticamente
  const programmaticSounds = {
    "victory": generateDingSound,
    "defeat": generateBlipSound,
    "draw": generatePopSound
  };
  
  if (programmaticSounds[soundName]) {
    try {
      const buffer = programmaticSounds[soundName]();
      if (buffer) {
        playAudioBuffer(buffer);
      }
    } catch (e) {
      console.debug(`Audio generation error (${soundName}):`, e.message);
    }
    return;
  }
  
  // Suoni tradizionali (data URIs)
  try {
    const audio = createAudioElement(soundName);
    audio.currentTime = 0;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Utente non ha interagito con la pagina ancora
      });
    }
  } catch (e) {
    console.debug(`Audio error (${soundName}):`, e.message);
  }
}

/**
 * Toggle audio on/off
 */
function toggleAudio() {
  AUDIO_SYSTEM.enabled = !AUDIO_SYSTEM.enabled;
  const btn = document.getElementById("audio-toggle");
  if (btn) {
    btn.textContent = AUDIO_SYSTEM.enabled ? "🔊" : "🔇";
  }
}

/**
 * Imposta volume (0.0 - 1.0)
 */
function setAudioVolume(level) {
  AUDIO_SYSTEM.volume = Math.max(0, Math.min(1, level));
  for (const audio of Object.values(AUDIO_SYSTEM.cache)) {
    if (audio instanceof Audio) audio.volume = AUDIO_SYSTEM.volume;
  }
}
