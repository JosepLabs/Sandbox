// js/modes/capitalMode.js
// -----------------------------------------------------------------------
// Modo "Capitales": en vez de escribir el nombre de un país, el usuario
// escribe capitales. La bandera se muestra completa y sin zoom desde el
// principio (solo con un fundido de entrada); lo único que cambia frente
// a los demás modos es qué se busca y se muestra en el autocompletado y
// las filas de intento (capital en vez de nombre de país). Ver game.js:
// `guessType: "capital"` hace que ui.js use `countryCapital()`.
// -----------------------------------------------------------------------

import { flagUrl } from "../utils.js";

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
    flagImg.style.transformOrigin = "";
    flagImg.style.transform = "scale(1)";
    flagImg.onload = () => {
      void flagImg.offsetWidth;
      flagImg.style.transition = "";
      flagImg.classList.add("visible");
    };
    flagImg.src = flagUrl(ctx.target.code);
  },

  reveal(ctx, guessedCountry, isCorrect, n) {
    // La bandera ya se muestra completa desde el inicio: no hay revelado
    // progresivo en este modo, solo cambia qué se adivina (capitales).
  },

  finish(ctx, won) {
    const { flagImg } = ctx.els;
    flagImg.classList.add("visible");
  },
};

export default capitalMode;
