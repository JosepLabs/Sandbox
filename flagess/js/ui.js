// js/ui.js
// -----------------------------------------------------------------------
// Toda la capa de interfaz: navegación entre Menú Principal <-> Área de
// Juego, tema oscuro/claro, idioma ES/EN, autocompletado, renderizado de
// intentos y de los modales de ayuda/configuración.
//
// ui.js es el único módulo que toca el DOM directamente. Delega toda la
// lógica de partida (intentos, victoria/derrota) en game.js, y toda la
// lógica visual específica de cada modo en js/modes/*.js.
// -----------------------------------------------------------------------

import { COUNTRIES, countryName, countryCapital } from "./data.js";
import { STR } from "./i18n.js";
import { norm, maxDistance, flagThumbUrl, flagUrl } from "./utils.js";
import * as Game from "./game.js";

// ---------------------------------------------------------------------
// Estado de interfaz (independiente del estado de partida, que vive en
// game.js): idioma, tema y preferencia de animaciones.
// ---------------------------------------------------------------------
let lang = "es";
let theme = "dark";
let reduceMotion = false;
let excludedContinents = new Set(); // continentes desactivados en Configuración (ver renderOptionRows)

let els = {};
let filtered = [];
let hiIndex = -1;
let timeInterval = null; // setInterval handle del temporizador de Contrarreloj

const t = () => STR[lang];

// ---------------------------------------------------------------------
// Inicialización
// ---------------------------------------------------------------------
export function init() {
  cacheEls();
  Game.init(getStageEls());

  bindHeaderEvents();
  bindMenuEvents();
  bindSearchEvents();
  bindHelpEvents();
  bindSettingsEvents();

  renderMenu();
  applyText();
  showMenu();
}

function cacheEls() {
  els = {
    // navegación
    backBtn: document.getElementById("back-btn"),
    viewMenu: document.getElementById("view-menu"),
    viewGame: document.getElementById("view-game"),
    menuTitle: document.getElementById("menu-title"),
    menuTagline: document.getElementById("menu-tagline"),
    modeGrid: document.getElementById("mode-grid"),

    // stage de juego
    flagImg: document.getElementById("flag-img"),
    colorCanvas: document.getElementById("color-canvas"),
    gridOverlay: document.getElementById("grid-overlay"),
    flagStage: document.getElementById("flag-stage"),
    attemptsPill: document.getElementById("attempts-pill"),
    banner: document.getElementById("reveal-banner"),

    // búsqueda / intento
    input: document.getElementById("country-input"),
    dropdown: document.getElementById("dropdown"),
    guessBtn: document.getElementById("guess-btn"),
    guesses: document.getElementById("guesses"),

    // ayuda
    helpBtn: document.getElementById("help-btn"),
    helpOverlay: document.getElementById("help-overlay"),
    helpClose: document.getElementById("help-close"),
    helpOk: document.getElementById("help-ok"),
    helpTitle: document.getElementById("help-title"),
    helpBody1: document.getElementById("help-body1"),
    helpBodyMode: document.getElementById("help-body-mode"),
    helpBody2: document.getElementById("help-body2"),
    helpBody3: document.getElementById("help-body3"),

    // configuración
    settingsBtn: document.getElementById("settings-btn"),
    settingsOverlay: document.getElementById("settings-overlay"),
    settingsClose: document.getElementById("settings-close"),
    settingsTitle: document.getElementById("settings-title"),
    labelTheme: document.getElementById("label-theme"),
    themeOptions: document.getElementById("theme-options"),
    labelLanguage: document.getElementById("label-language"),
    languageOptions: document.getElementById("language-options"),
    labelContinents: document.getElementById("label-continents"),
    continentOptions1: document.getElementById("continent-options-1"),
    continentOptions2: document.getElementById("continent-options-2"),
    labelOther: document.getElementById("label-other"),
    labelReduceMotion: document.getElementById("label-reduce-motion"),
    reduceMotionToggle: document.getElementById("reduce-motion-toggle"),
  };
}

