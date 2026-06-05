const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// OBTENER TODAS LAS DISTRIBUCIONES
// Ruta: GET /api/distribucion
// ======================================

router.get('/', async (req, res) => {
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
        console.error('Error al obtener distribuciones:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener distribuciones',
            error: error.message
        });
    }
});

// ======================================
// REGISTRAR NUEVA DISTRIBUCIÓN
// Ruta: POST /api/distribucion
// ======================================

router.post('/', async (req, res) => {
    try {
        const {
            sectores,
            litros,
            familias_atendidas,
            responsable,
            fecha,
            estado,
            observaciones
        } = req.body;

        if (!sectores) {
            return res.status(400).json({
                mensaje: 'Debe seleccionar un sector'
            });
        }

        const litrosNumero = Number(litros);
        const familiasNumero = Number(familias_atendidas || 0);

        if (Number.isNaN(litrosNumero) || litrosNumero <= 0) {
            return res.status(400).json({
                mensaje: 'La cantidad de litros debe ser mayor a 0'
            });
        }

        if (Number.isNaN(familiasNumero) || familiasNumero < 0) {
            return res.status(400).json({
                mensaje: 'La cantidad de familias atendidas no es válida'
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO distribuciones
            (
                sectores,
                litros,
                familias_atendidas,
                responsable,
                fecha,
                estado,
                observaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                sectores,
                litros,
                familias_atendidas,
                responsable,
                fecha,
                estado,
                observaciones,
                fecha_creacion
            `,
            [
                sectores,
                litrosNumero,
                familiasNumero,
                responsable ? responsable.trim() : null,
                fecha || new Date(),
                estado || 'Programada',
                observaciones ? observaciones.trim() : null
            ]
        );

        return res.status(201).json({
            mensaje: 'Distribución registrada correctamente',
            distribucion: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar distribución:', error);

        return res.status(500).json({
            mensaje: 'Error al registrar distribución',
            error: error.message
        });
    }
});

// ======================================
// ELIMINAR DISTRIBUCIÓN
// Ruta: DELETE /api/distribucion/:id
// ======================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM distribuciones WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Distribución no encontrada'
            });
        }

        return res.json({
            mensaje: 'Distribución eliminada correctamente',
            distribucion: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar distribución:', error);

        return res.status(500).json({
            mensaje: 'Error al eliminar distribución',
            error: error.message
        });
    }
});

module.exports = router;