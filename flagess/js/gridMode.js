// js/modes/gridMode.js
// -----------------------------------------------------------------------
// Modo "Cuadrícula" (nuevo): la bandera está completa desde el principio
// pero tapada por 6 bloques opacos. Cada intento fallido destapa (de forma
// permanente) un bloque aleatorio, revelando un fragmento de la bandera.
// -----------------------------------------------------------------------

import { flagUrl } from "../utils.js";
import { shuffle } from "../utils.js";

const COLS = 3;
const ROWS = 2;
const TOTAL_BLOCKS = COLS * ROWS;

// Orden en el que se destaparán los bloques en la partida actual.
let revealOrder = [];
let revealedCount = 0;

function buildBlocks(gridOverlay) {
  gridOverlay.innerHTML = "";
  for (let i = 0; i < TOTAL_BLOCKS; i++) {
    const block = document.createElement("div");
    block.className = "grid-block";
    block.dataset.idx = String(i);
    gridOverlay.appendChild(block);
  }
}

function revealBlock(gridOverlay, idx) {
  const block = gridOverlay.querySelector(`.grid-block[data-idx="${idx}"]`);
  if (block) block.classList.add("revealed");
}

function revealAllBlocks(gridOverlay) {
  gridOverlay.querySelectorAll(".grid-block").forEach((b) => b.classList.add("revealed"));
}

const gridMode = {
  id: "grid",
  guessType: "country",
  titleKey: "modeGridTitle",
  descKey: "modeGridDesc",
  helpKey: "helpBodyGrid",

  setupStage(ctx) {
    const { flagImg, gridOverlay } = ctx.els;
    // La bandera se muestra completa y sin zoom desde el inicio; lo que la
    // oculta es la cuadrícula de bloques por encima.
    flagImg.style.transition = "none";
    flagImg.style.transform = "scale(1)";
    flagImg.onload = () => {
      void flagImg.offsetWidth;
      flagImg.style.transition = "";
      flagImg.classList.add("visible");
    };
    flagImg.src = flagUrl(ctx.target.code);

    buildBlocks(gridOverlay);
    gridOverlay.classList.remove("hidden");
    revealOrder = shuffle([...Array(TOTAL_BLOCKS).keys()]);
    revealedCount = 0;
  },

  reveal(ctx, guessedCountry, isCorrect, n) {
    const { gridOverlay } = ctx.els;
    if (isCorrect) {
      revealAllBlocks(gridOverlay);
      return;
    }
    if (revealedCount < revealOrder.length) {
      revealBlock(gridOverlay, revealOrder[revealedCount]);
      revealedCount++;
    }
    if (n >= ctx.MAX_ATTEMPTS) revealAllBlocks(gridOverlay);
  },

  finish(ctx, won) {
    const { gridOverlay } = ctx.els;
    revealAllBlocks(gridOverlay);
  },
};

export default gridMode;
