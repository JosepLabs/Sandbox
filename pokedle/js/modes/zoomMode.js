// js/modes/zoomMode.js
// -----------------------------------------------------------------------
// Modo "Zoom": único modo implementado por ahora. El sprite del Pokémon
// objetivo empieza muy ampliado (recortado, irreconocible) y se aleja un
// poco con cada intento fallido, hasta mostrarse completo al agotar los
// intentos o acertar.
//
// Sigue el mismo contrato que zoomMode.js en Flagess, para que sumar un
// modo nuevo el día de mañana (Colores, Cuadrícula...) sea sencillo:
//   - setupStage(ctx): deja el stage listo para una partida nueva.
//   - reveal(ctx, entity, isCorrect, n): actualiza el stage tras un intento.
//   - finish(ctx, won): deja el stage en su estado final (ganado/perdido).
// -----------------------------------------------------------------------

import { spriteUrl } from "../utils.js";

const ZOOM_MAX = 3.4; // mismo valor que el zoom por defecto de .flag-stage img en Flagess
const ZOOM_MIN = 1;

function scaleForAttempt(n, maxAttempts) {
  const step = (ZOOM_MAX - ZOOM_MIN) / maxAttempts;
  return Math.max(ZOOM_MIN, ZOOM_MAX - n * step);
}

const zoomMode = {
  id: "zoom",
  guessType: "pokemon",
  needsDetails: false,
  hasStage: true,
  resultLayout: "rows",
  titleKey: "modeZoomTitle",
  descKey: "modeZoomDesc",
  helpKey: "helpBodyZoom",

  setupStage(ctx) {
    const { els, target } = ctx;
    els.stage.classList.remove("won", "lost");
    els.pokeImg.classList.remove("visible");
    els.pokeImg.style.transform = `scale(${ZOOM_MAX})`;
    els.pokeImg.alt = "";
    els.pokeImg.onload = () => els.pokeImg.classList.add("visible");
    els.pokeImg.src = spriteUrl(target.id);
  },

  reveal(ctx, _entity, _isCorrect, n) {
    const { els, MAX_ATTEMPTS } = ctx;
    els.pokeImg.style.transform = `scale(${scaleForAttempt(n, MAX_ATTEMPTS)})`;
  },

  finish(ctx, won) {
    const { els } = ctx;
    els.pokeImg.style.transform = "scale(1)";
    els.stage.classList.add(won ? "won" : "lost");
  },
};

export default zoomMode;
