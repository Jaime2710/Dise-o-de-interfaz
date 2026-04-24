// Dulceria Cineteca Nacional — script.js

// ─── Estado global
let seccionActual = "alimentos";
let audioActivo = true;
let carrito = [];
let seleccionModal = {};

// ─── Configuracion
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

// ─── Audio
function leerTexto(texto) {
    if (!audioActivo) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = "es-MX";
    msg.rate = 1;
    window.speechSynthesis.speak(msg);
}

// ─── DOM Refs
const contenedorCategorias = document.getElementById("categorias");
const textoInstruccion     = document.getElementById("instruccion");
const grid                 = document.querySelector(".productos");
const progreso             = document.getElementById("progresoCombos");

// ─── Navegacion secciones
document.querySelectorAll(".nav-btn").forEach(boton => {
    boton.addEventListener("click", () => {
        // ── Activo en nav ──
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
        boton.classList.add("activo");

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
            textoInstruccion.textContent = "Presiona Modificar para personalizar tu combo";
            leerTexto("Presiona Modificar para personalizar tu combo"); // ← agregar
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

// ─── Categorias
function activarEventosCategorias() {
    document.querySelectorAll(".cat-btn").forEach(boton => {
        boton.addEventListener("click", () => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            boton.classList.add("active");
            const cat = boton.dataset.cat;
            const texto = instrucciones[cat] || "Selecciona una opcion";
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

// ─── Clicks en tarjetas
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

// ─── Modal de confirmacion
function abrirModalConfirmacion(datos) {
    const modal = document.getElementById("modal-confirmacion");
    if (!modal) return;

    document.getElementById("conf-img").src             = datos.img;
    document.getElementById("conf-nombre").textContent  = datos.nombre + (datos.variedad ? ` - ${datos.variedad}` : "");
    document.getElementById("conf-detalle").textContent = `Cantidad: ${datos.cantidad}`;
    document.getElementById("conf-total").textContent   = `Total: $${(datos.cantidad * datos.precio).toFixed(0)}`;

    modal.classList.add("visible");
    leerTexto(`${datos.cantidad} ${datos.nombre}, total ${(datos.cantidad * datos.precio).toFixed(0)} pesos`);

    document.getElementById("conf-agregar").onclick = () => {
        agregarAlCarrito(datos.id, datos.nombre, datos.variedad, datos.precio, datos.cantidad, datos.img);
        if (datos.tarjeta) {
            const span = datos.tarjeta.querySelector(".cantidad");
            if (span) span.textContent = "0";
        }
        modal.classList.remove("visible");
        mostrarToast(`${datos.nombre} agregado al carrito`);
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

// ─── Modal de tamanios — enruta al modal correcto según categoría
function abrirModalTamanio(nombre, imgSrc, cat) {
    if (cat === "refrescos") {
        abrirModalRefrescos(nombre, imgSrc);
    } else if (cat === "icee") {
        abrirModalIcee(nombre, imgSrc);
    } else {
        abrirModalPalomitas(nombre, imgSrc);
    }
}

// ─── Modal Palomitas
function abrirModalPalomitas(nombre, imgSrc) {
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

// ─── Modal Refrescos
let seleccionRefrescos = {};

function abrirModalRefrescos(nombre, imgSrc) {
    seleccionRefrescos = {};
    const modal = document.getElementById("modal-refrescos");
    if (!modal) return;

    // Actualizar nombre e imagen
    document.getElementById("refresco-nombre").textContent = nombre;
    document.getElementById("refresco-img").src = imgSrc;

    // Resetear cantidades y switches
    modal.querySelectorAll(".fr-cantidad").forEach(s => s.textContent = "0");
    modal.querySelectorAll(".fr-hielo-check").forEach(c => c.checked = true);

    modal.classList.remove("hidden");
    leerTexto(`Personaliza tu ${nombre}`);
}

// Eventos de filas del modal de refrescos
document.querySelectorAll(".fila-refresco").forEach(fila => {
    const size       = fila.dataset.size;
    const precio     = parseFloat(fila.dataset.precio) || 0;
    const tieneHielo = fila.dataset.hielo === "true";
    const cantSpan   = fila.querySelector(".fr-cantidad");
    const hielo      = fila.querySelector(".fr-hielo-check");

    fila.querySelector(".fr-mas")?.addEventListener("click", () => {
        let cant = parseInt(cantSpan.textContent) + 1;
        cantSpan.textContent = cant;
        const conHielo = tieneHielo ? hielo?.checked : null;
        seleccionRefrescos[size] = { cantidad: cant, precio, conHielo };
        leerTexto(`${size} ${cant}`);
    });

    fila.querySelector(".fr-menos")?.addEventListener("click", () => {
        let cant = parseInt(cantSpan.textContent);
        if (cant > 0) {
            cant--;
            cantSpan.textContent = cant;
            if (cant === 0) delete seleccionRefrescos[size];
            else {
                const conHielo = tieneHielo ? hielo?.checked : null;
                seleccionRefrescos[size] = { cantidad: cant, precio, conHielo };
            }
            leerTexto(`${size} ${cant}`);
        }
    });

    // Actualizar estado de hielo en selección al cambiar el switch
    hielo?.addEventListener("change", () => {
        if (seleccionRefrescos[size]) {
            seleccionRefrescos[size].conHielo = hielo.checked;
        }
    });
});

// Confirmar modal refrescos
document.getElementById("confirmar-refresco")?.addEventListener("click", () => {
    const modal  = document.getElementById("modal-refrescos");
    const nombre = document.getElementById("refresco-nombre")?.textContent || "Refresco";
    const imgSrc = document.getElementById("refresco-img")?.src || "";

    if (Object.keys(seleccionRefrescos).length === 0) {
        mostrarToast("Selecciona al menos un tamano");
        leerTexto("Selecciona al menos un tamano");
        return;
    }

    const itemsRef = Object.entries(seleccionRefrescos).map(([size, {cantidad, precio, conHielo}]) => {
        const variedad = conHielo === true  ? `${size} con hielo`
                       : conHielo === false ? `${size} sin hielo`
                       : size;
        return {
            id: `refresco-${nombre}-${size}`.replace(/\s+/g, "-").toLowerCase(),
            nombre, variedad, precio, cantidad, img: imgSrc
        };
    });

    modal.classList.add("hidden");

    abrirConfirmacionPrevia(itemsRef, () => {
        itemsRef.forEach(i => agregarAlCarrito(i.id, i.nombre, i.variedad, i.precio, i.cantidad, i.img));
        mostrarToast(`${nombre} agregado al carrito`);
        actualizarBadgeCarrito();
        leerTexto("Agregado al carrito");
        seleccionRefrescos = {};
    });
});

// Cancelar modal refrescos
document.getElementById("cancelar-refresco")?.addEventListener("click", () => {
    document.getElementById("modal-refrescos")?.classList.add("hidden");
    leerTexto("Cancelado");
});

document.querySelectorAll("#modal-palomitas .fila-opcion").forEach(fila => {
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
        mostrarToast("Selecciona al menos un tamano");
        leerTexto("Selecciona al menos un tamano");
        return;
    }

    // Construir items para confirmación previa
    const itemsPal = Object.entries(seleccionModal).map(([size, {cantidad, precio}]) => ({
        id: `${nombre}-${size}`.replace(/\s+/g, "-").toLowerCase(),
        nombre, variedad: size, precio, cantidad, img: imgSrc
    }));

    modal.classList.add("hidden");

    abrirConfirmacionPrevia(itemsPal, () => {
        itemsPal.forEach(i => agregarAlCarrito(i.id, i.nombre, i.variedad, i.precio, i.cantidad, i.img));
        mostrarToast(`${nombre} agregado al carrito`);
        actualizarBadgeCarrito();
        leerTexto("Agregado al carrito");
        seleccionModal = {};
    });
});

document.getElementById("cancelar")?.addEventListener("click", () => {
    document.getElementById("modal-palomitas")?.classList.add("hidden");
    leerTexto("Cancelado");
});

// ─── Modal Icee
let seleccionIcee = {};

function abrirModalIcee(nombre, imgSrc) {
    seleccionIcee = {};
    const modal = document.getElementById("modal-icee");
    if (!modal) return;

    document.getElementById("icee-nombre").textContent = nombre;
    document.getElementById("icee-img").src = imgSrc;

    // Resetear solo las filas del modal icee
    modal.querySelectorAll(".fila-opcion .cantidad").forEach(s => s.textContent = "0");

    modal.classList.remove("hidden");
    leerTexto(`Personaliza tu ${nombre}`);
}

// Eventos +/- del modal Icee
document.querySelectorAll("#modal-icee .fila-opcion").forEach(fila => {
    const size       = fila.dataset.size;
    const precio     = parseFloat(fila.dataset.precio) || 0;
    const cantSpan   = fila.querySelector(".cantidad");

    fila.querySelector(".mas")?.addEventListener("click", () => {
        let cant = parseInt(cantSpan.textContent) + 1;
        cantSpan.textContent = cant;
        seleccionIcee[size] = { cantidad: cant, precio };
        leerTexto(`${size} ${cant}`);
    });

    fila.querySelector(".menos")?.addEventListener("click", () => {
        let cant = parseInt(cantSpan.textContent);
        if (cant > 0) {
            cant--;
            cantSpan.textContent = cant;
            if (cant === 0) delete seleccionIcee[size];
            else seleccionIcee[size].cantidad = cant;
            leerTexto(`${size} ${cant}`);
        }
    });
});

// Confirmar Icee
document.getElementById("confirmar-icee")?.addEventListener("click", () => {
    const modal  = document.getElementById("modal-icee");
    const nombre = document.getElementById("icee-nombre")?.textContent || "Icee";
    const imgSrc = document.getElementById("icee-img")?.src || "";

    if (Object.keys(seleccionIcee).length === 0) {
        mostrarToast("Selecciona al menos un tamano");
        leerTexto("Selecciona al menos un tamano");
        return;
    }

    const itemsIcee = Object.entries(seleccionIcee).map(([size, {cantidad, precio}]) => ({
        id: `icee-${nombre}-${size}`.replace(/\s+/g, "-").toLowerCase(),
        nombre, variedad: size, precio, cantidad, img: imgSrc
    }));

    modal.classList.add("hidden");

    abrirConfirmacionPrevia(itemsIcee, () => {
        itemsIcee.forEach(i => agregarAlCarrito(i.id, i.nombre, i.variedad, i.precio, i.cantidad, i.img));
        mostrarToast(`${nombre} agregado al carrito`);
        actualizarBadgeCarrito();
        leerTexto("Agregado al carrito");
        seleccionIcee = {};
    });
});

// Cancelar Icee
document.getElementById("cancelar-icee")?.addEventListener("click", () => {
    document.getElementById("modal-icee")?.classList.add("hidden");
    leerTexto("Cancelado");
});

// ─── Confirmación previa (resumen antes de agregar al carrito)
// Recibe un array de items: [{ nombre, variedad, precio, cantidad, img, id, tipo?, comboData? }]
// y un callback que se ejecuta si el usuario confirma
function abrirConfirmacionPrevia(items, onConfirmar) {
    const modal = document.getElementById("modal-confirmacion");
    if (!modal) { onConfirmar(); return; }

    // Calcular total
    const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    // Construir resumen en texto
    const resumen = items.map(i => {
        const v = i.variedad ? ` — ${i.variedad}` : "";
        return `${i.cantidad}x ${i.nombre}${v}`;
    }).join(", ");

    // Imagen: usar la del primer item
    const img = items[0]?.img || "";

    // Rellenar el modal existente
    document.getElementById("conf-img").src            = img;
    document.getElementById("conf-nombre").textContent = items.length === 1
        ? items[0].nombre + (items[0].variedad ? ` — ${items[0].variedad}` : "")
        : items.map(i => `${i.cantidad}x ${i.nombre}${i.variedad ? " — " + i.variedad : ""}`).join(" · ");
    document.getElementById("conf-detalle").textContent = `Cantidad: ${items.reduce((a,i) => a + i.cantidad, 0)}`;
    document.getElementById("conf-total").textContent  = `Total: $${total.toFixed(0)}`;

    modal.classList.add("visible");
    leerTexto(`${items.map(i => `${i.cantidad} ${i.nombre}`).join(", ")}, total ${total.toFixed(0)} pesos`);

    // Botón Agregar → ejecuta callback
    document.getElementById("conf-agregar").onclick = () => {
        modal.classList.remove("visible");
        onConfirmar();
    };

    document.getElementById("conf-cancelar").onclick = () => {
        modal.classList.remove("visible");
        leerTexto("Cancelado");
    };

    modal.querySelector(".modal-conf-overlay").onclick = () => {
        modal.classList.remove("visible");
    };
}

// ─── Motor del carrito
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

// ─── Vista carrito
function mostrarCarrito() {
    ocultarProductos();
    const vistaCarrito = document.getElementById("vista-carrito");
    if (!vistaCarrito) return;
    renderizarCarrito(vistaCarrito);
    vistaCarrito.classList.add("visible");
    leerAudioCarrito();
}

function leerAudioCarrito() {
    if (carrito.length === 0) {
        leerTexto("Tu carrito está vacío. Agrega alimentos, bebidas o combos para completar tu pedido");
        return;
    }

    // Instrucción
    let texto = "Presiona Editar para hacer cambios en tu pedido o presiona pagar para continuar. ";

    // Leer cada producto
    texto += "Tu pedido incluye: ";
    const items = carrito.map(item => {
        const variedad = item.variedad ? `, ${item.variedad}` : "";
        return `${item.cantidad} ${item.nombre}${variedad}`;
    });
    texto += items.join(". ");

    // Total
    const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    texto += `. Total ${total.toFixed(0)} pesos`;

    leerTexto(texto);
}

// Productos que usan modal de tamanios — muestran boton Editar en el carrito
const PRODUCTOS_CON_MODAL = ["palomitas", "refresco", "icee"];
function tieneModal(item) {
    return PRODUCTOS_CON_MODAL.some(p => item.id.toLowerCase().includes(p));
}

function renderizarCarrito(contenedor) {
    const totalGeneral = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    let html = "";

    if (carrito.length === 0) {
        html += `
        <div class="carrito-vacio">
            <p class="carrito-vacio-titulo">Tu carrito esta vacio</p>
            <p class="carrito-vacio-subtitulo">Agrega alimentos, bebidas o tus combos para completar tu pedido y pagar</p>
        </div>`;
    } else {
        html += `<p class="carrito-instruccion">Presiona "Editar" para hacer cambios en tu pedido o presiona pagar para continuar</p>`;
        html += `<div class="carrito-lista">`;

        carrito.forEach((item, idx) => {
            const subtotal = (item.precio * item.cantidad).toFixed(0);

            if (item.tipo === "combo") {
                // ── Tarjeta de combo — sin controles de cantidad ──
                html += `
                <div class="carrito-item carrito-item-combo" data-idx="${idx}">
                    <img src="${item.img}" alt="${item.nombre}" onerror="this.src=''">
                    <div class="carrito-info">
                        <span class="carrito-nombre">${item.nombre}</span>
                        <span class="carrito-variedad">${item.variedad}</span>
                    </div>
                    <span class="ci-total">Total &nbsp; $ ${subtotal}</span>
                    <div class="carrito-controles">
                        <button class="ci-eliminar" data-idx="${idx}">
                            <img src="Botones/Positivo/Cancelar.png" width="17" onerror="this.style.display='none'"> Eliminar
                        </button>
                        <button class="ci-editar ci-editar-combo" data-idx="${idx}">
                            <img src="Botones/Positivo/Editar.png" width="18" onerror="this.style.display='none'"> Editar
                        </button>
                    </div>
                </div>`;
            } else {
                // ── Tarjeta de producto normal ──
                const conModal = tieneModal(item);
                html += `
                <div class="carrito-item" data-idx="${idx}">
                    <img src="${item.img}" alt="${item.nombre}" onerror="this.src=''">
                    <div class="carrito-info">
                        <span class="carrito-nombre">${item.nombre}</span>
                        ${item.variedad ? `<span class="carrito-variedad">${item.variedad}</span>` : ""}
                    </div>
                    <span class="ci-total">Total &nbsp; $ ${subtotal}</span>
                    <div class="carrito-controles">
                        <button class="ci-eliminar" data-idx="${idx}">
                            <img src="Botones/Positivo/Cancelar.png" width="17" onerror="this.style.display='none'"> Eliminar
                        </button>
                        <div class="ci-cant-wrap">
                            <button class="ci-btn ci-menos" data-idx="${idx}"> <img src="Botones/Positivo/Menos.png" width="17" onerror="this.style.display='none'"> </button>
                            <span class="ci-cantidad">${item.cantidad}</span>
                            <button class="ci-btn ci-mas" data-idx="${idx}"> <img src="Botones/Positivo/Mas.png" width="17" onerror="this.style.display='none'"> </button>
                        </div>
                        ${conModal ? `<button class="ci-editar" data-idx="${idx}"> <img src="Botones/Positivo/Editar.png" width="20" onerror="this.style.display='none'"> Editar</button>` : ""}
                    </div>
                </div>`;
            }
        });

        html += `</div>`;
    }

    html += `
    <div class="carrito-footer">
        <button class="btn-vaciar" id="btn-vaciar-carrito"> <img src="Botones/Positivo/Vaciar.png" width="20"> Vaciar</button>
        <span class="carrito-total-label">Total: $${totalGeneral.toFixed(0)}</span>
        <button class="btn-pagar" id="btn-pagar"> Pagar</button>
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

    contenedor.querySelectorAll(".ci-editar").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx  = parseInt(btn.dataset.idx);
            const item = carrito[idx];
            carrito.splice(idx, 1);
            actualizarBadgeCarrito();
            ocultarCarrito();
            let cat = "palomitas";
            if (item.id.includes("refresco")) cat = "refrescos";
            else if (item.id.includes("icee"))    cat = "icee";
            abrirModalTamanio(item.nombre, item.img, cat);
        });
    });

    // Botón Editar de combos → abre paso 5 (resumen) del combo
    contenedor.querySelectorAll(".ci-editar-combo").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx  = parseInt(btn.dataset.idx);
            const item = carrito[idx];
            if (item.comboData) {
                COMBO1.estado = { ...item.comboData, paso: 5 };
                combo1RenderResumen();
                combo1IrAPaso(5);
                document.getElementById("modal-combo1")?.classList.remove("hidden");
                ocultarCarrito();
            }
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
            mostrarToast("Tu carrito esta vacio");
            leerTexto("Tu carrito esta vacio");
            return;
        }
        abrirModalPago();
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

// ─── Toast
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast-notif");
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add("visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 2500);
}

// ─── Helper
function generarId(nombre) {
    return (nombre || "prod").toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
}

// ─── Modal de método de pago
function abrirModalPago() {
    const modal = document.getElementById("modal-pago");
    if (!modal) return;
    modal.classList.add("visible");
    leerTexto("Selecciona tu metodo de pago");
}

document.getElementById("pago-tarjeta")?.addEventListener("click", () => {
    document.getElementById("modal-pago")?.classList.remove("visible");
    mostrarToast("Pago con tarjeta seleccionado");
    leerTexto("Pago con tarjeta");
    setTimeout(() => { window.location.href = "index.html?pago=ok"; }, 1500);
});

document.getElementById("pago-efectivo")?.addEventListener("click", () => {
    document.getElementById("modal-pago")?.classList.remove("visible");
    mostrarToast("Pago en efectivo seleccionado");
    leerTexto("Pago en efectivo");
    setTimeout(() => { window.location.href = "index.html?pago=ok"; }, 1500);
});

document.getElementById("modal-pago-cancelar")?.addEventListener("click", () => {
    document.getElementById("modal-pago")?.classList.remove("visible");
    leerTexto("Cancelado");
});

document.getElementById("modal-pago-overlay")?.addEventListener("click", () => {
    document.getElementById("modal-pago")?.classList.remove("visible");
});

// ─── Inicializacion
window.addEventListener("load", () => {
    document.querySelector('.nav-btn[data-seccion="alimentos"]')?.click();
    setTimeout(() => leerTexto("Selecciona una categoria para comenzar"), 800);
});

// Combo 1 — Flujo de 5 pasos


const COMBO1 = {
    opciones: {
        palomitas: [
            { nombre: "Palomitas Mantequilla", img: "dulceria imgs/Alimentos/Palomitas mantequilla.png" },
            { nombre: "Palomitas Caramelo",    img: "dulceria imgs/Alimentos/Palomitas caramelo.png" },
            { nombre: "Palomitas Combinadas",  img: "dulceria imgs/Alimentos/Palomitas Combinadas.png" }
        ],
        bebidas: [
            { nombre: "Sidral Mundet",        img: "dulceria imgs/Bebidas/Refrescos/S Mundet.jpg",       esRefresco: true },
            { nombre: "Fanta",                img: "dulceria imgs/Bebidas/Refrescos/Fanta.png",           esRefresco: true },
            { nombre: "Coca Cola",            img: "dulceria imgs/Bebidas/Refrescos/Coca Cola.png",      esRefresco: true },
            { nombre: "Coca Cola Sin Azucar", img: "dulceria imgs/Bebidas/Refrescos/CC Sin Azucar.png",  esRefresco: true },
            { nombre: "Coca Cola Light",      img: "dulceria imgs/Bebidas/Refrescos/CC Light.png",       esRefresco: true },
            { nombre: "Sprite",               img: "dulceria imgs/Bebidas/Refrescos/Sprite.webp",         esRefresco: true },
            { nombre: "Agua Ciel 600ml",      img: "dulceria imgs/Bebidas/Agua/Ciel 600 ml.png",         esRefresco: false }
        ],
        chocolates: [
            { nombre: "Crunch",           img: "dulceria imgs/Chocolates/Crunch.png" },
            { nombre: "M&M",              img: "dulceria imgs/Chocolates/M&M.png" },
            { nombre: "Lunetas 48gr",     img: "dulceria imgs/Chocolates/Lunetas.png" },
            { nombre: "M&M Peanuts 49gr", img: "dulceria imgs/Chocolates/M & M Peanut.png" },
            { nombre: "Milky Way",     img: "dulceria imgs/Chocolates/Milky Way.png" },
            { nombre: "Snickers", img: "dulceria imgs/Chocolates/Snickers.png" },
        ]
    },
    estado: {
        paso: 1,
        palomitas: null,
        bebida1:   null,
        bebida2:   null,
        chocolate: null
    }
};

const COMBO1_LABELS = [
    "Elige el sabor de<br>tus palomitas",
    "Elige tu primer<br>bebida",
    "Elige tu segunda<br>bebida",
    "Elige tu<br>chocolate",
    "Confirma tu<br>pedido"
];

// ── Precio según sabor de palomitas ──
function combo1Precio() {
    return COMBO1.estado.palomitas?.nombre === "Palomitas Mantequilla" ? 178 : 185;
}

// ── Abrir el combo desde la tarjeta ──
function abrirCombo1() {
    COMBO1.estado = { paso: 1, palomitas: null, bebida1: null, bebida2: null, chocolate: null };

    const modal = document.getElementById("modal-combo1");
    if (!modal) return;

    combo1RenderGrid("combo1-palomitas-grid", COMBO1.opciones.palomitas, "palomitas");
    combo1RenderGrid("combo1-bebida1-grid",   COMBO1.opciones.bebidas,   "bebida1");
    combo1RenderGrid("combo1-bebida2-grid",   COMBO1.opciones.bebidas,   "bebida2");
    combo1RenderGrid("combo1-chocolate-grid", COMBO1.opciones.chocolates,"chocolate");

    // Reset hielo y presentación
    ["bebida1","bebida2"].forEach(b => {
        const tipoPanel = document.getElementById(`combo1-${b}-tipo`);
        const hieloLabel = document.getElementById(`combo1-${b}-hielo`);
        if (tipoPanel) tipoPanel.classList.add("hidden");
        if (hieloLabel) hieloLabel.classList.remove("hidden");
        document.querySelectorAll(`#combo1-${b}-tipo .combo-tipo-btn`).forEach((btn,i) => {
            btn.classList.toggle("activo", i === 0);
        });
        const check = document.querySelector(`#combo1-${b}-hielo .fr-hielo-check`);
        if (check) check.checked = true;
    });

    combo1IrAPaso(1);
    modal.classList.remove("hidden");
    leerTexto("Elige el sabor de tus palomitas");
}

// ── Renderiza un grid de tarjetas seleccionables ──
function combo1RenderGrid(contenedorId, opciones, tipo) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    cont.innerHTML = opciones.map(op => `
        <div class="combo-sel-card"
             data-tipo="${tipo}"
             data-nombre="${op.nombre}"
             data-img="${op.img}"
             data-es-refresco="${op.esRefresco ?? false}">
            <img src="${op.img}" alt="${op.nombre}" onerror="this.src=''">
            <p>${op.nombre}</p>
        </div>
    `).join("");

    cont.querySelectorAll(".combo-sel-card").forEach(card => {
        card.addEventListener("click", () => {
            cont.querySelectorAll(".combo-sel-card").forEach(c => c.classList.remove("seleccionado"));
            card.classList.add("seleccionado");

            const nombre  = card.dataset.nombre;
            const img     = card.dataset.img;
            const esRef   = card.dataset.esRefresco === "true";

            if (tipo === "palomitas") {
                COMBO1.estado.palomitas = { nombre, img };

            } else if (tipo === "bebida1" || tipo === "bebida2") {
                const tipoPanel  = document.getElementById(`combo1-${tipo}-tipo`);
                const hieloLabel = document.getElementById(`combo1-${tipo}-hielo`);
                const check      = document.querySelector(`#combo1-${tipo}-hielo .fr-hielo-check`);
                const tipoActivo = document.querySelector(`#combo1-${tipo}-tipo .combo-tipo-btn.activo`)?.dataset.tipo === "lata" ? "Lata" : "Vaso mediano";

                if (tipoPanel) tipoPanel.classList.toggle("hidden", !esRef);
                if (hieloLabel) hieloLabel.classList.toggle("hidden", !esRef || tipoActivo === "Lata");

                COMBO1.estado[tipo] = { nombre, img, tipo: tipoActivo, hielo: check?.checked ?? true, esRefresco: esRef };

            } else if (tipo === "chocolate") {
                COMBO1.estado.chocolate = { nombre, img };
            }

            leerTexto(nombre);
        });
    });
}

// ── Ir a un paso específico ──
// Textos de audio para cada paso del combo
const COMBO1_AUDIO = [
    "Elige el sabor de tus palomitas",
    "Elige tu primera bebida",
    "Elige tu segunda bebida",
    "Elige tu chocolate",
    "Confirma tu pedido"
];

function combo1IrAPaso(paso) {
    COMBO1.estado.paso = paso;

    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`combo1-paso${i}`);
        if (el) el.classList.toggle("hidden", i !== paso);
    }

    combo1ActualizarProgreso(paso);
    leerTexto(COMBO1_AUDIO[paso - 1]);

    // Footer: mostrar Regresar desde paso 2 en adelante
    const btnReg = document.getElementById("combo1-regresar");
    if (btnReg) {
        btnReg.classList.toggle("hidden", paso === 1);
        btnReg.innerHTML = `<img src="Botones/Positivo/Flecha R.png" width="20" style="display:inline-block;vertical-align:middle;flex-shrink:0;" onerror="this.style.display='none'"> Regresar`;
        btnReg.style.cssText = "display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;";
    }

    // Cambiar texto del Confirmar en paso 5
    const btnConf = document.getElementById("combo1-confirmar");
    if (btnConf) {
        const txt = paso === 5 ? "Confirmar" : "Confirmar";
        btnConf.innerHTML = `<img src="Botones/Positivo/Confirmar.png" width="20" style="display:inline-block;vertical-align:middle;flex-shrink:0;"> ${txt}`;
        btnConf.style.cssText = "display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;";
    }
}

// ── Actualiza circulos y lineas de la barra ──
function combo1ActualizarProgreso(pasoActual) {
    const pasos  = document.querySelectorAll("#modal-combo1 .combo-paso");
    const lineas = document.querySelectorAll("#modal-combo1 .combo-linea");

    pasos.forEach((p, i) => {
        const num    = i + 1;
        const label  = p.querySelector(".combo-paso-label");
        // El circulo tiene: texto del número + <img> del check
        // Solo actualizamos el nodo de texto, sin tocar la imagen
        const circulo    = p.querySelector(".combo-paso-circulo");
        const textoNodo  = circulo ? Array.from(circulo.childNodes).find(n => n.nodeType === 3) : null;

        p.classList.remove("activo", "completado");

        if (num < pasoActual) {
            // Completado — ocultar número, mostrar imagen via CSS
            p.classList.add("completado");
            if (textoNodo) textoNodo.textContent = "";
            if (label) label.innerHTML = `Paso ${num}`;
        } else if (num === pasoActual) {
            // Activo — mostrar número
            p.classList.add("activo");
            if (textoNodo) textoNodo.textContent = String(num);
            if (label) label.innerHTML = COMBO1_LABELS[i];
        } else {
            // Pendiente — mostrar número
            if (textoNodo) textoNodo.textContent = String(num);
            if (label) label.innerHTML = `Paso ${num}`;
        }
    });

    lineas.forEach((l, i) => {
        l.classList.toggle("completada", i + 1 < pasoActual);
    });
}

// ── Genera descripción legible de una bebida ──
function combo1DescBebida(bebida) {
    if (!bebida) return "";
    if (!bebida.esRefresco) return bebida.nombre;
    const hielo = bebida.tipo === "Vaso mediano"
        ? (bebida.hielo ? " con hielo" : " sin hielo")
        : "";
    return `${bebida.nombre} (${bebida.tipo}${hielo})`;
}

// ── Renderiza el resumen del paso 5 ──
function combo1RenderResumen() {
    const e    = COMBO1.estado;
    const lista = document.getElementById("combo1-resumen-lista");
    if (!lista) return;

    const items = [
        { nombre: e.palomitas?.nombre,         img: e.palomitas?.img, paso: 1 },
        { nombre: combo1DescBebida(e.bebida1),  img: e.bebida1?.img,  paso: 2 },
        { nombre: combo1DescBebida(e.bebida2),  img: e.bebida2?.img,  paso: 3 },
        { nombre: e.chocolate?.nombre,          img: e.chocolate?.img, paso: 4 }
    ];

    lista.innerHTML = items.map(item => `
        <div class="combo-resumen-item">
            <img src="${item.img || ''}" alt="${item.nombre}" onerror="this.src=''">
            <span class="combo-resumen-nombre">
                <span class="combo-resumen-check"> <img src="Botones/Positivo/Confirmar.png" width="15" onerror="this.style.display='none'"> </span>
                ${item.nombre || "—"}
            </span>
            <button class="combo-resumen-editar" data-paso="${item.paso}">
                <img src="Botones/Positivo/Editar.png" width="20px" onerror="this.style.display='none'"> Editar
            </button>
        </div>
    `).join("");

    lista.querySelectorAll(".combo-resumen-editar").forEach(btn => {
        btn.addEventListener("click", () => {
            combo1IrAPaso(parseInt(btn.dataset.paso));
        });
    });
}

// ── Agrega el combo al carrito ──
function combo1AgregarAlCarrito() {
    const e      = COMBO1.estado;
    const precio = combo1Precio();
    const b1     = combo1DescBebida(e.bebida1);
    const b2     = combo1DescBebida(e.bebida2);
    const desc   = `${e.palomitas.nombre}, ${b1}, ${b2}, ${e.chocolate.nombre}`;

    carrito.push({
        _key:      `combo1-${Date.now()}`,
        id:        `combo1-${Date.now()}`,
        nombre:    "Combo 1",
        variedad:  desc,
        precio,
        cantidad:  1,
        img:       "dulceria imgs/Combos/Combo 1.png",
        tipo:      "combo",
        comboData: {
            palomitas: { ...e.palomitas },
            bebida1:   { ...e.bebida1 },
            bebida2:   { ...e.bebida2 },
            chocolate: { ...e.chocolate }
        }
    });

    document.getElementById("modal-combo1")?.classList.add("hidden");
    mostrarToast("Combo 1 agregado al carrito");
    actualizarBadgeCarrito();
    leerTexto("Combo 1 agregado al carrito");
}

// ── Eventos de navegación del combo ──

// Confirmar paso a paso
document.getElementById("combo1-confirmar")?.addEventListener("click", () => {
    const paso = COMBO1.estado.paso;

    if (paso === 1 && !COMBO1.estado.palomitas)  { mostrarToast("Selecciona el sabor de tus palomitas"); return; }
    if (paso === 2 && !COMBO1.estado.bebida1)     { mostrarToast("Selecciona tu primera bebida"); return; }
    if (paso === 3 && !COMBO1.estado.bebida2)     { mostrarToast("Selecciona tu segunda bebida"); return; }
    if (paso === 4 && !COMBO1.estado.chocolate)   { mostrarToast("Selecciona tu chocolate"); return; }

    if (paso < 5) {
        if (paso === 4) combo1RenderResumen();
        combo1IrAPaso(paso + 1);
    } else {
        // Mostrar confirmación previa antes de agregar combo al carrito
        const e = COMBO1.estado;
        const precio = combo1Precio();
        const b1 = combo1DescBebida(e.bebida1);
        const b2 = combo1DescBebida(e.bebida2);
        const desc = `${e.palomitas.nombre}, ${b1}, ${b2}, ${e.chocolate.nombre}`;

        const itemsCombo = [{
            id:       `combo1-prev-${Date.now()}`,
            nombre:   "Combo 1",
            variedad: desc,
            precio,
            cantidad: 1,
            img:      "dulceria imgs/Combos/Combo 1.png"
        }];

        document.getElementById("modal-combo1")?.classList.add("hidden");

        abrirConfirmacionPrevia(itemsCombo, () => {
            combo1AgregarAlCarrito();
        });
    }
});

// Regresar
document.getElementById("combo1-regresar")?.addEventListener("click", () => {
    if (COMBO1.estado.paso > 1) combo1IrAPaso(COMBO1.estado.paso - 1);
});

// Cancelar
document.getElementById("combo1-cancelar")?.addEventListener("click", () => {
    document.getElementById("modal-combo1")?.classList.add("hidden");
    leerTexto("Cancelado");
});

// Tipo vaso/lata para bebida 1
// ── Actualiza imagen del botón Lata según estado activo/inactivo
function actualizarImgLata(contenedorId) {
    document.querySelectorAll(`#${contenedorId} .combo-tipo-btn`).forEach(b => {
        const img = b.querySelector("img");
        if (!img || b.dataset.tipo !== "lata") return;
        if (b.classList.contains("activo")) {
            img.src = "Botones/Positivo/Lata Btn.png";
        } else {
            img.src = "Botones/Negativo/Lata Btn.png";
        }
    });
}

document.querySelectorAll("#combo1-bebida1-tipo .combo-tipo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#combo1-bebida1-tipo .combo-tipo-btn").forEach(b => b.classList.remove("activo"));
        btn.classList.add("activo");
        actualizarImgLata("combo1-bebida1-tipo");
        const tipo = btn.dataset.tipo === "lata" ? "Lata" : "Vaso mediano";
        const hieloLabel = document.getElementById("combo1-bebida1-hielo");
        if (hieloLabel) hieloLabel.classList.toggle("hidden", btn.dataset.tipo === "lata");
        if (COMBO1.estado.bebida1) COMBO1.estado.bebida1.tipo = tipo;
        leerTexto(btn.dataset.tipo === "lata" ? "Bebida en lata" : "Vaso mediano");
    });
});

