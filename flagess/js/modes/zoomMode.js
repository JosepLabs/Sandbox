// js/modes/zoomMode.js
// -----------------------------------------------------------------------
// Modo "Zoom": la bandera aparece muy ampliada y se aleja (zoom out) con
// cada intento hasta mostrarse completa.
//
// Contrato que cumple todo módulo de modo (ver también colorsMode.js,
// capitalMode.js y gridMode.js) para que game.js/ui.js puedan tratarlos
// de forma intercambiable:
//   id          -> identificador único
//   guessType   -> "country" | "capital": qué se busca en el autocompletado
//   titleKey/descKey/helpKey -> claves de i18n.js para menú y ayuda
//   setupStage(ctx)                         -> prepara la vista al iniciar partida
//   reveal(ctx, guessedCountry, isCorrect, n) -> actualiza la vista tras un intento
//   finish(ctx, won)                        -> deja la vista en su estado final
// -----------------------------------------------------------------------

import { flagUrl } from "../utils.js";

// Niveles de zoom por intento (índice 0 = intento inicial). Más agresivo
// que antes: el primer vistazo es un acercamiento mucho más cerrado.
const ZOOM_LEVELS = [4.6, 3.7, 3.0, 2.4, 1.9, 1.4, 1];

// Puntos posibles donde puede "anclarse" el zoom: centro y las 4 esquinas.
// Se elige uno al azar (1/5 de probabilidad cada uno) al empezar la
// partida, y se mantiene fijo durante todos los intentos de esa partida.
const ZOOM_ORIGINS = ["50% 50%", "0% 0%", "100% 0%", "0% 100%", "100% 100%"];

function zoomForAttempt(n) {
  return ZOOM_LEVELS[Math.min(n, ZOOM_LEVELS.length - 1)];
}

function randomOrigin() {
  return ZOOM_ORIGINS[Math.floor(Math.random() * ZOOM_ORIGINS.length)];
}

const zoomMode = {
  id: "zoom",
  guessType: "country",
  titleKey: "modeZoomTitle",
  descKey: "modeZoomDesc",
  helpKey: "helpBodyZoom",

  setupStage(ctx) {
    const { flagImg } = ctx.els;
    flagImg.classList.remove("visible");
    // Aplicamos el zoom máximo sin transición para que no se vea un
    // instante "sin zoom" antes de que cargue la imagen.
    flagImg.style.transition = "none";
    flagImg.style.transformOrigin = randomOrigin();
    flagImg.style.transform = `scale(${zoomForAttempt(0)})`;
    flagImg.onload = () => {
      void flagImg.offsetWidth; // fuerza reflow para aplicar el transform sin transición
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

export default zoomMode;
