// ============================================================
// 🎬 DULCERÍA CINETECA NACIONAL — script.js
// ============================================================

// ─── ESTADO GLOBAL ───────────────────────────────────────────
let seccionActual = "alimentos";
let audioActivo = true;
let carrito = [];
let seleccionModal = {};

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const secciones = {
    alimentos: ["palomitas", "papas", "dulces", "galletas", "chocolates", "cacahuates"],
    bebidas:   ["refrescos", "agua", "jugos", "icee"],
    combos:    ["individuales", "pareja", "familiares"]
};

const instrucciones = {
    palomitas:    "Presiona Modificar para personalizar tus palomitas",
    papas:        "Elige tus papas y la cantidad",
    dulces:       "Elige tus dulces y la cantidad",
    galletas:     "Elige tus galletas y la cantidad",
    chocolates:   "Elige tus chocolates y la cantidad",
    cacahuates:   "Elige tus cacahuates y la cantidad",
    refrescos:    "Presiona Modificar para personalizar tu refresco",
    agua:         "Elige tu agua y la cantidad",
    jugos:        "Elige tu jugo y la cantidad",
    icee:         "Elige tu Icee y la cantidad",
    individuales: "Elige tu combo individual",
    pareja:       "Elige tu combo para pareja",
    familiares:   "Elige tu combo familiar"
};

// ─── AUDIO ───────────────────────────────────────────────────
function leerTexto(texto) {
    if (!audioActivo) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = "es-MX";
    msg.rate = 1;
    window.speechSynthesis.speak(msg);
}

// ─── DOM REFS ────────────────────────────────────────────────
const contenedorCategorias = document.getElementById("categorias");
const textoInstruccion     = document.getElementById("instruccion");
const grid                 = document.querySelector(".productos");
const progreso             = document.getElementById("progresoCombos");

// ─── NAVEGACIÓN DE SECCIONES ─────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(boton => {
    boton.addEventListener("click", () => {
        const seccion = boton.dataset.seccion;

        if (seccion === "carrito") {
            mostrarCarrito();
            return;
        }

        seccionActual = seccion;
        ocultarCarrito();

        if (seccion === "combos") {
            grid.classList.add("combos");
            if (progreso) progreso.style.display = "flex";
            contenedorCategorias.style.display = "none";
            filtrarProductos(secciones.combos[0]);
        } else {
            grid.classList.remove("combos");
            if (progreso) progreso.style.display = "none";
            contenedorCategorias.style.display = "flex";

            contenedorCategorias.innerHTML = "";
            secciones[seccion].forEach((cat, i) => {
                const btn = document.createElement("button");
                btn.classList.add("cat-btn");
                btn.dataset.cat = cat;
                btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                if (i === 0) btn.classList.add("active");
                contenedorCategorias.appendChild(btn);
            });

            activarEventosCategorias();
            document.querySelector(".cat-btn.active")?.click();
        }
    });
});

// ─── CATEGORÍAS ──────────────────────────────────────────────
function activarEventosCategorias() {
    document.querySelectorAll(".cat-btn").forEach(boton => {
        boton.addEventListener("click", () => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            boton.classList.add("active");
            const cat = boton.dataset.cat;
            const texto = instrucciones[cat] || "Selecciona una opción";
            textoInstruccion.textContent = texto;
            leerTexto(texto);
            filtrarProductos(cat);
        });
    });
}

function filtrarProductos(categoria) {
    document.querySelectorAll(".producto").forEach(p => {
        const visible = p.dataset.cat === categoria && p.dataset.seccion === seccionActual;
        p.classList.toggle("activo", visible);
    });
}

// ─── CLICKS EN TARJETAS ──────────────────────────────────────
document.addEventListener("click", e => {

    if (e.target.closest(".btn-sumar") || e.target.closest(".btn-restar")) {
        const boton   = e.target.closest("button");
        const tarjeta = boton.closest(".producto");
        const span    = tarjeta.querySelector(".cantidad");
        const nombre  = tarjeta.querySelector(".producto-nombre")?.textContent;
        let cant = parseInt(span.textContent) || 0;
        if (boton.classList.contains("btn-sumar")) cant++;
        else if (boton.classList.contains("btn-restar") && cant > 0) cant--;
        span.textContent = cant;
        leerTexto(`${nombre} ${cant}`);
    }

    if (e.target.closest(".btn-agregar")) {
        const tarjeta = e.target.closest(".producto");
        const cant    = parseInt(tarjeta.querySelector(".cantidad")?.textContent) || 0;
        if (cant === 0) {
            mostrarToast("Selecciona una cantidad primero");
            leerTexto("Selecciona una cantidad primero");
            return;
        }
        const precio = parseFloat(tarjeta.querySelector(".producto-precio")?.textContent.replace("$","")) || 0;
        abrirModalConfirmacion({
            id:       tarjeta.dataset.id || generarId(tarjeta.querySelector(".producto-nombre")?.textContent),
            nombre:   tarjeta.querySelector(".producto-nombre")?.textContent,
            variedad: "",
            cantidad: cant,
            precio,
            img:      tarjeta.querySelector("img")?.src || "",
            tarjeta
        });
    }

    if (e.target.closest(".btn-seleccionar")) {
        const tarjeta = e.target.closest(".producto");
        abrirModalTamanio(
            tarjeta.querySelector(".producto-nombre")?.textContent,
            tarjeta.querySelector("img")?.src || "",
            tarjeta.dataset.cat
        );
    }
});

