const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// REPORTE GENERAL
// GET /api/reportes/general
// ======================================

router.get('/general', async (req, res) => {
    try {
        const familias = await pool.query(`
            SELECT COUNT(*) AS total
            FROM familias
        `);

        const familiasActivas = await pool.query(`
            SELECT COUNT(*) AS total
            FROM familias
            WHERE LOWER(estado) = 'activa'
        `);

        const incidencias = await pool.query(`
            SELECT COUNT(*) AS total
            FROM incidencias
        `);

        const incidenciasPendientes = await pool.query(`
            SELECT COUNT(*) AS total
            FROM incidencias
            WHERE LOWER(estado) = 'pendiente'
        `);

        const tanques = await pool.query(`
            SELECT COUNT(*) AS total_lecturas
            FROM lecturas_tanques
        `);

        const ultimaLectura = await pool.query(`
            SELECT
                id,
                tanque,
                nivel_porcentaje,
                capacidad_litros,
                volumen_litros,
                estado_monitoreo,
                fecha
            FROM lecturas_tanques
            ORDER BY fecha DESC, id DESC
            LIMIT 1
        `);

        const distribucion = await pool.query(`
            SELECT
                COUNT(*) AS total_distribuciones,
                COALESCE(SUM(litros), 0) AS total_litros,
                COALESCE(SUM(familias_atendidas), 0) AS total_familias_atendidas
            FROM distribuciones
        `);

        return res.json({
            familias: {
                total: Number(familias.rows[0].total),
                activas: Number(familiasActivas.rows[0].total)
            },
            incidencias: {
                total: Number(incidencias.rows[0].total),
                pendientes: Number(incidenciasPendientes.rows[0].total)
            },
            tanques: {
                total_lecturas: Number(tanques.rows[0].total_lecturas),
                ultima_lectura: ultimaLectura.rows[0] || null
            },
            distribucion: {
                total_distribuciones: Number(distribucion.rows[0].total_distribuciones),
                total_litros: Number(distribucion.rows[0].total_litros),
                total_familias_atendidas: Number(distribucion.rows[0].total_familias_atendidas)
            },
            sectores: {
                total: 6,
                lista: [
                    'Sector A',
                    'Sector B',
                    'Sector C',
                    'Sector D',
                    'Sector E',
                    'Sector F'
                ]
            }
        });

    } catch (error) {
        console.error('Error al generar reporte general:', error);

        return res.status(500).json({
            mensaje: 'Error al generar reporte general',
            error: error.message
        });
    }
});

// ======================================
// REPORTE DE FAMILIAS
// GET /api/reportes/familias
// ======================================

router.get('/familias', async (req, res) => {
    try {
        const resultado = await pool.query(`
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
            ORDER BY id DESC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error('Error al generar reporte de familias:', error);

        return res.status(500).json({
            mensaje: 'Error al generar reporte de familias',
            error: error.message
        });
    }
});

// ======================================
// REPORTE DE INCIDENCIAS
// GET /api/reportes/incidencias
// ======================================

router.get('/incidencias', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                codigo,
                responsable,
                sector,
                tipo,
                prioridad,
                descripcion,
                fecha,
                estado,
                fecha_creacion
            FROM incidencias
            ORDER BY fecha DESC, id DESC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error('Error al generar reporte de incidencias:', error);

        return res.status(500).json({
            mensaje: 'Error al generar reporte de incidencias',
            error: error.message
        });
    }
});

// ======================================
// REPORTE DE TANQUES
// GET /api/reportes/tanques
// ======================================

router.get('/tanques', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                tanque,
                sensor,
                nivel_porcentaje,
                capacidad_litros,
                volumen_litros,
                estado_monitoreo,
                observaciones,
                fecha
            FROM lecturas_tanques
            ORDER BY fecha DESC, id DESC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error('Error al generar reporte de tanques:', error);

        return res.status(500).json({
            mensaje: 'Error al generar reporte de tanques',
            error: error.message
        });
    }
});

// ======================================
// REPORTE DE DISTRIBUCIÓN
// GET /api/reportes/distribucion
// ======================================

router.get('/distribucion', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                sectores,
                litros,
                familias_atendidas,
                responsable,
                fecha,
                estado,
                observaciones,
                fecha_creacion
            FROM distribuciones
            ORDER BY fecha DESC, id DESC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error('Error al generar reporte de distribución:', error);

        return res.status(500).json({
            mensaje: 'Error al generar reporte de distribución',
            error: error.message
        });
    }
});

// ======================================
// OBTENER REPORTES GENERADOS
// GET /api/reportes/generados
// ======================================

router.get('/generados', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                nombre,
                tipo,
                periodo,
                generado_por,
                tamano,
                estado,
                datos,
                fecha_generacion
            FROM reportes_generados
            ORDER BY fecha_generacion DESC, id DESC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error('Error al obtener reportes generados:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener reportes generados',
            error: error.message
        });
    }
});

// ======================================
// GUARDAR REPORTE GENERADO
// POST /api/reportes/generar
// ======================================

router.post('/generar', async (req, res) => {
    try {
        const {
            nombre,
            tipo,
            periodo,
            generado_por,
            tamano,
            datos
        } = req.body;

        if (!nombre || !tipo || !datos) {
            return res.status(400).json({
                mensaje: 'Nombre, tipo y datos del reporte son obligatorios'
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO reportes_generados
            (
                nombre,
                tipo,
                periodo,
                generado_por,
                tamano,
                estado,
                datos
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                nombre,
                tipo,
                periodo,
                generado_por,
                tamano,
                estado,
                datos,
                fecha_generacion
            `,
            [
                nombre,
                tipo,
                periodo || null,
                generado_por || 'admin',
                tamano || '0 KB',
                'Completado',
                datos
            ]
        );

        return res.status(201).json({
            mensaje: 'Reporte generado correctamente',
            reporte: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al guardar reporte generado:', error);

        return res.status(500).json({
            mensaje: 'Error al guardar reporte generado',
            error: error.message
        });
    }
});

// ======================================
// ELIMINAR REPORTE GENERADO
// DELETE /api/reportes/generados/:id
// ======================================

router.delete('/generados/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM reportes_generados WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Reporte no encontrado'
            });
        }

        return res.json({
            mensaje: 'Reporte eliminado correctamente',
            reporte: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar reporte:', error);

        return res.status(500).json({
            mensaje: 'Error al eliminar reporte',
            error: error.message
        });
    }
});

module.exports = router;