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
    mileage: DataTypes.FLOAT,
    fuelCapacity: DataTypes.FLOAT,
    recordedSpeed: DataTypes.FLOAT,
    alarmEventId: DataTypes.INTEGER,
    overSpeedAlarmInfo: DataTypes.JSON, // Store over speed alarm info as JSON
    areaRouteAlarmInfo: DataTypes.JSON, // Store area route alarm info as JSON
    drivingTimeAlarmInfo: DataTypes.JSON, // Store driving time alarm info as JSON
    vehicleSignalStatus: DataTypes.JSON, // Store vehicle signal status as JSON
    ioStatus: DataTypes.JSON, // Store IO status as JSON
    analogData: DataTypes.TEXT, // Store analog data as HEX string
    networkSignal: DataTypes.INTEGER,
    gnssSatelliteCount: DataTypes.INTEGER,
    batteryVoltage: DataTypes.FLOAT,
}, {
    tableName: 'positions',
});

module.exports = Position;
