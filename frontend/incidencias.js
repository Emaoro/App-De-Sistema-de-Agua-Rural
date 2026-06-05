const API_BASE = '';
const API_INCIDENCIAS = `${API_BASE}/api/incidencias`;

const responsable = document.getElementById('responsable');
const sector = document.getElementById('sector');
const tipo = document.getElementById('tipo');
const prioridad = document.getElementById('prioridad');
const fecha = document.getElementById('fecha');
const estado = document.getElementById('estado');
const descripcion = document.getElementById('descripcion');

const btnRegistrar = document.getElementById('btnRegistrar');
const btnGuardarSuperior = document.getElementById('btnGuardarSuperior');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnActualizar = document.getElementById('btnActualizar');

const tablaIncidencias = document.getElementById('tablaIncidencias');

const totalIncidencias = document.getElementById('totalIncidencias');
const incidenciasPendientes = document.getElementById('incidenciasPendientes');
const incidenciasProceso = document.getElementById('incidenciasProceso');
const incidenciasResueltas = document.getElementById('incidenciasResueltas');

const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

let incidencias = [];

document.addEventListener('DOMContentLoaded', () => {
    colocarFechaActual();
    cargarIncidencias();
});

if (btnRegistrar) {
    btnRegistrar.addEventListener('click', registrarIncidencia);
}

if (btnGuardarSuperior) {
    btnGuardarSuperior.addEventListener('click', registrarIncidencia);
}

if (btnLimpiar) {
    btnLimpiar.addEventListener('click', limpiarFormulario);
}

if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarIncidencias);
}

function colocarFechaActual() {
    if (!fecha) {
        return;
    }

    const hoy = new Date().toISOString().split('T')[0];
    fecha.value = hoy;
}

async function cargarIncidencias() {
    try {
        const respuesta = await fetch(API_INCIDENCIAS);

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar las incidencias');
        }

        incidencias = await respuesta.json();

        mostrarIncidencias(incidencias);
        actualizarResumen(incidencias);

    } catch (error) {
        console.error('Error al cargar incidencias:', error);

        if (tablaIncidencias) {
            tablaIncidencias.innerHTML = `
                <div class="empty-message">
                    No se pudieron cargar las incidencias.
                </div>
            `;
        }

        actualizarResumen([]);
    }
}

async function registrarIncidencia() {
    const data = {
        responsable: responsable.value.trim(),
        sector: sector.value,
        tipo: tipo.value,
        prioridad: prioridad.value,
        fecha: fecha.value,
        estado: estado.value,
        descripcion: descripcion.value.trim()
    };

    if (!data.responsable) {
        alert('Ingrese el nombre del responsable.');
        return;
    }

    if (!data.sector) {
        alert('Seleccione un sector.');
        return;
    }

    if (!data.tipo) {
        alert('Seleccione el tipo de incidencia.');
        return;
    }

    if (!data.descripcion) {
        alert('Ingrese una descripción de la incidencia.');
        return;
    }

    try {
        const respuesta = await fetch(API_INCIDENCIAS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo registrar la incidencia.');
            return;
        }

        mostrarToast('Incidencia registrada correctamente');
        limpiarFormulario();
        cargarIncidencias();

    } catch (error) {
        console.error('Error al registrar incidencia:', error);
        alert('No se pudo conectar con el servidor. Verifique que la app esté corriendo correctamente.');
    }
}

function mostrarIncidencias(lista) {
    if (!tablaIncidencias) {
        return;
    }

    if (!Array.isArray(lista) || lista.length === 0) {
        tablaIncidencias.innerHTML = `
            <div class="empty-message">
                No hay incidencias registradas.
            </div>
        `;
        return;
    }

    tablaIncidencias.innerHTML = `
        <table class="incidencia-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Sector</th>
                    <th>Responsable</th>
                    <th>Fecha</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${lista.map((item) => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.tipo || ''}</td>
                        <td>${item.sector || ''}</td>
                        <td>${item.responsable || ''}</td>
                        <td>${formatearFecha(item.fecha)}</td>

                        <td>
                            <span class="badge-prioridad ${clasePrioridad(item.prioridad)}">
                                ${item.prioridad || 'Media'}
                            </span>
                        </td>

                        <td>
                            <span class="badge-estado ${claseEstado(item.estado)}">
                                ${item.estado || 'Pendiente'}
                            </span>
                        </td>

                        <td>${item.descripcion || ''}</td>

                        <td>
                            <button class="btn-accion" onclick="marcarResuelta(${item.id})">
                                Resolver
                            </button>

                            <button class="btn-accion btn-eliminar" onclick="eliminarIncidencia(${item.id})">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function marcarResuelta(id) {
    const confirmar = confirm('¿Desea marcar esta incidencia como resuelta?');

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_INCIDENCIAS}/${id}/resolver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo actualizar la incidencia.');
            return;
        }

        mostrarToast('Incidencia marcada como resuelta');
        cargarIncidencias();

    } catch (error) {
        console.error('Error al resolver incidencia:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

async function eliminarIncidencia(id) {
    const confirmar = confirm('¿Está seguro de eliminar esta incidencia?');

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_INCIDENCIAS}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo eliminar la incidencia.');
            return;
        }

        mostrarToast('Incidencia eliminada correctamente');
        cargarIncidencias();

    } catch (error) {
        console.error('Error al eliminar incidencia:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

function actualizarResumen(lista) {
    const total = lista.length;

    const pendientes = lista.filter((item) => {
        return String(item.estado || '').toLowerCase() === 'pendiente';
    }).length;

    const proceso = lista.filter((item) => {
        const valor = String(item.estado || '').toLowerCase();
        return valor === 'en proceso' || valor === 'proceso';
    }).length;

    const resueltas = lista.filter((item) => {
        return String(item.estado || '').toLowerCase() === 'resuelta';
    }).length;

    if (totalIncidencias) {
        totalIncidencias.textContent = total;
    }

    if (incidenciasPendientes) {
        incidenciasPendientes.textContent = pendientes;
    }

    if (incidenciasProceso) {
        incidenciasProceso.textContent = proceso;
    }

    if (incidenciasResueltas) {
        incidenciasResueltas.textContent = resueltas;
    }
}

function limpiarFormulario() {
    responsable.value = '';
    sector.value = '';
    tipo.value = '';
    prioridad.value = 'Media';
    estado.value = 'Pendiente';
    descripcion.value = '';
    colocarFechaActual();
}

function clasePrioridad(valor) {
    const texto = String(valor || '').toLowerCase();

    if (texto === 'alta') {
        return 'prioridad-alta';
    }

    if (texto === 'media') {
        return 'prioridad-media';
    }

    return 'prioridad-baja';
}

function claseEstado(valor) {
    const texto = String(valor || '').toLowerCase();

    if (texto === 'resuelta') {
        return 'estado-resuelta';
    }

    if (texto === 'en proceso' || texto === 'proceso') {
        return 'estado-proceso';
    }

    return 'estado-pendiente';
}

function formatearFecha(valor) {
    if (!valor) {
        return '';
    }

    const fechaObj = new Date(valor);

    if (Number.isNaN(fechaObj.getTime())) {
        return valor;
    }

    return fechaObj.toLocaleDateString('es-GT');
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

window.eliminarIncidencia = eliminarIncidencia;
window.marcarResuelta = marcarResuelta;