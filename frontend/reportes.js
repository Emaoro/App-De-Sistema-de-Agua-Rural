const API_BASE = '';

const API_GENERAL = `${API_BASE}/api/reportes/general`;
const API_FAMILIAS = `${API_BASE}/api/reportes/familias`;
const API_INCIDENCIAS = `${API_BASE}/api/reportes/incidencias`;
const API_TANQUES = `${API_BASE}/api/reportes/tanques`;
const API_DISTRIBUCION = `${API_BASE}/api/reportes/distribucion`;
const API_REPORTES_GENERADOS = `${API_BASE}/api/reportes/generados`;
const API_GENERAR_REPORTE = `${API_BASE}/api/reportes/generar`;


const totalFamilias = document.getElementById('totalFamilias');
const totalIncidencias = document.getElementById('totalIncidencias');
const totalLitros = document.getElementById('totalLitros');
const sinDistribucion = document.getElementById('sinDistribucion');

const familiasConAcceso = document.getElementById('familiasConAcceso');
const familiasSinAcceso = document.getElementById('familiasSinAcceso');
const totalFamiliasGrafica = document.getElementById('totalFamiliasGrafica');
const porcentajeAcceso = document.getElementById('porcentajeAcceso');

const totalIncidenciasGrafica = document.getElementById('totalIncidenciasGrafica');
const leyendaIncidencias = document.getElementById('leyendaIncidencias');

const fechaInicio = document.getElementById('fechaInicio');
const fechaFin = document.getElementById('fechaFin');

const btnGenerarReporte = document.getElementById('btnGenerarReporte');
const btnExportarReporte = document.getElementById('btnExportarReporte');

const tablaReportes = document.getElementById('tablaReportes');
const contenidoReporte = document.getElementById('contenidoReporte');

const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

const modalReporte = document.getElementById('modalReporte');
const modalTituloReporte = document.getElementById('modalTituloReporte');
const modalSubtituloReporte = document.getElementById('modalSubtituloReporte');
const modalContenidoReporte = document.getElementById('modalContenidoReporte');
const cerrarModalReporte = document.getElementById('cerrarModalReporte');
const cerrarModalReporteAbajo = document.getElementById('cerrarModalReporteAbajo');
const btnDescargarModal = document.getElementById('btnDescargarModal');

let reporteActual = null;

let datosActuales = {
    general: null,
    familias: [],
    incidencias: [],
    tanques: [],
    distribucion: [],
    reportesGenerados: []
};

document.addEventListener('DOMContentLoaded', () => {
    colocarFechas();
    cargarVistaReportes();
});

if (btnGenerarReporte) {
    btnGenerarReporte.addEventListener('click', generarReporteGeneral);
}

if (btnExportarReporte) {
    btnExportarReporte.addEventListener('click', exportarReporte);
}

if (cerrarModalReporte) {
    cerrarModalReporte.addEventListener('click', cerrarModal);
}

if (cerrarModalReporteAbajo) {
    cerrarModalReporteAbajo.addEventListener('click', cerrarModal);
}

if (btnDescargarModal) {
    btnDescargarModal.addEventListener('click', exportarReporte);
}

// ======================================
// FECHAS
// ======================================

function colocarFechas() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    if (fechaInicio) {
        fechaInicio.value = inicioMes.toISOString().split('T')[0];
    }

    if (fechaFin) {
        fechaFin.value = hoy.toISOString().split('T')[0];
    }
}

// ======================================
// CARGAR VISTA
// ======================================

async function cargarVistaReportes() {
    try {
        const [
            general,
            familias,
            incidencias,
            tanques,
            distribucion,
            reportesGenerados
        ] = await Promise.all([
            obtenerJSON(API_GENERAL),
            obtenerJSON(API_FAMILIAS),
            obtenerJSON(API_INCIDENCIAS),
            obtenerJSON(API_TANQUES),
            obtenerJSON(API_DISTRIBUCION),
            obtenerJSON(API_REPORTES_GENERADOS)
        ]);

        datosActuales = {
            general,
            familias,
            incidencias,
            tanques,
            distribucion,
            reportesGenerados
        };

        actualizarTarjetas(general);
        actualizarGraficaDistribucion(general);
        actualizarGraficaIncidencias(incidencias);
        actualizarTablaReportes(reportesGenerados);

    } catch (error) {
        console.error('Error cargando reportes:', error);

        alert(
            'No se pudieron cargar los reportes. Revisa que la app esté corriendo correctamente y que exista /api/reportes/general'
        );
    }
}

async function obtenerJSON(url) {
    const respuesta = await fetch(url);

    let data;

    try {
        data = await respuesta.json();
    } catch (error) {
        throw new Error('El servidor no respondió con JSON válido');
    }

    if (!respuesta.ok) {
        throw new Error(data.mensaje || 'Error al consultar datos');
    }

    return data;
}

// ======================================
// TARJETAS
// ======================================

