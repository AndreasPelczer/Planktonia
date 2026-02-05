// ============================================
// GURKISTAN – DAS SPIEL
// View: DOM-Rendering, Karten-Intermezzo, UI
// ============================================

class GameView {

    constructor(viewModel) {
        this.vm = viewModel;
        this.vm.subscribe(this);
        this.selectedLoc = null;

        // DOM-Elemente cachen
        this.els = {
            yearDisplay: document.getElementById('year-display'),
            statusBar: document.getElementById('status-bar'),
            gurken: document.getElementById('res-gurken'),
            steckdosen: document.getElementById('res-steckdosen'),
            geldscheine: document.getElementById('res-geldscheine'),
            zufriedenheit: document.getElementById('res-zufriedenheit'),
            buerger: document.getElementById('res-buerger'),
            eventLog: document.getElementById('event-log'),
            decisionButtons: document.getElementById('decision-buttons'),
            nextYear: document.getElementById('next-year'),
            game: document.getElementById('game'),
            gameOver: document.getElementById('game-over'),
            gameOverReason: document.getElementById('game-over-reason'),
            finalYears: document.getElementById('final-years'),
            victory: document.getElementById('victory'),
            // Karten-Intermezzo
            mapOverlay: document.getElementById('map-intermezzo'),
            mapTitle: document.getElementById('map-title'),
            mapSub: document.getElementById('map-sub'),
            mapInfo: document.getElementById('map-info'),
            mapInfoTitle: document.getElementById('map-info-title'),
            mapInfoType: document.getElementById('map-info-type'),
            mapInfoDesc: document.getElementById('map-info-desc'),
            mapSummary: document.getElementById('map-summary'),
            mapContinue: document.getElementById('map-continue'),
        };

        this.bindEvents();
        this.vm.startGame();
    }

    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        // "Naechstes Jahr" -> Karten-Intermezzo
        this.els.nextYear.addEventListener('click', () => {
            this.showMapIntermezzo();
        });

        // Karte: Weiter-Button
        this.els.mapContinue.addEventListener('click', () => {
            this.hideMapIntermezzo();
        });

        // Karte: Ort-Klicks
        document.querySelectorAll('.t-loc-group').forEach(group => {
            group.addEventListener('click', () => {
                const locId = group.getAttribute('data-loc');
                this.selectLocation(locId, group);
            });
        });