// Tipo vaso/lata para bebida 2
document.querySelectorAll("#combo1-bebida2-tipo .combo-tipo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#combo1-bebida2-tipo .combo-tipo-btn").forEach(b => b.classList.remove("activo"));
        btn.classList.add("activo");
        actualizarImgLata("combo1-bebida2-tipo");
        const tipo = btn.dataset.tipo === "lata" ? "Lata" : "Vaso mediano";
        const hieloLabel = document.getElementById("combo1-bebida2-hielo");
        if (hieloLabel) hieloLabel.classList.toggle("hidden", btn.dataset.tipo === "lata");
        if (COMBO1.estado.bebida2) COMBO1.estado.bebida2.tipo = tipo;
        leerTexto(btn.dataset.tipo === "lata" ? "Bebida en lata" : "Vaso mediano");
    });
});

// Switch hielo bebida 1
document.querySelector("#combo1-bebida1-hielo .fr-hielo-check")?.addEventListener("change", function() {
    if (COMBO1.estado.bebida1) COMBO1.estado.bebida1.hielo = this.checked;
    leerTexto(this.checked ? "Con hielo" : "Sin hielo");
});

// Switch hielo bebida 2
document.querySelector("#combo1-bebida2-hielo .fr-hielo-check")?.addEventListener("change", function() {
    if (COMBO1.estado.bebida2) COMBO1.estado.bebida2.hielo = this.checked;
    leerTexto(this.checked ? "Con hielo" : "Sin hielo");
});

