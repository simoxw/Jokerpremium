// ===============================
// SISTEMA ANIMAZIONI FLUIDE
// ===============================

/**
 * Aggiunge animazione di ingresso carta al tavolo
 */
function animateCardPlay(cardElement, fromPos, toPos) {
  cardElement.style.position = "absolute";
  cardElement.style.left = fromPos.x + "px";
  cardElement.style.top = fromPos.y + "px";
  cardElement.style.opacity = "1";
  cardElement.style.transform = "scale(1) rotateZ(0deg)";
  cardElement.style.transition = "none";

  // Force reflow
  void cardElement.offsetHeight;

  // Animazione smooth
  cardElement.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  cardElement.style.left = toPos.x + "px";
  cardElement.style.top = toPos.y + "px";
}

/**
 * Animazione di "shake" per presa vinta
 */
function animateWinnerShake(cardElement) {
  cardElement.style.animation = "shake 0.5s ease-in-out";
  
  setTimeout(() => {
    cardElement.style.animation = "none";
  }, 500);
}

/**
 * Animazione di fade out per carte raccolte
 */
function animateCardCollect(cardElement, targetPos) {
  cardElement.style.transition = "all 0.5s ease-out";
  cardElement.style.opacity = "0.3";
  cardElement.style.transform = "scale(0.8) translateY(-20px)";
  
  setTimeout(() => {
    cardElement.style.display = "none";
  }, 500);
}

/**
 * Pulse effect per il briscola quando rivelato
 */
function animateBriscolaPulse(element) {
  element.style.animation = "pulse 0.6s ease-in-out";
  
  setTimeout(() => {
    element.style.animation = "none";
  }, 600);
}

/**
 * Animazione di scorrimento (scroll) per punteggi
 */
function animateScoreChange(element, oldValue, newValue) {
  if (oldValue === newValue) return;
  
  element.style.transform = "scale(1.2)";
  element.style.color = newValue > oldValue ? "#4ade80" : "#f87171";
  element.style.transition = "all 0.3s ease-out";
  
  setTimeout(() => {
    element.style.transform = "scale(1)";
    element.style.color = "#f0f0f0";
  }, 300);
}

/**
 * Effetto di highlight della carta selezionata
 */
function highlightSelectedCard(cardElement) {
  if (document.querySelector(".card-selected")) {
    document.querySelector(".card-selected").classList.remove("card-selected");
  }
  cardElement.classList.add("card-selected");
}

/**
 * Animazione di vittoria della mano
 */
function animateHandVictory(playerName) {
  const banner = document.createElement("div");
  banner.className = "victory-banner";
  banner.textContent = `${playerName} vince la presa!`;
  banner.style.animation = "slideDown 0.5s ease-out";
  
  document.body.appendChild(banner);
  
  setTimeout(() => {
    banner.remove();
  }, 2000);
}

/**
 * Animazione di reveal briscola all'inizio
 */
function animateBriscolaReveal(cardElement) {
  cardElement.style.animation = "flipCard 0.6s ease-in-out";
}

/**
 * Effetto di transizione tra mani
 */
function animateHandTransition() {
  const container = document.getElementById("table-layout");
  container.style.opacity = "0.7";
  container.style.transition = "opacity 0.3s ease-out";
  
  setTimeout(() => {
    container.style.opacity = "1";
  }, 300);
}
