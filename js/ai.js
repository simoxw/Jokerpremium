// ===============================
// IA.js — Intelligenza Artificiale Completa (3 difficoltà)
// ===============================

// Difficoltà: "intermediate", "hard", "expert"
window.AI_DIFFICULTY = window.AI_DIFFICULTY || "hard";

// ===============================
// MEMORY SYSTEM (usato da Expert)
// ===============================
const AI_MEMORY = {
  cardsPlayed: { me: [], ai1: [], ai2: [] },
  briscolesPlayed: [],
  predictedHands: { me: [], ai1: [], ai2: [] }
};

// ===============================
// FUNZIONE PRINCIPALE DI SCELTA CARTA
// ===============================
function aiChooseCard(player) {
  const hand = GAME_STATE.hands[player];
  if (!hand || hand.length === 0) {
    console.error("[aiChooseCard] Mano vuota per", player);
    return null;
  }

  const difficulty = window.AI_DIFFICULTY;
  let card = null;

  if (difficulty === "intermediate") {
    card = aiIntermediate(hand, player);
  } else if (difficulty === "hard") {
    card = aiHard(hand, player);
  } else {
    card = aiExpert(hand, player);
  }

  if (!card || !card.suit || card.rankId === undefined) {
    console.warn("[aiChooseCard] Carta non valida, fallback a prima carta valida");
    const fallback = hand.find(c => c && c.suit && c.rankId !== undefined);
    return fallback || hand[0];
  }

  return card;
}

// ===============================
// FUNZIONI DI CONTESTO
// ===============================
function getBriscolaSuit() {
  return GAME_STATE.briscolaSuit;
}

function getCurrentTrickCards() {
  return GAME_STATE.currentTrick.cards;
}

function getCurrentStarter() {
  return GAME_STATE.currentTrick.starter;
}

function getRole(player) {
  const joker = GAME_STATE.jokerPlayer;
  if (!joker) return "none";
  if (player === joker) return "joker";
  return "ally";
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

  let count = 0;
  for (const p of sequence) {
    if (p === player) break;
    if (GAME_STATE.currentTrick.cards[p]) count++;
  }
  return count; // 0 = primo, 1 = secondo, 2 = terzo
}

function getTrickValue() {
  const played = GAME_STATE.currentTrick.cards;
  let total = 0;
  for (const p of ["me", "ai1", "ai2"]) {
    if (played[p]) total += played[p].points;
  }
  return total;
}

// ===============================
// CARTE GIOCABILI (seme facoltativo)
// ===============================
function getPlayableCards(hand, player) {
  return hand.slice();
}

// ===============================
// ORDINAMENTI DI SUPPORTO
// ===============================
function sortByOrderAsc(cards) { return cards.slice().sort((a, b) => a.order - b.order); }
function sortByOrderDesc(cards) { return cards.slice().sort((a, b) => b.order - a.order); }
function sortByPointsAsc(cards) { return cards.slice().sort((a, b) => a.points - b.points); }
function sortByPointsDesc(cards) { return cards.slice().sort((a, b) => b.points - a.points); }

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

// ===============================
// SIMULAZIONE PRESA
// ===============================
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

// ===============================
// MEMORY (usata da Expert)
// ===============================
function recordCardPlayed(player, card) {
  AI_MEMORY.cardsPlayed[player].push(card);
  if (card.suit === getBriscolaSuit()) {
    AI_MEMORY.briscolesPlayed.push(card);
  }
}
// ===============================
// IA INTERMEDIATE — FACILE MA INTELLIGENTE
// ===============================
//
// - Ruolo-consapevole (joker/alleato/neutrale)
// - Non spreca assi/tre se può evitarlo
// - Non spreca briscole inutilmente
// - Coordinazione base tra alleati
// - Evita di regalare punti importanti
// ===============================

