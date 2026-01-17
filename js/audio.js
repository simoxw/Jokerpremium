// ===============================
// SISTEMA AUDIO MINIMO (PREMIUM)
// ===============================

const AUDIO_SYSTEM = {
  enabled: true,
  volume: 0.3,

  // Cache audio elements
  cache: {}
};

/**
 * Crea un Audio element senza scaricare fino al necessario
 */
function createAudioElement(soundName) {
  if (AUDIO_SYSTEM.cache[soundName]) {
    return AUDIO_SYSTEM.cache[soundName];
  }

  const audio = new Audio();
  
  // Dati Audio inline (Data URIs base64) - suoni minimalisti generati
  const soundMap = {
    "card-play": "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
    "card-win": "data:audio/wav;base64,UklGRjYAAABXQVZFZm10IBAAAAABAAEAQB8AAADdAAAAIgAZAEEAOgBIAEgAOgA+ADQAIgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYA",
    "card-flip": "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
    "hand-end": "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
  };

  audio.src = soundMap[soundName] || "";
  audio.volume = AUDIO_SYSTEM.volume;
  
  AUDIO_SYSTEM.cache[soundName] = audio;
  return audio;
}

/**
 * Riproduci suono (con error handling)
 */
function playSound(soundName) {
  if (!AUDIO_SYSTEM.enabled) return;
  
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
