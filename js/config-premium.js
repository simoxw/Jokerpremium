// ===============================
// CONFIGURAZIONE PREMIUM
// ===============================

/**
 * OPZIONI GLOBALI DEL GIOCO
 * Personalizza qui senza toccare il codice
 */

const PREMIUM_CONFIG = {
  // 🎵 AUDIO
  audio: {
    enabled: true,
    volume: 0.3,
    muteOnMobile: true
  },

  // 🎨 ANIMAZIONI
  animations: {
    enabled: true,
    cardPlayDuration: 0.4,      // secondi
    trickResolveDuration: 0.5,   // secondi
    handTransitionDuration: 0.3  // secondi
  },

  // 📊 STATISTICHE
  stats: {
    enabled: true,
    autoExport: false,
    showOnConsole: true
  },

  // 🔔 NOTIFICHE
  notifications: {
    enabled: true,
    maxVisible: 3,
    defaultDuration: 3000,  // ms
    position: "top-center"
  },

  // ✅ VALIDAZIONE
  validation: {
    strict: true,           // Blocca mosse illegali
    autoRecover: true,      // Recovery automatico da stato corrotto
    verbose: false          // Log dettagliati (debug)
  },

  // ⚙️ GAMEPLAY
  gameplay: {
    aiThinkingDelay: 600,   // ms prima che IA gioca
    deckShuffleCount: 3,    // Numero shuffle mazzo
    confirmWinnerHighlight: true
  }
};

/**
 * Applica configurazione all'avvio
 */
function applyPremiumConfig() {
  // Audio
  AUDIO_SYSTEM.enabled = PREMIUM_CONFIG.audio.enabled;
  AUDIO_SYSTEM.volume = PREMIUM_CONFIG.audio.volume;

  // Validazione
  if (PREMIUM_CONFIG.validation.verbose) {
    console.log("🔧 Premium Config Applicata:", PREMIUM_CONFIG);
  }
}

/**
 * Reset a configurazione di default
 */
function resetPremiumConfig() {
  // Salva config originale
  const backup = { ...PREMIUM_CONFIG };
  
  // Reset
  PREMIUM_CONFIG.audio.enabled = true;
  PREMIUM_CONFIG.audio.volume = 0.3;
  PREMIUM_CONFIG.animations.enabled = true;
  PREMIUM_CONFIG.stats.enabled = true;
  PREMIUM_CONFIG.notifications.enabled = true;
  PREMIUM_CONFIG.validation.strict = true;

  console.log("✅ Config resettata");
  return backup;
}

/**
 * Preset di configurazione
 */
const CONFIG_PRESETS = {
  "Fully Premium": {
    audio: { enabled: true, volume: 0.5, muteOnMobile: false },
    animations: { enabled: true, cardPlayDuration: 0.5, trickResolveDuration: 0.6 },
    stats: { enabled: true, autoExport: true, showOnConsole: true },
    notifications: { enabled: true, maxVisible: 5, defaultDuration: 4000 },
    validation: { strict: true, autoRecover: true, verbose: false },
    gameplay: { aiThinkingDelay: 800, deckShuffleCount: 5, confirmWinnerHighlight: true }
  },

  "Performance Mode": {
    audio: { enabled: false, volume: 0, muteOnMobile: true },
    animations: { enabled: false, cardPlayDuration: 0, trickResolveDuration: 0 },
    stats: { enabled: false, autoExport: false, showOnConsole: false },
    notifications: { enabled: true, maxVisible: 2, defaultDuration: 1500 },
    validation: { strict: false, autoRecover: true, verbose: false },
    gameplay: { aiThinkingDelay: 100, deckShuffleCount: 1, confirmWinnerHighlight: false }
  },

  "Silent Mode": {
    audio: { enabled: false, volume: 0 },
    notifications: { enabled: false },
    animations: { enabled: true }  // Animazioni sì, suoni e toast no
  },

  "Casual": {
    audio: { enabled: true, volume: 0.4 },
    animations: { enabled: true, cardPlayDuration: 0.6 },
    stats: { enabled: true, showOnConsole: false },
    notifications: { enabled: true, defaultDuration: 5000 },
    validation: { strict: true, autoRecover: true },
    gameplay: { aiThinkingDelay: 1000 }
  }
};

/**
 * Applica un preset
 */
function applyPreset(presetName) {
  const preset = CONFIG_PRESETS[presetName];
  if (!preset) {
    console.error(`❌ Preset '${presetName}' non trovato`);
    return;
  }

  Object.assign(PREMIUM_CONFIG, preset);
  applyPremiumConfig();
  console.log(`✅ Preset '${presetName}' applicato`);
}

/**
 * Esporta configurazione corrente
 */
function exportConfig() {
  const json = JSON.stringify(PREMIUM_CONFIG, null, 2);
  console.log("📋 Configurazione corrente:\n" + json);
  return json;
}

/**
 * Importa configurazione da JSON
 */
function importConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString);
    Object.assign(PREMIUM_CONFIG, config);
    applyPremiumConfig();
    console.log("✅ Configurazione importata");
  } catch (e) {
    console.error("❌ Errore importazione config:", e.message);
  }
}