function aiIntermediate(hand, player) {
  const briscola = getBriscolaSuit();
  const position = getPositionInTrick(player);
  const playable = getPlayableCards(hand, player);
  const trickValue = getTrickValue();
  const role = getRole(player);
  const currentWinner = simulateCurrentWinner();
  const joker = GAME_STATE.jokerPlayer;

  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = playable.filter(c => c.points === 0);
  const puntiAlti = playable.filter(c => c.points >= 10); // assi (11), tre (10) - MAI REGALARE!
  const puntiMedi = playable.filter(c => c.points > 0 && c.points <= 4);
  const puntiBassi = playable.filter(c => c.points > 0 && c.points <= 1); // Re (4), Cavallo (3), Fante (2), carte 1 punto
  const canWin = playable.filter(c => wouldWinTrickWith(c, player));
  
  // Funzione helper: trova la carta migliore quando NON può vincere (MAI punti alti!)
  function getBestDiscardCard() {
    // 1. Scarti (0 punti) - sempre preferiti
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    // 2. Punti bassissimi (1-2 punti) - Re, Cavallo, Fante
    if (puntiBassi.length > 0) return sortByPointsAsc(puntiBassi)[0];
    // 3. Punti medi (3-4 punti)
    if (puntiMedi.length > 0) return sortByPointsAsc(puntiMedi)[0];
    // 4. Briscole basse (solo se necessario)
    const lowBriscolas = briscolas.filter(c => c.points <= 4);
    if (lowBriscolas.length > 0) return sortByOrderAsc(lowBriscolas)[0];
    // 5. Carte non briscola con punti bassi
    const lowNonBriscolas = nonBriscolas.filter(c => c.points <= 4);
    if (lowNonBriscolas.length > 0) return sortByPointsAsc(lowNonBriscolas)[0];
    // 6. Ultima risorsa: qualsiasi carta tranne punti alti
    const nonHighCards = playable.filter(c => c.points < 10);
    if (nonHighCards.length > 0) return sortByPointsAsc(nonHighCards)[0];
    // 7. Fallback estremo (non dovrebbe mai arrivare qui)
    return playable[0];
  }

  // Calcola punti attuali per decisioni intelligenti
  const playerScore = GAME_STATE.tricksWon[player].reduce((s, c) => s + c.points, 0);
  
  // ---------- RUOLO: NEUTRALE (nessuno è ancora Joker) ----------
  if (role === "none") {
    // Primo di mano: evita briscola, preferisce scarti
    if (position === 0) {
      if (scarti.length > 0 && nonBriscolas.length > 0) {
        return sortByOrderAsc(scarti.filter(c => c.suit !== briscola))[0] || sortByOrderAsc(scarti)[0];
      }
      if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
      // Solo briscole: gioca la più bassa
      return sortByOrderAsc(briscolas)[0] || playable[0];
    }

    // Secondo/Terzo: vince solo se presa ricca (>=15) o può evitare di regalare punti alti
    if (canWin.length > 0) {
      if (trickValue >= 15) {
        const nonBriscolaWins = canWin.filter(c => c.suit !== briscola);
        if (nonBriscolaWins.length > 0) return sortByPointsAsc(nonBriscolaWins)[0];
        return sortByOrderAsc(canWin.filter(c => c.suit === briscola))[0] || sortByPointsAsc(canWin)[0];
      }
      
      // Se il vincitore attuale ha punti alti e posso rubare, valuta
      if (currentWinner && trickValue > 0) {
        const currentCard = GAME_STATE.currentTrick.cards[currentWinner];
        if (currentCard && currentCard.points >= 10) {
          const nonBriscolaWins = canWin.filter(c => c.suit !== briscola && c.points < 10);
          if (nonBriscolaWins.length > 0) return sortByPointsAsc(nonBriscolaWins)[0];
        }
      }
    }

    // Non può vincere: MAI regalare assi o tre! Usa solo scarti o carte basse
    if (canWin.length === 0) {
      return getBestDiscardCard();
    }
    
    // Può vincere ma non conviene: stesso comportamento
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (puntiMedi.length > 0) return sortByPointsAsc(puntiMedi)[0];
    return sortByPointsAsc(playable)[0];
  }

  // ---------- RUOLO: JOKER ----------
  if (role === "joker") {
    const jokerNeeded = Math.max(0, 51 - playerScore);
    const isRichTrick = trickValue >= 10;

    // Primo di mano: scarica strategico
    if (position === 0) {
      if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
      if (puntiMedi.length > 0) return sortByPointsAsc(puntiMedi)[0];
      if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
      return sortByOrderAsc(briscolas)[0] || playable[0];
    }

    // Compagno sta vincendo: supporta con minimo
    if (currentWinner === player) {
      if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
      if (puntiMedi.length > 0) return sortByPointsAsc(puntiMedi)[0];
      if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
      return sortByOrderAsc(briscolas)[0] || playable[0];
    }

    // Non può vincere: MAI regalare assi o tre! Usa solo scarti o carte basse
    if (canWin.length === 0) {
      return getBestDiscardCard();
    }

    // Può vincere: valuta se conviene
    const shouldWin = isRichTrick || (trickValue > 0 && trickValue >= jokerNeeded);
    
    if (shouldWin) {
      // Vince con briscola minima se possibile, altrimenti minima carta
      const briscolaWins = canWin.filter(c => c.suit === briscola);
      if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
      return sortByPointsAsc(canWin)[0];
    }

    // Non conviene vincere: scarica
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (puntiMedi.length > 0) return sortByPointsAsc(puntiMedi)[0];
    return sortByPointsAsc(playable)[0];
  }

  // ---------- RUOLO: ALLEATO ----------
  if (role === "ally") {
    const allies = TURN_ORDER.filter(p => p !== joker);
    const myAlly = allies.find(p => p !== player);
    const allyScore = GAME_STATE.tricksWon[myAlly].reduce((s, c) => s + c.points, 0);
    const alliesTotal = playerScore + allyScore;
    const alliesNeeded = Math.max(0, 71 - alliesTotal);

    // Primo di mano: scarica conservativo
    if (position === 0) {
      if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
      const lowNonBriscola = nonBriscolas.filter(c => c.points <= 1);
      if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
      return sortByOrderAsc(briscolas)[0] || playable[0];
    }

    // Compagno sta vincendo: dagli punti (non superarlo con punti alti)
    if (currentWinner === myAlly) {
      // Non superare con assi/tre se può evitarlo
      if (canWin.length > 0 && puntiAlti.length > 0) {
        const nonHighWins = canWin.filter(c => c.points < 10);
        if (nonHighWins.length > 0) {
          // Supera solo se necessario per evitare che il Joker rubi
          if (trickValue >= 10) {
            return sortByPointsAsc(nonHighWins)[0];
          }
        }
      }
      
      // Supporta con punti utili ma non alti
      const puntiUtili = playable.filter(c => c.points > 0 && c.points < 10);
      if (puntiUtili.length > 0) return sortByPointsDesc(puntiUtili)[0];
      if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
      return sortByPointsAsc(playable)[0];
    }

    // Joker sta vincendo: ruba se conviene
    if (currentWinner === joker && canWin.length > 0) {
      const shouldSteal = trickValue >= 10 || (trickValue > 0 && trickValue >= alliesNeeded);
      
      if (shouldSteal) {
        // Usa briscola minima se possibile, altrimenti minima carta
        const briscolaWins = canWin.filter(c => c.suit === briscola);
        if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
        return sortByPointsAsc(canWin)[0];
      }
    }

    // Presa ricca: vince se può
    if (trickValue >= 10 && canWin.length > 0) {
      const briscolaWins = canWin.filter(c => c.suit === briscola);
      if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
      return sortByPointsAsc(canWin)[0];
    }

    // Non può vincere: MAI regalare assi o tre! Specialmente al Joker!
    if (canWin.length === 0) {
      // Se il Joker sta vincendo, ancora più importante evitare punti alti
      if (currentWinner === joker && puntiAlti.length > 0) {
        return getBestDiscardCard();
      }
      return getBestDiscardCard();
    }

    // Default: scarica (solo se può vincere ma non conviene)
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    const lowNonBriscola = nonBriscolas.filter(c => c.points <= 1);
    if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
    // MAI punti alti qui!
    const safeCards = playable.filter(c => c.points < 10);
    if (safeCards.length > 0) return sortByPointsAsc(safeCards)[0];
    return playable[0];
  }

  // Fallback
  return playable[0];
}

