// ===============================
// VALIDAZIONE ROBUSTA
// ===============================

/**
 * Valida che una carta esista nella mano del giocatore
 */
function isCardInHand(card, player) {
  const hand = GAME_STATE.hands[player];
  return hand.some(c => 
    c.suit === card.suit && 
    c.rankId === card.rankId && 
    c.file === card.file
  );
}

/**
 * Valida che il giocatore possa giocare una carta legalmente
 */
function isValidCardPlay(card, player) {
  // Verifica 1: Carta esiste in mano?
  if (!isCardInHand(card, player)) {
    showToast("❌ Carta non in mano!", "error");
    return false;
  }

  // Verifica 2: È il turno del giocatore?
  if (GAME_STATE.currentPlayer !== player) {
    showToast("❌ Non è il tuo turno!", "error");
    return false;
  }

  // Verifica 3: Input lockato?
  if (GAME_STATE.inputLocked && player === "me") {
    showToast("❌ Aspetta il turno precedente...", "error");
    return false;
  }

  // Verifica 4: Seme facoltativo (Regolamento §5)
  // "Non è obbligatorio rispondere al seme"
  // Qualsiasi carta può essere giocata dal giocatore

  return true;
}

/**
 * Valida lo stato del gioco per continuare
 */
function validateGameState() {
  const errors = [];

  // Verifica mazzo
  if (!Array.isArray(GAME_STATE.deck)) {
    errors.push("Mazzo non valido");
  }

  // Verifica mani
  for (const player of TURN_ORDER) {
    if (!Array.isArray(GAME_STATE.hands[player])) {
      errors.push(`Mano di ${player} non valida`);
    }
    if (GAME_STATE.hands[player].length < 0) {
      errors.push(`Mano di ${player} negativa`);
    }
  }

  // Verifica prese
  for (const player of TURN_ORDER) {
    if (!Array.isArray(GAME_STATE.tricksWon[player])) {
      errors.push(`Prese di ${player} non valide`);
    }
  }

  // Verifica giocatore corrente
  if (GAME_STATE.currentPlayer && !TURN_ORDER.includes(GAME_STATE.currentPlayer)) {
    errors.push("Giocatore corrente non valido");
  }

  if (errors.length > 0) {
    console.error("❌ Game State Errors:", errors);
    return false;
  }

  return true;
}

/**
 * Valida che il punteggio sia corretto
 */
function validateScores() {
  const scores = calculateSingleGameScores();
  let totalPoints = 0;

  for (const player of TURN_ORDER) {
    totalPoints += scores[player];
    
    // I punti non devono mai superare il totale del gioco (120)
    if (scores[player] > 120) {
      console.error(`Score anomalo per ${player}: ${scores[player]}`);
      return false;
    }
  }

  // Totale deve essere esattamente 120
  if (totalPoints !== 120) {
    console.warn(`Totale punti anomalo: ${totalPoints} (atteso 120)`);
  }

  return true;
}

/**
 * Safe wrapper per playCard
 */
function playerPlaysCardSafe(card) {
  if (!isValidCardPlay(card, "me")) {
    return false;
  }

  if (!validateGameState()) {
    showToast("❌ Errore stato gioco", "error");
    return false;
  }

  playCard("me", card);
  return true;
}

/**
 * Resetta lo stato a una partita pulita se corrotto
 */
function recoverFromCorruptedState() {
  console.warn("⚠️ Recupero da stato corrotto...");
  showToast("Recupero gioco in corso...", "info");
  
  // Ricreate mani
  if (!validateGameState()) {
    startSingleGame();
  }
}