function actualizarTarjetas(data) {
    const familiasTotal = data.familias.total || 0;
    const familiasAtendidas = data.distribucion.total_familias_atendidas || 0;
    const sinDist = Math.max(familiasTotal - familiasAtendidas, 0);

    if (totalFamilias) {
        totalFamilias.textContent = familiasTotal;
    }

    if (totalLitros) {
        totalLitros.textContent = formatearNumero(data.distribucion.total_litros || 0);
    }

    if (sinDistribucion) {
        sinDistribucion.textContent = sinDist;
    }

    if (totalIncidencias) {
        totalIncidencias.textContent = data.incidencias.total || 0;
    }
}

// ======================================
// GRÁFICA DISTRIBUCIÓN
// ======================================

function actualizarGraficaDistribucion(data) {
    const total = data.familias.total || 0;
    const conAcceso = data.distribucion.total_familias_atendidas || 0;
    const sinAcceso = Math.max(total - conAcceso, 0);

    let porcentaje = 0;

    if (total > 0) {
        porcentaje = Math.min((conAcceso / total) * 100, 100);
    }

    if (familiasConAcceso) {
        familiasConAcceso.textContent = conAcceso;
    }

    if (familiasSinAcceso) {
        familiasSinAcceso.textContent = sinAcceso;
    }

    if (totalFamiliasGrafica) {
        totalFamiliasGrafica.textContent = total;
    }

    if (porcentajeAcceso) {
        porcentajeAcceso.textContent = `${porcentaje.toFixed(1)}%`;
    }

    const donut = document.querySelector('.donut-blue');

    if (donut) {
        donut.style.setProperty('--porcentaje', `${porcentaje}%`);
    }
}

// ======================================
// GRÁFICA INCIDENCIAS
// ======================================