// ===============================
// IA HARD — GIOCATORE ESPERTO REALISTICO
// ===============================
//
// - Ruolo-consapevole (joker / alleato / neutrale)
// - Calcola 51 (Joker) / 71 (Alleati)
// - Non supera il compagno su presa ricca
// - Joker non regala punti se non può vincere
// - Neutrale valuta se diventare Joker ha senso
// ===============================

function aiHard(hand, player) {
  const role = getRole(player);
  const briscola = getBriscolaSuit();
  const position = getPositionInTrick(player);
  const playable = getPlayableCards(hand, player);
  const trickValue = getTrickValue();

  if (role === "joker") {
    return aiHardAsJoker(playable, player, position, trickValue, briscola);
  } else if (role === "ally") {
    return aiHardAsAlly(playable, player, position, trickValue, briscola);
  } else {
    return aiHardAsNeutral(playable, player, position, trickValue, briscola);
  }
}

// ---------- HARD: JOKER ----------
function aiHardAsJoker(hand, player, position, trickValue, briscola) {
  const playable = hand.slice();
  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = playable.filter(c => c.points === 0);
  const lowPoints = playable.filter(c => c.points > 0 && c.points <= 4);
  const highPoints = playable.filter(c => c.points >= 10); // MAI REGALARE!
  const puntiBassi = playable.filter(c => c.points > 0 && c.points <= 1);
  const canWin = playable.filter(c => wouldWinTrickWith(c, player));
  const currentWinner = simulateCurrentWinner();

  const jokerScore = GAME_STATE.tricksWon[player].reduce((s, c) => s + c.points, 0);
  const jokerNeeded = Math.max(0, 51 - jokerScore);
  
  // Memoria: conta briscole giocate per evitare sprechi
  const briscolesPlayed = typeof AI_MEMORY !== "undefined" ? AI_MEMORY.briscolesPlayed.length : 0;
  const briscolesRemaining = 10 - briscolesPlayed; // 10 briscole totali nel mazzo
  const shouldConserveBriscolas = briscolesRemaining <= 3 && briscolas.length <= 2;
  
  // Funzione helper: MAI regalare assi o tre quando non può vincere
  function getBestDiscardCard() {
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (puntiBassi.length > 0) return sortByPointsAsc(puntiBassi)[0];
    if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
    const lowNonBriscola = nonBriscolas.filter(c => c.points <= 4);
    if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
    const lowBriscolas = briscolas.filter(c => c.points <= 4);
    if (lowBriscolas.length > 0) return sortByOrderAsc(lowBriscolas)[0];
    const safeCards = playable.filter(c => c.points < 10);
    if (safeCards.length > 0) return sortByPointsAsc(safeCards)[0];
    return playable[0];
  }

  // Primo di mano: scarica strategico, evita briscole se poche rimaste
  if (position === 0) {
    if (scarti.length > 0 && nonBriscolas.length > 0) {
      return sortByOrderAsc(scarti.filter(c => c.suit !== briscola))[0] || sortByOrderAsc(scarti)[0];
    }
    if (lowPoints.length > 0 && nonBriscolas.length > 0) {
      return sortByPointsAsc(lowPoints.filter(c => c.suit !== briscola))[0] || sortByPointsAsc(lowPoints)[0];
    }
    if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
    // Solo briscole: gioca la più bassa
    return sortByOrderAsc(briscolas)[0] || playable[0];
  }

  // Già vincendo: supporta con minimo, conserva briscole se poche
  if (currentWinner === player) {
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
    if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
    // Usa briscola solo se necessario
    return sortByOrderAsc(briscolas)[0] || playable[0];
  }

  // Non può vincere: MAI regalare assi o tre! Usa solo scarti o carte basse
  if (canWin.length === 0) {
    return getBestDiscardCard();
  }

  // Valuta se conviene vincere
  const shouldWin = trickValue >= 10 || (trickValue > 0 && trickValue >= jokerNeeded);

  if (shouldWin) {
    // Preferisce vincere senza briscola se possibile, altrimenti usa briscola minima
    const nonBriscolaWins = canWin.filter(c => c.suit !== briscola);
    if (nonBriscolaWins.length > 0 && !shouldConserveBriscolas) {
      return sortByPointsAsc(nonBriscolaWins)[0];
    }
    
    const briscolaWins = canWin.filter(c => c.suit === briscola);
    if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
    return sortByPointsAsc(canWin)[0];
  }

  // Non conviene vincere: scarica conservando risorse (MAI punti alti!)
  return getBestDiscardCard();
}

