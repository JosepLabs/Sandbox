// js/data.js
// -----------------------------------------------------------------------
// Fuente de datos de Pokémon. En Flagess, COUNTRIES es un array estático
// escrito a mano; acá no es viable escribir a mano ~1000 Pokémon, así que
// el índice (id + nombre) se descarga una única vez desde PokeAPI y se
// cachea en localStorage. El resto de los campos se derivan localmente
// sin peticiones extra:
//   - la generación se calcula por rango de número de Pokédex.
//   - el sprite se arma con una URL pública a partir del id.
//
// main.js llama a loadPokemonData() antes de ui.init(), así que el resto
// de la app puede asumir que POKEMON ya está poblado.
// -----------------------------------------------------------------------

const SPECIES_ENDPOINT = "https://pokeapi.co/api/v2/pokemon-species?limit=1025";
const CACHE_KEY = "pokedle_species_v1";

// [límite superior de id, generación]. generationForId busca el primer
// tramo cuyo límite alcance al id (rangos de la Pokédex nacional).
const GEN_RANGES = [
  [151, 1],
  [251, 2],
  [386, 3],
  [493, 4],
  [649, 5],
  [721, 6],
  [809, 7],
  [905, 8],
  [1025, 9],
];

function generationForId(id) {
  const found = GEN_RANGES.find(([max]) => id <= max);
  return found ? found[1] : GEN_RANGES[GEN_RANGES.length - 1][1];
}

function toDisplayName(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Lista de Pokémon jugables. Vacía hasta que loadPokemonData() resuelve. */
export let POKEMON = [];

const byId = new Map();
const byName = new Map();

export function getPokemonById(id) {
  return byId.get(id);
}

export function getPokemonByName(name) {
  return byName.get(name);
}

/** Todas las generaciones disponibles, en orden (para la UI de Configuración). */
export const GENERATIONS = GEN_RANGES.map(([, gen]) => gen);

let loadPromise = null;

/** Descarga (o recupera de caché) el índice completo de Pokémon jugables. */
export function loadPokemonData() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    let raw = readCache();

    if (!raw) {
      const res = await fetch(SPECIES_ENDPOINT);
      if (!res.ok) throw new Error(`PokeAPI respondió ${res.status}`);
      const json = await res.json();
      raw = json.results.map((entry) => {
        const idMatch = entry.url.match(/\/(\d+)\/?$/);
        return { id: Number(idMatch?.[1] ?? 0), name: entry.name };
      });
      writeCache(raw);
    }

    POKEMON = raw
      .filter((p) => p.id > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        displayName: toDisplayName(p.name),
        generation: generationForId(p.id),
      }))
      .sort((a, b) => a.id - b.id);

    POKEMON.forEach((p) => {
      byId.set(p.id, p);
      byName.set(p.name, p);
    });

    return POKEMON;
  })();

  return loadPromise;
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

function writeCache(raw) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(raw));
  } catch {
    // localStorage lleno o no disponible: seguimos solo con la copia en memoria.
  }
}

// -----------------------------------------------------------------------
// Detalle completo por Pokémon, usado por el modo Clásico (Tipo, Color,
// Hábitat, Altura, Peso, Evolución). A diferencia del índice de arriba
// (un único pedido para los ~1025), esto se pide bajo demanda, uno por
// uno, y se cachea por id para no repetir la descarga entre partidas.
// -----------------------------------------------------------------------

const DETAIL_CACHE_PREFIX = "pokedle_detail_v1_";
const detailMemoryCache = new Map();

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokeAPI respondió ${res.status} para ${url}`);
  return res.json();
}

/** Recorre la cadena evolutiva y devuelve en qué etapa está `targetName`. */
function computeEvolutionStage(chainRoot, targetName) {
  let totalStages = 0;
  let targetStage = null;

  function walk(node, depth) {
    totalStages = Math.max(totalStages, depth);
    if (node.species.name === targetName) targetStage = depth;
    node.evolves_to.forEach((child) => walk(child, depth + 1));
  }

  walk(chainRoot, 1);
  return { stage: targetStage ?? 1, totalStages };
}

/**
 * Descarga (o recupera de caché) el detalle completo de un Pokémon por su
 * número de Pokédex: tipos, generación, color, hábitat, altura, peso y
 * etapa evolutiva. Es la única función async que conoce el modo Clásico.
 */
export async function getPokemonDetails(id) {
  const cacheKey = `${DETAIL_CACHE_PREFIX}${id}`;

  if (detailMemoryCache.has(cacheKey)) return detailMemoryCache.get(cacheKey);
  const stored = readDetailCache(cacheKey);
  if (stored) {
    detailMemoryCache.set(cacheKey, stored);
    return stored;
  }

  const [pokemon, species] = await Promise.all([
    fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`),
    fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
  ]);

  const evolutionChain = await fetchJson(species.evolution_chain.url);
  const { stage, totalStages } = computeEvolutionStage(evolutionChain.chain, species.name);

  const details = {
    id: pokemon.id,
    name: species.name,
    displayName: toDisplayName(species.name),
    generation: generationForId(pokemon.id),
    types: pokemon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    color: species.color?.name ?? "unknown",
    habitat: species.habitat?.name ?? "unknown",
    heightM: pokemon.height / 10, // decímetros -> metros
    weightKg: pokemon.weight / 10, // hectogramos -> kg
    evolutionStage: stage,
    evolutionTotalStages: totalStages,
  };

  detailMemoryCache.set(cacheKey, details);
  writeDetailCache(cacheKey, details);
  return details;
}

function readDetailCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDetailCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage lleno o no disponible: seguimos solo con la copia en memoria.
  }
}
