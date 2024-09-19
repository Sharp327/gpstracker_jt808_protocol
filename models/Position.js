const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Position = sequelize.define('Position', {
    device_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE,
    altitude: DataTypes.FLOAT,
    speed: DataTypes.FLOAT,
    direction: DataTypes.INTEGER,
    timestamp: DataTypes.DATE,
}, {
    tableName: 'positions',
});

module.exports = Position;