// ---------- HARD: ALLEATO (MIGLIORATO CON COORDINAZIONE) ----------
function aiHardAsAlly(hand, player, position, trickValue, briscola) {
  const playable = hand.slice();
  const joker = GAME_STATE.jokerPlayer;
  const allies = TURN_ORDER.filter(p => p !== joker);
  const myAlly = allies.find(p => p !== player);

  const currentWinner = simulateCurrentWinner();

  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = playable.filter(c => c.points === 0);
  const puntiUtili = playable.filter(c => c.points > 0);
  const puntiAlti = playable.filter(c => c.points >= 10); // MAI REGALARE!
  const puntiMedi = playable.filter(c => c.points > 0 && c.points <= 4);
  const puntiBassi = playable.filter(c => c.points > 0 && c.points <= 1);
  const canWin = playable.filter(c => wouldWinTrickWith(c, player));
  
  // Funzione helper: MAI regalare assi o tre quando non può vincere
  function getBestDiscardCard() {
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (puntiBassi.length > 0) return sortByPointsAsc(puntiBassi)[0];
    if (puntiMedi.length > 0) return sortByPointsAsc(puntiMedi)[0];
    const lowNonBriscola = nonBriscolas.filter(c => c.points <= 4);
    if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
    const lowBriscolas = briscolas.filter(c => c.points <= 4);
    if (lowBriscolas.length > 0) return sortByOrderAsc(lowBriscolas)[0];
    const safeCards = playable.filter(c => c.points < 10);
    if (safeCards.length > 0) return sortByPointsAsc(safeCards)[0];
    return playable[0];
  }

  const myScore = GAME_STATE.tricksWon[player].reduce((s, c) => s + c.points, 0);
  const allyScore = GAME_STATE.tricksWon[myAlly].reduce((s, c) => s + c.points, 0);
  const alliesTotal = myScore + allyScore;
  const alliesNeeded = Math.max(0, 71 - alliesTotal);
  
  // Memoria: conta briscole giocate
  const briscolesPlayed = typeof AI_MEMORY !== "undefined" ? AI_MEMORY.briscolesPlayed.length : 0;
  const briscolesRemaining = 10 - briscolesPlayed;
  const shouldConserveBriscolas = briscolesRemaining <= 3 && briscolas.length <= 2;

  // PRIMO: scarica conservativo, evita briscole se poche rimaste
  if (position === 0) {
    if (scarti.length > 0 && nonBriscolas.length > 0) {
      return sortByOrderAsc(scarti.filter(c => c.suit !== briscola))[0] || sortByOrderAsc(scarti)[0];
    }
    const lowNonBriscola = nonBriscolas.filter(c => c.points <= 1);
    if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
    return sortByOrderAsc(briscolas)[0] || playable[0];
  }

  // COMPAGNO STA VINCENDO → DAGLI PUNTI (ma non superarlo con punti alti)
  if (currentWinner === myAlly) {
    // Se può vincere con punti alti, valuta se conviene superare
    if (canWin.length > 0 && puntiAlti.length > 0) {
      // Non superare con assi/tre se il compagno sta già vincendo una presa ricca
      if (trickValue >= 15) {
        const nonHighWins = canWin.filter(c => c.points < 10);
        if (nonHighWins.length > 0) {
          // Supera solo se necessario per evitare che il Joker rubi
          const jokerCard = GAME_STATE.currentTrick.cards[joker];
          if (jokerCard && jokerCard.points >= 10) {
            return sortByPointsAsc(nonHighWins)[0];
          }
        }
      }
    }
    
    // Supporta con punti utili ma non alti
    const puntiUtiliNonAlti = puntiUtili.filter(c => c.points < 10);
    if (puntiUtiliNonAlti.length > 0) return sortByPointsDesc(puntiUtiliNonAlti)[0];
    if (puntiUtili.length > 0) return sortByPointsDesc(puntiUtili)[0];
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    const lowNonBriscola = nonBriscolas.filter(c => c.points <= 1);
    if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
    return sortByOrderAsc(briscolas)[0] || playable[0];
  }

  // JOKER STA VINCENDO → RUBA SE CONVIENE
  if (currentWinner === joker && canWin.length > 0) {
    const shouldSteal = trickValue >= 10 || (trickValue > 0 && trickValue >= alliesNeeded);
    
    // Valuta anche se il Joker sta prendendo punti alti
    const jokerCard = GAME_STATE.currentTrick.cards[joker];
    const isJokerTakingHighPoints = jokerCard && jokerCard.points >= 10;

    if (shouldSteal || isJokerTakingHighPoints) {
      // Preferisce vincere senza briscola se possibile
      const nonBriscolaWins = canWin.filter(c => c.suit !== briscola);
      if (nonBriscolaWins.length > 0 && !shouldConserveBriscolas) {
        return sortByPointsAsc(nonBriscolaWins)[0];
      }
      
      const briscolaWins = canWin.filter(c => c.suit === briscola);
      if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
      return sortByPointsAsc(canWin)[0];
    }
  }

  // PRESA RICCA: vince se può
  if (trickValue >= 10 && canWin.length > 0) {
    // Preferisce senza briscola se possibile
    const nonBriscolaWins = canWin.filter(c => c.suit !== briscola);
    if (nonBriscolaWins.length > 0 && !shouldConserveBriscolas) {
      return sortByPointsAsc(nonBriscolaWins)[0];
    }
    
    const briscolaWins = canWin.filter(c => c.suit === briscola);
    if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
    return sortByPointsAsc(canWin)[0];
  }

  // NON PUÒ VINCERE: MAI regalare assi o tre! Specialmente al Joker!
  if (canWin.length === 0) {
    return getBestDiscardCard();
  }

  // DEFAULT: scarica (solo se può vincere ma non conviene)
  if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
  const lowNonBriscola = nonBriscolas.filter(c => c.points <= 1);
  if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
  // MAI punti alti qui!
  const safeCards = playable.filter(c => c.points < 10);
  if (safeCards.length > 0) return sortByPointsAsc(safeCards)[0];
  return sortByOrderAsc(briscolas)[0] || playable[0];
}

