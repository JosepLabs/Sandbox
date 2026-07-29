// js/modes/colorsMode.js
// -----------------------------------------------------------------------
// Modo "Colores": el recuadro empieza relleno con el color de fondo. Cada
// país que se adivina se compara píxel a píxel con la bandera objetivo y
// los píxeles de color parecido se "revelan" con su color real.
// -----------------------------------------------------------------------

import { flagUrl } from "../utils.js";

const PIXEL_W = 300;
const PIXEL_H = 200;
const COLOR_TOLERANCE = 90;

// Estado interno del modo. Como solo hay una partida activa a la vez, es
// seguro guardarlo a nivel de módulo (igual que hacía el archivo original).
let targetImageData = null;
let revealedMask = null;
let revealToken = 0; // invalida revelados asíncronos de una partida anterior

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // necesario para leer píxeles sin error de CORS
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getFlagPixelData(code) {
  const img = await loadImage(flagUrl(code));
  const off = document.createElement("canvas");
  off.width = PIXEL_W;
  off.height = PIXEL_H;
  const octx = off.getContext("2d");
  octx.drawImage(img, 0, 0, PIXEL_W, PIXEL_H);
  return octx.getImageData(0, 0, PIXEL_W, PIXEL_H);
}

// Resuelve cualquier color CSS (incluido var(--x)) a [r,g,b,a] concretos.
function resolveCssColorToRgba(cssColor) {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const pctx = probe.getContext("2d");
  pctx.fillStyle = cssColor;
  pctx.fillRect(0, 0, 1, 1);
  return pctx.getImageData(0, 0, 1, 1).data;
}

function currentStageBgRgb() {
  const raw = getComputedStyle(document.body).getPropertyValue("--ink-3").trim();
  return resolveCssColorToRgba(raw || "#182b38");
}

function fillColorCanvasBackground(ctx) {
  const { colorCanvas } = ctx.els;
  const cctx = colorCanvas.getContext("2d");
  cctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--ink-3").trim();
  cctx.fillRect(0, 0, PIXEL_W, PIXEL_H);
}

function redrawColorCanvas(ctx) {
  const { colorCanvas } = ctx.els;
  const cctx = colorCanvas.getContext("2d");
  if (!targetImageData) {
    fillColorCanvasBackground(ctx);
    return;
  }
  const bg = currentStageBgRgb();
  const out = cctx.createImageData(PIXEL_W, PIXEL_H);
  const total = PIXEL_W * PIXEL_H;
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    if (revealedMask && revealedMask[i]) {
      out.data[p] = targetImageData.data[p];
      out.data[p + 1] = targetImageData.data[p + 1];
      out.data[p + 2] = targetImageData.data[p + 2];
      out.data[p + 3] = 255;
    } else {
      out.data[p] = bg[0];
      out.data[p + 1] = bg[1];
      out.data[p + 2] = bg[2];
      out.data[p + 3] = 255;
    }
  }
  cctx.putImageData(out, 0, 0);
}

const colorsMode = {
  id: "colors",
  guessType: "country",
  titleKey: "modeColorsTitle",
  descKey: "modeColorsDesc",
  helpKey: "helpBodyColors",

  setupStage(ctx) {
    const { flagImg, colorCanvas } = ctx.els;
    flagImg.classList.remove("visible");
    flagImg.style.transform = "scale(1)";
    colorCanvas.classList.remove("hidden");
    revealToken++;
    targetImageData = null;
    revealedMask = new Uint8Array(PIXEL_W * PIXEL_H);
    fillColorCanvasBackground(ctx);
  },

  async reveal(ctx, guessedCountry, isCorrect, n) {
    const { flagImg, colorCanvas } = ctx.els;
    const myToken = revealToken;
    try {
      if (!targetImageData) {
        targetImageData = await getFlagPixelData(ctx.target.code);
        if (myToken !== revealToken) return; // empezó otra partida mientras tanto
      }
      const guessedImageData = await getFlagPixelData(guessedCountry.code);
      if (myToken !== revealToken) return;

      const total = PIXEL_W * PIXEL_H;
      for (let i = 0; i < total; i++) {
        const p = i * 4;
        const dr = targetImageData.data[p] - guessedImageData.data[p];
        const dg = targetImageData.data[p + 1] - guessedImageData.data[p + 1];
        const db = targetImageData.data[p + 2] - guessedImageData.data[p + 2];
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < COLOR_TOLERANCE) revealedMask[i] = 1;
      }
      redrawColorCanvas(ctx);
    } catch (err) {
      // Imagen no cargó o CORS la bloqueó: se omite el revelado de este intento.
      console.error("[colorsMode] fallo al leer píxeles de la bandera:", err);
    }

    if (isCorrect || n >= ctx.MAX_ATTEMPTS) {
      flagImg.src = flagUrl(ctx.target.code);
      flagImg.classList.add("visible");
      colorCanvas.classList.add("hidden");
    }
  },

  finish(ctx, won) {
    const { flagImg, colorCanvas } = ctx.els;
    flagImg.src = flagUrl(ctx.target.code);
    flagImg.classList.add("visible");
    colorCanvas.classList.add("hidden");
  },
};

export default colorsMode;
