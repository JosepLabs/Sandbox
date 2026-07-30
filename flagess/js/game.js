// js/game.js
// -----------------------------------------------------------------------
// Núcleo del flujo de juego: elegir objetivo, registrar intentos, decidir
// victoria/derrota y reiniciar. No toca el DOM directamente (eso es tarea
// de ui.js); en su lugar recibe una referencia a los elementos que cada
// modo necesita (`els`) y delega en el módulo de modo activo para pintar
// el "stage" (bandera/canvas/cuadrícula).
//
// Para añadir un quinto modo: crear js/modes/miModo.js siguiendo el
// contrato descrito en zoomMode.js y añadirlo a la lista MODES de abajo.
// Todo lo demás (menú, ayuda, flujo de intentos) funciona automáticamente.
// -----------------------------------------------------------------------

import { COUNTRIES } from "./data.js";
import { distanceKm, bearing } from "./utils.js";

import zoomMode from "./modes/zoomMode.js";
import colorsMode from "./modes/colorsMode.js";
import capitalMode from "./modes/capitalMode.js";
import gridMode from "./modes/gridMode.js";
import timeAttackMode from "./modes/timeAttackMode.js";

export const MAX_ATTEMPTS = 6;
export const TIME_ATTACK_SECONDS = 60;

/** Modos disponibles, en el orden en que se muestran en el menú. */
export const MODES = [zoomMode, colorsMode, capitalMode, gridMode, timeAttackMode];

export function getMode(id) {
  return MODES.find((m) => m.id === id) || MODES[0];
}

// ---------------------------------------------------------------------
// Estado interno de la partida en curso. Solo hay una partida activa a la
// vez (igual que en la versión monolítica original).
// ---------------------------------------------------------------------
let els = null; // referencias DOM que necesitan los modos (ver ui.js#getStageEls)
let modeId = "zoom";
let target = null;
let guesses = [];
let finished = false;
let excludedContinents = new Set(); // continentes desactivados en Configuración

/** Debe llamarse una vez al arrancar la app, con los elementos del stage. */
export function init(stageEls) {
  els = stageEls;
}

export function setMode(id) {
  modeId = id;
}

export function getModeId() {
  return modeId;
}

/**
 * Define qué continentes quedan excluidos del sorteo de bandera objetivo,
 * en cualquier modo de juego. `continents` es un Set/array de claves de
 * continente (ver STR.continents en i18n.js: "europe", "namerica"...).
 */
export function setExcludedContinents(continents) {
  excludedContinents = new Set(continents);
}

function ctx() {
  return { els, target, MAX_ATTEMPTS };
}

/** Países elegibles como objetivo según los continentes excluidos. */
function eligibleCountries() {
  const pool = COUNTRIES.filter((c) => !excludedContinents.has(c.continent));
  // Salvaguarda: si por error se excluyeran los 6 continentes a la vez y no
  // quedara ningún país, se ignora el filtro para no romper el juego.
  return pool.length ? pool : COUNTRIES;
}

function pickTarget() {
  const pool = eligibleCountries();
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Deja el "stage" en un estado neutro antes de que el modo activo lo
 * configure. Es necesario porque los elementos del stage (canvas de
 * colores, cuadrícula...) se comparten entre todos los modos: si un modo
 * los deja visibles/poblados, sin este reset seguirían ahí encima al
 * cambiar a otro modo (p. ej. los bloques de Cuadrícula tapando el canvas
 * de Colores). Cada mode.setupStage() se encarga de volver a mostrar y
 * rellenar solo lo que necesita.
 */
function resetSharedStage() {
  const { colorCanvas, gridOverlay } = els;
  if (colorCanvas) colorCanvas.classList.add("hidden");
  if (gridOverlay) {
    gridOverlay.classList.add("hidden");
    gridOverlay.innerHTML = "";
  }
}

/** Empieza una partida nueva con el modo actualmente seleccionado. */
export function newGame() {
  target = pickTarget();
  guesses = [];
  finished = false;
  resetSharedStage();
  getMode(modeId).setupStage(ctx());
  return getState();
}

/**
 * Registra un intento. `entity` es siempre el país asociado al intento
 * (en el modo Capitales, el país cuya capital escribió el usuario).
 * Devuelve los datos del intento más el estado resultante de la partida.
 */
export function attemptGuess(entity) {
  if (finished || !entity) return null;
  if (guesses.some((g) => g.code === entity.code)) return null;

  const dist = Math.round(distanceKm(entity, target));
  const brg = bearing(entity, target);
  const isCorrect = entity.code === target.code;
  const contMatch = entity.continent === target.continent;

  const guess = { ...entity, dist, brg, isCorrect, contMatch };
  guesses.push(guess);

  const n = guesses.length;
  const mode = getMode(modeId);
  mode.reveal(ctx(), entity, isCorrect, n);

  let won = null;
  if (isCorrect) {
    finished = true;
    won = true;
    mode.finish(ctx(), true);
  } else if (n >= MAX_ATTEMPTS) {
    finished = true;
    won = false;
    mode.finish(ctx(), false);
  }

  return { guess, n, finished, won };
}

/** Ya adivinados en la partida actual (para excluirlos del autocompletado). */
export function guessedCodes() {
  return new Set(guesses.map((g) => g.code));
}

export function getState() {
  return { modeId, target, guesses, finished, mode: getMode(modeId) };
}

// ---------------------------------------------------------------------
// Modo Contrarreloj: estado y lógica independientes del motor de arriba,
// porque su flujo es "una bandera, un intento, siguiente" en vez de
// "varios intentos sobre el mismo objetivo". ui.js gestiona su propio
// temporizador (setInterval) llamando a tickTimeAttack() cada segundo.
// ---------------------------------------------------------------------
let timeState = null;

/** Elige un país distinto al indicado (evita repetir la misma bandera dos veces seguidas). */
function pickTargetExcluding(excludeCode) {
  const pool = eligibleCountries();
  if (pool.length <= 1) return pickTarget();
  let next;
  do {
    next = pickTarget();
  } while (next.code === excludeCode);
  return next;
}

/** Arranca una partida nueva de Contrarreloj. */
export function startTimeAttack() {
  const target0 = pickTarget();
  timeState = {
    timeLeft: TIME_ATTACK_SECONDS,
    correct: 0,
    wrong: 0,
    total: 0,
    target: target0,
    running: true,
  };
  return timeState;
}

/** Descuenta un segundo. Devuelve el estado actualizado (running:false si se acabó el tiempo). */
export function tickTimeAttack() {
  if (!timeState || !timeState.running) return timeState;
  timeState.timeLeft -= 1;
  if (timeState.timeLeft <= 0) {
    timeState.timeLeft = 0;
    timeState.running = false;
  }
  return timeState;
}

/**
 * Registra el único intento de la ronda actual (acierte o falle) y prepara
 * la siguiente bandera. Devuelve `{ roundResult, state }` o `null` si no
 * hay partida de Contrarreloj en curso.
 */
export function submitTimeGuess(entity) {
  if (!timeState || !timeState.running || !entity) return null;

  const isCorrect = entity.code === timeState.target.code;
  const roundResult = { target: timeState.target, isCorrect };

  timeState.total += 1;
  if (isCorrect) timeState.correct += 1;
  else timeState.wrong += 1;

  timeState.target = pickTargetExcluding(timeState.target.code);

  return { roundResult, state: timeState };
}

export function getTimeState() {
  return timeState;
}
