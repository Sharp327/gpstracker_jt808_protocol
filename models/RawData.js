const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RawData = sequelize.define('RawData', {
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    data: {
        type: DataTypes.TEXT, // Assuming 'data' is a text field. Adjust if necessary.
        allowNull: false,
    },
    upload_public_ip: {
        type: DataTypes.STRING, // Assuming 'upload_public_ip' is a string. Adjust if necessary.
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    timestamps: true, // Sequelize will automatically manage 'createdAt' and 'updatedAt'
    tableName: 'rawdata',
});

module.exports = RawData;
