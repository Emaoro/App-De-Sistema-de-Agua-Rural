const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const db = require('../config/db');
const pool = db.pool || db;

// ===============================
// UTILIDADES
// ===============================

async function obtenerColumnas(tabla) {
    try {
        const resultado = await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            `,
            [tabla]
        );

        return resultado.rows.map(row => row.column_name);
    } catch (error) {
        console.error(`Error obteniendo columnas de ${tabla}:`, error.message);
        return [];
    }
}

function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
}

function buscarColumna(columnas, posibles) {
    return posibles.find(columna => columnas.includes(columna)) || null;
}

async function consultaSegura(sql, params = []) {
    try {
        const resultado = await pool.query(sql, params);
        return resultado.rows;
    } catch (error) {
        console.error('Consulta falló:', error.message);
        return [];
    }
}

function agregarCampoInsert(columnas, campos, valores, params, nombreColumna, valor) {
    if (columnas.includes(nombreColumna)) {
        campos.push(nombreColumna);
        params.push(valor);
        valores.push(`$${params.length}`);
    }
}

// ===============================
// RUTA DE PRUEBA
// ===============================

router.get('/test', (req, res) => {
    res.json({
        mensaje: 'Ruta usuario invitado funcionando correctamente'
    });
});

// ===============================
// LOGIN USUARIO POR CORREO
// ===============================

router.post('/login', async (req, res) => {
    try {
        const { correo } = req.body;

        if (!correo || correo.trim() === '') {
            return res.status(400).json({
                mensaje: 'Ingrese su correo electrónico'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        const resultado = await pool.query(
            `
            SELECT 
                id,
                nombre_jefe,
                dpi,
                telefono,
                correo,
                direccion,
                sector,
                estado,
                fecha_registro
            FROM familias
            WHERE LOWER(correo) = $1
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        const familia = resultado.rows[0];

        const estado = normalizar(familia.estado);

        if (estado !== 'activa' && estado !== 'activo') {
            return res.status(403).json({
                mensaje: 'El usuario se encuentra inactivo o suspendido'
            });
        }

        const token = jwt.sign(
            {
                id: familia.id,
                nombre: familia.nombre_jefe,
                correo: familia.correo,
                sector: familia.sector,
                rol: 'invitado'
            },
            process.env.JWT_SECRET || 'controlagua2026',
            {
                expiresIn: '2h'
            }
        );

        return res.json({
            mensaje: 'Bienvenido como usuario invitado',
            token,
            id: familia.id,
            usuario: familia.nombre_jefe,
            nombre: familia.nombre_jefe,
            dpi: familia.dpi,
            telefono: familia.telefono,
            correo: familia.correo,
            direccion: familia.direccion,
            sector: familia.sector,
            estado: familia.estado,
            fecha_registro: familia.fecha_registro,
            rol: 'invitado'
        });

    } catch (error) {
        console.error('Error en login de usuario invitado:', error);

        return res.status(500).json({
            mensaje: 'Error interno al validar usuario'
        });
    }
});

// ===============================
// DASHBOARD DEL USUARIO
// ===============================
// Este endpoint conecta usuario con lo que administra el administrador.
// Usa el correo para buscar su familia y luego filtra por sector.

