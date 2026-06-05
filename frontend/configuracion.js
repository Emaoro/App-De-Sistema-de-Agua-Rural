const API_BASE = '';
const API_CONFIGURACION = `${API_BASE}/api/configuracion`;

const tabs = document.querySelectorAll('.config-tab');
const sections = document.querySelectorAll('.config-section');

const btnGuardarConfiguracion = document.getElementById('btnGuardarConfiguracion');
const btnGuardarSuperior = document.getElementById('btnGuardarSuperior');
const btnLimpiarConfiguracion = document.getElementById('btnLimpiarConfiguracion');
const btnRespaldarAhora = document.getElementById('btnRespaldarAhora');
const btnAgregarRol = document.getElementById('btnAgregarRol');

const fechaActualizacion = document.getElementById('fechaActualizacion');

const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

let roles = [];

// GENERAL
const nombreComunidad = document.getElementById('nombreComunidad');
const modoConectividad = document.getElementById('modoConectividad');
const totalFamiliasConfig = document.getElementById('totalFamiliasConfig');
const alertasNivelCritico = document.getElementById('alertasNivelCritico');
const fuenteAgua = document.getElementById('fuenteAgua');
const registroIncidencias = document.getElementById('registroIncidencias');
const distribucionSectores = document.getElementById('distribucionSectores');

// NOTIFICACIONES
const habilitarNotificaciones = document.getElementById('habilitarNotificaciones');
const usarCorreo = document.getElementById('usarCorreo');
const correoNotificacion = document.getElementById('correoNotificacion');
const usarSMS = document.getElementById('usarSMS');
const smsNotificacion = document.getElementById('smsNotificacion');
const notificacionesSistema = document.getElementById('notificacionesSistema');
const eventoNivelCritico = document.getElementById('eventoNivelCritico');
const eventoFugas = document.getElementById('eventoFugas');
const eventoDistribucion = document.getElementById('eventoDistribucion');
const eventoMantenimiento = document.getElementById('eventoMantenimiento');
const horarioNotificaciones = document.getElementById('horarioNotificaciones');
const notificarDesde = document.getElementById('notificarDesde');
const notificarHasta = document.getElementById('notificarHasta');

// TANQUES
const unidadVolumen = document.getElementById('unidadVolumen');
const capacidadDefectoTanque = document.getElementById('capacidadDefectoTanque');
const nivelCriticoTanque = document.getElementById('nivelCriticoTanque');
const nivelOptimoTanque = document.getElementById('nivelOptimoTanque');
const intervaloLectura = document.getElementById('intervaloLectura');

// DISTRIBUCIÓN
const diasDistribucion = document.querySelectorAll('.diaDistribucion');
const metodoDistribucion = document.getElementById('metodoDistribucion');
const horaInicioDistribucion = document.getElementById('horaInicioDistribucion');
const horaFinDistribucion = document.getElementById('horaFinDistribucion');
const ordenDistribucion = document.getElementById('ordenDistribucion');
const duracionMinimaSector = document.getElementById('duracionMinimaSector');
const descansoSectores = document.getElementById('descansoSectores');

// SEGURIDAD
const tiempoSesion = document.getElementById('tiempoSesion');
const verificacionDosPasos = document.getElementById('verificacionDosPasos');
const bloquearInactivos = document.getElementById('bloquearInactivos');
const contrasenaMinima = document.getElementById('contrasenaMinima');
const intentosFallidos = document.getElementById('intentosFallidos');
const registroActividad = document.getElementById('registroActividad');

// RESPALDO
const frecuenciaRespaldo = document.getElementById('frecuenciaRespaldo');
const horaRespaldo = document.getElementById('horaRespaldo');
const retenerRespaldos = document.getElementById('retenerRespaldos');
const destinoRespaldo = document.getElementById('destinoRespaldo');
const cuentaRespaldo = document.getElementById('cuentaRespaldo');

document.addEventListener('DOMContentLoaded', () => {
    configurarTabs();
    cargarConfiguracion();
});

if (btnGuardarConfiguracion) {
    btnGuardarConfiguracion.addEventListener('click', guardarConfiguracion);
}

if (btnGuardarSuperior) {
    btnGuardarSuperior.addEventListener('click', guardarConfiguracion);
}

if (btnLimpiarConfiguracion) {
    btnLimpiarConfiguracion.addEventListener('click', limpiarFormulario);
}

if (btnRespaldarAhora) {
    btnRespaldarAhora.addEventListener('click', () => {
        mostrarToast('Respaldo simulado correctamente');
    });
}

if (btnAgregarRol) {
    btnAgregarRol.addEventListener('click', agregarRol);
}

function configurarTabs() {
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const nombre = tab.dataset.tab;

            tabs.forEach((item) => item.classList.remove('active'));
            sections.forEach((section) => section.classList.remove('active'));

            tab.classList.add('active');

            const section = document.getElementById(`section-${nombre}`);

            if (section) {
                section.classList.add('active');
            }
        });
    });
}

