// js/modes/timeAttackMode.js
// -----------------------------------------------------------------------
// Modo "Contrarreloj": no sigue el contrato estándar de setupStage/reveal/
// finish que usan zoom/colors/capital/grid, porque su flujo es distinto —
// una ronda por bandera, un único intento cada una (acierte o falle se
// pasa a la siguiente), hasta que se acaba el tiempo. Por eso game.js y
// ui.js lo tratan como caso especial marcado con `timeAttack: true`.
//
// Este objeto solo aporta los metadatos que necesita el menú y la ayuda
// (título, descripción, tipo de intento). La lógica de la partida vive en
// startTimeAttack/tickTimeAttack/submitTimeGuess de game.js, y quien
// gestiona el DOM (temporizador, bandera, resultados) es ui.js
// directamente — ver startTimeAttackGame() en ui.js.
// -----------------------------------------------------------------------

const timeAttackMode = {
  id: "time",
  guessType: "country",
  titleKey: "modeTimeTitle",
  descKey: "modeTimeDesc",
  helpKey: "helpBodyTime",
  timeAttack: true,
};

export default timeAttackMode;