// Click en tarjeta de combo — intercepta solo Combo 1
document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-combo");
    if (!btn) return;
    if (btn.dataset.combo === "1") abrirCombo1();
});


// ─── NAVEGACIÓN MAKEY MAKEY
//
//  Pad →  Derecha   (KEY_TAB)           → siguiente botón
//  Pad ←  Izquierda (KEY_LEFT_SHIFT)    → botón anterior
//         Enter     (KEY_RETURN)         → confirmar / hacer click
//  Pad ↓  Abajo     (KEY_DOWN_ARROW)    → cerrar modal activo / regresar
//         Escape                         → también cierra modal (teclado físico)
 
// ─── Detecta qué modal está abierto en este momento
function obtenerModalActivo() {
    const ids = [
        "modal-palomitas",
        "modal-refrescos",
        "modal-icee",
        "modal-combo1",
        "modal-confirmacion"
    ];
 
    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        // modal-confirmacion usa clase "visible", el resto usa ausencia de "hidden"
        if (id === "modal-confirmacion") {
            if (el.classList.contains("visible")) return el;
        } else {
            if (!el.classList.contains("hidden")) return el;
        }
    }
    return null;
}
 
// ─── Devuelve botones navegables según contexto (modal abierto o página normal)
function obtenerBotonesVisibles() {
    const modal = obtenerModalActivo();
 
    if (modal) {
        // Solo navega por los botones DENTRO del modal activo
        return Array.from(modal.querySelectorAll("button"))
            .filter(el => el.offsetParent !== null && !el.disabled);
    }
 
    // Sin modal: botones de la página principal visibles
    return Array.from(document.querySelectorAll(
        ".nav-btn, .cat-btn, .btn-seleccionar, .btn-agregar, .btn-combo, " +
        ".btn-pagar, .btn-vaciar, .ci-eliminar, .ci-btn, .ci-editar"
    )).filter(el => el.offsetParent !== null && !el.disabled);
}
 