        // Restart-Buttons (Game Over & Victory)
        document.querySelectorAll('[data-action="restart"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.els.gameOver.classList.add('hidden');
                this.els.victory.classList.add('hidden');
                this.els.game.style.display = '';
                this.vm.restart();
            });
        });
    }

    // ============================================
    // UPDATE (vom ViewModel aufgerufen)
    // ============================================
    update(state) {
        this.updateYear(state);
        this.updateResources(state);
        this.updateStatusBar(state);
        this.updateEventLog(state);
        this.updateButtons(state);
        this.updateEndScreens(state);
    }

    // ============================================
    // JAHR
    // ============================================
    updateYear(state) {
        this.els.yearDisplay.textContent = `Jahr ${state.year} der Republik`;

        if (state.year >= 20) {
            this.els.yearDisplay.style.borderColor = '#da4';
            this.els.yearDisplay.style.color = '#da4';
        } else {
            this.els.yearDisplay.style.borderColor = '#2a5a3a';
            this.els.yearDisplay.style.color = '';
        }
    }

    // ============================================
    // RESSOURCEN (5 Stueck)
    // ============================================
    updateResources(state) {
        this.animateValue(this.els.gurken, state.gurken);
        this.animateValue(this.els.steckdosen, state.steckdosen);
        this.animateValue(this.els.geldscheine, state.geldscheine);
        this.animateValue(this.els.zufriedenheit, state.zufriedenheit);
        this.animateValue(this.els.buerger, state.buerger);

        // Farb-Klassen
        this.setResourceClass(this.els.gurken, state.gurken, 30, 15);
        this.setResourceClass(this.els.steckdosen, state.steckdosen, 3, 1);
        this.setResourceClass(this.els.geldscheine, state.geldscheine, 5, 2);
        this.setResourceClass(this.els.zufriedenheit, state.zufriedenheit, 25, 10);
        this.setResourceClass(this.els.buerger, state.buerger, 10, 5);
    }

    animateValue(el, newVal) {
        const oldVal = parseInt(el.textContent) || 0;
        if (oldVal === newVal) {
            el.textContent = newVal;
            return;
        }

        const diff = newVal - oldVal;
        const steps = Math.min(Math.abs(diff), 15);
        const stepTime = 300 / steps;
        let current = oldVal;
        const increment = diff / steps;

        const timer = setInterval(() => {
            current += increment;
            el.textContent = Math.round(current);
            if ((diff > 0 && current >= newVal) || (diff < 0 && current <= newVal)) {
                el.textContent = newVal;
                clearInterval(timer);
            }
        }, stepTime);

        // Flash-Effekt
        el.style.transform = 'scale(1.3)';
        el.style.transition = 'transform 0.3s';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
        }, 300);
    }

    setResourceClass(el, value, warnThreshold, dangerThreshold) {
        el.classList.remove('warning', 'danger');
        if (value <= dangerThreshold) {
            el.classList.add('danger');
        } else if (value <= warnThreshold) {
            el.classList.add('warning');
        }
    }

    // ============================================
    // STATUS-LEISTE
    // ============================================
    updateStatusBar(state) {
        this.els.statusBar.innerHTML = '';
        state.statusEffects.forEach(effect => {
            const item = document.createElement('span');
            item.className = `status-item ${effect.type}`;
            item.textContent = effect.label;
            this.els.statusBar.appendChild(item);
        });
    }

    // ============================================
    // EVENT LOG
    // ============================================
    updateEventLog(state) {
        this.els.eventLog.innerHTML = '';
        state.log.forEach(entry => {
            if (entry.text === '') {
                const spacer = document.createElement('div');
                spacer.style.height = '8px';
                this.els.eventLog.appendChild(spacer);
                return;
            }
            const div = document.createElement('div');
            div.className = `event ${entry.type}`;
            div.textContent = entry.text;
            this.els.eventLog.appendChild(div);
        });

        this.els.eventLog.scrollTop = this.els.eventLog.scrollHeight;
    }

    // ============================================
    // BUTTONS
    // ============================================
    updateButtons(state) {
        this.els.decisionButtons.innerHTML = '';

        if (state.phase === 'event' && state.choices.length > 0) {
            state.choices.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.addEventListener('click', () => {
                    this.vm.handleChoice(index);
                });

                if (choice.effects && choice.effects.statusAdd) {
                    btn.classList.add('primary');
                }
                if (choice.effects && choice.effects.gurken && choice.effects.gurken < -20) {
                    btn.classList.add('repair');
                }

                this.els.decisionButtons.appendChild(btn);
            });

            this.els.nextYear.style.display = 'none';

        } else if (state.phase === 'result') {
            this.els.nextYear.style.display = '';

            if (state.year >= CONFIG.VICTORY_YEAR) {
                this.els.nextYear.textContent = '🗺️ Das letzte Jahr beginnt...';
            } else if (state.year >= 20) {
                this.els.nextYear.textContent = `🗺️ Jahr ${state.year + 1} — fast geschafft!`;
            } else {
                this.els.nextYear.textContent = `🗺️ Karte ansehen & Jahr ${state.year + 1}`;
            }
        } else {
            this.els.nextYear.style.display = 'none';
        }
    }

    // ============================================
    // END-SCREENS
    // ============================================
    updateEndScreens(state) {
        if (state.gameOver) {
            this.els.game.style.display = 'none';
            this.els.gameOver.classList.remove('hidden');
            this.els.gameOverReason.textContent = state.gameOverReason;
            this.els.finalYears.textContent = state.year;
        } else if (state.victory) {
            this.els.game.style.display = 'none';
            this.els.victory.classList.remove('hidden');
            this.triggerVictoryEffects();
        }
    }

    // ============================================
    // KARTEN-INTERMEZZO
    // ============================================
    showMapIntermezzo() {
        const state = this.vm.getViewState();
        const nextYear = state.year + 1;

        // Header aktualisieren
        this.els.mapSub.textContent = `TAKTISCHE ÜBERSICHT · JAHR ${nextYear}`;

        // Info-Panel zuruecksetzen
        this.els.mapInfoTitle.textContent = 'Klicke einen Ort';
        this.els.mapInfoType.textContent = '';
        this.els.mapInfoDesc.textContent = 'Die Karte zeigt alle Siedlungen und Routen der Republik.';
        this.els.mapInfo.classList.remove('active');

        // Auswahl zuruecksetzen
        document.querySelectorAll('.t-loc-group.selected').forEach(g => {
            g.classList.remove('selected');
        });
        this.selectedLoc = null;

        // Zusammenfassung
        const summary = state.yearSummary || 'Die Republik besteht.';
        this.els.mapSummary.textContent = summary;
        this.els.mapSummary.classList.remove('good', 'bad');

        if (state.zufriedenheit > 60 && state.gurken > 60) {
            this.els.mapSummary.classList.add('good');
        } else if (state.gurken < 30 || state.zufriedenheit < 20 || state.buerger < 10) {
            this.els.mapSummary.classList.add('bad');
        }

        // Weiter-Button Text
        if (nextYear >= CONFIG.VICTORY_YEAR) {
            this.els.mapContinue.textContent = '🏆 Das letzte Jahr beginnt...';
        } else {
            this.els.mapContinue.textContent = `➡️ Jahr ${nextYear} beginnen`;
        }

        // Schneefall bei jedem dritten Jahr
        if (nextYear % 3 === 0) {
            this.triggerSnowfall();
        }

        // Overlay einblenden
        this.els.mapOverlay.classList.add('active');
    }

    hideMapIntermezzo() {
        this.els.mapOverlay.classList.remove('active');

        // Kurz warten bis Fade-Out fertig, dann naechstes Jahr
        setTimeout(() => {
            this.vm.nextYear();
        }, 600);
    }

    // ============================================
    // ORT-AUSWAHL AUF DER KARTE
    // ============================================
    selectLocation(locId, groupEl) {
        const loc = LOCATIONS[locId];
        if (!loc) return;

        // Vorherige Auswahl entfernen
        document.querySelectorAll('.t-loc-group.selected').forEach(g => {
            g.classList.remove('selected');
        });

        // Neue Auswahl
        groupEl.classList.add('selected');
        this.selectedLoc = locId;

        // Info-Panel fuellen
        this.els.mapInfoTitle.textContent = `${loc.icon} ${loc.name}`;
        this.els.mapInfoType.textContent = loc.type;
        this.els.mapInfoDesc.textContent = loc.desc;
        this.els.mapInfo.classList.add('active');

        // Ressourcen als Tags anhaengen
        if (loc.resources && loc.resources.length > 0) {
            const resLine = document.createElement('div');
            resLine.style.marginTop = '6px';
            resLine.style.fontSize = '0.9rem';
            resLine.style.color = '#3a6a4a';
            resLine.textContent = loc.resources.join(' · ');
            this.els.mapInfoDesc.appendChild(resLine);
        }
    }

    // ============================================
    // SCHNEEFALL
    // ============================================
    triggerSnowfall() {
        const flakes = ['❄', '❆', '✦', '·', '🥒'];
        for (let i = 0; i < 20; i++) {
            const flake = document.createElement('span');
            flake.className = 'snowflake';
            flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
            flake.style.left = Math.random() * 100 + 'vw';
            flake.style.fontSize = (0.5 + Math.random() * 1) + 'rem';
            flake.style.animationDuration = (3 + Math.random() * 4) + 's';
            flake.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(flake);
            setTimeout(() => flake.remove(), 8000);
        }
    }

    // ============================================
    // SIEGES-EFFEKTE
    // ============================================
    triggerVictoryEffects() {
        const emojis = ['🥒', '🎉', '👑', '🎊', '✨', '🥳'];
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('span');
            particle.className = 'snowflake';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
            particle.style.animationDuration = (2 + Math.random() * 3) + 's';
            particle.style.animationDelay = Math.random() * 3 + 's';
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 8000);
        }
    }
}
