// js/ui.js
// -----------------------------------------------------------------------
// Toda la interacción con el DOM vive acá: cambiar de vista (menú/juego),
// pintar el menú de modos, la configuración, la ayuda, el autocompletado
// del buscador y las filas de intentos. game.js no sabe nada de esto: solo
// expone funciones puras de estado que ui.js llama y refleja en pantalla.
// -----------------------------------------------------------------------

import * as game from "./game.js";
import { STR } from "./i18n.js";
import { loadPokemonData, POKEMON, GENERATIONS } from "./data.js";
import { norm, spriteThumbUrl, maxDexDistance, formatDex } from "./utils.js";

const els = {};

const state = {
  lang: "es",
  theme: "dark",
  reduceMotion: false,
  excludedGenerations: new Set(),
  activeMatch: null,
  busy: false, // true mientras se espera la respuesta de attemptGuess() (Clásico pide detalle a PokeAPI)
};

// ---------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------

export async function init() {
  cacheEls();
  loadPersistedState();
  applyPersistedVisuals();
  wireStaticEvents();

  game.init({ stage: els.stage, pokeImg: els.pokeImg });
  game.setExcludedGenerations(state.excludedGenerations);

  els.menuTagline.textContent = STR[state.lang].loading;

  try {
    await loadPokemonData();
  } catch (err) {
    els.menuTagline.textContent =
      state.lang === "es"
        ? "No se pudo cargar la Pokédex. Recargá la página."
        : "Couldn't load the Pokédex. Please reload the page.";
    console.error(err);
    return;
  }

  applyAllTexts();
}

function cacheEls() {
  els.brandTitle = document.getElementById("brand-title");
  els.backBtn = document.getElementById("back-btn");
  els.settingsBtn = document.getElementById("settings-btn");
  els.helpBtn = document.getElementById("help-btn");

  els.viewMenu = document.getElementById("view-menu");
  els.viewGame = document.getElementById("view-game");
  els.menuTitle = document.getElementById("menu-title");
  els.menuTagline = document.getElementById("menu-tagline");
  els.modeGrid = document.getElementById("mode-grid");

  els.stage = document.getElementById("poke-stage");
  els.pokeImg = document.getElementById("poke-img");
  els.attemptsPill = document.getElementById("attempts-pill");
  els.revealBanner = document.getElementById("reveal-banner");
  els.input = document.getElementById("pokemon-input");
  els.guessBtn = document.getElementById("guess-btn");
  els.dropdown = document.getElementById("dropdown");
  els.guesses = document.getElementById("guesses");

  els.classicBoardWrap = document.getElementById("classic-board-wrap");
  els.classicBody = document.getElementById("classic-guesses-body");
  els.thPokemon = document.getElementById("th-pokemon");
  els.thType = document.getElementById("th-type");
  els.thGen = document.getElementById("th-gen");
  els.thColor = document.getElementById("th-color");
  els.thHabitat = document.getElementById("th-habitat");
  els.thHeight = document.getElementById("th-height");
  els.thWeight = document.getElementById("th-weight");
  els.thEvolution = document.getElementById("th-evolution");

  els.helpOverlay = document.getElementById("help-overlay");
  els.helpClose = document.getElementById("help-close");
  els.helpOk = document.getElementById("help-ok");
  els.helpTitle = document.getElementById("help-title");
  els.helpBody1 = document.getElementById("help-body1");
  els.helpBodyMode = document.getElementById("help-body-mode");
  els.helpBody2 = document.getElementById("help-body2");
  els.helpBody3 = document.getElementById("help-body3");

  els.settingsOverlay = document.getElementById("settings-overlay");
  els.settingsClose = document.getElementById("settings-close");
  els.settingsTitle = document.getElementById("settings-title");
  els.labelTheme = document.getElementById("label-theme");
  els.themeOptions = document.getElementById("theme-options");
  els.labelLanguage = document.getElementById("label-language");
  els.languageOptions = document.getElementById("language-options");
  els.labelGenerations = document.getElementById("label-generations");
  els.genOptions1 = document.getElementById("generation-options-1");
  els.genOptions2 = document.getElementById("generation-options-2");
  els.labelOther = document.getElementById("label-other");
  els.labelReduceMotion = document.getElementById("label-reduce-motion");
  els.reduceMotionToggle = document.getElementById("reduce-motion-toggle");
  els.settingsNewGameBtn = document.getElementById("settings-newgame-btn");
}

