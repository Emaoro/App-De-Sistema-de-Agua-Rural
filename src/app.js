const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const familiaRoutes = require('./routes/familia.routes');
const incidenciaRoutes = require('./routes/incidencia.routes');
const tanqueRoutes = require('./routes/tanque.routes');
const distribucionRoutes = require('./routes/distribucion.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const sectorRoutes = require('./routes/sector.routes');
const reporteRoutes = require('./routes/reporte.routes');
const configuracionRoutes = require('./routes/configuracion.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/familias', familiaRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/tanques', tanqueRoutes);
app.use('/api/distribucion', distribucionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sectores', sectorRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
    res.json({
        mensaje: 'API del sistema Control Agua funcionando correctamente'
    });
});

// Si una ruta API no existe
app.use('/api', (req, res) => {
    res.status(404).json({
        mensaje: 'Ruta API no encontrada',
        ruta: req.originalUrl
    });
});

// Si una página no existe
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../frontend/login.html'));
});

module.exports = app;