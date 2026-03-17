// función para leer texto
function leerTexto(texto){

const speech = new SpeechSynthesisUtterance(texto);

speech.lang = "es-MX"; 
speech.rate = 1;
speech.pitch = 1;

window.speechSynthesis.cancel();
window.speechSynthesis.speak(speech);

}


// leer título al cargar
window.addEventListener("load", () => {

const titulo = document.getElementById("titulo").innerText;
const subtitulo = document.getElementById("subtitulo").innerText;

leerTexto(titulo + ". " + subtitulo);

});


// leer botón cuando el mouse pasa encima

const boton = document.getElementById("botonInicio");

boton.addEventListener("mouseenter", () => {

leerTexto("Iniciar nuevo pedido");

});