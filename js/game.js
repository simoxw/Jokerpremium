// ===============================
// MOTORE PRINCIPALE DEL GIOCO
// ===============================

function startMatch() {
  startSingleGame();
}

function startSingleGame() {
  GAME_STATE.jokerPlayer = null;
  GAME_STATE.tricksWon = { me: [], ai1: [], ai2: [] };
  GAME_STATE.currentTrick = { starter: null, cards: { me: null, ai1: null, ai2: null } };
  GAME_STATE.trickHistory = [];

  // Reset AI memory per nuova partita
  if (typeof AI_MEMORY !== "undefined") {
    AI_MEMORY.cardsPlayed = { me: [], ai1: [], ai2: [] };
    AI_MEMORY.briscolesPlayed = [];
    AI_MEMORY.predictedHands = { me: [], ai1: [], ai2: [] };
  }

  clearAllJokers();

  GAME_STATE.deck = createFullDeck();
  removeRandomTwo(GAME_STATE.deck);
  shuffle(GAME_STATE.deck);

  dealInitialHands();

  GAME_STATE.briscolaCard = GAME_STATE.deck.pop();
  GAME_STATE.briscolaSuit = GAME_STATE.briscolaCard.suit;

  GAME_STATE.currentTrick.starter = "me";
  GAME_STATE.currentPlayer = "me";

  GAME_STATE.inputLocked = false;

  // Reset statistiche partita e animazione transizione
  resetGameStats();
  animateHandTransition();

  renderUI();
}

function playerPlaysCard(card) {
  // Validazione robusta
  if (!playerPlaysCardSafe(card)) {
    return;
  }
}

// ===============================
// PLAYCARD CON ANIMAZIONI & AUDIO
// ===============================

function playCard(player, card) {
  // Safety check: carta null?
  if (!card) {
    console.error("[playCard] Carta null per player", player);
    // Se la IA non riesce a scegliere, prendi la prima carta disponibile
    if (player !== "me") {
      const hand = GAME_STATE.hands[player];
      if (hand && hand.length > 0) {
        card = hand[0];
        console.warn("[playCard] Fallback: prendo prima carta disponibile per", player);
      } else {
        console.error("[playCard] Nessuna carta disponibile per", player);
        return;
      }
    } else {
      console.error("[playCard] Carta non valida per il giocatore");
      showToast("❌ Seleziona una carta valida", "error");
      return;
    }
  }

  // Validazione stato
  if (!validateGameState()) {
    recoverFromCorruptedState();
    return;
  }

  // Safety check: verifica che la carta esista
  if (!card.suit || card.rankId === undefined) {
    console.error("[playCard] Carta invalida:", card);
    showToast("❌ Carta invalida", "error");
    return;
  }

  const hand = GAME_STATE.hands[player];
  
  // Trova la carta nella mano per proprietà (non per reference)
  const idx = hand.findIndex(c => 
    c.suit === card.suit && c.rankId === card.rankId
  );
  
  if (idx !== -1) {
    hand.splice(idx, 1);
  } else {
    console.error("[playCard] Carta non trovata in mano:", card, hand);
    showToast("❌ Carta non in mano!", "error");
    return;
  }

  GAME_STATE.currentTrick.cards[player] = card;

  // Registra carta in memoria IA (per tutte le difficoltà)
  if (typeof recordCardPlayed === "function") {
    recordCardPlayed(player, card);
  }

  // Audio feedback
  playSound("card-play");

  // Animazione notifica
  if (player !== "me") {
    notifyCardPlayed(player, card);
  }

  if (player === "me") {
    GAME_STATE.inputLocked = true;
  }

  if (!GAME_STATE.jokerPlayer && card.suit === GAME_STATE.briscolaSuit) {
    GAME_STATE.jokerPlayer = player;
    revealJokerUI(player);
    
    // Notifica di rivelazione Joker
    notifyJokerRevealed(player);
    playSound("card-flip");
  }

  const played = GAME_STATE.currentTrick.cards;

  if (played.me && played.ai1 && played.ai2) {
    GAME_STATE.currentPlayer = null;
    renderUI();
    resolveTrick();
    return;
  }

  GAME_STATE.currentPlayer = getNextPlayer(player);
  renderUI();

  if (GAME_STATE.currentPlayer !== "me") {
    const aiCard = aiChooseCard(GAME_STATE.currentPlayer);
    setTimeout(() => playCard(GAME_STATE.currentPlayer, aiCard), 600);
  }
}

// ===============================
// RISOLUZIONE PRESA
// ===============================

