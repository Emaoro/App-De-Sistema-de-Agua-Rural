const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');

const paginas = [
    { archivo: 'dashboard.html', activa: 'dashboard', js: 'dashboard.js' },
    { archivo: 'familias.html', activa: 'familias', js: 'familias.js' },
    { archivo: 'incidencias.html', activa: 'incidencias', js: 'incidencias.js' },
    { archivo: 'tanques.html', activa: 'tanques', js: 'tanques.js' },
    { archivo: 'sectores.html', activa: 'sectores', js: 'sectores.js' },
    { archivo: 'distribucion.html', activa: 'distribucion', js: 'distribucion.js' },
    { archivo: 'reportes.html', activa: 'reportes', js: 'reportes.js' },
    { archivo: 'configuracion.html', activa: 'configuracion', js: 'configuracion.js' }
];

function reemplazarSidebar(html) {
    return html.replace(
        /<aside\s+class=["']sidebar["'][\s\S]*?<\/aside>/i,
        '<aside class="sidebar" id="sidebar"></aside>'
    );
}

function agregarSidebarCss(html) {
    if (html.includes('sidebar.css')) {
        return html;
    }

    return html.replace(
        '</head>',
        '    <link rel="stylesheet" href="sidebar.css">\n</head>'
    );
}

function quitarSidebarScriptsViejos(html) {
    html = html.replace(/<script\s+src=["']sidebar\.js["']><\/script>/g, '');
    html = html.replace(/<script>\s*cargarSidebar\(['"][a-zA-Z]+['"]\);\s*<\/script>/g, '');
    return html;
}

function agregarScripts(html, pagina) {
    const scriptSidebar = `
<script src="sidebar.js"></script>
<script>
    cargarSidebar('${pagina.activa}');
</script>`;

    const regexPaginaJs = new RegExp(
        `<script\\s+src=["']${pagina.js.replace('.', '\\.')}["']><\\/script>`,
        'i'
    );

    if (regexPaginaJs.test(html)) {
        html = html.replace(
            regexPaginaJs,
            `${scriptSidebar}\n<script src="${pagina.js}"></script>`
        );
    } else {
        html = html.replace(
            '</body>',
            `${scriptSidebar}\n<script src="${pagina.js}"></script>\n</body>`
        );
    }

    return html;
}

paginas.forEach((pagina) => {
    const archivoPath = path.join(frontendPath, pagina.archivo);

    if (!fs.existsSync(archivoPath)) {
        console.log(`No existe: ${pagina.archivo}`);
        return;
    }

    let html = fs.readFileSync(archivoPath, 'utf8');

    html = reemplazarSidebar(html);
    html = agregarSidebarCss(html);
    html = quitarSidebarScriptsViejos(html);
    html = agregarScripts(html, pagina);

    fs.writeFileSync(archivoPath, html, 'utf8');

    console.log(`Actualizado: ${pagina.archivo}`);
});

console.log('Menú lateral aplicado correctamente en todas las páginas.');