async function cargarConfiguracion() {
    try {
        const respuesta = await fetch(API_CONFIGURACION);

        let data;

        try {
            data = await respuesta.json();
        } catch (error) {
            alert('El servidor no respondió con JSON válido en configuración.');
            return;
        }

        if (!respuesta.ok) {
            alert(data.mensaje || 'Error al obtener configuración');
            return;
        }

        llenarFormulario(data.configuracion);

    } catch (error) {
        console.error('Error al cargar configuración:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

function llenarFormulario(config) {
    if (!config) {
        return;
    }

    const general = config.general || {};
    const notificaciones = config.notificaciones || {};
    const tanques = config.tanques || {};
    const distribucion = config.distribucion || {};
    const seguridad = config.seguridad || {};
    const usuarios = config.usuarios || {};
    const respaldo = config.respaldo || {};

    setValue(nombreComunidad, general.nombre_comunidad);
    setValue(modoConectividad, general.modo_conectividad);
    setValue(totalFamiliasConfig, general.total_familias);
    setChecked(alertasNivelCritico, general.alertas_nivel_critico);
    setValue(fuenteAgua, general.fuente_agua);
    setChecked(registroIncidencias, general.registro_incidencias);
    setValue(distribucionSectores, String(general.distribucion_sectores));

    setChecked(habilitarNotificaciones, notificaciones.habilitar_notificaciones);
    setChecked(usarCorreo, Boolean(notificaciones.correo));
    setValue(correoNotificacion, notificaciones.correo);
    setChecked(usarSMS, Boolean(notificaciones.sms));
    setValue(smsNotificacion, notificaciones.sms);
    setChecked(notificacionesSistema, notificaciones.notificaciones_sistema);
    setChecked(eventoNivelCritico, notificaciones.evento_nivel_critico);
    setChecked(eventoFugas, notificaciones.evento_fugas);
    setChecked(eventoDistribucion, notificaciones.evento_distribucion);
    setChecked(eventoMantenimiento, notificaciones.evento_mantenimiento);
    setValue(horarioNotificaciones, notificaciones.horario);
    setValue(notificarDesde, notificaciones.desde);
    setValue(notificarHasta, notificaciones.hasta);

    setValue(unidadVolumen, tanques.unidad_volumen);
    setValue(capacidadDefectoTanque, tanques.capacidad_defecto);
    setValue(nivelCriticoTanque, tanques.nivel_critico);
    setValue(nivelOptimoTanque, tanques.nivel_optimo);
    setValue(intervaloLectura, tanques.intervalo_lectura);

    marcarDias(distribucion.dias || []);
    setValue(metodoDistribucion, distribucion.metodo);
    setValue(horaInicioDistribucion, distribucion.hora_inicio);
    setValue(horaFinDistribucion, distribucion.hora_fin);
    setValue(ordenDistribucion, distribucion.orden);
    setValue(duracionMinimaSector, distribucion.duracion_minima);
    setValue(descansoSectores, distribucion.descanso);

    setValue(tiempoSesion, seguridad.tiempo_sesion);
    setChecked(verificacionDosPasos, seguridad.verificacion_dos_pasos);
    setChecked(bloquearInactivos, seguridad.bloquear_inactivos);
    setValue(contrasenaMinima, seguridad.contrasena_minima);
    setValue(intentosFallidos, seguridad.intentos_fallidos);
    setChecked(registroActividad, seguridad.registro_actividad);

    roles = usuarios.roles || [];
    renderRoles();

    setValue(frecuenciaRespaldo, respaldo.frecuencia);
    setValue(horaRespaldo, respaldo.hora);
    setValue(retenerRespaldos, respaldo.retener);
    setValue(destinoRespaldo, respaldo.destino);
    setValue(cuentaRespaldo, respaldo.cuenta);

    if (config.fecha_actualizacion && fechaActualizacion) {
        fechaActualizacion.textContent = `Última actualización: ${formatearFechaHora(config.fecha_actualizacion)}`;
    }
}

function obtenerDatosFormulario() {
    return {
        general: {
            nombre_comunidad: getValue(nombreComunidad),
            total_familias: Number(getValue(totalFamiliasConfig) || 0),
            fuente_agua: getValue(fuenteAgua),
            modo_conectividad: getValue(modoConectividad),
            alertas_nivel_critico: getChecked(alertasNivelCritico),
            registro_incidencias: getChecked(registroIncidencias),
            distribucion_sectores: getValue(distribucionSectores) === 'true'
        },

        notificaciones: {
            habilitar_notificaciones: getChecked(habilitarNotificaciones),
            correo: getValue(correoNotificacion),
            sms: getValue(smsNotificacion),
            notificaciones_sistema: getChecked(notificacionesSistema),
            evento_nivel_critico: getChecked(eventoNivelCritico),
            evento_fugas: getChecked(eventoFugas),
            evento_distribucion: getChecked(eventoDistribucion),
            evento_mantenimiento: getChecked(eventoMantenimiento),
            horario: getValue(horarioNotificaciones),
            desde: getValue(notificarDesde),
            hasta: getValue(notificarHasta)
        },

        tanques: {
            unidad_volumen: getValue(unidadVolumen),
            capacidad_defecto: Number(getValue(capacidadDefectoTanque) || 0),
            nivel_critico: Number(getValue(nivelCriticoTanque) || 0),
            nivel_optimo: Number(getValue(nivelOptimoTanque) || 0),
            intervalo_lectura: getValue(intervaloLectura)
        },

        distribucion: {
            dias: obtenerDiasSeleccionados(),
            metodo: getValue(metodoDistribucion),
            hora_inicio: getValue(horaInicioDistribucion),
            hora_fin: getValue(horaFinDistribucion),
            orden: getValue(ordenDistribucion),
            duracion_minima: Number(getValue(duracionMinimaSector) || 0),
            descanso: Number(getValue(descansoSectores) || 0)
        },

        seguridad: {
            tiempo_sesion: getValue(tiempoSesion),
            verificacion_dos_pasos: getChecked(verificacionDosPasos),
            bloquear_inactivos: getChecked(bloquearInactivos),
            contrasena_minima: Number(getValue(contrasenaMinima) || 0),
            intentos_fallidos: Number(getValue(intentosFallidos) || 0),
            registro_actividad: getChecked(registroActividad)
        },

        usuarios: {
            roles: roles
        },

        respaldo: {
            frecuencia: getValue(frecuenciaRespaldo),
            hora: getValue(horaRespaldo),
            retener: getValue(retenerRespaldos),
            destino: getValue(destinoRespaldo),
            cuenta: getValue(cuentaRespaldo)
        }
    };
}

async function guardarConfiguracion() {
    const data = obtenerDatosFormulario();

    if (!data.general.nombre_comunidad) {
        alert('Ingrese el nombre de la comunidad.');
        return;
    }

    try {
        const respuesta = await fetch(API_CONFIGURACION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || 'No se pudo guardar la configuración.');
            return;
        }

        if (resultado.configuracion && resultado.configuracion.fecha_actualizacion && fechaActualizacion) {
            fechaActualizacion.textContent = `Última actualización: ${formatearFechaHora(resultado.configuracion.fecha_actualizacion)}`;
        }

        mostrarToast(resultado.mensaje || 'Configuración guardada correctamente');

    } catch (error) {
        console.error('Error al guardar configuración:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

function limpiarFormulario() {
    const confirmar = confirm('¿Desea limpiar los campos de configuración?');

    if (!confirmar) {
        return;
    }

    document.querySelectorAll('input').forEach((input) => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    document.querySelectorAll('select').forEach((select) => {
        select.selectedIndex = 0;
    });
}

function agregarRol() {
    const nombre = prompt('Ingrese el nombre del nuevo rol:');

    if (!nombre) {
        return;
    }

    roles.push({
        nombre: nombre,
        descripcion: 'Rol personalizado del sistema',
        usuarios: 0
    });

    renderRoles();
}

function renderRoles() {
    const rolesList = document.getElementById('rolesList');

    if (!rolesList) {
        return;
    }

    if (!roles || roles.length === 0) {
        rolesList.innerHTML = '<p class="empty-text">No hay roles configurados.</p>';
        return;
    }

    rolesList.innerHTML = roles.map((rol, index) => `
        <div class="role-item">
            <div class="role-icon">👤</div>

            <div>
                <strong>${rol.nombre}</strong>
                <p>${rol.descripcion || ''}</p>
            </div>

            <span>${rol.usuarios || 0} usuarios</span>

            <button onclick="eliminarRol(${index})">
                Eliminar
            </button>
        </div>
    `).join('');
}

function eliminarRol(index) {
    roles.splice(index, 1);
    renderRoles();
}

function obtenerDiasSeleccionados() {
    const dias = [];

    diasDistribucion.forEach((dia) => {
        if (dia.checked) {
            dias.push(dia.value);
        }
    });

    return dias;
}

function marcarDias(dias) {
    diasDistribucion.forEach((dia) => {
        dia.checked = dias.includes(dia.value);
    });
}

function setValue(elemento, valor) {
    if (elemento) {
        elemento.value = valor ?? '';
    }
}

function getValue(elemento) {
    return elemento ? elemento.value : '';
}

function setChecked(elemento, valor) {
    if (elemento) {
        elemento.checked = valor === true;
    }
}

function getChecked(elemento) {
    return elemento ? elemento.checked : false;
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

window.eliminarRol = eliminarRol;