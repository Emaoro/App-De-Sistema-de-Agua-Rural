let API_BASE = window.location.origin;

if (
    window.location.port === '5500' ||
    window.location.hostname === '127.0.0.1'
) {
    API_BASE = 'http://localhost:3000';
}

document.addEventListener('DOMContentLoaded', () => {
    validarSesionUsuario();
    colocarFechaActual();
    cargarDatosUsuarioDesdeLocalStorage();
    activarNavegacion();
    configurarFormularioIncidencia();
    configurarCerrarSesion();
    cargarDashboardUsuario();
});

// ===============================
// VALIDAR SESIÓN
// ===============================

function validarSesionUsuario() {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (!token || rol !== 'invitado') {
        alert('Debe iniciar sesión como usuario de la comunidad');
        window.location.href = 'login.html';
    }
}

// ===============================
// FECHA
// ===============================

function colocarFechaActual() {
    const fecha = document.getElementById('fechaActualUsuario');

    if (!fecha) return;

    const hoy = new Date();

    fecha.textContent = hoy.toLocaleDateString('es-GT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ===============================
// DATOS TEMPORALES DEL LOGIN
// ===============================

function cargarDatosUsuarioDesdeLocalStorage() {
    const nombre = localStorage.getItem('nombre') || 'Usuario invitado';
    const correo = localStorage.getItem('correo') || '';
    const dpi = localStorage.getItem('dpi') || 'No registrado';
    const telefono = localStorage.getItem('telefono') || 'No registrado';
    const direccion = localStorage.getItem('direccion') || 'No registrada';
    const sector = localStorage.getItem('sector') || 'Sin sector';

    pintarDatosFamilia({
        nombre_jefe: nombre,
        correo,
        dpi,
        telefono,
        direccion,
        sector,
        estado: localStorage.getItem('estado') || 'Activo'
    });
}

// ===============================
// CARGAR DATOS REALES DEL BACKEND
// ===============================

async function cargarDashboardUsuario() {
    const correo = localStorage.getItem('correo');

    if (!correo) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/api/usuario-invitado/dashboard?correo=${encodeURIComponent(correo)}`);

        const texto = await respuesta.text();

        let data;

        try {
            data = JSON.parse(texto);
        } catch (error) {
            console.error('Respuesta no JSON:', texto);
            return;
        }

        if (!respuesta.ok) {
            console.warn(data.mensaje || 'No se pudo cargar dashboard del usuario');
            return;
        }

        if (data.familia) {
            pintarDatosFamilia(data.familia);
        }

        pintarTanque(data.tanque);
        pintarReportes(data.resumen_reportes);
        pintarDistribuciones(data.distribuciones || []);
        pintarIncidencias(data.incidencias || []);

    } catch (error) {
        console.error('Error cargando dashboard de usuario:', error);
    }
}

// ===============================
// PINTAR DATOS DE FAMILIA
// ===============================

function pintarDatosFamilia(familia) {
    const nombre = familia.nombre_jefe || familia.nombre || 'Usuario invitado';
    const correo = familia.correo || '';
    const dpi = familia.dpi || 'No registrado';
    const telefono = familia.telefono || 'No registrado';
    const direccion = familia.direccion || 'No registrada';
    const sector = familia.sector || 'Sin sector';
    const estado = familia.estado || 'Activo';

    localStorage.setItem('nombre', nombre);
    localStorage.setItem('correo', correo);
    localStorage.setItem('dpi', dpi);
    localStorage.setItem('telefono', telefono);
    localStorage.setItem('direccion', direccion);
    localStorage.setItem('sector', sector);
    localStorage.setItem('estado', estado);

    const nombreBienvenida = document.getElementById('nombreBienvenida');
    const sectorBienvenida = document.getElementById('sectorBienvenida');
    const perfilNombre = document.getElementById('perfilNombre');

    const infoNombre = document.getElementById('infoNombre');
    const infoDpi = document.getElementById('infoDpi');
    const infoTelefono = document.getElementById('infoTelefono');
    const infoCorreo = document.getElementById('infoCorreo');
    const infoSector = document.getElementById('infoSector');
    const infoDireccion = document.getElementById('infoDireccion');

    const incNombre = document.getElementById('incNombre');
    const incSector = document.getElementById('incSector');

    if (nombreBienvenida) nombreBienvenida.textContent = nombre;
    if (sectorBienvenida) sectorBienvenida.textContent = sector;
    if (perfilNombre) perfilNombre.textContent = nombre;

    if (infoNombre) infoNombre.value = nombre;
    if (infoDpi) infoDpi.value = dpi;
    if (infoTelefono) infoTelefono.value = telefono;
    if (infoCorreo) infoCorreo.value = correo;
    if (infoSector) infoSector.value = sector;
    if (infoDireccion) infoDireccion.value = direccion;

    if (incNombre) incNombre.value = nombre;

    if (incSector) {
        let encontrado = false;

        Array.from(incSector.options).forEach(option => {
            if (normalizar(option.value) === normalizar(sector)) {
                option.selected = true;
                encontrado = true;
            }
        });

        if (!encontrado && sector) {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector;
            option.selected = true;
            incSector.appendChild(option);
        }
    }

    const fechaIncidencia = document.getElementById('incFecha');

    if (fechaIncidencia) {
        const ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
        fechaIncidencia.value = ahora.toISOString().slice(0, 16);
    }
}

// ===============================
// TANQUE REAL
// ===============================

function pintarTanque(tanque) {
    const tankFill = document.getElementById('tankFill');
    const tankPercent = document.getElementById('tankPercent');

    if (!tanque) {
        if (tankPercent) tankPercent.textContent = 'Sin dato';
        if (tankFill) tankFill.style.height = '0%';
        return;
    }

    const porcentaje =
        tanque.porcentaje ||
        tanque.nivel_porcentaje ||
        tanque.nivel ||
        tanque.nivel_actual ||
        0;

    const porcentajeNumero = Math.max(0, Math.min(100, Number(porcentaje) || 0));

    if (tankPercent) {
        tankPercent.textContent = `${porcentajeNumero}%`;
    }

    if (tankFill) {
        tankFill.style.height = `${porcentajeNumero}%`;
    }
}

// ===============================
// REPORTES REALES
// ===============================

function pintarReportes(resumen) {
    if (!resumen) return;

    const enviados = document.getElementById('reportesEnviados');
    const pendientes = document.getElementById('reportesPendientes');
    const resueltos = document.getElementById('reportesResueltos');

    if (enviados) enviados.textContent = resumen.total || 0;
    if (pendientes) pendientes.textContent = resumen.pendientes || 0;
    if (resueltos) resueltos.textContent = resumen.resueltos || 0;

    const totalReportesUsuario = document.getElementById('totalReportesUsuario');

    if (totalReportesUsuario) {
        totalReportesUsuario.textContent = resumen.total || 0;
    }
}

// ===============================
// DISTRIBUCIONES REALES
// ===============================

function pintarDistribuciones(distribuciones) {
    pintarTablaDistribucion(distribuciones);
    pintarHistorialDistribucion(distribuciones);
    pintarProximaDistribucion(distribuciones);
}

function pintarTablaDistribucion(distribuciones) {
    const tbody = document.querySelector('#section-distribucion tbody');

    if (!tbody) return;

    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">No hay horarios de distribución registrados para este sector.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = distribuciones.map(item => {
        const fecha = obtenerValor(item, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
        const dia = obtenerDia(fecha);
        const inicio = obtenerValor(item, ['hora_inicio', 'inicio', 'hora', 'desde']) || 'Sin hora';
        const fin = obtenerValor(item, ['hora_fin', 'fin', 'hasta']) || 'Sin hora';
        const estado = obtenerValor(item, ['estado']) || 'Registrado';
        const notas = obtenerValor(item, ['notas', 'observaciones', 'descripcion']) || 'Sin observaciones';

        return `
            <tr>
                <td>${formatearFecha(fecha)}</td>
                <td>${dia}</td>
                <td>${inicio}</td>
                <td>${fin}</td>
                <td><span class="badge-blue">${estado}</span></td>
                <td>${notas}</td>
            </tr>
        `;
    }).join('');
}

function pintarHistorialDistribucion(distribuciones) {
    const tbody = document.querySelector('#section-historial tbody');

    if (!tbody) return;

    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">No hay historial de distribución registrado.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = distribuciones.map(item => {
        const fecha = obtenerValor(item, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
        const sector = obtenerValor(item, ['sector']) || localStorage.getItem('sector') || 'Sin sector';
        const estado = obtenerValor(item, ['estado']) || 'Registrado';
        const observaciones = obtenerValor(item, ['observaciones', 'notas', 'descripcion']) || 'Sin observaciones';

        return `
            <tr>
                <td>${formatearFecha(fecha)}</td>
                <td>${sector}</td>
                <td><span class="badge-green">${estado}</span></td>
                <td>${observaciones}</td>
            </tr>
        `;
    }).join('');
}

function pintarProximaDistribucion(distribuciones) {
    const cards = document.querySelectorAll('.summary-card');

    if (!cards || cards.length < 2) return;

    const cardProxima = cards[1];

    const titulo = cardProxima.querySelector('h2');
    const detalle = cardProxima.querySelector('p');

    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        if (titulo) titulo.textContent = 'Sin programación';
        if (detalle) detalle.textContent = 'No hay distribución registrada.';
        return;
    }

    const primera = distribuciones[0];

    const fecha = obtenerValor(primera, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
    const inicio = obtenerValor(primera, ['hora_inicio', 'inicio', 'hora', 'desde']) || '';
    const fin = obtenerValor(primera, ['hora_fin', 'fin', 'hasta']) || '';

    if (titulo) titulo.textContent = obtenerDia(fecha);
    if (detalle) detalle.textContent = `${inicio || 'Sin hora'} - ${fin || 'Sin hora'}`;
}

// ===============================
// INCIDENCIAS REALES
// ===============================

function pintarIncidencias(incidencias) {
    pintarAvisosInicio(incidencias);
    pintarNotificaciones(incidencias);
}

function pintarAvisosInicio(incidencias) {
    const contenedor = document.getElementById('avisosInicio');

    if (!contenedor) return;

    if (!Array.isArray(incidencias) || incidencias.length === 0) {
        contenedor.innerHTML = `
            <div class="notice info">
                <span>ℹ</span>
                <div>
                    <h4>Sin avisos recientes</h4>
                    <p>No hay incidencias registradas para este usuario o sector.</p>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = incidencias.slice(0, 3).map(item => {
        const tipo = obtenerValor(item, ['tipo', 'tipo_incidencia']) || 'Incidencia';
        const descripcion = obtenerValor(item, ['descripcion', 'detalle', 'observaciones']) || 'Sin descripción';
        const estado = obtenerValor(item, ['estado']) || 'Pendiente';

        return `
            <div class="notice ${claseAviso(estado)}">
                <span>${iconoAviso(estado)}</span>
                <div>
                    <h4>${tipo}</h4>
                    <p>${descripcion}</p>
                </div>
            </div>
        `;
    }).join('');
}

function pintarNotificaciones(incidencias) {
    const contenedor = document.querySelector('#section-notificaciones .notification-list');

    if (!contenedor) return;

    if (!Array.isArray(incidencias) || incidencias.length === 0) {
        contenedor.innerHTML = `
            <div class="notice info">
                <span>ℹ</span>
                <div>
                    <h4>Sin notificaciones</h4>
                    <p>No hay incidencias o avisos registrados.</p>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = incidencias.map(item => {
        const tipo = obtenerValor(item, ['tipo', 'tipo_incidencia']) || 'Incidencia';
        const descripcion = obtenerValor(item, ['descripcion', 'detalle', 'observaciones']) || 'Sin descripción';
        const estado = obtenerValor(item, ['estado']) || 'Pendiente';

        return `
            <div class="notice ${claseAviso(estado)}">
                <span>${iconoAviso(estado)}</span>
                <div>
                    <h4>${tipo}</h4>
                    <p>${descripcion}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ===============================
// FORMULARIO INCIDENCIA
// ===============================

function configurarFormularioIncidencia() {
    const form = document.getElementById('formIncidenciaUsuario');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('incNombre').value.trim();
        const sector = document.getElementById('incSector').value;
        const tipo = document.getElementById('incTipo').value;
        const descripcion = document.getElementById('incDescripcion').value.trim();
        const fecha = document.getElementById('incFecha').value;

        if (!descripcion) {
            alert('Ingrese una descripción de la incidencia');
            return;
        }

        const data = {
            tipo,
            descripcion,
            sector,
            estado: 'Pendiente',
            reportado_por: nombre,
            fecha_reporte: fecha
        };

        try {
            const respuesta = await fetch(`${API_BASE}/api/incidencias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                alert(resultado.mensaje || 'No se pudo enviar el reporte');
                return;
            }

            alert('Reporte enviado correctamente');
            form.reset();
            cargarDatosUsuarioDesdeLocalStorage();
            cargarDashboardUsuario();

        } catch (error) {
            console.error('Error enviando incidencia:', error);
            alert('No se pudo conectar con el servidor');
        }
    });
}

// ===============================
// NAVEGACIÓN
// ===============================

function activarNavegacion() {
    const botones = document.querySelectorAll('.menu-item');
    const secciones = document.querySelectorAll('.user-section');
    const botonesRapidos = document.querySelectorAll('[data-section-target]');

    botones.forEach((boton) => {
        boton.addEventListener('click', () => {
            const section = boton.getAttribute('data-section');
            mostrarSeccion(section);
        });
    });

    botonesRapidos.forEach((boton) => {
        boton.addEventListener('click', () => {
            const section = boton.getAttribute('data-section-target');
            mostrarSeccion(section);
        });
    });

    function mostrarSeccion(section) {
        botones.forEach((btn) => {
            btn.classList.remove('active');

            if (btn.getAttribute('data-section') === section) {
                btn.classList.add('active');
            }
        });

        secciones.forEach((sec) => {
            sec.classList.remove('active-section');
        });

        const seccionActiva = document.getElementById(`section-${section}`);

        if (seccionActiva) {
            seccionActiva.classList.add('active-section');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// ===============================
// CERRAR SESIÓN
// ===============================

function configurarCerrarSesion() {
    const btn = document.getElementById('btnCerrarSesionUsuario');

    if (!btn) return;

    btn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

// ===============================
// FUNCIONES AUXILIARES
// ===============================

function obtenerValor(objeto, posiblesCampos) {
    for (const campo of posiblesCampos) {
        if (objeto && objeto[campo] !== undefined && objeto[campo] !== null && objeto[campo] !== '') {
            return objeto[campo];
        }
    }

    return '';
}

function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';

    const nuevaFecha = new Date(fecha);

    if (isNaN(nuevaFecha.getTime())) {
        return fecha;
    }

    return nuevaFecha.toLocaleDateString('es-GT');
}

function obtenerDia(fecha) {
    if (!fecha) return 'Sin día';

    const nuevaFecha = new Date(fecha);

    if (isNaN(nuevaFecha.getTime())) {
        return 'Sin día';
    }

    return nuevaFecha.toLocaleDateString('es-GT', {
        weekday: 'long'
    });
}

function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
}

function claseAviso(estado) {
    const texto = normalizar(estado);

    if (texto.includes('resuelto') || texto.includes('completado')) {
        return 'success';
    }

    if (texto.includes('pendiente')) {
        return 'warning';
    }

    if (texto.includes('grave') || texto.includes('urgente')) {
        return 'danger';
    }

    return 'info';
}

function iconoAviso(estado) {
    const texto = normalizar(estado);

    if (texto.includes('resuelto') || texto.includes('completado')) {
        return '✓';
    }

    if (texto.includes('pendiente')) {
        return '⚠';
    }

    return 'ℹ';
}
