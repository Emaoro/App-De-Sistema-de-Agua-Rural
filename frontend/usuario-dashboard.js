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
    cargarDatosIniciales();
    activarNavegacion();
    configurarCerrarSesion();
    configurarFormularioIncidencia();
    cargarDashboardUsuario();
});

// =====================================================
// SESIÓN
// =====================================================

function validarSesionUsuario() {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (!token || rol !== 'invitado') {
        alert('Debe iniciar sesión como usuario de la comunidad');
        window.location.href = 'login.html';
    }
}

// =====================================================
// FECHA
// =====================================================

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

// =====================================================
// DATOS INICIALES
// =====================================================

function cargarDatosIniciales() {
    const familia = {
        nombre_jefe: localStorage.getItem('nombre') || 'Usuario invitado',
        correo: localStorage.getItem('correo') || '',
        dpi: localStorage.getItem('dpi') || 'No registrado',
        telefono: localStorage.getItem('telefono') || 'No registrado',
        direccion: localStorage.getItem('direccion') || 'No registrada',
        sector: localStorage.getItem('sector') || 'Sin sector',
        estado: localStorage.getItem('estado') || 'Activo',
        fecha_registro: localStorage.getItem('fecha_registro') || ''
    };

    pintarFamilia(familia);
}

// =====================================================
// CARGAR DATOS REALES
// =====================================================

async function cargarDashboardUsuario() {
    const correo = localStorage.getItem('correo');

    if (!correo) return;

    try {
        const respuesta = await fetch(`${API_BASE}/api/usuario-invitado/dashboard?correo=${encodeURIComponent(correo)}`);

        const data = await obtenerJSONSeguro(respuesta);

        if (!respuesta.ok) {
            console.warn(data.mensaje || 'No se pudo cargar el dashboard de usuario');
            return;
        }

        pintarFamilia(data.familia);
        pintarTanque(data.tanque);
        pintarReportes(data.resumen_reportes);
        pintarDistribuciones(data.distribuciones || []);
        pintarIncidencias(data.incidencias || []);

    } catch (error) {
        console.error('Error cargando dashboard usuario:', error);
    }
}

// =====================================================
// PINTAR FAMILIA
// =====================================================

function pintarFamilia(familia) {
    if (!familia) return;

    const nombre = familia.nombre_jefe || familia.nombre || 'Usuario invitado';
    const correo = familia.correo || '';
    const dpi = familia.dpi || 'No registrado';
    const telefono = familia.telefono || 'No registrado';
    const direccion = familia.direccion || 'No registrada';
    const sector = familia.sector || 'Sin sector';
    const estado = familia.estado || 'Activo';
    const fechaRegistro = familia.fecha_registro || '';

    localStorage.setItem('nombre', nombre);
    localStorage.setItem('correo', correo);
    localStorage.setItem('dpi', dpi);
    localStorage.setItem('telefono', telefono);
    localStorage.setItem('direccion', direccion);
    localStorage.setItem('sector', sector);
    localStorage.setItem('estado', estado);
    localStorage.setItem('fecha_registro', fechaRegistro);

    setText('nombreBienvenida', nombre);
    setText('sectorBienvenida', sector);
    setText('perfilNombre', nombre);
    setText('estadoServicioUsuario', estado);
    setText('perfilEstado', estado);
    setText('perfilFecha', fechaRegistro ? formatearFecha(fechaRegistro) : 'Sin fecha');

    setValue('infoNombre', nombre);
    setValue('infoDpi', dpi);
    setValue('infoTelefono', telefono);
    setValue('infoCorreo', correo);
    setValue('infoSector', sector);
    setValue('infoDireccion', direccion);
    setValue('infoEstado', estado);

    setValue('incNombre', nombre);

    cargarSectorEnSelect('sectorFiltro', sector);
    cargarSectorEnSelect('incSector', sector);

    const fechaIncidencia = document.getElementById('incFecha');

    if (fechaIncidencia) {
        const ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
        fechaIncidencia.value = ahora.toISOString().slice(0, 16);
    }
}

