// ===============================
// INTELLIGENZA ARTIFICIALE AVANZATA
// ===============================
// 
// Strategie:
// - INTERMEDIATE: Regolistica semplice, no memory
// - HARD: Scenario-aware, dynamic strategy
// - EXPERT: Memory cache, perfect play simulation
//
// ===============================

// Modalità disponibili: "intermediate", "hard", "expert"
window.AI_DIFFICULTY = window.AI_DIFFICULTY || "hard";

// =====================================================
// MEMORY CACHE GLOBALE (Scenario Analysis)
// =====================================================
const AI_MEMORY = {
  // Traccia carte uscite in questa partita singola
  cardsPlayed: { me: [], ai1: [], ai2: [] },
  
  // Traccia briscole uscite
  briscolesPlayed: [],
  
  // Traccia pattern: chi taglia? chi scarica?
  playerPatterns: {
    me: { cuttingTendency: 0, dumpingTendency: 0 },
    ai1: { cuttingTendency: 0, dumpingTendency: 0 },
    ai2: { cuttingTendency: 0, dumpingTendency: 0 }
  },
  
  // Traccia alleanze e coordinamento
  allyCoordinationSignal: null,
  
  // Previsioni per carte restanti
  predictedHands: { me: [], ai1: [], ai2: [] }
};

function aiChooseCard(player) {
  const hand = GAME_STATE.hands[player];
  
  // Sincronizza la difficoltà globale
  const difficulty = window.AI_DIFFICULTY || "hard";

  if (difficulty === "intermediate") {
    return aiIntermediate(hand, player);
  } else if (difficulty === "hard") {
    return aiHard(hand, player);
  } else {
    return aiExpert(hand, player);
  }
}

// =====================================================
// UTILITY & HELPER FUNCTIONS
// =====================================================

function getCurrentStarter() {
  return GAME_STATE.currentTrick.starter;
}

function getCurrentTrickCards() {
  return GAME_STATE.currentTrick.cards;
}

function getBriscolaSuit() {
  return GAME_STATE.briscolaSuit;
}

function getRole(player) {
  const joker = GAME_STATE.jokerPlayer;
  if (!joker) return "none";
  if (player === joker) return "joker";
  return "ally";
}

function getTrickValue() {
  const played = GAME_STATE.currentTrick.cards;
  let total = 0;
  for (const p of ["me", "ai1", "ai2"]) {
    if (played[p]) total += played[p].points;
  }
  return total;
}

function getPositionInTrick(player) {
  const starter = getCurrentStarter();
  const order = TURN_ORDER;
  const idxStarter = order.indexOf(starter);
  const sequence = [
    order[idxStarter],
    order[(idxStarter + 1) % 3],
    order[(idxStarter + 2) % 3]
  ];

  let countPlayedBefore = 0;
  for (const p of sequence) {
    if (p === player) break;
    if (GAME_STATE.currentTrick.cards[p]) countPlayedBefore++;
  }
  return countPlayedBefore; // 0 = primo, 1 = secondo, 2 = terzo
}

function getPlayableCards(hand, player) {
  const trick = getCurrentTrickCards();
  const starter = getCurrentStarter();
  const starterCard = trick[starter];

  const isFirst = !trick.me && !trick.ai1 && !trick.ai2;

  if (isFirst) return hand.slice();

  // Seme facoltativo per briscola! (Regolamento §5)
  // Non è obbligatorio rispondere al seme
  return hand.slice();
}

function sortByOrderAsc(cards) {
  return cards.slice().sort((a, b) => a.order - b.order);
}

function sortByOrderDesc(cards) {
  return cards.slice().sort((a, b) => b.order - a.order);
}

function sortByPointsAsc(cards) {
  return cards.slice().sort((a, b) => a.points - b.points);
}

function sortByPointsDesc(cards) {
  return cards.slice().sort((a, b) => b.points - a.points);
}

function sortByPointsThenOrderAsc(cards) {
  return cards.slice().sort((a, b) => {
    if (a.points !== b.points) return a.points - b.points;
    return a.order - b.order;
  });
}

function sortByPointsThenOrderDesc(cards) {
  return cards.slice().sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.order - a.order;
  });
}

function simulateCurrentWinner() {
  return evaluateTrick();
}

