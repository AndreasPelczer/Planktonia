// ============================================
// GURKISTAN – DAS SPIEL
// Model: Spielzustand, Events, Konfiguration
// ============================================

const CONFIG = {
    START_GURKEN: 100,
    START_STECKDOSEN: 5,
    START_GELDSCHEINE: 10,
    START_ZUFRIEDENHEIT: 50,
    START_BUERGER: 20,
    MAX_ZUFRIEDENHEIT: 100,
    VICTORY_YEAR: 25,

    // Produktion
    GURKEN_PER_BUERGER: 2,
    VERBRAUCH_PER_BUERGER: 1.5,
    STECKDOSEN_BASE: 2,          // von Steckdosia
    GELDSCHEINE_PER_4_BUERGER: 1, // Handel in Skatinga
    ZUFRIEDENHEIT_DECAY: 4,       // haerter als vorher

    // Migration (haertere Schwellen)
    HAPPY_THRESHOLD: 65,
    VERY_HAPPY: 85,
    UNHAPPY_THRESHOLD: 28,
    VERY_UNHAPPY: 12,
};

class GameState {
    constructor() {
        this.year = 1;
        this.gurken = CONFIG.START_GURKEN;
        this.steckdosen = CONFIG.START_STECKDOSEN;
        this.geldscheine = CONFIG.START_GELDSCHEINE;
        this.zufriedenheit = CONFIG.START_ZUFRIEDENHEIT;
        this.buerger = CONFIG.START_BUERGER;

        this.phase = 'event';
        this.log = [];
        this.statusEffects = [];
        this.usedEvents = [];
        this.flags = {};
        this.gameOver = false;
        this.gameOverReason = '';
        this.victory = false;
    }
}

// --- ORTE (fuer Karten-Interaktion) ---
const LOCATIONS = {
    sesslingen: {
        name: 'Sesslingen', type: 'Hauptstadt', icon: '👑',
        desc: 'Sitz des Pla\'khuun. Hier wurde die Verfassung unterzeichnet und die erste Gurke gesalzen. Das politische Zentrum — soweit man bei 6m² von „Zentrum" reden kann.',
        resources: ['👑 Regierung', '🥒 Gurkenlager'],
    },
    heizungstal: {
        name: 'Heizungstal', type: '1. Heiligtum', icon: '⚡',
        desc: 'Die Große Heizung — mystische Wärmequelle und spirituelles Zentrum. Pilger kommen aus allen Ecken der 6m², um ihre Gurken zu wärmen.',
        resources: ['🔥 Wärme', '🙏 Pilgerziel'],
    },
    skatinga: {
        name: 'Skatinga', type: 'Handelsmetropole', icon: '🛹',
        desc: 'Größter Marktplatz Gurkistans (12cm²). Hier werden Deals gemacht und zerschnittene Geldscheine gewechselt.',
        resources: ['💸 Handel', '🛹 Mobilität'],
    },
    lampingen: {
        name: 'Lampingen', type: 'Forschungssiedlung', icon: '💡',
        desc: 'Die Große Lampe spendet Licht. Forschungszentrum für Photosynthese und Steckdosenoptimierung.',
        resources: ['💡 Licht', '🔬 Forschung'],
    },
    hockerhausen: {
        name: 'Hockerhausen', type: '2. Heiligtum', icon: '🪑',
        desc: 'Der Heilige Hocker — Symbol für Beständigkeit. Wer hier Platz nimmt, soll Erleuchtung erfahren. Oder zumindest müde Gurken.',
        resources: ['🪑 Ruhe', '🙏 Pilgerziel'],
    },
    badboden: {
        name: 'Bad Boden', type: 'Kurort', icon: '🛁',
        desc: 'Berühmt für den flachen Boden — in Gurkistan ein seltener Luxus. Heilwasser (Kondenswasser von der Heizung) soll Wunder wirken.',
        resources: ['🛁 Erholung', '💚 Gesundheit'],
    },
    fensterdorf: {
        name: 'Fensterdorf', type: '3. Heiligtum', icon: '🪟',
        desc: 'Das Fenster — Portal zur Außenwelt. Durch es können Gurken das mythische „Deutschland" beobachten.',
        resources: ['🪟 Weitblick', '🙏 Pilgerziel'],
    },
    gurkenhain: {
        name: 'Gurkenhain', type: 'Außenposten', icon: '🌿',
        desc: 'Hier wachsen die wildesten Gurken. Grenzgebiet — manchmal verirren sich Deutsche hierher.',
        resources: ['🌿 Wildgurken'],
    },
    steckdosia: {
        name: 'Steckdosia', type: 'Energieposten', icon: '🔌',
        desc: 'Hier wird die mysteriöse Kraft aus der Wand angezapft. Ohne Steckdosia kein Gurkistan.',
        resources: ['🔌 Strom', '⚡ Strategisch'],
    },
    grenzwacht: {
        name: 'Grenzwacht', type: 'Grenzposten', icon: '🛡️',
        desc: 'Bewacht die Grenze zu Deutschland (40cm entfernt). „Bis hierhin und nicht weiter."',
        resources: ['🛡️ Verteidigung'],
    },
    fernblick: {
        name: 'Fernblick', type: 'Beobachtungsposten', icon: '🔭',
        desc: 'Höchster Punkt (47cm, auf dem Regal). Von hier kann man fast bis zur Küche sehen.',
        resources: ['🔭 Aufklärung'],
    },
};