function cargarSectorEnSelect(id, sector) {
    const select = document.getElementById(id);

    if (!select) return;

    select.innerHTML = `
        <option value="${escapeHTML(sector)}">${escapeHTML(sector)}</option>
    `;
}

// =====================================================
// TANQUE
// =====================================================

function pintarTanque(tanque) {
    const tankFill = document.getElementById('tankFill');
    const tankPercent = document.getElementById('tankPercent');
    const tankDetalle = document.getElementById('tankDetalle');

    if (!tanque) {
        if (tankFill) tankFill.style.height = '0%';
        if (tankPercent) tankPercent.textContent = 'Sin dato';
        if (tankDetalle) tankDetalle.textContent = 'Sin lectura registrada';
        return;
    }

    const porcentaje = obtenerValor(tanque, [
        'porcentaje',
        'nivel_porcentaje',
        'nivel',
        'nivel_actual'
    ]);

    const capacidad = obtenerValor(tanque, [
        'capacidad',
        'capacidad_total',
        'litros_totales'
    ]);

    const litros = obtenerValor(tanque, [
        'litros',
        'litros_actuales',
        'cantidad_litros'
    ]);

    const porcentajeNumero = Math.max(0, Math.min(100, Number(porcentaje) || 0));

    if (tankFill) tankFill.style.height = `${porcentajeNumero}%`;
    if (tankPercent) tankPercent.textContent = `${porcentajeNumero}%`;

    if (tankDetalle) {
        if (litros && capacidad) {
            tankDetalle.textContent = `${litros} L de ${capacidad} L`;
        } else {
            tankDetalle.textContent = 'Última lectura registrada';
        }
    }
}

// =====================================================
// REPORTES
// =====================================================

function pintarReportes(resumen) {
    const total = resumen?.total || 0;
    const pendientes = resumen?.pendientes || 0;
    const resueltos = resumen?.resueltos || 0;

    setText('reportesEnviados', total);
    setText('reportesPendientes', pendientes);
    setText('reportesResueltos', resueltos);

    setText('totalReportesUsuario', total);
    setText('totalPendientesUsuario', pendientes);
    setText('totalResueltosUsuario', resueltos);
}

// =====================================================
// DISTRIBUCIONES
// =====================================================

function pintarDistribuciones(distribuciones) {
    pintarResumenDistribucionInicio(distribuciones);
    pintarTablaDistribuciones(distribuciones);
    pintarHistorial(distribuciones);
    pintarProximaDistribucion(distribuciones);
    pintarResumenHistorial(distribuciones);
}

function pintarResumenDistribucionInicio(distribuciones) {
    const contenedor = document.getElementById('resumenDistribucionInicio');

    if (!contenedor) return;

    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        contenedor.innerHTML = `
            <p>No hay distribuciones registradas por el administrador para tu sector.</p>
        `;
        return;
    }

    contenedor.innerHTML = `
        <p>Hay <strong>${distribuciones.length}</strong> registros de distribución para tu sector.</p>
    `;
}

function pintarTablaDistribuciones(distribuciones) {
    const tbody = document.getElementById('tablaDistribucionesUsuario');

    if (!tbody) return;

    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">No hay horarios de distribución registrados para tu sector.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = distribuciones.map(item => {
        const fecha = obtenerValor(item, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
        const inicio = obtenerValor(item, ['hora_inicio', 'inicio', 'hora', 'desde']) || 'Sin hora';
        const fin = obtenerValor(item, ['hora_fin', 'fin', 'hasta']) || 'Sin hora';
        const estado = obtenerValor(item, ['estado']) || 'Registrado';
        const notas = obtenerValor(item, ['notas', 'observaciones', 'descripcion']) || 'Sin observaciones';

        return `
            <tr>
                <td>${formatearFecha(fecha)}</td>
                <td>${obtenerDia(fecha)}</td>
                <td>${escapeHTML(inicio)}</td>
                <td>${escapeHTML(fin)}</td>
                <td><span class="badge-blue">${escapeHTML(estado)}</span></td>
                <td>${escapeHTML(notas)}</td>
            </tr>
        `;
    }).join('');
}

