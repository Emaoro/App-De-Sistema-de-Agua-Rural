const formLogin = document.getElementById('formLogin');
const btnLogin = document.getElementById('btnLogin');

const tabAdmin = document.getElementById('tabAdmin');
const tabUsuario = document.getElementById('tabUsuario');

const adminFields = document.getElementById('adminFields');
const usuarioFields = document.getElementById('usuarioFields');

const textoBienvenida = document.getElementById('textoBienvenida');

/*
    API_BASE:
    - Si abres con Live Server 127.0.0.1:5500, conecta al backend localhost:3000.
    - Si abres con localhost:3000, usa el mismo dominio.
    - Si abres en Render, usa el dominio de Render.
*/
let API_BASE = window.location.origin;

if (
    window.location.port === '5500' ||
    window.location.hostname === '127.0.0.1'
) {
    API_BASE = 'http://localhost:3000';
}

let tipoLogin = 'admin';

console.log('API conectada en:', API_BASE);

// ======================================
// CAMBIAR A LOGIN ADMINISTRADOR
// ======================================

if (tabAdmin) {
    tabAdmin.addEventListener('click', () => {
        tipoLogin = 'admin';

        tabAdmin.classList.add('active');
        tabUsuario.classList.remove('active');

        adminFields.classList.remove('hidden');
        usuarioFields.classList.add('hidden');

        btnLogin.textContent = 'LOG IN';

        if (textoBienvenida) {
            textoBienvenida.textContent = 'Ingrese sus datos para acceder al sistema';
        }
    });
}

// ======================================
// CAMBIAR A LOGIN USUARIO
// ======================================

if (tabUsuario) {
    tabUsuario.addEventListener('click', () => {
        tipoLogin = 'usuario';

        tabUsuario.classList.add('active');
        tabAdmin.classList.remove('active');

        usuarioFields.classList.remove('hidden');
        adminFields.classList.add('hidden');

        btnLogin.textContent = 'INGRESAR';

        if (textoBienvenida) {
            textoBienvenida.textContent = 'Acceso de usuario de la comunidad';
        }
    });
}

// ======================================
// FORMULARIO PRINCIPAL
// ======================================

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

// ======================================
// LOGIN ADMINISTRADOR
// ======================================

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
        btnLogin.disabled = true;
        btnLogin.textContent = 'Ingresando...';

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

        const texto = await respuesta.text();

        let data;

        try {
            data = JSON.parse(texto);
        } catch (error) {
            console.error('Respuesta no JSON:', texto);
            alert('El servidor no respondió correctamente.');
            return;
        }

        if (!respuesta.ok) {
            alert(data.mensaje || 'No se pudo iniciar sesión');
            return;
        }

        localStorage.setItem('token', data.token || '');
        localStorage.setItem('usuario', data.usuario || usuario);
        localStorage.setItem('nombre', data.nombre || data.nombre_completo || '');
        localStorage.setItem('correo', data.correo || '');
        localStorage.setItem('rol', data.rol || 'admin');

        alert('Bienvenido al sistema');

        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Error en login administrador:', error);
        alert('Error al conectar con el servidor');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'LOG IN';
    }
}

// ======================================
// LOGIN USUARIO INVITADO
// ======================================

async function loginUsuarioInvitado() {
    const inputCorreo = document.getElementById('correoInvitado');
    const correo = inputCorreo ? inputCorreo.value.trim().toLowerCase() : '';

    if (!correo) {
        alert('Ingrese su correo electrónico');
        return;
    }

    try {
        btnLogin.disabled = true;
        btnLogin.textContent = 'Validando...';

        console.log('Enviando correo a:', `${API_BASE}/api/usuario-invitado/login`);

        const respuesta = await fetch(`${API_BASE}/api/usuario-invitado/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo
            })
        });

        const texto = await respuesta.text();

        let data;

        try {
            data = JSON.parse(texto);
        } catch (error) {
            console.error('Respuesta no JSON:', texto);
            alert('El servidor no respondió correctamente.');
            return;
        }

        if (!respuesta.ok) {
            alert(data.mensaje || 'Usuario no encontrado');
            return;
        }

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
        btnLogin.disabled = false;
        btnLogin.textContent = 'INGRESAR';
    }
}
