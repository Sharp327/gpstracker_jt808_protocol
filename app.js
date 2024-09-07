const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
// const deviceRoutes = require('./routes/deviceRoutes');
// const positionRoutes = require('./routes/positionRoutes');

const app = express();

// Connect to MySQL
sequelize.sync().then(() => {
    console.log('Database synchronized');
}).catch(err => {
    console.error('Database synchronization error:', err);
});

// Middleware
app.use(bodyParser.json());

// Routes
// app.use('/api/devices', deviceRoutes);
// app.use('/api/positions', positionRoutes);

module.exports = app;
