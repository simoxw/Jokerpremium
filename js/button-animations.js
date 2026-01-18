// ===============================
// PULSANTI ANIMATI CON GLOW EFFECT
// ===============================

/**
 * Aggiunge classe "ready" ai pulsanti quando sono pronti per l'azione
 */
function markButtonReady(buttonId) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.classList.add("ready");
  }
}

/**
 * Rimuove classe "ready" dai pulsanti
 */
function unmarkButtonReady(buttonId) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.classList.remove("ready");
  }
}

/**
 * Aggiunge classe "active" ai pulsanti quando sono attivi
 */
function markButtonActive(buttonId) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.classList.add("active");
  }
}

/**
 * Rimuove classe "active" dai pulsanti
 */
function unmarkButtonActive(buttonId) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.classList.remove("active");
  }
}

/**
 * Feedback haptic per pulsanti (se supportato)
 */
function hapticFeedback(intensity = "medium") {
  if (!navigator.vibrate) return;
  
  const patterns = {
    light: [10],
    medium: [20],
    strong: [30, 10, 30]
  };
  
  navigator.vibrate(patterns[intensity] || patterns.medium);
}

/**
 * Aggiunge feedback haptic ai pulsanti
 */
function addHapticToButtons() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      hapticFeedback("light");
    });
  });
}

// Inizializza feedback haptic al caricamento
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(addHapticToButtons, 500);
  });
} else {
  setTimeout(addHapticToButtons, 500);
}