router.get('/dashboard', async (req, res) => {
    try {
        const correo = req.query.correo;

        if (!correo || correo.trim() === '') {
            return res.status(400).json({
                mensaje: 'Correo requerido'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        // ===============================
        // 1. FAMILIA DEL USUARIO
        // ===============================

        const resultadoFamilia = await pool.query(
            `
            SELECT 
                id,
                nombre_jefe,
                dpi,
                telefono,
                correo,
                direccion,
                sector,
                estado,
                fecha_registro
            FROM familias
            WHERE LOWER(correo) = $1
            LIMIT 1
            `,
            [correoNormalizado]
        );

        if (resultadoFamilia.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Familia no encontrada'
            });
        }

        const familia = resultadoFamilia.rows[0];
        const sectorUsuario = familia.sector || '';
        const nombreUsuario = familia.nombre_jefe || '';

        // ===============================
        // 2. DATOS DEL SECTOR
        // ===============================

        const columnasSectores = await obtenerColumnas('sectores');
        let sector = null;

        if (columnasSectores.length > 0) {
            const columnaNombre = buscarColumna(columnasSectores, [
                'nombre',
                'nombre_sector',
                'sector'
            ]);

            if (columnaNombre) {
                const resultadoSector = await consultaSegura(
                    `
                    SELECT *
                    FROM sectores
                    WHERE LOWER(${columnaNombre}::text) = LOWER($1)
                    LIMIT 1
                    `,
                    [sectorUsuario]
                );

                sector = resultadoSector.length > 0 ? resultadoSector[0] : null;
            }
        }

        // ===============================
        // 3. DISTRIBUCIONES DEL SECTOR
        // ===============================

        const columnasDistribuciones = await obtenerColumnas('distribuciones');
        let distribuciones = [];

        if (columnasDistribuciones.length > 0) {
            const params = [];
            let where = '';

            const columnaSector = buscarColumna(columnasDistribuciones, [
                'sector',
                'nombre_sector'
            ]);

            if (columnaSector) {
                params.push(sectorUsuario);
                where = `WHERE LOWER(${columnaSector}::text) = LOWER($1)`;
            }

            const columnaOrden = buscarColumna(columnasDistribuciones, [
                'fecha',
                'fecha_distribucion',
                'fecha_inicio',
                'created_at',
                'id'
            ]);

            const order = columnaOrden
                ? `ORDER BY ${columnaOrden} DESC`
                : '';

            distribuciones = await consultaSegura(
                `
                SELECT *
                FROM distribuciones
                ${where}
                ${order}
                LIMIT 30
                `,
                params
            );
        }

        // ===============================
        // 4. INCIDENCIAS DEL USUARIO O SECTOR
        // ===============================

        const columnasIncidencias = await obtenerColumnas('incidencias');
        let incidencias = [];

        if (columnasIncidencias.length > 0) {
            const condiciones = [];
            const params = [];

            if (columnasIncidencias.includes('sector')) {
                params.push(sectorUsuario);
                condiciones.push(`LOWER(sector::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('reportado_por')) {
                params.push(nombreUsuario);
                condiciones.push(`LOWER(reportado_por::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('correo')) {
                params.push(correoNormalizado);
                condiciones.push(`LOWER(correo::text) = LOWER($${params.length})`);
            }

            const where = condiciones.length > 0
                ? `WHERE ${condiciones.join(' OR ')}`
                : '';

            const columnaOrden = buscarColumna(columnasIncidencias, [
                'fecha_reporte',
                'fecha_registro',
                'fecha',
                'created_at',
                'id'
            ]);

            const order = columnaOrden
                ? `ORDER BY ${columnaOrden} DESC`
                : '';

            incidencias = await consultaSegura(
                `
                SELECT *
                FROM incidencias
                ${where}
                ${order}
                LIMIT 30
                `,
                params
            );
        }

        // ===============================
        // 5. ÚLTIMA LECTURA DEL TANQUE
        // ===============================

        const columnasTanques = await obtenerColumnas('lecturas_tanques');
        let tanque = null;

        if (columnasTanques.length > 0) {
            const columnaOrden = buscarColumna(columnasTanques, [
                'fecha_lectura',
                'fecha_registro',
                'fecha',
                'created_at',
                'id'
            ]);

            const order = columnaOrden
                ? `ORDER BY ${columnaOrden} DESC`
                : '';

            const resultadoTanque = await consultaSegura(
                `
                SELECT *
                FROM lecturas_tanques
                ${order}
                LIMIT 1
                `
            );

            tanque = resultadoTanque.length > 0 ? resultadoTanque[0] : null;
        }

        // ===============================
        // 6. RESUMEN DE REPORTES
        // ===============================

        const totalReportes = incidencias.length;

        const pendientes = incidencias.filter(item => {
            const estado = normalizar(item.estado);
            return estado.includes('pendiente') ||
                   estado.includes('revision') ||
                   estado.includes('revisión');
        }).length;

        const resueltos = incidencias.filter(item => {
            const estado = normalizar(item.estado);
            return estado.includes('resuelto') ||
                   estado.includes('completado') ||
                   estado.includes('finalizado');
        }).length;

        return res.json({
            mensaje: 'Dashboard de usuario cargado correctamente',
            familia,
            sector,
            distribuciones,
            incidencias,
            tanque,
            resumen_reportes: {
                total: totalReportes,
                pendientes,
                resueltos
            }
        });

    } catch (error) {
        console.error('Error cargando dashboard usuario:', error);

        return res.status(500).json({
            mensaje: 'Error interno al cargar dashboard de usuario'
        });
    }
});

// ===============================
// REGISTRAR INCIDENCIA DESDE USUARIO
// ===============================
// Esta ruta intenta adaptarse a las columnas reales de tu tabla incidencias.

router.post('/incidencias', async (req, res) => {
    try {
        const {
            tipo,
            descripcion,
            sector,
            estado,
            reportado_por,
            correo,
            fecha_reporte
        } = req.body;

        if (!descripcion || descripcion.trim() === '') {
            return res.status(400).json({
                mensaje: 'Ingrese una descripción de la incidencia'
            });
        }

        const columnas = await obtenerColumnas('incidencias');

        if (columnas.length === 0) {
            return res.status(500).json({
                mensaje: 'No se pudo leer la estructura de la tabla incidencias'
            });
        }

        const campos = [];
        const valores = [];
        const params = [];

        agregarCampoInsert(columnas, campos, valores, params, 'tipo', tipo || 'Incidencia');
        agregarCampoInsert(columnas, campos, valores, params, 'tipo_incidencia', tipo || 'Incidencia');
        agregarCampoInsert(columnas, campos, valores, params, 'descripcion', descripcion);
        agregarCampoInsert(columnas, campos, valores, params, 'detalle', descripcion);
        agregarCampoInsert(columnas, campos, valores, params, 'observaciones', descripcion);
        agregarCampoInsert(columnas, campos, valores, params, 'sector', sector || '');
        agregarCampoInsert(columnas, campos, valores, params, 'estado', estado || 'Pendiente');
        agregarCampoInsert(columnas, campos, valores, params, 'reportado_por', reportado_por || 'Usuario');
        agregarCampoInsert(columnas, campos, valores, params, 'correo', correo || '');

        if (columnas.includes('fecha_reporte')) {
            campos.push('fecha_reporte');
            params.push(fecha_reporte || new Date());
            valores.push(`$${params.length}`);
        }

        if (columnas.includes('fecha_registro')) {
            campos.push('fecha_registro');
            params.push(new Date());
            valores.push(`$${params.length}`);
        }

        if (columnas.includes('created_at')) {
            campos.push('created_at');
            params.push(new Date());
            valores.push(`$${params.length}`);
        }

        if (campos.length === 0) {
            return res.status(500).json({
                mensaje: 'No hay columnas compatibles para registrar la incidencia'
            });
        }

        const sql = `
            INSERT INTO incidencias (${campos.join(', ')})
            VALUES (${valores.join(', ')})
            RETURNING *
        `;

        const resultado = await pool.query(sql, params);

        return res.status(201).json({
            mensaje: 'Incidencia registrada correctamente',
            incidencia: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error registrando incidencia de usuario:', error);

        return res.status(500).json({
            mensaje: 'Error interno al registrar incidencia'
        });
    }
});

module.exports = router;