/** Subconjunto de elementos que necesitan los módulos de modo (game.js/modes/*). */
function getStageEls() {
  return {
    flagImg: els.flagImg,
    colorCanvas: els.colorCanvas,
    gridOverlay: els.gridOverlay,
    flagStage: els.flagStage,
  };
}

// ---------------------------------------------------------------------
// Navegación Menú <-> Juego
// ---------------------------------------------------------------------
function showMenu() {
  els.viewMenu.classList.remove("hidden");
  els.viewGame.classList.add("hidden");
  els.backBtn.style.display = "none";
}

function showGame(modeId) {
  Game.setMode(modeId);
  els.viewMenu.classList.add("hidden");
  els.viewGame.classList.remove("hidden");
  els.backBtn.style.display = "";
  startNewGame();
}

function backToMenu() {
  clearInterval(timeInterval);
  showMenu();
}

function bindHeaderEvents() {
  els.backBtn.addEventListener("click", backToMenu);
}

// ---------------------------------------------------------------------
// Menú principal (tarjetas de modo)
// ---------------------------------------------------------------------
function renderMenu() {
  els.modeGrid.innerHTML = Game.MODES.map(
    (mode, i) => `
      <button class="mode-card" data-mode="${mode.id}">
        <span class="mode-card-index">${String(i + 1).padStart(2, "0")}</span>
        <span class="mode-card-title">${t()[mode.titleKey]}</span>
        <span class="mode-card-desc">${t()[mode.descKey]}</span>
      </button>`
  ).join("");
}

function bindMenuEvents() {
  els.modeGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".mode-card");
    if (!card) return;
    showGame(card.dataset.mode);
  });
}

// ---------------------------------------------------------------------
// Flujo de partida
// ---------------------------------------------------------------------
function isTimeAttackMode() {
  return !!Game.getMode(Game.getModeId()).timeAttack;
}

function startNewGame() {
  if (isTimeAttackMode()) {
    startTimeAttackGame();
    return;
  }
  Game.newGame();
  els.guesses.innerHTML = "";
  els.banner.textContent = "";
  els.banner.classList.remove("lost");
  els.flagStage.classList.remove("won", "lost");
  els.input.value = "";
  els.input.disabled = false;
  delete els.input.dataset.selected;
  delete els.guessBtn.dataset.mode;
  els.guessBtn.textContent = t().guessBtn;
  els.guessBtn.disabled = true;
  els.input.placeholder = currentGuessType() === "capital" ? t().placeholderCapital : t().placeholder;
  closeDropdown();
  els.attemptsPill.textContent = t().attempt(1, Game.MAX_ATTEMPTS);
}

function currentGuessType() {
  return Game.getState().mode.guessType;
}

/** Etiqueta que se muestra/busca para una entidad según el modo activo. */
function entityLabel(country) {
  return currentGuessType() === "capital" ? countryCapital(country, lang) : countryName(country, lang);
}

// ---------------------------------------------------------------------
// Modo Contrarreloj: flujo propio (temporizador + una ronda por bandera),
// gestionado aquí en vez de por el motor genérico de attemptGuess/finishUI.
// ---------------------------------------------------------------------
function startTimeAttackGame() {
  clearInterval(timeInterval);

  els.guesses.innerHTML = "";
  els.banner.textContent = "";
  els.banner.classList.remove("lost");
  els.flagStage.classList.remove("won", "lost");
  els.input.value = "";
  els.input.disabled = false;
  delete els.input.dataset.selected;
  delete els.guessBtn.dataset.mode;
  els.guessBtn.textContent = t().guessBtn;
  els.guessBtn.disabled = true;
  els.input.placeholder = t().placeholder;
  closeDropdown();

  const state = Game.startTimeAttack();
  showTimeFlag(state.target);
  els.attemptsPill.textContent = t().timeLeft(state.timeLeft);

  timeInterval = setInterval(() => {
    const s = Game.tickTimeAttack();
    if (!s) return;
    els.attemptsPill.textContent = t().timeLeft(s.timeLeft);
    if (!s.running) {
      clearInterval(timeInterval);
      finishTimeAttackUI(s);
    }
  }, 1000);
}