// ---------- HARD: NEUTRALE ----------
function aiHardAsNeutral(hand, player, position, trickValue, briscola) {
  const playable = hand.slice();
  const briscolas = playable.filter(c => c.suit === briscola);
  const nonBriscolas = playable.filter(c => c.suit !== briscola);
  const scarti = nonBriscolas.filter(c => c.points === 0);
  const lowPoints = nonBriscolas.filter(c => c.points > 0 && c.points <= 4);
  const highPoints = playable.filter(c => c.points >= 10); // MAI REGALARE!
  const puntiBassi = playable.filter(c => c.points > 0 && c.points <= 1);
  const canWin = playable.filter(c => wouldWinTrickWith(c, player));
  const currentWinner = simulateCurrentWinner();
  
  // Funzione helper: MAI regalare assi o tre quando non può vincere
  function getBestDiscardCard() {
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (puntiBassi.length > 0) return sortByPointsAsc(puntiBassi)[0];
    if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
    const lowNonBriscola = nonBriscolas.filter(c => c.points <= 4);
    if (lowNonBriscola.length > 0) return sortByPointsAsc(lowNonBriscola)[0];
    const lowBriscolas = briscolas.filter(c => c.points <= 4);
    if (lowBriscolas.length > 0) return sortByOrderAsc(lowBriscolas)[0];
    const safeCards = playable.filter(c => c.points < 10);
    if (safeCards.length > 0) return sortByPointsAsc(safeCards)[0];
    return playable[0];
  }

  // Memoria: conta briscole giocate
  const briscolesPlayed = typeof AI_MEMORY !== "undefined" ? AI_MEMORY.briscolesPlayed.length : 0;
  const briscolesRemaining = 10 - briscolesPlayed;
  const shouldConserveBriscolas = briscolesRemaining <= 3 && briscolas.length <= 2;

  // Primo di mano: evita briscola, preferisce scarti
  if (position === 0) {
    if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
    if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
    if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
    // Solo briscole: gioca la più bassa
    return sortByOrderAsc(briscolas)[0] || playable[0];
  }

  // Presa ricca (>=15): vince se può, preferisce senza briscola
  if (trickValue >= 15 && canWin.length > 0) {
    const nonBriscolaWins = canWin.filter(c => c.suit !== briscola);
    if (nonBriscolaWins.length > 0 && !shouldConserveBriscolas) {
      return sortByPointsAsc(nonBriscolaWins)[0];
    }

    const briscolaWins = canWin.filter(c => c.suit === briscola);
    if (briscolaWins.length > 0) return sortByOrderAsc(briscolaWins)[0];
    return sortByPointsAsc(canWin)[0];
  }

  // Presa con punti alti: valuta se rubare
  if (canWin.length > 0 && trickValue > 0) {
    const currentCard = GAME_STATE.currentTrick.cards[currentWinner];
    if (currentCard && currentCard.points >= 10) {
      // Ruba punti alti se può senza sprecare briscola
      const nonBriscolaWins = canWin.filter(c => c.suit !== briscola && c.points < 10);
      if (nonBriscolaWins.length > 0) return sortByPointsAsc(nonBriscolaWins)[0];
      
      // Se necessario, usa briscola bassa
      const briscolaWins = canWin.filter(c => c.suit === briscola);
      if (briscolaWins.length > 0 && !shouldConserveBriscolas) {
        return sortByOrderAsc(briscolaWins)[0];
      }
    }
  }

  // Non può vincere: MAI regalare assi o tre!
  if (canWin.length === 0) {
    return getBestDiscardCard();
  }

  // Default: scarica (solo se può vincere ma non conviene)
  if (scarti.length > 0) return sortByOrderAsc(scarti)[0];
  if (lowPoints.length > 0) return sortByPointsAsc(lowPoints)[0];
  if (nonBriscolas.length > 0) return sortByPointsAsc(nonBriscolas)[0];
  // MAI punti alti qui!
  const safeCards = playable.filter(c => c.points < 10);
  if (safeCards.length > 0) return sortByPointsAsc(safeCards)[0];
  return sortByOrderAsc(briscolas)[0] || playable[0];
}
// ===============================
// IA EXPERT — GIOCATORE PRO / QUASI IMBATTIBILE
// ===============================

