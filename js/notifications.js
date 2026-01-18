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
 * Mostra una notifica toast migliorata con dettagli
 * @param {string|object} message - Messaggio o oggetto con {title, details, icon}
 * @param {string} type - "success" | "error" | "warning" | "info"
 * @param {number} duration - Millisecondi (default 3000)
 */
function showToast(message, type = "info", duration = TOAST_CONFIG.duration) {
  // Supporta sia stringa che oggetto
  let title = message;
  let details = "";
  let icon = "";
  
  if (typeof message === "object" && message.title) {
    title = message.title;
    details = message.details || "";
    icon = message.icon || "";
  }
  
  // Icone emoji per tipo
  const typeIcons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️"
  };
  
  if (!icon) {
    icon = typeIcons[type] || "";
  }
  
  // Evita duplicati
  const messageKey = typeof message === "string" ? message : `${title}-${details}`;
  if (activeToasts.some(t => t.messageKey === messageKey && t.type === type)) {
    return;
  }

  // Limita numero toasts visibili
  if (activeToasts.length >= TOAST_CONFIG.maxToasts) {
    const oldToast = activeToasts.shift();
    if (oldToast.element) oldToast.element.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  // Struttura migliorata con icona e dettagli
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${details ? `<div class="toast-details">${details}</div>` : ""}
    </div>
  `;
  
  // Posizionamento ottimale che evita sovrapposizioni
  const popupSpace = document.getElementById("popup-space");
  const usePopupSpace = popupSpace && popupSpace.offsetHeight > 0;
  const toastIndex = activeToasts.length;
  
  // Feedback haptic per mobile
  if (navigator.vibrate && (type === "success" || type === "error")) {
    navigator.vibrate(type === "success" ? [50] : [100, 50, 100]);
  }
  
  if (usePopupSpace) {
    // Mobile: posiziona SOTTO punteggi a SINISTRA, stack verticale ottimizzato
    const toastHeight = details ? 60 : 40; // Altezza dinamica basata su dettagli
    const spacing = 4; // Gap minimo tra toast
    const topPos = toastIndex * (toastHeight + spacing);
    const delay = toastIndex * 150; // Delay scaglionato più veloce
    
    toast.style.cssText = `
      position: absolute;
      top: ${topPos}px;
      left: 2px;
      right: auto;
      width: 200px;
      max-width: calc(100vw - 20px);
      transform: scaleY(0);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      z-index: ${10000 + toastIndex};
      animation: scaleYDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      animation-delay: ${delay}ms;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      white-space: normal;
      word-break: break-word;
      line-height: 1.3;
      overflow: hidden;
    `;
    popupSpace.appendChild(toast);
  } else {
    // Desktop: posiziona in alto a destra, stack verticale ottimizzato
    const toastHeight = details ? 80 : 50;
    const spacing = 8;
    const topPos = 20 + (toastIndex * (toastHeight + spacing));
    const rightPos = 20;
    
    toast.style.cssText = `
      position: fixed;
      top: ${topPos}px;
      right: ${rightPos}px;
      left: auto;
      transform: translateX(0);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: ${10000 + toastIndex};
      animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 350px;
      min-width: 250px;
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
    message: title,
    messageKey,
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
      // Desktop: slide out right animation
      toastObj.element.style.animation = "slideOutRight 0.3s ease-out forwards";
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
  
  if (!card || !card.rank || !card.suit) {
    console.error("[notifyCardPlayed] Carta invalida:", card);
    return;
  }

  const playerName = player === "ai1" ? "IA 1" : "IA 2";
  const suitName = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
  const rankName = card.rank.charAt(0).toUpperCase() + card.rank.slice(1);
  const suitEmoji = {
    "Foglia": "🍃",
    "Onda": "🌊",
    "Roccia": "🪨",
    "Stella": "⭐"
  }[suitName] || "🃏";
  
  showToast({
    title: `${playerName} ha giocato`,
    details: `${suitEmoji} ${rankName} di ${suitName}${card.points > 0 ? ` (${card.points} punti)` : ""}`,
    icon: "🎴"
  }, "info", 2000);
}

function notifyTrickWinner(winner) {
  const playerName = winner === "me" ? "Tu hai" : (winner === "ai1" ? "IA 1 ha" : "IA 2 ha");
  
  // Calcola punti della presa
  const played = GAME_STATE.currentTrick.cards;
  const trickPoints = (played.me ? played.me.points : 0) + 
                      (played.ai1 ? played.ai1.points : 0) + 
                      (played.ai2 ? played.ai2.points : 0);
  
  const cardsPlayed = [];
  if (played.me) cardsPlayed.push(`Tu: ${played.me.rank} ${played.me.suit}`);
  if (played.ai1) cardsPlayed.push(`IA1: ${played.ai1.rank} ${played.ai1.suit}`);
  if (played.ai2) cardsPlayed.push(`IA2: ${played.ai2.rank} ${played.ai2.suit}`);
  
  showToast({
    title: `${playerName} vinto la presa!`,
    details: trickPoints > 0 ? `+${trickPoints} punti • ${cardsPlayed.join(" • ")}` : cardsPlayed.join(" • "),
    icon: "🎯"
  }, "success", 3000);
}

function notifyJokerRevealed(player) {
  const playerName = player === "me" ? "Tu sei il" : (player === "ai1" ? "IA 1 è il" : "IA 2 è il");
  showToast({
    title: `${playerName} JOKER!`,
    details: player === "me" ? "Obiettivo: almeno 51 punti" : "Gli altri giocatori sono alleati",
    icon: "🃏"
  }, "warning", 3000);
}

function notifyGameEnd(winner, meScore, aiScore) {
  if (winner === "me") {
    showToast({
      title: "🎉 HAI VINTO!",
      details: `Punteggio finale: ${meScore} - ${aiScore}`,
      icon: "🏆"
    }, "success", 4000);
  } else {
    showToast({
      title: "💔 Sconfitta",
      details: `Punteggio finale: ${meScore} - ${aiScore}`,
      icon: "😔"
    }, "error", 4000);
  }
}
