const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define the ExtendedData model
const ExtendedData = sequelize.define('ExtendedData', {
    position_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    mileage: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fuelLevel: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    recorderSpeed: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    manualAlarmCount: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    vehicleSignalStatus: {
        type: DataTypes.JSON,
        allowNull: true
    },
    IOStatus: {
        type: DataTypes.JSON,
        allowNull: true
    },
    analogBit: { 
        type: DataTypes.INTEGER,
        allowNull: true
    },
    signalStrength: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    instantaneousSpeed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    engineSpeed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    batteryVoltage: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    engineLoad: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    coolantTemperature: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    instantaneousFuelConsumption: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    intakeAirTemperature: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    airflow: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    manifoldPressure: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    throttlePosition: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fuelPressure: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    vinCode: {
        type: DataTypes.STRING(17),
        allowNull: true
    },
    totalMileage: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    remainingMileage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fuelLevelPercentage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rapidAccelerations: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rapidDecelerations: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sharpTurns: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    distanceTraveled: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fuelConsumption: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    averageSpeed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    maxSpeed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    overspeedEvents: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    idleEvents: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    totalFuelConsumption: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    baseStationInfo: {
        type: DataTypes.JSON,
        allowNull: true
    },
    faultCodeInfo: {
        type: DataTypes.JSON,
        allowNull: true
    },
    iccidCode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    OBDData_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'extended_data',
    timestamps: true // Add this if you want createdAt and updatedAt columns
});

module.exports = ExtendedData;