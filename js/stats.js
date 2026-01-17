// ===============================
// STATISTICHE ESSENZIALI PARTITA
// ===============================

const STATS = {
  currentSession: {
    gamesPlayed: 0,
    gamesWonByMe: 0,
    gamesWonByJoker: 0,
    gamesWonByAllies: 0,
    totalPointsMe: 0,
    totalPointsAI1: 0,
    totalPointsAI2: 0,
    handsStartedAsJoker: 0,
    handsStartedAsAlly: 0
  },

  currentGame: {
    handsPlayed: 0,
    myPoints: 0,
    ai1Points: 0,
    ai2Points: 0,
    trickHistory: []
  }
};

/**
 * Registra una mano completata
 */
function recordHandStats() {
  const scores = calculateSingleGameScores();
  const joker = GAME_STATE.jokerPlayer;

  STATS.currentGame.handsPlayed++;
  STATS.currentGame.myPoints += scores.me;
  STATS.currentGame.ai1Points += scores.ai1;
  STATS.currentGame.ai2Points += scores.ai2;

  // Traccia ruolo del giocatore
  if (joker === "me") {
    STATS.currentSession.handsStartedAsJoker++;
  } else {
    STATS.currentSession.handsStartedAsAlly++;
  }

  STATS.currentGame.trickHistory.push({
    hand: STATS.currentGame.handsPlayed,
    joker: joker,
    winner: GAME_STATE.trickHistory[GAME_STATE.trickHistory.length - 1]?.winner,
    scores: { ...scores }
  });
}

/**
 * Registra una partita completata
 */
function recordGameStats(winner) {
  STATS.currentSession.gamesPlayed++;

  if (winner === "me") {
    STATS.currentSession.gamesWonByMe++;
  } else if (winner === "joker") {
    STATS.currentSession.gamesWonByJoker++;
  } else if (winner === "allies") {
    STATS.currentSession.gamesWonByAllies++;
  }

  STATS.currentSession.totalPointsMe += STATS.currentGame.myPoints;
  STATS.currentSession.totalPointsAI1 += STATS.currentGame.ai1Points;
  STATS.currentSession.totalPointsAI2 += STATS.currentGame.ai2Points;
}

/**
 * Resetta statistiche sessione
 */
function resetSessionStats() {
  STATS.currentSession = {
    gamesPlayed: 0,
    gamesWonByMe: 0,
    gamesWonByJoker: 0,
    gamesWonByAllies: 0,
    totalPointsMe: 0,
    totalPointsAI1: 0,
    totalPointsAI2: 0,
    handsStartedAsJoker: 0,
    handsStartedAsAlly: 0
  };
}

/**
 * Resetta statistiche partita corrente
 */
function resetGameStats() {
  STATS.currentGame = {
    handsPlayed: 0,
    myPoints: 0,
    ai1Points: 0,
    ai2Points: 0,
    trickHistory: []
  };
}

/**
 * Calcola win rate
 */
function getWinRate() {
  const total = STATS.currentSession.gamesPlayed;
  if (total === 0) return 0;
  return (STATS.currentSession.gamesWonByMe / total * 100).toFixed(1);
}

/**
 * Calcola punti medi per partita
 */
function getAveragePointsPerGame() {
  const total = STATS.currentSession.gamesPlayed;
  if (total === 0) return 0;
  return (STATS.currentSession.totalPointsMe / total).toFixed(1);
}

/**
 * Visualizza statistiche essenziali
 */
function displaySessionStats() {
  const stats = STATS.currentSession;
  
  const summary = `
    📊 STATISTICHE SESSIONE:
    ━━━━━━━━━━━━━━━━━━━━━
    Partite: ${stats.gamesPlayed}
    Vinte da Te: ${stats.gamesWonByMe}
    Vinte da Joker: ${stats.gamesWonByJoker}
    Vinte dai Soci: ${stats.gamesWonByAllies}
    ━━━━━━━━━━━━━━━━━━━━━
    Win Rate: ${getWinRate()}%
    Punti Medi: ${getAveragePointsPerGame()}
    ━━━━━━━━━━━━━━━━━━━━━
    Volte Joker: ${stats.handsStartedAsJoker}
    Volte Socio: ${stats.handsStartedAsAlly}
  `;

  console.log(summary);
  return summary;
}

/**
 * Esporta stats come JSON
 */
function exportStats() {
  const data = {
    sessionStats: STATS.currentSession,
    timestamp: new Date().toISOString(),
    aiDifficulty: AI_DIFFICULTY
  };
  
  const json = JSON.stringify(data, null, 2);
  console.log("📊 Stats JSON:", json);
  return json;
}
