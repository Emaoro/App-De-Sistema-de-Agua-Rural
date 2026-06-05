const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// SECTORES FIJOS DEL SISTEMA
// No se guardan en base de datos.
// La aplicación los genera automáticamente.
// ======================================
const sectoresBase = [
    {
        id: 1,
        nombre: 'Sector A',
        zona: 'Zona A',
        horario: '06:00 - 09:00',
        responsable: 'Comité de agua',
        estado: 'Activo',
        observaciones: 'Sector de distribución A'
    },
    {
        id: 2,
        nombre: 'Sector B',
        zona: 'Zona B',
        horario: '09:00 - 12:00',
        responsable: 'Comité de agua',
        estado: 'Activo',
        observaciones: 'Sector de distribución B'
    },
    {
        id: 3,
        nombre: 'Sector C',
        zona: 'Zona C',
        horario: '12:00 - 15:00',
        responsable: 'Comité de agua',
        estado: 'Activo',
        observaciones: 'Sector de distribución C'
    },
    {
        id: 4,
        nombre: 'Sector D',
        zona: 'Zona D',
        horario: '15:00 - 18:00',
        responsable: 'Comité de agua',
        estado: 'Activo',
        observaciones: 'Sector de distribución D'
    },
    {
        id: 5,
        nombre: 'Sector E',
        zona: 'Zona E',
        horario: '18:00 - 21:00',
        responsable: 'Comité de agua',
        estado: 'Activo',
        observaciones: 'Sector de distribución E'
    },
    {
        id: 6,
        nombre: 'Sector F',
        zona: 'Zona F',
        horario: '21:00 - 00:00',
        responsable: 'Comité de agua',
        estado: 'Activo',
        observaciones: 'Sector de distribución F'
    }
];

// ======================================
// OBTENER SECTORES
// Ruta: GET /api/sectores
// ======================================
router.get('/', async (req, res) => {
    try {
        const familias = await pool.query(`
            SELECT 
                sector, 
                COUNT(*) AS total
            FROM familias
            GROUP BY sector
        `);

        const conteoFamilias = {};

        familias.rows.forEach((item) => {
            conteoFamilias[item.sector] = Number(item.total);
        });

        const sectores = sectoresBase.map((sector) => {
            return {
                ...sector,
                total_familias: conteoFamilias[sector.nombre] || 0
            };
        });

        return res.json(sectores);

    } catch (error) {
        console.error('Error al obtener sectores:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener sectores'
        });
    }
});

module.exports = router;