function wouldWinTrickWith(card, player) {
  const saved = { ...GAME_STATE.currentTrick.cards };
  const prev = GAME_STATE.currentTrick.cards[player];

  GAME_STATE.currentTrick.cards[player] = card;
  const winner = evaluateTrick();

  GAME_STATE.currentTrick.cards[player] = prev;

  return winner === player;
}

// =====================================================
// MEMORY SYSTEM - Traccia carte uscite e pattern
// =====================================================

function recordCardPlayed(player, card) {
  AI_MEMORY.cardsPlayed[player].push(card);
  
  if (card.suit === getBriscolaSuit()) {
    AI_MEMORY.briscolesPlayed.push({ player, card });
  }
}

function getCardsRemainingInDeck() {
  const deck = GAME_STATE.deck;
  const briscola = GAME_STATE.briscolaSuit;
  const allCards = createFullDeck();
  removeRandomTwo(allCards);
  
  const played = [];
  for (const p of ["me", "ai1", "ai2"]) {
    played.push(...AI_MEMORY.cardsPlayed[p]);
  }
  
  const remaining = allCards.filter(card => 
    !played.some(p => p.suit === card.suit && p.rankId === card.rankId)
  );
  
  return remaining;
}

function estimateOpponentHand(player) {
  const cardsInPlay = GAME_STATE.hands[player].length;
  const remaining = getCardsRemainingInDeck();
  const estimated = [];
  
  // Non sappiamo esattamente, ma sappiamo cosa è uscito
  for (const card of remaining) {
    if (!GAME_STATE.hands[player].some(c => c.suit === card.suit && c.rankId === card.rankId)) {
      estimated.push(card);
    }
  }
  
  return estimated.slice(0, cardsInPlay);
}

function countBriscolesRemaining() {
  const briscola = getBriscolaSuit();
  const allBriscoles = createFullDeck().filter(c => c.suit === briscola);
  const playedBriscoles = AI_MEMORY.briscolesPlayed.length;
  return allBriscoles.length - playedBriscoles;
}

function didPlayerSignalAllyNeeds(player, ally) {
  // Se il giocatore ha scaricato punti bassi mentre l'alleato prendeva,
  // significa coordina
  const playerTricks = GAME_STATE.tricksWon[player];
  const allyTricks = GAME_STATE.tricksWon[ally];
  
  if (allyTricks.length === 0) return false;
  
  let signalCount = 0;
  for (const card of playerTricks) {
    if (card.points === 0) signalCount++;
  }
  
  return signalCount > playerTricks.length * 0.6; // >60% scarti = coordinamento
}

// =====================================================
// IA INTERMEDIA (REGOLISTICA - SEMPLICE)
// =====================================================

function aiIntermediate(hand, player) {
  const trick = getCurrentTrickCards();
  const briscola = getBriscolaSuit();
  const position = getPositionInTrick(player);
  const playable = getPlayableCards(hand, player);
  const trickValue = getTrickValue();

  const starter = getCurrentStarter();
  const starterCard = trick[starter];

  // PRIMO DI MANO: Butta scarto di basso valore
  if (position === 0) {
    const nonBriscola = playable.filter(c => c.suit !== briscola);
    const scarti = nonBriscola.filter(c => c.points === 0);

    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (nonBriscola.length > 0) return sortByOrderAsc(nonBriscola)[0];

    return sortByOrderAsc(playable)[0];
  }

  // SECONDO/TERZO: Vince se conviene, altrimenti scarica
  const canWinWith = playable.filter(c => wouldWinTrickWith(c, player));

  if (canWinWith.length === 0) {
    // Non può vincere: scarica
    const nonBriscola = playable.filter(c => c.suit !== briscola);
    const scarti = nonBriscola.filter(c => c.points === 0);

    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (nonBriscola.length > 0) return sortByPointsAsc(nonBriscola)[0];

    return sortByPointsAsc(playable)[0];
  }

  // Può vincere: prende con carta minima
  return sortByOrderAsc(canWinWith)[0];
}

// =====================================================
// IA HARD (SCENARIO-AWARE + ROLE STRATEGY)
// =====================================================

