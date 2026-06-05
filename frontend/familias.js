const API_BASE = '';
const API_FAMILIAS = `${API_BASE}/api/familias`;


const btnAbrirModalFamilia = document.getElementById('btnAbrirModalFamilia');
const btnCerrarModalFamilia = document.getElementById('btnCerrarModalFamilia');
const btnCancelarFamilia = document.getElementById('btnCancelarFamilia');

const modalFamilia = document.getElementById('modalFamilia');
const formFamilia = document.getElementById('formFamilia');

const tablaFamilias = document.getElementById('tablaFamilias');
const buscarFamilia = document.getElementById('buscarFamilia');

const totalFamilias = document.getElementById('totalFamilias');
const familiasActivas = document.getElementById('familiasActivas');
const familiasSuspendidas = document.getElementById('familiasSuspendidas');

const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

let familias = [];

document.addEventListener('DOMContentLoaded', () => {
    colocarFechaActual();
    cargarFamilias();
});

if (btnAbrirModalFamilia) {
    btnAbrirModalFamilia.addEventListener('click', abrirModalFamilia);
}

if (btnCerrarModalFamilia) {
    btnCerrarModalFamilia.addEventListener('click', cerrarModalFamilia);
}

if (btnCancelarFamilia) {
    btnCancelarFamilia.addEventListener('click', cerrarModalFamilia);
}

if (modalFamilia) {
    modalFamilia.addEventListener('click', (event) => {
        if (event.target === modalFamilia) {
            cerrarModalFamilia();
        }
    });
}

if (formFamilia) {
    formFamilia.addEventListener('submit', guardarFamilia);
}

if (buscarFamilia) {
    buscarFamilia.addEventListener('input', filtrarFamilias);
}

function abrirModalFamilia() {
    limpiarFormulario();

    if (modalFamilia) {
        modalFamilia.classList.add('show');
    }
}

function cerrarModalFamilia() {
    if (modalFamilia) {
        modalFamilia.classList.remove('show');
    }
}

function colocarFechaActual() {
    const fecha = document.getElementById('fecha_registro');

    if (fecha) {
        const hoy = new Date().toISOString().split('T')[0];
        fecha.value = hoy;
    }
}

async function cargarFamilias() {
    try {
        const respuesta = await fetch(API_FAMILIAS);
        const data = await respuesta.json();

        if (!respuesta.ok) {
            alert(data.mensaje || 'No se pudieron cargar las familias.');
            return;
        }

        familias = data;

        renderFamilias(familias);
        actualizarTarjetas();

    } catch (error) {
        console.error('Error al cargar familias:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

async function guardarFamilia(event) {
    event.preventDefault();

    const data = {
        nombre_jefe: document.getElementById('nombre_jefe').value.trim(),
        dpi: document.getElementById('dpi').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        sector: document.getElementById('sector').value,
        estado: document.getElementById('estado').value,
        fecha_registro: document.getElementById('fecha_registro').value
    };

    if (!data.nombre_jefe) {
        alert('Ingrese el nombre del jefe de familia.');
        return;
    }

    if (!data.dpi) {
        alert('Ingrese el DPI.');
        return;
    }

    try {
        const respuesta = await fetch(API_FAMILIAS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo registrar la familia.');
            return;
        }

        mostrarToast(resultado.mensaje || 'Familia registrada correctamente');

        cerrarModalFamilia();
        limpiarFormulario();
        cargarFamilias();

    } catch (error) {
        console.error('Error al guardar familia:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

function renderFamilias(lista) {
    if (!tablaFamilias) {
        return;
    }

    if (!Array.isArray(lista) || lista.length === 0) {
        tablaFamilias.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    No hay familias registradas.
                </td>
            </tr>
        `;
        return;
    }

    tablaFamilias.innerHTML = lista.map((familia) => `
        <tr>
            <td>${familia.id}</td>
            <td>${familia.nombre_jefe || ''}</td>
            <td>${familia.dpi || ''}</td>
            <td>${familia.telefono || ''}</td>
            <td>${familia.sector || ''}</td>
            <td>
                <span class="${familia.estado === 'Suspendida' ? 'estado-suspendida' : 'estado-activa'}">
                    ${familia.estado || 'Activa'}
                </span>
            </td>
            <td>${formatearFecha(familia.fecha_registro)}</td>
            <td>
                <button class="action-btn" onclick="verFamilia(${familia.id})">Ver</button>
                <button class="action-btn delete" onclick="eliminarFamilia(${familia.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function filtrarFamilias() {
    const texto = buscarFamilia.value.toLowerCase().trim();

    const filtradas = familias.filter((familia) => {
        return (
            String(familia.nombre_jefe || '').toLowerCase().includes(texto) ||
            String(familia.dpi || '').toLowerCase().includes(texto) ||
            String(familia.sector || '').toLowerCase().includes(texto) ||
            String(familia.estado || '').toLowerCase().includes(texto)
        );
    });

    renderFamilias(filtradas);
}

function actualizarTarjetas() {
    const total = familias.length;

    const activas = familias.filter((familia) => {
        return String(familia.estado || '').toLowerCase() === 'activa';
    }).length;

    const suspendidas = familias.filter((familia) => {
        return String(familia.estado || '').toLowerCase() === 'suspendida';
    }).length;

    if (totalFamilias) {
        totalFamilias.textContent = total;
    }

    if (familiasActivas) {
        familiasActivas.textContent = activas;
    }

    if (familiasSuspendidas) {
        familiasSuspendidas.textContent = suspendidas;
    }
}

function verFamilia(id) {
    const familia = familias.find((item) => Number(item.id) === Number(id));

    if (!familia) {
        alert('Familia no encontrada.');
        return;
    }

    alert(
        `Familia registrada\n\n` +
        `Jefe de familia: ${familia.nombre_jefe || ''}\n` +
        `DPI: ${familia.dpi || ''}\n` +
        `Teléfono: ${familia.telefono || ''}\n` +
        `Correo: ${familia.correo || ''}\n` +
        `Sector: ${familia.sector || ''}\n` +
        `Estado: ${familia.estado || ''}\n` +
        `Dirección: ${familia.direccion || ''}`
    );
}

async function eliminarFamilia(id) {
    const confirmar = confirm('¿Desea eliminar esta familia?');

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_FAMILIAS}/${id}`, {
            method: 'DELETE'
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            alert(data.mensaje || 'No se pudo eliminar la familia.');
            return;
        }

        mostrarToast(data.mensaje || 'Familia eliminada correctamente');
        cargarFamilias();

    } catch (error) {
        console.error('Error al eliminar familia:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

function limpiarFormulario() {
    if (formFamilia) {
        formFamilia.reset();
    }

    colocarFechaActual();
}

function mostrarToast(mensaje) {
    if (!toast || !toastMensaje) {
        alert(mensaje);
        return;
    }

    toastMensaje.textContent = mensaje;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function formatearFecha(fecha) {
    if (!fecha) {
        return '';
    }

    const nuevaFecha = new Date(fecha);

    if (Number.isNaN(nuevaFecha.getTime())) {
        return fecha;
    }

    return nuevaFecha.toLocaleDateString('es-GT');
}

window.verFamilia = verFamilia;
window.eliminarFamilia = eliminarFamilia;