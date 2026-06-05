const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// ======================================
// CONFIGURACIÓN POR DEFECTO
// ======================================

function configuracionDefault() {
    return {
        general: {
            nombre_comunidad: '',
            total_familias: 0,
            fuente_agua: '',
            modo_conectividad: '',
            alertas_nivel_critico: false,
            registro_incidencias: false,
            distribucion_sectores: true
        },

        notificaciones: {
            habilitar_notificaciones: false,
            correo: '',
            sms: '',
            notificaciones_sistema: false,
            evento_nivel_critico: false,
            evento_fugas: false,
            evento_distribucion: false,
            evento_mantenimiento: false,
            horario: 'Todos los días',
            desde: '06:00',
            hasta: '20:00'
        },

        tanques: {
            unidad_volumen: 'Litros (L)',
            capacidad_defecto: 0,
            nivel_critico: 20,
            nivel_optimo: 80,
            intervalo_lectura: '15 minutos'
        },

        distribucion: {
            dias: [],
            metodo: 'Por turnos',
            hora_inicio: '06:00',
            hora_fin: '17:00',
            orden: 'Alfabético (A - Z)',
            duracion_minima: 2,
            descanso: 15
        },

        seguridad: {
            tiempo_sesion: '30 minutos',
            verificacion_dos_pasos: false,
            bloquear_inactivos: false,
            contrasena_minima: 8,
            intentos_fallidos: 5,
            registro_actividad: false
        },

        usuarios: {
            roles: [
                {
                    nombre: 'Administrador',
                    descripcion: 'Acceso completo al sistema',
                    usuarios: 1
                },
                {
                    nombre: 'Operador',
                    descripcion: 'Gestiona distribuciones y tanques',
                    usuarios: 0
                },
                {
                    nombre: 'Supervisor',
                    descripcion: 'Visualiza reportes e incidencias',
                    usuarios: 0
                },
                {
                    nombre: 'Consulta',
                    descripcion: 'Solo puede visualizar información',
                    usuarios: 0
                }
            ]
        },

        respaldo: {
            frecuencia: 'Diario',
            hora: '02:00',
            retener: '30 días',
            destino: 'Almacenamiento local',
            cuenta: ''
        }
    };
}

// ======================================
// OBTENER CONFIGURACIÓN
// GET /api/configuracion
// ======================================

router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                general,
                notificaciones,
                tanques,
                distribucion,
                seguridad,
                usuarios,
                respaldo,
                fecha_actualizacion
            FROM configuraciones
            ORDER BY id DESC
            LIMIT 1
        `);

        const base = configuracionDefault();

        if (resultado.rows.length === 0) {
            return res.json({
                existe: false,
                configuracion: base
            });
        }

        const fila = resultado.rows[0];

        return res.json({
            existe: true,
            configuracion: {
                id: fila.id,

                general: {
                    ...base.general,
                    ...(fila.general || {})
                },

                notificaciones: {
                    ...base.notificaciones,
                    ...(fila.notificaciones || {})
                },

                tanques: {
                    ...base.tanques,
                    ...(fila.tanques || {})
                },

                distribucion: {
                    ...base.distribucion,
                    ...(fila.distribucion || {})
                },

                seguridad: {
                    ...base.seguridad,
                    ...(fila.seguridad || {})
                },

                usuarios: {
                    ...base.usuarios,
                    ...(fila.usuarios || {})
                },

                respaldo: {
                    ...base.respaldo,
                    ...(fila.respaldo || {})
                },

                fecha_actualizacion: fila.fecha_actualizacion
            }
        });

    } catch (error) {
        console.error('Error al obtener configuración:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener configuración',
            error: error.message
        });
    }
});

// ======================================
// GUARDAR CONFIGURACIÓN
// POST /api/configuracion
// ======================================

router.post('/', async (req, res) => {
    try {
        const {
            general,
            notificaciones,
            tanques,
            distribucion,
            seguridad,
            usuarios,
            respaldo
        } = req.body;

        const existente = await pool.query(`
            SELECT id
            FROM configuraciones
            ORDER BY id DESC
            LIMIT 1
        `);

        if (existente.rows.length === 0) {
            const resultado = await pool.query(
                `
                INSERT INTO configuraciones
                (
                    general,
                    notificaciones,
                    tanques,
                    distribucion,
                    seguridad,
                    usuarios,
                    respaldo,
                    fecha_actualizacion
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                RETURNING
                    id,
                    general,
                    notificaciones,
                    tanques,
                    distribucion,
                    seguridad,
                    usuarios,
                    respaldo,
                    fecha_actualizacion
                `,
                [
                    general || {},
                    notificaciones || {},
                    tanques || {},
                    distribucion || {},
                    seguridad || {},
                    usuarios || {},
                    respaldo || {}
                ]
            );

            return res.status(201).json({
                mensaje: 'Configuración guardada correctamente',
                configuracion: resultado.rows[0]
            });
        }

        const id = existente.rows[0].id;

        const resultado = await pool.query(
            `
            UPDATE configuraciones
            SET
                general = $1,
                notificaciones = $2,
                tanques = $3,
                distribucion = $4,
                seguridad = $5,
                usuarios = $6,
                respaldo = $7,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING
                id,
                general,
                notificaciones,
                tanques,
                distribucion,
                seguridad,
                usuarios,
                respaldo,
                fecha_actualizacion
            `,
            [
                general || {},
                notificaciones || {},
                tanques || {},
                distribucion || {},
                seguridad || {},
                usuarios || {},
                respaldo || {},
                id
            ]
        );

        return res.json({
            mensaje: 'Configuración actualizada correctamente',
            configuracion: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al guardar configuración:', error);

        return res.status(500).json({
            mensaje: 'Error al guardar configuración',
            error: error.message
        });
    }
});

module.exports = router;