/** Muestra la bandera objetivo actual sin zoom, con un simple fundido de entrada. */
function showTimeFlag(target) {
  els.flagImg.classList.remove("visible");
  els.flagImg.style.transition = "none";
  els.flagImg.style.transformOrigin = "";
  els.flagImg.style.transform = "scale(1)";
  els.flagImg.onload = () => {
    void els.flagImg.offsetWidth;
    els.flagImg.style.transition = "";
    els.flagImg.classList.add("visible");
  };
  els.flagImg.src = flagUrl(target.code);
}

/** Destello breve del borde del stage (dorado/coral) según el acierto. */
function flashFlagStage(correct) {
  els.flagStage.classList.remove("won", "lost");
  void els.flagStage.offsetWidth; // reinicia la transición si se repite muy seguido
  els.flagStage.classList.add(correct ? "won" : "lost");
  setTimeout(() => els.flagStage.classList.remove("won", "lost"), 450);
}

function attemptTimeGuess() {
  const state = Game.getTimeState();
  if (!state || !state.running) return;

  let code = els.input.dataset.selected;
  if (!code) {
    const exact = findExactMatch(els.input.value);
    if (exact) code = exact.code;
  }
  if (!code) return;

  const guessedCountry = COUNTRIES.find((c) => c.code === code);
  const result = Game.submitTimeGuess(guessedCountry);
  if (!result) return;

  renderTimeRoundRow(result.roundResult);
  flashFlagStage(result.roundResult.isCorrect);

  els.input.value = "";
  delete els.input.dataset.selected;
  els.guessBtn.disabled = true;
  closeDropdown();

  showTimeFlag(result.state.target);
}

function renderTimeRoundRow({ target, isCorrect }) {
  const name = countryName(target, lang);
  const row = document.createElement("div");
  row.className = "time-row" + (isCorrect ? " correct" : " wrong");
  row.innerHTML = `
    <img class="gflag" src="${flagThumbUrl(target.code, 80)}" alt="${name}">
    <div class="gtext"><div class="gname">${name}</div></div>
    <span class="gtime-result ${isCorrect ? "ok" : "no"}">${isCorrect ? "✓" : "✗"}</span>
  `;
  els.guesses.prepend(row);
}

function finishTimeAttackUI(state) {
  els.input.disabled = true;
  els.attemptsPill.textContent = t().timeUp;
  els.banner.textContent = t().timeResults(state.correct, state.wrong, state.total);
  els.banner.classList.remove("lost");
  els.flagImg.classList.remove("visible");

  els.guessBtn.dataset.mode = "restart";
  els.guessBtn.textContent = t().playAgain;
  els.guessBtn.disabled = false;
}

function attemptGuess() {
  if (isTimeAttackMode()) {
    attemptTimeGuess();
    return;
  }

  const state = Game.getState();
  if (state.finished) return;

  let code = els.input.dataset.selected;
  if (!code) {
    const exact = findExactMatch(els.input.value);
    if (exact) code = exact.code;
  }
  if (!code) return;
  if (Game.guessedCodes().has(code)) return;

  const guessedCountry = COUNTRIES.find((c) => c.code === code);
  const result = Game.attemptGuess(guessedCountry);
  if (!result) return;

  renderGuessRow(result.guess);

  els.input.value = "";
  delete els.input.dataset.selected;
  els.guessBtn.disabled = true;
  closeDropdown();

  if (result.finished) {
    finishUI(result.won);
  } else {
    els.attemptsPill.textContent = t().attempt(result.n + 1, Game.MAX_ATTEMPTS);
  }
}

