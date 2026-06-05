const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// OBTENER LECTURAS DEL TANQUE
// GET /api/tanques
// ======================================
router.get('/', async (req, res) => {
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
        console.error('Error al obtener lecturas del tanque:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener lecturas del tanque',
            error: error.message
        });
    }
});

// ======================================
// REGISTRAR LECTURA DEL TANQUE
// POST /api/tanques
// ======================================
router.post('/', async (req, res) => {
    try {
        const {
            tanque,
            sensor,
            nivel_porcentaje,
            capacidad_litros,
            estado_monitoreo,
            observaciones,
            fecha
        } = req.body;

        if (!tanque || nivel_porcentaje === undefined || !capacidad_litros) {
            return res.status(400).json({
                mensaje: 'Tanque, nivel y capacidad son obligatorios'
            });
        }

        const nivel = Number(nivel_porcentaje);
        const capacidad = Number(capacidad_litros);

        if (Number.isNaN(nivel) || nivel < 0 || nivel > 100) {
            return res.status(400).json({
                mensaje: 'El nivel debe estar entre 0 y 100'
            });
        }

        if (Number.isNaN(capacidad) || capacidad <= 0) {
            return res.status(400).json({
                mensaje: 'La capacidad debe ser mayor a 0'
            });
        }

        const volumen_litros = (nivel / 100) * capacidad;

        const resultado = await pool.query(
            `
            INSERT INTO lecturas_tanques
            (
                tanque,
                sensor,
                nivel_porcentaje,
                capacidad_litros,
                volumen_litros,
                estado_monitoreo,
                observaciones,
                fecha
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                tanque.trim(),
                sensor || 'Medición manual',
                nivel,
                capacidad,
                volumen_litros,
                estado_monitoreo || obtenerEstadoNivel(nivel),
                observaciones || null,
                fecha || new Date()
            ]
        );

        return res.status(201).json({
            mensaje: 'Lectura registrada correctamente',
            lectura: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar lectura del tanque:', error);

        return res.status(500).json({
            mensaje: 'Error al registrar lectura del tanque',
            error: error.message
        });
    }
});

// ======================================
// ELIMINAR LECTURA
// DELETE /api/tanques/:id
// ======================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM lecturas_tanques WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Lectura no encontrada'
            });
        }

        return res.json({
            mensaje: 'Lectura eliminada correctamente',
            lectura: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar lectura:', error);

        return res.status(500).json({
            mensaje: 'Error al eliminar lectura',
            error: error.message
        });
    }
});

// ======================================
// FUNCIÓN AUXILIAR
// ======================================
function obtenerEstadoNivel(nivel) {
    const valor = Number(nivel);

    if (valor <= 25) {
        return 'Nivel crítico';
    }

    if (valor <= 50) {
        return 'Nivel bajo';
    }

    if (valor <= 80) {
        return 'Nivel normal';
    }

    return 'Nivel alto';
}

module.exports = router;