// ─── Cierra el modal activo simulando clic en su botón Cancelar/Regresar
function cerrarModalActivo() {
    const modal = obtenerModalActivo();
    if (!modal) return false;
 
    // Busca el botón cancelar específico de cada modal
    const selectores = [
        "#cancelar",           // modal palomitas
        "#cancelar-refresco",  // modal refrescos
        "#cancelar-icee",      // modal icee
        "#combo1-cancelar",    // modal combo1
        "#conf-cancelar",      // modal confirmacion
        ".cancelar"            // fallback genérico
    ];
 
    for (const sel of selectores) {
        const btn = modal.querySelector(sel);
        if (btn) {
            btn.click();
            return true;
        }
    }
 
    // Si no encuentra botón, cierra directamente
    modal.classList.add("hidden");
    modal.classList.remove("visible");
    leerTexto("Cancelado");
    return true;
}
 
// ─── Listener principal del teclado Makey Makey
document.addEventListener("keydown", function(e) {
 
    // ── TAB (flecha derecha) → siguiente botón
    if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const items = obtenerBotonesVisibles();
        if (items.length === 0) return;
 
        let index = items.indexOf(document.activeElement);
        const siguiente = (index + 1) % items.length;
        items[siguiente].focus();
        leerTexto(items[siguiente].textContent.trim() || "botón");
    }
 
    // ── SHIFT izquierdo (flecha izquierda) → botón anterior
    if (e.key === "Shift" && e.location === 1) {
        e.preventDefault();
        const items = obtenerBotonesVisibles();
        if (items.length === 0) return;
 
        let index = items.indexOf(document.activeElement);
        if (index === -1) index = 0;
        const anterior = (index - 1 + items.length) % items.length;
        items[anterior].focus();
        leerTexto(items[anterior].textContent.trim() || "botón");
    }
 
    // ── ENTER → confirmar / hacer click en el botón enfocado
    if (e.key === "Enter") {
        e.preventDefault();
        const activo = document.activeElement;
        if (activo && activo.tagName === "BUTTON") {
            activo.click();
            leerTexto("Seleccionado: " + activo.textContent.trim());
        }
    }
 
    // ── FLECHA ABAJO → cerrar modal activo / regresar
    if (e.key === "ArrowDown") {
        e.preventDefault();
        const modalCerrado = cerrarModalActivo();
 
        if (!modalCerrado) {
            // Sin modal abierto: regresa a la sección de alimentos
            const btnAlimentos = document.querySelector('.nav-btn[data-seccion="alimentos"]');
            if (btnAlimentos) {
                btnAlimentos.click();
                btnAlimentos.focus();
                leerTexto("Alimentos");
            }
        }
    }
 
    // ── ESCAPE → también cierra modal (teclado físico)
    if (e.key === "Escape") {
        cerrarModalActivo();
    }
 
});
 
// ─── Foco inicial: primer botón de nav al cargar la página
window.addEventListener("load", () => {
    setTimeout(() => {
        const primero = Array.from(document.querySelectorAll(".nav-btn"))
            .find(el => el.offsetParent !== null);
        if (primero) primero.focus();
    }, 900);
});