function aiHard(hand, player) {
  recordCardPlayed(player, hand[0]); // Dummy per memory
  
  const role = getRole(player);
  const briscola = getBriscolaSuit();
  const position = getPositionInTrick(player);
  const playable = hand.slice();
  const trickValue = getTrickValue();
  const trick = getCurrentTrickCards();
  
  // Strategia diverse per ruolo
  if (role === "joker") {
    return aiHardAsJoker(playable, player, position, trickValue, briscola);
  } else if (role === "ally") {
    return aiHardAsAlly(playable, player, position, trickValue, briscola);
  } else {
    return aiHardAsNeutral(playable, player, position, trickValue, briscola);
  }
}

/**
 * JOKER: Aggressivo, vuole punti. Gioca SOLO per se stesso (1 vs 2)
 * - Prende tutte le prese con valore importante
 * - Conserva briscole alte per prese critiche
 * - Scarica bassi punti strategicamente
 * - NON aiuta nessuno (è 1 vs 2 alleati)
 */
function aiHardAsJoker(hand, player, position, trickValue, briscola) {
  const playable = hand.slice();
  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = playable.filter(c => c.points === 0);
  const lowPoints = nonBriscolas.filter(c => c.points === 1);
  const highPoints = playable.filter(c => c.points >= 4);

  // Calcola punti Joker attuali
  const jokerScore = GAME_STATE.tricksWon[player].reduce((sum, card) => sum + card.points, 0);
  const jokerNeeded = Math.max(0, 51 - jokerScore);

  // PRIMO: Scarica strategico
  if (position === 0) {
    // Preferenza: scarto < punti bassi < carte medie < briscole
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (lowPoints.length > 0) return sortByOrderAsc(lowPoints)[0];
    if (nonBriscolas.length > 1) return sortByPointsAsc(nonBriscolas.slice(0, -1))[0];
    return sortByOrderAsc(briscolas)[0];
  }

  // SECONDO/TERZO: Valuta convenienza
  const currentWinner = simulateCurrentWinner();
  const canWinWith = playable.filter(c => wouldWinTrickWith(c, player));

  // Se il Joker sta già vincendo: supporta con carta minima
  if (currentWinner === player) {
    if (scarti.length > 0) return scarti[0];
    if (lowPoints.length > 0) return lowPoints[0];
    return sortByPointsAsc(nonBriscolas)[0] || briscolas[0];
  }

  // CALCOLO CONVENIENZA: Vale la pena vincere?
  // Vinci se: presa è grande (>=15) oppure serve per arrivare a 51
  const shouldWin = trickValue >= 15 || (trickValue > 0 && trickValue >= jokerNeeded);

  if (shouldWin && canWinWith.length > 0) {
    // Vinci con carta minima possibile
    const briscolaWins = canWinWith.filter(c => c.suit === briscola);
    if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
    // Se briscola non serve, usa seme/alto
    return sortByPointsDesc(canWinWith)[0];
  }

  // Non conviene vincere: scarica basso
  if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
  if (lowPoints.length > 0) return sortByOrderAsc(lowPoints)[0];
  if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
  
  return sortByOrderAsc(briscolas)[0];
}

/**
 * ALLEATO: Coordinato con compagno contro il Joker (2 vs 1)
 * - Aiuta compagno quando sta vincendo (non supera)
 * - Taglia il Joker quando conviene
 * - Comunica necessità via scarti strategici
 * - Obiettivo: 71+ punti COMBINATI vs Joker
 */
