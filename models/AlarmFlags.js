const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlarmFlags = sequelize.define('AlarmFlags', {
    position_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    overspeedAlarm: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 1
    fatigueDriving: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 2
    terminalMainPowerUndervoltage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 7
    terminalMainPowerOff: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 8
    highWaterTemperature: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 12
    idling: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 13
    vibrationAlarm: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 16
    sharpTurn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 17
    illegalVehicleMovement: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }, // Bit 28
    collisionAlarm: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },// Bit 29
}, {
    tableName: 'alarm_flags',
});

module.exports = AlarmFlags;
