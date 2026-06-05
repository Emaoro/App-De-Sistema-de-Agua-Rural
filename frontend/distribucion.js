const API_BASE = '';
const API_DISTRIBUCION = `${API_BASE}/api/distribucion`;

const sectores = document.getElementById('sectores');
const litros = document.getElementById('litros');
const familiasAtendidasInput = document.getElementById('familias_atendidas');
const responsable = document.getElementById('responsable');
const fecha = document.getElementById('fecha');
const estado = document.getElementById('estado');
const observaciones = document.getElementById('observaciones');

const btnRegistrar = document.getElementById('btnRegistrar');
const btnGuardarSuperior = document.getElementById('btnGuardarSuperior');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnActualizar = document.getElementById('btnActualizar');

const tablaDistribuciones = document.getElementById('tablaDistribuciones');

const totalDistribuciones = document.getElementById('totalDistribuciones');
const litrosDistribuidos = document.getElementById('litrosDistribuidos');
const sectoresAtendidos = document.getElementById('sectoresAtendidos');
const familiasAtendidas = document.getElementById('familiasAtendidas');

const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

let distribuciones = [];

document.addEventListener('DOMContentLoaded', () => {
    colocarFechaActual();
    cargarDistribuciones();
});

if (btnRegistrar) {
    btnRegistrar.addEventListener('click', registrarDistribucion);
}

if (btnGuardarSuperior) {
    btnGuardarSuperior.addEventListener('click', registrarDistribucion);
}

if (btnLimpiar) {
    btnLimpiar.addEventListener('click', limpiarFormulario);
}

if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarDistribuciones);
}

function colocarFechaActual() {
    if (!fecha) {
        return;
    }

    const ahora = new Date();

    const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    fecha.value = fechaLocal;
}

async function cargarDistribuciones() {
    try {
        const respuesta = await fetch(API_DISTRIBUCION);

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar las distribuciones');
        }

        distribuciones = await respuesta.json();

        mostrarDistribuciones(distribuciones);
        actualizarResumen(distribuciones);

    } catch (error) {
        console.error('Error al cargar distribuciones:', error);

        if (tablaDistribuciones) {
            tablaDistribuciones.innerHTML = `
                <div class="empty-message">
                    No se pudieron cargar las distribuciones.
                </div>
            `;
        }

        actualizarResumen([]);
    }
}

async function registrarDistribucion() {
    const data = {
        sectores: sectores.value,
        litros: Number(litros.value),
        familias_atendidas: Number(familiasAtendidasInput.value),
        responsable: responsable.value.trim(),
        fecha: fecha.value,
        estado: estado.value,
        observaciones: observaciones.value.trim()
    };

    if (!data.sectores) {
        alert('Seleccione un sector.');
        return;
    }

    if (!data.litros || data.litros <= 0) {
        alert('Ingrese la cantidad de litros distribuidos.');
        return;
    }

    if (!data.familias_atendidas || data.familias_atendidas <= 0) {
        alert('Ingrese la cantidad de familias atendidas.');
        return;
    }

    if (!data.responsable) {
        alert('Ingrese el nombre del responsable.');
        return;
    }

    try {
        const respuesta = await fetch(API_DISTRIBUCION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo registrar la distribución.');
            return;
        }

        mostrarToast('Distribución registrada correctamente');
        limpiarFormulario();
        cargarDistribuciones();

    } catch (error) {
        console.error('Error al registrar distribución:', error);
        alert('No se pudo conectar con el servidor. Verifique que la app esté corriendo correctamente.');
    }
}

function mostrarDistribuciones(lista) {
    if (!tablaDistribuciones) {
        return;
    }

    if (!Array.isArray(lista) || lista.length === 0) {
        tablaDistribuciones.innerHTML = `
            <div class="empty-message">
                No hay distribuciones registradas.
            </div>
        `;
        return;
    }

    tablaDistribuciones.innerHTML = `
        <table class="dist-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Sector</th>
                    <th>Litros</th>
                    <th>Familias atendidas</th>
                    <th>Responsable</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${lista.map((item) => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.sectores || ''}</td>
                        <td>${formatearNumero(item.litros)} L</td>
                        <td>${item.familias_atendidas || 0}</td>
                        <td>${item.responsable || ''}</td>
                        <td>${formatearFecha(item.fecha)}</td>
                        <td>
                            <span class="badge-estado ${claseEstado(item.estado)}">
                                ${item.estado || 'Programada'}
                            </span>
                        </td>
                        <td>${item.observaciones || ''}</td>
                        <td>
                            <button class="btn-accion btn-eliminar" onclick="eliminarDistribucion(${item.id})">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function eliminarDistribucion(id) {
    const confirmar = confirm('¿Está seguro de eliminar esta distribución?');

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_DISTRIBUCION}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo eliminar la distribución.');
            return;
        }

        mostrarToast('Distribución eliminada correctamente');
        cargarDistribuciones();

    } catch (error) {
        console.error('Error al eliminar distribución:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

function actualizarResumen(lista) {
    const total = lista.length;

    const totalLitros = lista.reduce((acumulado, item) => {
        return acumulado + Number(item.litros || 0);
    }, 0);

    const totalFamilias = lista.reduce((acumulado, item) => {
        return acumulado + Number(item.familias_atendidas || 0);
    }, 0);

    const sectoresUnicos = new Set();

    lista.forEach((item) => {
        if (item.sectores) {
            sectoresUnicos.add(item.sectores);
        }
    });

    if (totalDistribuciones) {
        totalDistribuciones.textContent = total;
    }

    if (litrosDistribuidos) {
        litrosDistribuidos.textContent = formatearNumero(totalLitros);
    }

    if (sectoresAtendidos) {
        sectoresAtendidos.textContent = sectoresUnicos.size;
    }

    if (familiasAtendidas) {
        familiasAtendidas.textContent = totalFamilias;
    }
}

function limpiarFormulario() {
    sectores.value = '';
    litros.value = '';
    familiasAtendidasInput.value = '';
    responsable.value = '';
    estado.value = 'Programada';
    observaciones.value = '';
    colocarFechaActual();
}

function claseEstado(valor) {
    const texto = String(valor || '').toLowerCase();

    if (texto === 'ejecutada') {
        return 'estado-ejecutada';
    }

    if (texto === 'cancelada') {
        return 'estado-cancelada';
    }

    return 'estado-programada';
}

function formatearNumero(numero) {
    const valor = Number(numero || 0);

    return valor.toLocaleString('es-GT', {
        maximumFractionDigits: 0
    });
}

function formatearFecha(valor) {
    if (!valor) {
        return '';
    }

    const fechaObj = new Date(valor);

    if (Number.isNaN(fechaObj.getTime())) {
        return valor;
    }

    return fechaObj.toLocaleString('es-GT');
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

window.eliminarDistribucion = eliminarDistribucion;