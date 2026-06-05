const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// OBTENER TODAS LAS FAMILIAS
// Ruta: GET /api/familias
// ======================================

router.get('/', async (req, res) => {

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

        console.error('Error al obtener familias:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener familias'
        });

    }

});

// ======================================
// REGISTRAR NUEVA FAMILIA
// Ruta: POST /api/familias
// ======================================

router.post('/', async (req, res) => {

    try {

        const {
            nombre_jefe,
            dpi,
            telefono,
            correo,
            direccion,
            sector,
            estado,
            fecha_registro
        } = req.body;

        if (!nombre_jefe || !dpi) {
            return res.status(400).json({
                mensaje: 'El nombre del jefe de familia y el DPI son obligatorios'
            });
        }

        const dpiExiste = await pool.query(
            'SELECT id FROM familias WHERE dpi = $1',
            [dpi.trim()]
        );

        if (dpiExiste.rows.length > 0) {
            return res.status(400).json({
                mensaje: 'Ya existe una familia registrada con ese DPI'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO familias
            (
                nombre_jefe,
                dpi,
                telefono,
                correo,
                direccion,
                sector,
                estado,
                fecha_registro
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                id,
                nombre_jefe,
                dpi,
                telefono,
                correo,
                direccion,
                sector,
                estado,
                fecha_registro`,
            [
                nombre_jefe.trim(),
                dpi.trim(),
                telefono ? telefono.trim() : null,
                correo ? correo.trim() : null,
                direccion ? direccion.trim() : null,
                sector || null,
                estado || 'Activa',
                fecha_registro || new Date()
            ]
        );

        return res.status(201).json({
            mensaje: 'Familia registrada correctamente',
            familia: resultado.rows[0]
        });

    } catch (error) {

        console.error('Error al registrar familia:', error);

        return res.status(500).json({
            mensaje: 'Error al registrar familia'
        });

    }

});

// ======================================
// ELIMINAR FAMILIA
// Ruta: DELETE /api/familias/:id
// ======================================

router.delete('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                mensaje: 'El ID de la familia es obligatorio'
            });
        }

        const resultado = await pool.query(
            'DELETE FROM familias WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Familia no encontrada'
            });
        }

        return res.json({
            mensaje: 'Familia eliminada correctamente',
            familia: resultado.rows[0]
        });

    } catch (error) {

        console.error('Error al eliminar familia:', error);

        return res.status(500).json({
            mensaje: 'Error al eliminar familia'
        });

    }

});

module.exports = router;