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
    appName: "Flagess",
    backToMenu: "Menú",
    menuTitle: "Flagess",
    menuTagline: "Elige un modo de juego",

    // ---- tarjetas del menú ----
    modeZoomTitle: "Zoom",
    modeZoomDesc: "La bandera empieza muy ampliada y se aleja con cada intento.",
    modeColorsTitle: "Colores",
    modeColorsDesc: "Cada intento revela los colores que comparte con el país objetivo.",
    modeCapitalTitle: "Capitales",
    modeCapitalDesc: "Adivina la capital del país oculto tras la bandera.",
    modeGridTitle: "Cuadrícula",
    modeGridDesc: "Cada fallo destapa un bloque nuevo de la bandera.",

    // ---- juego (comunes) ----
    placeholder: "Escribe el nombre de un país…",
    placeholderCapital: "Escribe el nombre de una capital…",
    guessBtn: "Adivinar",
    playAgain: "Jugar de nuevo",
    attempt: (n, max) => `Intento ${n}/${max}`,
    solved: "Resuelto",
    outOfTries: "Sin intentos",
    win: (name) => `Correcto. Era ${name}.`,
    lose: (name) => `Se acabaron los intentos. Era ${name}.`,
    winCapital: (capital, country) => `Correcto. ${capital} es la capital de ${country}.`,
    loseCapital: (capital, country) => `Se acabaron los intentos. Era ${capital} (${country}).`,

    // ---- ayuda ----
    helpTitle: "Cómo jugar",
    helpBody1: "Cada partida tiene un país objetivo. Escribe un nombre y selecciónalo de la lista para adivinar.",
    helpBodyZoom: "En el modo Zoom la bandera aparece muy ampliada y se aleja con cada intento hasta mostrarse completa.",
    helpBodyColors: "En el modo Colores el recuadro empieza con el color de fondo. Si un país que adivinas comparte colores con el país objetivo, esos colores se revelan en el recuadro.",
    helpBodyCapital: "En el modo Capitales adivinas escribiendo capitales en vez de países. La bandera se muestra completa desde el principio.",
    helpBodyGrid: "En el modo Cuadrícula la bandera está tapada por 6 bloques. Cada intento fallido destapa un bloque aleatorio.",
    helpBody2: "Por cada intento verás el continente del país (coincide o no) y una flecha que indica dirección y distancia hacia el país correcto.",
    helpBody3: (max) => `Tienes ${max} intentos por partida.`,
    understood: "Entendido",

    // ---- configuración ----
    settingsTitle: "Configuración",
    groupMode: "Modo de juego",
    groupTheme: "Tema",
    themeDark: "Oscuro",
    themeLight: "Claro",
    groupLanguage: "Idioma",
    groupOther: "Otros",
    reduceMotion: "Reducir animaciones",
    newGame: "Nueva partida",

    // ---- datos ----
    continents: {
      europe: "Europa",
      namerica: "América del Norte",
      samerica: "América del Sur",
      asia: "Asia",
      africa: "África",
      oceania: "Oceanía",
    },
    km: "km",
  },

  en: {
    appName: "Flagess",
    backToMenu: "Menu",
    menuTitle: "Flagess",
    menuTagline: "Choose a game mode",

    modeZoomTitle: "Zoom",
    modeZoomDesc: "The flag starts heavily zoomed in and pulls back with each guess.",
    modeColorsTitle: "Colors",
    modeColorsDesc: "Each guess reveals the colors it shares with the target country.",
    modeCapitalTitle: "Capitals",
    modeCapitalDesc: "Guess the capital of the country hidden behind the flag.",
    modeGridTitle: "Grid",
    modeGridDesc: "Each wrong guess uncovers a new block of the flag.",

    placeholder: "Type a country name…",
    placeholderCapital: "Type a capital city name…",
    guessBtn: "Guess",
    playAgain: "Play again",
    attempt: (n, max) => `Attempt ${n}/${max}`,
    solved: "Solved",
    outOfTries: "Out of tries",
    win: (name) => `Correct. It was ${name}.`,
    lose: (name) => `Out of tries. It was ${name}.`,
    winCapital: (capital, country) => `Correct. ${capital} is the capital of ${country}.`,
    loseCapital: (capital, country) => `Out of tries. It was ${capital} (${country}).`,

    helpTitle: "How to play",
    helpBody1: "Each game has a target country. Type a name and pick it from the list to guess.",
    helpBodyZoom: "In Zoom mode the flag starts heavily zoomed in and pulls back with each guess until it's fully shown.",
    helpBodyColors: "In Colors mode the box starts as the background color. If a country you guess shares colors with the target, those colors get revealed in the box.",
    helpBodyCapital: "In Capitals mode you guess by typing capital cities instead of countries. The flag is shown in full from the start.",
    helpBodyGrid: "In Grid mode the flag is covered by 6 blocks. Each wrong guess uncovers a random block.",
    helpBody2: "Each guess shows the country's continent (matching or not) and an arrow with the direction and distance to the correct country.",
    helpBody3: (max) => `You have ${max} attempts per game.`,
    understood: "Got it",

    settingsTitle: "Settings",
    groupMode: "Game mode",
    groupTheme: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    groupLanguage: "Language",
    groupOther: "Other",
    reduceMotion: "Reduce animations",
    newGame: "New game",

    continents: {
      europe: "Europe",
      namerica: "North America",
      samerica: "South America",
      asia: "Asia",
      africa: "Africa",
      oceania: "Oceania",
    },
    km: "km",
  },
};
