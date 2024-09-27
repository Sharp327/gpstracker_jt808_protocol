const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    deviceType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'moovetrax',
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    uniqueId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    vehicleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    model: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    make: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    category: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    color: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    vin: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    license_tag: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
    },
    distance_unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'mile',
        comment: 'mile or km',
    },
    iccid: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    prev_od: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: false,
        defaultValue: 0.0,
    },
    odometer: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: false,
        defaultValue: 0.0,
    },
    attributes: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    gpsIp: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    gpsPort: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    lastStatusChanged: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
    },
    lock_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
    },
    lock_status_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    kill_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
    },
    kill_status_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    mt2v_bt_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    mt2v_bt_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
    },
    mt2v_bt_pin: {
        type: DataTypes.STRING(6),
        allowNull: false,
        defaultValue: '',
    },
    mt2v_bt_signal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    mt2v_bt_distance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    mt2v_bt_on_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
    },
    mt2v_bt_lock_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
    },
    mt2v_bt_lock_status_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    mt2v_bt_initialize: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    mt2v_dc_volt: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: true,
    },
    mt2v_hood_volt: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: true,
    },
    mt2v_hood_open_volt: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: true,
    },
    mt2v_door_volt: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: true,
    },
    mt2v_door_open_volt: {
        type: DataTypes.DECIMAL(10, 1),
        allowNull: true,
    },
    mt3v_shock_status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    mt3v_shock_sensitivity: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    mt3v_shock_duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    imei: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
    },
    ignition_status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'on',
    },
    lockUnlockSetting: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    speed: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    overspeed: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    direction: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    acc: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    disabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    isDoubleUnlock: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    isDoubleLock: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    enableCycle: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    enableInstaller: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    signal: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fuel: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    maxFuel: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    minFuel: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    apiKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    door: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    billing_source: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'paypal',
    },
    escrow_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    monthly_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 15.00,
    },
    billing_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    credit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    reseller_applied: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    plan_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
    },
    subscription_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
    },
    is_paid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    lastPosition: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastConnect: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastAcc: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    factory_passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    firmwareVersion: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '',
    },
    firmwareVersionUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    smartcar_subscribed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    gmt: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: -5,
    },
    carrierId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    carrierName: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'devices',
    timestamps: true
});

module.exports = Device;
