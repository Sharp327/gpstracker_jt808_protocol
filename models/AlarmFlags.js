const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlarmFlags = sequelize.define('AlarmFlags', {
    position_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    emergencyAlarm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    overSpeedAlarm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    drivingAlarmMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    riskWarning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    gnssModuleMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    gnssAntennaNotConnected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    gnssAntennaShortCircuited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    terminalMainPowerUndervoltage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    terminalMainPowerOff: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    terminalLCDMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    ttsModuleMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    cameraMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    roadTransportCertificateICCardModuleMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    overSpeedWarning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    fatigueDrivingWarning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    reserved1: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    accumulatedOverSpeedDrivingTime: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    timeoutParking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    enterExitArea: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    enterExitRoute: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    drivingTimeOfRouteNotEnoughTooLong: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    offTrackAlarm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    vehicleVSSMalfunction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    abnormalFuelCapacity: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    vehicleStolen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    illegalIgnition: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    illegalDisplacement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    collisionWarning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    rolloverWarning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    illegalOpenDoors: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'alarm_flags',
});

module.exports = AlarmFlags;