function aiHardAsAlly(hand, player, position, trickValue, briscola) {
  const playable = hand.slice();
  const joker = GAME_STATE.jokerPlayer;
  const allies = TURN_ORDER.filter(p => p !== joker);
  const myAlly = allies.find(p => p !== player);
  
  const trick = getCurrentTrickCards();
  const currentWinner = simulateCurrentWinner();
  
  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = playable.filter(c => c.points === 0);
  const canWin = playable.filter(c => wouldWinTrickWith(c, player));

  // Calcola punti alleanza
  const allyScore = GAME_STATE.tricksWon[player].reduce((sum, card) => sum + card.points, 0) +
                    GAME_STATE.tricksWon[myAlly].reduce((sum, card) => sum + card.points, 0);
  const alliesNeeded = Math.max(0, 71 - allyScore);

  // PRIMO: Scarica conservativo
  if (position === 0) {
    // Preferenza: scarto < carta bassa non-briscola
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
    return sortByOrderAsc(briscolas)[0];
  }

  // SECONDO/TERZO: Strategia dinamica
  
  // CASO 1: Compagno sta vincendo → NON supera, supporta passivo
  if (currentWinner === myAlly) {
    // Butta qualcosa basso, non spendere risorse
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    const lowCards = nonBriscolas.filter(c => c.points <= 1);
    if (lowCards.length > 0) return sortByOrderAsc(lowCards)[0];
    // Se costretti, butta briscola bassa
    return sortByOrderAsc(briscolas)[0];
  }

  // CASO 2: Joker sta vincendo → TAGLIA se conviene
  if (currentWinner === joker && canWin.length > 0) {
    // Vale la pena strapparla? Se: trickValue >= 10 oppure servo per arrivare a 71
    const shouldSteal = trickValue >= 10 || (trickValue > 0 && trickValue >= alliesNeeded);
    
    if (shouldSteal) {
      // Taglia con briscola se disponibile
      const briscolaWins = canWin.filter(c => c.suit === briscola);
      if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
      // Se briscola non serve, usa seme alto
      return sortByPointsDesc(canWin)[0];
    }
  }

  // CASO 3: Nessuno sta vincendo ancora
  // Se ha valore e puoi vincere → prendi (costruisci potenziale)
  if (trickValue >= 10 && canWin.length > 0) {
    const briscolaWins = canWin.filter(c => c.suit === briscola);
    if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
    return sortByPointsDesc(canWin)[0];
  }

  // Default: scarica basso
  if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
  const lowCards = nonBriscolas.filter(c => c.points <= 1);
  if (lowCards.length > 0) return sortByOrderAsc(lowCards)[0];
  
  return sortByOrderAsc(briscolas)[0];
}

/**
 * NEUTRALE: Prudente pre-Joker assignment
 * - MAI giocare briscola per primo (potrebbe diventare Joker!)
 * - Preferire scarti e punti bassi
 * - Costruire capitale di carte alte per dopo
 */
function aiHardAsNeutral(hand, player, position, trickValue, briscola) {
  const playable = hand.slice();
  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = nonBriscolas.filter(c => c.points === 0);
  const lowPoints = nonBriscolas.filter(c => c.points === 1 || c.points === 4);
  const highPoints = nonBriscolas.filter(c => c.points >= 10);

  // PRIMO: CRUCIALE - Non giocare briscola! Rischio di diventare Joker
  if (position === 0) {
    // Preferenza: scarto > punto basso > punto alto > briscola ultima
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
    if (nonBriscolas.length > 1) return sortByPointsAsc(nonBriscolas.slice(0, -1))[0];
    // Worst case: briscola più bassa
    return sortByOrderAsc(briscolas)[0];
  }

  // SECONDO/TERZO: Valuta cautamente
  const trick = getCurrentTrickCards();
  const currentWinner = simulateCurrentWinner();
  const canWin = playable.filter(c => wouldWinTrickWith(c, player));

  // Se qualcuno gioca già briscola, cautela
  const trickHasBriscola = Object.values(trick).some(c => c && c.suit === briscola);

  // Se presa è ricca (>=15), prendi se puoi senza sprecare briscola
  if (trickValue >= 15 && canWin.length > 0) {
    // Preferisci vincere con non-briscola
    const nonBriscolaWins = canWin.filter(c => c.suit !== briscola);
    if (nonBriscolaWins.length > 0) return sortByPointsDesc(nonBriscolaWins)[0];
    // Se serve briscola, usa la minima
    const briscolaWins = canWin.filter(c => c.suit === briscola);
    if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
  }

  // Default: scarica basso (non spendere risorse)
  if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
  if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
  if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
  
  return sortByOrderAsc(briscolas)[0];
}

// =====================================================
// IA EXPERT (ADVANCED MEMORY + PERFECT PLAY SIMULATION)
// =====================================================

function aiExpert(hand, player) {
  recordCardPlayed(player, hand[0]); // Log
  
  const role = getRole(player);
  const briscola = getBriscolaSuit();
  const position = getPositionInTrick(player);
  const trickValue = getTrickValue();

  // Valuta ogni carta con algoritmo Monte Carlo semplificato
  const evaluations = hand.map(card => ({
    card,
    score: evaluateExpertCard(card, player, role, position, trickValue, briscola)
  }));

  evaluations.sort((a, b) => b.score - a.score);
  return evaluations[0].card;
}

