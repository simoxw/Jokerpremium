# 🃏 JOKER BRISCOLA - Gioco di Carte Premium

Un'implementazione moderna e **premium** della Briscola con 3 giocatori (Tu vs 2 IA) realizzata con **JavaScript puro**, **CSS3 animations** e **sistema audio minimalista**.

## 🎮 FEATURES

### Gameplay
- ✅ **3 Giocatori**: Tu vs IA1 e IA2
- ✅ **Sistema Joker**: Il giocatore che cala Briscola diventa "Joker" e gioca contro i 2 "Soci"
- ✅ **Regole Briscola Complete**: Seme di mano, Briscola, ordine carte
- ✅ **AI Intelligente**: 2 livelli (Intermediate & Hard)
- ✅ **Punteggio Realistico**: Joker vince con 51+, Soci con 71+
- ✅ **Partite Multiple**: Accumula punti partita (target 10)

### Premium Experience
- 🎨 **Animazioni Fluide**: Carte, prese, transizioni
- 🔊 **Audio Minimalista**: 4 suoni essenziali
- 📊 **Statistiche Sessione**: Win rate, punti medi, ruoli
- 🔔 **Toast Notifications**: Feedback visivo non-bloccante
- ✅ **Validazione Robusta**: Previene mosse illegali
- ⚙️ **Configurazione Flessibile**: Preset e opzioni custom

### UI/UX
- 📱 **Responsive Design**: Mobile, tablet, desktop
- 🌙 **Dark Theme Premium**: Verde tavolo realistico
- ♿ **Accessibilità**: Focus states, keyboard nav
- 💫 **Polish**: Hover effects, smooth transitions
- 📈 **Real-time Score**: Punteggi mano e partita

## 🚀 QUICK START

### 1. Apri il gioco
```bash
# Apri direttamente in browser
open index.html

# O usa un server locale
python -m http.server 8000
# Visita http://localhost:8000
```

### 2. Gioca
1. **Clicca una carta** dalla tua mano
2. **IA gioca automaticamente**
3. **Chi vince** la presa raccoglie le carte
4. **Clicca "Prossima Mano"** dopo la presa

### 3. Vedi statistiche
```javascript
// In console (F12)
displaySessionStats()   // Mostra statistiche sessione
exportStats()           // Export JSON
```

## 📁 STRUTTURA PROGETTO

```
nuovo joker mod/
├── index.html                 # Pagina principale
├── css/
│   └── style.css             # Stili + animazioni
├── js/
│   ├── config.js             # Config base (semi, carte)
│   ├── config-premium.js     # Config premium + preset
│   ├── state.js              # Stato globale gioco
│   ├── deck.js               # Logica mazzo
│   ├── turn.js               # Gestione turni
│   ├── scoring.js            # Calcolo punteggi
│   ├── validation.js         # Validazione mosse ⭐
│   ├── animations.js         # Sistema animazioni ⭐
│   ├── audio.js              # Sistema audio ⭐
│   ├── notifications.js      # Toast notifications ⭐
│   ├── stats.js              # Statistiche ⭐
│   ├── ai.js                 # IA intermediate & hard
│   ├── ui.js                 # Rendering UI
│   ├── preload.js            # Preload immagini
│   └── game.js               # Motore principale
├── assets/
│   └── cards/
│       ├── foglia/           # Semi carte
│       ├── onda/
│       ├── roccia/
│       └── stella/
├── CHANGELOG.md              # Versioni e feature
├── PREMIUM_UPDATES.md        # Guida migliorie
└── README.md                 # Questo file
```

**⭐ = Nuovo nella v2.0 Premium**

## ⚙️ CONFIGURAZIONE

### Preset Veloci

```javascript
// Accedi alla console (F12) e digita:

applyPreset("Fully Premium")   // Audio + animazioni + stats
applyPreset("Silent Mode")     // Solo animazioni, niente suoni
applyPreset("Performance Mode") // Minimo: solo core gameplay
applyPreset("Casual")          // Rilassato con tempi lunghi
```

### Customizzazione Manuale

```javascript
// Audio
AUDIO_SYSTEM.enabled = false;  // Disabilita audio
setAudioVolume(0.5);           // 50% volume

// Animazioni (da CSS in style.css)
// Aumenta 0.4s a 0.8s per animazioni più lente

// Statistiche
console.log(STATS.currentSession);  // Vedi statistiche live
exportConfig();                      // Esporta config corrente
```

## 🎮 COMANDI UTILI

### In Consolle Browser (F12 → Console)

