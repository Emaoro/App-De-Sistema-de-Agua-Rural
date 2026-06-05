const API_BASE = '';
const API_SECTORES = `${API_BASE}/api/sectores`;
const API_FAMILIAS = `${API_BASE}/api/familias`;

const panelSectores = document.getElementById('panelSectores');
const buscarSector = document.getElementById('buscarSector');
const btnVerSectores = document.getElementById('btnVerSectores');

const totalSectores = document.getElementById('totalSectores');
const totalFamilias = document.getElementById('totalFamilias');
const sectoresActivos = document.getElementById('sectoresActivos');
const sectoresInactivos = document.getElementById('sectoresInactivos');

const modalSector = document.getElementById('modalSector');
const cerrarModalSector = document.getElementById('cerrarModalSector');
const cancelarModalSector = document.getElementById('cancelarModalSector');
const guardarCambiosSector = document.getElementById('guardarCambiosSector');

const modalTituloSector = document.getElementById('modalTituloSector');
const detalleNombreSector = document.getElementById('detalleNombreSector');
const detalleZonaSector = document.getElementById('detalleZonaSector');
const detalleHorarioSector = document.getElementById('detalleHorarioSector');
const detalleEstadoSector = document.getElementById('detalleEstadoSector');
const detalleObservacionesSector = document.getElementById('detalleObservacionesSector');
const listaFamiliasSector = document.getElementById('listaFamiliasSector');
const contadorFamiliasSector = document.getElementById('contadorFamiliasSector');

let sectores = [];
let familias = [];
let sectorSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

if (buscarSector) {
    buscarSector.addEventListener('input', () => {
        const texto = buscarSector.value.toLowerCase();

        const filtrados = sectores.filter((sector) => {
            return (
                String(sector.nombre).toLowerCase().includes(texto) ||
                String(sector.zona).toLowerCase().includes(texto) ||
                String(sector.estado).toLowerCase().includes(texto)
            );
        });

        mostrarSectores(filtrados);
    });
}

if (btnVerSectores) {
    btnVerSectores.addEventListener('click', () => {
        mostrarToast('Sectores actualizados correctamente');
        cargarDatos();
    });
}

if (cerrarModalSector) {
    cerrarModalSector.addEventListener('click', cerrarModal);
}

if (cancelarModalSector) {
    cancelarModalSector.addEventListener('click', cerrarModal);
}

if (modalSector) {
    modalSector.addEventListener('click', (event) => {
        if (event.target === modalSector) {
            cerrarModal();
        }
    });
}

if (guardarCambiosSector) {
    guardarCambiosSector.addEventListener('click', guardarCambios);
}

// ======================================
// CARGAR SECTORES Y FAMILIAS
// ======================================

async function cargarDatos() {
    try {
        const [respuestaSectores, respuestaFamilias] = await Promise.all([
            fetch(API_SECTORES),
            fetch(API_FAMILIAS)
        ]);

        if (!respuestaSectores.ok) {
            throw new Error('No se pudieron cargar los sectores');
        }

        sectores = await respuestaSectores.json();

        if (respuestaFamilias.ok) {
            familias = await respuestaFamilias.json();
        } else {
            familias = [];
        }

        sectores = aplicarConfiguracionLocal(sectores);

        mostrarSectores(sectores);
        actualizarResumen(sectores);

    } catch (error) {
        console.error('Error al cargar datos:', error);

        if (panelSectores) {
            panelSectores.innerHTML = `
                <div class="empty-message">
                    No se pudieron cargar los sectores.
                </div>
            `;
        }
    }
}

// ======================================
// APLICAR CAMBIOS GUARDADOS EN LOCALSTORAGE
// ======================================

function aplicarConfiguracionLocal(lista) {
    const configuracion = JSON.parse(localStorage.getItem('configuracionSectores')) || {};

    return lista.map((sector) => {
        const guardado = configuracion[sector.nombre];

        if (!guardado) {
            return sector;
        }

        return {
            ...sector,
            horario: guardado.horario || sector.horario,
            estado: guardado.estado || sector.estado,
            observaciones: guardado.observaciones || sector.observaciones
        };
    });
}

// ======================================
// MOSTRAR TABLA DE SECTORES
// ======================================

