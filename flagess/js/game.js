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

export const MAX_ATTEMPTS = 6;

/** Modos disponibles, en el orden en que se muestran en el menú. */
export const MODES = [zoomMode, colorsMode, capitalMode, gridMode];

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

function ctx() {
  return { els, target, MAX_ATTEMPTS };
}

function pickTarget() {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
}

/** Empieza una partida nueva con el modo actualmente seleccionado. */
export function newGame() {
  target = pickTarget();
  guesses = [];
  finished = false;
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