// ---------------------------------------------------------------------
// Persistencia de configuración (localStorage)
// ---------------------------------------------------------------------

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage lleno o no disponible: la sesión sigue funcionando,
    // solo que la configuración no sobrevive a un recargado.
  }
}

function readPersisted(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadPersistedState() {
  state.lang = readPersisted("pokedle_lang", "es");
  state.theme = readPersisted("pokedle_theme", "dark");
  state.reduceMotion = readPersisted("pokedle_reduce_motion", false);
  state.excludedGenerations = new Set(readPersisted("pokedle_excluded_gens", []));
}

function applyPersistedVisuals() {
  document.body.setAttribute("data-theme", state.theme);
  document.body.classList.toggle("reduce-motion", state.reduceMotion);
  els.reduceMotionToggle.checked = state.reduceMotion;
}

// ---------------------------------------------------------------------
// Eventos que no cambian entre idiomas/temas (se conectan una sola vez)
// ---------------------------------------------------------------------

function wireStaticEvents() {
  els.backBtn.addEventListener("click", () => showView("menu"));

  els.settingsBtn.addEventListener("click", () => {
    renderThemeOptions();
    renderLanguageOptions();
    renderGenerationOptions();
    openModal(els.settingsOverlay);
  });
  els.settingsClose.addEventListener("click", () => closeModal(els.settingsOverlay));
  els.settingsOverlay.addEventListener("click", (e) => {
    if (e.target === els.settingsOverlay) closeModal(els.settingsOverlay);
  });

  els.helpBtn.addEventListener("click", () => {
    applyHelpTexts();
    openModal(els.helpOverlay);
  });
  els.helpClose.addEventListener("click", () => closeModal(els.helpOverlay));
  els.helpOk.addEventListener("click", () => closeModal(els.helpOverlay));
  els.helpOverlay.addEventListener("click", (e) => {
    if (e.target === els.helpOverlay) closeModal(els.helpOverlay);
  });

  els.reduceMotionToggle.addEventListener("change", (e) => {
    state.reduceMotion = e.target.checked;
    document.body.classList.toggle("reduce-motion", state.reduceMotion);
    persist("pokedle_reduce_motion", state.reduceMotion);
  });

  els.settingsNewGameBtn.addEventListener("click", () => {
    closeModal(els.settingsOverlay);
    if (!els.viewGame.classList.contains("hidden")) beginRound();
  });

  els.input.addEventListener("input", handleInputChange);
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (state.activeMatch) handleGuess(state.activeMatch);
    }
    if (e.key === "Escape") renderDropdown([]);
  });
  els.input.addEventListener("blur", () => setTimeout(() => renderDropdown([]), 120));
  els.guessBtn.addEventListener("click", () => {
    if (state.activeMatch) handleGuess(state.activeMatch);
  });
}

function openModal(overlay) {
  overlay.classList.add("open");
}
function closeModal(overlay) {
  overlay.classList.remove("open");
}

// ---------------------------------------------------------------------
// Vistas (menú <-> juego)
// ---------------------------------------------------------------------

function showView(view) {
  els.viewMenu.classList.toggle("hidden", view !== "menu");
  els.viewGame.classList.toggle("hidden", view !== "game");
  els.backBtn.style.display = view === "game" ? "flex" : "none";
}

function startGame(modeId) {
  game.setMode(modeId);
  showView("game");
  beginRound();
}

/** (Re)inicia una partida con el modo actualmente seleccionado. */
async function beginRound() {
  const s = STR[state.lang];
  const mode = game.getMode(game.getModeId());

  // Cada modo usa su propio layout de resultados: Zoom pinta filas con
  // sprite (#guesses), Clásico pinta una tabla de comparación
  // (#classic-board-wrap). El stage (sprite + zoom) solo existe si el
  // modo lo necesita (mode.hasStage); Clásico no tiene "campo de
  // visualización", así que se oculta por completo.
  els.stage.classList.toggle("hidden", mode.hasStage === false);
  els.guesses.classList.toggle("hidden", mode.resultLayout === "table");
  els.classicBoardWrap.classList.toggle("hidden", mode.resultLayout !== "table");

  els.guesses.innerHTML = "";
  els.classicBody.innerHTML = "";
  els.revealBanner.textContent = "";
  els.revealBanner.classList.remove("lost");
  els.input.value = "";
  els.input.disabled = false;
  els.guessBtn.disabled = true;
  state.activeMatch = null;
  renderDropdown([]);

  // newGame() es async: los modos con needsDetails (Clásico) le piden a
  // PokeAPI el detalle completo del Pokémon objetivo antes de arrancar.
  await game.newGame();
  els.attemptsPill.textContent = s.attempt(0, game.MAX_ATTEMPTS);
}