function resolveTrick() {
  const played = GAME_STATE.currentTrick.cards;

  // Verifica che tutti abbiano giocato prima di risolvere
  if (!played.me || !played.ai1 || !played.ai2) {
    console.debug("[resolveTrick] Non tutti hanno giocato ancora, attendere...");
    return;
  }

  const winner = evaluateTrick();

  highlightWinnerCard(winner);

  // Aggiungi solo le carte non-null al vincitore
  if (played.me) GAME_STATE.tricksWon[winner].push(played.me);
  if (played.ai1) GAME_STATE.tricksWon[winner].push(played.ai1);
  if (played.ai2) GAME_STATE.tricksWon[winner].push(played.ai2);

  // Calcola punti guadagnati in questa presa (somma dei punti delle carte)
  const trickPoints = (played.me ? played.me.points : 0) + 
                      (played.ai1 ? played.ai1.points : 0) + 
                      (played.ai2 ? played.ai2.points : 0);
  
  const scores = calculateSingleGameScores();
  
  // Registra statistiche
  recordHandStats();
  
  // Audio e notifica vittoria presa
  playSound("card-win");
  notifyTrickWinner(winner);
  
  // Floating score per punti guadagnati (solo se ci sono punti)
  if (trickPoints > 0) {
    const winnerSlot = document.getElementById(`played-${winner}`);
    if (winnerSlot) {
      setTimeout(() => {
        showFloatingScore(trickPoints, winnerSlot, winner);
      }, 300);
    }
  }
  
  GAME_STATE.trickHistory.push({
    winner: winner,
    cards: { ...played },
    scores: { ...scores }
  });

  const btn = document.getElementById("nextHandBtn");
  if (btn) {
    btn.style.display = "inline-block";
    btn.onclick = advanceToNextHand;
    
    // Pulsante pronto con glow effect
    if (typeof markButtonReady === "function") {
      markButtonReady("nextHandBtn");
    }
  }
}

// 🔥 MODIFICATO: highlight persistente + particelle premium
function highlightWinnerCard(winner) {
  const slot = document.getElementById(`played-${winner}`);
  slot.classList.add("winner-highlight");

  // Aggiungi animazione flip della carta
  const cardElement = slot.querySelector(".card-image");
  if (cardElement) {
    cardElement.style.animation = "cardFlip 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards";
  }

  // Emetti particelle di vittoria con Phaser
  if (window.PHASER_ENGINE && slot) {
    const rect = slot.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Colore diverse per ogni giocatore
    const colors = {
      me: "#FFD700",      // Oro per il giocatore
      ai1: "#FF6B9D",     // Rosa per IA1
      ai2: "#4ECDC4"      // Turchese per IA2
    };
    
    PHASER_ENGINE.emitWinParticles(x, y, colors[winner] || "#FFD700");
  }
}

function advanceToNextHand() {
  const btn = document.getElementById("nextHandBtn");
  btn.style.display = "none";
  unmarkButtonReady("nextHandBtn");

  // 🔥 Rimuove highlight persistente della presa precedente
  document.getElementById("played-me").classList.remove("winner-highlight");
  document.getElementById("played-ai1").classList.remove("winner-highlight");
  document.getElementById("played-ai2").classList.remove("winner-highlight");

  // Usa l'ultimo vincitore salvato nella history
  const lastTrick = GAME_STATE.trickHistory[GAME_STATE.trickHistory.length - 1];
  const lastWinner = lastTrick ? lastTrick.winner : null;
  const order = getTrickOrder(lastWinner);

  for (let i = 0; i < order.length; i++) {
    const player = order[i];

    if (GAME_STATE.deck.length > 0) {
      const card = GAME_STATE.deck.shift();
      GAME_STATE.hands[player].push(card);
      
      // Suono pescare carta (pop.mp3 delicato)
      if (player === "me") {
        playSound("draw");
      }
    }
    else if (GAME_STATE.deck.length === 0 && GAME_STATE.briscolaCard) {
      GAME_STATE.hands[player].push(GAME_STATE.briscolaCard);
      GAME_STATE.briscolaCard = null;
      
      // Suono pescare carta (pop.mp3 delicato)
      if (player === "me") {
        playSound("draw");
      }
    }
  }

  GAME_STATE.currentTrick = {
    starter: order[0],
    cards: { me: null, ai1: null, ai2: null }
  };

  GAME_STATE.currentPlayer = order[0];
  GAME_STATE.inputLocked = false;

  renderUI();

  if (checkEndOfSingleGame()) return;

  if (GAME_STATE.currentPlayer !== "me") {
    const aiCard = aiChooseCard(GAME_STATE.currentPlayer);
    setTimeout(() => playCard(GAME_STATE.currentPlayer, aiCard), 600);
  }
}

function getTrickOrder(lastWinner = null) {
  let winner = lastWinner;
  if (!winner) {
    winner = evaluateTrick();
  }
  const idx = TURN_ORDER.indexOf(winner);

  return [
    TURN_ORDER[idx],
    TURN_ORDER[(idx + 1) % 3],
    TURN_ORDER[(idx + 2) % 3]
  ];
}

