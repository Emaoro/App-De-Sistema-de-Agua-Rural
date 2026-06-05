const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const db = require('../config/db');
const pool = db.pool || db;

// =====================================================
// UTILIDADES GENERALES
// =====================================================

async function obtenerColumnas(tabla) {
    try {
        const resultado = await pool.query(
            `
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            ORDER BY ordinal_position
            `,
            [tabla]
        );

        return resultado.rows;
    } catch (error) {
        console.error(`Error obteniendo columnas de ${tabla}:`, error.message);
        return [];
    }
}

function nombresColumnas(columnasInfo) {
    return columnasInfo.map(col => col.column_name);
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
        console.error('Consulta segura falló:', error.message);
        return [];
    }
}

function formatearFechaSQL(fecha) {
    if (!fecha) return new Date();

    const nuevaFecha = new Date(fecha);

    if (isNaN(nuevaFecha.getTime())) {
        return new Date();
    }

    return nuevaFecha;
}

// =====================================================
// RUTA DE PRUEBA
// =====================================================

router.get('/test', (req, res) => {
    res.json({
        mensaje: 'Ruta usuario invitado funcionando correctamente'
    });
});

// =====================================================
// LOGIN DE USUARIO INVITADO
// =====================================================

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
            mensaje: 'Error interno al validar usuario',
            detalle: error.message
        });
    }
});

// =====================================================
// DASHBOARD DEL USUARIO
// =====================================================