// ─── MODAL DE CONFIRMACIÓN ───────────────────────────────────
function abrirModalConfirmacion(datos) {
    const modal = document.getElementById("modal-confirmacion");
    if (!modal) return;

    document.getElementById("conf-img").src              = datos.img;
    document.getElementById("conf-nombre").textContent   = datos.nombre + (datos.variedad ? ` — ${datos.variedad}` : "");
    document.getElementById("conf-detalle").textContent  = `Cantidad: ${datos.cantidad}`;
    document.getElementById("conf-total").textContent    = `Total: $${(datos.cantidad * datos.precio).toFixed(0)}`;

    modal.classList.add("visible");
    leerTexto(`¿Agregar ${datos.cantidad} ${datos.nombre}?`);

    document.getElementById("conf-agregar").onclick = () => {
        agregarAlCarrito(datos.id, datos.nombre, datos.variedad, datos.precio, datos.cantidad, datos.img);
        if (datos.tarjeta) {
            const span = datos.tarjeta.querySelector(".cantidad");
            if (span) span.textContent = "0";
        }
        modal.classList.remove("visible");
        mostrarToast(`✔ ${datos.nombre} agregado al carrito`);
        actualizarBadgeCarrito();
        leerTexto("Agregado al carrito");
    };

    document.getElementById("conf-cancelar").onclick = () => {
        modal.classList.remove("visible");
        leerTexto("Cancelado");
    };

    modal.querySelector(".modal-conf-overlay").onclick = () => {
        modal.classList.remove("visible");
    };
}

// ─── MODAL DE TAMAÑOS ────────────────────────────────────────
function abrirModalTamanio(nombre, imgSrc, cat) {
    seleccionModal = {};
    const modal = document.getElementById("modal-palomitas");
    if (!modal) return;

    const tituloEl = modal.querySelector(".modal-producto");
    if (tituloEl) tituloEl.textContent = nombre;
    const imgEl = modal.querySelector(".modal-imagen img");
    if (imgEl) imgEl.src = imgSrc;

    modal.querySelectorAll(".fila-opcion .cantidad").forEach(s => s.textContent = "0");
    modal.classList.remove("hidden");
    leerTexto(`Personaliza tu ${nombre}`);
}

document.querySelectorAll(".fila-opcion").forEach(fila => {
    const size         = fila.dataset.size;
    const precio       = parseFloat(fila.dataset.precio) || 0;
    const cantidadSpan = fila.querySelector(".cantidad");

    fila.querySelector(".mas")?.addEventListener("click", () => {
        let cant = parseInt(cantidadSpan.textContent) + 1;
        cantidadSpan.textContent = cant;
        seleccionModal[size] = { cantidad: cant, precio };
        leerTexto(`${size} ${cant}`);
    });

    fila.querySelector(".menos")?.addEventListener("click", () => {
        let cant = parseInt(cantidadSpan.textContent);
        if (cant > 0) {
            cant--;
            cantidadSpan.textContent = cant;
            if (cant === 0) delete seleccionModal[size];
            else seleccionModal[size].cantidad = cant;
            leerTexto(`${size} ${cant}`);
        }
    });
});

document.getElementById("confirmar")?.addEventListener("click", () => {
    const modal  = document.getElementById("modal-palomitas");
    const nombre = modal.querySelector(".modal-producto")?.textContent || "Palomitas";
    const imgSrc = modal.querySelector(".modal-imagen img")?.src || "";

    if (Object.keys(seleccionModal).length === 0) {
        mostrarToast("Selecciona al menos un tamaño");
        leerTexto("Selecciona al menos un tamaño");
        return;
    }

    for (const size in seleccionModal) {
        const { cantidad, precio } = seleccionModal[size];
        agregarAlCarrito(
            `${nombre}-${size}`.replace(/\s+/g, "-").toLowerCase(),
            nombre, size, precio, cantidad, imgSrc
        );
    }

    modal.classList.add("hidden");
    mostrarToast(`✔ ${nombre} agregado al carrito`);
    actualizarBadgeCarrito();
    leerTexto("Agregado al carrito");
    seleccionModal = {};
});

document.getElementById("cancelar")?.addEventListener("click", () => {
    document.getElementById("modal-palomitas")?.classList.add("hidden");
    leerTexto("Cancelado");
});

// ─── CARRITO ─────────────────────────────────────────────────
function agregarAlCarrito(id, nombre, variedad, precio, cantidad, img) {
    precio = parseFloat(precio) || 0;
    const key = id + (variedad ? `-${variedad}` : "");
    const existente = carrito.find(i => i._key === key);
    if (existente) existente.cantidad += cantidad;
    else carrito.push({ _key: key, id, nombre, variedad, precio, cantidad, img });
}

