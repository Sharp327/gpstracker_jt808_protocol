const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OBD_Data = sequelize.define('OBD_Data', {
    position_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    vehicleSpeed: {
        type: DataTypes.FLOAT,
        allowNull: true, // Speed in KM/H
    },
    engineSpeed: {
        type: DataTypes.INTEGER,
        allowNull: true, // RPM
    },
    obdBatteryVoltage: {
        type: DataTypes.FLOAT,
        allowNull: true, // Voltage in V
    },
    totalMileage: {
        type: DataTypes.FLOAT,
        allowNull: true, // Mileage in KM
    },
    idleFuelConsumption: {
        type: DataTypes.FLOAT,
        allowNull: true, // Fuel consumption in L/H
    },
    drivingFuelConsumption: {
        type: DataTypes.FLOAT,
        allowNull: true, // Fuel consumption in L/100KM
    },
    engineLoad: {
        type: DataTypes.INTEGER,
        allowNull: true, // Load percentage (0-100%)
    },
    coolantTemperature: {
        type: DataTypes.INTEGER,
        allowNull: true, // Temperature in °C
    },
    intakeManifoldPressure: {
        type: DataTypes.INTEGER,
        allowNull: true, // Pressure in KPA
    },
    inletAirTemperature: {
        type: DataTypes.INTEGER,
        allowNull: true, // Temperature in °C
    },
    inletAirFlow: {
        type: DataTypes.FLOAT,
        allowNull: true, // Air flow in G/S
    },
    absoluteThrottlePosition: {
        type: DataTypes.FLOAT,
        allowNull: true, // Throttle position in percentage (0-100%)
    },
    ignitionAdvanceAngle: {
        type: DataTypes.FLOAT,
        allowNull: true, // Advance angle in degrees
    },
    vehicleVIN: {
        type: DataTypes.STRING,
        allowNull: true, // VIN number
    },
    vehicleFaultCodes: {
        type: DataTypes.JSON,
        allowNull: true, // Fault codes as JSON
    },
    tripID: {
        type: DataTypes.INTEGER,
        allowNull: true, // Trip ID
    },
}, {
    tableName: 'obd_datas',
    timestamps: true, // Optional: Adds createdAt and updatedAt fields
});

module.exports = OBD_Data;
