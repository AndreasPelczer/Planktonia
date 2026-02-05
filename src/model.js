// ============================================
// GURKISTAN – DAS SPIEL
// Model: Spielzustand, Events, Konfiguration
// ============================================

// --- SPIELKONFIGURATION ---
const CONFIG = {
    START_GURKEN: 100,
    START_ZUFRIEDENHEIT: 50,
    START_MEMES: 10,
    START_BUERGER: 20,
    MAX_ZUFRIEDENHEIT: 100,
    VICTORY_YEAR: 25,

    // Produktion pro Runde
    GURKEN_PER_BUERGER: 2,
    VERBRAUCH_PER_BUERGER: 1.5,
    ZUFRIEDENHEIT_DECAY: 3,
    MEMES_PER_5_BUERGER: 1,

    // Migration
    HAPPY_THRESHOLD: 60,
    VERY_HAPPY: 80,
    UNHAPPY_THRESHOLD: 25,
    VERY_UNHAPPY: 10,
};

// --- SPIELZUSTAND ---
class GameState {
    constructor() {
        this.year = 1;
        this.gurken = CONFIG.START_GURKEN;
        this.zufriedenheit = CONFIG.START_ZUFRIEDENHEIT;
        this.memes = CONFIG.START_MEMES;
        this.buerger = CONFIG.START_BUERGER;

        this.phase = 'event';       // 'event' | 'result' | 'gameover' | 'victory'
        this.log = [];               // Array von {text, type}
        this.statusEffects = [];     // Array von {id, label, type: 'good'|'bad'}
        this.usedEvents = [];        // IDs bereits genutzter unique-Events
        this.flags = {};             // Freie Flags fuer Event-Ketten

        this.gameOver = false;
        this.gameOverReason = '';
        this.victory = false;
    }
}

