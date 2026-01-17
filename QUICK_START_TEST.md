# 🎮 QUICK START - TEST & PLAY

## Apri il Gioco
```
1. Vai alla cartella: e:\Documenti Simo\Progetti\nuovo joker mod
2. Apri: index.html nel browser
3. Premi: "Avvia Partita"
4. Gioca! 🎯
```

---

## Test Rapido Regolamento (F12 Console)

### Copia & Incolla in Console:

```javascript
// Verifica setup iniziale
GAME_STATE.deck.length;        // Deve essere 36
GAME_STATE.hands.me.length;    // Deve essere 3

// Verifica punti (max 120)
calculateSingleGameScores();   // Vedi totalizzazione

// Verifica Joker tardivo
GAME_STATE.jokerPlayer;        // Chi è Joker?
GAME_STATE.tricksWon[GAME_STATE.jokerPlayer].length; // Prese prima di Joker

// Verifica seme facoltativo
// → Ora puoi giocare qualsiasi carta! (FIXED)
```

---

## Test Modalita' IA

### Cambia difficoltà (in Console):
```javascript
// Easy (regolistica)
window.AI_DIFFICULTY = "intermediate";

// Medium (intelligente) ⭐
window.AI_DIFFICULTY = "hard";

// Hard (memoria + perfect play)
window.AI_DIFFICULTY = "expert";

// Applica
startSingleGame();
```

### Osserva Comportamento
```
JOKER MODE:
- Aggressivo per i punti
- Non spreca briscole su prese vuote
- Prende con carta minima

ALLY MODE:
- Protegge il compagno
- Prova a strapparla al Joker
- Scarica quando conviene

NEUTRAL MODE:
- Prudente, no briscola primo
- Protegge carte importanti
- Calcola valore prese
```

---

## Testing Completo (F12 Console)

### Copia questo blocco:

```javascript
console.log("=== QUICK TEST ALL ===");

// 1. Setup
console.log("Carte mazzo:", GAME_STATE.deck.length);
console.log("Mano me:", GAME_STATE.hands.me.length);
console.log("Mano ai1:", GAME_STATE.hands.ai1.length);
console.log("Mano ai2:", GAME_STATE.hands.ai2.length);

// 2. Punti
const scores = calculateSingleGameScores();
console.log("Punti - Me:", scores.me, "AI1:", scores.ai1, "AI2:", scores.ai2);
console.log("Total:", scores.me + scores.ai1 + scores.ai2);

// 3. Joker
console.log("Joker:", GAME_STATE.jokerPlayer);

// 4. Match
console.log("Match - Me:", GAME_STATE.matchScore.me);
console.log("Match - AI1:", GAME_STATE.matchScore.ai1);
console.log("Match - AI2:", GAME_STATE.matchScore.ai2);

// 5. AI
console.log("AI Difficulty:", window.AI_DIFFICULTY);
console.log("AI Memory size:", JSON.stringify(window.AI_MEMORY || {}).length, "bytes");

// 6. Statistiche
displaySessionStats();
```

---

## Verifica Specifiche

### Regola Seme Facoltativo
```
PRIMA (v1.0): ❌ Era obbligatorio seguire il seme
DOPO (v2.1): ✅ Puoi giocare qualsiasi carta

Test:
1. Gioca una mano
2. Se il primo gioca una carta, puoi giocare qualsiasi carta
3. Non vedi più il messaggio "Devi seguire il seme!"
```

### Regola Joker Tardivo
```
Scenario: Diventi Joker alla 12° mano

Test:
1. Gioca le prime 11 mani normalmente
2. Accumula punti come giocatore normale
3. Diventa Joker quando giochi una briscola
4. Verifica in console: i punti accumulati rimangono!
   → const scores = calculateSingleGameScores();
   → Tutti i tuoi punti sono ancora lì ✅
```

### Soglie Punti
```
Test:
1. Gioca finché il Joker non raggiunge 51 punti
2. Vedi "Joker vince!" ✅
3. Oppure gli Alleati raggiungono 71 punti combinati
4. Vedi "Alleati vincono!" ✅
```

### Punti Match
```
Joker vince una partita singola:
→ Match score +2 ✅

Alleati vincono una partita singola:
→ Ogni alleato +1 (totale +2 team) ✅

Partita nulla:
→ Nessuno guadagna punti ✅
```

---

## Statistiche di Gioco (F12 Console)

### Visualizza Statistiche
```javascript
// Mostra statistiche complete
displaySessionStats();

// Esporta in JSON
exportStats();

// Verifica validator
validateGameState();
validateScores();
```

---

## Troubleshooting

### Problema: "IA prende troppo facilmente"
**Soluzione**: Probabilmente sei in INTERMEDIATE
```javascript
window.AI_DIFFICULTY = "hard";
startSingleGame();
```

### Problema: "Non riesco a giocare una carta che voglio"
**Soluzione**: Probabilmente non è il tuo turno
- Aspetta il turno precedente completo
- Guarda chi è il `GAME_STATE.currentPlayer`

### Problema: "Punti non sono corretti"
```javascript
// Verifica veloce
const scores = calculateSingleGameScores();
console.log(scores);
console.log("Total:", scores.me + scores.ai1 + scores.ai2); // Deve essere ≤120
```

### Problema: "Non trovo come cambiare difficoltà IA"
```javascript
// In Console (F12):
window.AI_DIFFICULTY = "hard";
startSingleGame();
```

---

## Divertiti! 🎮

Il gioco è pronto e corretto. Tutte le regole sono rispettate:
- ✅ 39 carte
- ✅ 13 mani per partita
- ✅ Joker = primo a giocare briscola
- ✅ Seme facoltativo
- ✅ Soglie: 51 Joker, 71 Alleati
- ✅ Punti Match: +2/-1
- ✅ IA intelligente (3 modalità)

**Buon gioco!** 🎉
