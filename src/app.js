const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ===============================
// MIDDLEWARES PRINCIPALES
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// SERVIR FRONTEND
// ===============================

app.use(express.static(path.join(__dirname, '../frontend')));

// ===============================
// RUTAS DEL BACKEND / API
// ===============================

const authRoutes = require('./routes/auth.routes');
const familiaRoutes = require('./routes/familia.routes');
const incidenciaRoutes = require('./routes/incidencia.routes');
const tanqueRoutes = require('./routes/tanque.routes');
const distribucionRoutes = require('./routes/distribucion.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const configuracionRoutes = require('./routes/configuracion.routes');
const sectorRoutes = require('./routes/sector.routes');
const reporteRoutes = require('./routes/reporte.routes');
const usuarioInvitadoRoutes = require('./routes/usuario-invitado.routes');

app.use('/api/auth', authRoutes);
app.use('/api/familias', familiaRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/tanques', tanqueRoutes);
app.use('/api/distribucion', distribucionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/sectores', sectorRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/usuario-invitado', usuarioInvitadoRoutes);

// ===============================
// RUTA PRINCIPAL
// ===============================

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// ===============================
// ATAJOS
// ===============================

app.get('/login', (req, res) => {
    res.redirect('/login.html');
});

app.get('/admin', (req, res) => {
    res.redirect('/dashboard.html');
});

app.get('/usuario', (req, res) => {
    res.redirect('/usuario-dashboard.html');
});

// ===============================
// RUTA DE PRUEBA DE API
// ===============================

app.get('/api', (req, res) => {
    res.json({
        mensaje: 'API del Sistema de Agua Rural funcionando correctamente',
        estado: 'OK',
        servidor: 'Render',
        frontend: '/login.html',
        rutas: {
            auth: '/api/auth',
            familias: '/api/familias',
            incidencias: '/api/incidencias',
            tanques: '/api/tanques',
            distribucion: '/api/distribucion',
            dashboard: '/api/dashboard',
            configuracion: '/api/configuracion',
            sectores: '/api/sectores',
            reportes: '/api/reportes',
            usuarioInvitado: '/api/usuario-invitado'
        }
    });
});

// ===============================
// RUTAS API NO ENCONTRADAS
// ===============================

app.use('/api', (req, res) => {
    res.status(404).json({
        mensaje: 'Ruta API no encontrada',
        ruta: req.originalUrl
    });
});

// ===============================
// PÁGINAS NO ENCONTRADAS
// ===============================

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../frontend/login.html'));
});

module.exports = app;