// --- EVENTS ---
// Jedes Event: {id, text, choices: [{text, effects, result}], condition?, weight?, unique?}
// effects: {gurken, zufriedenheit, memes, buerger, statusAdd?, statusRemove?, flag?}
const EVENTS = [

    // ============================================
    // KRISEN (1-10)
    // ============================================
    {
        id: 'heizung_defekt',
        text: '🔥 ALARMSTUFE ROT: Die Große Heizung in Heizungstal gibt ein bedenkliches KLONK von sich und verstummt. Die Pilger erstarren. Ohne Heizung wird Gurkistan zum Kühlregal — und wir alle wissen, was mit Gurken im Kühlregal passiert. (Spoiler: nichts Gutes.)',
        choices: [
            {
                text: '🔧 Notreparatur! (−25 Gurken)',
                effects: { gurken: -25 },
                result: 'Die Technik-Gurke aus Steckdosia kommt, klopft dreimal drauf. Die Heizung klopft dreimal zurück. Dann läuft sie wieder. Niemand fragt warum. Manche Dinge sind heilig.'
            },
            {
                text: '🙏 Kollektives Gebet an den Heizkörpergott',
                effects: { zufriedenheit: -10, memes: 5 },
                result: 'Das Gebet wird zum viralen Hit. Großartiges Meme-Material. Die Heizung bleibt trotzdem kalt. Die Gurken frieren, aber mit kultureller Relevanz.'
            },
            {
                text: '🧊 Durchhalten! Kälte stärkt den Charakter.',
                effects: { buerger: -3, zufriedenheit: -8 },
                result: 'Zwei Gurken werden versehentlich tiefgefroren. Eine wandert nach Deutschland aus. Der Rest behauptet, es sei „erfrischend". (Es ist nicht erfrischend.)'
            }
        ],
        weight: 2
    },
    {
        id: 'fischwitz_skandal',
        text: '⚖️ VERFASSUNGSKRISE! In der Meme-Akademie wurde ein FISCHWITZ erzählt. §3 der Verfassung ist glasklar: KEINE FISCHWITZE. Die Bevölkerung ist gespalten. Die eine Hälfte fordert Bestrafung. Die andere findet den Witz eigentlich ganz lustig. (Er handelte von einem Kabeljau in der U-Bahn. Mehr verraten wir nicht.)',
        choices: [
            {
                text: '⚖️ Hart durchgreifen! 3 Tage Gurken-Arrest!',
                effects: { zufriedenheit: 5, memes: -5 },
                result: 'Die Ordnung ist wiederhergestellt. Der Witz wird aus allen Archiven gelöscht. Die Traditionalisten jubeln. Die Meme-Akademie hängt ein Schild auf: „Fischfreie Zone seit Jahr 0."'
            },
            {
                text: '😅 Naja, die Verfassung ist ein lebendes Dokument...',
                effects: { zufriedenheit: -12, memes: 10 },
                result: 'Die Traditionalisten sind ENTSETZT. Drei Gurken treten in Hungerstreik. Die Progressiven gründen das „Freie Fischwitz-Forum". Es entsteht eine kulturelle Renaissance. Und Chaos.'
            },
            {
                text: '🤔 Öffentliche Debatte ansetzen',
                effects: { gurken: -8, memes: 3, zufriedenheit: 3 },
                result: 'Die Debatte dauert 14 Stunden. Ergebnis: Fischwitze bleiben verboten, aber „fischartige Anspielungen in metaphorischem Kontext" sind eine Grauzone. Typisch Gurkistan.'
            }
        ],
        weight: 2
    },
    {
        id: 'deutschland_ultimatum',
        text: '📋 Ein Zettel wurde unter dem Fenster durchgeschoben. Darauf steht in großen Buchstaben: „BITTE LEISE SEIN. LG, DEUTSCHLAND." Das ist offensichtlich ein diplomatisches Ultimatum. Der Außenminister (eine Gurke mit Monokel) fordert sofortiges Handeln.',
        choices: [
            {
                text: '📜 Formelle 47-seitige Antwort verfassen',
                effects: { gurken: -10, memes: 8 },
                result: 'Der Außenminister verfasst ein Meisterwerk über die Souveränität Gurkistans. Mit Fußnoten. Und einem Anhang. Es wird unter dem Fenster durchgeschoben. Keine Antwort. Diplomatischer SIEG!'
            },
            {
                text: '🔇 Tatsächlich leiser sein',
                effects: { zufriedenheit: 8, memes: -3 },
                result: 'Die Bürger flüstern jetzt. Die Stimmung ist erstaunlich friedlich. Allerdings fragt sich niemand mehr, ob wir aufgegeben haben. Stille ist manchmal lauter als Protest.'
            },
            {
                text: '📢 Demonstration! WIR WERDEN LAUTER!',
                effects: { zufriedenheit: -5, memes: 15, buerger: -2 },
                result: '17 Gurken skandieren „WIR SIND GURKISTAN!" Deutschland antwortet nicht. Zwei Gurken verlieren ihre Stimme und wandern sicherheitshalber aus. Aber was für Memes!'
            }
        ],
        weight: 2
    },
    {
        id: 'gurkenfaeule',
        text: '🦠 KATASTROPHE im Gurkenlager von Sesslingen! Ein Drittel der Gurkenvorräte zeigen verdächtige braune Flecken. Die Lager-Gurke schwört, es sei „nur Patina", aber der Gestank spricht eine andere Sprache. Wörtlich.',
        choices: [
            {
                text: '🗑️ Alles wegwerfen, was verdächtig aussieht',
                effects: { gurken: -30, zufriedenheit: 5 },
                result: 'Schmerzhafte Verluste. Aber das Lager riecht jetzt wieder nach frischer Gurke statt nach existenzieller Krise. Die Hygiene-Standards werden auf „gelegentlich hingucken" angehoben.'
            },
            {
                text: '🔬 Lampingen soll die Flecken analysieren',
                effects: { gurken: -10, memes: 3 },
                result: 'Die Forschungsabteilung identifiziert die Flecken als „eine neue Lebensform". Sie nennen sie Gerald. Gerald wird zum Meme. Die faulen Gurken bleiben trotzdem faul.'
            },
            {
                text: '🤷 Einfach trotzdem essen, was soll schon passieren',
                effects: { buerger: -4, zufriedenheit: -10 },
                result: 'Es passiert einiges. Vier Gurken müssen in die Kurklinik nach Bad Boden. Der Pla\'khuun gibt eine Pressekonferenz: „Essen war schon immer ein Risiko." Niemand ist überzeugt.'
            }
        ],
        weight: 2
    },
    {
        id: 'stromausfall',
        text: '⚡ BLACKOUT! Die mysteriöse Kraft aus der Wand in Steckdosia fließt nicht mehr. Keine Heizung. Kein Licht in Lampingen. Gurkistan liegt im Dunkeln. Die Philosophen in Fensterdorf sagen: „Vielleicht war das Licht die ganze Zeit in uns." Die Pragmatiker sagen: „Halt die Klappe."',
        choices: [
            {
                text: '🔌 Expedition zur Steckdose — den Stecker prüfen!',
                effects: { gurken: -15, buerger: -1 },
                result: 'Der Stecker war raus. NATÜRLICH war der Stecker raus. Die Expeditions-Gurke steckt ihn wieder rein und wird zum Nationalheld. Der Stromausfall wird zum Nationalfeiertag. (Die eine Gurke, die am Stecker klebte, reden wir nicht drüber.)'
            },
            {
                text: '🕯️ Kerzenromantik! Wer braucht schon Strom?',
                effects: { zufriedenheit: -8, memes: 5, flag: { kein_strom: true } },
                result: 'Die erste Nacht ist romantisch. Die zweite ist kalt. Die dritte ist kalt UND dunkel. Aber die Memes über „Gurkistan unplugged" sind fantastisch.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'hocker_krise',
        text: '🪑 RELIGIÖSE KRISE! Der Heilige Hocker in Hockerhausen WACKELT. Ein Bein ist kürzer als die anderen. (Waren es immer vier Beine? Oder drei? Theologen streiten seit Stunden.) Die Gläubigen sind in Panik. Ohne einen stabilen Hocker — was bleibt dann noch?',
        choices: [
            {
                text: '🔨 Bierdeckel unterlegen (die klassische Lösung)',
                effects: { gurken: -5, zufriedenheit: 10 },
                result: 'Der Bierdeckel passt perfekt. Die Theologen debattieren, ob der Bierdeckel jetzt auch heilig ist. Ergebnis: „Ja, aber nur dienstags." Die Gläubigen sind zufrieden. Der Hocker steht.'
            },
            {
                text: '📖 Theologische Kommission einberufen',
                effects: { gurken: -15, memes: 8, zufriedenheit: -5 },
                result: 'Die Kommission tagt 12 Stunden. Ergebnis: Das Wackeln ist „ein Zeichen". Wofür? „Dafür." Der Hocker wackelt weiter, aber jetzt mit theologischer Legitimation.'
            },
            {
                text: '🪑 Neuen Hocker besorgen (Blasphemie?)',
                effects: { gurken: -20, zufriedenheit: -15, buerger: -2 },
                result: 'SKANDAL! Die Traditionalisten schreien Blasphemie. Der alte Hocker wird in einer feierlichen Zeremonie verabschiedet. Zwei Gurken emigrieren aus Protest. Der neue Hocker ist allerdings SEHR bequem.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'fenster_blockade',
        text: '🪟 Das Fenster in Fensterdorf — das Portal zur Außenwelt — ist ZU. Irgendjemand hat es geschlossen. Von außen. Die Philosophen rasten aus. „Wenn wir die Außenwelt nicht sehen können, existiert sie dann noch?" Die Pragmatiker versuchen zu drücken.',
        choices: [
            {
                text: '💪 Alle zusammen drücken! EINS, ZWEI, DREI!',
                effects: { gurken: -5, zufriedenheit: 5, buerger: -1 },
                result: 'Nach 4 Stunden kollektiven Drückens öffnet sich das Fenster. Deutschland ist noch da. (Zur Erleichterung einiger, zur Enttäuschung anderer.) Eine Gurke hat sich beim Drücken verausgabt und muss nach Bad Boden.'
            },
            {
                text: '🧘 Es ist ein Zeichen. Blicken wir nach innen.',
                effects: { zufriedenheit: -5, memes: 12 },
                result: 'Fensterdorf wird zum Meditationszentrum. Die Philosophen schreiben das „Buch der geschlossenen Fenster". Es wird ein Meme-Bestseller. Das Fenster bleibt zu, aber die Seelen sind offen. (Was auch immer das heißt.)'
            }
        ],
        weight: 1.5
    },
    {
        id: 'schimmel_alarm',
        text: '🟢 In der Regierungszentrale von Sesslingen wurde... etwas Grünes entdeckt. Nein, keine Gurke. SCHIMMEL. An der Wand. Direkt neben der Verfassung. Der Palastgärtner (ja, den gibt es) ist alarmiert. „Er wächst. Und er hat... ein Gesicht?"',
        choices: [
            {
                text: '🧹 Großreinemachen! Desinfektion!',
                effects: { gurken: -20, zufriedenheit: 5 },
                result: 'Der Schimmel wird besiegt. Kosten: 20 Gurken für Reinigungsmittel (importiert aus Deutschland, die Schande). Aber Sesslingen glänzt wie neu. Also, wie relativ neu.'
            },
            {
                text: '🎨 Ist das Schimmel? Oder... Kunst?',
                effects: { memes: 10, zufriedenheit: -3 },
                result: 'Der Schimmel wird zum Kunstwerk erklärt. „Organische Wandgestaltung" nennt es die Meme-Akademie. Touristen kommen (na ja, eine Gurke aus Skatinga). Die Hygiene-Standards sinken, aber die Kultur blüht!'
            },
            {
                text: '🤝 Diplomatie. Wir verhandeln mit dem Schimmel.',
                effects: { memes: 15, buerger: 1 },
                result: 'Der Pla\'khuun führt offizielle Verhandlungen mit dem Schimmel. Ergebnis: Der Schimmel bekommt Bleiberecht und wird als 21. Bürger eingetragen. Die Verfassung sagt nichts über Schimmel-Rechte. Lücke im Gesetz!'
            }
        ],
        weight: 1
    },
    {
        id: 'grenzvorfall',
        text: '🛡️ ALARM an der Grenzwacht! Die Wächter-Gurke meldet: „Ein FINGER! Ein riesiger Finger! Er kam von jenseits der Grenze und hat... GEDRÜCKT! Auf unseren Boden!" Deutschland hat soeben den Luftraum und Bodenraum Gurkistans verletzt. Mit einem Zeigefinger.',
        choices: [
            {
                text: '📢 Schärfste diplomatische Protestnote!',
                effects: { gurken: -5, memes: 10, zufriedenheit: 5 },
                result: 'Die Protestnote ist ein Meisterwerk: „Der Zeigefinger war mindestens 12 Gurkenlängen lang und hat den Boden bei Koordinate 3,7/2,1 berührt." Deutschland antwortet nicht. Aber wir haben unsere Würde!'
            },
            {
                text: '🏗️ Grenzbefestigung verstärken!',
                effects: { gurken: -20, zufriedenheit: 8, statusAdd: { id: 'grenzwall', label: '🧱 Grenzbefestigung', type: 'good' } },
                result: 'Ein Wall aus Kronkorken und Büroklammern entsteht. 4mm hoch, aber IMPOSANT. Die Grenzwacht-Gurke salutiert. Deutschland ist weiterhin ahnungslos, aber der Schutz steht!'
            },
            {
                text: '🤷 Ignorieren. Was soll ein Finger schon anrichten?',
                effects: { zufriedenheit: -8, buerger: -1 },
                result: 'Die Grenzwacht-Gurke ist demoralisiert. Eine Gurke wandert aus, weil „dieser Staat mich nicht beschützt". Der Finger kommt nie wieder. Aber die Angst bleibt.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'meme_depression',
        text: '📜 KULTURKRISE! Die Meme-Produktion ist eingebrochen. Die Meme-Akademie meldet: „Uns fällt nichts mehr ein." Die Bürger scrollen durch leere Feeds. Die Stimmung sinkt. Ohne frische Memes ist Gurkistan wie ein Sandwich ohne Gurke — technisch möglich, aber wozu?',
        choices: [
            {
                text: '💰 Meme-Stipendien vergeben! (−20 Gurken)',
                effects: { gurken: -20, memes: 12, zufriedenheit: 5 },
                result: 'Die Stipendien wirken Wunder. Ein Meme über „Gurken im Weltraum" geht viral. Ein anderes über den Heiligen Hocker spaltet die Nation. Aber hey — es wird wieder gelacht!'
            },
            {
                text: '🎭 Meme-Festival in Skatinga veranstalten',
                effects: { gurken: -15, memes: 8, zufriedenheit: 8 },
                result: 'Das Festival ist ein Knaller! Highlights: „Bester Fischwitz, den man nicht erzählen darf" (leerer Rahmen, Standing Ovations) und „Gurke des Jahres" (es gewinnt Gerald der Schimmel, obwohl er nicht nominiert war).'
            },
            {
                text: '😐 Memes sind überbewertet. Zurück zur Arbeit!',
                effects: { gurken: 10, zufriedenheit: -15, memes: -5 },
                result: 'Die Produktivität steigt! Aber die Stimmung... die Stimmung ist jetzt ungefähr auf dem Level von „Montag, 6 Uhr, Regen". Die Gurken arbeiten. Aber sie lachen nicht mehr.'
            }
        ],
        weight: 1.5
    },

    // ============================================
    // CHANCEN (11-20)
    // ============================================
    {
        id: 'reiche_ernte',
        text: '🥒 WUNDER IN GURKENHAIN! Die Wildgurken haben sich verdreifacht! Der Boden (also, der Teppich) gibt alles. Die Ernte-Gurken tanzen vor Freude. So viele Gurken — wohin damit?',
        choices: [
            {
                text: '🏪 Auf dem Markt in Skatinga verkaufen',
                effects: { gurken: 30, zufriedenheit: 5 },
                result: 'Die Händler-Gurken reiben sich die... nun ja, sie haben keine Hände. Aber sie sind zufrieden! 30 Gurken Gewinn. Skatinga feiert Markttag. Der beste seit dem „Kronkorken-Crash" von Jahr 3.'
            },
            {
                text: '🎉 Volksfest! Gratisessen für alle!',
                effects: { gurken: -5, zufriedenheit: 20, buerger: 2 },
                result: 'Das Fest ist LEGENDÄR. Es wird gegessen, getanzt (so gut Gurken eben tanzen) und gefeiert. Zwei neue Gurken wandern ein, angelockt vom Geruch frischer Gurken und guter Laune.'
            },
            {
                text: '📦 Alles einlagern. Winter kommt. Immer.',
                effects: { gurken: 25, zufriedenheit: -3 },
                result: 'Die Vorräte quellen über. Die Bürger meckern: „Wir verhungern auf vollen Lagern!" Aber der Pla\'khuun weiß: Vorsicht ist der Vater der Gurkenkiste. Oder so ähnlich.'
            }
        ],
        weight: 2
    },
    {
        id: 'touristen',
        text: '👀 SENSATION! Drei Gesichter drücken sich von außen gegen das Fenster in Fensterdorf. TOURISTEN AUS DEUTSCHLAND! Sie zeigen auf Gurkistan und sagen... „Guck mal, eine Gurke!" Die Philosophen debattieren: Sind WIR die Attraktion? Oder SIE?',
        choices: [
            {
                text: '🎪 Touristenshow! Volle Unterhaltung!',
                effects: { gurken: 15, memes: 10, zufriedenheit: 5 },
                result: 'Die Gurken führen einen traditionellen Tanz auf (Wackeln im Takt). Die Touristen sind begeistert. Sie drücken 15 Cent gegen die Scheibe. In Gurkistan-Währung: 15 Gurken! Plus: virales Video auf TikTok.'
            },
            {
                text: '🚫 GRENZEN SCHLIESSEN! Fenster zu!',
                effects: { zufriedenheit: 8, memes: -5 },
                result: 'Das Fenster wird geschlossen. Die Souveränität ist gewahrt. Die Bürger fühlen sich sicher. Aber die Philosophen trauern: „Wir haben das Universum ausgesperrt." Dramatisch, aber effektiv.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'viraler_meme',
        text: '📱 EIN GURKISTAN-MEME GEHT VIRAL! Irgendjemand hat ein Foto der Karte nach draußen geschmuggelt und daraus ein Meme gemacht: „POV: Dein Land ist 6m² und du hast trotzdem Grenzkontrollen." 47.000 Likes. Die Meme-Akademie weint vor Stolz.',
        choices: [
            {
                text: '📢 Nutzen! Offizielle Social-Media-Kampagne!',
                effects: { memes: 20, zufriedenheit: 10, buerger: 2 },
                result: 'Gurkistan ist jetzt INTERNET-BERÜHMT. Zwei neue Gurken wandern ein, angelockt von der viralen Energie. Die Meme-Akademie wird umbenannt in „Meme-Universität". Der Dekan ist eine Gurke mit Brille.'
            },
            {
                text: '🔒 Geheimhaltung! Wer hat das Foto gemacht?!',
                effects: { zufriedenheit: -10, memes: 5 },
                result: 'Die Geheimpolizei (eine Gurke mit Sonnenbrille) ermittelt. Ergebnis: Es war die Grenzwacht-Gurke. Aus Langeweile. Die Ermittlung selbst wird zum Meme. Alles wird zum Meme.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'handelsangebot',
        text: '🤝 Skatinga meldet: Ein mysteriöses Paket liegt an der Grenze. Darin: ein Angebot. „Lieferung von 50 echten Gurken aus dem REWE nebenan. Preis: ... Verhandlungssache." Jemand in Deutschland weiß von uns. Und möchte handeln.',
        choices: [
            {
                text: '💰 Deal! Alles nehmen! (−30 Gurken als Bezahlung)',
                effects: { gurken: 20, buerger: 3 },
                result: 'Der Handel ist perfekt. 50 frische Gurken! Abzüglich Vermittlungsgebühr, Importzoll und „strategische Reserve" bleiben 50 übrig. Netto. 3 neue Bürger kommen mit der Lieferung. (Oder waren es Gurken? Schwer zu sagen.)'
            },
            {
                text: '✋ Ablehnen! Gurkistan ist AUTARK!',
                effects: { zufriedenheit: 10, memes: 5 },
                result: '„WIR BRAUCHEN KEIN DEUTSCHLAND-GEMÜSE!" schallt es durch die 6m². Der Nationalstolz ist gigantisch. Die Gurkenvorräte sind es leider nicht. Aber hey — Würde ist auch eine Ressource. (Nicht im Spiel. Aber generell.)'
            }
        ],
        weight: 1.5
    },
    {
        id: 'forschung_lampingen',
        text: '💡 DURCHBRUCH IN LAMPINGEN! Die Forschungs-Gurke hat etwas entdeckt: Wenn man die Lampe an- und ausschaltet, passieren „komische Sachen mit den Schatten". Die wissenschaftliche Community (4 Gurken) ist elektrisiert. Das könnte alles verändern! (Oder auch nicht.)',
        choices: [
            {
                text: '🔬 Forschung finanzieren! (−20 Gurken)',
                effects: { gurken: -20, memes: 8, zufriedenheit: 5, statusAdd: { id: 'forschung', label: '🔬 Forschungszentrum', type: 'good' } },
                result: 'Das „Institut für angewandte Schattenforschung" wird gegründet. Erste Erkenntnis: „Schatten sind dunkel." Zweite Erkenntnis: „Manchmal sind sie lang." Die Gurken sind beeindruckt. Die Wissenschaft schreitet voran!'
            },
            {
                text: '😤 Licht an oder aus, mehr gibt es nicht!',
                effects: { zufriedenheit: -5, gurken: 5 },
                result: 'Die Forschungs-Gurke ist beleidigt. „Ihr werdet es noch bereuen! DIE SCHATTEN SPRECHEN ZU MIR!" Sie kehrt zurück an ihre Lampe. Die 5 Gurken Forschungsbudget werden in Snacks umgeleitet.'
            }
        ],
        weight: 1
    },
    {
        id: 'pilger_boom',
        text: '🙏 PILGERWELLE! Gleich 5 Gurken aus verschiedenen Ecken Gurkistans machen sich gleichzeitig auf den Pilgerweg. Heizungstal → Hockerhausen → Fensterdorf. Die Heiligen Stätten sind überfüllt. (5 Gurken auf 3 Heiligtümern. Das ist wie Oktoberfest-Level in Gurkenmaßstäben.)',
        choices: [
            {
                text: '🎟️ Eintritt verlangen! (Kapitalismus!)',
                effects: { gurken: 15, zufriedenheit: -8, memes: 3 },
                result: 'Die Pilger bezahlen. Murrend. „Seit wann kostet Erleuchtung Eintritt?" Seit jetzt, liebe Gurken. Der Pla\'khuun zählt die Einnahmen und lächelt. (Gurken können nicht lächeln, aber man spürt es.)'
            },
            {
                text: '🎊 Pilger willkommen heißen! Fest!',
                effects: { gurken: -10, zufriedenheit: 15, memes: 5 },
                result: 'Das Pilgerfest wird wunderschön. Gesänge am Heizungstal, Meditation in Hockerhausen, gemeinsames Schweigen am Fenster. Die Zufriedenheit explodiert. Sogar die Atheisten-Gurke ist gerührt. (Sie gibt es nicht zu.)'
            }
        ],
        weight: 1
    },
    {
        id: 'prominenter_gast',
        text: '🎩 Ein Käfer ist durch eine Ritze in Gurkistan eingedrungen. Für die Bürger ist klar: Das ist ein AUSLÄNDISCHER WÜRDENTRÄGER! Er wird feierlich empfangen. Der Käfer scheint verwirrt, aber das interpretieren die Gurken als „diplomatische Zurückhaltung".',
        choices: [
            {
                text: '🍽️ Staatsbankett! (−15 Gurken)',
                effects: { gurken: -15, zufriedenheit: 10, memes: 8 },
                result: 'Das Bankett ist prachtvoll. Der Käfer isst nichts (Diät, vermutlich diplomatisch). Er verlässt Gurkistan durch die Ritze. Die Gurken deuten das als „er wird wiederkommen mit einem Handelsabkommen". GROSSER Tag für die Diplomatie!'
            },
            {
                text: '🛡️ Grenze sichern! Kein Eindringling!',
                effects: { zufriedenheit: 5, memes: -3, gurken: -5 },
                result: 'Die Grenzwacht-Gurke eskortiert den Käfer zur Ritze. Er wird deportiert. Nach Deutschland. (Also 40cm weiter.) Die Sicherheit ist gewährleistet. Die Diplomaten sind enttäuscht.'
            }
        ],
        weight: 1
    },

    // ============================================
    // ABSURD / MAD-STYLE (18-26)
    // ============================================
    {
        id: 'napoleon_gurke',
        text: '🎖️ Eine Gurke in Sesslingen hat sich einen Kronkorken auf den Kopf gesetzt und erklärt: „ICH BIN NAPOLEON! UND GURKISTAN IST MEIN WATERLOO!" Die Bürger sind... unsicher. Einerseits: offensichtlich verrückt. Andererseits: Der Kronkorken steht ihr wirklich gut.',
        choices: [
            {
                text: '👑 Sie hat Charisma. Zur Beraterin machen!',
                effects: { zufriedenheit: 5, memes: 12, buerger: 1 },
                result: '„Napoleon" wird offizielle Militärberaterin. Ihr erster Befehl: „Wir marschieren auf den Kühlschrank!" Der Marsch endet nach 30cm an der Wand. Aber die Moral ist FANTASTISCH. Eine neue Gurke wandert ein, angelockt vom Charisma.'
            },
            {
                text: '🏥 Ab nach Bad Boden. Kur. Sofort.',
                effects: { gurken: -10, zufriedenheit: 3 },
                result: 'Napoleon-Gurke wird in die Kurklinik eingewiesen. Nach drei Tagen gibt sie den Kronkorken ab. „Ich war nie Napoleon", sagt sie. „Ich war CAESAR." ...zurück in die Klinik.'
            },
            {
                text: '🗳️ Demokratie! Das Volk soll entscheiden!',
                effects: { gurken: -5, memes: 8, zufriedenheit: -5 },
                result: 'Volksabstimmung: 47% für Napoleon, 47% dagegen, 6% stimmen für „Gerald den Schimmel". Patt. Napoleon-Gurke regiert dienstags. Der Pla\'khuun die restlichen Tage. Es ist kompliziert.'
            }
        ],
        weight: 1
    },
    {
        id: 'zeitreisender',
        text: '⏰ Eine Gurke erscheint in Heizungstal und behauptet, aus dem JAHR 50 DER REPUBLIK zu kommen. „Ich bringe Warnungen!" Die Bürger sind skeptisch. Der Zeitreisende riecht nach Essig. Das ist entweder Zeitreise-Nebenwirkung oder er war im Einmachglas.',
        choices: [
            {
                text: '👂 Anhören! Was sagt die Zukunft?',
                effects: { memes: 10, zufriedenheit: 5 },
                result: '„In der Zukunft hat Gurkistan 12m²! DOPPELT so groß! Aber die Fischwitze... die Fischwitze haben gewonnen." Stille. Entsetzen. Der Zeitreisende verschwindet. (Er war übrigens Horst aus Niendorf. Aber das wissen wir erst in Jahr 50.)'
            },
            {
                text: '🚫 Festnehmen! Zeitreise ist bestimmt illegal!',
                effects: { zufriedenheit: 3, gurken: -5, memes: 5 },
                result: 'Die Verfassung sagt nichts über Zeitreise. (SCHON WIEDER eine Lücke!) Der Zeitreisende wird bis zur Klärung in Hockerhausen festgehalten. Er meditiert auf dem Heiligen Hocker und sagt: „Netter Hocker. In der Zukunft hat er fünf Beine."'
            }
        ],
        weight: 1
    },
    {
        id: 'existenzkrise',
        text: '🤯 PHILOSOPHISCHE KRISE! Die Denker in Fensterdorf haben die Frage gestellt, die NIEMAND stellen durfte: „Sind wir WIRKLICH ein Land? Oder sind wir einfach... ein Zimmer?" Die Frage breitet sich aus wie ein Lauffeuer. Überall Zweifel. Existentielle Panik.',
        choices: [
            {
                text: '📜 Verfassung vorlesen! LAUT! AUF DEM HOCKER!',
                effects: { zufriedenheit: 10, memes: 5, gurken: -5 },
                result: 'Der Pla\'khuun steigt auf den Heiligen Hocker (mit Erlaubnis der Theologen) und liest §1 vor: „Gurkistan ist." Punkt. REICHT. Die Bürger applaudieren. Die Philosophen grummeln, aber respektieren den Hocker.'
            },
            {
                text: '🤔 Ehrliche Diskussion zulassen',
                effects: { zufriedenheit: -15, memes: 15 },
                result: 'Drei Tage Diskussion. Ergebnis: „Wir sind kein Land im KLASSISCHEN Sinne. Wir sind ein ZUSTAND." Die Philosophen sind zufrieden. Alle anderen sind verwirrt. Aber die Memes über die Debatte sind GOLD.'
            },
            {
                text: '🎪 Ablenkung! ZIRKUS!',
                effects: { gurken: -15, zufriedenheit: 8, memes: 8 },
                result: 'Der Zirkus besteht aus einer Gurke, die auf einem Kronkorken balanciert, und einer anderen, die „Nationalhymne" pfeift (Gurken können nicht pfeifen, aber der Versuch zählt). Die Existenzkrise wird vertagt. Auf immer.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'auswanderer',
        text: '🧳 Eine Gurke steht an der Grenzwacht mit einem winzigen Koffer (ein Streichholzschachtel). „Ich gehe nach DEUTSCHLAND!" Die Grenzwacht-Gurke ist schockiert. „Warum?!" — „Ich habe gehört, dort gibt es... REGALE VOLLER GURKEN. Hunderte. Tausende!"',
        choices: [
            {
                text: '💔 Gehen lassen. Mit Würde.',
                effects: { buerger: -1, zufriedenheit: -5, memes: 5 },
                result: 'Die Abschiedszeremonie ist herzzerreißend. Die ganze Nation (19 Gurken) steht Spalier. Die Auswanderer-Gurke kriecht durch die Ritze ins Unbekannte. Sie wird nie wieder gesehen. Aber ihre Geschichte wird zum Meme.'
            },
            {
                text: '🗣️ Überzeugen! Was hat Deutschland, was wir nicht haben?',
                effects: { gurken: -10, zufriedenheit: 8 },
                result: '„In Deutschland bist du EINE VON MILLIONEN! Hier bist du 5% DER BEVÖLKERUNG!" Das Argument zieht. Die Gurke bleibt. Der Koffer wird zum Denkmal: „Hier hätte jemand gehen können. Aber blieb."'
            }
        ],
        weight: 1.5
    },
    {
        id: 'rad_erfunden',
        text: '💡 DURCHBRUCH in Lampingen! Eine Gurke rollt einen Kronkorken über den Boden und schreit: „ICH HABE DAS RAD ERFUNDEN!" Die Forschungs-Gurke korrigiert: „Das wurde schon erfunden. Vor circa 5.500 Jahren." Die Erfinderin: „Nicht in GURKISTAN!"',
        choices: [
            {
                text: '🏆 Patent vergeben! Innovation fördern!',
                effects: { gurken: -5, memes: 10, zufriedenheit: 8 },
                result: 'Das „Gurkistanische Rad" (ein Kronkorken) wird patentiert. Die Erfinderin wird Nationalheldin. Der Kronkorken wird zur Grenzwacht gerollt und zurück. Transport-Revolution! (Niemand transportiert irgendwas, aber das Prinzip steht.)'
            },
            {
                text: '📚 Ins Archiv damit. Nicht alles muss neu sein.',
                effects: { zufriedenheit: -5, gurken: 3 },
                result: 'Die Erfinderin ist beleidigt. „IHR WERDET ES BEREUEN!" Sie rollt den Kronkorken demonstrativ durch ganz Gurkistan. (Dauert 8 Sekunden.) Die Innovation wird archiviert unter: „Kronkorken, rollend, siehe auch: Rad."'
            }
        ],
        weight: 1
    },
    {
        id: 'nachbar_laerm',
        text: '📢 Von jenseits der Grenze dringt ein GEWALTIGES Geräusch: Ein Staubsauger! Die Grenzwacht-Gurke meldet panisch: „EIN ANGRIFF! DIE DEUTSCHEN HABEN EINE WAFFE! SIE SAUGT!" Ganz Gurkistan bebt. (Wörtlich. Der Boden vibriert.)',
        choices: [
            {
                text: '🛡️ Volle Verteidigungsbereitschaft!',
                effects: { gurken: -10, zufriedenheit: 5, memes: 8 },
                result: 'Alle Gurken versammeln sich in der Mitte Gurkistans (30cm von jeder Grenze). Der Staubsauger verstummt nach 20 Minuten. „WIR HABEN GEWONNEN!" jubelt die Armee (alle 20 Gurken). Der Tag wird Feiertag: „Sieg über den Sauger."'
            },
            {
                text: '🧘 Ruhe bewahren. Es ist nur ein Haushaltsgerät.',
                effects: { zufriedenheit: -3, memes: 3 },
                result: 'Die rationalen Gurken behalten Recht. Es war ein Staubsauger. Aber die Grenzwacht-Gurke besteht darauf: „Heute ein Staubsauger, morgen... ein WISCHMOPP!" Die Paranoia bleibt. Leicht.'
            }
        ],
        weight: 1.5
    },
    {
        id: 'regal_beben',
        text: '🌋 ERDBEBEN! Also — jemand hat gegen das Regal gestoßen, auf dem Fernblick liegt. Für die Gurken auf 47cm Höhe fühlt es sich an wie ein 8,5 auf der Richterskala. Die Meteorologie-Gurke auf Fernblick sendet Notfunk: „MAYDAY! DER BODEN WANKT! NICHTS IST SICHER!"',
        choices: [
            {
                text: '🚨 Evakuierung von Fernblick!',
                effects: { gurken: -10, buerger: 0, zufriedenheit: 5 },
                result: 'Die Späher-Gurke wird sicher geborgen. Sie zittert noch. „Ich habe in den Abgrund geschaut. Der Abgrund war... der Teppich. Aber TROTZDEM." Fernblick wird zum Risikogebiet erklärt. Das Regal steht wieder still. Vorerst.'
            },
            {
                text: '📡 Regalometer installieren! Frühwarnsystem!',
                effects: { gurken: -15, statusAdd: { id: 'regalometer', label: '📡 Regalometer', type: 'good' } },
                result: 'Ein Kronkorken wird mit einer Büroklammer am Regal befestigt. Wenn er fällt: ALARM! Das Regalometer ist primitiv, aber effektiv. Die Späher-Gurke schläft wieder. Manchmal.'
            }
        ],
        weight: 1
    },

    // ============================================
    // POLITISCH / WIRTSCHAFTLICH (24-30)
    // ============================================
    {
        id: 'steuerdebatte',
        text: '💰 Der Finanzminister (eine Gurke mit Taschenrechner) schlägt vor: STEUERN! „2 Gurken pro Bürger pro Jahr! Für Infrastruktur!" Die Reaktion: 40% dafür, 40% dagegen, 20% wissen nicht was Steuern sind.',
        choices: [
            {
                text: '✅ Steuern einführen! Staat braucht Geld!',
                effects: { gurken: 15, zufriedenheit: -12, statusAdd: { id: 'steuern', label: '💰 Steuersystem', type: 'good' } },
                result: 'Steuern sind da. Die Kasse klingelt. Die Bürger meckern. Der Finanzminister reibt sich die... also, er ist zufrieden. „Das ist der Anfang einer modernen Volkswirtschaft!" (In einem 6m²-Zimmer. Aber immerhin.)'
            },
            {
                text: '❌ Keine Steuern! Gurkistan ist FREI!',
                effects: { zufriedenheit: 10, memes: 5, gurken: -5 },
                result: '„FREIHEIT!" rufen die Bürger. Der Finanzminister wirft seinen Taschenrechner weg. (Er landet in Skatinga.) Die Freiheit schmeckt süß. Die Staatskasse schmeckt weniger süß.'
            }
        ],
        weight: 1
    },
    {
        id: 'gurken_baby_boom',
        text: '👶 BABY-BOOM! Oder besser: SPROSSEN-BOOM! In Gurkenhain sprießen neue Gurken wie verrückt. 5 neue kleine Gurken in einer Woche! Die Hebammen-Gurke ist überarbeitet. Die Schulen (ein Kronkorken mit „SCHULE" drauf) sind überfüllt.',
        choices: [
            {
                text: '🏫 In Bildung investieren! (−15 Gurken)',
                effects: { gurken: -15, buerger: 5, zufriedenheit: 5 },
                result: 'Neue Schule gebaut! (Zwei Kronkorken, ein Streichholz als Tafel.) Die Kleinen lernen: Verfassung, Meme-Erstellung, und „Warum Gurkistan besser ist als Deutschland". Qualitätsbildung!'
            },
            {
                text: '🤷 Die Natur regelt das schon',
                effects: { buerger: 3, zufriedenheit: -5, gurken: -10 },
                result: 'Drei der fünf Gurken überleben. (Die anderen zwei wandern nach Skatinga, was technisch nicht Auswandern ist, aber sich so anfühlt.) Mehr Bürger bedeutet mehr Verbrauch. Der Pla\'khuun rechnet nervös.'
            }
        ],
        weight: 1
    },
    {
        id: 'verfassungs_reform',
        text: '📜 HISTORISCHER MOMENT! Eine Gruppe Gurken fordert einen neuen Paragraphen: „§8: Jede Gurke hat Recht auf mindestens 0,3m² persönlichen Raum." Bei 6m² und 20 Gurken wäre das... mathematisch unmöglich. Der Finanzminister schwitzt.',
        choices: [
            {
                text: '📐 Paragraph annehmen! Irgendwie wird das schon!',
                effects: { zufriedenheit: 12, gurken: -10, memes: 5 },
                result: 'Der Paragraph wird feierlich unterzeichnet. Sofort beginnt das Chaos: Gurken messen ihren Raum mit Büroklammern ab. Drei Gurken stellen fest, dass sie sich überlappen. Verfassungsklage Nr. 1 läuft!'
            },
            {
                text: '🚫 Ablehnen. Die Mathematik ist eindeutig.',
                effects: { zufriedenheit: -8, memes: 3 },
                result: 'Die Reformer sind enttäuscht. „Seit wann regiert MATHEMATIK Gurkistan?!" — „Seit wir auf 6m² leben, Detlef." Die Debatte geht weiter, aber ohne offiziellen Rahmen. Detlef schmollt.'
            }
        ],
        weight: 1
    },
    {
        id: 'handel_mit_kueche',
        text: '🍳 SENSATION! Fernblick meldet: Von der Küche aus (geschätzte 3 Meter Entfernung) weht der Duft von GEBRATENEN GURKEN herüber. Die Bürger sind gespalten zwischen Entsetzen (KANNIBALISMUS?) und Neugier (riecht eigentlich ganz gut...).',
        choices: [
            {
                text: '😱 Staatstrauer! Gedenkminute!',
                effects: { zufriedenheit: -5, memes: 10, gurken: 0 },
                result: 'Ganz Gurkistan steht still. Eine Minute Schweigen für die gefallenen Gurken-Brüder in der Küche. Der Moment ist ergreifend. Drei Gurken weinen. (Gurken können nicht weinen, aber sie tun so.) Danach wird ein Meme erstellt: „Never Forget. 🥒🍳"'
            },
            {
                text: '🤔 Vielleicht sollten wir Kontakt aufnehmen...',
                effects: { gurken: 10, zufriedenheit: 5, memes: 5 },
                result: 'Eine mutige Handelsexpedition zur Küchen-Grenze! Ergebnis: Jemand hat eine Scheibe Gurke übrig gelassen. Import! Die Ethik-Kommission debattiert wochenlang, ob man das essen darf. (Ergebnis: unklar.)'
            }
        ],
        weight: 1
    },
    {
        id: 'nachts_geraeusche',
        text: '🌙 Seit drei Nächten hören die Bürger GERÄUSCHE. Kratzen. Klopfen. Leises Summen. Die Grenzwacht-Gurke schwört: „Es kommt von UNTER dem Boden!" Die Philosophen sagen: „Der Boden spricht zu uns." Die Pragmatiker sagen: „Das sind Wasserrohre."',
        choices: [
            {
                text: '🔦 Untersuchungskommission bilden!',
                effects: { gurken: -10, zufriedenheit: 5, memes: 5 },
                result: 'Nach ausgiebiger Untersuchung (2 Gurken mit einer Büroklammer als Stethoskop): Es sind Wasserrohre. Die Kommission empfiehlt trotzdem eine „permanente Unterwelt-Überwachung". Man weiß ja nie.'
            },
            {
                text: '🎵 Mitsummen! Wenn der Boden singt, singen wir!',
                effects: { memes: 12, zufriedenheit: 8 },
                result: 'Gurkistan erfindet eine neue Musikrichtung: „Rohr-Core". Die Bürger summen zu den Rohren. Es entsteht ein hypnotischer Rhythmus. Die Meme-Akademie nennt es „die Stimme der Erde". Es ist Klempnerei, aber egal.'
            }
        ],
        weight: 1
    },
    {
        id: 'philosophie_streit',
        text: '📚 Zwei Gurken in Fensterdorf streiten lautstark über die GRUNDLEGENDE FRAGE: „Was kam zuerst — die Gurke oder das Gurkenglas?" Die Debatte eskaliert. Es bilden sich Fraktionen. Familien zerbrechen. (Also, eine Familie. Die einzige.)',
        choices: [
            {
                text: '⚖️ Offizielles Urteil: Die Gurke kam zuerst!',
                effects: { zufriedenheit: 5, memes: 5, buerger: -1 },
                result: 'Die Gurke-zuerst-Fraktion feiert! Die Glas-Fraktion tobt. Eine Gurke wandert aus Protest aus. Der Rest einigt sich darauf, nie wieder darüber zu sprechen. (Sie sprechen am nächsten Tag wieder darüber.)'
            },
            {
                text: '🤷 Jede Gurke darf glauben, was sie will!',
                effects: { zufriedenheit: -3, memes: 8 },
                result: 'Toleranz! Pluralismus! Oder: organisiertes Chaos. Beide Fraktionen gründen eigene Meme-Kanäle. Die Debatte wird zum Content. Der Content wird zum Meme. Der Meme wird zur Identität. Gurkistan in einer Nussschale.'
            }
        ],
        weight: 1
    },
    {
        id: 'singende_heizung',
        text: '🎵 Die Große Heizung in Heizungstal macht neuerdings... Musik? Es klingt wie eine Mischung aus Walgesang und defektem Wasserkocher. Die Pilger sind BEGEISTERT: „Die Heizung SINGT! Es ist ein WUNDER!" Die Techniker-Gurke sagt: „Das ist Kalkablagerung."',
        choices: [
            {
                text: '🎶 Es ist ein Wunder! Konzerte veranstalten!',
                effects: { gurken: 10, zufriedenheit: 10, memes: 10 },
                result: 'Die „Heizungs-Symphonien" werden zum größten kulturellen Event Gurkistans. Eintritt: 1 Gurke. Programm: „Erstes Brummen in B-Moll", „Klonk-Sonate" und der Klassiker „Pfeifen bis Mitternacht". Die Pilger weinen vor Glück.'
            },
            {
                text: '🔧 Entkalken! Bevor was kaputtgeht!',
                effects: { gurken: -15, zufriedenheit: -5 },
                result: 'Die Technik-Gurke entkalkt die Heizung. Die Musik verstummt. Die Pilger sind untröstlich. „IHR HABT DIE STIMME GOTTES ZUM SCHWEIGEN GEBRACHT!" Die Techniker-Gurke rollt mit den Augen. (Gurken haben keine Augen, aber die Absicht ist klar.)'
            }
        ],
        weight: 1
    },
    {
        id: 'wahl',
        text: '🗳️ WAHLTAG IN GURKISTAN! Alle 4 Jahre wird gewählt. Kandidat A: Der amtierende Pla\'khuun (du). Kandidat B: Eine Gurke, die verspricht „mehr Licht, weniger Steuern, und ein Schwimmbad." (Wo? Unklar.) Kandidat C: Gerald der Schimmel.',
        choices: [
            {
                text: '📣 Wahlkampf! Versprich ALLES!',
                effects: { gurken: -15, zufriedenheit: 10, memes: 8 },
                result: 'Du versprichst: 12m² bis 2030, WLAN, und einen Fahrstuhl nach Fernblick. Du gewinnst haushoch. (Gerald bekommt 2 Stimmen.) Die Bürger jubeln. Die Versprechen werden... vertagt.'
            },
            {
                text: '😎 Lass meine Taten sprechen.',
                effects: { zufriedenheit: -5, memes: 3 },
                result: 'Knapper Sieg: 11 zu 7 (Gerald: 2). Die Opposition meckert. Aber du bist weiter der Pla\'khuun. Demokratie schmeckt manchmal nach 51% Zufriedenheit und 49% Beschwerden. Klassiker.'
            }
        ],
        weight: 1
    },
    {
        id: 'mysterioeses_paket',
        text: '📦 Ein mysteriöses Paket ist an der Grenze aufgetaucht. Es ist ungefähr so groß wie ganz Sesslingen. Auf dem Etikett steht: „An: Bewohner, Gurkistan, c/o Niendorf." Die Grenzwacht-Gurke hat es geröntgt (gegen die Lampe gehalten). Inhalt: UNKLAR.',
        choices: [
            {
                text: '🎁 Aufmachen! Was kann schon passieren?',
                effects: { gurken: 25, zufriedenheit: 10, memes: 5 },
                result: 'Es ist eine Tüte Gurkenchips! AUS DEUTSCHLAND! Die Bürger sind gespalten: Geschenk oder Drohung? Einigung: Geschenk. Die Chips werden feierlich verteilt. Gurkistan hat noch nie so gut geschmeckt. (Ist das... Kannibalismus? Die Ethik-Kommission vertagt.)'
            },
            {
                text: '💣 NICHT ÖFFNEN! Könnte eine Falle sein!',
                effects: { zufriedenheit: -5, memes: 8, gurken: -5 },
                result: 'Das Paket wird 40cm vor die Grenze geschoben. „ZURÜCK AN ABSENDER!" Die Bürger spekulieren monatelang über den Inhalt. Die Theorien werden immer wilder. Die beste: „Es war ein zweites Gurkistan. Im Karton." Meta.'
            }
        ],
        weight: 1
    },
    {
        id: 'guerilla_gaertner',
        text: '🌱 Über Nacht sind ÜBERALL in Gurkistan kleine Pflanzensprösslinge aufgetaucht. Zwischen den Kronkorken, neben dem Hocker, sogar AUF der Heizung. Jemand hat heimlich gegärtnert. Die Naturschutz-Gurke jubelt. Die Ordnungshüter-Gurke tobt.',
        choices: [
            {
                text: '🌿 Wunderbar! Gurkistan wird GRÜN!',
                effects: { gurken: 10, zufriedenheit: 8, buerger: 1, statusAdd: { id: 'gaerten', label: '🌿 Stadtgärten', type: 'good' } },
                result: 'Die Sprösslinge werden gepflegt. Gurkistan hat jetzt GÄRTEN! (Winzige. Aber GÄRTEN!) Eine Gurke wird als offizieller Gärtner eingestellt. Die Luft riecht besser. Naja. Anders zumindest.'
            },
            {
                text: '🗑️ Unkraut! Alles rausreißen!',
                effects: { zufriedenheit: -8, memes: 3 },
                result: 'Die Pflanzen werden entfernt. Die Naturschutz-Gurke weint. „IHR HABT MUTTER NATUR BELEIDIGT!" Die Ordnungshüter-Gurke putzt zufrieden. Ordnung muss sein. Auch auf 6m².'
            }
        ],
        weight: 1
    },

    // ============================================
    // BAUPROJEKTE (feuern alle 4-5 Jahre)
    // ============================================
    {
        id: 'build_farm',
        text: '🚜 Die Agrar-Gurke von Gurkenhain hat einen Vorschlag: „Wir könnten eine RICHTIGE Gurkenfarm bauen! Mit System! Bewässerung! Dünger! (Also, feuchtes Küchenpapier und Kaffeesatz.)" Das würde die Gurkenproduktion dauerhaft steigern.',
        choices: [
            {
                text: '🏗️ Gurkenfarm bauen! (−35 Gurken)',
                effects: { gurken: -35, zufriedenheit: 5, statusAdd: { id: 'farm', label: '🚜 Gurkenfarm', type: 'good' } },
                result: 'Die Gurkenfarm steht! Ein Meisterwerk der Agrar-Technik: feuchtes Küchenpapier, strategisch platziert. Die Gurkenproduktion steigt dauerhaft. Die Agrar-Gurke bekommt einen Orden. (Ein Kronkorken mit Stern.)'
            },
            {
                text: '❌ Zu teuer. Die Natur gibt genug.',
                effects: { zufriedenheit: -3 },
                result: 'Die Agrar-Gurke seufzt. „Eines Tages..." Sie kehrt zurück zu ihren Wildgurken. Die Natur gibt, die Natur nimmt. Meistens nimmt sie.'
            }
        ],
        condition: (state) => state.year >= 3 && !state.flags.farm_built,
        weight: 0.5,
        unique: true
    },
    {
        id: 'build_akademie',
        text: '🎓 Die Meme-Akademie platzt aus allen Nähten! Der Rektor (eine Gurke mit Brille und Cordhose) beantragt eine Erweiterung: „Die MEME-UNIVERSITÄT GURKISTAN! Mit Hörsaal! (Ein Kronkorken.) Und Bibliothek! (Zwei Kronkorken.)" Die Bildung ruft!',
        choices: [
            {
                text: '🏛️ Meme-Universität gründen! (−30 Gurken)',
                effects: { gurken: -30, memes: 10, zufriedenheit: 5, statusAdd: { id: 'uni', label: '🎓 Meme-Universität', type: 'good' } },
                result: 'Die Meme-Universität ist eröffnet! Erster Studiengang: „Angewandte Memeologie". Erster Absolvent: Eine Gurke, die ihren Abschluss zum Meme macht. Der Kreislauf des Lebens.'
            },
            {
                text: '❌ Die Akademie reicht völlig.',
                effects: { zufriedenheit: -3, memes: -2 },
                result: 'Der Rektor nimmt die Cordhose ab. (Metaphorisch. Er hat keine Beine.) Die Akademie bleibt, was sie ist: ein Kronkorken mit Ambitionen.'
            }
        ],
        condition: (state) => state.year >= 6 && !state.flags.uni_built,
        weight: 0.5,
        unique: true
    },
    {
        id: 'build_kurhaus',
        text: '🏨 Bad Boden möchte expandieren! „Ein ECHTES Kurhaus! Mit Wellnessbereich! (Ein feuchtes Tuch.) Und Sauna! (Die Heizung, nah dran.)" Der Gesundheitsminister (eine Gurke mit Pflaster) befürwortet es wärmstens.',
        choices: [
            {
                text: '🏗️ Kurhaus bauen! (−40 Gurken)',
                effects: { gurken: -40, zufriedenheit: 10, statusAdd: { id: 'kurhaus', label: '🏨 Kurhaus', type: 'good' } },
                result: 'Das Kurhaus ist OFFEN! Anwendungen: „Heißes Heizungsluft-Bad", „Fensterblick-Meditation" und der Klassiker „Einfach mal hinsetzen". Die Zufriedenheit steigt dauerhaft. Bad Boden ist jetzt ein Kurort von Weltklasse. (6m²-Weltklasse.)'
            },
            {
                text: '❌ Zu teurer Luxus für eine 6m²-Nation.',
                effects: { zufriedenheit: -5 },
                result: 'Die Bürger grummeln. „Selbst Liechtenstein hat Wellness." Der Gesundheitsminister klebt sich ein zweites Pflaster auf. Aus Protest.'
            }
        ],
        condition: (state) => state.year >= 10 && !state.flags.kurhaus_built,
        weight: 0.5,
        unique: true
    },
    {
        id: 'build_festung',
        text: '🏰 Der Verteidigungsminister (die Grenzwacht-Gurke mit einem dritten Kronkorken als Helm) fordert: „FESTUNG GURKISTAN! Ein Schutzwall um die gesamte Nation! Aus Büroklammern, Kronkorken und ENTSCHLOSSENHEIT!" Die Baukosten wären enorm. Aber die Sicherheit...',
        choices: [
            {
                text: '🏰 Festung bauen! (−50 Gurken)',
                effects: { gurken: -50, zufriedenheit: 8, memes: 5, statusAdd: { id: 'festung', label: '🏰 Festung', type: 'good' } },
                result: 'Die Festung steht! 4mm hoch. Aus 47 Büroklammern und viel Hoffnung. Deutschland bemerkt nichts. Aber die Bürger fühlen sich SICHER. Die Grenzwacht-Gurke weint vor Stolz. (Metaphorisch.)'
            },
            {
                text: '❌ Gurkistan braucht Brücken, keine Mauern.',
                effects: { zufriedenheit: -3, memes: 5 },
                result: '„Brücken? WOHIN?! Wir sind UMZINGELT!" Der Verteidigungsminister ist empört. Aber der Spruch wird zum Meme. „Gurkistan braucht Brücken, keine Mauern." Steht jetzt auf T-Shirts. (Kronkorken-großen T-Shirts.)'
            }
        ],
        condition: (state) => state.year >= 15 && !state.flags.festung_built,
        weight: 0.5,
        unique: true
    },
];

// --- HILFSFUNKTIONEN ---

// Zufallszahl zwischen min und max (inklusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ressource clampen
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