// ===============================
// FINE PARTITA SINGOLA
// ===============================

function checkEndOfSingleGame() {
  const noCardsInHands =
    GAME_STATE.hands.me.length === 0 &&
    GAME_STATE.hands.ai1.length === 0 &&
    GAME_STATE.hands.ai2.length === 0;

  const noCardsInDeck = GAME_STATE.deck.length === 0 && !GAME_STATE.briscolaCard;

  if (noCardsInHands && noCardsInDeck) {
    endSingleGame();
    return true;
  }

  return false;
}

function endSingleGame() {
  const scores = calculateSingleGameScores();
  const result = determineSingleGameWinner(scores);

  let message = "";
  let isVictory = false;
  let isDefeat = false;

  if (result === "joker") {
    message = `Il Joker (${GAME_STATE.jokerPlayer}) ha vinto!`;
    const oldMatchScore = GAME_STATE.matchScore[GAME_STATE.jokerPlayer];
    GAME_STATE.matchScore[GAME_STATE.jokerPlayer] += 2;
    isVictory = GAME_STATE.jokerPlayer === "me";
    isDefeat = GAME_STATE.jokerPlayer !== "me";
    
    // Floating score per punti partita guadagnati
    if (GAME_STATE.jokerPlayer === "me") {
      const scoreElement = document.getElementById("score-me");
      if (scoreElement) {
        setTimeout(() => {
          showFloatingScore(2, scoreElement, "me");
        }, 500);
      }
    }
  } else if (result === "allies") {
    const allies = TURN_ORDER.filter(p => p !== GAME_STATE.jokerPlayer);
    message = `Gli alleati (${allies.join(" + ")}) hanno vinto!`;
    GAME_STATE.matchScore[allies[0]] += 1;
    GAME_STATE.matchScore[allies[1]] += 1;
    isVictory = allies.includes("me");
    isDefeat = !allies.includes("me");
    
    // Floating score per punti partita guadagnati
    if (allies.includes("me")) {
      const scoreElement = document.getElementById("score-me");
      if (scoreElement) {
        setTimeout(() => {
          showFloatingScore(1, scoreElement, "me");
        }, 500);
      }
    }
  } else {
    message = "Pareggio tecnico.";
  }

  // Suoni vittoria/sconfitta
  if (isVictory) {
    playSound("victory");
  } else if (isDefeat) {
    playSound("defeat");
  }

  renderUI();

  if (checkEndOfMatch()) return;

  showEndSingleGamePanel(message, scores);
}

function startNextSingleGame() {
  startSingleGame();
}

// ===============================
// FINE PARTITA GENERALE
// ===============================

function checkEndOfMatch() {
  for (const p of TURN_ORDER) {
    if (GAME_STATE.matchScore[p] >= 10) {
      showEndMatchPanel(p);
      return true;
    }
  }
  return false;
}

function showEndMatchPanel(winner) {
  // Suoni vittoria/sconfitta per partita generale
  if (winner === "me") {
    playSound("victory");
  } else {
    playSound("defeat");
  }
  
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "0";
  panel.style.left = "0";
  panel.style.width = "100%";
  panel.style.height = "100%";
  panel.style.background = "rgba(0,0,0,0.8)";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.justifyContent = "center";
  panel.style.alignItems = "center";
  panel.style.color = "white";
  panel.style.fontSize = "1.5rem";
  panel.style.zIndex = "9999";

  panel.innerHTML = `
    <div style="background:#0f4f2e; padding:25px; border-radius:12px; text-align:center;">
      <h2>Partita Generale Conclusa</h2>
      <p>Ha vinto: <strong>${winner}</strong></p>
      <button id="restartMatchBtn" style="margin-top:20px; padding:10px 20px; border:none; border-radius:6px; background:#e0a800; color:#1b1202; font-weight:bold; cursor:pointer;">
        Nuova Partita Generale
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("restartMatchBtn").onclick = () => {
    document.body.removeChild(panel);
    GAME_STATE.matchScore = { me: 0, ai1: 0, ai2: 0 };
    GAME_STATE.jokerPlayer = null;
    clearAllJokers();
    startMatch();
  };
}

// ===============================
// RESET PARTITA (PULSANTE ESTERNO)
// ===============================

function resetMatch() {
  const conferma = confirm("Vuoi davvero ricominciare la partita da capo?");

  if (!conferma) return;

  GAME_STATE.matchScore = { me: 0, ai1: 0, ai2: 0 };
  GAME_STATE.jokerPlayer = null;
  GAME_STATE.trickHistory = [];
  GAME_STATE.tricksWon = { me: [], ai1: [], ai2: [] };
  GAME_STATE.currentTrick = { starter: null, cards: { me: null, ai1: null, ai2: null } };

  clearAllJokers();
  startMatch();
}
