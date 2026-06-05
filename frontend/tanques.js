const API_BASE = '';
const API_TANQUES = `${API_BASE}/api/tanques`;

const tanque = document.getElementById('tanque');
const sensor = document.getElementById('sensor');
const nivelPorcentaje = document.getElementById('nivelPorcentaje');
const capacidadLitros = document.getElementById('capacidadLitros');
const volumenCalculado = document.getElementById('volumenCalculado');
const fecha = document.getElementById('fecha');
const observaciones = document.getElementById('observaciones');

const btnRegistrar = document.getElementById('btnRegistrar');
const btnGuardarSuperior = document.getElementById('btnGuardarSuperior');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnActualizar = document.getElementById('btnActualizar');

const nivelActual = document.getElementById('nivelActual');
const litrosDisponibles = document.getElementById('litrosDisponibles');
const totalLecturas = document.getElementById('totalLecturas');
const estadoActual = document.getElementById('estadoActual');

const waterLevel = document.getElementById('waterLevel');
const porcentajeVisual = document.getElementById('porcentajeVisual');
const estadoVisual = document.getElementById('estadoVisual');
const alertaTanque = document.getElementById('alertaTanque');

const tablaLecturas = document.getElementById('tablaLecturas');

const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

let lecturas = [];

document.addEventListener('DOMContentLoaded', () => {
    colocarFechaActual();
    colocarDatosIniciales();
    cargarLecturas();
});

if (btnRegistrar) {
    btnRegistrar.addEventListener('click', registrarLectura);
}

if (btnGuardarSuperior) {
    btnGuardarSuperior.addEventListener('click', registrarLectura);
}

if (btnLimpiar) {
    btnLimpiar.addEventListener('click', limpiarFormulario);
}

if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarLecturas);
}

if (nivelPorcentaje) {
    nivelPorcentaje.addEventListener('input', calcularVolumen);
}

if (capacidadLitros) {
    capacidadLitros.addEventListener('input', calcularVolumen);
}

// ======================================
// DATOS INICIALES
// ======================================

function colocarDatosIniciales() {
    if (tanque && !tanque.value) {
        tanque.value = 'Tanque principal';
    }

    if (sensor && !sensor.value) {
        sensor.value = 'Medición manual';
    }

    if (capacidadLitros && !capacidadLitros.value) {
        capacidadLitros.value = 10000;
    }

    calcularVolumen();
}

function colocarFechaActual() {
    const ahora = new Date();

    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    if (fecha) {
        fecha.value = local;
    }
}

// ======================================
// CALCULAR VOLUMEN
// ======================================

function calcularVolumen() {
    const nivel = Number(nivelPorcentaje.value || 0);
    const capacidad = Number(capacidadLitros.value || 0);

    const volumen = (nivel / 100) * capacidad;

    if (volumenCalculado) {
        volumenCalculado.value = `${formatearNumero(volumen)} litros`;
    }

    actualizarTanqueVisual(nivel);
}

// ======================================
// CARGAR LECTURAS
// ======================================

async function cargarLecturas() {
    try {
        const respuesta = await fetch(API_TANQUES);

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'No se pudieron cargar las lecturas');
        }

        lecturas = await respuesta.json();

        mostrarLecturas();
        actualizarResumen();

    } catch (error) {
        console.error('Error al cargar lecturas:', error);

        if (tablaLecturas) {
            tablaLecturas.innerHTML = `
                <div class="empty-message">
                    No se pudieron cargar las lecturas.
                </div>
            `;
        }
    }
}

// ======================================
// REGISTRAR LECTURA
// ======================================

