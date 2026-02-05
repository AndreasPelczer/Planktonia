// ============================================
// GURKISTAN – DAS SPIEL
// ViewModel: Spiellogik, Rundenablauf
// ============================================

class GameViewModel {

    constructor() {
        this.state = new GameState();
        this.currentEvent = null;
        this.observers = [];
        this.yearSummary = null;
    }

    // --- Observer Pattern ---
    subscribe(observer) {
        this.observers.push(observer);
    }

    notify() {
        const viewState = this.getViewState();
        this.observers.forEach(o => o.update(viewState));
    }

    getViewState() {
        return {
            year: this.state.year,
            gurken: this.state.gurken,
            zufriedenheit: this.state.zufriedenheit,
            memes: this.state.memes,
            buerger: this.state.buerger,
            phase: this.state.phase,
            log: this.state.log,
            choices: this.currentEvent ? this.currentEvent.choices : [],
            statusEffects: this.state.statusEffects,
            gameOver: this.state.gameOver,
            gameOverReason: this.state.gameOverReason,
            victory: this.state.victory,
            yearSummary: this.yearSummary,
        };
    }

    // ============================================
    // SPIELSTART
    // ============================================
    startGame() {
        this.state.log = [];
        this.addLog('🥒 Die Republik Gurkistan erwacht.', 'neutral');
        this.addLog('20 tapfere Gurken. 6m². Unendliche Möglichkeiten.', 'neutral');
        this.addLog('Du bist der Pla\'khuun. Regiere 25 Jahre. Oder stirb. (Politisch.)', 'neutral');
        this.startYear();
    }

    // ============================================
    // JAHRESBEGINN
    // ============================================
    startYear() {
        this.state.phase = 'event';
        this.state.log = [];
        this.yearSummary = null;

        // --- Produktion berechnen ---
        const production = this.calculateProduction();

        // Produktion anwenden
        this.state.gurken += production.netGurken;
        this.state.zufriedenheit += production.zufriedenheitChange;
        this.state.memes += production.memesProduced;
        this.state.buerger += production.migration;

        // Clampen
        this.state.zufriedenheit = clamp(this.state.zufriedenheit, 0, CONFIG.MAX_ZUFRIEDENHEIT);
        this.state.memes = Math.max(0, this.state.memes);
        this.state.buerger = Math.max(0, this.state.buerger);

        // Bericht anzeigen
        this.addLog('═══ JAHRESBERICHT ═══', 'neutral');

        const netSign = production.netGurken >= 0 ? '+' : '';
        this.addLog(
            `Ernte: ${production.produced} 🥒  Verbrauch: ${production.consumed} 🥒  Netto: ${netSign}${production.netGurken} 🥒`,
            production.netGurken >= 0 ? 'good' : 'bad'
        );

        if (production.memesProduced > 0) {
            this.addLog(`Meme-Produktion: +${production.memesProduced} 📜`, 'good');
        }

        if (production.zufriedenheitChange !== 0) {
            const decaySign = production.zufriedenheitChange >= 0 ? '+' : '';
            this.addLog(
                `Stimmung: ${decaySign}${production.zufriedenheitChange} 😊`,
                production.zufriedenheitChange >= 0 ? 'good' : 'bad'
            );
        }

        if (production.migration !== 0) {
            if (production.migration > 0) {
                this.addLog(`${production.migration} neue Gurke(n) wandern ein! 🎉`, 'good');
            } else {
                this.addLog(`${Math.abs(production.migration)} Gurke(n) wandern aus... 😔`, 'bad');
            }
        }

        // Bonus von Gebäuden
        const buildingBonus = this.calculateBuildingBonus();
        if (buildingBonus.gurken !== 0) {
            this.state.gurken += buildingBonus.gurken;
            this.addLog(`Gurkenfarm: +${buildingBonus.gurken} 🥒`, 'good');
        }
        if (buildingBonus.memes !== 0) {
            this.state.memes += buildingBonus.memes;
            this.addLog(`Meme-Universität: +${buildingBonus.memes} 📜`, 'good');
        }
        if (buildingBonus.zufriedenheit !== 0) {
            this.state.zufriedenheit += buildingBonus.zufriedenheit;
            this.state.zufriedenheit = clamp(this.state.zufriedenheit, 0, CONFIG.MAX_ZUFRIEDENHEIT);
            this.addLog(`Kurhaus: +${buildingBonus.zufriedenheit} 😊`, 'good');
        }

        // Game-Over prüfen (VOR dem Event)
        if (this.checkGameOver()) {
            this.notify();
            return;
        }

        // Sieg prüfen
        if (this.state.year > CONFIG.VICTORY_YEAR) {
            this.state.phase = 'victory';
            this.state.victory = true;
            this.notify();
            return;
        }

        this.addLog('', 'neutral');

        // Event auswählen und anzeigen
        this.pickEvent();
        this.notify();
    }

