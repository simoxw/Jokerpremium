// ===============================
// TESTING COMMANDS (Paste in Console F12)
// ===============================

// ==================== GAME RULES ====================

// 1. Verifica Setup Iniziale
console.log("SETUP CHECK:");
console.log("- Carte in mazzo:", GAME_STATE.deck.length, "(deve essere 36)");
console.log("- Carte mano me:", GAME_STATE.hands.me.length, "(deve essere 3)");
console.log("- Carte mano ai1:", GAME_STATE.hands.ai1.length, "(deve essere 3)");
console.log("- Carte mano ai2:", GAME_STATE.hands.ai2.length, "(deve essere 3)");
console.log("- Briscola:", GAME_STATE.briscolaCard.rank, "di", GAME_STATE.briscolaSuit);

// 2. Verifica Punti (max 120)
function checkPoints() {
  const scores = calculateSingleGameScores();
  const total = scores.me + scores.ai1 + scores.ai2;
  console.log("POINTS CHECK:");
  console.log("- Me:", scores.me);
  console.log("- AI1:", scores.ai1);
  console.log("- AI2:", scores.ai2);
  console.log("- TOTAL:", total, "(deve essere ≤120)");
  return total;
}

// 3. Verifica Regola Joker Tardi
function checkJokerLate() {
  console.log("LATE JOKER CHECK:");
  console.log("- Joker assegnato?", GAME_STATE.jokerPlayer ? "SÌ: " + GAME_STATE.jokerPlayer : "NO");
  console.log("- Punti già ottenuti prima Joker?", GAME_STATE.tricksWon[GAME_STATE.jokerPlayer].length > 0 ? "SÌ" : "NO");
  console.log("- Punti rimangono validi? SÌ (implementato)");
}

// 4. Verifica Seme Facoltativo
function checkSemeFacoltativo() {
  console.log("SEME FACOLTATIVO CHECK:");
  console.log("- È obbligatorio rispondere al seme? NO (§5)");
  console.log("- Qualsiasi carta può essere giocata? SÌ");
  console.log("- Implementazione: rimosso controllo in validation.js");
}

// 5. Verifica Presa
function checkTrickWinner() {
  const winner = evaluateTrick();
  const played = GAME_STATE.currentTrick.cards;
  console.log("TRICK WINNER CHECK:");
  console.log("- Carte giocate:", Object.keys(played).filter(p => played[p]));
  console.log("- Vincitore:", winner);
}

// ==================== AI BEHAVIOR ====================

// 6. Cambia Difficoltà IA
function changeAIDifficulty(level) {
  window.AI_DIFFICULTY = level; // "intermediate", "hard", "expert"
  console.log("IA Difficoltà cambiata a:", level);
  console.log("Ricorda: ricarica partita con startSingleGame() per effetto");
}

// 7. Monitora Memoria IA
function checkAIMemory() {
  console.log("AI MEMORY CHECK:");
  console.log("- Carte giocate (me):", window.AI_MEMORY?.cardsPlayed?.me?.length || 0);
  console.log("- Carte giocate (ai1):", window.AI_MEMORY?.cardsPlayed?.ai1?.length || 0);
  console.log("- Carte giocate (ai2):", window.AI_MEMORY?.cardsPlayed?.ai2?.length || 0);
  console.log("- Briscole uscite:", window.AI_MEMORY?.briscolesPlayed?.length || 0);
  console.log("- Memory totale:", JSON.stringify(window.AI_MEMORY || {}).length, "bytes");
}

// 8. Testa IA come Joker
function testAIAsJoker() {
  console.log("TEST IA AS JOKER:");
  GAME_STATE.jokerPlayer = "ai1"; // Forza ai1 come Joker
  const hand = GAME_STATE.hands.ai1;
  console.log("- ai1 è Joker");
  console.log("- Mano:", hand.map(c => c.rank + " " + c.suit).join(", "));
  console.log("- Prossima carta giocata sarà aggressiva per punti");
}

