// js/utils.js
// -----------------------------------------------------------------------
// Utilidades puras y reutilizables (texto, aleatoriedad, Pokédex). No
// dependen del DOM ni del estado del juego, por lo que se pueden
// testear/importar libremente desde game.js, ui.js o cualquier modo.
//
// Equivalentes a los de la versión "Flagess" (países):
//   distanceKm(a,b) / bearing(a,b)  ->  dexDistance(a,b) / dexDirection(a,b)
//   flagUrl(code)                  ->  spriteUrl(id)
// -----------------------------------------------------------------------

/** Normaliza texto para comparaciones tolerantes a mayúsculas/acentos. */
export function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Devuelve un entero aleatorio en [0, n). */
export function randInt(n) {
  return Math.floor(Math.random() * n);
}

/** Baraja un array in-place (Fisher-Yates) y lo devuelve. */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * "Distancia" entre dos Pokémon: la diferencia entre sus números de
 * Pokédex nacional. Cumple el mismo rol que distanceKm() en Flagess
 * (cuanto más bajo, más cerca estuvo el intento del objetivo).
 */
export function dexDistance(a, b) {
  return Math.abs(a.id - b.id);
}

/**
 * Indica si hay que buscar un número de Pokédex mayor ("up"), menor
 * ("down") o si coincide exactamente ("equal"). Es el equivalente
 * simplificado de bearing() (que en Flagess da un ángulo 0-360°): aquí
 * solo existe un eje -el número de la Pokédex-, así que basta con dos
 * sentidos posibles.
 */
export function dexDirection(guess, target) {
  if (guess.id === target.id) return "equal";
  return guess.id < target.id ? "up" : "down";
}

/** Distancia máxima aproximada dentro de la Pokédex nacional (1..1025). */
export function maxDexDistance() {
  return 1024;
}

/**
 * Compara dos valores numéricos (altura, peso, etapa evolutiva...) y
 * devuelve 'equal' | 'higher' | 'lower' relativo al intento: 'higher'
 * significa que el valor del objetivo es mayor que el del intento.
 * Lo usa el modo Clásico para las flechas ▲▼ de Altura/Peso/Evolución.
 */
export function compareNumbers(guessValue, targetValue) {
  if (guessValue === targetValue) return "equal";
  return guessValue < targetValue ? "higher" : "lower";
}

/** URL de la ilustración oficial (alta resolución) de un Pokémon por id. */
export function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/** URL del sprite en miniatura, usado en listas/desplegables. */
export function spriteThumbUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/** Formatea un número de Pokédex como "#006". */
export function formatDex(id) {
  return `#${String(id).padStart(3, "0")}`;
}
