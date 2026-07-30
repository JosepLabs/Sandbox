// js/i18n.js
// -----------------------------------------------------------------------
// Todos los textos de la aplicación en Español e Inglés. Cualquier módulo
// (ui.js, modos de juego...) importa `STR` y lee `STR[lang]`.
// Añadir un idioma nuevo = añadir una clave más aquí, sin tocar el resto
// de la app.
// -----------------------------------------------------------------------

export const STR = {
  es: {
    // ---- marca / navegación ----
    appName: "Pokedle",
    backToMenu: "Menú",
    menuTitle: "Pokedle",
    menuTagline: "Elige un modo de juego",
    loading: "Cargando Pokédex…",

    // ---- tarjetas del menú ----
    modeClassicTitle: "Clásico",
    modeClassicDesc:
      "Compara Tipo, Generación, Color, Hábitat, Altura, Peso y Evolución para acotar al Pokémon secreto.",
    modeZoomTitle: "Zoom",
    modeZoomDesc: "El sprite empieza muy ampliado y se aleja con cada intento.",

    // ---- columnas del tablero (modo Clásico) ----
    colPokemon: "Pokémon",
    colType: "Tipo",
    colGen: "Gen.",
    colColor: "Color",
    colHabitat: "Hábitat",
    colHeight: "Altura",
    colWeight: "Peso",
    colEvolution: "Evolución",

    // ---- juego (comunes) ----
    placeholder: "Escribe el nombre de un Pokémon…",
    guessBtn: "Adivinar",
    playAgain: "Jugar de nuevo",
    attempt: (n, max) => `Intento ${n}/${max}`,
    solved: "Resuelto",
    outOfTries: "Sin intentos",
    win: (name) => `Correcto. Era ${name}.`,
    lose: (name) => `Se acabaron los intentos. Era ${name}.`,
    dex: "N.º",

    // ---- ayuda ----
    helpTitle: "Cómo jugar",
    helpBody1:
      "Cada partida tiene un Pokémon objetivo. Escribe un nombre y selecciónalo de la lista para adivinar.",
    helpBodyClassic:
      "En el modo Clásico cada intento compara Tipo, Generación, Color, Hábitat, Altura, Peso y Etapa evolutiva con el Pokémon objetivo. Una coincidencia exacta se resalta en dorado, y las flechas ▲▼ indican si el Pokémon correcto es más alto, más pesado o evoluciona más veces.",
    helpBodyZoom:
      "En el modo Zoom el sprite aparece muy ampliado y se aleja con cada intento hasta mostrarse completo.",
    helpBody2: "Cada modo te da pistas distintas para acercarte al Pokémon correcto en cada intento.",
    helpBody3: (max) => `Tienes ${max} intentos por partida.`,
    understood: "Entendido",

    // ---- configuración ----
    settingsTitle: "Configuración",
    groupTheme: "Tema",
    themeDark: "Oscuro",
    themeLight: "Claro",
    groupLanguage: "Idioma",
    groupGenerations: "Excluir generaciones:",
    groupOther: "Otros",
    reduceMotion: "Reducir animaciones",
    newGame: "Nueva partida",

    // ---- datos ----
    generations: {
      1: "Gen. I",
      2: "Gen. II",
      3: "Gen. III",
      4: "Gen. IV",
      5: "Gen. V",
      6: "Gen. VI",
      7: "Gen. VII",
      8: "Gen. VIII",
      9: "Gen. IX",
    },
    types: {
      normal: "Normal",
      fighting: "Lucha",
      flying: "Volador",
      poison: "Veneno",
      ground: "Tierra",
      rock: "Roca",
      bug: "Bicho",
      ghost: "Fantasma",
      steel: "Acero",
      fire: "Fuego",
      water: "Agua",
      grass: "Planta",
      electric: "Eléctrico",
      psychic: "Psíquico",
      ice: "Hielo",
      dragon: "Dragón",
      dark: "Siniestro",
      fairy: "Hada",
    },
    colors: {
      black: "Negro",
      blue: "Azul",
      brown: "Marrón",
      gray: "Gris",
      green: "Verde",
      pink: "Rosa",
      purple: "Morado",
      red: "Rojo",
      white: "Blanco",
      yellow: "Amarillo",
      unknown: "Desconocido",
    },
    habitats: {
      cave: "Cueva",
      forest: "Bosque",
      grassland: "Pradera",
      mountain: "Montaña",
      rare: "Raro",
      "rough-terrain": "Terreno escarpado",
      sea: "Mar",
      urban: "Urbano",
      "waters-edge": "Orilla del agua",
      unknown: "Desconocido",
    },
  },

  en: {
    appName: "Pokedle",
    backToMenu: "Menu",
    menuTitle: "Pokedle",
    menuTagline: "Choose a game mode",
    loading: "Loading Pokédex…",

    modeClassicTitle: "Classic",
    modeClassicDesc:
      "Compare Type, Generation, Color, Habitat, Height, Weight and Evolution to narrow down the secret Pokémon.",
    modeZoomTitle: "Zoom",
    modeZoomDesc: "The sprite starts heavily zoomed in and pulls back with each guess.",

    colPokemon: "Pokémon",
    colType: "Type",
    colGen: "Gen.",
    colColor: "Color",
    colHabitat: "Habitat",
    colHeight: "Height",
    colWeight: "Weight",
    colEvolution: "Evolution",

    placeholder: "Type a Pokémon name…",
    guessBtn: "Guess",
    playAgain: "Play again",
    attempt: (n, max) => `Attempt ${n}/${max}`,
    solved: "Solved",
    outOfTries: "Out of tries",
    win: (name) => `Correct. It was ${name}.`,
    lose: (name) => `Out of tries. It was ${name}.`,
    dex: "No.",

    helpTitle: "How to play",
    helpBody1: "Each game has a target Pokémon. Type a name and pick it from the list to guess.",
    helpBodyClassic:
      "In Classic mode each guess compares Type, Generation, Color, Habitat, Height, Weight and Evolution stage against the target Pokémon. An exact match is highlighted in gold, and the ▲▼ arrows show whether the correct Pokémon is taller, heavier, or evolves further.",
    helpBodyZoom:
      "In Zoom mode the sprite starts heavily zoomed in and pulls back with each guess until it's fully shown.",
    helpBody2: "Each mode gives you different clues to close in on the correct Pokémon with every guess.",
    helpBody3: (max) => `You have ${max} attempts per game.`,
    understood: "Got it",

    settingsTitle: "Settings",
    groupTheme: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    groupLanguage: "Language",
    groupGenerations: "Exclude generations:",
    groupOther: "Other",
    reduceMotion: "Reduce animations",
    newGame: "New game",

    generations: {
      1: "Gen. I",
      2: "Gen. II",
      3: "Gen. III",
      4: "Gen. IV",
      5: "Gen. V",
      6: "Gen. VI",
      7: "Gen. VII",
      8: "Gen. VIII",
      9: "Gen. IX",
    },
    types: {
      normal: "Normal",
      fighting: "Fighting",
      flying: "Flying",
      poison: "Poison",
      ground: "Ground",
      rock: "Rock",
      bug: "Bug",
      ghost: "Ghost",
      steel: "Steel",
      fire: "Fire",
      water: "Water",
      grass: "Grass",
      electric: "Electric",
      psychic: "Psychic",
      ice: "Ice",
      dragon: "Dragon",
      dark: "Dark",
      fairy: "Fairy",
    },
    colors: {
      black: "Black",
      blue: "Blue",
      brown: "Brown",
      gray: "Gray",
      green: "Green",
      pink: "Pink",
      purple: "Purple",
      red: "Red",
      white: "White",
      yellow: "Yellow",
      unknown: "Unknown",
    },
    habitats: {
      cave: "Cave",
      forest: "Forest",
      grassland: "Grassland",
      mountain: "Mountain",
      rare: "Rare",
      "rough-terrain": "Rough terrain",
      sea: "Sea",
      urban: "Urban",
      "waters-edge": "Water's edge",
      unknown: "Unknown",
    },
  },
};