function pintarHistorial(distribuciones) {
    const tbody = document.getElementById('tablaHistorialUsuario');

    if (!tbody) return;

    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">No hay historial de distribución registrado para tu sector.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = distribuciones.map(item => {
        const fecha = obtenerValor(item, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
        const sector = obtenerValor(item, ['sector', 'nombre_sector']) || localStorage.getItem('sector') || 'Sin sector';
        const estado = obtenerValor(item, ['estado']) || 'Registrado';
        const observaciones = obtenerValor(item, ['observaciones', 'notas', 'descripcion']) || 'Sin observaciones';

        return `
            <tr>
                <td>${formatearFecha(fecha)}</td>
                <td>${escapeHTML(sector)}</td>
                <td><span class="badge-green">${escapeHTML(estado)}</span></td>
                <td>${escapeHTML(observaciones)}</td>
            </tr>
        `;
    }).join('');
}

function pintarProximaDistribucion(distribuciones) {
    if (!Array.isArray(distribuciones) || distribuciones.length === 0) {
        setText('proximaDia', 'Sin programación');
        setText('proximaHorario', 'No hay distribución registrada.');
        return;
    }

    const primera = distribuciones[0];

    const fecha = obtenerValor(primera, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
    const inicio = obtenerValor(primera, ['hora_inicio', 'inicio', 'hora', 'desde']) || 'Sin hora';
    const fin = obtenerValor(primera, ['hora_fin', 'fin', 'hasta']) || 'Sin hora';

    setText('proximaDia', obtenerDia(fecha));
    setText('proximaHorario', `${inicio} - ${fin}`);
}

function pintarResumenHistorial(distribuciones) {
    const total = Array.isArray(distribuciones) ? distribuciones.length : 0;

    setText('totalDistribucionesMes', total);

    if (total === 0) {
        setText('cumplimientoUsuario', '0%');
        setText('ultimaDistribucionFecha', 'Sin fecha');
        setText('ultimaDistribucionHora', 'Sin horario');
        return;
    }

    const completadas = distribuciones.filter(item => {
        const estado = normalizar(obtenerValor(item, ['estado']));
        return estado.includes('completado') ||
               estado.includes('completada') ||
               estado.includes('finalizado') ||
               estado.includes('realizado');
    }).length;

    const porcentaje = Math.round((completadas / total) * 100);

    setText('cumplimientoUsuario', `${porcentaje}%`);

    const ultima = distribuciones[0];

    const fecha = obtenerValor(ultima, ['fecha', 'fecha_distribucion', 'fecha_inicio', 'created_at']);
    const inicio = obtenerValor(ultima, ['hora_inicio', 'inicio', 'hora', 'desde']) || 'Sin hora';
    const fin = obtenerValor(ultima, ['hora_fin', 'fin', 'hasta']) || 'Sin hora';

    setText('ultimaDistribucionFecha', formatearFecha(fecha));
    setText('ultimaDistribucionHora', `${inicio} - ${fin}`);
}

// =====================================================
// INCIDENCIAS
// =====================================================

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
                    <p>No hay incidencias registradas para tu sector.</p>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = incidencias.slice(0, 3).map(item => crearHTMLIncidencia(item)).join('');
}

