const API_BASE = '';
const API_DASHBOARD = `${API_BASE}/api/dashboard`;

const fechaActual = document.getElementById('fechaActual');

const consumoTotal = document.getElementById('consumoTotal');
const presionActual = document.getElementById('presionActual');
const flujoPromedio = document.getElementById('flujoPromedio');
const eficiencia = document.getElementById('eficiencia');

const graficaConsumo = document.getElementById('graficaConsumo');
const listaAlertas = document.getElementById('listaAlertas');

const sectoresActivos = document.getElementById('sectoresActivos');
const sectoresMantenimiento = document.getElementById('sectoresMantenimiento');
const sectoresInactivos = document.getElementById('sectoresInactivos');

const btnActualizarDashboard = document.getElementById('btnActualizarDashboard');
const btnIrReportes = document.getElementById('btnIrReportes');

document.addEventListener('DOMContentLoaded', () => {
    colocarFecha();
    cargarDashboard();
});

if (btnActualizarDashboard) {
    btnActualizarDashboard.addEventListener('click', cargarDashboard);
}

if (btnIrReportes) {
    btnIrReportes.addEventListener('click', () => {
        window.location.href = 'reportes.html';
    });
}

function colocarFecha() {
    const hoy = new Date();

    if (fechaActual) {
        fechaActual.textContent = hoy.toLocaleDateString('es-GT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

async function cargarDashboard() {
    try {
        const respuesta = await fetch(API_DASHBOARD);
        const texto = await respuesta.text();

        let data;

        try {
            data = JSON.parse(texto);
        } catch (error) {
            console.error('Respuesta recibida del servidor:', texto);

            alert(
                'El servidor no respondió con JSON válido.\n\n' +
                'Revisa esto:\n' +
                '1. Que Docker esté corriendo.\n' +
                '2. Que exista la ruta /api/dashboard.\n' +
                '3. Que app.js tenga conectado dashboard.routes.js.'
            );

            return;
        }

        if (!respuesta.ok) {
            alert(data.mensaje || 'No se pudo cargar el dashboard.');
            return;
        }

        actualizarTarjetas(data);
        renderGraficaConsumo(data.consumo_semanal || []);
        renderAlertas(data.alertas || []);
        renderSectores(data.sectores || {});

    } catch (error) {
        console.error('Error cargando dashboard:', error);
        alert('No se pudo conectar con el servidor. Verifica que la app esté corriendo correctamente.');
    }
}

function actualizarTarjetas(data) {
    const litros = Number(data.distribucion?.total_litros || 0);
    const flujo = Number(data.distribucion?.flujo_promedio || 0);
    const ef = Number(data.distribucion?.eficiencia || 0);

    if (consumoTotal) {
        consumoTotal.textContent = formatearNumero(litros);
    }

    if (presionActual) {
        presionActual.textContent = '2.4';
    }

    if (flujoPromedio) {
        flujoPromedio.textContent = formatearNumero(flujo);
    }

    if (eficiencia) {
        eficiencia.textContent = ef.toFixed(0);
    }
}

function renderGraficaConsumo(datos) {
    if (!graficaConsumo) {
        return;
    }

    if (!Array.isArray(datos) || datos.length === 0) {
        graficaConsumo.innerHTML = `
            <div class="empty-chart">
                No hay datos de distribución registrados
            </div>
        `;
        return;
    }

    const maximo = Math.max(...datos.map((item) => Number(item.litros || 0)), 1);

    graficaConsumo.innerHTML = datos.map((item) => {
        const litros = Number(item.litros || 0);
        const alto = Math.max((litros / maximo) * 190, 8);

        return `
            <div class="bar-item">
                <span class="bar-value">${formatearNumero(litros)}</span>
                <div class="bar" style="height:${alto}px"></div>
                <span class="bar-label">${limpiarDia(item.dia)}</span>
            </div>
        `;
    }).join('');
}

function limpiarDia(dia) {
    if (!dia) {
        return '';
    }

    const texto = String(dia).trim().toLowerCase();

    if (texto.includes('mon') || texto.includes('lun')) return 'Lun';
    if (texto.includes('tue') || texto.includes('mar')) return 'Mar';
    if (texto.includes('wed') || texto.includes('mi')) return 'Mié';
    if (texto.includes('thu') || texto.includes('jue')) return 'Jue';
    if (texto.includes('fri') || texto.includes('vie')) return 'Vie';
    if (texto.includes('sat') || texto.includes('sáb') || texto.includes('sab')) return 'Sáb';
    if (texto.includes('sun') || texto.includes('dom')) return 'Dom';

    return dia;
}

function renderAlertas(alertas) {
    if (!listaAlertas) {
        return;
    }

    if (!Array.isArray(alertas) || alertas.length === 0) {
        listaAlertas.innerHTML = `
            <div class="empty-box">
                No hay alertas registradas
            </div>
        `;
        return;
    }

    listaAlertas.innerHTML = alertas.map((alerta) => `
        <div class="alert-item">
            <div class="alert-icon">⚠️</div>

            <div>
                <h4>${alerta.tipo || 'Incidencia'}</h4>
                <p>${alerta.sector || 'Sin sector'} - ${alerta.estado || 'Pendiente'}</p>
            </div>
        </div>
    `).join('');
}

function renderSectores(sectores) {
    if (sectoresActivos) {
        sectoresActivos.textContent = sectores.activos ?? 6;
    }

    if (sectoresMantenimiento) {
        sectoresMantenimiento.textContent = sectores.mantenimiento ?? 0;
    }

    if (sectoresInactivos) {
        sectoresInactivos.textContent = sectores.inactivos ?? 0;
    }
}

function formatearNumero(numero) {
    return Number(numero || 0).toLocaleString('es-GT', {
        maximumFractionDigits: 0
    });
}