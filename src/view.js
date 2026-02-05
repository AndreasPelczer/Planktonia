// ============================================
// GURKISTAN – DAS SPIEL
// View: DOM-Rendering, Animationen, UI
// ============================================

class GameView {

    constructor(viewModel) {
        this.vm = viewModel;
        this.vm.subscribe(this);

        // DOM-Elemente cachen
        this.els = {
            yearDisplay: document.getElementById('year-display'),
            statusBar: document.getElementById('status-bar'),
            gurken: document.getElementById('gurken'),
            zufriedenheit: document.getElementById('zufriedenheit'),
            memes: document.getElementById('memes'),
            buerger: document.getElementById('buerger'),
            eventLog: document.getElementById('event-log'),
            decisionButtons: document.getElementById('decision-buttons'),
            nextYear: document.getElementById('next-year'),
            game: document.getElementById('game'),
            gameOver: document.getElementById('game-over'),
            gameOverReason: document.getElementById('game-over-reason'),
            finalYears: document.getElementById('final-years'),
            victory: document.getElementById('victory'),
            yearTransition: document.getElementById('year-transition'),
            transitionYear: document.getElementById('transition-year'),
            transitionSummary: document.getElementById('transition-summary'),
            transitionEvent: document.getElementById('transition-event'),
        };

        this.bindEvents();
        this.vm.startGame();
    }

    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        // "Nächstes Jahr" Button
        this.els.nextYear.addEventListener('click', () => {
            this.showYearTransition();
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

        // Farbe je nach Fortschritt
        if (state.year >= 20) {
            this.els.yearDisplay.style.borderColor = '#da4';
            this.els.yearDisplay.style.color = '#da4';
        } else {
            this.els.yearDisplay.style.borderColor = '#4a7';
            this.els.yearDisplay.style.color = '';
        }
    }

    // ============================================
    // RESSOURCEN
    // ============================================
    updateResources(state) {
        this.animateValue(this.els.gurken, state.gurken);
        this.animateValue(this.els.zufriedenheit, state.zufriedenheit);
        this.animateValue(this.els.memes, state.memes);
        this.animateValue(this.els.buerger, state.buerger);

        // Farb-Klassen
        this.setResourceClass(this.els.gurken, state.gurken, 30, 15);
        this.setResourceClass(this.els.zufriedenheit, state.zufriedenheit, 25, 10);
        this.setResourceClass(this.els.memes, state.memes, 5, 2);
        this.setResourceClass(this.els.buerger, state.buerger, 10, 5);
    }

    animateValue(el, newVal) {
        const oldVal = parseInt(el.textContent) || 0;
        if (oldVal === newVal) {
            el.textContent = newVal;
            return;
        }

        // Kurze Animation: Wert hochzählen
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
                // Leerzeile als Trenner
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

        // Nach unten scrollen
        this.els.eventLog.scrollTop = this.els.eventLog.scrollHeight;
    }

    // ============================================
    // BUTTONS
    // ============================================
    updateButtons(state) {
        this.els.decisionButtons.innerHTML = '';

        if (state.phase === 'event' && state.choices.length > 0) {
            // Entscheidungs-Buttons anzeigen
            state.choices.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.addEventListener('click', () => {
                    this.vm.handleChoice(index);
                });

                // Build-Buttons besonders markieren
                if (choice.effects && choice.effects.statusAdd) {
                    btn.classList.add('primary');
                }
                // Teure Optionen markieren
                if (choice.effects && choice.effects.gurken && choice.effects.gurken < -20) {
                    btn.classList.add('repair');
                }

                this.els.decisionButtons.appendChild(btn);
            });

            this.els.nextYear.style.display = 'none';

        } else if (state.phase === 'result') {
            // "Nächstes Jahr" anzeigen
            this.els.nextYear.style.display = '';

            // Button-Text anpassen
            if (state.year >= CONFIG.VICTORY_YEAR) {
                this.els.nextYear.textContent = '🏆 Das letzte Jahr beginnt...';
            } else if (state.year >= 20) {
                this.els.nextYear.textContent = `➡️ Jahr ${state.year + 1} — fast geschafft!`;
            } else {
                this.els.nextYear.textContent = `➡️ Jahr ${state.year + 1} beginnen`;
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
    // JAHRESWECHSEL-ANIMATION
    // ============================================
    showYearTransition() {
        const state = this.vm.getViewState();
        const nextYear = state.year + 1;

        this.els.transitionYear.textContent = `Jahr ${nextYear}`;
        this.els.transitionSummary.textContent = state.yearSummary || 'Die Zeit vergeht...';

        // Event-Preview stylen
        const preview = this.els.transitionEvent;
        if (state.gurken < 30 || state.zufriedenheit < 20 || state.buerger < 10) {
            preview.className = 'event-preview bad';
            preview.textContent = '⚠️ Dunkle Wolken über Gurkistan...';
        } else if (state.zufriedenheit > 60 && state.gurken > 80) {
            preview.className = 'event-preview good';
            preview.textContent = '☀️ Gute Zeiten für die Republik!';
        } else {
            preview.className = 'event-preview neutral';
            preview.textContent = 'Was bringt das neue Jahr?';
        }

        // Transition einblenden
        this.els.yearTransition.classList.add('active');

        // Schneefall bei hohem Jahr (Winter-Feeling)
        if (nextYear % 3 === 0) {
            this.triggerSnowfall();
        }

        // Nach Verzögerung: nächstes Jahr starten
        setTimeout(() => {
            this.els.yearTransition.classList.remove('active');
            this.vm.nextYear();
        }, 2000);
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

            // Aufräumen
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
