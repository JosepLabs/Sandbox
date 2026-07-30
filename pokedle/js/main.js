// js/main.js
// -----------------------------------------------------------------------
// Punto de entrada de la aplicación. index.html lo carga como
// <script type="module" src="js/main.js">. Su única responsabilidad es
// arrancar la capa de interfaz una vez el DOM está listo.
// -----------------------------------------------------------------------

import { init } from "./ui.js";

document.addEventListener("DOMContentLoaded", init);