```javascript
// Statistiche
displaySessionStats()        // 📊 Mostra statistiche
getWinRate()                 // Percentuale vittorie
getAveragePointsPerGame()   // Punti medi

// Audio
toggleAudio()                // Accendi/spegni
setAudioVolume(0.2)         // Cambia volume (0-1)

// Config
applyPreset("Silent Mode")  // Applica preset
exportConfig()              // Esporta JSON config
resetPremiumConfig()        // Reset a default

// Debug
validateGameState()         // Controlla stato
displaySessionStats()       // Statistiche
GAME_STATE                  // Vedi stato attuale
```

## 🎨 ANIMAZIONI

Tutte le animazioni sono **30-60% visibili**:
- 0.3s: Carta selezionata, punteggi
- 0.4s: Carta al tavolo
- 0.5s: Risoluzione presa
- 0.6s: Briscola reveal

Disabilita in CSS aggiungendo `animation: none` se necessario.

## 🔊 AUDIO

4 suoni essenziali (WAV minimali):
- 🎯 **card-play**: Quando giochi carta
- 🎉 **card-win**: Vinci presa
- 🔄 **card-flip**: Rivelazione Joker
- 📢 **hand-end**: Fine partita

**Volume default**: 0.3 (non invasivo)  
**Toggle**: F12 → `toggleAudio()`

## ✅ VALIDAZIONE

Il gioco **previene mosse illegali**:
- ❌ Giocare carta non in mano
- ❌ Giocare fuori turno
- ❌ Non seguire seme quando devi
- ❌ Stato gioco corrotto → auto-recovery

## 📊 STATISTICHE

Traccia automaticamente:
- 📈 Partite giocate / Vinte
- 🏆 Win rate %
- 📉 Punti medi per partita
- 👤 Volte come Joker vs Socio
- 📋 Storico mani con risultati

Visibile con `displaySessionStats()`

## 🎯 DIFFERENZE TRA LIVELLI IA

### Intermediate (🟡)
- Segue seme se può
- Taglia solo se conviene
- Non spreca briscole alte su prese vuote
- Ottimo per principianti

### Hard (🔴)
- Analizza tutti i scenari
- Valuta rischio/beneficio
- Taglia intelligentemente
- Ricorda carte giocate
- Ideale per sfida

## 📱 MOBILE

- ✅ Responsive design
- ✅ Touch-friendly
- ✅ Landscape & portrait
- ⚠️ Audio disabilitato automaticamente on mobile (personalizzabile)

## 🐛 TROUBLESHOOTING

### Gioco non parte
```javascript
// In console:
validateGameState()
recoverFromCorruptedState()
startMatch()
```

### Audio non funziona
- Browser richiede user interaction
- Clicca una carta per trigger audio
- Verifica: `AUDIO_SYSTEM.enabled`

### Statistiche non salvate
- Usa LocalStorage (non implementato in v2.0)
- Export manuale: `exportStats()`

### Animazioni stuttering
- Disabilita altre tab
- Riduci qualità schermo
- Usa "Performance Mode" preset

## 📖 DOCUMENTAZIONE COMPLETA

- **[PREMIUM_UPDATES.md](PREMIUM_UPDATES.md)** - Guida dettagliata migliorie
- **[CHANGELOG.md](CHANGELOG.md)** - Versioni e history
- **[config-premium.js](js/config-premium.js)** - Configurazione con commenti

## 🎓 IMPARARE

Il codice è **ben commentato** per imparare:
- Gestione stato con vanilla JS
- AI con logica strategica
- Animazioni CSS3 + timing
- Sistema audio robusto
- Validazione e error handling

Perfetto per **portfolio** o **learning**.

## 🔄 VERSIONI

| Versione | Data | Feature |
|----------|------|---------|
| v2.0 | 17 Gen 2026 | ✨ Premium: Animazioni, Audio, Stats |
| v1.0 | Prima | Core gameplay |

## 📄 CREDITI

**Creatore**: Simo  
**Ispirazioni**: PokerStars, Magic Arena, Solitaire  
**Stack**: HTML5 + CSS3 + Vanilla JS (0 dipendenze)

## 🤝 CONTRIBUTI

Suggerimenti e bug reports benvenuti!

## 📞 CONTATTI

Vedi `PREMIUM_UPDATES.md` per support.

---

**Pronto a giocare?** 👉 Apri `index.html` nel browser!

**Versione**: 2.0 Premium  
**Status**: ✅ Stabile e pronto per produzione  
**Browser**: Chrome, Firefox, Safari, Edge (moderni)