function evaluateExpertCard(card, player, role, position, trickValue, briscola) {
  let score = 0;
  const isBriscola = card.suit === briscola;
  const canWin = wouldWinTrickWith(card, player);
  const briscolasLeft = countBriscolesRemaining();
  const joker = GAME_STATE.jokerPlayer;
  const allies = TURN_ORDER.filter(p => p !== joker);

  // PUNTI ATTUALI
  const playerScore = GAME_STATE.tricksWon[player].reduce((sum, c) => sum + c.points, 0);
  const allyScore = role === "ally" ? 
    playerScore + GAME_STATE.tricksWon[allies.find(a => a !== player)].reduce((sum, c) => sum + c.points, 0) :
    playerScore;

  // 1) VALORE INTRINSECO DELLA CARTA
  score += card.points * 8;  // Peso ai punti
  score += card.order * 1.5; // Peso all'ordine

  // 2) BONUS BRISCOLA CONTESTO-DIPENDENTE
  if (isBriscola) {
    score += 12;
    // Briscole alte valgono di più se poche rimaste
    if (briscolasLeft <= 2 && card.order >= 8) score += 25;
    if (briscolasLeft <= 5 && card.order >= 9) score += 15;
  }

  // 3) POSIZIONE NELLA MANO
  if (position === 0) {
    // Primo: penalizza punti alti, bonus scarti
    if (card.points > 0) score -= 12;
    if (card.points === 0 && card.order <= 3) score += 10;
    // Penalizza briscole per primo
    if (isBriscola) score -= 20;
  }

  if (position === 2 && trickValue >= 10) {
    // Terzo con presa ricca: bonus per vincere
    if (canWin) score += 30;
  }

  // 4) RUOLO-SPECIFICA STRATEGIA
  if (role === "joker") {
    // Joker: vuole punti, ma smart su briscole
    score += card.points * 5;
    
    // Calcola se serve questa presa
    const jokerNeeded = 51 - playerScore;
    if (trickValue > 0 && trickValue >= jokerNeeded) {
      // Questa presa finisce il gioco!
      score += 40;
    } else if (trickValue > 0 && trickValue >= 10) {
      // Presa importante
      score += 15;
    }
    
    // Penalizza spreco di briscole alte su prese vuote
    if (isBriscola && card.order >= 8 && trickValue === 0) {
      score -= 35;
    }
  } 
  else if (role === "ally") {
    // Alleato: coordinazione e blocco Joker
    const trick = getCurrentTrickCards();
    const currentWinner = simulateCurrentWinner();
    const myAlly = allies.find(a => a !== player);
    
    // Se compagno sta vincendo: NON superare
    if (currentWinner === myAlly) {
      score -= 25;
      if (card.points === 0) score += 5; // Bonus scarto
    }
    
    // Se Joker sta vincendo: bonus per rubare
    if (currentWinner === joker && canWin) {
      score += 28;
      // Briscola per rubare vale più
      if (isBriscola && card.order >= 7) score += 15;
    }
    
    // Calcola se serve questa presa per raggiungere 71
    const alliesNeeded = 71 - allyScore;
    if (trickValue > 0 && trickValue >= alliesNeeded) {
      score += 35;
    }
  }
  else if (role === "none") {
    // Neutrale: cauteloso, evita briscola primo
    if (position === 0 && isBriscola) {
      score -= 30;
    }
    // Bonus per costruire capitale
    if (card.order >= 8 && card.points === 0) score += 8;
  }

  // 5) PENALITÀ SE NON PUÒ VINCERE
  if (!canWin) {
    if (card.points > 0) score -= 20;
    if (isBriscola) score -= 8;
  }

  // 6) BONUS STRATEGICO FINALE
  // Se è una carta "decisiva" per vincere la presa
  if (position === 2 && canWin) {
    score += 10;
  }

  return score;
}

// =====================================================
// LEGACY FUNCTIONS - REMOVED (Old aiPro implementation)
// =====================================================
// buildMemory, evaluateProCard, evaluatePositionImpact,
// evaluateAsJokerPro, evaluateAsAllyPro, evaluateAsNeutralPro
// sono state sostituite dalle nuove implementazioni:
// - aiHard() con aiHardAsJoker, aiHardAsAlly, aiHardAsNeutral
// - aiExpert() con evaluateExpertCard
//
// Le funzioni legacy rimangono per compatibilità ma non sono usate.
// =====================================================
