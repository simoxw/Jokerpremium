// ===============================
// PHASER ENGINE - SISTEMA ANIMAZIONI PREMIUM
// ===============================
// Gestisce animazioni professionali Hearthstone-style
// Non invasivo: il gioco continua a funzionare anche se Phaser non carica

class PhaserCardEngine {
  constructor() {
    this.phaserLoaded = false;
    this.activeCards = new Map();
    this.particleEmitters = [];
    this.config = {
      hoverScale: 1.25,
      hoverYOffset: -40,
      animDuration: 300,
      easing: Phaser?.Tweens?.Easing?.Cubic?.Out || null
    };
    this.init();
  }

  init() {
    // Verifica se Phaser è disponibile
    if (typeof Phaser !== "undefined" && Phaser.Tweens) {
      this.phaserLoaded = true;
      console.log("✅ Phaser Engine Loaded - Premium Animations Active");
    } else {
      console.warn("⚠️ Phaser non disponibile, usando fallback CSS");
    }
  }

  // =====================
  // HOVER INTERATTIVO
  // =====================
  activateCardHover(cardElement) {
    if (!this.phaserLoaded) return this.fallbackHover(cardElement);

    const rect = cardElement.getBoundingClientRect();
    
    cardElement.addEventListener("mouseenter", () => this.hoverEnter(cardElement));
    cardElement.addEventListener("mouseleave", () => this.hoverLeave(cardElement));
    cardElement.addEventListener("mousemove", (e) => this.hoverMove(cardElement, e));
  }

  hoverEnter(cardElement) {
    if (!this.phaserLoaded) return;
    
    // Salva posizione originale
    const original = cardElement.dataset.originalTransform || "translate(0, 0)";
    cardElement.dataset.originalTransform = original;

    // Eleva e ingrandisce con Phaser tween
    cardElement.style.zIndex = "9999";
    cardElement.style.filter = "drop-shadow(0 8px 16px rgba(255, 215, 0, 0.4))";
    
    // Animazione smooth
    this.animateCard(cardElement, {
      scale: this.config.hoverScale,
      yOffset: this.config.hoverYOffset,
      duration: 200
    });
  }

  hoverLeave(cardElement) {
    if (!this.phaserLoaded) return;

    cardElement.style.filter = "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))";
    
    this.animateCard(cardElement, {
      scale: 1,
      yOffset: 0,
      duration: 150
    });

    setTimeout(() => {
      cardElement.style.zIndex = "auto";
    }, 150);
  }

  hoverMove(cardElement, event) {
    // Effetto 3D tilt su mouse move (leggero)
    const rect = cardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const tiltX = (y - rect.height / 2) * 0.05;
    const tiltY = -(x - rect.width / 2) * 0.05;
    
    cardElement.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${this.config.hoverScale}) translateY(${this.config.hoverYOffset}px)`;
  }

  // =====================
  // ANIMAZIONE GENERICA
  // =====================
  animateCard(cardElement, options = {}) {
    const {
      scale = 1,
      yOffset = 0,
      duration = 300,
      rotation = 0,
      opacity = 1
    } = options;

    cardElement.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    cardElement.style.transform = `scale(${scale}) translateY(${yOffset}px) rotateZ(${rotation}deg)`;
    cardElement.style.opacity = opacity.toString();
  }

  // =====================
  // PARTICELLE VITTORIA
  // =====================
  emitWinParticles(x, y, color = "#FFD700") {
    if (!this.phaserLoaded) return this.fallbackConfetti(x, y);

    const particles = [
      ...this.createConfetti(x, y, color),
      ...this.createSparkles(x, y, color),
      ...this.createPulse(x, y, color)
    ];

    particles.forEach(p => document.body.appendChild(p));

    // Cleanup automatico
    setTimeout(() => {
      particles.forEach(p => p.remove());
    }, 2000);
  }

  createConfetti(x, y, color) {
    const confetti = [];
    const count = 12;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = 300 + Math.random() * 200;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      const el = document.createElement("div");
      el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        box-shadow: 0 0 8px ${color};
        animation: particleFloat 2s ease-out forwards;
      `;
      el.dataset.vx = vx / 60;
      el.dataset.vy = vy / 60;
      el.dataset.frame = 0;

      confetti.push(el);
    }

    return confetti;
  }

  createSparkles(x, y, color) {
    const sparkles = [];
    const count = 8;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100;
      
      const el = document.createElement("div");
      el.style.cssText = `
        position: fixed;
        left: ${x + Math.cos(angle) * distance}px;
        top: ${y + Math.sin(angle) * distance}px;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, ${color}, transparent);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.8;
        animation: sparkleOut 1.5s ease-out forwards;
      `;

      sparkles.push(el);
    }

    return sparkles;
  }

  createPulse(x, y, color) {
    const pulse = document.createElement("div");
    pulse.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 40px;
      height: 40px;
      background: radial-gradient(circle, ${color}40, transparent);
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: expansePulse 1s ease-out forwards;
    `;

    return [pulse];
  }

  // =====================
  // VOLO CARTA (SMOOTH)
  // =====================
  flyCard(cardElement, fromPos, toPos, callback) {
    cardElement.style.position = "fixed";
    cardElement.style.left = fromPos.x + "px";
    cardElement.style.top = fromPos.y + "px";
    cardElement.style.zIndex = "5000";
    
    // Force reflow per animazione smooth
    void cardElement.offsetHeight;

    const duration = 500;
    const easing = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    
    cardElement.style.transition = `all ${duration}ms ${easing}`;
    cardElement.style.left = toPos.x + "px";
    cardElement.style.top = toPos.y + "px";

    setTimeout(() => {
      if (callback) callback();
    }, duration);
  }

  // =====================
  // EFFETTO BRISCOLA GLOW
  // =====================
  addBriscolaGlow(element) {
    if (!this.phaserLoaded) {
      element.style.boxShadow = "0 0 20px #FFD700";
      return;
    }

    element.style.animation = "briscolaGlow 2s ease-in-out infinite";
    element.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.6)";
  }

  // =====================
  // FALLBACK (senza Phaser)
  // =====================
  fallbackHover(cardElement) {
    cardElement.addEventListener("mouseenter", () => {
      cardElement.style.transform = `scale(1.15) translateY(-30px)`;
      cardElement.style.filter = "drop-shadow(0 8px 16px rgba(255, 215, 0, 0.3))";
      cardElement.style.zIndex = "9999";
    });

    cardElement.addEventListener("mouseleave", () => {
      cardElement.style.transform = "scale(1) translateY(0)";
      cardElement.style.filter = "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))";
      cardElement.style.zIndex = "auto";
    });
  }

  fallbackConfetti(x, y) {
    const confettiEl = document.createElement("div");
    confettiEl.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 20px;
      height: 20px;
      background: #FFD700;
      border-radius: 50%;
      pointer-events: none;
      animation: confettiFade 1s ease-out forwards;
    `;
    document.body.appendChild(confettiEl);
    setTimeout(() => confettiEl.remove(), 1000);
  }
}

// ===============================
// ISTANZA GLOBALE
// ===============================
const PHASER_ENGINE = new PhaserCardEngine();

// Esporta per uso globale
window.PHASER_ENGINE = PHASER_ENGINE;