router.get('/dashboard', async (req, res) => {
    try {
        const correo = req.query.correo;

        if (!correo || correo.trim() === '') {
            return res.status(400).json({
                mensaje: 'Correo requerido'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        // =====================================================
        // FAMILIA DEL USUARIO
        // =====================================================

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

        // =====================================================
        // SECTOR
        // =====================================================

        const columnasSectoresInfo = await obtenerColumnas('sectores');
        const columnasSectores = nombresColumnas(columnasSectoresInfo);

        let sector = null;

        if (columnasSectores.length > 0) {
            const columnaNombreSector = buscarColumna(columnasSectores, [
                'nombre',
                'nombre_sector',
                'sector'
            ]);

            if (columnaNombreSector) {
                const resultadoSector = await consultaSegura(
                    `
                    SELECT *
                    FROM sectores
                    WHERE LOWER(${columnaNombreSector}::text) = LOWER($1)
                    LIMIT 1
                    `,
                    [sectorUsuario]
                );

                sector = resultadoSector.length > 0 ? resultadoSector[0] : null;
            }
        }

        // =====================================================
        // DISTRIBUCIONES POR SECTOR
        // =====================================================

        const columnasDistribucionesInfo = await obtenerColumnas('distribuciones');
        const columnasDistribuciones = nombresColumnas(columnasDistribucionesInfo);

        let distribuciones = [];

        if (columnasDistribuciones.length > 0) {
            const columnaSector = buscarColumna(columnasDistribuciones, [
                'sector',
                'nombre_sector'
            ]);

            const columnaOrden = buscarColumna(columnasDistribuciones, [
                'fecha',
                'fecha_distribucion',
                'fecha_inicio',
                'created_at',
                'id'
            ]);

            let where = '';
            const params = [];

            if (columnaSector) {
                params.push(sectorUsuario);
                where = `WHERE LOWER(${columnaSector}::text) = LOWER($1)`;
            }

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

        // =====================================================
        // INCIDENCIAS POR SECTOR / USUARIO / CORREO
        // =====================================================

        const columnasIncidenciasInfo = await obtenerColumnas('incidencias');
        const columnasIncidencias = nombresColumnas(columnasIncidenciasInfo);

        let incidencias = [];

        if (columnasIncidencias.length > 0) {
            const condiciones = [];
            const params = [];

            if (columnasIncidencias.includes('sector')) {
                params.push(sectorUsuario);
                condiciones.push(`LOWER(sector::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('nombre_sector')) {
                params.push(sectorUsuario);
                condiciones.push(`LOWER(nombre_sector::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('reportado_por')) {
                params.push(nombreUsuario);
                condiciones.push(`LOWER(reportado_por::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('nombre_reportante')) {
                params.push(nombreUsuario);
                condiciones.push(`LOWER(nombre_reportante::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('correo')) {
                params.push(correoNormalizado);
                condiciones.push(`LOWER(correo::text) = LOWER($${params.length})`);
            }

            if (columnasIncidencias.includes('correo_reportante')) {
                params.push(correoNormalizado);
                condiciones.push(`LOWER(correo_reportante::text) = LOWER($${params.length})`);
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

        // =====================================================
        // LECTURA DE TANQUE
        // =====================================================

        const columnasTanquesInfo = await obtenerColumnas('lecturas_tanques');
        const columnasTanques = nombresColumnas(columnasTanquesInfo);

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

        // =====================================================
        // RESUMEN DE REPORTES
        // =====================================================

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
            mensaje: 'Error interno al cargar dashboard de usuario',
            detalle: error.message
        });
    }
});

// =====================================================
// REGISTRAR INCIDENCIA DESDE USUARIO
// =====================================================
// Esta ruta se adapta a tu tabla real de incidencias.
// También evita fallos por columnas obligatorias.

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

        const columnasInfo = await obtenerColumnas('incidencias');

        if (columnasInfo.length === 0) {
            return res.status(500).json({
                mensaje: 'No se encontró la tabla incidencias'
            });
        }

        const columnas = nombresColumnas(columnasInfo);

        const campos = [];
        const valores = [];
        const params = [];

        function agregarSiExiste(nombreColumna, valor) {
            if (columnas.includes(nombreColumna)) {
                campos.push(nombreColumna);
                params.push(valor);
                valores.push(`$${params.length}`);
            }
        }

        // =====================================================
        // DATOS PRINCIPALES
        // =====================================================

        agregarSiExiste('tipo', tipo || 'Incidencia');
        agregarSiExiste('tipo_incidencia', tipo || 'Incidencia');
        agregarSiExiste('categoria', tipo || 'Incidencia');

        agregarSiExiste('descripcion', descripcion);
        agregarSiExiste('detalle', descripcion);
        agregarSiExiste('observaciones', descripcion);
        agregarSiExiste('comentario', descripcion);

        agregarSiExiste('sector', sector || 'Sin sector');
        agregarSiExiste('nombre_sector', sector || 'Sin sector');

        agregarSiExiste('estado', estado || 'Pendiente');

        agregarSiExiste('reportado_por', reportado_por || 'Usuario');
        agregarSiExiste('nombre_reportante', reportado_por || 'Usuario');
        agregarSiExiste('usuario_reporta', reportado_por || 'Usuario');

        agregarSiExiste('correo', correo || '');
        agregarSiExiste('correo_reportante', correo || '');

        // =====================================================
        // FECHAS
        // =====================================================

        const fechaFinal = formatearFechaSQL(fecha_reporte);

        agregarSiExiste('fecha_reporte', fechaFinal);
        agregarSiExiste('fecha_registro', fechaFinal);
        agregarSiExiste('fecha', fechaFinal);
        agregarSiExiste('created_at', fechaFinal);

        // =====================================================
        // CAMPOS OPCIONALES
        // =====================================================

        agregarSiExiste('prioridad', 'Media');
        agregarSiExiste('nivel_prioridad', 'Media');
        agregarSiExiste('origen', 'Usuario');
        agregarSiExiste('canal', 'Panel de usuario');

        // =====================================================
        // RELLENAR COLUMNAS NOT NULL SIN DEFAULT
        // =====================================================

        columnasInfo.forEach((columna) => {
            const nombre = columna.column_name;
            const tipoDato = columna.data_type || '';
            const esObligatoria = columna.is_nullable === 'NO';
            const tieneDefault = columna.column_default !== null;

            if (!esObligatoria || tieneDefault) return;
            if (campos.includes(nombre)) return;

            // No rellenar posibles IDs autogenerados
            if (
                nombre === 'id' ||
                nombre === 'id_incidencia' ||
                nombre === 'incidencia_id' ||
                nombre.endsWith('_id')
            ) {
                return;
            }

            let valorDefecto = 'N/A';

            if (
                tipoDato.includes('integer') ||
                tipoDato.includes('numeric') ||
                tipoDato.includes('double') ||
                tipoDato.includes('real')
            ) {
                valorDefecto = 0;
            }

            if (
                tipoDato.includes('date') ||
                tipoDato.includes('timestamp')
            ) {
                valorDefecto = new Date();
            }

            if (tipoDato.includes('boolean')) {
                valorDefecto = false;
            }

            campos.push(nombre);
            params.push(valorDefecto);
            valores.push(`$${params.length}`);
        });

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

        console.log('==============================');
        console.log('REGISTRANDO INCIDENCIA DESDE USUARIO');
        console.log('Campos:', campos);
        console.log('Valores:', params);
        console.log('SQL:', sql);
        console.log('==============================');

        const resultado = await pool.query(sql, params);

        return res.status(201).json({
            mensaje: 'Incidencia registrada correctamente',
            incidencia: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error registrando incidencia desde usuario:', error);

        return res.status(500).json({
            mensaje: 'Error interno al registrar incidencia',
            detalle: error.message
        });
    }
});

module.exports = router;
