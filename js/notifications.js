// ===============================
// SISTEMA NOTIFICHE TOAST
// ===============================

const TOAST_CONFIG = {
  duration: 5000,
  maxToasts: 3,
  position: "top-center"
};

let activeToasts = [];

/**
 * Mostra una notifica toast
 * @param {string} message - Messaggio da visualizzare
 * @param {string} type - "success" | "error" | "warning" | "info"
 * @param {number} duration - Millisecondi (default 3000)
 */
function showToast(message, type = "info", duration = TOAST_CONFIG.duration) {
  // Evita duplicati
  if (activeToasts.some(t => t.message === message && t.type === type)) {
    return;
  }

  // Limita numero toasts visibili
  if (activeToasts.length >= TOAST_CONFIG.maxToasts) {
    const oldToast = activeToasts.shift();
    if (oldToast.element) oldToast.element.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Posiziona nello spazio libero (popup-space) se esiste, altrimenti in alto
  const popupSpace = document.getElementById("popup-space");
  const usePopupSpace = popupSpace && popupSpace.offsetHeight > 0;
  
  if (usePopupSpace) {
    // Mobile: posiziona SOTTO punteggi a SINISTRA, 3 righe con delay scaglionato
    const toastIndex = activeToasts.length;
    const toastHeight = 32; // altezza più grande
    const spacing = toastHeight + 2; // altezza + gap minimo
    const topPos = 0 + (toastIndex * spacing);
    const delay = toastIndex * 200; // Delay scaglionato: 0ms, 200ms, 400ms
    
    toast.style.cssText = `
      position: absolute;
      top: ${topPos}px;
      left: 2px;
      right: auto;
      width: 180px;
      max-width: 180px;
      transform: scaleY(0);
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
      z-index: ${10000 + toastIndex};
      animation: scaleYDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      animation-delay: ${delay}ms;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      text-align: center;
      white-space: normal;
      word-break: break-word;
      line-height: 1.2;
      overflow: hidden;
    `;
    popupSpace.appendChild(toast);
  } else {
    // Desktop: posiziona in alto con slideDown
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 90%;
      text-align: center;
    `;
    document.body.appendChild(toast);
  }

  // Colori per tipo
  const colors = {
    success: { bg: "#10b981", text: "#fff" },
    error: { bg: "#ef4444", text: "#fff" },
    warning: { bg: "#f59e0b", text: "#fff" },
    info: { bg: "#3b82f6", text: "#fff" }
  };

  const color = colors[type] || colors.info;
  toast.style.backgroundColor = color.bg;
  toast.style.color = color.text;

  const toastObj = {
    message,
    type,
    element: toast,
    timeout: setTimeout(() => {
      removeToast(toastObj);
    }, duration)
  };

  activeToasts.push(toastObj);

  // Close button
  toast.style.cursor = "pointer";
  toast.onclick = () => removeToast(toastObj);

  return toast;
}

/**
 * Rimuove una notifica toast
 */
function removeToast(toastObj) {
  clearTimeout(toastObj.timeout);
  
  if (toastObj.element) {
    const popupSpace = document.getElementById("popup-space");
    const isInPopupSpace = popupSpace && popupSpace.contains(toastObj.element);
    
    if (isInPopupSpace) {
      // Mobile: scaleY down animation
      toastObj.element.style.animation = "scaleYUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";
    } else {
      // Desktop: slideUp animation
      toastObj.element.style.animation = "slideUp 0.3s ease-out forwards";
    }
    
    setTimeout(() => {
      toastObj.element.remove();
    }, 400);
  }

  const idx = activeToasts.indexOf(toastObj);
  if (idx !== -1) activeToasts.splice(idx, 1);
}

/**
 * Shortcuts per notifiche comuni
 */
function showSuccessToast(message) {
  return showToast(message, "success");
}

function showErrorToast(message) {
  return showToast(message, "error");
}

function showWarningToast(message) {
  return showToast(message, "warning");
}

function showInfoToast(message) {
  return showToast(message, "info");
}

/**
 * Notifiche specifiche di gioco
 */
function notifyCardPlayed(player, card) {
  if (player === "me") return; // Non notificare il giocatore stesso

  const playerName = player === "ai1" ? "IA 1" : "IA 2";
  showToast(`${playerName} ha giocato ${card.rank} di ${card.suit.charAt(0).toUpperCase() + card.suit.slice(1)}`, "info", 1500);
}

function notifyTrickWinner(winner) {
  const playerName = winner === "me" ? "Tu hai" : (winner === "ai1" ? "IA 1 ha" : "IA 2 ha");
  showToast(`🎯 ${playerName} vinto la presa!`, "success", 2000);
}

function notifyJokerRevealed(player) {
  const playerName = player === "me" ? "Tu sei il" : (player === "ai1" ? "IA 1 è il" : "IA 2 è il");
  showToast(`🃏 ${playerName} JOKER!`, "warning", 2000);
}

function notifyGameEnd(winner, meScore, aiScore) {
  const message = winner === "me" 
    ? `🎉 HAI VINTO! ${meScore} - ${aiScore}`
    : `💔 Sconfitta. ${meScore} - ${aiScore}`;
  
  showToast(message, winner === "me" ? "success" : "error", 3000);
}