// --- EVENTS ---
const EVENTS = [

    // ============================================
    // KRISEN
    // ============================================
    {
        id: 'heizung_defekt',
        text: '🔥 ALARMSTUFE ROT: Die Große Heizung in Heizungstal gibt ein bedenkliches KLONK von sich und verstummt. Die Pilger erstarren. Ohne Heizung wird Gurkistan zum Kühlregal — und wir alle wissen, was mit Gurken im Kühlregal passiert.',
        choices: [
            {
                text: '🔧 Notreparatur! (−20 🥒, −1 🔌)',
                effects: { gurken: -20, steckdosen: -1 },
                result: 'Die Technik-Gurke aus Steckdosia kommt, klopft dreimal drauf. Die Heizung klopft dreimal zurück. Dann läuft sie wieder. Niemand fragt warum.'
            },
            {
                text: '🙏 Kollektives Gebet an den Heizkörpergott',
                effects: { zufriedenheit: -12, geldscheine: 3 },
                result: 'Das Gebet wird zum viralen Hit. Pilger spenden Geldscheine. Die Heizung bleibt kalt. Die Gurken frieren, aber mit kultureller Relevanz.'
            },
            {
                text: '🧊 Durchhalten! Kälte stärkt den Charakter.',
                effects: { buerger: -3, zufriedenheit: -10 },
                result: 'Zwei Gurken werden tiefgefroren. Eine wandert nach Deutschland. Der Rest behauptet, es sei „erfrischend". (Es ist nicht erfrischend.)'
            }
        ],
        weight: 2
    },
    {
        id: 'fischwitz_skandal',
        text: '⚖️ VERFASSUNGSKRISE! In Sesslingen wurde ein FISCHWITZ erzählt. §3 ist glasklar: KEINE FISCHWITZE. Die Bevölkerung ist gespalten. Eine Hälfte fordert Bestrafung. Die andere findet den Witz über den Kabeljau in der U-Bahn eigentlich ganz witzig.',
        choices: [
            {
                text: '⚖️ Hart durchgreifen! Gurken-Arrest!',
                effects: { zufriedenheit: 5, geldscheine: -3 },
                result: 'Die Ordnung ist wiederhergestellt. Der Witz wird aus allen Archiven gelöscht. Kosten für das Tribunal: 3 zerschnittene Geldscheine. Die Traditionalisten jubeln.'
            },
            {
                text: '😅 Verfassung ist ein lebendes Dokument...',
                effects: { zufriedenheit: -15, geldscheine: 8 },
                result: 'Die Traditionalisten sind ENTSETZT. Drei Gurken treten in Hungerstreik. Aber das „Freie Fischwitz-Forum" verkauft T-Shirts (Kronkorken-große). Geldscheine fließen!'
            },
            {
                text: '🤔 Öffentliche Debatte ansetzen',
                effects: { gurken: -8, geldscheine: 2, zufriedenheit: 3 },
                result: '14-Stunden-Debatte. Ergebnis: Fischwitze verboten, aber „fischartige Anspielungen in metaphorischem Kontext" sind Grauzone. Typisch Gurkistan.'
            }
        ],
        weight: 2
    },
    {
        id: 'deutschland_ultimatum',
        text: '📋 Ein Zettel unter dem Fenster: „BITTE LEISE SEIN. LG, DEUTSCHLAND." Das ist ein diplomatisches Ultimatum. Der Außenminister (Gurke mit Monokel) fordert sofortiges Handeln.',
        choices: [
            {
                text: '📜 Formelle 47-seitige Antwort (−8 🥒, −2 💸)',
                effects: { gurken: -8, geldscheine: -2, zufriedenheit: 8 },
                result: 'Meisterwerk über Gurkistans Souveränität. Mit Fußnoten. Unter dem Fenster durchgeschoben. Keine Antwort. Diplomatischer SIEG! Das Volk jubelt.'
            },
            {
                text: '📢 Demonstration! WIR WERDEN LAUTER!',
                effects: { zufriedenheit: -5, geldscheine: 5, buerger: -2 },
                result: '17 Gurken skandieren „WIR SIND GURKISTAN!" Zwei verlieren ihre Stimme und wandern aus. Aber die Merchandise-Einnahmen sind fantastisch.'
            },
            {
                text: '🔇 Leiser sein. Diplomatie.',
                effects: { zufriedenheit: 5, steckdosen: 1 },
                result: 'Stille. Frieden. Deutschland schiebt als Dank eine Steckdosenleiste unter dem Fenster durch. JACKPOT!'
            }
        ],
        weight: 2
    },
    {
        id: 'gurkenfaeule',
        text: '🦠 KATASTROPHE im Gurkenlager! Ein Drittel zeigt braune Flecken. Die Lager-Gurke schwört, es sei „nur Patina". Der Gestank sagt was anderes.',
        choices: [
            {
                text: '🗑️ Alles Verdächtige wegwerfen',
                effects: { gurken: -35, zufriedenheit: 5 },
                result: 'Schmerzhafte Verluste. Aber das Lager riecht wieder nach Gurke statt nach Existenzkrise. Hygiene-Standards: „gelegentlich hingucken".'
            },
            {
                text: '🔬 Lampingen soll analysieren (−1 🔌)',
                effects: { gurken: -10, steckdosen: -1, geldscheine: 2 },
                result: 'Die Flecken sind „eine neue Lebensform". Sie nennen sie Gerald. Gerald wird zur Touristenattraktion. Eintritt: Geldscheine.'
            },
            {
                text: '🤷 Trotzdem essen, was soll schon passieren',
                effects: { buerger: -4, zufriedenheit: -12 },
                result: 'Es passiert einiges. Vier Gurken in die Kurklinik. Pressekonferenz: „Essen war schon immer ein Risiko." Niemand ist überzeugt.'
            }
        ],
        weight: 2
    },
    {
        id: 'stromausfall',
        text: '⚡ BLACKOUT! Die Kraft aus der Wand fließt nicht. Keine Heizung, kein Licht. Die Philosophen: „Das Licht war die ganze Zeit in uns." Die Pragmatiker: „Halt die Klappe."',
        choices: [
            {
                text: '🔌 Expedition zur Steckdose! (−10 🥒)',
                effects: { gurken: -10, steckdosen: 2 },
                result: 'Der Stecker war raus. NATÜRLICH. Die Expeditions-Gurke wird Nationalheldin. Bonus: 2 Steckdosenleisten als Kriegsbeute erbeutet!'
            },
            {
                text: '🕯️ Kerzenromantik! Wer braucht Strom?',
                effects: { zufriedenheit: -10, steckdosen: -2, geldscheine: 3 },
                result: 'Nacht 1: romantisch. Nacht 2: kalt. Nacht 3: kalt UND dunkel. Aber der Kerzenhandel boomt. Geldscheine fließen, Steckdosen schwinden.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'hocker_krise',
        text: '🪑 RELIGIÖSE KRISE! Der Heilige Hocker in Hockerhausen WACKELT. Ein Bein ist kürzer. Waren es immer vier Beine? Oder drei? Theologen streiten. Die Gläubigen sind in Panik.',
        choices: [
            {
                text: '🔨 Bierdeckel unterlegen (−5 🥒)',
                effects: { gurken: -5, zufriedenheit: 12 },
                result: 'Passt perfekt. Theologen debattieren: Ist der Bierdeckel jetzt auch heilig? Ergebnis: „Ja, aber nur dienstags." Hocker steht. Volk zufrieden.'
            },
            {
                text: '🪑 Neuen Hocker besorgen! (−15 🥒, −3 💸)',
                effects: { gurken: -15, geldscheine: -3, zufriedenheit: -15, buerger: -2 },
                result: 'SKANDAL! Blasphemie! Feierliche Verabschiedung des alten Hockers. Zwei Gurken emigrieren aus Protest. Aber der neue Hocker ist SEHR bequem.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'fenster_blockade',
        text: '🪟 Das Fenster in Fensterdorf ist ZU. Von außen geschlossen. Die Philosophen rasten aus: „Wenn wir die Außenwelt nicht sehen, existiert sie dann?" Die Pragmatiker drücken.',
        choices: [
            {
                text: '💪 Alle zusammen drücken! (−5 🥒)',
                effects: { gurken: -5, zufriedenheit: 5, buerger: -1 },
                result: 'Nach 4 Stunden: OFFEN! Deutschland ist noch da. Eine Gurke hat sich verausgabt und muss nach Bad Boden. Aber die Sicht ist frei!'
            },
            {
                text: '🧘 Blicken wir nach innen.',
                effects: { zufriedenheit: -5, geldscheine: 8 },
                result: 'Fensterdorf wird Meditationszentrum. Das „Buch der geschlossenen Fenster" wird Bestseller. Kosten: 0. Einnahmen: 8 zerschnittene Geldscheine. Profit!'
            }
        ],
        weight: 1.5
    },
    {
        id: 'grenzvorfall',
        text: '🛡️ ALARM! Ein FINGER! Von jenseits der Grenze! Er hat GEDRÜCKT! Auf unseren Boden! Deutschland hat den Bodenraum Gurkistans verletzt. Mit einem Zeigefinger.',
        choices: [
            {
                text: '📢 Schärfste Protestnote! (−5 🥒)',
                effects: { gurken: -5, geldscheine: 5, zufriedenheit: 5 },
                result: 'Die Protestnote: „Zeigefinger, 12 Gurkenlängen, Koordinate 3,7/2,1." Deutschland antwortet nicht. Aber der Bericht wird zum Sammlerstück. Geldscheine!'
            },
            {
                text: '🏗️ Grenzbefestigung! (−15 🥒, −2 🔌)',
                effects: { gurken: -15, steckdosen: -2, zufriedenheit: 8, statusAdd: { id: 'grenzwall', label: '🧱 Grenzbefestigung', type: 'good' } },
                result: 'Wall aus Kronkorken und Büroklammern. 4mm hoch, aber IMPOSANT. Die Grenzwacht-Gurke salutiert. Deutschland ist ahnungslos. Perfekt.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'schimmel_alarm',
        text: '🟢 Etwas Grünes in der Regierungszentrale. Keine Gurke. SCHIMMEL. Neben der Verfassung. Der Palastgärtner: „Er wächst. Und er hat... ein Gesicht?"',
        choices: [
            {
                text: '🧹 Desinfektion! (−15 🥒, −1 🔌)',
                effects: { gurken: -15, steckdosen: -1, zufriedenheit: 5 },
                result: 'Schimmel besiegt. Importiertes Reinigungsmittel (die Schande). Aber Sesslingen glänzt.'
            },
            {
                text: '🤝 Verhandeln. Der Schimmel bekommt Bleiberecht.',
                effects: { geldscheine: 5, buerger: 1, zufriedenheit: -3 },
                result: 'Gerald der Schimmel wird Bürger Nr. 21. Verfassungslücke: nichts über Schimmel-Rechte. Touristen kommen! Geldscheine fließen!'
            }
        ],
        weight: 1
    },
    {
        id: 'steckdosen_diebstahl',
        text: '🔌 KRISE! Eine Steckdosenleiste ist VERSCHWUNDEN! Die letzte Inventur zählte sie noch. Die Verdächtigenliste ist lang (na ja, 20 Namen). Die Polizei-Gurke (Sonnenbrille) ermittelt.',
        choices: [
            {
                text: '🔍 Großrazzia! Jede Gurke durchsuchen! (−10 🥒)',
                effects: { gurken: -10, steckdosen: 1, zufriedenheit: -8 },
                result: 'GEFUNDEN! Hinter der Heizung. Niemand weiß, wie sie da hinkam. Die Polizei-Gurke nimmt die Sonnenbrille ab: „Fall gelöst." Steckdose zurück!'
            },
            {
                text: '🤷 Neukaufen. Kosten auf die Bürger umlegen.',
                effects: { gurken: -5, geldscheine: -5, steckdosen: 1 },
                result: 'Neue Steckdosenleiste aus Deutschland importiert. Die Bürger zahlen mit Geldscheinen. Gemurre, aber die Stromversorgung steht.'
            }
        ],
        weight: 1.5,
        condition: (s) => s.steckdosen <= 4
    },

    // ============================================
    // CHANCEN
    // ============================================
    {
        id: 'reiche_ernte',
        text: '🥒 WUNDER IN GURKENHAIN! Wildgurken haben sich verdreifacht! So viele Gurken — wohin damit?',
        choices: [
            {
                text: '🏪 In Skatinga verkaufen',
                effects: { gurken: 15, geldscheine: 8 },
                result: 'Gurkenhändler jubeln! 15 Gurken verkauft, 8 Geldscheine Gewinn. Bester Markttag seit dem „Kronkorken-Crash".'
            },
            {
                text: '🎉 Volksfest! Gratis für alle!',
                effects: { gurken: -5, zufriedenheit: 20, buerger: 2 },
                result: 'LEGENDÄRES Fest! Zwei neue Gurken wandern ein, angelockt vom Geruch frischer Gurken und guter Laune. Zufriedenheit explodiert!'
            },
            {
                text: '📦 Alles einlagern.',
                effects: { gurken: 30, zufriedenheit: -5 },
                result: 'Vorräte quellen über. Die Bürger meckern: „Wir verhungern auf vollen Lagern!" Aber der Pla\'khuun weiß: Vorsicht ist die Mutter der Gurkenkiste.'
            }
        ],
        weight: 2
    },
    {
        id: 'touristen',
        text: '👀 SENSATION! Drei Gesichter am Fenster. TOURISTEN! Sie zeigen auf Gurkistan und sagen: „Guck mal, eine Gurke!" Die Philosophen debattieren: Sind WIR die Attraktion?',
        choices: [
            {
                text: '🎪 Touristenshow! Volle Unterhaltung!',
                effects: { geldscheine: 10, steckdosen: 1, zufriedenheit: 5 },
                result: 'Traditioneller Gurkentanz (Wackeln im Takt). Die Touristen werfen Geld und eine Steckdosenleiste! JACKPOT! Plus virales Video.'
            },
            {
                text: '🚫 Fenster zu! Souveränität!',
                effects: { zufriedenheit: 8, geldscheine: -3 },
                result: 'Würde gewahrt. Philosophen trauern: „Wir haben das Universum ausgesperrt." Aber die Bürger fühlen sich sicher.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'handelsangebot',
        text: '🤝 Mysteriöses Paket an der Grenze. Angebot: „50 Gurken + 2 Steckdosenleisten aus dem REWE nebenan." Jemand in Deutschland weiß von uns.',
        choices: [
            {
                text: '💰 Deal! (−15 💸)',
                effects: { geldscheine: -15, gurken: 25, steckdosen: 2, buerger: 1 },
                result: 'Handel perfekt! 25 Gurken, 2 Steckdosenleisten! Eine neue Gurke kommt mit der Lieferung. Der Finanzminister weint vor Glück.'
            },
            {
                text: '✋ Gurkistan ist AUTARK!',
                effects: { zufriedenheit: 10, geldscheine: 3 },
                result: '„WIR BRAUCHEN KEIN DEUTSCHLAND-GEMÜSE!" Nationalstolz gigantisch. Die Ablehnung wird zum Poster. Poster-Verkauf: 3 Geldscheine.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'forschung_lampingen',
        text: '💡 DURCHBRUCH! Wenn man die Lampe an- und ausschaltet, passieren „komische Sachen mit den Schatten." Die wissenschaftliche Community (4 Gurken) ist elektrisiert.',
        choices: [
            {
                text: '🔬 Finanzieren! (−15 🥒, −1 🔌)',
                effects: { gurken: -15, steckdosen: -1, geldscheine: 5, zufriedenheit: 5, statusAdd: { id: 'forschung', label: '🔬 Forschungszentrum', type: 'good' } },
                result: '„Institut für angewandte Schattenforschung" gegründet! Erste Erkenntnis: „Schatten sind dunkel." Forschungsberichte verkaufen sich gut.'
            },
            {
                text: '😤 Licht an oder aus, fertig!',
                effects: { zufriedenheit: -5, gurken: 5 },
                result: 'Forschungs-Gurke beleidigt. Budget wird zu Snacks. Die Wissenschaft pausiert. Die Gurken sind satt.'
            }
        ],
        weight: 1
    },
    {
        id: 'pilger_boom',
        text: '🙏 PILGERWELLE! 5 Gurken gleichzeitig auf dem Pilgerweg. Die Heiligtümer sind überfüllt. (5 Gurken = Oktoberfest-Level in Gurkenmaßstäben.)',
        choices: [
            {
                text: '🎟️ Eintritt! (Kapitalismus!)',
                effects: { geldscheine: 10, zufriedenheit: -8, steckdosen: 1 },
                result: 'Pilger zahlen murrend. „Seit wann kostet Erleuchtung?" Seit jetzt. Einnahmen: 10 Geldscheine und eine gespendete Steckdosenleiste.'
            },
            {
                text: '🎊 Pilgerfest feiern! (−10 🥒)',
                effects: { gurken: -10, zufriedenheit: 15, geldscheine: 3 },
                result: 'Gesänge am Heizungstal, Meditation in Hockerhausen, Schweigen am Fenster. Sogar die Atheisten-Gurke ist gerührt. Spenden: 3 Geldscheine.'
            }
        ],
        weight: 1
    },
    {
        id: 'prominenter_gast',
        text: '🎩 Ein Käfer ist durch eine Ritze eingedrungen. Für die Bürger klar: AUSLÄNDISCHER WÜRDENTRÄGER! Er wird feierlich empfangen. Der Käfer scheint verwirrt, aber das ist „diplomatische Zurückhaltung".',
        choices: [
            {
                text: '🍽️ Staatsbankett! (−12 🥒, −3 💸)',
                effects: { gurken: -12, geldscheine: -3, zufriedenheit: 10, steckdosen: 1 },
                result: 'Prachtvoll! Der Käfer isst nichts (Diät). Er verlässt Gurkistan durch die Ritze. Die Gurken deuten: „Handelsabkommen kommt!" Plus: Er ließ eine Steckdosenleiste fallen!'
            },
            {
                text: '🛡️ Deportation! Kein Eindringling!',
                effects: { zufriedenheit: 3, gurken: -3 },
                result: 'Käfer eskortiert zur Ritze. 40cm deportiert. Sicherheit gewährleistet. Diplomaten enttäuscht.'
            }
        ],
        weight: 1
    },

    // ============================================
    // ABSURD / MAD-STYLE
    // ============================================
    {
        id: 'napoleon_gurke',
        text: '🎖️ Eine Gurke mit Kronkorken auf dem Kopf: „ICH BIN NAPOLEON! GURKISTAN IST MEIN WATERLOO!" Einerseits: verrückt. Andererseits: Der Kronkorken steht ihr wirklich gut.',
        choices: [
            {
                text: '👑 Charisma! Zur Beraterin machen!',
                effects: { zufriedenheit: 5, geldscheine: 5, buerger: 1 },
                result: '„Napoleon" wird Militärberaterin. Erster Befehl: „Marsch auf den Kühlschrank!" Endet nach 30cm. Aber die Moral ist FANTASTISCH. Merchandising-Einnahmen!'
            },
            {
                text: '🏥 Kur in Bad Boden. Sofort.',
                effects: { gurken: -10, zufriedenheit: 3 },
                result: 'Drei Tage Klinik. „Ich war nie Napoleon. Ich war CAESAR." Zurück in die Klinik.'
            }
        ],
        weight: 1
    },
    {
        id: 'zeitreisender',
        text: '⏰ Gurke in Heizungstal: „Ich komme aus JAHR 50! Ich bringe Warnungen!" Riecht nach Essig. Zeitreise-Nebenwirkung oder Einmachglas?',
        choices: [
            {
                text: '👂 Was sagt die Zukunft?',
                effects: { geldscheine: 5, zufriedenheit: 5 },
                result: '„In der Zukunft: 12m²! DOPPELT so groß! Aber die Fischwitze haben gewonnen." Stille. Entsetzen. Der Zeitreisende verschwindet. Hinterließ 5 Geldscheine.'
            },
            {
                text: '🚫 Festnehmen! Zeitreise ist bestimmt illegal!',
                effects: { zufriedenheit: 3, steckdosen: 1 },
                result: 'Verfassung sagt nichts über Zeitreise. SCHON WIEDER Lücke! Er hinterlässt eine Steckdosenleiste „aus der Zukunft". Sie sieht aus wie eine von REWE.'
            }
        ],
        weight: 1
    },
    {
        id: 'existenzkrise',
        text: '🤯 PHILOSOPHISCHE KRISE! Fensterdorf fragt: „Sind wir ein LAND? Oder ein ZIMMER?" Die Frage breitet sich aus. Überall Zweifel. Existentielle Panik auf 6m².',
        choices: [
            {
                text: '📜 Verfassung vorlesen! LAUT! AUF DEM HOCKER!',
                effects: { zufriedenheit: 10, geldscheine: -3, gurken: -5 },
                result: 'Pla\'khuun auf dem Hocker. §1: „Gurkistan ist." PUNKT. REICHT. Applaus! Philosophen grummeln. Feierkosten: 5 Gurken, 3 Geldscheine.'
            },
            {
                text: '🤔 Ehrliche Diskussion',
                effects: { zufriedenheit: -18, geldscheine: 10 },
                result: 'Drei Tage Debatte. „Wir sind kein Land. Wir sind ein ZUSTAND." Die Dokumentation wird Bestseller. 10 Geldscheine! Aber die Stimmung ist im Keller.'
            },
            {
                text: '🎪 Ablenkung! ZIRKUS!',
                effects: { gurken: -15, zufriedenheit: 8, geldscheine: 5 },
                result: 'Gurke balanciert auf Kronkorken. Eine andere pfeift Nationalhymne (Gurken können nicht pfeifen, aber der Versuch zählt). Krise vertagt. Ticketeinnahmen!'
            }
        ],
        weight: 1.5
    },
    {
        id: 'auswanderer',
        text: '🧳 Gurke an der Grenzwacht mit Streichholzschachtel-Koffer: „Ich gehe nach DEUTSCHLAND! Dort gibt es REGALE VOLLER GURKEN!"',
        choices: [
            {
                text: '💔 Gehen lassen. Mit Würde.',
                effects: { buerger: -1, zufriedenheit: -5, geldscheine: 3 },
                result: 'Herzzerreißende Abschiedszeremonie. 19 Gurken Spalier. Sie kriecht durch die Ritze ins Unbekannte. Hinterlässt 3 Geldscheine und ein gebrochenes Herz.'
            },
            {
                text: '🗣️ Überzeugen! In Deutschland bist du EINE VON MILLIONEN!',
                effects: { gurken: -10, zufriedenheit: 8 },
                result: '„Hier bist du 5% DER BEVÖLKERUNG!" Argument zieht. Gurke bleibt. Koffer wird Denkmal. 10 Gurken Überzeugungskosten (Festmahl).'
            }
        ],
        weight: 1.5
    },
    {
        id: 'rad_erfunden',
        text: '💡 DURCHBRUCH in Lampingen! Gurke rollt Kronkorken: „ICH HABE DAS RAD ERFUNDEN!" — „Gibt es schon. Seit 5.500 Jahren." — „Nicht in GURKISTAN!"',
        choices: [
            {
                text: '🏆 Patent vergeben! Innovation!',
                effects: { gurken: -5, geldscheine: 8, zufriedenheit: 8 },
                result: '„Gurkistanisches Rad" patentiert. Erfinderin wird Heldin. Lizenzgebühren: 8 Geldscheine. Transport-Revolution! (Niemand transportiert was, aber das Prinzip.)'
            },
            {
                text: '📚 Ins Archiv. Nicht alles muss neu sein.',
                effects: { zufriedenheit: -5, gurken: 3 },
                result: 'Erfinderin beleidigt: „IHR WERDET ES BEREUEN!" Archiviert unter: „Kronkorken, rollend, siehe: Rad." 3 Gurken Budget umgeleitet zu Snacks.'
            }
        ],
        weight: 1
    },
    {
        id: 'nachbar_laerm',
        text: '📢 GEWALTIGES Geräusch! Staubsauger jenseits der Grenze! Grenzwacht: „EIN ANGRIFF! EINE WAFFE! SIE SAUGT!" Der Boden vibriert.',
        choices: [
            {
                text: '🛡️ Verteidigungsbereitschaft!',
                effects: { gurken: -8, steckdosen: -1, zufriedenheit: 8, geldscheine: 3 },
                result: 'Alle 20 Gurken in der Mitte (30cm von jeder Grenze). Staubsauger verstummt. „SIEG!" Feiertag: „Sieg über den Sauger." Merch-Einnahmen!'
            },
            {
                text: '🧘 Ruhe. Ist nur ein Haushaltsgerät.',
                effects: { zufriedenheit: -3 },
                result: 'Rational, aber langweilig. Die Grenzwacht-Gurke: „Heute Staubsauger, morgen WISCHMOPP!" Paranoia bleibt.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'regal_beben',
        text: '🌋 ERDBEBEN! Jemand stieß gegen das Regal. Auf 47cm: 8,5 Richter. Fernblick sendet Notfunk: „DER BODEN WANKT!"',
        choices: [
            {
                text: '🚨 Evakuierung! (−8 🥒)',
                effects: { gurken: -8, zufriedenheit: 5 },
                result: 'Späher-Gurke geborgen. Sie zittert: „Der Abgrund war... der Teppich. Aber TROTZDEM." Fernblick: Risikogebiet.'
            },
            {
                text: '📡 Regalometer bauen! (−12 🥒, −1 🔌)',
                effects: { gurken: -12, steckdosen: -1, statusAdd: { id: 'regalometer', label: '📡 Regalometer', type: 'good' } },
                result: 'Kronkorken + Büroklammer am Regal. Fällt er: ALARM! Primitiv, aber effektiv. Die Späher-Gurke schläft wieder.'
            }
        ],
        weight: 1
    },
    {
        id: 'singende_heizung',
        text: '🎵 Die Heizung macht... Musik? Walgesang meets defekter Wasserkocher. Pilger: „SIE SINGT!" Techniker: „Kalkablagerung."',
        choices: [
            {
                text: '🎶 Konzerte! Eintritt 1 Gurke!',
                effects: { gurken: 10, zufriedenheit: 10, geldscheine: 8 },
                result: '„Heizungs-Symphonien": „Brummen in B-Moll", „Klonk-Sonate", „Pfeifen bis Mitternacht". Pilger weinen. 10 Gurken Eintritt, 8 Geldscheine Merch!'
            },
            {
                text: '🔧 Entkalken! (−12 🥒, −1 🔌)',
                effects: { gurken: -12, steckdosen: -1, zufriedenheit: -8 },
                result: 'Musik verstummt. Pilger untröstlich: „IHR HABT DIE STIMME GOTTES GEKILLT!" Die Heizung funktioniert dafür besser.'
            }
        ],
        weight: 1
    },
    {
        id: 'wahl',
        text: '🗳️ WAHLTAG! Kandidat A: Du. Kandidat B: Gurke mit Schwimmbad-Versprechen (wo?). Kandidat C: Gerald der Schimmel.',
        choices: [
            {
                text: '📣 Wahlkampf! Verspreche 12m² bis 2030! (−12 🥒, −5 💸)',
                effects: { gurken: -12, geldscheine: -5, zufriedenheit: 12, buerger: 1 },
                result: 'Haushoch gewonnen! Gerald: 2 Stimmen. Versprechen werden vertagt. Aber eine neue Gurke wandert ein, beeindruckt vom Wahlspektakel.'
            },
            {
                text: '😎 Taten statt Worte.',
                effects: { zufriedenheit: -8 },
                result: 'Knapper Sieg: 11 zu 7 (Gerald: 2). Opposition meckert. Demokratie: 51% Zufriedenheit, 49% Beschwerden.'
            }
        ],
        weight: 1
    },
    {
        id: 'mysterioeses_paket',
        text: '📦 Paket an der Grenze. So groß wie ganz Sesslingen. „An: Bewohner, Gurkistan." Geröntgt (gegen Lampe gehalten): Inhalt UNKLAR.',
        choices: [
            {
                text: '🎁 Aufmachen!',
                effects: { gurken: 20, steckdosen: 2, geldscheine: 5, zufriedenheit: 10 },
                result: 'GURKENCHIPS! Und 2 Steckdosenleisten! Und 5 Geldscheine! Geschenk oder Drohung? Einigung: Geschenk. BESTER TAG aller Zeiten.'
            },
            {
                text: '💣 Könnte eine Falle sein!',
                effects: { zufriedenheit: -5, geldscheine: 5 },
                result: 'Paket zurückgeschoben. Die Theorien: „Ein zweites Gurkistan im Karton." Meta. Die Debatte wird zum Buch. 5 Geldscheine Verkauf.'
            }
        ],
        weight: 1
    },
    {
        id: 'guerilla_gaertner',
        text: '🌱 Über Nacht: Sprösslinge ÜBERALL. Zwischen Kronkorken, neben dem Hocker, auf der Heizung. Guerilla-Gärtnerei!',
        choices: [
            {
                text: '🌿 Wunderbar! Gurkistan wird GRÜN! (−5 🥒)',
                effects: { gurken: -5, zufriedenheit: 8, buerger: 1, steckdosen: 1, statusAdd: { id: 'gaerten', label: '🌿 Stadtgärten', type: 'good' } },
                result: 'GÄRTEN! Gurkistan hat GÄRTEN! Luftqualität verbessert. Neue Gurke wandert ein. Sogar die Steckdosen wachsen besser. (Nein, tun sie nicht, aber es fühlt sich so an.)'
            },
            {
                text: '🗑️ Unkraut raus! Ordnung!',
                effects: { zufriedenheit: -10 },
                result: 'Pflanzen entfernt. Naturschutz-Gurke weint: „MUTTER NATUR BELEIDIGT!" Ordnung hergestellt. Stimmung ruiniert.'
            }
        ],
        weight: 1
    },
    {
        id: 'steuerdebatte',
        text: '💰 Finanzminister (Gurke mit Taschenrechner): „STEUERN! 2 Geldscheine pro Bürger!" Reaktion: 40% dafür, 40% dagegen, 20% wissen nicht was Steuern sind.',
        choices: [
            {
                text: '✅ Steuern einführen!',
                effects: { geldscheine: 10, zufriedenheit: -15, statusAdd: { id: 'steuern', label: '💰 Steuersystem', type: 'good' } },
                result: 'Steuern! Kasse klingelt. Bürger meckern. „Das ist der Anfang einer Volkswirtschaft!" (In 6m². Aber immerhin.)'
            },
            {
                text: '❌ Gurkistan ist FREI!',
                effects: { zufriedenheit: 10, geldscheine: -3 },
                result: '„FREIHEIT!" Finanzminister wirft Taschenrechner weg (landet in Skatinga). Freiheit schmeckt süß. Staatskasse weniger.'
            }
        ],
        weight: 1
    },
    {
        id: 'handel_mit_kueche',
        text: '🍳 Fernblick meldet: Duft von GEBRATENEN GURKEN aus der Küche. Entsetzen (Kannibalismus?) und Neugier (riecht gut...) gleichzeitig.',
        choices: [
            {
                text: '😱 Staatstrauer! Gedenkminute!',
                effects: { zufriedenheit: -5, geldscheine: 5 },
                result: 'Ganz Gurkistan steht still. Drei Gurken weinen (können nicht, tun so). „Never Forget 🥒🍳" wird Meme. Poster-Verkauf: 5 Geldscheine.'
            },
            {
                text: '🤔 Kontakt aufnehmen... (−8 🥒)',
                effects: { gurken: -8, steckdosen: 1, geldscheine: 5, zufriedenheit: 5 },
                result: 'Expedition zur Küchengrenze! Jemand hat eine Steckdosenleiste und Geldscheine liegengelassen. IMPORT! Ethik-Kommission vertagt.'
            }
        ],
        weight: 1
    },
    {
        id: 'nachts_geraeusche',
        text: '🌙 Seit drei Nächten: Kratzen, Klopfen, Summen. Grenzwacht: „VON UNTER DEM BODEN!" Philosophen: „Der Boden spricht." Pragmatiker: „Wasserrohre."',
        choices: [
            {
                text: '🎵 Mitsummen! Neue Musikrichtung!',
                effects: { geldscheine: 8, zufriedenheit: 10, steckdosen: 1 },
                result: '„Rohr-Core" erfunden! Hypnotischer Rhythmus. Die Platten verkaufen sich (Kronkorken-groß). Es ist Klempnerei, aber egal. Eine Steckdosenleiste vibriert sich aus der Wand!'
            },
            {
                text: '🔦 Untersuchung! (−8 🥒)',
                effects: { gurken: -8, zufriedenheit: 5, geldscheine: 2 },
                result: 'Ergebnis: Wasserrohre. Empfehlung: „Permanente Unterwelt-Überwachung." Bericht verkauft sich für 2 Geldscheine.'
            }
        ],
        weight: 1
    },

    // ============================================
    // BAUPROJEKTE
    // ============================================
    {
        id: 'build_farm',
        text: '🚜 Agrar-Gurke von Gurkenhain: „RICHTIGE Gurkenfarm! Bewässerung! (Feuchtes Küchenpapier.) Dünger! (Kaffeesatz.)" Dauerhaft mehr Gurken!',
        choices: [
            {
                text: '🏗️ Farm bauen! (−30 🥒, −2 🔌, −5 💸)',
                effects: { gurken: -30, steckdosen: -2, geldscheine: -5, zufriedenheit: 5, statusAdd: { id: 'farm', label: '🚜 Gurkenfarm', type: 'good' } },
                result: 'Die Farm steht! Feuchtes Küchenpapier, strategisch platziert. Gurkenproduktion steigt DAUERHAFT. Die Agrar-Gurke bekommt einen Orden (Kronkorken mit Stern).'
            },
            {
                text: '❌ Zu teuer. Natur gibt genug.',
                effects: { zufriedenheit: -5 },
                result: 'Die Agrar-Gurke seufzt. „Eines Tages..." Zurück zu den Wildgurken. Die Natur gibt, die Natur nimmt.'
            }
        ],
        condition: (s) => s.year >= 3 && !s.flags.farm_built,
        weight: 0.6, unique: true
    },
    {
        id: 'build_handelsposten',
        text: '🏪 Skatinga will expandieren! „HANDELSPOSTEN! Direkter Draht nach Deutschland! (Durch die Ritze.)" Mehr Geldscheine, dauerhaft!',
        choices: [
            {
                text: '🏗️ Handelsposten! (−25 🥒, −1 🔌, −8 💸)',
                effects: { gurken: -25, steckdosen: -1, geldscheine: -8, zufriedenheit: 5, statusAdd: { id: 'handelsposten', label: '🏪 Handelsposten', type: 'good' } },
                result: 'Handelsposten eröffnet! Durch die Ritze fließen jetzt regelmäßig Geldscheine. Skatinga wird zur Wirtschaftsmacht!'
            },
            {
                text: '❌ Handel mit dem Feind? Niemals!',
                effects: { zufriedenheit: -3 },
                result: 'Skatinga enttäuscht. Die Ritze bleibt ungenutzt. Prinzipien vor Profit.'
            }
        ],
        condition: (s) => s.year >= 5 && !s.flags.handelsposten_built,
        weight: 0.6, unique: true
    },
    {
        id: 'build_kurhaus',
        text: '🏨 Bad Boden will ECHTES Kurhaus! „Wellness! (Feuchtes Tuch.) Sauna! (Heizungsnähe.)" Dauerhaft mehr Zufriedenheit!',
        choices: [
            {
                text: '🏗️ Kurhaus! (−35 🥒, −2 🔌, −10 💸)',
                effects: { gurken: -35, steckdosen: -2, geldscheine: -10, zufriedenheit: 10, statusAdd: { id: 'kurhaus', label: '🏨 Kurhaus', type: 'good' } },
                result: 'OFFEN! „Heizungsluft-Bad", „Fensterblick-Meditation", „Einfach Sitzen." Zufriedenheit steigt DAUERHAFT.'
            },
            {
                text: '❌ Luxus für 6m²? Bitte.',
                effects: { zufriedenheit: -8 },
                result: '„Selbst Liechtenstein hat Wellness." Gesundheitsminister klebt sich zweites Pflaster auf. Aus Protest.'
            }
        ],
        condition: (s) => s.year >= 8 && !s.flags.kurhaus_built,
        weight: 0.6, unique: true
    },
    {
        id: 'build_festung',
        text: '🏰 Verteidigungsminister: „FESTUNG! Schutzwall aus Büroklammern, Kronkorken und ENTSCHLOSSENHEIT!" Schutz vor negativen Ereignissen!',
        choices: [
            {
                text: '🏰 Festung! (−40 🥒, −3 🔌, −12 💸)',
                effects: { gurken: -40, steckdosen: -3, geldscheine: -12, zufriedenheit: 8, statusAdd: { id: 'festung', label: '🏰 Festung', type: 'good' } },
                result: '4mm hoch. 47 Büroklammern. Viel Hoffnung. Deutschland bemerkt nichts. Aber die Bürger fühlen sich SICHER. Grenzwacht-Gurke weint.'
            },
            {
                text: '❌ Brücken, keine Mauern.',
                effects: { zufriedenheit: -3, geldscheine: 3 },
                result: '„Brücken? WOHIN?!" Spruch wird T-Shirt. 3 Geldscheine Verkauf.'
            }
        ],
        condition: (s) => s.year >= 12 && !s.flags.festung_built,
        weight: 0.6, unique: true
    },
    {
        id: 'build_kraftwerk',
        text: '⚡ Steckdosia hat einen Plan: „KRAFTWERK! Zweite Steckdose erschließen! (Die hinter dem Regal.)" Dauerhaft mehr Steckdosenleisten!',
        choices: [
            {
                text: '⚡ Kraftwerk! (−30 🥒, −3 🔌, −8 💸)',
                effects: { gurken: -30, steckdosen: -3, geldscheine: -8, statusAdd: { id: 'kraftwerk', label: '⚡ Kraftwerk', type: 'good' } },
                result: 'Die zweite Steckdose ist erschlossen! Ein historischer Moment. Steckdosia feiert. Die Energieversorgung Gurkistans verdoppelt sich!'
            },
            {
                text: '❌ Eine Steckdose reicht.',
                effects: { zufriedenheit: -5 },
                result: 'Steckdosia grummelt. „Wenn der Strom ausfällt, erinnert euch an diesen Tag!"'
            }
        ],
        condition: (s) => s.year >= 6 && !s.flags.kraftwerk_built,
        weight: 0.6, unique: true
    },
];

// --- HILFSFUNKTIONEN ---
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
