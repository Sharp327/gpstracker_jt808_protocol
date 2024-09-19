const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    provinceId: DataTypes.INTEGER,
    cityId: DataTypes.INTEGER,
    manufacturerId: DataTypes.STRING,
    terminalModel: DataTypes.STRING,
    terminalId: DataTypes.STRING,
    licensePlateColor: DataTypes.INTEGER,
    licensePlate: DataTypes.STRING,
    VIN: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iccidCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
}, {
    tableName: 'devices',
});

module.exports = Device;
