// js/game.js
// -----------------------------------------------------------------------
// Núcleo del flujo de juego: elegir objetivo, registrar intentos, decidir
// victoria/derrota y reiniciar. No toca el DOM directamente (eso es tarea
// de ui.js); en su lugar recibe una referencia a los elementos que el modo
// activo necesita (`els`) y delega en el módulo de modo activo para pintar
// el "stage" (el sprite y su nivel de zoom) cuando corresponde.
//
// Dos modos por ahora, en el orden en que aparecen en el menú:
//   1. Clásico  — sin stage visual; compara Tipo/Generación/Color/
//      Hábitat/Altura/Peso/Evolución (mode.needsDetails = true).
//   2. Zoom     — sprite que se aleja con cada intento (mode.hasStage).
//
// Para añadir un modo nuevo: crear js/modes/miModo.js siguiendo el
// contrato (setupStage/reveal/finish + las banderas hasStage/
// resultLayout/needsDetails) y añadirlo a MODES. Todo lo demás (menú,
// ayuda, flujo de intentos) funciona automáticamente.
// -----------------------------------------------------------------------

import { POKEMON, getPokemonDetails } from "./data.js";
import { dexDistance, dexDirection, compareNumbers } from "./utils.js";

import classicMode from "./modes/classicMode.js";
import zoomMode from "./modes/zoomMode.js";

export const MAX_ATTEMPTS = 6;

/** Modos disponibles, en el orden en que se muestran en el menú. */
export const MODES = [classicMode, zoomMode];

export function getMode(id) {
  return MODES.find((m) => m.id === id) || MODES[0];
}

// ---------------------------------------------------------------------
// Estado interno de la partida en curso. Solo hay una partida activa a la
// vez.
// ---------------------------------------------------------------------
let els = null; // referencias DOM que necesita el modo (ver ui.js#cacheEls)
let modeId = MODES[0].id;
let target = null;
let guesses = [];
let finished = false;
let excludedGenerations = new Set(); // generaciones desactivadas en Configuración

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
 * Define qué generaciones quedan excluidas del sorteo de Pokémon objetivo.
 * `generations` es un Set/array de números de generación (1-9).
 */
export function setExcludedGenerations(generations) {
  excludedGenerations = new Set(generations);
}

export function getExcludedGenerations() {
  return excludedGenerations;
}

function ctx() {
  return { els, target, MAX_ATTEMPTS };
}

/** Pokémon elegibles como objetivo según las generaciones excluidas. */
function eligiblePokemon() {
  const pool = POKEMON.filter((p) => !excludedGenerations.has(p.generation));
  // Salvaguarda: si por error se excluyeran todas las generaciones a la vez
  // y no quedara ningún Pokémon, se ignora el filtro para no romper el juego.
  return pool.length ? pool : POKEMON;
}

function pickTarget() {
  const pool = eligiblePokemon();
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Empieza una partida nueva con el modo actualmente seleccionado. Es async
 * porque los modos con `needsDetails` (Clásico) tienen que pedirle a
 * PokeAPI el detalle completo del Pokémon objetivo antes de poder jugar.
 */
export async function newGame() {
  const mode = getMode(modeId);
  const picked = pickTarget();
  target = mode.needsDetails ? await getPokemonDetails(picked.id) : picked;

  guesses = [];
  finished = false;
  mode.setupStage(ctx());
  return getState();
}

/**
 * Registra un intento. `entity` es siempre el Pokémon asociado al intento
 * (basta con que tenga `id`; si el modo activo lo necesita, acá se le
 * pide el detalle completo). Devuelve los datos del intento más el estado
 * resultante de la partida, o `null` si la partida ya terminó, no hay
 * entidad, o ya se intentó con ese mismo Pokémon.
 */
export async function attemptGuess(rawEntity) {
  if (finished || !rawEntity) return null;
  if (guesses.some((g) => g.id === rawEntity.id)) return null;

  const mode = getMode(modeId);
  const entity = mode.needsDetails ? await getPokemonDetails(rawEntity.id) : rawEntity;

  const dist = dexDistance(entity, target);
  const direction = dexDirection(entity, target);
  const isCorrect = entity.id === target.id;
  const genMatch = entity.generation === target.generation;

  const guess = { ...entity, dist, direction, isCorrect, genMatch };

  if (mode.needsDetails) {
    guess.typeComparison = compareTypes(entity.types, target.types);
    guess.colorMatch = entity.color === target.color;
    guess.habitatMatch = entity.habitat === target.habitat;
    guess.heightStatus = compareNumbers(entity.heightM, target.heightM);
    guess.weightStatus = compareNumbers(entity.weightKg, target.weightKg);
    guess.evolutionStatus = compareNumbers(entity.evolutionStage, target.evolutionStage);
  }

  guesses.push(guess);

  const n = guesses.length;
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

/**
 * Compara los tipos de un intento contra los del objetivo, slot por slot
 * (igual que el color de las letras en Wordle, pero con tipos):
 *  - "correct": el tipo coincide en el mismo slot (1º o 2º) que el objetivo.
 *  - "present": el tipo existe en el objetivo, pero en el otro slot.
 *  - "absent": el objetivo no tiene ese tipo.
 */
function compareTypes(guessTypes = [], targetTypes = []) {
  const slots = [guessTypes[0] ?? null, guessTypes[1] ?? null];
  return slots.map((type, slot) => {
    if (!type) return { type: null, status: "absent" };
    if (targetTypes[slot] === type) return { type, status: "correct" };
    if (targetTypes.includes(type)) return { type, status: "present" };
    return { type, status: "absent" };
  });
}

/** Ya adivinados en la partida actual (para excluirlos del autocompletado). */
export function guessedIds() {
  return new Set(guesses.map((g) => g.id));
}

export function getState() {
  return { modeId, target, guesses, finished, mode: getMode(modeId) };
}