function mostrarSectores(lista) {
    if (!panelSectores) {
        return;
    }

    if (!lista || lista.length === 0) {
        panelSectores.innerHTML = `
            <div class="empty-message">
                No hay sectores disponibles.
            </div>
        `;
        return;
    }

    panelSectores.innerHTML = `
        <table class="sector-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre del sector</th>
                    <th>Horario de distribución</th>
                    <th>Familias</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${lista.map((sector) => `
                    <tr>
                        <td>${sector.id}</td>

                        <td class="sector-name">
                            <strong>${sector.nombre}</strong>
                            <span>${sector.zona}</span>
                        </td>

                        <td>${sector.horario}</td>

                        <td>${sector.total_familias}</td>

                        <td>
                            <span class="badge ${String(sector.estado).toLowerCase()}">
                                ${sector.estado}
                            </span>
                        </td>

                        <td>
                            <button class="action-btn" onclick="abrirDetalleSector('${sector.nombre}')">
                                Ver
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ======================================
// ACTUALIZAR TARJETAS SUPERIORES
// ======================================

function actualizarResumen(lista) {
    const activos = lista.filter((sector) => sector.estado === 'Activo').length;
    const inactivos = lista.filter((sector) => sector.estado !== 'Activo').length;

    const totalFamiliasAsignadas = lista.reduce((total, sector) => {
        return total + Number(sector.total_familias || 0);
    }, 0);

    if (totalSectores) {
        totalSectores.textContent = lista.length;
    }

    if (totalFamilias) {
        totalFamilias.textContent = totalFamiliasAsignadas;
    }

    if (sectoresActivos) {
        sectoresActivos.textContent = activos;
    }

    if (sectoresInactivos) {
        sectoresInactivos.textContent = inactivos;
    }
}

// ======================================
// ABRIR MODAL DE DETALLE
// ======================================

function abrirDetalleSector(nombreSector) {
    const sector = sectores.find((item) => item.nombre === nombreSector);

    if (!sector) {
        return;
    }

    sectorSeleccionado = sector;

    modalTituloSector.textContent = `Detalle de ${sector.nombre}`;
    detalleNombreSector.value = sector.nombre;
    detalleZonaSector.value = sector.zona;
    detalleHorarioSector.value = sector.horario;
    detalleEstadoSector.value = sector.estado;
    detalleObservacionesSector.value = sector.observaciones || '';

    cargarFamiliasDelSector(sector.nombre);

    modalSector.classList.add('show');
}

// ======================================
// CARGAR FAMILIAS DEL SECTOR
// ======================================

function cargarFamiliasDelSector(nombreSector) {
    const familiasFiltradas = familias.filter((familia) => {
        return String(familia.sector).toLowerCase() === String(nombreSector).toLowerCase();
    });

    contadorFamiliasSector.textContent = `${familiasFiltradas.length} familias`;

    if (familiasFiltradas.length === 0) {
        listaFamiliasSector.innerHTML = `
            <p style="padding: 18px 0; color: #64748b;">
                No hay familias registradas en este sector.
            </p>
        `;
        return;
    }

    listaFamiliasSector.innerHTML = familiasFiltradas.map((familia) => {
        const nombre = familia.nombre_jefe 
            || familia.nombre_responsable 
            || familia.jefe_familia 
            || familia.nombre 
            || 'Sin nombre';

        const telefono = familia.telefono || 'Sin teléfono';
        const direccion = familia.direccion || 'Sin dirección';
        const estado = familia.estado || familia.estado_servicio || 'Activa';
        const dpi = familia.dpi || familia.dpi_responsable || 'Sin DPI';

        return `
            <div class="familia-item">
                <div>
                    <strong>${nombre}</strong>
                    <span>${direccion}</span>
                </div>

                <div>
                    <strong>DPI / Teléfono</strong>
                    <span>${dpi} · ${telefono}</span>
                </div>

                <div>
                    <span class="estado-familia">${estado}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ======================================
// GUARDAR CAMBIOS DEL SECTOR
// ======================================

function guardarCambios() {
    if (!sectorSeleccionado) {
        return;
    }

    const configuracion = JSON.parse(localStorage.getItem('configuracionSectores')) || {};

    configuracion[sectorSeleccionado.nombre] = {
        horario: detalleHorarioSector.value.trim(),
        estado: detalleEstadoSector.value,
        observaciones: detalleObservacionesSector.value.trim()
    };

    localStorage.setItem('configuracionSectores', JSON.stringify(configuracion));

    sectores = aplicarConfiguracionLocal(sectores);

    mostrarSectores(sectores);
    actualizarResumen(sectores);

    cerrarModal();
    mostrarToast('Cambios del sector guardados correctamente');
}

// ======================================
// CERRAR MODAL
// ======================================

function cerrarModal() {
    modalSector.classList.remove('show');
    sectorSeleccionado = null;
}

// ======================================
// TOAST
// ======================================

function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.innerHTML = `
        <span>✓</span>
        <div>${mensaje}</div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

window.abrirDetalleSector = abrirDetalleSector;