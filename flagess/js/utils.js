// js/utils.js
// -----------------------------------------------------------------------
// Utilidades puras y reutilizables (geografía, texto). No dependen del DOM
// ni del estado del juego, por lo que se pueden testear/importar libremente
// desde game.js, ui.js o cualquier modo.
// -----------------------------------------------------------------------

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/** Normaliza texto para comparaciones tolerantes a mayúsculas/acentos. */
export function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Distancia en km entre dos puntos {lat, lon} (fórmula de Haversine). */
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Rumbo (0-360°) desde el punto a hacia el punto b. */
export function bearing(a, b) {
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Distancia máxima aproximada entre dos puntos de la Tierra (medio ecuador). */
export function maxDistance() {
  return 20015;
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

/** URL de la imagen de bandera (alta resolución) para un código de país. */
export function flagUrl(code) {
  return `https://flagcdn.com/w640/${code}.png`;
}

/** URL de la imagen de bandera en miniatura, usada en listas/desplegables. */
export function flagThumbUrl(code, width = 40) {
  return `https://flagcdn.com/w${width}/${code}.png`;
}
