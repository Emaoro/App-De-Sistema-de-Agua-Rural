const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// OBTENER TODAS LAS INCIDENCIAS
// GET /api/incidencias
// ======================================
router.get('/', async (req, res) => {
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
            ORDER BY id DESC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error('Error al obtener incidencias:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener incidencias'
        });
    }
});

// ======================================
// REGISTRAR INCIDENCIA
// POST /api/incidencias
// ======================================
router.post('/', async (req, res) => {
    try {
        const {
            responsable,
            sector,
            tipo,
            prioridad,
            descripcion,
            fecha,
            estado
        } = req.body;

        if (!responsable || !sector || !tipo || !descripcion) {
            return res.status(400).json({
                mensaje: 'Responsable, sector, tipo y descripción son obligatorios'
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO incidencias
            (
                responsable,
                sector,
                tipo,
                prioridad,
                descripcion,
                fecha,
                estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                responsable.trim(),
                sector,
                tipo,
                prioridad || 'Media',
                descripcion.trim(),
                fecha || new Date(),
                estado || 'Pendiente'
            ]
        );

        const incidencia = resultado.rows[0];

        const codigo = `INC-${String(incidencia.id).padStart(3, '0')}`;

        const actualizado = await pool.query(
            `
            UPDATE incidencias
            SET codigo = $1
            WHERE id = $2
            RETURNING *
            `,
            [codigo, incidencia.id]
        );

        return res.status(201).json({
            mensaje: 'Incidencia registrada correctamente',
            incidencia: actualizado.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar incidencia:', error);

        return res.status(500).json({
            mensaje: 'Error al registrar incidencia'
        });
    }
});

// ======================================
// ACTUALIZAR ESTADO DE INCIDENCIA
// PUT /api/incidencias/:id/estado
// ======================================
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({
                mensaje: 'El estado es obligatorio'
            });
        }

        const resultado = await pool.query(
            `
            UPDATE incidencias
            SET estado = $1
            WHERE id = $2
            RETURNING *
            `,
            [estado, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Incidencia no encontrada'
            });
        }

        return res.json({
            mensaje: 'Estado actualizado correctamente',
            incidencia: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar estado:', error);

        return res.status(500).json({
            mensaje: 'Error al actualizar estado'
        });
    }
});

// ======================================
// ELIMINAR INCIDENCIA
// DELETE /api/incidencias/:id
// ======================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM incidencias WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Incidencia no encontrada'
            });
        }

        return res.json({
            mensaje: 'Incidencia eliminada correctamente',
            incidencia: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar incidencia:', error);

        return res.status(500).json({
            mensaje: 'Error al eliminar incidencia'
        });
    }
});

module.exports = router;