function aiExpert(hand, player) {
  const role = getRole(player);
  const briscola = getBriscolaSuit();
  const position = getPositionInTrick(player);
  const trickValue = getTrickValue();

  // Usa memoria avanzata per valutazioni migliori
  const briscolesPlayed = typeof AI_MEMORY !== "undefined" ? AI_MEMORY.briscolesPlayed.length : 0;
  const briscolesRemaining = 10 - briscolesPlayed;
  const cardsPlayed = typeof AI_MEMORY !== "undefined" ? AI_MEMORY.cardsPlayed : { me: [], ai1: [], ai2: [] };
  
  // Stima carte rimanenti nel mazzo
  const totalCardsPlayed = cardsPlayed.me.length + cardsPlayed.ai1.length + cardsPlayed.ai2.length;
  const cardsRemainingInDeck = 39 - totalCardsPlayed - (GAME_STATE.hands.me.length + GAME_STATE.hands.ai1.length + GAME_STATE.hands.ai2.length);

  const evaluations = hand.map(card => ({
    card,
    score: evaluateExpertCard(card, player, role, position, trickValue, briscola, briscolesRemaining, cardsRemainingInDeck)
  }));

  evaluations.sort((a, b) => b.score - a.score);
  return evaluations[0].card;
}

function evaluateExpertCard(card, player, role, position, trickValue, briscola, briscolesRemaining = 10, cardsRemainingInDeck = 30) {
  let score = 0;

  const isBriscola = card.suit === briscola;
  const canWin = wouldWinTrickWith(card, player);
  const currentWinner = simulateCurrentWinner();
  const isHighPoint = card.points >= 10; // assi e tre
  const isRichTrick = trickValue >= 10;

  const joker = GAME_STATE.jokerPlayer;
  const allies = TURN_ORDER.filter(p => p !== joker);
  const myAlly = allies.find(a => a !== player);

  const playerScore = GAME_STATE.tricksWon[player].reduce((s, c) => s + c.points, 0);
  const allyScore = role === "ally"
    ? playerScore + GAME_STATE.tricksWon[myAlly].reduce((s, c) => s + c.points, 0)
    : playerScore;
  
  // Valuta conservazione briscole
  const shouldConserveBriscolas = briscolesRemaining <= 3;
  const gamePhase = cardsRemainingInDeck < 10 ? "late" : cardsRemainingInDeck < 20 ? "mid" : "early";

  // VALORE BASE
  score += card.points * 8;
  score += card.order * 1.5;

  // BRISCOLE - Conservazione intelligente
  if (isBriscola) {
    score += 12;
    if (card.order >= 8) score += 20;
    
    // Penalizza uso briscola quando poche rimaste e non necessario
    if (shouldConserveBriscolas && !canWin && trickValue < 10) {
      score -= 25;
    }
    
    // Penalizza briscola alta quando poche rimaste
    if (shouldConserveBriscolas && card.order >= 8 && trickValue === 0) {
      score -= 30;
    }
  }

  // POSIZIONE
  if (position === 0) {
    if (isHighPoint) score -= 25;
    if (isBriscola && !shouldConserveBriscolas) score -= 30;
    if (isBriscola && shouldConserveBriscolas) score -= 50; // Penalità maggiore se poche briscole
    if (card.points === 0 && card.order <= 3) score += 10;
  }

  if (position === 2 && canWin && isRichTrick) {
    score += 30;
    // Bonus se può vincere senza briscola
    if (!isBriscola) score += 10;
  }

  // RUOLO: JOKER
  if (role === "joker") {
    const jokerNeeded = 51 - playerScore;

    if (trickValue > 0 && trickValue >= jokerNeeded) {
      score += 60; // Bonus maggiore se serve per vincere
      // Preferisce senza briscola se possibile
      if (!isBriscola && canWin) score += 15;
    } else if (isRichTrick && canWin) {
      score += 18;
      // Preferisce senza briscola
      if (!isBriscola) score += 10;
    }

    if (isBriscola && card.order >= 8 && trickValue === 0) {
      score -= 50; // Penalità maggiore per spreco briscola alta
    }

    if (!canWin && isHighPoint && trickValue > 0 && currentWinner !== player) {
      score -= 100; // Penalità massima per regalare punti alti
    }
    
    // Conserva briscole se non serve vincere
    if (isBriscola && !canWin && trickValue < 5 && shouldConserveBriscolas) {
      score -= 30;
    }
  }

  // RUOLO: ALLEATO
  else if (role === "ally") {
    // Dare punti al compagno se sta vincendo e tu non puoi vincere
    if (!canWin && currentWinner === myAlly && card.points > 0) {
      score += 60; // Bonus maggiore per coordinazione
      // Non dare punti alti se non necessario
      if (isHighPoint && trickValue < 10) score -= 20;
    }

    // Non superare il compagno con assi/tre inutilmente
    if (currentWinner === myAlly && canWin && isHighPoint) {
      score -= 50; // Penalità maggiore
      // Supera solo se necessario per evitare che Joker rubi
      const jokerCard = GAME_STATE.currentTrick.cards[joker];
      if (jokerCard && jokerCard.points >= 10 && trickValue >= 10) {
        score += 40; // Override: meglio superare che lasciare al Joker
      }
    }

    // Rubare al Joker - bonus maggiore
    if (currentWinner === joker && canWin) {
      const jokerCard = GAME_STATE.currentTrick.cards[joker];
      const isJokerTakingHighPoints = jokerCard && jokerCard.points >= 10;
      
      score += 50; // Bonus base
      if (isJokerTakingHighPoints) score += 30; // Bonus extra per rubare punti alti
      if (isBriscola && card.order >= 7) score += 15;
      
      // Preferisce senza briscola se possibile
      if (!isBriscola && !shouldConserveBriscolas) score += 20;
    }

    const alliesNeeded = 71 - allyScore;
    if (trickValue > 0 && trickValue >= alliesNeeded) {
      score += 50; // Bonus maggiore se serve per vincere
      if (!isBriscola) score += 15; // Preferisce senza briscola
    }

    // NON regalare assi/tre al Joker - penalità massima
    if (!canWin && isHighPoint && trickValue > 0 && currentWinner === joker) {
      score -= 120; // Penalità massima
    }

    if (!canWin && isHighPoint && trickValue > 0 && currentWinner !== player && currentWinner !== myAlly) {
      score -= 80; // Penalità alta per regalare punti alti
    }
    
    // Conserva briscole se compagno sta vincendo
    if (isBriscola && currentWinner === myAlly && !canWin && shouldConserveBriscolas) {
      score -= 20;
    }
  }

  // RUOLO: NEUTRALE
  else if (role === "none") {
    if (position === 0 && isBriscola) {
      score -= 40; // Penalità maggiore per diventare Joker prematuramente
      if (shouldConserveBriscolas) score -= 20; // Penalità extra se poche briscole
    }

    if (card.order >= 8 && card.points === 0 && !isBriscola) score += 8;

    if (!canWin && isHighPoint && trickValue > 0) {
      score -= 60; // Penalità maggiore per regalare punti alti
    }
    
    // Presa ricca: valuta se diventare Joker conviene
    if (canWin && trickValue >= 15 && !isBriscola) {
      score += 25; // Bonus per rubare presa ricca senza diventare Joker
    }
  }

  // PENALITÀ GENERALI SE NON PUÒ VINCERE - MAI REGALARE ASSI O TRE!
  if (!canWin) {
    // Penalità MASSIMA per regalare assi (11 punti) o tre (10 punti)
    if (isHighPoint) {
      score -= 200; // Penalità MASSIMA - MAI regalare!
      // Ancora peggio se il Joker sta vincendo
      if (role === "ally" && currentWinner === joker) {
        score -= 100; // Penalità extra
      }
    }
    // Penalità per altre carte con punti
    if (card.points > 0 && !isHighPoint) score -= 20;
    // Penalità per briscole
    if (isBriscola && shouldConserveBriscolas) score -= 15;
    else if (isBriscola) score -= 10;
  }
  
  // BONUS: Fase di gioco avanzata - più aggressivo
  if (gamePhase === "late" && canWin && isRichTrick) {
    score += 15;
  }

  return score;
}

// ===============================
// MEMORY SUPPORT FUNCTIONS
// ===============================

function countBriscolesRemaining() {
  const briscola = getBriscolaSuit();
  const fullDeck = createFullDeck();
  const allBriscolas = fullDeck.filter(c => c.suit === briscola);

  const played = AI_MEMORY.briscolesPlayed.length;
  const remaining = allBriscolas.length - played;

  return remaining;
}

function getCardsRemainingInDeck() {
  const fullDeck = createFullDeck();
  removeRandomTwo(fullDeck);

  const played = [];
  for (const p of ["me", "ai1", "ai2"]) {
    played.push(...AI_MEMORY.cardsPlayed[p]);
  }

  return fullDeck.filter(c =>
    !played.some(p => p.suit === c.suit && p.rankId === c.rankId)
  );
}

function estimateOpponentHand(player) {
  const remaining = getCardsRemainingInDeck();
  const cardsInHand = GAME_STATE.hands[player].length;
  return remaining.slice(0, cardsInHand);
}