async function registrarLectura() {
    const nivel = Number(nivelPorcentaje.value);
    const capacidad = Number(capacidadLitros.value);

    if (!tanque.value.trim() || Number.isNaN(nivel) || Number.isNaN(capacidad)) {
        alert('Complete el nombre del tanque, nivel y capacidad.');
        return;
    }

    if (nivel < 0 || nivel > 100) {
        alert('El nivel debe estar entre 0 y 100.');
        return;
    }

    if (capacidad <= 0) {
        alert('La capacidad debe ser mayor a 0.');
        return;
    }

    const data = {
        tanque: tanque.value.trim(),
        sensor: sensor.value.trim(),
        nivel_porcentaje: nivel,
        capacidad_litros: capacidad,
        estado_monitoreo: obtenerEstadoNivel(nivel),
        observaciones: observaciones.value.trim(),
        fecha: fecha.value
    };

    try {
        const respuesta = await fetch(API_TANQUES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo registrar la lectura.');
            return;
        }

        mostrarToast('Lectura registrada correctamente');
        limpiarFormulario();
        cargarLecturas();

    } catch (error) {
        console.error('Error al registrar lectura:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

// ======================================
// MOSTRAR HISTORIAL
// ======================================

function mostrarLecturas() {
    if (!tablaLecturas) {
        return;
    }

    if (!lecturas || lecturas.length === 0) {
        tablaLecturas.innerHTML = `
            <div class="empty-message">
                No hay lecturas registradas.
            </div>
        `;
        return;
    }

    tablaLecturas.innerHTML = `
        <table class="tanque-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tanque</th>
                    <th>Nivel</th>
                    <th>Litros</th>
                    <th>Capacidad</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Sensor</th>
                    <th>Acción</th>
                </tr>
            </thead>

            <tbody>
                ${lecturas.map((item) => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.tanque}</td>

                        <td>
                            <span class="badge-nivel ${claseNivel(item.nivel_porcentaje)}">
                                ${Number(item.nivel_porcentaje).toFixed(0)}%
                            </span>
                        </td>

                        <td>${formatearNumero(item.volumen_litros)} L</td>
                        <td>${formatearNumero(item.capacidad_litros)} L</td>

                        <td>${item.estado_monitoreo}</td>

                        <td>${formatearFecha(item.fecha)}</td>
                        <td>${item.sensor || 'Sin sensor'}</td>

                        <td>
                            <button class="btn-accion" onclick="eliminarLectura(${item.id})">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ======================================
// ACTUALIZAR RESUMEN
// ======================================

function actualizarResumen() {
    if (totalLecturas) {
        totalLecturas.textContent = lecturas.length;
    }

    if (!lecturas || lecturas.length === 0) {
        if (nivelActual) nivelActual.textContent = '0%';
        if (litrosDisponibles) litrosDisponibles.textContent = '0';
        if (estadoActual) estadoActual.textContent = 'Sin datos';

        actualizarTanqueVisual(0);
        actualizarAlerta(0, 'Sin lectura');
        return;
    }

    const ultima = lecturas[0];

    const nivel = Number(ultima.nivel_porcentaje);
    const litros = Number(ultima.volumen_litros);
    const estado = ultima.estado_monitoreo || obtenerEstadoNivel(nivel);

    if (nivelActual) {
        nivelActual.textContent = `${nivel.toFixed(0)}%`;
    }

    if (litrosDisponibles) {
        litrosDisponibles.textContent = formatearNumero(litros);
    }

    if (estadoActual) {
        estadoActual.textContent = estado;
    }

    actualizarTanqueVisual(nivel);
    actualizarAlerta(nivel, estado);
}

// ======================================
// TANQUE VISUAL
// ======================================

function actualizarTanqueVisual(nivel) {
    const nivelSeguro = Math.max(0, Math.min(100, Number(nivel) || 0));

    if (waterLevel) {
        waterLevel.style.height = `${nivelSeguro}%`;
    }

    if (porcentajeVisual) {
        porcentajeVisual.textContent = `${nivelSeguro.toFixed(0)}%`;
    }

    if (estadoVisual) {
        estadoVisual.textContent = obtenerEstadoNivel(nivelSeguro);
    }
}

function actualizarAlerta(nivel, estado) {
    if (!alertaTanque) {
        return;
    }

    alertaTanque.className = 'alert-box';

    if (nivel <= 25 && nivel > 0) {
        alertaTanque.classList.add('critico');
        alertaTanque.innerHTML = `
            <strong>Alerta crítica</strong>
            <p>El nivel del tanque es muy bajo. Se recomienda revisar la distribución.</p>
        `;
        return;
    }

    if (nivel <= 50 && nivel > 25) {
        alertaTanque.classList.add('bajo');
        alertaTanque.innerHTML = `
            <strong>Nivel bajo</strong>
            <p>El tanque tiene poca disponibilidad. Se recomienda monitorear el consumo.</p>
        `;
        return;
    }

    if (nivel > 50) {
        alertaTanque.classList.add('normal');
        alertaTanque.innerHTML = `
            <strong>${estado}</strong>
            <p>El tanque cuenta con disponibilidad suficiente para la distribución.</p>
        `;
        return;
    }

    alertaTanque.innerHTML = `
        <strong>Sin lectura</strong>
        <p>Registre una lectura para visualizar el estado del tanque.</p>
    `;
}

// ======================================
// ELIMINAR LECTURA
// ======================================

async function eliminarLectura(id) {
    const confirmar = confirm('¿Desea eliminar esta lectura?');

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_TANQUES}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo eliminar la lectura.');
            return;
        }

        mostrarToast('Lectura eliminada correctamente');
        cargarLecturas();

    } catch (error) {
        console.error('Error al eliminar lectura:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

// ======================================
// LIMPIAR FORMULARIO
// ======================================

function limpiarFormulario() {
    tanque.value = 'Tanque principal';
    sensor.value = 'Medición manual';
    nivelPorcentaje.value = '';
    capacidadLitros.value = 10000;
    observaciones.value = '';
    colocarFechaActual();
    calcularVolumen();
}

// ======================================
// UTILIDADES
// ======================================

function obtenerEstadoNivel(nivel) {
    const valor = Number(nivel);

    if (valor <= 25 && valor > 0) {
        return 'Nivel crítico';
    }

    if (valor <= 50 && valor > 25) {
        return 'Nivel bajo';
    }

    if (valor <= 80 && valor > 50) {
        return 'Nivel normal';
    }

    if (valor > 80) {
        return 'Nivel alto';
    }

    return 'Sin datos';
}

function claseNivel(nivel) {
    const valor = Number(nivel);

    if (valor <= 25) {
        return 'nivel-critico';
    }

    if (valor <= 50) {
        return 'nivel-bajo';
    }

    if (valor <= 80) {
        return 'nivel-normal';
    }

    return 'nivel-alto';
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

window.eliminarLectura = eliminarLectura;