function actualizarBadgeCarrito() {
    const total = carrito.reduce((acc, i) => acc + i.cantidad, 0);
    const badge = document.getElementById("carrito-badge");
    if (!badge) return;
    badge.textContent = total;
    badge.classList.toggle("visible", total > 0);
    const btnCarrito = document.querySelector('.nav-btn[data-seccion="carrito"]');
    if (btnCarrito && badge.parentElement !== btnCarrito) btnCarrito.appendChild(badge);
}

function mostrarCarrito() {
    ocultarProductos();
    const vistaCarrito = document.getElementById("vista-carrito");
    if (!vistaCarrito) return;
    renderizarCarrito(vistaCarrito);
    vistaCarrito.classList.add("visible");
}

function renderizarCarrito(contenedor) {
    const totalGeneral = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    let html = `<p class="carrito-instruccion">Presiona "Editar" para hacer cambios en tu pedido o presiona pagar para continuar</p>`;

    if (carrito.length === 0) {
        html += `<div class="carrito-vacio">Tu carrito está vacío 🛒</div>`;
    } else {
        html += `<div class="carrito-lista">`;
        carrito.forEach((item, idx) => {
            const subtotal = (item.precio * item.cantidad).toFixed(0);
            html += `
            <div class="carrito-item" data-idx="${idx}">
                <img src="${item.img}" alt="${item.nombre}" onerror="this.src=''">
                <div class="carrito-info">
                    <span class="carrito-nombre">${item.nombre}</span>
                    ${item.variedad ? `<span class="carrito-variedad">${item.variedad}</span>` : ""}
                </div>
                <div class="carrito-controles">
                    <button class="ci-eliminar" data-idx="${idx}">✖ Eliminar</button>
                    <div class="ci-cant-wrap">
                        <button class="ci-btn ci-menos" data-idx="${idx}">−</button>
                        <span class="ci-cantidad">${item.cantidad}</span>
                        <button class="ci-btn ci-mas" data-idx="${idx}">+</button>
                    </div>
                    <span class="ci-total">Total&nbsp;$${subtotal}</span>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    html += `
        <div class="carrito-footer">
            <button class="btn-vaciar" id="btn-vaciar-carrito">🗑 Vaciar</button>
            <span class="carrito-total-label">Total: $${totalGeneral.toFixed(0)}</span>
            <button class="btn-pagar" id="btn-pagar">Pagar</button>
        </div>`;

    contenedor.innerHTML = html;

    contenedor.querySelectorAll(".ci-mas").forEach(btn => {
        btn.addEventListener("click", () => {
            carrito[parseInt(btn.dataset.idx)].cantidad++;
            actualizarBadgeCarrito();
            renderizarCarrito(contenedor);
        });
    });

    contenedor.querySelectorAll(".ci-menos").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            if (carrito[idx].cantidad > 1) carrito[idx].cantidad--;
            else carrito.splice(idx, 1);
            actualizarBadgeCarrito();
            renderizarCarrito(contenedor);
        });
    });

    contenedor.querySelectorAll(".ci-eliminar").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            const nombre = carrito[idx].nombre;
            carrito.splice(idx, 1);
            actualizarBadgeCarrito();
            mostrarToast(`${nombre} eliminado`);
            renderizarCarrito(contenedor);
        });
    });

    document.getElementById("btn-vaciar-carrito")?.addEventListener("click", () => {
        if (carrito.length === 0) return;
        carrito = [];
        actualizarBadgeCarrito();
        mostrarToast("Carrito vaciado");
        leerTexto("Carrito vaciado");
        renderizarCarrito(contenedor);
    });

    document.getElementById("btn-pagar")?.addEventListener("click", () => {
        if (carrito.length === 0) {
            mostrarToast("Tu carrito está vacío");
            leerTexto("Tu carrito está vacío");
            return;
        }
        leerTexto("Procediendo al pago");
        mostrarToast("🎬 Procediendo al pago…");
    });
}

function ocultarCarrito() {
    document.getElementById("vista-carrito")?.classList.remove("visible");
    mostrarProductos();
}

function ocultarProductos() {
    if (grid) grid.style.display = "none";
    contenedorCategorias.style.display = "none";
    textoInstruccion.closest(".Instruccion").style.display = "none";
    if (progreso) progreso.style.display = "none";
}

function mostrarProductos() {
    if (grid) grid.style.display = "";
    textoInstruccion.closest(".Instruccion").style.display = "";
    if (seccionActual !== "combos") contenedorCategorias.style.display = "flex";
}

// ─── TOAST ───────────────────────────────────────────────────
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast-notif");
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add("visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 2500);
}

// ─── HELPERS ─────────────────────────────────────────────────
function generarId(nombre) {
    return (nombre || "prod").toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
window.addEventListener("load", () => {
    document.querySelector('.nav-btn[data-seccion="alimentos"]')?.click();
    setTimeout(() => leerTexto("Selecciona una categoría para comenzar"), 800);
});
