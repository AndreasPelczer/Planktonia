// ============================================
// GURKISTAN – DAS SPIEL
// ViewModel: Spiellogik, Rundenablauf
// ============================================

class GameViewModel {

    constructor() {
        this.state = new GameState();
        this.currentEvent = null;
        this.observers = [];
        this.yearSummary = '';
    }

    subscribe(o) { this.observers.push(o); }

    notify() { this.observers.forEach(o => o.update(this.getViewState())); }

    getViewState() {
        return {
            year: this.state.year,
            gurken: this.state.gurken,
            steckdosen: this.state.steckdosen,
            geldscheine: this.state.geldscheine,
            zufriedenheit: this.state.zufriedenheit,
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
        this.addLog('20 Gurken-Bürger. 5 Steckdosenleisten. 10 zerschnittene Geldscheine.', 'neutral');
        this.addLog('6m². Unendliche Möglichkeiten. Du bist der Pla\'khuun.', 'neutral');
        this.addLog('Regiere 25 Jahre — oder geh unter.', 'neutral');
        this.startYear();
    }

    // ============================================
    // JAHRESBEGINN
    // ============================================
    startYear() {
        this.state.phase = 'event';
        this.state.log = [];
        this.yearSummary = '';

        // --- Produktion ---
        const p = this.calcProduction();

        this.state.gurken += p.netGurken;
        this.state.steckdosen += p.steckdosenGain;
        this.state.geldscheine += p.geldscheineGain;
        this.state.zufriedenheit += p.zufriedenheitChange;
        this.state.buerger += p.migration;

        this.clampAll();

        // Bericht
        this.addLog('═══ JAHRESBERICHT ═══', 'neutral');

        const sign = (n) => n >= 0 ? '+' + n : '' + n;
        this.addLog(`Gurken: Ernte ${p.produced} − Verbrauch ${p.consumed} = ${sign(p.netGurken)} 🥒`, p.netGurken >= 0 ? 'good' : 'bad');
        this.addLog(`Steckdosia liefert: ${sign(p.steckdosenGain)} 🔌`, 'good');
        this.addLog(`Handel in Skatinga: ${sign(p.geldscheineGain)} 💸`, p.geldscheineGain > 0 ? 'good' : 'neutral');
        this.addLog(`Stimmung: ${sign(p.zufriedenheitChange)} 😊`, p.zufriedenheitChange >= 0 ? 'good' : 'bad');

        if (p.migration !== 0) {
            if (p.migration > 0) {
                this.addLog(`${p.migration} Gurke(n) wandern ein! 🎉`, 'good');
            } else {
                this.addLog(`${Math.abs(p.migration)} Gurke(n) wandern nach Deutschland... 😔`, 'bad');
            }
        }

        // Gebäude-Boni
        const bonus = this.calcBuildingBonus();
        if (bonus.gurken) { this.state.gurken += bonus.gurken; this.addLog(`Gurkenfarm: +${bonus.gurken} 🥒`, 'good'); }
        if (bonus.steckdosen) { this.state.steckdosen += bonus.steckdosen; this.addLog(`Kraftwerk: +${bonus.steckdosen} 🔌`, 'good'); }
        if (bonus.geldscheine) { this.state.geldscheine += bonus.geldscheine; this.addLog(`Handelsposten: +${bonus.geldscheine} 💸`, 'good'); }
        if (bonus.zufriedenheit) { this.state.zufriedenheit += bonus.zufriedenheit; this.addLog(`Kurhaus: +${bonus.zufriedenheit} 😊`, 'good'); }

        this.clampAll();

        // Game-Over?
        if (this.checkGameOver()) { this.notify(); return; }

        // Sieg?
        if (this.state.year > CONFIG.VICTORY_YEAR) {
            this.state.phase = 'victory';
            this.state.victory = true;
            this.notify();
            return;
        }

        this.addLog('', 'neutral');
        this.pickEvent();
        this.notify();
    }

    // ============================================
    // PRODUKTION
    // ============================================
    calcProduction() {
        const b = this.state.buerger;
        const produced = Math.round(b * CONFIG.GURKEN_PER_BUERGER);
        const consumed = Math.round(b * CONFIG.VERBRAUCH_PER_BUERGER);
        const netGurken = produced - consumed;

        // Steckdosen: Basis von Steckdosia
        const steckdosenGain = CONFIG.STECKDOSEN_BASE;

        // Geldscheine: Handel
        const geldscheineGain = Math.floor(b / 4) * CONFIG.GELDSCHEINE_PER_4_BUERGER;

        // Zufriedenheit
        let zufriedenheitChange = -CONFIG.ZUFRIEDENHEIT_DECAY;
        // Wohlstands-Bonus
        zufriedenheitChange += Math.floor(this.state.geldscheine / 8);
        // Steckdosen-Bonus (Komfort)
        if (this.state.steckdosen >= 5) zufriedenheitChange += 1;

        // Schwierigkeit steigt
        if (this.state.year >= 8) zufriedenheitChange -= 1;
        if (this.state.year >= 15) zufriedenheitChange -= 1;
        if (this.state.year >= 22) zufriedenheitChange -= 1;

        // Migration
        let migration = 0;
        const z = this.state.zufriedenheit;
        if (z >= CONFIG.VERY_HAPPY) migration = 2;
        else if (z >= CONFIG.HAPPY_THRESHOLD) migration = 1;
        else if (z <= CONFIG.VERY_UNHAPPY) migration = -3;
        else if (z <= CONFIG.UNHAPPY_THRESHOLD) migration = -1;

        return { produced, consumed, netGurken, steckdosenGain, geldscheineGain, zufriedenheitChange, migration };
    }

    // ============================================
    // GEBÄUDE-BONI
    // ============================================
    calcBuildingBonus() {
        const bonus = { gurken: 0, steckdosen: 0, geldscheine: 0, zufriedenheit: 0 };
        const fx = this.state.statusEffects;

        if (fx.find(e => e.id === 'farm')) bonus.gurken += 8;
        if (fx.find(e => e.id === 'kraftwerk')) bonus.steckdosen += 2;
        if (fx.find(e => e.id === 'handelsposten')) bonus.geldscheine += 5;
        if (fx.find(e => e.id === 'kurhaus')) bonus.zufriedenheit += 5;
        if (fx.find(e => e.id === 'steuern')) bonus.geldscheine += Math.floor(this.state.buerger * 0.4);
        if (fx.find(e => e.id === 'gaerten')) bonus.gurken += 3;
        if (fx.find(e => e.id === 'forschung')) bonus.geldscheine += 2;

        return bonus;
    }

    // ============================================
    // EVENT
    // ============================================
    pickEvent() {
        let available = EVENTS.filter(e => {
            if (e.unique && this.state.usedEvents.includes(e.id)) return false;
            if (e.condition && !e.condition(this.state)) return false;
            return true;
        });

        if (available.length === 0) {
            available = EVENTS.filter(e => !e.unique);
        }

        const totalWeight = available.reduce((sum, e) => sum + (e.weight || 1), 0);
        let roll = Math.random() * totalWeight;

        for (const event of available) {
            roll -= (event.weight || 1);
            if (roll <= 0) { this.currentEvent = event; break; }
        }
        if (!this.currentEvent) this.currentEvent = available[0];

        this.addLog(this.currentEvent.text, 'neutral');
    }

    // ============================================
    // WAHL
    // ============================================
    handleChoice(idx) {
        if (!this.currentEvent || this.state.phase !== 'event') return;
        const choice = this.currentEvent.choices[idx];
        if (!choice) return;

        const eff = choice.effects || {};
        const before = {
            gurken: this.state.gurken,
            steckdosen: this.state.steckdosen,
            geldscheine: this.state.geldscheine,
            zufriedenheit: this.state.zufriedenheit,
            buerger: this.state.buerger,
        };

        // Festung reduziert negative Effekte
        const hasFestung = this.state.statusEffects.find(e => e.id === 'festung');
        const applyMod = (val) => {
            if (hasFestung && val < 0) return Math.ceil(val * 0.7); // 30% weniger Schaden
            return val;
        };

        this.state.gurken += applyMod(eff.gurken || 0);
        this.state.steckdosen += applyMod(eff.steckdosen || 0);
        this.state.geldscheine += applyMod(eff.geldscheine || 0);
        this.state.zufriedenheit += applyMod(eff.zufriedenheit || 0);
        this.state.buerger += applyMod(eff.buerger || 0);

        this.clampAll();

        if (eff.statusAdd) {
            if (!this.state.statusEffects.find(e => e.id === eff.statusAdd.id)) {
                this.state.statusEffects.push(eff.statusAdd);
            }
        }
        if (eff.statusRemove) {
            this.state.statusEffects = this.state.statusEffects.filter(e => e.id !== eff.statusRemove);
        }
        if (eff.flag) Object.assign(this.state.flags, eff.flag);

        // Build-Flags
        const buildMap = {
            build_farm: 'farm_built',
            build_handelsposten: 'handelsposten_built',
            build_kurhaus: 'kurhaus_built',
            build_festung: 'festung_built',
            build_kraftwerk: 'kraftwerk_built',
        };
        if (buildMap[this.currentEvent.id] && eff.statusAdd) {
            this.state.flags[buildMap[this.currentEvent.id]] = true;
        }

        if (this.currentEvent.unique) {
            this.state.usedEvents.push(this.currentEvent.id);
        }

        // Ergebnis
        this.addLog('', 'neutral');
        this.addLog(choice.result, 'neutral');

        // Diff
        const changes = [];
        const diff = (key, emoji) => {
            const d = this.state[key] - before[key];
            if (d !== 0) changes.push(`${d > 0 ? '+' : ''}${d} ${emoji}`);
        };
        diff('gurken', '🥒');
        diff('steckdosen', '🔌');
        diff('geldscheine', '💸');
        diff('zufriedenheit', '😊');
        diff('buerger', '👥');

        if (changes.length) {
            this.addLog(`[${changes.join(' | ')}]`, changes.some(c => c.startsWith('-')) ? 'bad' : 'good');
        }

        this.yearSummary = this.buildSummary();
        this.state.phase = 'result';
        this.currentEvent = null;
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
    // GAME OVER
    // ============================================
    checkGameOver() {
        let reason = '';
        if (this.state.gurken <= 0)
            reason = 'Die Gurken sind aus. Ohne Gurken kein Gurkistan. So einfach ist Geopolitik.';
        else if (this.state.buerger <= 0)
            reason = 'Alle ausgewandert. Nach Deutschland. Gurkistan ist jetzt ein leeres Zimmer.';
        else if (this.state.zufriedenheit <= 0)
            reason = 'REVOLUTION! Du wirst in den Kühlschrank verbannt. (Todesstrafe in Gurkenmaßstäben.)';

        if (reason) {
            this.state.gameOver = true;
            this.state.gameOverReason = reason;
            this.state.phase = 'gameover';
            return true;
        }
        return false;
    }

    // ============================================
    // ZUSAMMENFASSUNG
    // ============================================
    buildSummary() {
        const s = this.state;
        const parts = [];

        if (s.gurken > 120) parts.push('Gurkenkasse quillt über!');
        else if (s.gurken > 60) parts.push('Solide Vorräte.');
        else if (s.gurken > 25) parts.push('Gurken werden knapp...');
        else parts.push('GURKEN-KRISE!');

        if (s.steckdosen > 8) parts.push('Energie im Überfluss.');
        else if (s.steckdosen >= 3) parts.push('Strom fließt.');
        else parts.push('Steckdosen-Notstand!');

        if (s.zufriedenheit > 70) parts.push('Das Volk liebt dich!');
        else if (s.zufriedenheit > 35) parts.push('Stimmung: okay.');
        else parts.push('Revolution droht!');

        if (s.buerger > 25) parts.push('Gurkistan wächst!');
        else if (s.buerger > 12) parts.push(s.buerger + ' Bürger.');
        else parts.push('Nation schrumpft...');

        return parts.join(' ');
    }

    // ============================================
    // NEUSTART
    // ============================================
    restart() {
        this.state = new GameState();
        this.currentEvent = null;
        this.yearSummary = '';
        this.startGame();
    }

    // ============================================
    // HELPERS
    // ============================================
    clampAll() {
        this.state.zufriedenheit = clamp(this.state.zufriedenheit, 0, CONFIG.MAX_ZUFRIEDENHEIT);
        this.state.steckdosen = Math.max(0, this.state.steckdosen);
        this.state.geldscheine = Math.max(0, this.state.geldscheine);
        this.state.buerger = Math.max(0, this.state.buerger);
    }

    addLog(text, type) {
        this.state.log.push({ text, type: type || 'neutral' });
    }
}
