require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Login disponible en /login.html`);
    console.log(`API disponible en /api`);
    console.log('=================================');
});