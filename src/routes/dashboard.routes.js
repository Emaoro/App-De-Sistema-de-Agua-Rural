const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// DASHBOARD PRINCIPAL
// GET /api/dashboard
// ======================================

router.get('/', async (req, res) => {
    try {
        // ===============================
        // FAMILIAS
        // ===============================

        const familias = await pool.query(`
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE LOWER(estado) = 'activa') AS activas
            FROM familias
        `);

        // ===============================
        // INCIDENCIAS
        // ===============================

        const incidencias = await pool.query(`
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE LOWER(estado) = 'pendiente') AS pendientes,
                COUNT(*) FILTER (WHERE LOWER(estado) = 'en proceso') AS en_proceso,
                COUNT(*) FILTER (WHERE LOWER(estado) = 'resuelta') AS resueltas
            FROM incidencias
        `);

        // ===============================
        // TANQUE - ÚLTIMA LECTURA
        // ===============================

        const ultimaLecturaTanque = await pool.query(`
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

        // ===============================
        // DISTRIBUCIÓN
        // ===============================

        const distribucion = await pool.query(`
            SELECT 
                COALESCE(SUM(litros), 0) AS total_litros,
                COALESCE(SUM(familias_atendidas), 0) AS familias_atendidas,
                COUNT(*) AS total_distribuciones
            FROM distribuciones
        `);

        // ===============================
        // CONSUMO SEMANAL
        // ===============================

        const consumoSemanal = await pool.query(`
            SELECT 
                TO_CHAR(fecha, 'Dy') AS dia,
                EXTRACT(DOW FROM fecha) AS orden_dia,
                COALESCE(SUM(litros), 0) AS litros
            FROM distribuciones
            WHERE fecha >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY TO_CHAR(fecha, 'Dy'), EXTRACT(DOW FROM fecha)
            ORDER BY EXTRACT(DOW FROM fecha)
        `);

        // ===============================
        // ALERTAS RECIENTES
        // ===============================

        const alertas = await pool.query(`
            SELECT 
                id,
                codigo,
                tipo,
                sector,
                prioridad,
                estado,
                fecha
            FROM incidencias
            ORDER BY fecha DESC, id DESC
            LIMIT 3
        `);

        // ===============================
        // CÁLCULOS
        // ===============================

        const totalFamilias = Number(familias.rows[0].total || 0);
        const familiasActivas = Number(familias.rows[0].activas || 0);

        const litrosTotales = Number(distribucion.rows[0].total_litros || 0);
        const familiasAtendidas = Number(distribucion.rows[0].familias_atendidas || 0);
        const totalDistribuciones = Number(distribucion.rows[0].total_distribuciones || 0);

        let eficiencia = 0;

        if (totalFamilias > 0) {
            eficiencia = Math.min((familiasAtendidas / totalFamilias) * 100, 100);
        }

        let flujoPromedio = 0;

        if (totalDistribuciones > 0) {
            flujoPromedio = litrosTotales / totalDistribuciones;
        }

        // ===============================
        // RESPUESTA
        // ===============================

        return res.json({
            familias: {
                total: totalFamilias,
                activas: familiasActivas
            },

            incidencias: {
                total: Number(incidencias.rows[0].total || 0),
                pendientes: Number(incidencias.rows[0].pendientes || 0),
                en_proceso: Number(incidencias.rows[0].en_proceso || 0),
                resueltas: Number(incidencias.rows[0].resueltas || 0)
            },

            tanque: ultimaLecturaTanque.rows[0] || {
                nivel_porcentaje: 0,
                volumen_litros: 0,
                capacidad_litros: 0,
                estado_monitoreo: 'Sin lectura',
                fecha: null
            },

            distribucion: {
                total_litros: litrosTotales,
                familias_atendidas: familiasAtendidas,
                total_distribuciones: totalDistribuciones,
                flujo_promedio: flujoPromedio,
                eficiencia: eficiencia
            },

            consumo_semanal: consumoSemanal.rows.map((item) => ({
                dia: item.dia,
                litros: Number(item.litros || 0)
            })),

            alertas: alertas.rows,

            sectores: {
                total: 6,
                activos: 6,
                mantenimiento: 0,
                inactivos: 0
            }
        });

    } catch (error) {
        console.error('Error al cargar dashboard:', error);

        return res.status(500).json({
            mensaje: 'Error al cargar dashboard',
            error: error.message
        });
    }
});

module.exports = router;