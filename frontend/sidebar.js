function cargarSidebar(paginaActiva) {
    const sidebar = document.getElementById('sidebar');

    if (!sidebar) {
        return;
    }

    sidebar.innerHTML = `
        <div class="sidebar-decoration top"></div>
        <div class="sidebar-decoration bottom"></div>

        <div class="brand">

            <div class="brand-icon">
                <svg viewBox="0 0 24 24" fill="none">
                    <path 
                        d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
                        stroke="white"
                        stroke-width="2"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>

            <div>
                <h2>Control Agua</h2>
                <p>Sistema de Gestión</p>
            </div>

        </div>

        <nav class="menu">

            <a href="dashboard.html" class="${paginaActiva === 'dashboard' ? 'active' : ''}">
                <span class="menu-icon">⌂</span>
                <span>Inicio</span>
            </a>

            <a href="familias.html" class="${paginaActiva === 'familias' ? 'active' : ''}">
                <span class="menu-icon">👥</span>
                <span>Familias</span>
            </a>

            <a href="incidencias.html" class="${paginaActiva === 'incidencias' ? 'active' : ''}">
                <span class="menu-icon">🔔</span>
                <span>Incidencias</span>
            </a>

            <a href="tanques.html" class="${paginaActiva === 'tanques' ? 'active' : ''}">
                <span class="menu-icon">💧</span>
                <span>Tanques</span>
            </a>

            <a href="sectores.html" class="${paginaActiva === 'sectores' ? 'active' : ''}">
                <span class="menu-icon">▦</span>
                <span>Sectores</span>
            </a>

            <a href="distribucion.html" class="${paginaActiva === 'distribucion' ? 'active' : ''}">
                <span class="menu-icon">📊</span>
                <span>Distribución</span>
            </a>

            <a href="reportes.html" class="${paginaActiva === 'reportes' ? 'active' : ''}">
                <span class="menu-icon">▤</span>
                <span>Reportes</span>
            </a>

            <a href="configuracion.html" class="${paginaActiva === 'configuracion' ? 'active' : ''}">
                <span class="menu-icon">⚙</span>
                <span>Configuración</span>
            </a>

        </nav>

        <a href="login.html" class="logout" onclick="cerrarSesion()">
            <span class="menu-icon">↩</span>
            <span>Cerrar sesión</span>
        </a>
    `;

    activarMenuMovil();
}

function activarMenuMovil() {
    const sidebar = document.getElementById('sidebar');

    if (!sidebar) {
        return;
    }

    if (document.querySelector('.mobile-menu-btn')) {
        return;
    }

    const botonMenu = document.createElement('button');
    botonMenu.className = 'mobile-menu-btn';
    botonMenu.type = 'button';
    botonMenu.innerHTML = '☰';
    botonMenu.setAttribute('aria-label', 'Abrir menú');

    const fondoMenu = document.createElement('div');
    fondoMenu.className = 'sidebar-overlay';

    document.body.appendChild(botonMenu);
    document.body.appendChild(fondoMenu);

    botonMenu.addEventListener('click', function () {
        sidebar.classList.toggle('active');
        fondoMenu.classList.toggle('active');

        if (sidebar.classList.contains('active')) {
            botonMenu.innerHTML = '×';
            botonMenu.setAttribute('aria-label', 'Cerrar menú');
        } else {
            botonMenu.innerHTML = '☰';
            botonMenu.setAttribute('aria-label', 'Abrir menú');
        }
    });

    fondoMenu.addEventListener('click', function () {
        cerrarMenuMovil();
    });

    const enlaces = sidebar.querySelectorAll('a');

    enlaces.forEach(function (enlace) {
        enlace.addEventListener('click', function () {
            if (window.innerWidth <= 700) {
                cerrarMenuMovil();
            }
        });
    });

    function cerrarMenuMovil() {
        sidebar.classList.remove('active');
        fondoMenu.classList.remove('active');
        botonMenu.innerHTML = '☰';
        botonMenu.setAttribute('aria-label', 'Abrir menú');
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
}