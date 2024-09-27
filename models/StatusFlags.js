const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// const StatusFlags = sequelize.define('StatusFlags', {
//     position_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//     },
//     accOn: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     positioning: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     southLatitude: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     westLongitude: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     stopRunningStatus: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     latitudeLongitudeEncrypted: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     loadStatus: {
//         type: DataTypes.INTEGER, // 0: Empty, 1: Half, 2: Reserve, 3: Full
//         defaultValue: 0,
//     },
//     oilLineDisconnect: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     circuitDisconnect: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     door1Open: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     door2Open: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     door3Open: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     door4Open: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     door5Open: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     gpsPositioning: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     beidouPositioning: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     glonassPositioning: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     },
//     galileoPositioning: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//     }
// }, {
//     tableName: 'status_flags',
//     timestamps: false,
// });

// module.exports = StatusFlags;