// ---------------------------------------------------------------------
// Menú principal
// ---------------------------------------------------------------------

function renderModeGrid() {
  const s = STR[state.lang];
  els.modeGrid.innerHTML = "";
  const ready = POKEMON.length > 0;

  game.MODES.forEach((mode, i) => {
    const btn = document.createElement("button");
    btn.className = "mode-card";
    btn.disabled = !ready;
    btn.innerHTML = `
      <span class="mode-card-index">${String(i + 1).padStart(2, "0")}</span>
      <span class="mode-card-title">${s[mode.titleKey]}</span>
      <span class="mode-card-desc">${s[mode.descKey]}</span>
    `;
    btn.addEventListener("click", () => startGame(mode.id));
    els.modeGrid.appendChild(btn);
  });
}

// ---------------------------------------------------------------------
// Buscador con autocompletado
// ---------------------------------------------------------------------

function handleInputChange() {
  const q = norm(els.input.value);
  if (!q) {
    renderDropdown([]);
    setActiveMatch(null);
    return;
  }

  const excluded = game.guessedIds();
  const matches = POKEMON.filter(
    (p) => !excluded.has(p.id) && (norm(p.displayName).includes(q) || p.name.includes(q))
  ).slice(0, 8);

  renderDropdown(matches);
  setActiveMatch(matches[0] || null);
}

function setActiveMatch(pokemon) {
  state.activeMatch = pokemon;
  els.guessBtn.disabled = !pokemon;
}

function renderDropdown(matches) {
  els.dropdown.innerHTML = "";
  if (!matches.length) {
    els.dropdown.classList.remove("open");
    return;
  }
  matches.forEach((p, i) => {
    const item = document.createElement("div");
    if (i === 0) item.classList.add("hi");
    item.innerHTML = `<img src="${spriteThumbUrl(p.id)}" alt="" /><span>${p.displayName}</span>`;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault(); // evita que el input pierda foco antes del click
      els.input.value = p.displayName;
      renderDropdown([]);
      setActiveMatch(p);
      handleGuess(p);
    });
    els.dropdown.appendChild(item);
  });
  els.dropdown.classList.add("open");
}

// ---------------------------------------------------------------------
// Registrar un intento y pintar el tablero
// ---------------------------------------------------------------------

async function handleGuess(pokemon) {
  if (state.busy || !pokemon) return;
  state.busy = true;
  els.guessBtn.disabled = true;

  try {
    const result = await game.attemptGuess(pokemon);
    if (!result) return;

    const mode = game.getMode(game.getModeId());
    if (mode.resultLayout === "table") {
      els.classicBody.prepend(buildClassicRow(result));
    } else {
      els.guesses.prepend(buildGuessRow(result));
    }

    els.attemptsPill.textContent = STR[state.lang].attempt(result.n, game.MAX_ATTEMPTS);
    els.input.value = "";
    renderDropdown([]);
    setActiveMatch(null);

    if (result.finished) {
      const s = STR[state.lang];
      const targetName = game.getState().target.displayName;
      els.revealBanner.textContent = result.won ? s.win(targetName) : s.lose(targetName);
      els.revealBanner.classList.toggle("lost", !result.won);
      els.input.disabled = true;
      els.guessBtn.disabled = true;
    }
  } finally {
    state.busy = false;
    if (!els.input.disabled) els.guessBtn.disabled = !state.activeMatch;
  }
}