    // ============================================
    // PRODUKTION
    // ============================================
    calculateProduction() {
        const buerger = this.state.buerger;
        const produced = Math.round(buerger * CONFIG.GURKEN_PER_BUERGER);
        const consumed = Math.round(buerger * CONFIG.VERBRAUCH_PER_BUERGER);
        const netGurken = produced - consumed;

        // Zufriedenheit zerfällt
        let zufriedenheitChange = -CONFIG.ZUFRIEDENHEIT_DECAY;
        // Memes helfen ein bisschen
        const memeBonus = Math.floor(this.state.memes / 10);
        zufriedenheitChange += memeBonus;

        // Meme-Produktion
        const memesProduced = Math.floor(buerger / 5) * CONFIG.MEMES_PER_5_BUERGER;

        // Migration
        let migration = 0;
        const z = this.state.zufriedenheit;
        if (z >= CONFIG.VERY_HAPPY) {
            migration = 2;
        } else if (z >= CONFIG.HAPPY_THRESHOLD) {
            migration = 1;
        } else if (z <= CONFIG.VERY_UNHAPPY) {
            migration = -2;
        } else if (z <= CONFIG.UNHAPPY_THRESHOLD) {
            migration = -1;
        }

        // Schwierigkeit steigt: ab Jahr 10 mehr Verfall
        if (this.state.year >= 10) {
            zufriedenheitChange -= 1;
        }
        if (this.state.year >= 18) {
            zufriedenheitChange -= 1;
        }

        return { produced, consumed, netGurken, zufriedenheitChange, memesProduced, migration };
    }

    // ============================================
    // GEBÄUDE-BONI
    // ============================================
    calculateBuildingBonus() {
        const bonus = { gurken: 0, memes: 0, zufriedenheit: 0 };
        const effects = this.state.statusEffects;

        if (effects.find(e => e.id === 'farm')) bonus.gurken += 8;
        if (effects.find(e => e.id === 'uni')) bonus.memes += 5;
        if (effects.find(e => e.id === 'kurhaus')) bonus.zufriedenheit += 5;
        if (effects.find(e => e.id === 'gaerten')) bonus.gurken += 3;
        if (effects.find(e => e.id === 'steuern')) bonus.gurken += Math.floor(this.state.buerger * 0.5);

        return bonus;
    }

    // ============================================
    // EVENT AUSWAHL
    // ============================================
    pickEvent() {
        // Verfügbare Events filtern
        let available = EVENTS.filter(e => {
            // Unique Events nur einmal
            if (e.unique && this.state.usedEvents.includes(e.id)) return false;
            // Condition prüfen
            if (e.condition && !e.condition(this.state)) return false;
            return true;
        });

        if (available.length === 0) {
            // Fallback: alle nicht-unique Events
            available = EVENTS.filter(e => !e.unique);
        }

        // Gewichtete Zufallsauswahl
        const totalWeight = available.reduce((sum, e) => sum + (e.weight || 1), 0);
        let roll = Math.random() * totalWeight;

        for (const event of available) {
            roll -= (event.weight || 1);
            if (roll <= 0) {
                this.currentEvent = event;
                break;
            }
        }

        // Fallback
        if (!this.currentEvent) {
            this.currentEvent = available[0];
        }

        // Event-Text anzeigen
        this.addLog(this.currentEvent.text, 'neutral');
    }

