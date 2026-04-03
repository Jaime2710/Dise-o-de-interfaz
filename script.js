// ==========================
// 🔊 FUNCIÓN ACCESIBILIDAD
// ==========================
function leerTexto(texto){

    const speech = new SpeechSynthesisUtterance(texto);

    speech.lang = "es-MX"; 
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
}


// ==========================
// 🚀 AL CARGAR LA PÁGINA
// ==========================
window.addEventListener("load", () => {

    // Activar categoría inicial
    const activa = document.querySelector(".cat-btn.active");
    if (activa) activa.click();

    // Leer texto si existe (evita errores)
    const titulo = document.getElementById("titulo");
    const subtitulo = document.getElementById("subtitulo");

    if (titulo && subtitulo) {
        leerTexto(titulo.innerText + ". " + subtitulo.innerText);
    }

});


// ==========================
// 🧭 CAMBIO DE CATEGORÍAS
// ==========================
const botonesCategoria = document.querySelectorAll(".cat-btn");
const productos = document.querySelectorAll(".producto");

botonesCategoria.forEach(boton => {

    boton.addEventListener("click", () => {

        // Quitar estado activo
        botonesCategoria.forEach(b => b.classList.remove("active"));
        boton.classList.add("active");

        const categoria = boton.dataset.cat;

        // Filtrar productos
        productos.forEach(producto => {

            if (producto.dataset.cat === categoria) {
                producto.classList.add("activo");
            } else {
                producto.classList.remove("activo");
            }

        });

    });

});


// ==========================
// 🛒 FEEDBACK AL AGREGAR
// ==========================
const botonesAgregar = document.querySelectorAll(".btn-agregar");

botonesAgregar.forEach(boton => {

    boton.addEventListener("click", () => {

        // Cambiar texto y estilo
        boton.classList.add("agregado");
        boton.innerText = "Agregado ✓";

        // Animación tarjeta
        const producto = boton.closest(".producto");
        if (producto) {
            producto.classList.add("animado");
        }

        // Voz accesible
        leerTexto("Producto agregado");

        // Reset
        setTimeout(() => {
            boton.classList.remove("agregado");
            boton.innerText = "Agregar";
            if (producto) {
                producto.classList.remove("animado");
            }
        }, 1500);

    });

});