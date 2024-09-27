const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Position = sequelize.define('Position', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'devices',  // Assuming there's a `devices` table
            key: 'id'
        }
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    speed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    direction: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    signal_strength: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    door: {
        type: DataTypes.TINYINT,
        allowNull: true
    },
    mt2v_dc_volt: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: true
    },
    deviceTime: {
        type: DataTypes.DATE,
        allowNull: false,
        primaryKey: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fuel: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    engine_load: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    engine_speed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    coolant_temp: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    odometer: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fuel_percent: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rapid_accel: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rapid_decel: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sharpturn: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    avg_speed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    max_speed: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    idle: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fault_code: {
        type: DataTypes.JSON,
        allowNull: true
    },
    temp: {
        type: DataTypes.JSON,
        allowNull: true
    },
    collision: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    acc: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    disconnect: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'positions',
    timestamps: true // createdAt and updatedAt fields are managed automatically
});

module.exports = Position;