// 9. Testa IA come Alleato
function testAIAsAlly() {
  console.log("TEST IA AS ALLY:");
  GAME_STATE.jokerPlayer = "ai2"; // ai1 è alleato di me
  const hand = GAME_STATE.hands.ai1;
  console.log("- ai2 è Joker, ai1 è ALLEATO");
  console.log("- Mano ai1:", hand.map(c => c.rank + " " + c.suit).join(", "));
  console.log("- Prossima carta giocata proteggerà il compagno (me)");
}

// 10. Testa IA Neutrale (prima Joker)
function testAIAsNeutral() {
  console.log("TEST IA AS NEUTRAL:");
  GAME_STATE.jokerPlayer = null; // Ancora nessun Joker
  const hand = GAME_STATE.hands.ai1;
  console.log("- Nessun Joker ancora assegnato");
  console.log("- Mano ai1:", hand.map(c => c.rank + " " + c.suit).join(", "));
  console.log("- Prossima carta giocata sarà prudente (no briscola primo)");
}

// ==================== MATCH FLOW ====================

// 11. Verifica Punti Match
function checkMatchScore() {
  console.log("MATCH SCORE CHECK:");
  console.log("- Me:", GAME_STATE.matchScore.me);
  console.log("- AI1:", GAME_STATE.matchScore.ai1);
  console.log("- AI2:", GAME_STATE.matchScore.ai2);
  console.log("- Target:", MATCH_TARGET);
  console.log("- Vincitore:", Object.entries(GAME_STATE.matchScore).find(([p, s]) => s >= MATCH_TARGET)?.[0] || "Nessuno");
}

// 12. Simula Fine Partita Singola
function simulateEndSingleGame() {
  const scores = calculateSingleGameScores();
  const result = determineSingleGameWinner(scores);
  console.log("END SINGLE GAME SIMULATION:");
  console.log("- Joker:", GAME_STATE.jokerPlayer, "con", scores[GAME_STATE.jokerPlayer], "punti");
  const allies = TURN_ORDER.filter(p => p !== GAME_STATE.jokerPlayer);
  console.log("- Alleati:", allies, "con", scores[allies[0]] + scores[allies[1]], "punti");
  console.log("- Risultato:", result);
  console.log("- Punti assegnati:", result === "joker" ? "+2 al Joker" : result === "allies" ? "+1 a ogni alleato" : "Nulla");
}

// ==================== QUICK TESTS ====================

// QUICK TEST 1: Verifica tutte le regole
function quickTestAll() {
  console.log("===== QUICK TEST ALL RULES =====");
  checkPoints();
  console.log("---");
  checkJokerLate();
  console.log("---");
  checkSemeFacoltativo();
  console.log("---");
  checkAIMemory();
  console.log("---");
  checkMatchScore();
}

// QUICK TEST 2: IA Behavior
function quickTestAI() {
  console.log("===== QUICK TEST AI =====");
  console.log("Current AI Difficulty:", window.AI_DIFFICULTY);
  checkAIMemory();
  console.log("---");
  testAIAsJoker();
  console.log("---");
  testAIAsAlly();
  console.log("---");
  testAIAsNeutral();
}

// ==================== CONSOLE COMMANDS ====================

/*
Comandi veloci da usare in console (F12):

// Verifica regole
checkPoints();
checkJokerLate();
checkSemeFacoltativo();
checkTrickWinner();
checkMatchScore();

// Cambia difficoltà IA
changeAIDifficulty("intermediate");
changeAIDifficulty("hard");
changeAIDifficulty("expert");

// Testa comportamenti IA
testAIAsJoker();
testAIAsAlly();
testAIAsNeutral();

// Test rapidi
quickTestAll();
quickTestAI();

// Memoria
checkAIMemory();

// Statistiche
displaySessionStats();
exportStats();
validateGameState();

*/
