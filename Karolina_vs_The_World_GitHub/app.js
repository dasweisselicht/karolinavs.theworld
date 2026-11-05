(() => {
  const german = window.LESSONS.german;
  const english = window.LESSONS.english;
  const georgian = window.LESSONS.georgian;
  const $ = (id) => document.getElementById(id);
  const tr = (text) => window.KVW_I18N?.t(text) || text;

  function bindDeck(prefix, words, options = {}) {
    let index = 0;
    let mode = "cards";
    let questionIndex = 0;
    let score = 0;
    let answered = false;
    const card = $(prefix + "-card");
    const count = $(prefix + "-count");
    const progress = $(prefix + "-progress");
    const modes = options.modes || ["cards", "quiz"];

    function renderCard() {
      const item = words[index];
      card.classList.remove("flipped");
      $(prefix + "-word").textContent = item.word;
      $(prefix + "-word").setAttribute("lang", prefix === "ka" ? "ka" : prefix === "en" ? "en" : "de");
      $(prefix + "-word").setAttribute("dir", "ltr");
      $(prefix + "-pronunciation").textContent = tr(item.pronunciation);
      $(prefix + "-answer").textContent = tr(item.answer);
      $(prefix + "-example").textContent = tr(item.example);
      $(prefix + "-example-translation").textContent = tr(item.translation);
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(words.length).padStart(2, "0")}`;
      progress.style.width = `${((index + 1) / words.length) * 100}%`;
    }

    card.addEventListener("click", () => card.classList.toggle("flipped"));
    $(prefix + "-next").addEventListener("click", () => { index = (index + 1) % words.length; renderCard(); });
    $(prefix + "-prev").addEventListener("click", () => { index = (index - 1 + words.length) % words.length; renderCard(); });

    function setMode(nextMode) {
      mode = nextMode;
      const cardMode = nextMode === "cards";
      const quizMode = nextMode === "quiz";
      $(prefix + "-card-wrap").hidden = !cardMode;
      $(prefix + "-card-controls").hidden = !cardMode;
      $(prefix + "-quiz").hidden = !quizMode;
      $(prefix + "-quiz-controls").hidden = !quizMode;
      if (prefix === "ka") {
        $("ka-match").hidden = nextMode !== "match";
        $("ka-match-controls").hidden = nextMode !== "match";
        $("ka-mode-label").textContent = tr(nextMode === "cards" ? "КАРТОЧКИ" : nextMode === "match" ? "НАЙДИ ПАРУ" : "ВИКТОРИНА");
        $("ka-session-title").textContent = tr(nextMode === "cards" ? "Первые слова" : nextMode === "match" ? "Слова и значения" : "Проверь себя");
        if (nextMode === "match") renderMatch();
      } else {
        $(prefix + "-mode-label").textContent = tr(cardMode ? "КАРТОЧКИ" : "МИНИ-ВИКТОРИНА");
        $(prefix + "-session-title").textContent = tr(cardMode ? (prefix === "en" ? "Starter vocabulary" : "Слова из рассказа") : "Проверь себя");
      }
      if (quizMode) renderQuestion();
      modes.forEach((m) => {
        const panelId = prefix === "ka" ? "georgian-panel" : prefix === "en" ? "english-panel" : "german-panel";
        const button = document.querySelector(`[data-mode="${m}"][aria-controls='${panelId}']`);
        if (button) { button.classList.toggle("active", m === nextMode); button.setAttribute("aria-selected", String(m === nextMode)); }
      });
    }

    function renderQuestion() {
      const set = words;
      questionIndex = Math.floor(Math.random() * set.length);
      answered = false;
      const item = set[questionIndex];
      const questionEl = $(prefix + "-question");
      questionEl.textContent = tr(prefix === "ka" ? "Что означает «{word}»?" : "Как переводится «{word}»?").replace("{word}", item.word);
      $(prefix + "-score").textContent = tr("Верно: {score}").replace("{score}", score);
      const correct = tr(item.answer);
      const distractors = set.filter((x, i) => i !== questionIndex).sort(() => Math.random() - .5).slice(0, 3).map((x) => tr(x.answer));
      const answers = [correct, ...distractors].sort(() => Math.random() - .5);
      const holder = $(prefix + "-options");
      holder.replaceChildren();
      $(prefix + "-feedback").textContent = "";
      $(prefix + "-feedback").classList.remove("error");
      answers.forEach((answer) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = answer;
        button.addEventListener("click", () => {
          if (answered) return;
          answered = true;
          const isCorrect = answer === correct;
          button.classList.add(isCorrect ? "correct" : "incorrect");
          $(prefix + "-feedback").textContent = isCorrect ? tr("Верно! Так держать ✦") : tr("Почти. Правильный ответ: {answer}").replace("{answer}", correct);
          $(prefix + "-feedback").classList.toggle("error", !isCorrect);
          if (isCorrect) score++;
          $(prefix + "-score").textContent = tr("Верно: {score}").replace("{score}", score);
        });
        holder.append(button);
      });
    }

    function renderMatch() {
      const sample = georgian.slice(0, 8).sort(() => Math.random() - .5);
      const left = [...sample].sort(() => Math.random() - .5);
      const right = [...sample].sort(() => Math.random() - .5);
      const holder = $("ka-match-grid");
      const feedback = $("ka-match-feedback");
      holder.replaceChildren();
      feedback.textContent = "";
      feedback.classList.remove("error");
      let selected = null;
      let matched = 0;
      const makeButton = (item, side, label) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "match-option";
        button.textContent = side === "answer" ? tr(item.answer) : label;
        button.dataset.key = item.word;
        button.dataset.side = side;
        button.setAttribute("aria-label", side === "word" ? `${tr("Грузинское слово")} ${item.word}` : `${tr("Перевод")} ${tr(item.answer)}`);
        button.addEventListener("click", () => {
          if (button.classList.contains("matched")) return;
          if (!selected) { selected = button; button.classList.add("selected"); return; }
          if (selected === button) { button.classList.remove("selected"); selected = null; return; }
          if (selected.dataset.key === button.dataset.key && selected.dataset.side !== button.dataset.side) {
            selected.classList.remove("selected"); selected.classList.add("matched"); button.classList.add("matched"); matched += 1; selected = null;
            if (matched === sample.length) feedback.textContent = tr("ყველაფერი სწორია! Отличная работа! ✦");
          } else {
            const previous = selected;
            previous.classList.remove("selected"); previous.classList.add("wrong"); button.classList.add("wrong");
            feedback.textContent = tr("Попробуй ещё раз"); feedback.classList.add("error");
            setTimeout(() => { previous.classList.remove("wrong"); button.classList.remove("wrong"); feedback.textContent = ""; feedback.classList.remove("error"); }, 650);
            selected = null;
          }
        });
        return button;
      };
      left.forEach((item) => holder.append(makeButton(item, "word", item.word)));
      right.forEach((item) => holder.append(makeButton(item, "answer", item.answer)));
    }

    modes.forEach((m) => {
      const panelId = prefix === "ka" ? "georgian-panel" : prefix === "en" ? "english-panel" : "german-panel";
      const button = document.querySelector(`[data-mode="${m}"][aria-controls='${panelId}']`);
      button.addEventListener("click", () => setMode(m));
    });
    if (options.newMatch) $("ka-new-match").addEventListener("click", renderMatch);
    $(prefix + "-next-question").addEventListener("click", renderQuestion);
    renderCard();
    setMode("cards");
    return { get mode() { return mode; }, flip: () => { if (mode === "cards") card.classList.toggle("flipped"); }, refresh: () => { setMode(mode); if (mode === "cards") renderCard(); } };
  }

  const germanDeck = bindDeck("german", german);
  const englishDeck = bindDeck("en", window.LESSONS.english);
  const georgianDeck = bindDeck("ka", georgian, { modes: ["cards", "match", "quiz"], newMatch: true });
  document.addEventListener("kvw:languagechange", () => { germanDeck.refresh(); englishDeck.refresh(); georgianDeck.refresh(); });
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.target.closest("button, a, input, textarea, select")) return;
    event.preventDefault();
    if (location.hash === "#georgian") georgianDeck.flip(); else if (location.hash === "#english") englishDeck.flip(); else germanDeck.flip();
  });

  const menuButton = $("site-nav") && document.querySelector(".menu-toggle");
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    $("site-nav").classList.toggle("open", open);
  });
  $("site-nav").querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    $("site-nav").classList.remove("open");
  }));

  const resources = window.LESSONS.resources;
  const grammar = window.LESSONS.grammar;
  const conjugations = {
    de: [
      { verb: "haben", gloss: "иметь", forms: ["habe", "hast", "hat", "haben", "habt", "haben"] },
      { verb: "sein", gloss: "быть", forms: ["bin", "bist", "ist", "sind", "seid", "sind"] },
      { verb: "wollen", gloss: "хотеть", forms: ["will", "willst", "will", "wollen", "wollt", "wollen"] }
    ],
    en: [
      { verb: "have", gloss: "иметь", forms: ["have", "have", "has", "have", "have", "have"] },
      { verb: "be", gloss: "быть", forms: ["am", "are", "is", "are", "are", "are"] },
      { verb: "want", gloss: "хотеть", forms: ["want", "want", "wants", "want", "want", "want"] }
    ],
    ka: [
      { verb: "ქონა", gloss: "иметь", forms: ["მაქვს", "გაქვს", "აქვს", "გვაქვს", "გაქვთ", "აქვთ"] },
      { verb: "ყოფნა", gloss: "быть", forms: ["ვარ", "ხარ", "არის", "ვართ", "ხართ", "არიან"] },
      { verb: "სურვილი · მინდა", gloss: "хотеть", forms: ["მინდა", "გინდა", "უნდა", "გვინდა", "გინდათ", "უნდათ"] }
    ]
  };
  const persons = ["я", "ты", "он / она", "мы", "вы", "они"];
  function verbsMarkup(area) {
    const rows = conjugations[area.key].map((item) => `<article class="verb-card"><div class="verb-title"><h3 lang="${area.key}">${item.verb}</h3><span>${tr(item.gloss)}</span></div><div class="verb-table-wrap"><table class="verb-table"><thead><tr><th>${tr("Лицо")}</th><th>${tr("Форма")}</th></tr></thead><tbody>${item.forms.map((form, index) => `<tr><th scope="row">${tr(persons[index])}</th><td lang="${area.key}">${form}</td></tr>`).join("")}</tbody></table></div></article>`).join("");
    const note = area.key === "ka" ? tr("В грузинском «хотеть» строится по особой модели: буквально «мне хочется», поэтому формы отличаются от обычного спряжения.") : area.key === "en" ? tr("В настоящем времени у have и want форма меняется в третьем лице единственного числа; be имеет особые формы.") : tr("Wollen — модальный глагол: в единственном числе меняется корневая гласная, а в первом и третьем лице нет личного окончания.");
    return `<div class="verbs-intro"><p>${tr("Формы настоящего времени")}</p><span>${tr("Личные местоимения и формы глаголов")}</span></div><div class="verb-grid">${rows}</div><p class="verb-note">✦ ${note}</p>`;
  }
  function grammarMarkup(area) {
    return `<div class="grammar-guide"><div class="verbs-intro"><p>${tr("Краткий справочник")}</p><span>${tr("Основные правила с примерами")}</span></div><div class="grammar-guide-grid">${grammar[area.key].map((item, index) => `<article class="grammar-guide-card"><span class="grammar-index">${String(index + 1).padStart(2, "0")}</span><h3>${tr(item.title)}</h3><p>${tr(item.detail)}</p></article>`).join("")}</div></div>`;
  }
  function readerMarkup(reader) {
    const aliases = { "wohnt": "wohnen", "arbeitet": "arbeiten", "kundinnen": "Kundin", "bekommt": "bekommen", "bekam": "bekommen", "bekommen": "bekommen", "bringt": "bringen", "vertraut": "anvertrauen", "steigt": "einsteigen", "bietet": "anbieten", "fahrgäste": "Fahrgast", "beobachtet": "beobachten", "prüft": "prüfen", "schläft": "einschlafen", "aufwacht": "aufwachen", "bemerkt": "bemerken", "verschwunden": "verschwinden", "vermutet": "vermuten", "verdächtigen": "Verdächtige", "sucht": "suchen", "entdeckt": "entdecken", "läuft": "nachlaufen",
      "sagte":"sagen","sagten":"sagen","sagt":"sagen","meinte":"meinen","meint":"meinen","nahm":"nehmen","nimmt":"nehmen","nimm":"nehmen","lief":"laufen","läuft":"laufen","saß":"sitzen","saßen":"sitzen","hielt":"halten","hält":"halten","goss":"gießen","begann":"beginnen","begonnen":"beginnen","fragte":"fragen","fragten":"fragen","antwortete":"antworten","antworteten":"antworten","fuhr":"fahren","fährt":"fahren","gefahren":"fahren","blieb":"bleiben","blieben":"bleiben","kennt":"kennen","kannte":"kennen","wollte":"wollen","wollten":"wollen","verdient":"verdienen","verdiente":"verdienen","holt":"holen","holte":"holen","treffen":"treffen","trafen":"treffen","gefiel":"gefallen","wissen":"wissen","weiß":"wissen","wusste":"wissen","musste":"müssen","muss":"müssen","niest":"niesen","mussten":"müssen","kommt":"kommen","kam":"kommen","kamen":"kommen","macht":"machen","machte":"machen","machten":"machen","zieht":"ziehen","zog":"ziehen","zogst":"ziehen","liegt":"liegen","lag":"liegen","lagen":"liegen","erkundigte":"sich erkundigen","verschwand":"verschwinden","verschwandet":"verschwinden","hatte":"haben","hatten":"haben","hast":"haben","habt":"haben","ist":"sein","sind":"sein","war":"sein","waren":"sein","bin":"sein","sind":"sein","erschoss":"erschießen","erschieße":"erschießen","vergaß":"vergessen","vergiss":"vergessen","vergesse":"vergessen","packte":"packen","packten":"packen","gibt":"geben","gab":"geben","gaben":"geben","kann":"können","konnte":"können","konnten":"können","legt":"legen","legte":"legen","dürfen":"dürfen","rechnete":"rechnen","rechnet":"rechnen","fehlten":"fehlen","fehlt":"fehlen","schickte":"schicken","geschickt":"schicken","behält":"behalten","behielt":"behalten","kaufte":"kaufen","kauft":"kaufen","bezahlst":"bezahlen","bezahlt":"bezahlen","trinkt":"trinken","steckte":"stecken","steckt":"stecken","verlor":"verlieren","verlierst":"verlieren","kletterte":"klettern","kletterten":"klettern","erzählte":"erzählen","erzähle":"erzählen","trägt":"tragen","trug":"tragen","frisierte":"frisieren","schlief":"schlafen","schliefen":"schlafen","kochte":"kochen","wischte":"wischen","schlafe":"schlafen","steht":"stehen","stand":"stehen","standen":"stehen","begreift":"begreifen","lacht":"lachen","lachten":"lachen","liebt":"lieben","liebte":"lieben","entschlossen":"entschließen","entschloss":"entschließen","fiel":"fallen","fällt":"fallen","zurückzahlen":"zurückzahlen","rief":"rufen","ruft":"rufen","stiegen":"steigen","stieg":"steigen","steige":"steigen","ausstieg":"aussteigen","ausgestiegen":"aussteigen","warteten":"warten","wartet":"warten","setzte":"setzen","setzt":"setzen","winkte":"winken","winkt":"winken","beschreiben":"beschreiben","klopfte":"klopfen","klopft":"klopfen","öffnete":"öffnen","weinte":"weinen","weint":"weinen","gespart":"sparen","sparte":"sparen","stahl":"stehlen","stiehlt":"stehlen","presste":"pressen","meldete":"melden","wanderten":"wandern","wandert":"wandern","sah":"sehen","sieht":"sehen","setzte":"setzen","erblickte":"erblicken","erblickt":"erblicken","rannte":"rennen","rennt":"rennen","schleppte":"schleppen","schleppt":"schleppen","schien":"scheinen","knurrte":"knurren","gab":"geben","gabst":"geben","nickte":"nicken","nicken":"nicken","ging":"gehen","gingen":"gehen","gegangen":"gehen","drehte":"drehen","drehte":"drehen","bewegte":"bewegen","bewegte":"bewegen","starrte":"starren","starrt":"starren","schnarchte":"schnarchen","betrachtete":"betrachten","erschrak":"erschrecken","erschreckt":"erschrecken","kniff":"kneifen","kneifen":"kneifen","vorstellen":"vorstellen","stellte":"stellen","wusste":"wissen","boxen":"boxen","kriegt":"kriegen","kriegst":"kriegen","zurückdenke":"zurückdenken","erklärt":"erklären","hörte":"hören","hörten":"hören","befühlte":"befühlen","beruhigt":"beruhigen","lächelten":"lächeln","lächelt":"lächeln","verteilt":"verteilen","legte":"legen","verstand":"verstehen","fasst":"fassen","zählte":"zählen","zählt":"zählen","überlegte":"überlegen","aufwachte":"aufwachen","zitterten":"zittern","rührte":"rühren","griff":"greifen","drückte":"drücken","blutete":"bluten","wickelte":"wickeln","zurückhielt":"zurückhalten","stehen":"stehen","kostet":"kosten","kostete":"kosten","vorbeifahren":"vorbeifahren","suchen":"suchen","vergaß":"vergessen","hob":"heben","stolperte":"stolpern","stieß":"stoßen","dazwischenkam":"dazwischenkommen",
      "köpfe":"Kopf","haare":"Haar","straßen":"Straße","autos":"Auto","kinder":"Kind","hemden":"Hemd","strümpfe":"Strumpf","schuhe":"Schuh","sorgen":"Sorge","blumen":"Blume","tanten":"Tante","scheine":"Schein","taschen":"Tasche","briefe":"Brief","vater":"Vater","rechnungen":"Rechnung","kohlen":"Kohle","bücher":"Buch","medikamente":"Medikament","fußböden":"Fußboden","städte":"Stadt","bahnen":"Bahn","wagen":"Wagen","zügel":"Zügel","pferde":"Pferd","fahrgäste":"Fahrgast","haltestellen":"Haltestelle","fahrkarten":"Fahrkarte","bahnsteige":"Bahnsteig","wurstbrote":"Wurstbrot","mütter":"Mutter","türen":"Tür","bäume":"Baum","felder":"Feld","fabriken":"Fabrik","kühe":"Kuh","bauern":"Bauer","beine":"Bein","knöpfe":"Knopf","finger":"Finger","tränen":"Träne","häuser":"Haus","villen":"Villa","schornsteine":"Schornstein","gepäckträger":"Gepäckträger","menschen":"Mensch","treppen":"Treppe" };
    const articleGender = { der: "мужской род", die: "женский род", das: "средний род" };
    const nounPlurals = { "der Umschlag": "die Umschläge", "die Mutter": "die Mütter", "die Kundin": "die Kundinnen", "der Auftrag": "die Aufträge", "die Großmutter": "die Großmütter", "die Reise": "die Reisen", "der Koffer": "die Koffer", "die Fahrkarte": "die Fahrkarten", "der Zug": "die Züge", "der Mitreisende": "die Mitreisenden", "der Fahrgast": "die Fahrgäste", "der Verdächtige": "die Verdächtigen", "der Hut": "die Hüte", "der Bahnhof": "die Bahnhöfe" };
    const contextualForms = { "Umschlag": "Akkusativ · Singular", "Kundinnen": "Genitiv · Plural", "Fahrgäste": "Akkusativ · Plural", "Verdächtigen": "Akkusativ · Singular" };
    function annotate(text) {
      const vocab = reader.vocabulary;
      const extraWords = {
        "die Frau": "женщина; госпожа", "der Kopf": "голова", "das Waschbecken": "раковина", "die Frisur": "причёска", "das Haar": "волосы", "die Seife": "мыло", "die Küche": "кухня", "die Stube": "комната", "der Junge": "мальчик", "die Ferien": "каникулы", "die Schwester": "сестра", "der Mann": "мужчина; муж", "die Post": "почта", "die Straße": "улица", "das Kind": "ребёнок", "der Anzug": "костюм", "das Hemd": "рубашка", "der Strumpf": "чулок; носок", "der Schnürsenkel": "шнурок", "das Bett": "кровать", "das Geld": "деньги", "der Koffer": "чемодан", "die Blume": "цветок", "die Tante": "тётя", "der Schrank": "шкаф", "der Blechkasten": "жестяная коробка", "der Schein": "денежная купюра", "die Mark": "марка (денежная единица)", "die Tasche": "карман; сумка", "der Briefumschlag": "конверт", "das Kuvert": "конверт", "der Vater": "отец", "die Rechnung": "счёт", "die Kohle": "уголь", "die Miete": "арендная плата", "die Kleidung": "одежда", "das Buch": "книга", "das Schulgeld": "плата за обучение", "der Doktor": "врач", "das Medikament": "лекарство", "der Fußboden": "пол", "der Musterknabe": "примерный мальчик", "das Lob": "похвала", "die Freude": "радость", "der Bahnhof": "вокзал", "die Pferdebahn": "конка; конный трамвай", "die Straßenbahn": "трамвай", "das Pferd": "лошадь", "der Wagenführer": "вагоновожатый", "der Zügel": "поводья", "die Peitsche": "кнут", "der Fahrgast": "пассажир", "der Schaffner": "кондуктор", "die Haltestelle": "остановка", "der Bahnhofplatz": "вокзальная площадь", "der Schalter": "касса; окошко", "die Fahrkarte": "билет", "die Bahnsteigkarte": "билет на платформу", "der Bahnsteig": "платформа", "der Fußboden": "пол", "das Wurstbrot": "бутерброд с колбасой", "der Zug": "поезд", "die Mutter": "мать", "das Taschentuch": "носовой платок", "der Personenzug": "пассажирский поезд", "das Abteil": "купе", "der Zugführer": "начальник поезда", "die Wagentür": "дверь вагона", "die Lokomotive": "локомотив", "die Zeitung": "газета", "die Schokolade": "шоколад", "der Nachbar": "сосед", "der Dieb": "вор", "der Mörder": "убийца", "die Mitreisende": "попутчица", "der Hut": "шляпа", "das Stadtviertel": "городской район", "das Postamt": "почтамт", "die Kiste": "ящик", "der Rohrpostbrief": "пневматическое письмо", "die Bank": "банк; скамья", "das Gehirn": "мозг", "das Pfand": "залог", "die Ecke": "угол", "der Bahnhof": "вокзал", "die Toilette": "туалет", "die Nadel": "игла; булавка", "das Anzugfutter": "подкладка костюма", "das Fenster": "окно", "der Baum": "дерево", "die Windmühle": "ветряная мельница", "das Feld": "поле", "die Fabrik": "фабрика", "die Kuh": "корова", "der Bauer": "крестьянин", "der Schnurrbart": "усы", "die Falte": "морщина", "das Ohr": "ухо", "das Bein": "нога", "die Geschichtsstunde": "урок истории", "das Gesicht": "лицо", "das Papiergewicht": "весовая категория до полусредней", "der Uppercut": "апперкот", "der Knopf": "пуговица", "die Bewegung": "движение", "der Boden": "пол; земля", "das Herz": "сердце", "die Angst": "страх", "der Finger": "палец", "das Blut": "кровь", "die Träne": "слеза", "der Pfennig": "пфенниг", "die Notbremse": "стоп-кран", "der Schaffner": "кондуктор", "das Dienstabteil": "служебное купе", "der Bummelzug": "пригородный поезд", "der Berg": "гора", "das Haus": "дом", "die Villa": "вилла", "der Schornstein": "дымоход", "das Gepäcknetz": "багажная полка", "der Jackenaufschlag": "отворот пиджака", "der Gepäckträger": "носильщик", "das Schild": "табличка; знак", "der Ausgang": "выход", "die Menschenmenge": "толпа", "die Treppe": "лестница",
        "sagen": "говорить; сказать", "bringen": "приносить", "nehmen": "брать", "spazieren": "прогуливаться", "laufen": "бежать; ходить", "halten": "держать; останавливаться", "sitzen": "сидеть", "gießen": "лить", "waschen": "мыть", "fragen": "спрашивать", "antworten": "отвечать", "fahren": "ехать", "bleiben": "оставаться", "kennen": "знать; быть знакомым", "einladen": "приглашать", "verdienen": "зарабатывать", "mitfahren": "ехать вместе", "holen": "забирать; приводить", "treffen": "встречаться", "gefallen": "нравиться", "wissen": "знать", "müssen": "быть должным", "niesen": "чихать", "kommen": "приходить", "machen": "делать", "anziehen": "надевать", "essen": "есть", "liegen": "лежать", "ziehen": "тянуть; надевать", "sich erkundigen": "спрашивать; осведомляться", "verschwinden": "исчезать", "wollen": "хотеть", "haben": "иметь", "erschießen": "застрелить", "vergessen": "забывать", "aufhängen": "вешать", "packen": "упаковывать", "geben": "давать", "können": "мочь", "legen": "класть", "dürfen": "иметь разрешение", "rechnen": "считать", "fehlen": "недоставать", "schicken": "отправлять", "behalten": "оставлять себе", "kaufen": "покупать", "bezahlen": "оплачивать", "trinken": "пить", "stecken": "застревать; класть", "verlieren": "терять", "klettern": "взбираться; садиться в транспорт", "erzählen": "рассказывать", "tragen": "нести", "arbeiten": "работать", "frisieren": "делать причёску", "schlafen": "спать", "kochen": "готовить", "wischen": "вытирать; мыть пол", "aufstehen": "вставать", "begreifen": "понимать", "lachen": "смеяться", "lieben": "любить", "entschließen": "решаться", "fallen": "падать", "zurückzahlen": "возвращать деньги", "rufen": "звать; кричать", "steigen": "подниматься; садиться", "aussteigen": "выходить (из транспорта)", "warten": "ждать", "setzen": "сажать; садиться", "winken": "махать рукой", "beschreiben": "описывать", "klopfen": "стучать", "öffnen": "открывать", "weinen": "плакать", "sparen": "копить", "stehlen": "красть", "pressen": "сжимать", "ziehen": "тянуть", "melden": "сообщать", "holen": "доставать; приносить", "setzen": "ставить; сажать", "erblicken": "замечать", "rennen": "бежать", "schleppen": "тащить", "scheinen": "казаться", "knurren": "рычать; ворчать", "abgeben": "сдавать; отдавать", "nicken": "кивать", "fortgehen": "уходить", "drehen": "поворачивать", "bewegen": "двигать", "starren": "пристально смотреть", "schnarchen": "храпеть", "betrachten": "рассматривать", "erschrecken": "пугаться", "zusteigen": "садиться в транспорт", "kneifen": "щипать", "vorstellen": "представлять", "boxen": "боксировать", "kriegen": "получать; поймать", "zurückdenken": "вспоминать", "erklären": "объяснять", "hören": "слышать", "befühlen": "ощупывать", "beruhigen": "успокаивать", "lächeln": "улыбаться", "verteilen": "раздавать", "weglegen": "откладывать", "verstehen": "понимать", "fassen": "трогать; хватать", "zählen": "считать", "überlegen": "обдумывать", "aufwachen": "просыпаться", "zittern": "дрожать", "rühren": "двигаться", "greifen": "хватать", "drücken": "нажимать", "bluten": "кровоточить", "wickeln": "обматывать", "zurückhalten": "сдерживать", "ziehen": "тянуть", "stehen bleiben": "останавливаться", "kosten": "стоить", "laufen": "бежать", "wandern": "проходить; двигаться", "aussehen": "выглядеть", "abkratzen": "соскребать", "liegen": "лежать", "aushalten": "выдерживать", "langsamer werden": "замедляться", "vorbeifahren": "проезжать мимо", "suchen": "искать", "vergessen": "забывать", "aufheben": "поднимать", "stolpern": "спотыкаться", "stoßen": "сталкиваться", "dazwischenkommen": "вмешиваться"
      };
      Object.entries(extraWords).forEach(([lemma, translation]) => {
        const key = /^(der|die|das) /.test(lemma) ? lemma : lemma;
        if (!vocab[key]) vocab[key] = { translation, ipa: "" };
      });
      Object.assign(vocab, { "der Brief": { translation: "письмо", ipa: "bʁiːf" }, "das Auto": { translation: "автомобиль", ipa: "ˈaʊ̯to" }, "der Schuh": { translation: "ботинок", ipa: "ʃuː" }, "die Stadt": { translation: "город", ipa: "ʃtat" }, "die Tür": { translation: "дверь", ipa: "tyːɐ̯" }, "der Mensch": { translation: "человек", ipa: "mɛnʃ" }, "die Bahn": { translation: "поезд; трамвай", ipa: "baːn" }, "das Wasser": { translation: "вода", ipa: "ˈvasɐ" }, "der Krug": { translation: "кувшин", ipa: "kʁuːk" }, "die Flasche": { translation: "бутылка", ipa: "ˈflaʃə" }, "die Blume": { translation: "цветок", ipa: "ˈbluːmə" }, "die Träne": { translation: "слеза", ipa: "ˈtʁɛːnə" }, "die Frau": { translation: "женщина; госпожа", ipa: "fʁaʊ̯" }, "sein": { translation: "быть", ipa: "zaɪ̯n" }, "werden": { translation: "становиться", ipa: "ˈveːɐ̯dən" }, "sollen": { translation: "быть должным", ipa: "ˈzɔlən" }, "mögen": { translation: "нравиться; хотеть", ipa: "ˈmøːɡən" }, "aufbinden": { translation: "подвязывать; закалывать", ipa: "ˈaʊ̯fˌbɪndən" }, "binden": { translation: "связывать", ipa: "ˈbɪndən" }, "beginnen": { translation: "начинать", ipa: "bəˈɡɪnən" }, "schenken": { translation: "дарить", ipa: "ˈʃɛŋkən" }, "schreiben": { translation: "писать", ipa: "ˈʃʁaɪ̯bən" }, "reden": { translation: "разговаривать", ipa: "ˈʁeːdən" }, "klappen": { translation: "хлопать", ipa: "ˈklapən" }, "rücken": { translation: "двигать; трогаться", ipa: "ˈʁʏkən" }, "reden": { translation: "разговаривать", ipa: "ˈʁeːdən" }, "blicken": { translation: "смотреть", ipa: "ˈblɪkən" }, "reichen": { translation: "передавать", ipa: "ˈʁaɪ̯çən" }, "knistern": { translation: "шуршать", ipa: "ˈknɪstɐn" }, "stellen": { translation: "ставить", ipa: "ˈʃtɛlən" }, "beugen": { translation: "наклонять", ipa: "ˈbɔɪ̯ɡən" }, "wagen": { translation: "осмеливаться", ipa: "ˈvaːɡən" }, "helfen": { translation: "помогать", ipa: "ˈhɛlfən" }, "schütteln": { translation: "трясти", ipa: "ˈʃʏtələn" }, "schieben": { translation: "толкать", ipa: "ˈʃiːbən" }, "heben": { translation: "поднимать", ipa: "ˈheːbən" }, "reichen": { translation: "передавать", ipa: "ˈʁaɪ̯çən" }, "sehen": { translation: "видеть", ipa: "ˈzeːən" }, "lesen": { translation: "читать", ipa: "ˈleːzən" }, "denken": { translation: "думать", ipa: "ˈdɛŋkən" }, "tun": { translation: "делать", ipa: "tuːn" }, "zeigen": { translation: "показывать", ipa: "ˈtsaɪ̯ɡən" }, "geben": { translation: "давать", ipa: "ˈɡeːbən" }, "helfen": { translation: "помогать", ipa: "ˈhɛlfən" }, "sollen": { translation: "быть должным", ipa: "ˈzɔlən" }, "stehen": { translation: "стоять", ipa: "ˈʃteːən" }, "schreiben": { translation: "писать", ipa: "ˈʃʁaɪ̯bən" }, "verlieren": { translation: "терять", ipa: "fɛɐ̯ˈliːʁən" }, "schenken": { translation: "дарить", ipa: "ˈʃɛŋkən" }, "abgeben": { translation: "сдавать; отдавать", ipa: "ˈapˌɡeːbən" }, "heben": { translation: "поднимать", ipa: "ˈheːbən" }, "stoßen": { translation: "сталкиваться", ipa: "ˈʃtoːsən" }, "denken": { translation: "думать", ipa: "ˈdɛŋkən" }, "werden": { translation: "становиться", ipa: "ˈveːɐ̯dən" } });
      Object.assign(aliases, { "bekamen":"bekommen", "genommen":"nehmen", "aufgebunden":"aufbinden", "gebunden":"binden", "gehalten":"halten", "getroffen":"treffen", "gegeben":"geben", "gelegt":"legen", "gezogen":"ziehen", "gefragt":"fragen", "gearbeitet":"arbeiten", "geliebt":"lieben", "geblieben":"bleiben", "gelaufen":"laufen", "geweint":"weinen", "gestohlen":"stehlen", "gestanden":"stehen", "gewartet":"warten", "gestiegen":"steigen", "gerufen":"rufen", "beschrieben":"beschreiben", "geholfen":"helfen", "gedacht":"denken", "gezeigt":"zeigen", "geöffnet":"öffnen", "gelegen":"liegen", "gegriffen":"greifen", "geschüttelt":"schütteln", "gerechnet":"rechnen", "gepackt":"packen", "gewinkt":"winken", "gedrückt":"drücken", "geschoben":"schieben", "getragen":"tragen", "gekniffen":"kneifen", "geworden":"werden", "ausgesehen":"aussehen", "gemocht":"mögen", "mochte":"mögen", "mochten":"mögen", "dürfte":"dürfen", "durfte":"dürfen", "durften":"dürfen", "würde":"werden", "würden":"werden", "sollte":"sollen", "sollten":"sollen", "soll":"sollen", "sollen":"sollen", "dachte":"denken", "dachten":"denken", "wären":"sein", "wäre":"sein", "sei":"sein", "seien":"sein", "haben":"haben", "hätten":"haben", "hätte":"haben", "liest":"lesen", "las":"lesen", "rannte":"rennen", "liefen":"laufen", "fuhrst":"fahren", "hängen":"hängen", "hing":"hängen", "stand":"stehen", "standen":"stehen", "klappten":"klappen", "rückte":"rücken", "blickte":"blicken", "zog":"ziehen", "blieb":"bleiben", "reichte":"reichen", "nickte":"nicken", "knisterte":"knistern", "schlief":"schlafen", "schliefen":"schlafen", "schrieb":"schreiben", "schriebest":"schreiben", "verloren":"verlieren", "blieb":"bleiben", "begann":"beginnen", "lief":"laufen", "sahen":"sehen", "gingst":"gehen", "ginge":"gehen", "gingen":"gehen", "gesessen":"sitzen", "gestohlen":"stehlen", "stahl":"stehlen", "presste":"pressen", "blutete":"bluten", "wickelte":"wickeln", "weinte":"weinen", "weinten":"weinen", "schenkte":"schenken", "schenkten":"schenken", "tat":"tun", "taten":"tun", "presst":"pressen", "standest":"stehen", "ausstieg":"aussteigen", "stiegen":"steigen", "stieg":"steigen", "stieß":"stoßen", "stießen":"stoßen", "schien":"scheinen", "schleppte":"schleppen", "schleppen":"schleppen", "hielt":"halten", "hieltet":"halten", "zeigte":"zeigen", "beugte":"beugen", "suchte":"suchen", "suchten":"suchen", "wartete":"warten", "warteten":"warten", "kletterten":"klettern", "lief":"laufen", "schüttelte":"schütteln", "lächelten":"lächeln", "redeten":"reden", "redete":"reden", "verstand":"verstehen", "verstandest":"verstehen", "wagte":"wagen", "wagten":"wagen", "zählte":"zählen", "zählten":"zählen", "hielt":"halten", "wussten":"wissen", "wusste":"wissen", "sollte":"sollen", "wird":"werden", "wurde":"werden", "wurden":"werden", "kamen":"kommen", "kam":"kommen", "saß":"sitzen", "saßen":"sitzen", "fiel":"fallen", "fielen":"fallen", "klopfte":"klopfen", "klopften":"klopfen", "erhob":"erheben", "erhobst":"erheben", "griff":"greifen", "drückte":"drücken", "drückten":"drücken", "blieb":"bleiben", "blieben":"bleiben", "fragten":"fragen", "antworteten":"antworten", "wanderten":"wandern", "setzte":"setzen", "setzten":"setzen", "öffnete":"öffnen", "wurde":"werden", "rannte":"rennen", "knurrte":"knurren", "gab":"geben", "gabst":"geben", "gabt":"geben", "vergaß":"vergessen", "vergaßt":"vergessen", "wolltest":"wollen", "wollte":"wollen", "wollten":"wollen", "sollten":"sollen", "halten":"halten", "hielt":"halten", "sollte":"sollen", "machte":"machen", "waren":"sein", "waren":"sein" });
      Object.assign(vocab, {
        "der Krug": { translation: "кувшин", ipa: "kʁuːk" }, "das Wasser": { translation: "вода", ipa: "ˈvasɐ" }, "die Flasche": { translation: "бутылка", ipa: "ˈflaʃə" }, "die Kamille": { translation: "ромашка", ipa: "kaˈmɪlə" }, "der Blumenkiosk": { translation: "цветочный киоск", ipa: "ˈbluːmənˌkiːɔsk" }, "der Feiertag": { translation: "праздничный день", ipa: "ˈfaɪɐtaːk" }, "das Schlafzimmer": { translation: "спальня", ipa: "ˈʃlaːfˌtsɪmɐ" }, "das Essen": { translation: "еда; приём пищи", ipa: "ˈɛsn̩" }, "der Schinken": { translation: "ветчина", ipa: "ˈʃɪŋkən" }, "der Scheunendrescher": { translation: "обжора (букв. молотильщик в амбаре)", ipa: "ˈʃɔɪ̯nənˌdʁɛʃɐ" }, "der Nachmittag": { translation: "вторая половина дня", ipa: "ˈnaːxmɪtaːk" }, "der Gasmann": { translation: "служащий газовой службы", ipa: "ˈɡaːsman" }, "die Adresse": { translation: "адрес", ipa: "aˈdʁɛsə" }, "der Rest": { translation: "остаток", ipa: "ʁɛst" }, "die Million": { translation: "миллион", ipa: "mɪˈli̯oːn" }, "der Doktor": { translation: "врач", ipa: "ˈdɔktoːɐ̯" }, "das Schulgeld": { translation: "плата за обучение", ipa: "ˈʃuːlˌɡɛlt" }, "der Fußboden": { translation: "пол", ipa: "ˈfuːsˌboːdn̩" }, "die Elektrizität": { translation: "электричество", ipa: "elektʁitsiˈtɛːt" }, "der Magistrat": { translation: "городская администрация", ipa: "maɡɪsˈtʁaːt" }, "die Rathausstraße": { translation: "улица Ратхаусштрассе", ipa: "ˈʁaːthaʊ̯sˌʃtʁaːsə" }, "die Fensterscheibe": { translation: "оконное стекло", ipa: "ˈfɛnstɐˌʃaɪ̯bə" }, "der Zug": { translation: "поезд", ipa: "tsuːk" }, "der Bahnhof": { translation: "вокзал", ipa: "ˈbaːnhoːf" }, "der Personenzug": { translation: "пассажирский поезд", ipa: "pɛʁˈzoːnənˌtsuːk" }, "der Schaffner": { translation: "кондуктор", ipa: "ˈʃafnɐ" }, "die Haltestelle": { translation: "остановка", ipa: "ˈhaltəˌʃtɛlə" }, "der Fahrplan": { translation: "расписание движения", ipa: "ˈfaːɐ̯ˌplaːn" }, "die Lokomotive": { translation: "локомотив", ipa: "lokoˈmoːtivə" }, "der Bahnhof Zoo": { translation: "вокзал «Зоологический сад»", ipa: "ˈbaːnhoːf tsoː" }, "der Fahrgast": { translation: "пассажир", ipa: "ˈfaːɐ̯ˌɡast" }, "die Wurst": { translation: "колбаса", ipa: "vʊʁst" }, "die Schülermütze": { translation: "школьная фуражка", ipa: "ˈʃyːlɐˌmʏtsə" }, "die Herrschaft": { translation: "господа; общество", ipa: "ˈhɛɐ̯ʃaft" }, "der Nachbar": { translation: "сосед", ipa: "ˈnaːxbaːɐ̯" }, "der Bahnhof": { translation: "вокзал", ipa: "ˈbaːnhoːf" }, "der Dieb": { translation: "вор", ipa: "diːp" }, "der Mörder": { translation: "убийца", ipa: "ˈmœʁdɐ" }, "die Bank": { translation: "банк; скамья", ipa: "baŋk" }, "das Stadtviertel": { translation: "городской район", ipa: "ˈʃtatˌfiːɐ̯tl̩" }, "das Postamt": { translation: "почтамт", ipa: "ˈpɔstˌʔamt" }, "die Kiste": { translation: "ящик", ipa: "ˈkɪstə" }, "der Rohrpostbrief": { translation: "пневматическое письмо", ipa: "ˈʁoːɐ̯pɔstˌbʁiːf" }, "das Gehirn": { translation: "мозг", ipa: "ɡəˈhɪʁn" }, "die Toilette": { translation: "туалет", ipa: "tɔaˈlɛtə" }, "die Nadel": { translation: "игла; булавка", ipa: "ˈnaːdl̩" }, "das Kupee": { translation: "купе", ipa: "kuˈpeː" }, "der Schnurrbart": { translation: "усы", ipa: "ˈʃnʊɐ̯baːɐ̯t" }, "die Falte": { translation: "морщина", ipa: "ˈfaltə" }, "das Ohr": { translation: "ухо", ipa: "oːɐ̯" }, "der Knopf": { translation: "пуговица", ipa: "knɔpf" }, "das Papiergewicht": { translation: "весовая категория в боксе", ipa: "paˈpiːɐ̯ɡəˌvɪçt" }, "der Uppercut": { translation: "апперкот", ipa: "ˈʔapɐkʌt" }, "die Notbremse": { translation: "стоп-кран", ipa: "ˈnoːtˌbʁɛmsə" }, "das Dienstabteil": { translation: "служебное купе", ipa: "ˈdiːnstʔapˌtaɪ̯l" }, "der Bummelzug": { translation: "пригородный поезд", ipa: "ˈbʊml̩ˌtsuːk" }, "der Schornstein": { translation: "дымоход", ipa: "ˈʃɔʁnʃtaɪ̯n" }, "der Gepäckträger": { translation: "носильщик", ipa: "ɡəˈpɛkˌtʁɛːɡɐ" }, "das Schild": { translation: "табличка; указатель", ipa: "ʃɪlt" }, "die Menschenmenge": { translation: "толпа", ipa: "ˈmɛnʃənˌmɛŋə" }, "die Treppe": { translation: "лестница", ipa: "ˈtʁɛpə" },
        "beginnen": { translation: "начинать", ipa: "bəˈɡɪnən" }, "einladen": { translation: "приглашать", ipa: "ˈaɪ̯nˌlaːdən" }, "mitfahren": { translation: "ехать вместе", ipa: "ˈmɪtˌfaːʁən" }, "gefallen": { translation: "нравиться", ipa: "ɡəˈfalən" }, "erschießen": { translation: "застрелить", ipa: "ɛɐ̯ˈʃiːsən" }, "aufhängen": { translation: "вешать", ipa: "ˈaʊ̯fˌhɛŋən" }, "trinken": { translation: "пить", ipa: "ˈtʁɪŋkən" }, "verlieren": { translation: "терять", ipa: "fɛɐ̯ˈliːʁən" }, "klettern": { translation: "взбираться; забираться", ipa: "ˈklɛtɐn" }, "frisieren": { translation: "делать причёску", ipa: "fʁiˈziːʁən" }, "kochen": { translation: "готовить", ipa: "ˈkɔxən" }, "wischen": { translation: "вытирать; мыть пол", ipa: "ˈvɪʃən" }, "aufstehen": { translation: "вставать", ipa: "ˈaʊ̯fˌʃteːən" }, "begreifen": { translation: "понимать", ipa: "bəˈɡʁaɪ̯fən" }, "entschließen": { translation: "решаться", ipa: "ɛntˈʃliːsən" }, "zurückzahlen": { translation: "возвращать деньги", ipa: "tsuˈʁʏkˌtsaːlən" }, "aussteigen": { translation: "выходить из транспорта", ipa: "ˈaʊ̯sˌʃtaɪ̯ɡən" }, "klopfen": { translation: "стучать", ipa: "ˈklɔpfən" }, "sparen": { translation: "копить", ipa: "ˈʃpaːʁən" }, "stehlen": { translation: "красть", ipa: "ˈʃteːlən" }, "pressen": { translation: "сжимать", ipa: "ˈpʁɛsən" }, "melden": { translation: "сообщать", ipa: "ˈmɛldən" }, "erblicken": { translation: "замечать", ipa: "ɛɐ̯ˈblɪkən" }, "rennen": { translation: "бежать", ipa: "ˈʁɛnən" }, "schleppen": { translation: "тащить", ipa: "ˈʃlɛpən" }, "scheinen": { translation: "казаться; светить", ipa: "ˈʃaɪ̯nən" }, "knurren": { translation: "ворчать", ipa: "ˈknʊʁən" }, "abgeben": { translation: "сдавать; отдавать", ipa: "ˈapˌɡeːbən" }, "nicken": { translation: "кивать", ipa: "ˈnɪkən" }, "fortgehen": { translation: "уходить", ipa: "ˈfɔʁtˌɡeːən" }, "drehen": { translation: "поворачивать", ipa: "ˈdʁeːən" }, "schnarchen": { translation: "храпеть", ipa: "ˈʃnaʁxən" }, "betrachten": { translation: "рассматривать", ipa: "bəˈtʁaxtən" }, "erschrecken": { translation: "пугаться", ipa: "ɛɐ̯ˈʃʁɛkən" }, "zusteigen": { translation: "садиться в транспорт", ipa: "ˈtsuːˌʃtaɪ̯ɡən" }, "kneifen": { translation: "щипать", ipa: "ˈknaɪ̯fən" }, "boxen": { translation: "боксировать", ipa: "ˈbɔksən" }, "kriegen": { translation: "получать; поймать", ipa: "ˈkʁiːɡən" }, "hören": { translation: "слышать", ipa: "ˈhøːʁən" }, "befühlen": { translation: "ощупывать", ipa: "bəˈfyːlən" }, "beruhigen": { translation: "успокаивать", ipa: "bəˈʁuːɪɡən" }, "lächeln": { translation: "улыбаться", ipa: "ˈlɛçl̩n" }, "verteilen": { translation: "раздавать", ipa: "fɛɐ̯ˈtaɪ̯lən" }, "weglegen": { translation: "откладывать", ipa: "ˈvɛkˌleːɡən" }, "fassen": { translation: "хватать; ощупывать", ipa: "ˈfasən" }, "zählen": { translation: "считать", ipa: "ˈtsɛːlən" }, "überlegen": { translation: "обдумывать", ipa: "ˈyːbɐˌleːɡən" }, "zittern": { translation: "дрожать", ipa: "ˈtsɪtɐn" }, "greifen": { translation: "хватать", ipa: "ˈɡʁaɪ̯fən" }, "drücken": { translation: "нажимать; сжимать", ipa: "ˈdʁʏkən" }, "bluten": { translation: "кровоточить", ipa: "ˈbluːtən" }, "wickeln": { translation: "обматывать", ipa: "ˈvɪkələn" }, "kosten": { translation: "стоить", ipa: "ˈkɔstən" }, "wandern": { translation: "двигаться; проходить", ipa: "ˈvandɐn" }, "aushalten": { translation: "выдерживать", ipa: "ˈaʊ̯sˌhaltn̩" }, "vorbeifahren": { translation: "проезжать мимо", ipa: "fɔɐ̯ˈbaɪ̯ˌfaːʁən" }, "aufheben": { translation: "поднимать", ipa: "ˈaʊ̯fˌheːbən" }, "stolpern": { translation: "спотыкаться", ipa: "ˈʃtɔlpɐn" }, "stoßen": { translation: "сталкиваться", ipa: "ˈʃtoːsən" }, "dazwischenkommen": { translation: "вмешиваться", ipa: "daˈtsvɪʃənˌkɔmən" }, "denken": { translation: "думать", ipa: "ˈdɛŋkən" }, "helfen": { translation: "помогать", ipa: "ˈhɛlfən" }, "lesen": { translation: "читать", ipa: "ˈleːzən" }, "sehen": { translation: "видеть", ipa: "ˈzeːən" }, "stehen": { translation: "стоять", ipa: "ˈʃteːən" }, "tun": { translation: "делать", ipa: "tuːn" }, "werden": { translation: "становиться", ipa: "ˈveːɐ̯dən" }, "zeigen": { translation: "показывать", ipa: "ˈtsaɪ̯ɡən" }, "schütteln": { translation: "трясти", ipa: "ˈʃʏtələn" }, "schieben": { translation: "толкать", ipa: "ˈʃiːbən" }, "heben": { translation: "поднимать", ipa: "ˈheːbən" }, "stoßen": { translation: "толкать; сталкиваться", ipa: "ˈʃtoːsən" }, "vorrüberdrehen": { translation: "проноситься мимо", ipa: "fɔʁˈyːbɐˌdʁeːən" }
      });
      const matcher = /[\p{L}ÄÖÜäöüß]+/gu;
      return text.replace(matcher, (token, offset) => {
        const lowerToken = token.toLocaleLowerCase("de");
        let lemma = aliases[lowerToken] || token;
        if (!Object.keys(vocab).some((entry) => entry.split(" ").pop().toLocaleLowerCase("de") === String(lemma).toLocaleLowerCase("de"))) {
          const candidates = [lowerToken.replace(/(test|tet|ten|te|st|t|e)$/u, "") + "en", lowerToken.replace(/(est|et|en|t)$/u, "") + "n", lowerToken.replace(/^ge(.+?)(et|t)$/u, "$1en")];
          const verbCandidate = candidates.find((candidate) => Object.hasOwn(vocab, candidate));
          if (verbCandidate) lemma = verbCandidate;
        }
        let key = Object.keys(vocab).find((entry) => entry.split(" ").pop().toLocaleLowerCase("de") === String(lemma).toLocaleLowerCase("de"));
        if (!key && /^[A-ZÄÖÜ]/u.test(token)) {
          const nounCandidates = [lowerToken.replace(/(ern|en|er|e|n|s)$/u, ""), lowerToken.replace(/(ern|en|er|e|n|s)$/u, "e"), lowerToken.replace(/(ern|en|er|e|n|s)$/u, "").replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u")];
          key = Object.keys(vocab).find((entry) => /^(der|die|das) /.test(entry) && nounCandidates.includes(entry.split(" ").pop().toLocaleLowerCase("de")));
        }
        const word = key && vocab[key];
        if (!word) return escapeHTML(token);
        const base = key;
        const [article] = key.split(" ");
        const isNoun = ["der", "die", "das"].includes(article);
        const gender = isNoun ? articleGender[article] : "";
        const partOfSpeech = isNoun ? `Существительное · ${gender}` : /^(an|auf|ein|nach|ver|be|wohnen|arbeiten|bringen|prüfen|suchen)/i.test(base) || !base.includes(" ") ? "Глагол · инфинитив" : "Выражение";
        const lemmaForm = key.split(" ").pop();
        const inflected = token.toLocaleLowerCase("de") !== lemmaForm.toLocaleLowerCase("de");
        const grammar = isNoun ? (contextualForms[token] || (inflected ? "Форма в контексте" : "Словарная форма")) : (inflected ? "Форма в контексте · Präsens / Partizip II" : "Начальная форма");
        const plural = nounPlurals[base];
        const descriptors = [partOfSpeech, grammar, plural ? `Plural: ${plural}` : ""].filter(Boolean);
        return `<span class="reader-word" tabindex="0" role="button" aria-expanded="false" lang="de" aria-label="${escapeHTML(`${token}. ${base}${word.ipa ? `. IPA ${word.ipa}` : ""}. Наведите курсор или нажмите, чтобы увидеть перевод.`)}"><span class="reader-token">${escapeHTML(token)}</span><span class="reader-popover" aria-hidden="true"><strong class="reader-lemma">${escapeHTML(base)}</strong>${word.ipa ? `<span class="reader-ipa">/${escapeHTML(word.ipa)}/ · IPA</span>` : ""}<span class="reader-meta">${escapeHTML(descriptors.join(" · "))}</span><span class="reader-gloss">${escapeHTML(word.translation)}</span></span></span>`;
      });
    }
    window.KVW_DE_ANNOTATE = annotate;
    const suppliedText = window.KVW_READER_TEXT?.de?.find((item) => reader.title.startsWith("Emil hilft"));
    function quizMarkup(sectionIndex) {
      const questions = window.KVW_READER_QUIZ?.[sectionIndex] || [];
      if (!questions.length) return "";
      const cards = questions.map((question, index) => `<fieldset class="reader-question" data-reader-question><legend>${index + 1}. <span lang="de">${escapeHTML(question.q)}</span></legend><details class="reader-question-translation"><summary>Перевод вопроса</summary><p lang="ru">${escapeHTML(question.ru)}</p></details><div>${question.a.map((answer, answerIndex) => ({ answer, correct: answerIndex === question.correct })).sort(() => Math.random() - .5).map((option) => `<button type="button" class="reader-option" data-reader-option data-correct="${option.correct}">${escapeHTML(option.answer)}</button>`).join("")}</div><p class="reader-feedback" aria-live="polite"></p></fieldset>`).join("");
      return `<section class="reader-quiz" data-reader-quiz><div class="reader-quiz-title"><h4>Тест по части текста</h4><span>${questions.length} вопросов</span><output data-reader-quiz-progress>Отвечено: 0 / ${questions.length}</output></div>${cards}<div class="reader-quiz-footer"><button type="button" class="reader-option reader-quiz-submit" data-reader-quiz-result>Показать результат</button><button type="button" class="reader-option" data-reader-quiz-reset>Начать заново</button><output class="reader-quiz-result" data-reader-quiz-score aria-live="polite"></output></div></section>`;
    }
    const sections = suppliedText ? suppliedText.sections : [[reader.parts[0], reader.parts[1]], [reader.parts[2]], [reader.parts[3]]].map((group, index) => ({
      title: ["Подготовка к поездке", "В поезде", "Пропажа денег"][index],
      pages: index === 0 ? "S. 5–11" : index === 1 ? "S. 12–17" : "S. 18–21",
      summary: group.map((part) => part.summary).join(" "),
      german: group.map((part) => part.german).join(" "),
      questions: group.flatMap((part) => part.questions)
    }));
    let questionNumber = 0;
    const tabs = sections.map((part, index) => `<button type="button" class="reader-part-tab${index === 0 ? " active" : ""}" id="reader-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="reader-part-${index}" data-reader-tab="${index}"><span>0${index + 1}</span>${tr(part.title)}</button>`).join("");
    const parts = sections.map((part, partIndex) => {
      const body = part.paragraphs
        ? `<div class="reader-original-text" lang="de">${part.paragraphs.map((paragraph) => `<p>${annotate(paragraph)}</p>`).join("")}</div>${quizMarkup(partIndex)}`
        : `<details class="reader-summary"><summary>${tr("Краткое содержание на русском")}</summary><p>${escapeHTML(part.summary)}</p></details><p class="reader-retelling" lang="de">${annotate(part.german)}</p><div class="reader-questions"><h4>${tr("Вопросы для самопроверки")}</h4>${part.questions.map((question) => {
            const number = ++questionNumber;
            const options = question.a.map((answer, answerIndex) => `<button type="button" class="reader-option" data-reader-option data-correct="${answerIndex === question.correct}">${escapeHTML(answer)}</button>`).join("");
            return `<fieldset class="reader-question" data-reader-question><legend>${number}. ${escapeHTML(question.q)}</legend><div>${options}</div><p class="reader-feedback" aria-live="polite"></p></fieldset>`;
          }).join("")}</div>`;
      return `<article class="reader-part" id="reader-part-${partIndex}" role="tabpanel" aria-labelledby="reader-tab-${partIndex}"${partIndex ? " hidden" : ""}><header class="reader-part-header"><span>${escapeHTML(part.pages)}</span><h3>${tr(part.title)}</h3></header>${body}</article>`;
    }).join("");
    return `<section class="literature-reader"><div class="reader-heading"><p class="eyebrow">${tr("ЧИТАТЕЛЬСКАЯ МАСТЕРСКАЯ")}</p><h3>${escapeHTML(reader.title)}</h3><p>${tr("Нажмите на отмеченные существительные и глаголы, чтобы открыть перевод. Для выбранных слов также показаны IPA, начальная форма и грамматика.")}</p><small>${suppliedText ? "Дословная транскрипция присланных страниц 5–21; переносы строк приведены к обычному тексту." : escapeHTML(reader.source)}</small><div class="reader-tools" aria-label="Настройки текста"><span>Размер текста</span><button type="button" data-reader-font="down" aria-label="Уменьшить текст" title="Уменьшить текст">A−</button><button type="button" data-reader-font="reset" aria-label="Сбросить размер текста" title="Сбросить размер">A</button><button type="button" data-reader-font="up" aria-label="Увеличить текст" title="Увеличить текст">A+</button><output data-reader-font-value aria-live="polite">100%</output></div></div><nav class="reader-part-tabs" role="tablist" aria-label="${tr("Части текста")}">${tabs}</nav><div class="reader-parts">${parts}</div></section>`;
  }
  function initReaderQuestions() {
    document.querySelectorAll("[data-reader-tab]").forEach((tab) => tab.addEventListener("click", () => {
      const reader = tab.closest(".literature-reader");
      reader.querySelectorAll("[data-reader-tab]").forEach((item) => { const active = item === tab; item.classList.toggle("active", active); item.setAttribute("aria-selected", String(active)); });
      reader.querySelectorAll("[role='tabpanel']").forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
    }));
    document.querySelectorAll(".reader-word").forEach((word) => {
      const toggle = () => {
        const open = !word.classList.contains("is-open");
        word.classList.toggle("is-open", open);
        word.setAttribute("aria-expanded", String(open));
        word.querySelector(".reader-popover")?.setAttribute("aria-hidden", String(!open));
      };
      word.addEventListener("click", toggle);
      word.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } });
    });
    document.querySelectorAll("[data-reader-font]").forEach((button) => button.addEventListener("click", () => {
      const reader = button.closest(".literature-reader");
      const current = Number.parseFloat(getComputedStyle(reader).getPropertyValue("--reader-scale")) || 1;
      const direction = button.dataset.readerFont;
      const next = direction === "reset" ? 1 : Math.max(.9, Math.min(1.6, current + (direction === "up" ? .1 : -.1)));
      reader.style.setProperty("--reader-scale", next.toFixed(1));
      reader.querySelector("[data-reader-font-value]").textContent = `${Math.round(next * 100)}%`;
    }));
    document.querySelectorAll("[data-reader-question]").forEach((question) => question.querySelectorAll("[data-reader-option]").forEach((button) => button.addEventListener("click", () => {
      if (question.dataset.answered) return;
      question.dataset.answered = "true";
      const correct = button.dataset.correct === "true";
      button.classList.add(correct ? "correct" : "incorrect");
      question.querySelector(".reader-feedback").textContent = correct ? tr("Верно! Так держать ✦") : tr("Попробуй ещё раз — правильный ответ отмечен.");
      if (!correct) question.querySelector('[data-reader-option][data-correct="true"]')?.classList.add("correct");
      const quiz = question.closest("[data-reader-quiz]");
      if (quiz) {
        const answeredCount = quiz.querySelectorAll('[data-reader-question][data-answered="true"]').length;
        quiz.querySelector("[data-reader-quiz-progress]").textContent = `Отвечено: ${answeredCount} / ${quiz.querySelectorAll("[data-reader-question]").length}`;
      }
    })));
    document.querySelectorAll("[data-reader-quiz-result]").forEach((button) => button.addEventListener("click", () => {
      const reader = button.closest(".literature-reader");
      const questions = [...reader.querySelectorAll("[data-reader-quiz] [data-reader-question]")];
      const answered = questions.filter((item) => item.dataset.answered === "true");
      const correct = answered.filter((item) => item.querySelector("[data-reader-option].correct")?.dataset.correct === "true").length;
      const outputs = reader.querySelectorAll("[data-reader-quiz-score]");
      const message = answered.length < questions.length
        ? `Ты ответила на ${answered.length} из ${questions.length}. Ответь на все вопросы, чтобы увидеть итог.`
        : `Результат: ${correct} из ${questions.length} правильных (${Math.round(correct / questions.length * 100)}%).`;
      outputs.forEach((output) => { output.textContent = message; });
    }));
    document.querySelectorAll("[data-reader-quiz-reset]").forEach((button) => button.addEventListener("click", () => {
      const reader = button.closest(".literature-reader");
      reader.querySelectorAll("[data-reader-quiz] [data-reader-question]").forEach((question) => {
        delete question.dataset.answered;
        question.querySelectorAll("[data-reader-option]").forEach((option) => option.classList.remove("correct", "incorrect"));
        question.querySelector(".reader-feedback").textContent = "";
      });
      reader.querySelectorAll("[data-reader-quiz-score]").forEach((output) => { output.textContent = ""; });
      reader.querySelectorAll("[data-reader-quiz-progress]").forEach((output) => { output.textContent = `Отвечено: 0 / ${output.closest("[data-reader-quiz]").querySelectorAll("[data-reader-question]").length}`; });
    }));
  }
  const languageAreas = [
    { key: "de", label: "Немецкий", id: "german" },
    { key: "en", label: "Английский", id: "english" },
    { key: "ka", label: "Грузинский", id: "georgian" }
  ];
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  const numberWords = {
    en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"],
    de: ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"],
    ka: ["ნული", "ერთი", "ორი", "სამი", "ოთხი", "ხუთი", "ექვსი", "შვიდი", "რვა", "ცხრა", "ათი", "თერთმეტი", "თორმეტი", "ცამეტი", "თოთხმეტი", "თხუთმეტი", "თექვსმეტი", "ჩვიდმეტი", "თვრამეტი", "ცხრამეტი"]
  };
  const decades = {
    en: ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"],
    de: ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"],
    ka: { 20: "ოცი", 30: "ოცდაათი", 40: "ორმოცი", 50: "ორმოცდაათი", 60: "სამოცი", 70: "სამოცდაათი", 80: "ოთხმოცი", 90: "ოთხმოცდაათი" }
  };
  const georgianStems = { 20: "ოც", 40: "ორმოც", 60: "სამოც", 80: "ოთხმოც" };
  const practiceYears = [1900, 1901, 1914, 1923, 1945, 1961, 1989, 1998, 1999, 2000, 2001, 2005, 2008, 2010, 2012, 2020, 2024, 2026, 2030];
  function cardinalWords(language, value) {
    if (value < 20) return numberWords[language][value];
    if (language === "ka") {
      if (value === 100) return "ასი";
      if (decades.ka[value]) return decades.ka[value];
      const base = Math.floor((value - 1) / 20) * 20;
      return `${georgianStems[base]}და${cardinalWords("ka", value - base)}`;
    }
    if (value === 100) return language === "de" ? "einhundert" : "one hundred";
    const ten = Math.floor(value / 10);
    const remainder = value % 10;
    if (language === "en") return decades.en[ten] + (remainder ? `-${numberWords.en[remainder]}` : "");
    return remainder ? `${remainder === 1 ? "ein" : numberWords.de[remainder]}und${decades.de[ten]}` : decades.de[ten];
  }
  function yearWords(language, year) {
    if (language === "de") {
      if (year < 2000) return `${numberWords.de[Math.floor(year / 100)]}hundert${year % 100 ? cardinalWords("de", year % 100) : ""}`;
      return `zweitausend${year % 100 ? cardinalWords("de", year % 100) : ""}`;
    }
    if (language === "en") {
      if (year < 2000) {
        const remainder = year % 100;
        if (!remainder) return "nineteen hundred";
        if (remainder < 10) return `nineteen oh ${numberWords.en[remainder]}`;
        return `nineteen ${cardinalWords("en", remainder)}`;
      }
      if (year === 2000) return "two thousand";
      if (year < 2010) return `two thousand and ${cardinalWords("en", year % 100)}`;
      return `twenty ${cardinalWords("en", year % 100)}`;
    }
    if (year < 2000) {
      const remainder = year % 100;
      return `ათას ცხრაას${remainder ? ` ${cardinalWords("ka", remainder)}` : "ი"}`;
    }
    if (year === 2000) return "ორი ათასი";
    return `ორი ათას ${cardinalWords("ka", year % 100)}`;
  }
  function numberGameMarkup(area) {
    const numberNote = area.key === "ka" ? "В грузинском счёт от 20 до 99 строится по двадцатеричной системе: 47 = ორმოცდაშვიდი (40 + 7)." : area.key === "de" ? "В составных числах 21–99 единицы ставятся перед десятками и соединяются und: 21 = einundzwanzig." : "В английском составные числа 21–99 пишутся через дефис: twenty-one. В британском варианте после сотен часто используется and.";
    const yearNote = area.key === "ka" ? "Слово წელი означает «год». В записи года обычно используется количественное числительное: 1998 — ათას ცხრაას ოთხმოცდათვრამეტი." : area.key === "de" ? "До 2000 года годы часто произносятся как сотни: 1998 — neunzehnhundertachtundneunzig. После 2000: zweitausendeins." : "Годы 1900-х часто делятся на две части: 1998 — nineteen ninety-eight. 2001 обычно: two thousand and one; в американском варианте возможно two thousand one.";
    return `<div class="number-game" data-number-game="${area.key}"><div class="number-mode-switch" role="group" aria-label="${tr("Режим игры с числами")}"><button type="button" class="number-mode active" data-number-mode="cardinals" aria-pressed="true">${tr("Числа 1–100")}</button><button type="button" class="number-mode" data-number-mode="years" aria-pressed="false">${tr("Годы")}</button></div><div class="number-prompt-card"><span class="mini-label" data-number-kind>${tr("СЛУЧАЙНОЕ ЧИСЛО")}</span><strong class="number-display" data-number-display>42</strong><p class="number-question" data-number-question></p><div class="number-options" data-number-options></div><p class="number-feedback" data-number-feedback aria-live="polite"></p></div><div class="number-game-footer"><span class="number-score" data-number-score>${tr("Верно: {score}").replace("{score}", "0")}</span><button type="button" class="button button-dark" data-number-next>${tr("Следующий вопрос")} <span aria-hidden="true">→</span></button></div><div class="number-tips"><p data-number-tip>${tr(numberNote)}</p><p>${tr(yearNote)}</p></div></div>`;
  }
  function initNumberGames() {
    const refreshers = [];
    document.querySelectorAll("[data-number-game]").forEach((game) => {
      const language = game.dataset.numberGame;
      let mode = "cardinals";
      let score = 0;
      let answered = false;
      function render() {
        answered = false;
        const isYear = mode === "years";
        const value = isYear ? practiceYears[Math.floor(Math.random() * practiceYears.length)] : 1 + Math.floor(Math.random() * 100);
        const answer = isYear ? yearWords(language, value) : cardinalWords(language, value);
        game.querySelector("[data-number-kind]").textContent = tr(isYear ? "СЛУЧАЙНЫЙ ГОД" : "СЛУЧАЙНОЕ ЧИСЛО");
        game.querySelector("[data-number-display]").textContent = value;
        game.querySelector("[data-number-question]").textContent = tr(isYear ? "Как произносится год {number}?" : "Как это число пишется словами?").replace("{number}", String(value));
        game.querySelector("[data-number-score]").textContent = tr("Верно: {score}").replace("{score}", String(score));
        game.querySelector("[data-number-feedback]").textContent = "";
        const choices = new Set([answer]);
        while (choices.size < 4) {
          const distractor = isYear ? practiceYears[Math.floor(Math.random() * practiceYears.length)] : 1 + Math.floor(Math.random() * 100);
          if (distractor !== value) choices.add(isYear ? yearWords(language, distractor) : cardinalWords(language, distractor));
        }
        const options = [...choices].sort(() => Math.random() - 0.5);
        const holder = game.querySelector("[data-number-options]");
        holder.replaceChildren();
        options.forEach((option) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "number-answer";
          button.textContent = option;
          button.lang = language;
          button.addEventListener("click", () => {
            if (answered) return;
            answered = true;
            const correct = option === answer;
            button.classList.add(correct ? "correct" : "incorrect");
            if (correct) score += 1;
            game.querySelector("[data-number-score]").textContent = tr("Верно: {score}").replace("{score}", String(score));
            game.querySelector("[data-number-feedback]").textContent = tr(correct ? "Верно! Так держать ✦" : "Почти. Правильный ответ: {answer}").replace("{answer}", answer);
          });
          holder.append(button);
        });
      }
      game.querySelectorAll("[data-number-mode]").forEach((button) => button.addEventListener("click", () => {
        mode = button.dataset.numberMode;
        game.querySelectorAll("[data-number-mode]").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
        render();
      }));
      game.querySelector("[data-number-next]").addEventListener("click", render);
      render();
      refreshers.push(render);
    });
    document.addEventListener("kvw:languagechange", () => refreshers.forEach((refresh) => refresh()));
  }

  function resourceMarkup(area, view) {
    const records = resources[area.key][view] || [];
    const id = `${area.key}-${view}`;
    const titles = { library: "Тексты", lectures: "Лекции", schedule: "Даты занятий", verbs: "Грамматика", numbers: "Числа и годы" };
    let content = "";
    if (view === "verbs") {
      content = `${verbsMarkup(area)}${grammarMarkup(area)}`;
    } else if (view === "numbers") {
      content = numberGameMarkup(area);
    } else if (view === "library") {
        content = `${(window.LESSONS.readers?.[area.key] || []).map(readerMarkup).join("")}${records.length ? `<div class="book-grid">${records.map((book, index) => `<article class="book-entry"><div class="book-cover" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span><i>✳</i></div><div class="book-details"><span class="item-type">${escapeHTML(book.kind)}</span><h3>${escapeHTML(book.title)}</h3><p class="book-author">${escapeHTML(book.author)}</p><details class="reading-entry"><summary>Открыть текст</summary><p class="literary-text" lang="${area.key === "ka" ? "ka" : area.key}">${area.key === "de" && window.KVW_DE_ANNOTATE ? window.KVW_DE_ANNOTATE(book.text) : escapeHTML(book.text)}</p>${book.translation ? `<details class="translation-entry"><summary>Открыть русский перевод</summary><p class="translation-text">${escapeHTML(book.translation)}</p></details>` : ""}<small>${escapeHTML(book.source || "")}</small></details></div></article>`).join("")}</div>` : `<div class="empty-state"><span>▤</span><h3>${area.key === "en" ? "Английская полка ждёт первую книгу" : "Книги появятся здесь"}</h3><p>${area.key === "en" ? "Добавь литературный текст, уроки и упражнения — они будут собраны в библиотеке английского." : "Добавь тексты и материалы в библиотеку этого языка."}</p></div>`}`;
    } else if (view === "lectures") {
      content = records.length ? `<div class="lecture-list">${records.map((item) => `<article class="lecture-card"><span class="item-type">${escapeHTML(item.kind || "ЛЕКЦИЯ")}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || "")}</p>${item.date ? `<p class="event-date">${escapeHTML(item.date)}${item.time ? ` · ${escapeHTML(item.time)}` : ""}</p>` : ""}</article>`).join("")}</div>` : `<div class="empty-state"><span>◉</span><h3>Лекции готовятся</h3><p>Здесь будут темы, описания и материалы лекций на языке <strong>${escapeHTML(area.label)}</strong>.</p></div>`;
    } else {
      content = records.length ? `<div class="schedule-list">${records.map((item) => `<article class="schedule-card"><div class="schedule-date"><strong>${escapeHTML(item.day || item.date || "—")}</strong><span>${escapeHTML(item.month || "ДАТА")}</span></div><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.time || "Время будет объявлено")}${item.format ? ` · ${escapeHTML(item.format)}` : ""}</p></div><span class="schedule-status">${escapeHTML(item.status || "Запланировано")}</span></article>`).join("")}</div>` : `<div class="empty-state"><span>◷</span><h3>Даты лекций ещё не назначены</h3><p>Когда появится расписание, здесь будут даты, время и формат занятий.</p></div>`;
    }
    const overline = view === "schedule" ? "Расписание" : view === "lectures" ? "Учебные встречи" : view === "verbs" ? "Грамматика" : view === "numbers" ? "Практика" : "Книжная полка";
    const subheading = view === "library" ? "этого языка." : view === "lectures" ? "и встречи." : view === "verbs" ? "грамматика и формы." : view === "numbers" ? "от одного до ста." : "занятий.";
    const description = view === "library" ? `<span>Выбирай книгу или текст для изучения на языке</span> <strong>${escapeHTML(area.label)}</strong>.` : view === "lectures" ? `Темы, содержание и записи лекций будут собраны здесь.` : view === "verbs" ? tr("Спряжение и ключевые правила с примерами для каждого языка.") : view === "numbers" ? tr("Тренируй числительные от 1 до 100 и учись произносить годы.") : `Календарь предстоящих лекций и занятий.`;
    return `<section class="resource-section" id="${id}" data-language-content="${area.key}:${view}" role="tabpanel" aria-labelledby="${area.key}-tab-${view}" hidden><div class="resource-heading"><div><p class="eyebrow"><span>${escapeHTML(area.label)}</span> · <span>${overline}</span></p><h2>${titles[view]}<br><em>${subheading}</em></h2></div><p>${description}</p></div>${content}<div class="resource-actions"><button class="button button-dark" type="button" data-booking-open data-booking-language="${area.key}">Записаться на урок <span>↗</span></button><span>Групповые и индивидуальные занятия</span></div></section>`;
  }

  function initLanguageSections() {
    languageAreas.forEach((area) => {
      const base = $(area.id);
      if (!base) return;
      base.dataset.languageContent = `${area.key}:study`;
      base.setAttribute("role", "tabpanel");
      base.setAttribute("aria-labelledby", `${area.key}-tab-study`);
      const tabs = document.createElement("nav");
      tabs.className = "language-subnav";
      tabs.classList.add(`lang-${area.key}`);
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", `Разделы: ${area.label}`);
      const views = [{ id: "study", label: "Слова и викторина" }, { id: "numbers", label: "Числа 1–100" }, { id: "verbs", label: "Грамматика" }, { id: "library", label: "Тексты" }, { id: "lectures", label: "Лекции" }, { id: "schedule", label: "Даты занятий" }];
      tabs.innerHTML = views.map((view, index) => `<button class="language-tab${index === 0 ? " active" : ""}" type="button" role="tab" aria-selected="${index === 0}" id="${area.key}-tab-${view.id}" aria-controls="${view.id === "study" ? area.id : `${area.key}-${view.id}`}" data-language-tab="${area.key}:${view.id}">${view.label}</button>`).join("");
      base.before(tabs);
      let tail = base;
      ["numbers", "verbs", "library", "lectures", "schedule"].forEach((view) => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = resourceMarkup(area, view);
        const section = wrapper.firstElementChild;
        tail.after(section);
        tail = section;
      });
    });

    document.querySelectorAll("[data-language-tab]").forEach((tab) => tab.addEventListener("click", () => {
      const [language, view] = tab.dataset.languageTab.split(":");
      document.querySelectorAll(`[data-language-content^="${language}:"]`).forEach((panel) => { panel.hidden = panel.dataset.languageContent !== `${language}:${view}`; });
      tab.closest(".language-subnav").querySelectorAll("[role='tab']").forEach((item) => { item.classList.toggle("active", item === tab); item.setAttribute("aria-selected", String(item === tab)); });
      if (location.hash !== `#${tab.getAttribute("aria-controls")}`) history.replaceState(null, "", `#${tab.getAttribute("aria-controls")}`);
    }));
    document.querySelectorAll(".language-subnav").forEach((tablist) => tablist.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
      const tabs = [...tablist.querySelectorAll("[role='tab']")];
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      tabs[(current + step + tabs.length) % tabs.length].focus();
      tabs[(current + step + tabs.length) % tabs.length].click();
    }));
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
      const id = link.getAttribute("href").slice(1);
      const target = $(id);
      if (target?.hidden && target.dataset.languageContent) {
        event.preventDefault();
        document.querySelector(`[data-language-tab="${target.dataset.languageContent}"]`)?.click();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }));
    const initialTarget = $(decodeURIComponent(location.hash.slice(1)));
    if (initialTarget?.hidden && initialTarget.dataset.languageContent) {
      document.querySelector(`[data-language-tab="${initialTarget.dataset.languageContent}"]`)?.click();
      requestAnimationFrame(() => initialTarget.scrollIntoView({ block: "start" }));
    }
  }

  function initBooking() {
    const dialog = document.createElement("dialog");
    dialog.className = "booking-dialog";
    dialog.setAttribute("aria-labelledby", "booking-title");
    dialog.innerHTML = `<form id="booking-form"><button type="button" class="dialog-close" aria-label="Закрыть">×</button><p class="eyebrow">Karolina vs. The World</p><h2 id="booking-title">Записаться на урок</h2><p class="booking-lead">Выбери язык и формат занятия — групповой или индивидуальный.</p><label>Язык<select name="language" required><option value="de">Немецкий</option><option value="en">Английский</option><option value="ka">Грузинский</option></select></label><fieldset><legend>Формат занятий</legend><label class="radio-choice"><input type="radio" name="format" value="Групповые занятия" checked> Групповые занятия</label><label class="radio-choice"><input type="radio" name="format" value="Индивидуальные занятия"> Индивидуальные занятия</label></fieldset><label>Имя<input name="name" autocomplete="name" required placeholder="Как к тебе обращаться"></label><label>Контакт для ответа<input name="contact" required placeholder="Email или Telegram"></label><label>Удобная дата (необязательно)<input name="date" type="date"></label><button class="button button-dark booking-submit" type="submit">Подготовить заявку <span>↗</span></button><p class="booking-note">Форма подготовит текст заявки для отправки. Контакт для фактической записи добавим, когда он будет выбран.</p><output class="booking-output" aria-live="polite"></output></form>`;
    document.body.append(dialog);
    dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
    document.querySelectorAll("[data-booking-open]").forEach((button) => button.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      $("site-nav").classList.remove("open");
      const language = button.dataset.bookingLanguage;
      if (language) dialog.querySelector("[name='language']").value = language;
      dialog.querySelector(".booking-output").textContent = "";
      dialog.showModal();
    }));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const language = { de: "Немецкий", en: "Английский", ka: "Грузинский" }[form.get("language")];
      const message = [tr("Заявка на урок — Karolina vs. The World"), `${tr("Язык")}: ${tr(language)}`, `${tr("Формат:")} ${tr(form.get("format"))}`, `${tr("Имя:")} ${form.get("name")}`, `${tr("Контакт:")} ${form.get("contact")}`, form.get("date") ? `${tr("Удобная дата:")} ${form.get("date")}` : ""].filter(Boolean).join("\n");
      const output = dialog.querySelector(".booking-output");
      output.textContent = message;
      try { await navigator.clipboard.writeText(message); output.textContent += `\n\n${tr("Заявка скопирована. Отправь её по выбранному каналу связи.")}`; }
      catch { output.textContent += `\n\n${tr("Скопируй этот текст и отправь его по выбранному каналу связи.")}`; }
    });
  }

  initLanguageSections();
  initReaderQuestions();
  initNumberGames();
  initBooking();
  window.KVW_I18N?.init();
})();
