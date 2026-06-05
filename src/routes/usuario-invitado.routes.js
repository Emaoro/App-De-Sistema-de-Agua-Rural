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

function buscarColumna(columnas, posibles) {
    return posibles.find(col => columnas.includes(col)) || null;
}

async function consultaSegura(sql, params = []) {
    try {
        const resultado = await pool.query(sql, params);
        return resultado.rows;
    } catch (error) {
        console.error('Consulta segura falló:', error.message);
        return [];
    }
}

function normalizarTexto(valor) {
    return String(valor || '').trim().toLowerCase();
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
// LOGIN DE USUARIO INVITADO
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

        const consulta = `
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
        `;

        const resultado = await pool.query(consulta, [correoNormalizado]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        const familia = resultado.rows[0];
        const estado = normalizarTexto(familia.estado);

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
// Este endpoint trae datos reales desde Neon.
// Usa el correo para ubicar la familia y luego consulta
// incidencias, distribuciones y lecturas relacionadas.

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
        // 1. FAMILIA
        // ===============================

        const familiaResultado = await pool.query(
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

        if (familiaResultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Familia no encontrada'
            });
        }

        const familia = familiaResultado.rows[0];
        const sector = familia.sector || '';
        const nombre = familia.nombre_jefe || '';

        // ===============================
        // 2. INCIDENCIAS DEL USUARIO / SECTOR
        // ===============================

        const columnasIncidencias = await obtenerColumnas('incidencias');
        let incidencias = [];

        if (columnasIncidencias.length > 0) {
            const condiciones = [];
            const params = [];

            if (columnasIncidencias.includes('sector')) {
                params.push(sector);
                condiciones.push(`LOWER(sector::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('reportado_por')) {
                params.push(nombre);
                condiciones.push(`LOWER(reportado_por::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('correo')) {
                params.push(correoNormalizado);
                condiciones.push(`LOWER(correo::text) = LOWER($${params.length})`);
            }

            const columnaOrden = buscarColumna(columnasIncidencias, [
                'fecha_reporte',
                'fecha_registro',
                'fecha',
                'created_at',
                'id'
            ]);

            const where = condiciones.length > 0
                ? `WHERE ${condiciones.join(' OR ')}`
                : '';

            const order = columnaOrden
                ? `ORDER BY ${columnaOrden} DESC`
                : '';

            incidencias = await consultaSegura(
                `
                SELECT *
                FROM incidencias
                ${where}
                ${order}
                LIMIT 20
                `,
                params
            );
        }

        // ===============================
        // 3. DISTRIBUCIONES DEL SECTOR
        // ===============================

        const columnasDistribuciones = await obtenerColumnas('distribuciones');
        let distribuciones = [];

        if (columnasDistribuciones.length > 0) {
            const params = [];
            let where = '';

            if (columnasDistribuciones.includes('sector')) {
                params.push(sector);
                where = `WHERE LOWER(sector::text) = LOWER($1)`;
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
                LIMIT 20
                `,
                params
            );
        }

        // ===============================
        // 4. ÚLTIMA LECTURA DEL TANQUE
        // ===============================

        const columnasTanques = await obtenerColumnas('lecturas_tanques');
        let tanque = null;

        if (columnasTanques.length > 0) {
            const columnaOrden = buscarColumna(columnasTanques, [
                'fecha_lectura',
                'fecha_registro',
                'created_at',
                'id'
            ]);

            const order = columnaOrden
                ? `ORDER BY ${columnaOrden} DESC`
                : '';

            const lecturas = await consultaSegura(
                `
                SELECT *
                FROM lecturas_tanques
                ${order}
                LIMIT 1
                `
            );

            tanque = lecturas.length > 0 ? lecturas[0] : null;
        }

        // ===============================
        // 5. CONTADORES DE REPORTES
        // ===============================

        const totalReportes = incidencias.length;

        const reportesPendientes = incidencias.filter(item => {
            const estado = normalizarTexto(item.estado);
            return estado.includes('pendiente') || estado.includes('revision') || estado.includes('revisión');
        }).length;

        const reportesResueltos = incidencias.filter(item => {
            const estado = normalizarTexto(item.estado);
            return estado.includes('resuelto') || estado.includes('completado') || estado.includes('finalizado');
        }).length;

        return res.json({
            mensaje: 'Dashboard de usuario cargado correctamente',
            familia,
            sector,
            tanque,
            distribuciones,
            incidencias,
            resumen_reportes: {
                total: totalReportes,
                pendientes: reportesPendientes,
                resueltos: reportesResueltos
            }
        });

    } catch (error) {
        console.error('Error cargando dashboard de usuario:', error);

        return res.status(500).json({
            mensaje: 'Error interno al cargar dashboard de usuario'
        });
    }
});

module.exports = router;
