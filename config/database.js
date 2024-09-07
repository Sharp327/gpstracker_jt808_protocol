const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('gpsdb', 'root', 'StrongP@ssw0rd', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;
