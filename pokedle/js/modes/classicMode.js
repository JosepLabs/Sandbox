// js/modes/classicMode.js
// -----------------------------------------------------------------------
// Modo "Clásico" — el modo principal (número uno en el menú). A diferencia
// de Zoom, no tiene ningún campo de visualización (ni sprite ni "stage"):
// cada intento se compara directamente contra el Pokémon objetivo en
// Tipo, Generación, Color, Hábitat, Altura, Peso y Etapa evolutiva.
//
// Por eso `hasStage` es false (ui.js oculta el recuadro de imagen) y
// `resultLayout` es "table" (ui.js pinta una tabla de comparación en vez
// de las filas con sprite que usa Zoom). `needsDetails` le dice a game.js
// que, antes de calcular la comparación, tiene que pedir el detalle
// completo del Pokémon (ver data.js#getPokemonDetails) tanto para el
// objetivo como para cada intento.
//
// setupStage/reveal/finish no hacen nada acá: toda la comparación la
// calcula game.js (en attemptGuess) y toda la pintura la hace ui.js
// (buildClassicRow); este objeto solo aporta metadatos y cumple el mismo
// contrato que el resto de los modos para que game.js los trate de forma
// uniforme.
// -----------------------------------------------------------------------

const classicMode = {
  id: "classic",
  guessType: "pokemon",
  needsDetails: true,
  hasStage: false,
  resultLayout: "table",
  titleKey: "modeClassicTitle",
  descKey: "modeClassicDesc",
  helpKey: "helpBodyClassic",

  setupStage() {
    // Sin campo de visualización: no hay nada que preparar.
  },
  reveal() {
    // La comparación completa la arma game.js; ui.js la pinta en la tabla.
  },
  finish() {
    // Idem: no hay stage que cerrar.
  },
};

export default classicMode;
