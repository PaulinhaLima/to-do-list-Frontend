const API_BASE = "http://localhost:3000";

const formulario = document.getElementById("formulario_tarea");
const inputTitulo = document.getElementById("input_titulo");
const mensajeFormulario = document.getElementById("mensaje_formulario");

const listaTareas = document.getElementById("lista_tareas");
const estado = document.getElementById("estado");
const contadorPendientes = document.getElementById("contador_pendientes");

const btnFiltroTodas = document.getElementById("filtro_todas");
const btnFiltroPendientes = document.getElementById("filtro_pendientes");
const btnFiltroCompletadas = document.getElementById("filtro_completadas");

let tareas = [];
let filtroActual = "todas";


function setEstado(texto) {
    estado.textContent = texto || "";
}

function setErrorFormulario(texto) {
    mensajeFormulario.textContent = texto || "";
}

function setChipActivo(boton) {
    [btnFiltroTodas, btnFiltroPendientes, btnFiltroCompletadas].forEach((b) =>
        b.classList.remove("opcion_activa")
    );
    boton.classList.add("opcion_activa");
}

async function apiListarTareas() {
    const res = await fetch(`${API_BASE}/tareas`);
    if (!res.ok) throw new Error("No se pudo listar tareas");
    return await res.json();
}

async function apiCrearTarea(titulo) {
    const res = await fetch(`${API_BASE}/tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
    });

    if (res.status === 400) {
        const data = await res.json();
        throw new Error(data.message || "Validación fallida");
    }
    if (!res.ok) throw new Error("No se pudo crear tarea");

    return await res.json();
}

async function apiToggleTarea(id) {
    const res = await fetch(`${API_BASE}/tareas/${id}/toggle`, { method: "POST" });
    if (!res.ok) throw new Error("No se pudo cambiar estado");
    return await res.json();
}

async function apiEliminarTarea(id) {
    const res = await fetch(`${API_BASE}/tareas/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudo eliminar");
    return await res.json();
}

async function apiActualizarTarea(id, titulo) {
    const res = await fetch(`${API_BASE}/tareas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
    });

    if (res.status === 400) {
        const data = await res.json();
        throw new Error(data.message || "Validación fallida");
    }
    if (!res.ok) throw new Error("No se pudo actualizar la tarea");

    return await res.json();
}


function aplicarFiltro(lista) {
    if (filtroActual === "pendientes") return lista.filter((t) => !t.completada);
    if (filtroActual === "completadas") return lista.filter((t) => !!t.completada);
    return lista;
}


function render() {
    const visibles = aplicarFiltro(tareas);

    const pendientes = tareas.filter((t) => !t.completada).length;
    contadorPendientes.textContent = `${pendientes} artículos restantes`;

    if (tareas.length === 0) setEstado("Aún no tienes tareas. Crea tu primera tarea ✍️");
    else if (visibles.length === 0) setEstado("No hay tareas en este filtro.");
    else setEstado("");

    listaTareas.innerHTML = "";

    visibles.forEach((t) => {
        const li = document.createElement("li");
        li.className = "tarea_item";
        li.id = `tarea_${t.id}`;

        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = !!t.completada;
        check.className = "tarea_check";
        check.setAttribute("aria-label", "Marcar como completada");

        check.addEventListener("change", async() => {
            try {
                await apiToggleTarea(t.id);
                await cargar();
            } catch (e) {
                alert(e.message);
            }
        });

        const texto = document.createElement("span");
        texto.className = "tarea_texto";
        texto.textContent = t.titulo;

        if (t.completada) {
            texto.classList.add("completada");
        }

        texto.addEventListener("dblclick", () => {
            const inputEditar = document.createElement("input");
            inputEditar.type = "text";
            inputEditar.value = t.titulo;
            inputEditar.className = "tarea_editar_input";
            inputEditar.setAttribute("aria-label", "Editar título de la tarea");


            texto.replaceWith(inputEditar);
            inputEditar.focus();
            inputEditar.select();

            async function guardarEdicion() {
                const nuevoTitulo = inputEditar.value.trim();

                if (!nuevoTitulo) {
                    await cargar();
                    return;
                }


                if (nuevoTitulo === t.titulo) {
                    await cargar();
                    return;
                }

                try {
                    await apiActualizarTarea(t.id, nuevoTitulo);
                    await cargar();
                } catch (e) {
                    alert(e.message);
                    await cargar();
                }
            }

            inputEditar.addEventListener("blur", guardarEdicion);

            inputEditar.addEventListener("keydown", (e) => {
                if (e.key === "Enter") guardarEdicion();
                if (e.key === "Escape") cargar();
            });
        });

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "tarea_eliminar";
        btnEliminar.textContent = "×";
        btnEliminar.setAttribute("aria-label", "Eliminar tarea");

        btnEliminar.addEventListener("click", async() => {
            try {
                await apiEliminarTarea(t.id);
                await cargar();
            } catch (e) {
                alert(e.message);
            }
        });

        li.appendChild(check);
        li.appendChild(texto);
        li.appendChild(btnEliminar);

        listaTareas.appendChild(li);
    });
}


async function cargar() {
    try {
        setEstado("Cargando...");
        tareas = await apiListarTareas();
        render();
    } catch (e) {
        setEstado("No se pudo conectar con la API. Verifica que esté en http://localhost:3000");
    }
}


formulario.addEventListener("submit", async(e) => {
    e.preventDefault();
    setErrorFormulario("");

    const titulo = inputTitulo.value.trim();
    if (!titulo) {
        setErrorFormulario("Escribe un título para la tarea.");
        inputTitulo.focus();
        return;
    }

    try {
        await apiCrearTarea(titulo);
        inputTitulo.value = "";
        await cargar();
    } catch (err) {
        setErrorFormulario(err.message);
    }
});

btnFiltroTodas.addEventListener("click", () => {
    filtroActual = "todas";
    setChipActivo(btnFiltroTodas);
    render();
});

btnFiltroPendientes.addEventListener("click", () => {
    filtroActual = "pendientes";
    setChipActivo(btnFiltroPendientes);
    render();
});

btnFiltroCompletadas.addEventListener("click", () => {
    filtroActual = "completadas";
    setChipActivo(btnFiltroCompletadas);
    render();
});


setChipActivo(btnFiltroTodas);
cargar();