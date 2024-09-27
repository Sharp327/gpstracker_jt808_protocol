const net = require('net');
const JT808Parser = require('./jt808Parser');
const JT808Request = require('./jt808Request');
const Device = require('../models/Device');
const Position = require('../models/Position');
const RawData = require('../models/RawData');

// In-memory store for tracker states
const trackerStates = {};

const server = net.createServer((socket) => {
    console.log('Tracker connected');

    socket.on('data', async (data) => {
        try {
            console.log("============================================");
            console.log("client:", data.toString('hex').toUpperCase());
            const parsedData = JT808Parser.parse(data);
            console.log("parsedData", parsedData);

            const {messageId, deviceId, messageSequence} = parsedData;
            let result = 0x00;

            await handleRawDataReport(deviceId, data, socket.remoteAddress.replace('::ffff:', ''))

            // console.log(`RawData saved for device: ${deviceId}`); Initialize tracker
            // state if not present
            if (!trackerStates[deviceId]) {
                trackerStates[deviceId] = {
                    registered: false,
                    authenticated: false
                };
            }

            trackerStates[deviceId].socket = socket;

            // Handle specific JT808 messages
            if (messageId === 0x0100) { // Terminal Registration
                await handleTerminalRegistration(parsedData);
                trackerStates[deviceId].registered = true;

                const authCode = 'TR20240902090017';

                //  Send Terminal Registration Response (0x8100)
                const registrationResponse = JT808Request.createRegistrationResponse(
                    deviceId,
                    messageSequence,
                    result,
                    authCode
                );
                console.log("server:", registrationResponse.toString('hex').toUpperCase());
                await socket.write(registrationResponse);

            } else if (messageId === 0x0102) { // Authentication
                if (!trackerStates[deviceId].registered) {
                    const commonRequest = JT808Request.createJT808Message(
                        deviceId,
                        messageId,
                        messageSequence,
                        0x01
                    );
                    console.log("server:", commonRequest.toString('hex').toUpperCase());
                    await socket.write(commonRequest);
                    // sendSetParametersCommand(socket, deviceId, messageSequence);
                    return;
                }

                if (parsedData.authenticationCode == 'TR20240902090017') {
                    result = 0x00;
                    trackerStates[deviceId].authenticated = true;
                } else {
                    result = 0x01;
                    const commonRequest = JT808Request.createJT808Message(
                        deviceId,
                        messageId,
                        messageSequence,
                        0x01
                    );
                    console.log("server:", commonRequest.toString('hex').toUpperCase());
                    await socket.write(commonRequest);
                    // sendSetParametersCommand(socket, deviceId, messageSequence);

                    return;
                }

                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    result
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0200 || messageId === 0x0201 || messageId === 0x0202 || messageId === 0x0203) { // Location Information Report
                await handleLocationReport(parsedData);

                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    result
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0F01) {
                const calibration = 1; // Time calibration successful
                const timestamp = getCurrentDateTimeBCDInGMT8(); // Timestamp in BCD format (YYMMDDhhmmss)
                const responseMessage = JT808Request.createTimeSyncResponse(
                    calibration,
                    timestamp
                );
                await socket.write(responseMessage);
                console.log("server:", responseMessage.toString('hex').toUpperCase());
            } else if (messageId === 0x0104) {
                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    result
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0001 || messageId === 0x0002) {
                // if(messageId === 0x0001){
                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    (
                        (!trackerStates[deviceId].registered || !trackerStates[deviceId].authenticated)
                            ? 0x01
                            : result
                    )
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
                // console.log(`Heartbeat message: 0x${messageId.toString(16).toUpperCase()}`);
            } else if (messageId === 0x0107) {
                await handleTrackAttributeReport(parsedData);

                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    (
                        (!trackerStates[deviceId].registered || !trackerStates[deviceId].authenticated)
                            ? 0x01
                            : result
                    )
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0003) {
                console.log("Tracker has logged out:", deviceId);
                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    result
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else {
                const commonRequest = JT808Request.createJT808Message(
                    deviceId,
                    messageId,
                    messageSequence,
                    result
                );
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            }

        } catch (error) {
            console.error('Error processing data:', error);
        }
    });

    socket.on('close', () => {
        console.log('Tracker disconnected');
        // Clean up tracker state on disconnect
        Object
            .keys(trackerStates)
            .forEach(id => {
                if (trackerStates[id].socket === socket) {
                    delete trackerStates[id];
                }
            });
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

// Handle Terminal Registration (0x0100)
async function handleTerminalRegistration(data) {
    const {
        deviceId,
        provinceId,
        cityId,
        manufacturerId,
        terminalModel,
        terminalId,
        licensePlateColor,
        licensePlate
    } = data;

    try {
        // Check if the device already exists
        let device = await Device.findOne({where: {
                name: deviceId
            }});

        if (!device) {
            await Device.create({
                name: deviceId,
                uniqueId: deviceId,
                distance_unit: "km",
                deviceType: getDeviceType(deviceId)
            });
            console.log(`Device registered: ${deviceId}`);
        }
    } catch (error) {
        console.error('Error handling terminal registration:', error);
    }
}

function getDeviceType(deviceId){
    switch (deviceId.substring(0, 2)) {
        case '00':
            return 'odb';
        case '01':
            return 'usb';
        case '02':
            return 'other1';
        case '03':
            return 'other2';
        case '04':
            return 'other3';
        case '05':
            return 'other4';
        default:
            return 'unknown';
    }
    
}
async function handleTrackAttributeReport(data) {
    const {deviceId, simICCID} = data;

    try {
        const device = await Device.findOne({where: {
                name: deviceId
            }});

        if (device) {
            if (simICCID) {
                await device.update({iccid: simICCID});
            }
        }

    } catch (error) {
        console.error('Error handling tracker attribute report:', error);
    }
}

async function handleRawDataReport(deviceId, data, ipAddress){
    try {
        let device = await Device.findOne({where: {
            name: deviceId
        }});

        if (!device) {
            device = await Device.create({
                name: deviceId,
                uniqueId: deviceId,
                distance_unit: "km",
                deviceType: getDeviceType(deviceId)
            });
            console.log(`Device registered: ${deviceId}`);
        }
        //  Insert raw data into the database
        await RawData.create({
            deviceId: device.id, // Default value or extracted from data
            data: data
                .toString('hex')
                .toUpperCase(),
            upload_public_ip: ipAddress
        });
        
    } catch (error) {
        console.error('Error handling rawdata report:', error);
    }
}

// Handle Location Information Report (0x0200)
async function handleLocationReport(data) {
    const {
        deviceId,
        alarmFlags,
        statusFlags,
        latitude,
        longitude,
        altitude,
        speed,
        direction,
        timestamp,
        extendedData
    } = data;

    try {
        // Find the device
        const device = await Device.findOne({ where: { name: deviceId } });

        if (!device) return;

        // Prepare device update data
        const updateDeviceData = {
            vin: extendedData.vinCode || extendedData?.OBDData?.vinCode || device.vin,
            iccid: extendedData.iccidCode || device.iccid,
            odometer: extendedData.totalMileage || extendedData?.OBDData?.totalMileage || device.odometer || extendedData.mileage,
            latitude,
            longitude,
            direction,
            speed: extendedData.recorderspeed,
            acc: statusFlags?.accOn,
            signal: extendedData.signalStrength,
            fuel: extendedData.fuellevel,
            lastPosition: timestamp,
            lastConnect: new Date(),
            lastAcc: statusFlags?.accOn ? new Date() : device.lastAcc
        };

        await device.update(updateDeviceData);
        // atitude, longitude, speed, direction, acc, signal fuel
        // Prepare position data
        const createPositionData = {
            deviceId: device.id,
            latitude, longitude, altitude, direction,
            deviceTime: timestamp,
            speed: extendedData.recorderspeed,
            batteryVoltage: extendedData.batteryVoltage || extendedData?.OBDData?.batteryVoltage,
            signal_strength: extendedData.signalStrength,
            fuel: extendedData.fuellevel,
            engine_load: extendedData.engineLoad || extendedData?.OBDData?.engineLoad,
            engine_speed: extendedData.engineSpeed || extendedData?.OBDData?.engineSpeed,
            coolant_temp: extendedData.coolantTemperature || extendedData?.OBDData?.coolantTemperature,
            odometer: extendedData.totalMileage || extendedData?.OBDData?.totalMileage || device.odometer || extendedData.mileage,
            fuel_percent: extendedData.fuelLevelPercentage,
            rapid_accel: extendedData.rapidAccelerations,
            rapid_decel: extendedData.rapidDecelerations,
            sharpturn: extendedData.sharpTurns,
            avg_speed: extendedData.averageSpeed,
            max_speed: extendedData.maxSpeed,
            fault_code: extendedData.faultCodeInfo,
            temp: extendedData.temperatures,
            door: statusFlags?.door1Open,
            idle: alarmFlags?.idling,
            collision: alarmFlags?.collisionAlarm,
            acc: statusFlags?.accOn,
            disconnect: statusFlags?.circuitDisconnect
        };

        // Save the position to the database
        const positiondata = await Position.create(createPositionData);

        // await AlarmFlags.create({
        //     position_id: positiondata.id,
        //     ...alarmFlags
        // });

        // await StatusFlags.create({
        //     position_id: positiondata.id,
        //     ...statusFlags
        // });

        // if (extendedData.OBDData) {
        //     await OBD_Data.create({
        //         position_id: positiondata.id,
        //         ...extendedData.OBDData
        //     });
        // }

        // await ExtendedData.create({
        //     position_id: positiondata.id,
        //     ...extendedData
        // });

        console.log(`Position saved for device: ${deviceId}`);
    } catch (error) {
        console.error('Error handling location report:', error);
    }
}

function getCurrentDateTimeBCDInGMT8() {
    // Create a Date object with the current local time
    const now = new Date();

    // Get the current timezone offset in minutes
    const offsetInMinutes = now.getTimezoneOffset(); // The offset is in minutes from GMT

    // Convert local time to GMT+8
    const gmt8Offset = 8 * 60; // GMT+8 is 8 hours ahead of GMT, so offset in minutes is 480
    const localOffset = offsetInMinutes; // Offset from GMT in minutes
    const totalOffset = gmt8Offset - localOffset; // Calculate total offset to add

    // Create new date adjusted to GMT+8
    const gmt8Date = new Date(now.getTime() + (totalOffset * 60 * 1000));

    // Extract date and time components
    const year = gmt8Date
        .getFullYear()
        .toString()
        .slice(-2); // Last 2 digits of the year
    const month = String(gmt8Date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(gmt8Date.getDate()).padStart(2, '0');
    const hour = String(gmt8Date.getHours()).padStart(2, '0');
    const minute = String(gmt8Date.getMinutes()).padStart(2, '0');
    const second = String(gmt8Date.getSeconds()).padStart(2, '0');

    // Concatenate components in BCD format
    const bcdDateTime = year + month + day + hour + minute + second;

    return bcdDateTime;
}

module.exports = {
    server,
    trackerStates // Export trackerStates for use in other parts of the application
};
