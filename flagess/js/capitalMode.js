// js/modes/capitalMode.js
// -----------------------------------------------------------------------
// Modo "Capitales" (nuevo): en vez de escribir el nombre de un país, el
// usuario escribe capitales. La bandera del país objetivo se revela con el
// mismo efecto de zoom progresivo que el modo Zoom, y se conservan las
// pistas de continente/distancia: como cada capital identifica un único
// país, la comparación de distancia/continente se hace igual que en los
// demás modos, solo cambia qué texto se busca y se muestra (capital en vez
// de nombre de país). Ver game.js: `guessType: "capital"` hace que el
// autocompletado y las filas de intento usen `countryCapital()`.
// -----------------------------------------------------------------------

import { flagUrl } from "../utils.js";

const ZOOM_LEVELS = [3.4, 2.8, 2.3, 1.8, 1.4, 1.1, 1];

function zoomForAttempt(n) {
  return ZOOM_LEVELS[Math.min(n, ZOOM_LEVELS.length - 1)];
}

const capitalMode = {
  id: "capital",
  guessType: "capital",
  titleKey: "modeCapitalTitle",
  descKey: "modeCapitalDesc",
  helpKey: "helpBodyCapital",

  setupStage(ctx) {
    const { flagImg } = ctx.els;
    flagImg.classList.remove("visible");
    flagImg.style.transition = "none";
    flagImg.style.transform = `scale(${zoomForAttempt(0)})`;
    flagImg.onload = () => {
      void flagImg.offsetWidth;
      flagImg.style.transition = "";
      flagImg.classList.add("visible");
    };
    flagImg.src = flagUrl(ctx.target.code);
  },

  reveal(ctx, guessedCountry, isCorrect, n) {
    const { flagImg } = ctx.els;
    flagImg.style.transform = `scale(${zoomForAttempt(isCorrect ? ctx.MAX_ATTEMPTS : n)})`;
  },

  finish(ctx, won) {
    const { flagImg } = ctx.els;
    flagImg.style.transform = "scale(1)";
    flagImg.classList.add("visible");
  },
};

export default capitalMode;