function buildGuessRow(result) {
  const { guess } = result;
  const s = STR[state.lang];

  const wrapper = document.createElement("div");

  const row = document.createElement("div");
  row.className = "guess-row" + (guess.isCorrect ? " correct" : "");

  const img = document.createElement("img");
  img.className = "gflag";
  img.src = spriteThumbUrl(guess.id);
  img.alt = "";
  row.appendChild(img);

  const text = document.createElement("div");
  text.className = "gtext";
  text.innerHTML = `
    <span class="gname">${guess.displayName}</span>
    <span class="gsub">${formatDex(guess.id)}</span>
  `;
  row.appendChild(text);

  const genBadge = document.createElement("span");
  genBadge.className = `gcontinent ${guess.genMatch ? "match" : "nomatch"}`;
  genBadge.textContent = s.generations[guess.generation];
  row.appendChild(genBadge);

  const distWrap = document.createElement("div");
  distWrap.className = "gdist";
  const arrow = guess.isCorrect ? "✓" : guess.direction === "up" ? "▲" : "▼";
  const distLabel = guess.isCorrect ? "" : String(guess.dist);
  distWrap.innerHTML = `<span class="arrow">${arrow}</span><span>${distLabel}</span>`;
  row.appendChild(distWrap);

  wrapper.appendChild(row);

  const proxbar = document.createElement("div");
  proxbar.className = "proxbar";
  const closeness = guess.isCorrect ? 1 : Math.max(0, 1 - guess.dist / maxDexDistance());
  const bar = document.createElement("span");
  bar.style.width = `${Math.round(closeness * 100)}%`;
  bar.style.background = guess.isCorrect ? "var(--gold)" : "var(--teal)";
  proxbar.appendChild(bar);
  wrapper.appendChild(proxbar);

  return wrapper;
}

/**
 * Fila de la tabla del modo Clásico: Pokémon, Tipo, Generación, Color,
 * Hábitat, Altura, Peso y Evolución. `guess` ya trae todo precalculado
 * por game.js#attemptGuess (typeComparison, colorMatch, habitatMatch,
 * heightStatus, weightStatus, evolutionStatus).
 */
function buildClassicRow(result) {
  const { guess } = result;
  const s = STR[state.lang];

  const tr = document.createElement("tr");
  if (guess.isCorrect) tr.classList.add("correct-row");

  const nameTd = document.createElement("td");
  nameTd.innerHTML = `
    <div class="classic-name-cell">
      <img src="${spriteThumbUrl(guess.id)}" alt="" />
      <span>${guess.displayName}</span>
    </div>
  `;
  tr.appendChild(nameTd);

  const typeTd = document.createElement("td");
  guess.typeComparison.forEach((t) => {
    const pill = document.createElement("span");
    const cls = t.status === "correct" ? "match" : t.status === "present" ? "partial" : "";
    pill.className = `type-pill ${cls}`.trim();
    pill.textContent = t.type ? s.types[t.type] ?? t.type : "—";
    typeTd.appendChild(pill);
  });
  tr.appendChild(typeTd);

  const genTd = document.createElement("td");
  genTd.innerHTML = statPill(guess.genMatch, s.generations[guess.generation]);
  tr.appendChild(genTd);

  const colorTd = document.createElement("td");
  colorTd.innerHTML = statPill(guess.colorMatch, s.colors[guess.color] ?? guess.color);
  tr.appendChild(colorTd);

  const habitatTd = document.createElement("td");
  habitatTd.innerHTML = statPill(guess.habitatMatch, s.habitats[guess.habitat] ?? guess.habitat);
  tr.appendChild(habitatTd);

  const heightTd = document.createElement("td");
  heightTd.innerHTML = statusPill(guess.heightStatus, `${guess.heightM.toFixed(1)} m`);
  tr.appendChild(heightTd);

  const weightTd = document.createElement("td");
  weightTd.innerHTML = statusPill(guess.weightStatus, `${guess.weightKg.toFixed(1)} kg`);
  tr.appendChild(weightTd);

  const evoTd = document.createElement("td");
  evoTd.innerHTML = statusPill(
    guess.evolutionStatus,
    `${guess.evolutionStage}/${guess.evolutionTotalStages}`
  );
  tr.appendChild(evoTd);

  return tr;
}

/** Pastilla para comparaciones binarias (coincide / no coincide). */
function statPill(matches, label) {
  return `<span class="stat-pill ${matches ? "match" : "nomatch"}">${label}</span>`;
}

/** Pastilla con flecha ▲▼ para comparaciones numéricas (altura, peso, evolución). */
function statusPill(status, label) {
  const arrow = status === "equal" ? "" : status === "higher" ? " ▲" : " ▼";
  return `<span class="stat-pill ${status === "equal" ? "match" : "nomatch"}">${label}${arrow}</span>`;
}

// ---------------------------------------------------------------------
// Configuración: tema, idioma, generaciones
// ---------------------------------------------------------------------