function pintarNotificaciones(incidencias) {
    const contenedor = document.getElementById('listaNotificacionesUsuario');

    if (!contenedor) return;

    if (!Array.isArray(incidencias) || incidencias.length === 0) {
        contenedor.innerHTML = `
            <div class="notice info">
                <span>ℹ</span>
                <div>
                    <h4>Sin notificaciones</h4>
                    <p>No hay incidencias o avisos registrados por el administrador.</p>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = incidencias.map(item => crearHTMLIncidencia(item)).join('');
}

function crearHTMLIncidencia(item) {
    const tipo = obtenerValor(item, ['tipo', 'tipo_incidencia', 'categoria']) || 'Incidencia';
    const descripcion = obtenerValor(item, ['descripcion', 'detalle', 'observaciones', 'comentario']) || 'Sin descripción';
    const estado = obtenerValor(item, ['estado']) || 'Pendiente';

    return `
        <div class="notice ${claseAviso(estado)}">
            <span>${iconoAviso(estado)}</span>
            <div>
                <h4>${escapeHTML(tipo)}</h4>
                <p>${escapeHTML(descripcion)}</p>
            </div>
        </div>
    `;
}

// =====================================================
// FORMULARIO INCIDENCIA
// =====================================================

function configurarFormularioIncidencia() {
    const form = document.getElementById('formIncidenciaUsuario');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('incNombre')?.value.trim() || localStorage.getItem('nombre') || 'Usuario';
        const sector = localStorage.getItem('sector') || document.getElementById('incSector')?.value || 'Sin sector';
        const correo = localStorage.getItem('correo') || '';
        const tipo = document.getElementById('incTipo')?.value || 'Incidencia';
        const descripcion = document.getElementById('incDescripcion')?.value.trim() || '';
        const fecha = document.getElementById('incFecha')?.value || '';

        if (!descripcion) {
            alert('Ingrese una descripción de la incidencia');
            return;
        }

        const boton = form.querySelector('button[type="submit"]');

        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Enviando...';
        }

        const data = {
            tipo,
            descripcion,
            sector,
            estado: 'Pendiente',
            reportado_por: nombre,
            correo,
            fecha_reporte: fecha
        };

        try {
            const respuesta = await fetch(`${API_BASE}/api/usuario-invitado/incidencias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const resultado = await obtenerJSONSeguro(respuesta);

            if (!respuesta.ok) {
                console.error('Error al registrar incidencia:', resultado);
                alert(resultado.detalle || resultado.mensaje || 'No se pudo enviar el reporte');
                return;
            }

            alert('Reporte enviado correctamente');

            const descripcionInput = document.getElementById('incDescripcion');

            if (descripcionInput) {
                descripcionInput.value = '';
            }

            await cargarDashboardUsuario();

        } catch (error) {
            console.error('Error enviando incidencia:', error);
            alert('No se pudo conectar con el servidor');
        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = 'Enviar reporte';
            }
        }
    });
}

// =====================================================
// NAVEGACIÓN
// =====================================================

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

// =====================================================
// CERRAR SESIÓN
// =====================================================

function configurarCerrarSesion() {
    const btn = document.getElementById('btnCerrarSesionUsuario');

    if (!btn) return;

    btn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

// =====================================================
// AUXILIARES
// =====================================================

async function obtenerJSONSeguro(respuesta) {
    const texto = await respuesta.text();

    try {
        return JSON.parse(texto);
    } catch (error) {
        console.error('Respuesta no JSON:', texto);
        return {
            mensaje: 'El servidor no respondió correctamente',
            detalle: texto
        };
    }
}

function setText(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

function setValue(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = valor;
    }
}

function obtenerValor(objeto, posiblesCampos) {
    for (const campo of posiblesCampos) {
        if (
            objeto &&
            objeto[campo] !== undefined &&
            objeto[campo] !== null &&
            objeto[campo] !== ''
        ) {
            return objeto[campo];
        }
    }

    return '';
}

function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
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

function claseAviso(estado) {
    const texto = normalizar(estado);

    if (texto.includes('resuelto') || texto.includes('completado') || texto.includes('finalizado')) {
        return 'success';
    }

    if (texto.includes('pendiente') || texto.includes('revision') || texto.includes('revisión')) {
        return 'warning';
    }

    if (texto.includes('urgente') || texto.includes('grave')) {
        return 'danger';
    }

    return 'info';
}

function iconoAviso(estado) {
    const texto = normalizar(estado);

    if (texto.includes('resuelto') || texto.includes('completado') || texto.includes('finalizado')) {
        return '✓';
    }

    if (texto.includes('pendiente') || texto.includes('revision') || texto.includes('revisión')) {
        return '⚠';
    }

    return 'ℹ';
}

function escapeHTML(valor) {
    return String(valor || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