function finishUI(won) {
  const state = Game.getState();
  const target = state.target;
  els.input.disabled = true;
  els.attemptsPill.textContent = won ? t().solved : t().outOfTries;
  els.flagStage.classList.add(won ? "won" : "lost");

  if (currentGuessType() === "capital") {
    const capital = countryCapital(target, lang);
    const country = countryName(target, lang);
    els.banner.textContent = won ? t().winCapital(capital, country) : t().loseCapital(capital, country);
  } else {
    const name = countryName(target, lang);
    els.banner.textContent = won ? t().win(name) : t().lose(name);
  }
  els.banner.classList.toggle("lost", !won);

  els.guessBtn.dataset.mode = "restart";
  els.guessBtn.textContent = t().playAgain;
  els.guessBtn.disabled = false;
}

function renderGuessRow(g) {
  const target = Game.getState().target;
  const prox = Math.max(0, Math.min(100, Math.round((1 - g.dist / maxDistance()) * 100)));
  const barColor = prox > 80 ? "var(--gold)" : prox > 45 ? "var(--amber)" : "var(--coral)";
  const primary =
    currentGuessType() === "capital"
      ? `${countryName(g, lang)} — ${countryCapital(g, lang)}`
      : entityLabel(g);

  const row = document.createElement("div");
  row.className = "guess-row" + (g.isCorrect ? " correct" : "");
  row.innerHTML = `
    <img class="gflag" src="${flagThumbUrl(g.code, 80)}" alt="${primary}">
    <div class="gtext">
      <div class="gname">${primary}</div>
      <div class="proxbar"><span style="width:${g.isCorrect ? 100 : prox}%;background:${g.isCorrect ? "var(--gold)" : barColor}"></span></div>
    </div>
    <span class="gcontinent ${g.isCorrect || g.contMatch ? "match" : "nomatch"}">${t().continents[g.continent]}</span>
    <div class="gdist">
      ${g.isCorrect ? "" : `
        <svg class="arrow" viewBox="0 0 24 24" style="transform:rotate(${g.brg}deg)">
          <path d="M12 2 L18 20 L12 16 L6 20 Z" fill="var(--teal)"/>
        </svg>`}
      <span class="gdist-text">${g.isCorrect ? `0 ${t().km}` : `${g.dist.toLocaleString(lang === "es" ? "es" : "en")} ${t().km}`}</span>
    </div>
  `;
  els.guesses.prepend(row);
}

// ---------------------------------------------------------------------
// Autocompletado (busca países o capitales según el modo activo)
// ---------------------------------------------------------------------
function renderDropdown() {
  if (!filtered.length) {
    closeDropdown();
    return;
  }
  els.dropdown.innerHTML = filtered
    .slice(0, 8)
    .map(
      (c, i) => `
      <div data-idx="${i}" class="${i === hiIndex ? "hi" : ""}">
        <img src="${flagThumbUrl(c.code, 40)}" alt="">${entityLabel(c)}
      </div>`
    )
    .join("");
  els.dropdown.classList.add("open");
  [...els.dropdown.children].forEach((child) => {
    child.addEventListener("click", () => selectCountry(filtered[+child.dataset.idx]));
  });
}

function closeDropdown() {
  els.dropdown.classList.remove("open");
  els.dropdown.innerHTML = "";
  filtered = [];
  hiIndex = -1;
}

function selectCountry(c) {
  els.input.value = entityLabel(c);
  els.input.dataset.selected = c.code;
  closeDropdown();
  els.guessBtn.disabled = false;
}

/** Códigos a excluir del autocompletado: en Contrarreloj no aplica (no hay restricción de "ya adivinado"). */
function excludedCodes() {
  return isTimeAttackMode() ? new Set() : Game.guessedCodes();
}

// Busca un país cuyo nombre (o capital, según el modo) coincida
// exactamente con el texto escrito, ignorando mayúsculas/acentos.
function findExactMatch(rawValue) {
  const q = norm(rawValue);
  if (!q) return null;
  const already = excludedCodes();
  return COUNTRIES.find((c) => !already.has(c.code) && norm(entityLabel(c)) === q) || null;
}