function renderThemeOptions() {
  const s = STR[state.lang];
  els.themeOptions.innerHTML = "";
  [
    ["dark", s.themeDark],
    ["light", s.themeLight],
  ].forEach(([value, label]) => {
    const btn = document.createElement("button");
    btn.className = "option-btn" + (state.theme === value ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => setTheme(value));
    els.themeOptions.appendChild(btn);
  });
}

function setTheme(value) {
  state.theme = value;
  document.body.setAttribute("data-theme", value);
  persist("pokedle_theme", value);
  renderThemeOptions();
}

function renderLanguageOptions() {
  els.languageOptions.innerHTML = "";
  [
    ["es", "Español"],
    ["en", "English"],
  ].forEach(([value, label]) => {
    const btn = document.createElement("button");
    btn.className = "option-btn" + (state.lang === value ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => setLang(value));
    els.languageOptions.appendChild(btn);
  });
}

function setLang(value) {
  state.lang = value;
  persist("pokedle_lang", value);
  applyAllTexts();
}

function renderGenerationOptions() {
  const s = STR[state.lang];
  els.genOptions1.innerHTML = "";
  els.genOptions2.innerHTML = "";

  GENERATIONS.forEach((gen, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn" + (state.excludedGenerations.has(gen) ? "" : " active");
    btn.textContent = s.generations[gen];
    btn.addEventListener("click", () => toggleGeneration(gen));
    (i < 5 ? els.genOptions1 : els.genOptions2).appendChild(btn);
  });
}

function toggleGeneration(gen) {
  if (state.excludedGenerations.has(gen)) state.excludedGenerations.delete(gen);
  else state.excludedGenerations.add(gen);
  persist("pokedle_excluded_gens", [...state.excludedGenerations]);
  game.setExcludedGenerations(state.excludedGenerations);
  renderGenerationOptions();
}

// ---------------------------------------------------------------------
// Aplicar textos según el idioma activo (se llama al iniciar y al cambiar
// de idioma; también vuelve a pintar menú/config para reflejar el idioma).
// ---------------------------------------------------------------------

function applyAllTexts() {
  const s = STR[state.lang];

  els.brandTitle.textContent = s.appName;
  els.backBtn.setAttribute("aria-label", s.backToMenu);
  els.backBtn.setAttribute("title", s.backToMenu);
  els.settingsBtn.setAttribute("aria-label", s.settingsTitle);
  els.settingsBtn.setAttribute("title", s.settingsTitle);
  els.helpBtn.setAttribute("aria-label", s.helpTitle);
  els.helpBtn.setAttribute("title", s.helpTitle);

  els.menuTitle.textContent = s.menuTitle;
  els.menuTagline.textContent = POKEMON.length ? s.menuTagline : s.loading;
  renderModeGrid();

  els.input.placeholder = s.placeholder;
  els.guessBtn.textContent = s.guessBtn;

  els.thPokemon.textContent = s.colPokemon;
  els.thType.textContent = s.colType;
  els.thGen.textContent = s.colGen;
  els.thColor.textContent = s.colColor;
  els.thHabitat.textContent = s.colHabitat;
  els.thHeight.textContent = s.colHeight;
  els.thWeight.textContent = s.colWeight;
  els.thEvolution.textContent = s.colEvolution;

  if (!els.viewGame.classList.contains("hidden")) {
    const n = game.getState().guesses.length;
    els.attemptsPill.textContent = s.attempt(n, game.MAX_ATTEMPTS);
  }

  applyHelpTexts();

  els.settingsTitle.textContent = s.settingsTitle;
  els.labelTheme.textContent = s.groupTheme;
  els.labelLanguage.textContent = s.groupLanguage;
  els.labelGenerations.textContent = s.groupGenerations;
  els.labelOther.textContent = s.groupOther;
  els.labelReduceMotion.textContent = s.reduceMotion;
  els.settingsNewGameBtn.textContent = s.newGame;
  renderThemeOptions();
  renderLanguageOptions();
  renderGenerationOptions();
}

function applyHelpTexts() {
  const s = STR[state.lang];
  const mode = game.getMode(game.getModeId());
  els.helpTitle.textContent = s.helpTitle;
  els.helpBody1.textContent = s.helpBody1;
  els.helpBodyMode.textContent = s[mode.helpKey];
  els.helpBody2.textContent = s.helpBody2;
  els.helpBody3.textContent = s.helpBody3(game.MAX_ATTEMPTS);
  els.helpOk.textContent = s.understood;
}
