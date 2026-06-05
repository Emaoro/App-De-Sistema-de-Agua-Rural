const formLogin = document.getElementById('formLogin');
const btnLogin = document.getElementById('btnLogin');

const tabAdmin = document.getElementById('tabAdmin');
const tabUsuario = document.getElementById('tabUsuario');

const adminFields = document.getElementById('adminFields');
const usuarioFields = document.getElementById('usuarioFields');

const textoBienvenida = document.getElementById('textoBienvenida');

// =====================================================
// CONFIGURACIÓN DE API
// =====================================================
// Si abres con Live Server en 127.0.0.1:5500,
// conecta al backend local en localhost:3000.
// Si abres desde localhost:3000 o Render,
// usa el mismo dominio donde está abierta la app.

let API_BASE = window.location.origin;

if (
    window.location.port === '5500' ||
    window.location.hostname === '127.0.0.1'
) {
    API_BASE = 'http://localhost:3000';
}

let tipoLogin = 'admin';

console.log('API conectada en:', API_BASE);

// =====================================================
// CAMBIAR A LOGIN ADMINISTRADOR
// =====================================================

if (tabAdmin) {
    tabAdmin.addEventListener('click', () => {
        tipoLogin = 'admin';

        tabAdmin.classList.add('active');

        if (tabUsuario) {
            tabUsuario.classList.remove('active');
        }

        if (adminFields) {
            adminFields.classList.remove('hidden');
        }

        if (usuarioFields) {
            usuarioFields.classList.add('hidden');
        }

        if (btnLogin) {
            btnLogin.textContent = 'LOG IN';
        }

        if (textoBienvenida) {
            textoBienvenida.textContent = 'Ingrese sus datos para acceder al sistema';
        }
    });
}

// =====================================================
// CAMBIAR A LOGIN USUARIO DE LA COMUNIDAD
// =====================================================

if (tabUsuario) {
    tabUsuario.addEventListener('click', () => {
        tipoLogin = 'usuario';

        tabUsuario.classList.add('active');

        if (tabAdmin) {
            tabAdmin.classList.remove('active');
        }

        if (usuarioFields) {
            usuarioFields.classList.remove('hidden');
        }

        if (adminFields) {
            adminFields.classList.add('hidden');
        }

        if (btnLogin) {
            btnLogin.textContent = 'INGRESAR';
        }

        if (textoBienvenida) {
            textoBienvenida.textContent = 'Acceso de usuario de la comunidad';
        }
    });
}

// =====================================================
// FORMULARIO PRINCIPAL
// =====================================================

if (formLogin) {
    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (tipoLogin === 'admin') {
            await loginAdministrador();
        } else {
            await loginUsuarioInvitado();
        }
    });
}

// =====================================================
// LOGIN ADMINISTRADOR
// =====================================================

async function loginAdministrador() {
    const inputUsuario = document.getElementById('usuario');
    const inputPassword = document.getElementById('password');

    const usuario = inputUsuario ? inputUsuario.value.trim() : '';
    const password = inputPassword ? inputPassword.value.trim() : '';

    if (!usuario || !password) {
        alert('Ingrese usuario y contraseña');
        return;
    }

    try {
        activarBoton('Ingresando...');

        const respuesta = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario,
                password
            })
        });

        const data = await obtenerJSONSeguro(respuesta);

        if (!respuesta.ok) {
            alert(data.mensaje || 'No se pudo iniciar sesión');
            return;
        }

        limpiarSesion();

        localStorage.setItem('token', data.token || '');
        localStorage.setItem('usuario', data.usuario || usuario);
        localStorage.setItem('nombre', data.nombre || data.nombre_completo || 'Administrador');
        localStorage.setItem('correo', data.correo || '');
        localStorage.setItem('rol', data.rol || 'admin');

        alert('Bienvenido al sistema');

        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Error en login administrador:', error);
        alert('Error al conectar con el servidor');
    } finally {
        restaurarBotonAdmin();
    }
}

// =====================================================
// LOGIN USUARIO INVITADO / USUARIO COMUNIDAD
// =====================================================

async function loginUsuarioInvitado() {
    const inputCorreo = document.getElementById('correoInvitado');
    const correo = inputCorreo ? inputCorreo.value.trim().toLowerCase() : '';

    if (!correo) {
        alert('Ingrese su correo electrónico');
        return;
    }

    if (!validarCorreo(correo)) {
        alert('Ingrese un correo electrónico válido');
        return;
    }

    try {
        activarBoton('Validando...');

        const respuesta = await fetch(`${API_BASE}/api/usuario-invitado/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo
            })
        });

        const data = await obtenerJSONSeguro(respuesta);

        if (!respuesta.ok) {
            alert(data.mensaje || 'Usuario no encontrado');
            return;
        }

        limpiarSesion();

        localStorage.setItem('familia_id', data.id || '');
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('usuario', data.usuario || '');
        localStorage.setItem('nombre', data.nombre || 'Usuario invitado');
        localStorage.setItem('correo', data.correo || correo);
        localStorage.setItem('rol', 'invitado');

        localStorage.setItem('dpi', data.dpi || '');
        localStorage.setItem('telefono', data.telefono || '');
        localStorage.setItem('direccion', data.direccion || '');
        localStorage.setItem('sector', data.sector || 'Sin sector');
        localStorage.setItem('estado', data.estado || 'Activo');
        localStorage.setItem('fecha_registro', data.fecha_registro || '');

        alert('Bienvenido como usuario de la comunidad');

        window.location.href = 'usuario-dashboard.html';

    } catch (error) {
        console.error('Error en login de usuario invitado:', error);
        alert('Error al conectar con el servidor');
    } finally {
        restaurarBotonUsuario();
    }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function activarBoton(texto) {
    if (!btnLogin) return;

    btnLogin.disabled = true;
    btnLogin.textContent = texto;
}

function restaurarBotonAdmin() {
    if (!btnLogin) return;

    btnLogin.disabled = false;

    if (tipoLogin === 'admin') {
        btnLogin.textContent = 'LOG IN';
    } else {
        btnLogin.textContent = 'INGRESAR';
    }
}

function restaurarBotonUsuario() {
    if (!btnLogin) return;

    btnLogin.disabled = false;

    if (tipoLogin === 'usuario') {
        btnLogin.textContent = 'INGRESAR';
    } else {
        btnLogin.textContent = 'LOG IN';
    }
}

function limpiarSesion() {
    localStorage.removeItem('familia_id');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre');
    localStorage.removeItem('correo');
    localStorage.removeItem('rol');
    localStorage.removeItem('dpi');
    localStorage.removeItem('telefono');
    localStorage.removeItem('direccion');
    localStorage.removeItem('sector');
    localStorage.removeItem('estado');
    localStorage.removeItem('fecha_registro');
}

function validarCorreo(correo) {
    const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return expresion.test(correo);
}

async function obtenerJSONSeguro(respuesta) {
    const texto = await respuesta.text();

    try {
        return JSON.parse(texto);
    } catch (error) {
        console.error('Respuesta no JSON:', texto);

        return {
            mensaje: 'El servidor no respondió correctamente'
        };
    }
}