function bindSearchEvents() {
  els.input.addEventListener("input", () => {
    delete els.input.dataset.selected;
    els.guessBtn.disabled = true;
    const q = norm(els.input.value);
    if (!q) {
      closeDropdown();
      return;
    }
    const already = excludedCodes();
    filtered = COUNTRIES.filter((c) => !already.has(c.code) && norm(entityLabel(c)).includes(q));
    hiIndex = -1;
    renderDropdown();

    const exact = findExactMatch(els.input.value);
    if (exact) {
      els.input.dataset.selected = exact.code;
      els.guessBtn.disabled = false;
    }
  });

  els.input.addEventListener("keydown", (e) => {
    if (!els.dropdown.classList.contains("open")) {
      if (e.key === "Enter") {
        e.preventDefault();
        attemptGuess();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      hiIndex = Math.min(hiIndex + 1, filtered.length - 1);
      renderDropdown();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      hiIndex = Math.max(hiIndex - 1, 0);
      renderDropdown();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const exact = findExactMatch(els.input.value);
      if (exact) attemptGuess();
      else if (hiIndex >= 0 && filtered[hiIndex]) selectCountry(filtered[hiIndex]);
      else attemptGuess();
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) closeDropdown();
  });

  els.guessBtn.addEventListener("click", () => {
    if (els.guessBtn.dataset.mode === "restart") {
      startNewGame();
    } else {
      attemptGuess();
    }
  });
}

// ---------------------------------------------------------------------
// Modal de ayuda
// ---------------------------------------------------------------------
function openHelp() {
  applyText();
  els.helpOverlay.classList.add("open");
}
function closeHelp() {
  els.helpOverlay.classList.remove("open");
}
function bindHelpEvents() {
  els.helpBtn.addEventListener("click", openHelp);
  els.helpClose.addEventListener("click", closeHelp);
  els.helpOk.addEventListener("click", closeHelp);
  els.helpOverlay.addEventListener("click", (e) => {
    if (e.target === els.helpOverlay) closeHelp();
  });
}

// ---------------------------------------------------------------------
// Modal de configuración (modo, tema, idioma, animaciones)
// ---------------------------------------------------------------------
function openSettings() {
  renderOptionRows();
  els.settingsOverlay.classList.add("open");
}
function closeSettings() {
  els.settingsOverlay.classList.remove("open");
}
function bindSettingsEvents() {
  els.settingsBtn.addEventListener("click", openSettings);
  els.settingsClose.addEventListener("click", closeSettings);
  els.settingsOverlay.addEventListener("click", (e) => {
    if (e.target === els.settingsOverlay) closeSettings();
  });
  els.reduceMotionToggle.addEventListener("change", (e) => {
    reduceMotion = e.target.checked;
    document.body.classList.toggle("reduce-motion", reduceMotion);
  });
}

function renderOptionRows() {
  const state = Game.getState();

  els.themeOptions.innerHTML = `
    <button class="option-btn ${theme === "dark" ? "active" : ""}" data-val="dark">${t().themeDark}</button>
    <button class="option-btn ${theme === "light" ? "active" : ""}" data-val="light">${t().themeLight}</button>
  `;
  els.languageOptions.innerHTML = `
    <button class="option-btn ${lang === "es" ? "active" : ""}" data-val="es">Español</button>
    <button class="option-btn ${lang === "en" ? "active" : ""}" data-val="en">English</button>
  `;

  const continentBtn = (key) =>
    `<button class="option-btn ${excludedContinents.has(key) ? "active" : ""}" data-val="${key}">${t().continents[key]}</button>`;
  els.continentOptions1.innerHTML = ["namerica", "samerica", "europe"].map(continentBtn).join("");
  els.continentOptions2.innerHTML = ["africa", "oceania", "asia"].map(continentBtn).join("");

  [...els.continentOptions1.children, ...els.continentOptions2.children].forEach((b) =>
    b.addEventListener("click", () => toggleContinent(b.dataset.val))
  );

  els.themeOptions.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      if (theme === b.dataset.val) return;
      theme = b.dataset.val;
      document.body.setAttribute("data-theme", theme);
      renderOptionRows();
    })
  );
  els.languageOptions.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      if (lang === b.dataset.val) return;
      lang = b.dataset.val;
      renderOptionRows();
      renderMenu();
      applyText();
    })
  );
}