function actualizarGraficaIncidencias(incidencias) {
    if (!Array.isArray(incidencias) || incidencias.length === 0) {
        if (totalIncidenciasGrafica) {
            totalIncidenciasGrafica.textContent = '0';
        }

        if (leyendaIncidencias) {
            leyendaIncidencias.innerHTML = '<p>No hay incidencias registradas.</p>';
        }

        return;
    }

    if (totalIncidenciasGrafica) {
        totalIncidenciasGrafica.textContent = incidencias.length;
    }

    const conteo = {};

    incidencias.forEach((item) => {
        const tipo = item.tipo || 'Sin tipo';
        conteo[tipo] = (conteo[tipo] || 0) + 1;
    });

    const colores = ['blue', 'orange', 'green', 'red'];

    if (leyendaIncidencias) {
        leyendaIncidencias.innerHTML = Object.entries(conteo).map(([tipo, cantidad], index) => {
            const porcentaje = ((cantidad / incidencias.length) * 100).toFixed(1);
            const color = colores[index] || 'gray';

            return `
                <div class="legend-row">
                    <span class="dot ${color}"></span>
                    <div>
                        <strong>${tipo}</strong>
                        <p>${cantidad} (${porcentaje}%)</p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ======================================
// GENERAR REPORTE
// ======================================

async function generarReporteGeneral() {
    try {
        if (!datosActuales.general) {
            alert('No se pudo generar el reporte.');
            return;
        }

        const data = datosActuales.general;
        const periodo = `${formatearFecha(fechaInicio.value)} - ${formatearFecha(fechaFin.value)}`;

        const nuevoReporte = {
            nombre: 'Reporte Consolidado',
            tipo: 'general',
            periodo: periodo,
            generado_por: localStorage.getItem('usuario') || 'admin',
            tamano: calcularTamanoJSON(data),
            datos: data
        };

        const respuesta = await fetch(API_GENERAR_REPORTE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoReporte)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo guardar el reporte.');
            return;
        }

        reporteActual = resultado.reporte.datos;

        await cargarReportesGenerados();

        const html = crearTablaGeneral(resultado.reporte.datos);

        if (contenidoReporte) {
            contenidoReporte.innerHTML = html;
        }

        abrirModal(
            'Reporte Consolidado',
            'Resumen general generado con los datos reales del sistema.',
            html
        );

        mostrarToast('Reporte generado correctamente');

    } catch (error) {
        console.error('Error al generar reporte:', error);
        alert('No se pudo generar el reporte.');
    }
}

async function cargarReportesGenerados() {
    try {
        const reportes = await obtenerJSON(API_REPORTES_GENERADOS);
        datosActuales.reportesGenerados = reportes;
        actualizarTablaReportes(reportes);
    } catch (error) {
        console.error('Error cargando reportes generados:', error);
    }
}

// ======================================
// TABLA DE REPORTES
// ======================================

function actualizarTablaReportes(reportes) {
    if (!tablaReportes) {
        return;
    }

    if (!Array.isArray(reportes) || reportes.length === 0) {
        tablaReportes.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    No hay reportes generados.
                </td>
            </tr>
        `;
        return;
    }

    tablaReportes.innerHTML = reportes.map((reporte) => `
        <tr>
            <td>📄 ${reporte.nombre}</td>
            <td>${formatearFechaHora(reporte.fecha_generacion)}</td>
            <td>${reporte.periodo || 'Sin periodo'}</td>
            <td><span class="estado-completado">${reporte.estado || 'Completado'}</span></td>
            <td>${reporte.generado_por || 'admin'}</td>
            <td>${reporte.tamano || '0 KB'}</td>
            <td>
                <button class="action-btn" onclick="verReporteGenerado(${reporte.id})">👁</button>
                <button class="action-btn" onclick="descargarReporteGenerado(${reporte.id})">⬇</button>
            </td>
        </tr>
    `).join('');
}

// ======================================
// VER Y DESCARGAR REPORTE
// ======================================

function verReporteGenerado(id) {
    const reporte = datosActuales.reportesGenerados.find((item) => Number(item.id) === Number(id));

    if (!reporte) {
        alert('No se encontró el reporte.');
        return;
    }

    reporteActual = reporte.datos;

    const html = crearTablaGeneral(reporte.datos);

    abrirModal(
        reporte.nombre,
        `Periodo: ${reporte.periodo || 'Sin periodo'}`,
        html
    );
}

function descargarReporteGenerado(id) {
    const reporte = datosActuales.reportesGenerados.find((item) => Number(item.id) === Number(id));

    if (!reporte) {
        alert('No se encontró el reporte.');
        return;
    }

    reporteActual = reporte.datos;
    exportarReporte();
}

// ======================================
// TABLA GENERAL
// ======================================

function crearTablaGeneral(data) {
    return `
        <h3>Reporte general del sistema</h3>

        <table>
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th>Resultado</th>
                    <th>Descripción</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Total familias</td>
                    <td>${data.familias.total}</td>
                    <td>Familias registradas en el sistema.</td>
                </tr>

                <tr>
                    <td>Familias activas</td>
                    <td>${data.familias.activas}</td>
                    <td>Familias con servicio activo.</td>
                </tr>

                <tr>
                    <td>Agua distribuida</td>
                    <td>${formatearNumero(data.distribucion.total_litros)} L</td>
                    <td>Total de litros registrados desde la aplicación.</td>
                </tr>

                <tr>
                    <td>Familias atendidas</td>
                    <td>${data.distribucion.total_familias_atendidas}</td>
                    <td>Familias atendidas en distribuciones registradas.</td>
                </tr>

                <tr>
                    <td>Incidencias</td>
                    <td>${data.incidencias.total}</td>
                    <td>Incidencias registradas desde la aplicación.</td>
                </tr>

                <tr>
                    <td>Incidencias pendientes</td>
                    <td>${data.incidencias.pendientes}</td>
                    <td>Incidencias que aún requieren seguimiento.</td>
                </tr>

                <tr>
                    <td>Lecturas de tanque</td>
                    <td>${data.tanques.total_lecturas}</td>
                    <td>Lecturas registradas desde el módulo de tanques.</td>
                </tr>

                <tr>
                    <td>Sectores</td>
                    <td>${data.sectores.total}</td>
                    <td>Sectores fijos del sistema: A, B, C, D, E y F.</td>
                </tr>
            </tbody>
        </table>
    `;
}

// ======================================
// MODAL
// ======================================

function abrirModal(titulo, subtitulo, html) {
    if (!modalReporte) {
        return;
    }

    modalTituloReporte.textContent = titulo;
    modalSubtituloReporte.textContent = subtitulo;
    modalContenidoReporte.innerHTML = html;

    modalReporte.classList.add('show');
}

function cerrarModal() {
    if (modalReporte) {
        modalReporte.classList.remove('show');
    }
}

// ======================================
// EXPORTAR
// ======================================

function exportarReporte() {
    if (!reporteActual) {
        alert('Primero genere o visualice un reporte.');
        return;
    }

    const contenido = JSON.stringify(reporteActual, null, 2);
    const blob = new Blob([contenido], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'reporte-control-agua.json';
    enlace.click();

    URL.revokeObjectURL(url);

    mostrarToast('Reporte exportado correctamente');
}

// ======================================
// UTILIDADES
// ======================================

function calcularTamanoJSON(data) {
    const texto = JSON.stringify(data);
    const bytes = new Blob([texto]).size;

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

function mostrarToast(mensaje) {
    if (!toast || !toastMensaje) {
        return;
    }

    toastMensaje.textContent = mensaje;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function formatearNumero(numero) {
    return Number(numero || 0).toLocaleString('es-GT', {
        maximumFractionDigits: 0
    });
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

function formatearFechaHora(fecha) {
    if (!fecha) {
        return '';
    }

    const nuevaFecha = new Date(fecha);

    if (Number.isNaN(nuevaFecha.getTime())) {
        return fecha;
    }

    return nuevaFecha.toLocaleString('es-GT');
}

window.verReporteGenerado = verReporteGenerado;
window.descargarReporteGenerado = descargarReporteGenerado;