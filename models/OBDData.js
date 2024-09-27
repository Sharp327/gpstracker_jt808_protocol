const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// // Define the OBDData model
// const OBDData = sequelize.define('OBDData', {
//     position_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//     },
//     mileage: {
//         type: DataTypes.FLOAT,
//         allowNull: true
//     },
//     vehicleSpeed: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 KM/H
//     },
//     engineSpeed: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // RPM
//     },
//     batteryVoltage: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.001 V
//     },
//     totalMileage: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 KM
//     },
//     idleFuelConsumption: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 L/H
//     },
//     drivingFuelConsumption: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 L/100 KM
//     },
//     engineLoad: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // 0-100 %
//     },
//     coolantTemperature: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // -40 to 215 °C
//     },
//     intakeManifoldPressure: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // 0-500 KPA
//     },
//     intakeTemperature: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // -40 to 215 °C
//     },
//     intakeFlow: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0-655.35 G/S
//     },
//     throttlePosition: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0-100 %
//     },
//     ignitionAdvance: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // Degrees
//     },
//     vinCode: {
//         type: DataTypes.STRING,
//         allowNull: true, // VIN code
//     },
//     faultCode: {
//         type: DataTypes.STRING,
//         allowNull: true, // Fault code in hex
//     },
//     tripId: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Trip ID
//     },
//     tripMileage: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 KM
//     },
//     totalMileageSinceConnection: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 KM
//     },
//     tripFuelConsumption: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 L
//     },
//     totalFuelConsumption: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 L
//     },
//     averageFuelConsumption: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 L/100 KM
//     },
//     overspeedDuration: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Seconds
//     },
//     highEngineSpeedCounts: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     highEngineSpeedDuration: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Seconds
//     },
//     excessiveIdleCounts: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     totalIdleDuration: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Seconds
//     },
//     totalIdleFuelConsumption: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 L
//     },
//     fatigueDrivingDuration: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Seconds
//     },
//     averageTripSpeed: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 KM/H
//     },
//     maxTripSpeed: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.1 KM/H
//     },
//     maxEngineSpeed: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // RPM
//     },
//     maxEngineWaterTemp: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // °C
//     },
//     maxTripVoltage: {
//         type: DataTypes.FLOAT,
//         allowNull: true, // 0.001 V
//     },
//     overspeedCount: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     suddenAccelerationCount: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     suddenDecelerationCount: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     sharpTurnCount: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     suddenLaneChangeCount: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
//     suddenBrakingCount: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // Counts
//     },
// }, {
//     tableName: 'obd_data',
//     timestamps: true // Add this if you want createdAt and updatedAt columns
// });

// module.exports = OBDData;