/**
 * Activa/desactiva la exclusión de un continente. No permite excluir los 6
 * a la vez (no quedarían banderas para jugar): si ya hay 5 excluidos, el
 * sexto simplemente no se puede activar.
 */
function toggleContinent(key) {
  const next = new Set(excludedContinents);
  if (next.has(key)) {
    next.delete(key);
  } else {
    if (next.size >= 5) return;
    next.add(key);
  }
  excludedContinents = next;
  Game.setExcludedContinents(excludedContinents);
  renderOptionRows();
}

// ---------------------------------------------------------------------
// Aplicación de textos (i18n) a toda la interfaz visible
// ---------------------------------------------------------------------
function applyText() {
  const state = Game.getState();
  const mode = state.mode;

  document.title = t().appName;
  els.backBtn.title = t().backToMenu;
  els.backBtn.setAttribute("aria-label", t().backToMenu);
  els.menuTitle.textContent = t().menuTitle;
  els.menuTagline.textContent = t().menuTagline;

  els.input.placeholder = mode.guessType === "capital" ? t().placeholderCapital : t().placeholder;
  els.guessBtn.textContent = els.guessBtn.dataset.mode === "restart" ? t().playAgain : t().guessBtn;

  els.helpTitle.textContent = t().helpTitle;
  els.helpBody1.textContent = t().helpBody1;
  els.helpBodyMode.textContent = t()[mode.helpKey];
  els.helpBody2.style.display = mode.timeAttack ? "none" : "";
  els.helpBody3.style.display = mode.timeAttack ? "none" : "";
  els.helpBody2.textContent = mode.timeAttack ? "" : t().helpBody2;
  els.helpBody3.textContent = mode.timeAttack ? "" : t().helpBody3(Game.MAX_ATTEMPTS);
  els.helpOk.textContent = t().understood;

  els.settingsTitle.textContent = t().settingsTitle;
  els.labelTheme.textContent = t().groupTheme;
  els.labelLanguage.textContent = t().groupLanguage;
  els.labelContinents.textContent = t().groupContinents;
  els.labelOther.textContent = t().groupOther;
  els.labelReduceMotion.textContent = t().reduceMotion;
  renderOptionRows();

  if (mode.timeAttack) {
    const ts = Game.getTimeState();
    if (ts) {
      els.attemptsPill.textContent = ts.running ? t().timeLeft(ts.timeLeft) : t().timeUp;
      if (!ts.running) els.banner.textContent = t().timeResults(ts.correct, ts.wrong, ts.total);
    }
    return;
  }

  if (!state.finished) {
    els.attemptsPill.textContent = t().attempt(state.guesses.length + 1, Game.MAX_ATTEMPTS);
  } else {
    const won = state.guesses.length && state.guesses[state.guesses.length - 1].isCorrect;
    els.attemptsPill.textContent = won ? t().solved : t().outOfTries;
    if (mode.guessType === "capital") {
      const capital = countryCapital(state.target, lang);
      const country = countryName(state.target, lang);
      els.banner.textContent = won ? t().winCapital(capital, country) : t().loseCapital(capital, country);
    } else {
      const name = countryName(state.target, lang);
      els.banner.textContent = won ? t().win(name) : t().lose(name);
    }
  }

  // Refresca los textos ya renderizados en las filas de intentos previos.
  document.querySelectorAll(".guess-row").forEach((row, i) => {
    const g = state.guesses[state.guesses.length - 1 - i];
    if (!g) return;
    const label = row.querySelector(".gcontinent");
    if (label) label.textContent = t().continents[g.continent];
    const distEl = row.querySelector(".gdist-text");
    if (distEl) distEl.textContent = g.isCorrect ? `0 ${t().km}` : `${g.dist.toLocaleString(lang === "es" ? "es" : "en")} ${t().km}`;
  });
}