    // ============================================
    // SPIELER-WAHL VERARBEITEN
    // ============================================
    handleChoice(choiceIndex) {
        if (!this.currentEvent || this.state.phase !== 'event') return;

        const choice = this.currentEvent.choices[choiceIndex];
        if (!choice) return;

        const effects = choice.effects || {};

        // Vorherigen Zustand merken für Anzeige
        const before = {
            gurken: this.state.gurken,
            zufriedenheit: this.state.zufriedenheit,
            memes: this.state.memes,
            buerger: this.state.buerger,
        };

        // Effekte anwenden
        this.state.gurken += (effects.gurken || 0);
        this.state.zufriedenheit += (effects.zufriedenheit || 0);
        this.state.memes += (effects.memes || 0);
        this.state.buerger += (effects.buerger || 0);

        // Clampen
        this.state.zufriedenheit = clamp(this.state.zufriedenheit, 0, CONFIG.MAX_ZUFRIEDENHEIT);
        this.state.memes = Math.max(0, this.state.memes);
        this.state.buerger = Math.max(0, this.state.buerger);
        // Gurken dürfen unter 0 fallen → Game Over

        // Status-Effekte hinzufügen
        if (effects.statusAdd) {
            const existing = this.state.statusEffects.find(e => e.id === effects.statusAdd.id);
            if (!existing) {
                this.state.statusEffects.push(effects.statusAdd);
            }
        }

        // Status-Effekte entfernen
        if (effects.statusRemove) {
            this.state.statusEffects = this.state.statusEffects.filter(
                e => e.id !== effects.statusRemove
            );
        }

        // Flags setzen
        if (effects.flag) {
            Object.assign(this.state.flags, effects.flag);
        }

        // Build-Flags setzen
        if (this.currentEvent.id === 'build_farm' && effects.gurken < 0) {
            this.state.flags.farm_built = true;
        }
        if (this.currentEvent.id === 'build_akademie' && effects.gurken < 0) {
            this.state.flags.uni_built = true;
        }
        if (this.currentEvent.id === 'build_kurhaus' && effects.gurken < 0) {
            this.state.flags.kurhaus_built = true;
        }
        if (this.currentEvent.id === 'build_festung' && effects.gurken < 0) {
            this.state.flags.festung_built = true;
        }

        // Unique-Event merken
        if (this.currentEvent.unique) {
            this.state.usedEvents.push(this.currentEvent.id);
        }

        // Ergebnis anzeigen
        this.addLog('', 'neutral');
        this.addLog(choice.result, 'neutral');

        // Effekte-Zusammenfassung
        const changes = [];
        const diff = (key, emoji) => {
            const d = this.state[key] - before[key];
            if (d !== 0) {
                changes.push(`${d > 0 ? '+' : ''}${d} ${emoji}`);
            }
        };
        diff('gurken', '🥒');
        diff('zufriedenheit', '😊');
        diff('memes', '📜');
        diff('buerger', '👥');

        if (changes.length > 0) {
            this.addLog(`[${changes.join(' | ')}]`, changes.some(c => c.startsWith('-')) ? 'bad' : 'good');
        }

        // Jahres-Summary für Transition
        this.yearSummary = this.buildYearSummary();

        // Phase wechseln
        this.state.phase = 'result';
        this.currentEvent = null;

        // Game-Over prüfen
        this.checkGameOver();

        this.notify();
    }

    // ============================================
    // NÄCHSTES JAHR
    // ============================================
    nextYear() {
        if (this.state.phase !== 'result') return;
        if (this.state.gameOver || this.state.victory) return;

        this.state.year++;
        this.startYear();
    }

    // ============================================
    // GAME OVER CHECK
    // ============================================
    checkGameOver() {
        let reason = '';

        if (this.state.gurken <= 0) {
            reason = 'Die Gurken sind ausgegangen. Ohne Gurken kein Gurkistan. So einfach ist Geopolitik.';
        } else if (this.state.buerger <= 0) {
            reason = 'Alle Bürger sind ausgewandert. Nach Deutschland. Gurkistan ist jetzt ein leeres Zimmer. Also... ein Zimmer.';
        } else if (this.state.zufriedenheit <= 0) {
            reason = 'REVOLUTION! Die Gurken haben dich gestürzt, Pla\'khuun! Du wirst feierlich in den Kühlschrank verbannt. (Das ist die Todesstrafe in Gurkenmaßstäben.)';
        }

        if (reason) {
            this.state.gameOver = true;
            this.state.gameOverReason = reason;
            this.state.phase = 'gameover';
            return true;
        }
        return false;
    }

    // ============================================
    // JAHRESZUSAMMENFASSUNG
    // ============================================
    buildYearSummary() {
        const s = this.state;
        const summaries = [];

        if (s.gurken > 120) summaries.push('Die Gurkenkasse quillt über!');
        else if (s.gurken > 60) summaries.push('Solide Vorräte.');
        else if (s.gurken > 30) summaries.push('Gurken werden knapp...');
        else summaries.push('GURKEN-KRISE!');

        if (s.zufriedenheit > 75) summaries.push('Das Volk liebt dich!');
        else if (s.zufriedenheit > 40) summaries.push('Die Stimmung ist okay.');
        else if (s.zufriedenheit > 20) summaries.push('Die Gurken meckern...');
        else summaries.push('Revolution liegt in der Luft!');

        if (s.buerger > 30) summaries.push('Gurkistan wächst!');
        else if (s.buerger > 15) summaries.push(s.buerger + ' treue Bürger.');
        else summaries.push('Die Nation schrumpft...');

        return summaries.join(' ');
    }

    // ============================================
    // NEUSTART
    // ============================================
    restart() {
        this.state = new GameState();
        this.currentEvent = null;
        this.yearSummary = null;
        this.startGame();
    }

    // ============================================
    // LOG
    // ============================================
    addLog(text, type) {
        this.state.log.push({ text, type: type || 'neutral' });
    }
}
