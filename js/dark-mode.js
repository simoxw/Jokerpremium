// ===============================
// DARK MODE SYSTEM
// ===============================

const DARK_MODE = {
  enabled: false,
  
  init() {
    // Carica preferenza salvata
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      this.enabled = saved === "true";
    } else {
      // Default: usa preferenza sistema
      this.enabled = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    this.apply();
    this.createToggle();
  },
  
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("darkMode", this.enabled);
    this.apply();
    this.updateToggleButton();
  },
  
  apply() {
    const root = document.documentElement;
    
    if (this.enabled) {
      root.classList.add("dark-mode");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark-mode");
      root.setAttribute("data-theme", "light");
    }
  },
  
  createToggle() {
    // Cerca se esiste già
    let toggleBtn = document.getElementById("dark-mode-toggle");
    if (!toggleBtn) {
      toggleBtn = document.createElement("button");
      toggleBtn.id = "dark-mode-toggle";
      toggleBtn.title = "Toggle Dark Mode";
      toggleBtn.onclick = () => this.toggle();
      
      const buttonGroup = document.getElementById("button-group");
      if (buttonGroup) {
        buttonGroup.appendChild(toggleBtn);
      }
    }
    
    this.updateToggleButton();
  },
  
  updateToggleButton() {
    const toggleBtn = document.getElementById("dark-mode-toggle");
    if (toggleBtn) {
      toggleBtn.textContent = this.enabled ? "🌙" : "☀️";
    }
  }
};

// Inizializza al caricamento
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => DARK_MODE.init());
} else {
  DARK_MODE.init();
}
