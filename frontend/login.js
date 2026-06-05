const btnLogin = document.getElementById('btnLogin');
const formLogin = document.querySelector('form');

/*
    Usamos la misma URL donde se abre la aplicación.
    Ejemplos:
    - Render: https://tu-app.onrender.com
    - Cloudflare: https://algo.trycloudflare.com
*/
const API_BASE = window.location.origin;

async function iniciarSesion(event) {
    event.preventDefault();

    const inputUsuario = document.getElementById('usuario');
    const inputPassword = document.getElementById('password');

    const usuario = inputUsuario ? inputUsuario.value.trim() : '';
    const password = inputPassword ? inputPassword.value.trim() : '';

    if (!usuario || !password) {
        alert('Ingrese usuario y contraseña');
        return;
    }

    try {
        if (btnLogin) {
            btnLogin.disabled = true;
            btnLogin.textContent = 'Ingresando...';
        }

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
            alert('El servidor respondió, pero no devolvió JSON válido.');
            return;
        }

        if (!respuesta.ok) {
            alert(data.mensaje || 'No se pudo iniciar sesión');
            return;
        }

        localStorage.setItem('token', data.token || '');
        localStorage.setItem('usuario', data.usuario || usuario);
        localStorage.setItem('nombre', data.nombre || '');
        localStorage.setItem('correo', data.correo || '');
        localStorage.setItem('rol', data.rol || '');

        alert('Bienvenido al sistema');

        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Error en login:', error);

        alert(
            'Error al conectar con el servidor.\n\n' +
            'Ruta usada:\n' +
            `${API_BASE}/api/auth/login`
        );
    } finally {
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.textContent = 'LOG IN';
        }
    }
}

if (formLogin) {
    formLogin.addEventListener('submit', iniciarSesion);
} else if (btnLogin) {
    btnLogin.addEventListener('click', iniciarSesion);
}