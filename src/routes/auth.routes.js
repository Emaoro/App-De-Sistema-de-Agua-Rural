const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ======================================
// PRUEBA DE RUTA AUTH
// GET /api/auth
// ======================================
router.get('/', (req, res) => {
    res.json({
        mensaje: 'Ruta de autenticación funcionando'
    });
});

// ======================================
// PRUEBA DE LOGIN POR GET
// GET /api/auth/login
// Esto solo sirve para verificar desde navegador
// ======================================
router.get('/login', (req, res) => {
    res.json({
        mensaje: 'La ruta login existe. Para iniciar sesión usa POST /api/auth/login'
    });
});

// ======================================
// LOGIN
// POST /api/auth/login
// ======================================
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        console.log('==============================');
        console.log('LOGIN INTENTADO');
        console.log('Usuario recibido:', usuario);
        console.log('Password recibido:', password);
        console.log('==============================');

        if (!usuario || !password) {
            return res.status(400).json({
                mensaje: 'Usuario y contraseña son obligatorios'
            });
        }

        const resultado = await pool.query(
            `
            SELECT 
                u.id_usuario,
                u.nombre_completo,
                u.usuario,
                u.correo,
                u.password,
                u.id_rol,
                u.estado,
                r.nombre_rol
            FROM usuarios u
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.usuario = $1 OR u.correo = $1
            LIMIT 1
            `,
            [usuario.trim()]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        const usuarioDB = resultado.rows[0];

        if (String(usuarioDB.estado).toLowerCase() !== 'activo') {
            return res.status(403).json({
                mensaje: 'El usuario no está activo'
            });
        }

        let passwordCorrecta = false;

        // Opción segura con bcrypt
        try {
            passwordCorrecta = await bcrypt.compare(password, usuarioDB.password);
        } catch (error) {
            passwordCorrecta = false;
        }

        // Opción temporal por si tu contraseña todavía está guardada como texto o hash viejo
        if (!passwordCorrecta && usuarioDB.usuario === 'admin' && password === '123456') {
            passwordCorrecta = true;
        }

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: 'Contraseña incorrecta'
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuarioDB.id_usuario,
                usuario: usuarioDB.usuario,
                rol: usuarioDB.nombre_rol || usuarioDB.id_rol
            },
            process.env.JWT_SECRET || 'controlagua2026',
            {
                expiresIn: '8h'
            }
        );

        return res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: usuarioDB.usuario,
            nombre: usuarioDB.nombre_completo,
            correo: usuarioDB.correo,
            rol: usuarioDB.nombre_rol || usuarioDB.id_rol
        });

    } catch (error) {
        console.error('Error en login:', error);

        return res.status(500).json({
            mensaje: 'Error en servidor',
            error: error.message
        });
    }
});

// ======================================
// CREAR ADMIN
// POST /api/auth/crear-admin
// ======================================
router.post('/crear-admin', async (req, res) => {
    try {
        let rol = await pool.query(
            'SELECT id_rol FROM roles WHERE nombre_rol = $1 LIMIT 1',
            ['Administrador']
        );

        let idRol;

        if (rol.rows.length === 0) {
            const nuevoRol = await pool.query(
                `
                INSERT INTO roles (nombre_rol)
                VALUES ($1)
                RETURNING id_rol
                `,
                ['Administrador']
            );

            idRol = nuevoRol.rows[0].id_rol;
        } else {
            idRol = rol.rows[0].id_rol;
        }

        const existeAdmin = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE usuario = $1 LIMIT 1',
            ['admin']
        );

        const passwordEncriptada = await bcrypt.hash('123456', 10);

        if (existeAdmin.rows.length > 0) {
            await pool.query(
                `
                UPDATE usuarios
                SET password = $1,
                    estado = 'activo',
                    id_rol = $2
                WHERE usuario = 'admin'
                `,
                [passwordEncriptada, idRol]
            );

            return res.json({
                mensaje: 'Usuario admin actualizado correctamente',
                usuario: 'admin',
                password: '123456'
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO usuarios
            (
                nombre_completo,
                usuario,
                correo,
                password,
                id_rol,
                estado
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_usuario, nombre_completo, usuario, correo, estado
            `,
            [
                'Administrador del Sistema',
                'admin',
                'admin@controlagua.com',
                passwordEncriptada,
                idRol,
                'activo'
            ]
        );

        return res.status(201).json({
            mensaje: 'Usuario admin creado correctamente',
            usuario: resultado.rows[0],
            credenciales: {
                usuario: 'admin',
                password: '123456'
            }
        });

    } catch (error) {
        console.error('Error al crear admin:', error);

        return res.status(500).json({
            mensaje: 'Error al crear admin',
            error: error.message
        });
    }
});

module.exports = router;