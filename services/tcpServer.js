const net = require('net');
const JT808Parser = require('./jt808Parser');
const JT808Request = require('./jt808Request');
const Device = require('../models/Device');
const Position = require('../models/Position');
const RawData = require('../models/RawData');
const AlarmFlags = require('../models/AlarmFlags');
const StatusFlags = require('../models/StatusFlags');
const OBD_Data = require('../models/OBD_Data');

// In-memory store for tracker states
const trackerStates = {};

const server = net.createServer((socket) => {
    console.log('Tracker connected');
   
    socket.on('data', async (data) => {
        try {
            console.log("============================================");
            console.log("client:", data.toString('hex').toUpperCase());
            const parsedData = JT808Parser.parse(data);
            // console.log("parsedData", parsedData);

            const { messageId, deviceId, messageSequence } = parsedData;
            let result = 0x00;

            // // Insert raw data into the database
            await RawData.create({
                deviceId: deviceId, // Default value or extracted from data
                data: data.toString('hex').toUpperCase(),
                upload_public_ip: socket.remoteAddress.replace('::ffff:', ''),
            });
            // console.log(`RawData saved for device: ${deviceId}`);

            // Initialize tracker state if not present
            if (!trackerStates[deviceId]) {
                trackerStates[deviceId] = { registered: false, authenticated: false };
            }

            // Handle specific JT808 messages
            if (messageId === 0x0100) { // Terminal Registration
                await handleTerminalRegistration(parsedData);
                trackerStates[deviceId].registered = true;

                const authCode = 'TR20240902090017';

                // // Send Terminal Registration Response (0x8100)
                const registrationResponse = JT808Request.createRegistrationResponse(deviceId, messageSequence, result, authCode);
                console.log("server:", registrationResponse.toString('hex').toUpperCase());
                await socket.write(registrationResponse);

            } else if (messageId === 0x0102) { // Authentication
                if(!trackerStates[deviceId].registered){
                    const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, 0x01);
                    console.log("server:", commonRequest.toString('hex').toUpperCase());
                    await socket.write(commonRequest);
                    // sendSetParametersCommand(socket, deviceId, messageSequence);
                    return;
                }
                
                if(parsedData.authenticationCode == 'TR20240902090017'){
                    result = 0x00;
                    trackerStates[deviceId].authenticated = true;
                }else{
                    result = 0x01;
                    const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, 0x01);
                    console.log("server:", commonRequest.toString('hex').toUpperCase());
                    await socket.write(commonRequest);
                    // sendSetParametersCommand(socket, deviceId, messageSequence);

                    return;
                }

                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0200 || messageId === 0x0201) { // Location Information Report
                await handleLocationReport(parsedData, socket);
                
                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            // } else if (messageId === 0x0102) { // Handle other messages
            //     sendSetParametersCommand(socket, deviceId, messageSequence);
                
            //     const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
            //     console.log("commonRequest:", commonRequest.toString('hex').toUpperCase());
            //     await socket.write(commonRequest);
            } else if (messageId === 0x0F01) {
                const calibration = 1; // Time calibration successful
                const timestamp = getCurrentDateTimeBCDInGMT8(); // Timestamp in BCD format (YYMMDDhhmmss)
                const responseMessage = JT808Request.createTimeSyncResponse(calibration, timestamp);
                await socket.write(responseMessage);
                console.log("server:", responseMessage.toString('hex').toUpperCase());
            } else if (messageId === 0x0104) {
                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0001 || messageId === 0x0002) {
                // if(messageId === 0x0001){
                    const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, ((!trackerStates[deviceId].registered || !trackerStates[deviceId].authenticated) ? 0x01 : result));
                    console.log("server:", commonRequest.toString('hex').toUpperCase());
                    await socket.write(commonRequest);
                // }
                // if(messageId === 0x0002){
                //     const requestMessage = JT808Request.createRequestTrackerAttribute(deviceId, messageSequence);
                //     await socket.write(requestMessage);
                //     console.log("server:", requestMessage.toString('hex')); // Output the message in hex format
                // }

                // const commandType = 0x04; // Command type for locking the car

                // const requestMessage = JT808Request.createTerminalControlRequest(deviceId, messageSequence, commandType);
                // await socket.write(requestMessage);
                // console.log(requestMessage.toString('hex')); // Output the message in hex format

                // =================
                // const commandType = 0x04; // Command type for locking the car

                // const requestMessage = JT808Request.createTerminalControlRequest(deviceId, messageSequence, commandType);
                // console.log("createTerminalControlRequest", requestMessage.toString('hex')); // Output the message in hex format
                // await socket.write(requestMessage);
                
                // const requestMessage = JT808Request.createRequestTrackerAttribute(deviceId, messageSequence);
                // await socket.write(requestMessage);
                // console.log("createRequestTrackerAttribute", requestMessage.toString('hex')); // Output the message in hex format
                
                // ===================
                // const requestMessage = JT808Request.createRequestTrackerAttribute(deviceId, messageSequence);
                // await socket.write(requestMessage);
                // console.log("createRequestTrackerAttribute", requestMessage.toString('hex')); // Output the message in hex format
                
                // console.log(`Heartbeat message: 0x${messageId.toString(16).toUpperCase()}`);
            } else if (messageId === 0x0003) {
                console.log("Tracker has logged out:", deviceId);
                // Additional cleanup or processing logic here
            }

        } catch (error) {
            console.error('Error processing data:', error);
        }
    });

    socket.on('close', () => {
        console.log('Tracker disconnected');
        // Clean up tracker state on disconnect
        Object.keys(trackerStates).forEach(id => {
            if (trackerStates[id].socket === socket) {
                delete trackerStates[id];
            }
        });
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

function sendSetParametersCommand(socket, deviceId, messageSequence) {
    // const parameters = Buffer.concat([
    //     Buffer.from([0x00, 0x01, 0x01]), // Parameter ID and length for heartbeat interval
    //     Buffer.from([0x0A]), // Heartbeat interval value (e.g., 10 seconds)
    //     Buffer.from([0x00, 0x02, 0x01]), // Parameter ID and length for reporting interval or conditions
    //     Buffer.from([0x30]), // Example value
    // ]);
    const parameters = Buffer.from('CQ'); // 'CQ' ASCII representation [43, 51]

    const setParametersMessage = JT808Request.createSetParametersRequest(deviceId, messageSequence, parameters);
    console.log('Sending set parameters command:', setParametersMessage.toString('hex').toUpperCase());
    socket.write(setParametersMessage);
}

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
        let device = await Device.findOne({ where: { deviceId } });

        if (device) {
            // Update existing device
            await device.update({
                provinceId,
                cityId,
                manufacturerId,
                terminalModel,
                terminalId,
                licensePlateColor,
                VIN:licensePlate,
            });
            console.log(`Device updated: ${deviceId}`);
        } else {
            // Create a new device
            device = await Device.create({
                deviceId,
                provinceId,
                cityId,
                manufacturerId,
                terminalModel,
                terminalId,
                licensePlateColor,
                VIN:licensePlate,
            });
            console.log(`Device registered: ${deviceId}`);
        }
    } catch (error) {
        console.error('Error handling terminal registration:', error);
    }
}

function sendReRegistrationRequest(socket, deviceId) {
    const messageSequence = generateMessageSequence(); // Implement this function to generate a unique sequence number
    const registrationRequest = JT808Request.createRegistrationRequest(deviceId, messageSequence);

    console.log('Sending Terminal Registration Request (0x0100):', registrationRequest.toString('hex').toUpperCase());
    socket.write(registrationRequest);
}

// Handle Location Information Report (0x0200)
async function handleLocationReport(data, socket) {
    const {
        deviceId,
        latitude,
        longitude,
        altitude,
        speed,
        direction,
        timestamp,
        alarmFlags,
        statusFlags,
        mileage,
        fuelCapacity,
        recordedSpeed,
        alarmEventId,
        overSpeedAlarmInfo,
        areaRouteAlarmInfo,
        drivingTimeAlarmInfo,
        vehicleSignalStatus,
        ioStatus,
        analogData,
        networkSignal,
        gnssSatelliteCount,
        batteryVoltage,
        obdData,
        messageSequence
    } = data;

    const {
        emergencyAlarm,
        overSpeedAlarm,
        drivingAlarmMalfunction,
        riskWarning,
        gnssModuleMalfunction,
        gnssAntennaNotConnected,
        gnssAntennaShortCircuited,
        terminalMainPowerUndervoltage,
        terminalMainPowerOff,
        terminalLCDMalfunction,
        ttsModuleMalfunction,
        cameraMalfunction,
        roadTransportCertificateICCardModuleMalfunction,
        overSpeedWarning,
        fatigueDrivingWarning,
        reserved1,
        accumulatedOverSpeedDrivingTime,
        timeoutParking,
        enterExitArea,
        enterExitRoute,
        drivingTimeOfRouteNotEnoughTooLong,
        offTrackAlarm,
        vehicleVSSMalfunction,
        abnormalFuelCapacity,
        vehicleStolen,
        illegalIgnition,
        illegalDisplacement,
        collisionWarning,
        rolloverWarning,
        illegalOpenDoors
    } = alarmFlags;

    const {
        accOn,
        positioning,
        southLatitude,
        westLongitude,
        stopRunningStatus,
        latitudeLongitudeEncrypted,
        loadStatus,
        oilLineDisconnect,
        circuitDisconnect,
        door1Open,
        door2Open,
        door3Open,
        door4Open,
        door5Open,
        gpsPositioning,
        beidouPositioning,
        glonassPositioning,
        galileoPositioning
    } = statusFlags;

    try {
        // Find the device
        const device = await Device.findOne({ where: { deviceId } });

        if (device) {
            // Save the position to the database
            const positiondata = await Position.create({
                device_id: device.id,
                latitude,
                longitude,
                altitude,
                speed,
                direction,
                timestamp,
                mileage,
                fuelCapacity,
                recordedSpeed,
                alarmEventId,
                overSpeedAlarmInfo,
                areaRouteAlarmInfo,
                drivingTimeAlarmInfo,
                vehicleSignalStatus,
                ioStatus,
                analogData,
                networkSignal,
                gnssSatelliteCount,
                batteryVoltage
            });

            await AlarmFlags.create({
                position_id: positiondata.id,
                emergencyAlarm,
                overSpeedAlarm,
                drivingAlarmMalfunction,
                riskWarning,
                gnssModuleMalfunction,
                gnssAntennaNotConnected,
                gnssAntennaShortCircuited,
                terminalMainPowerUndervoltage,
                terminalMainPowerOff,
                terminalLCDMalfunction,
                ttsModuleMalfunction,
                cameraMalfunction,
                roadTransportCertificateICCardModuleMalfunction,
                overSpeedWarning,
                fatigueDrivingWarning,
                reserved1,
                accumulatedOverSpeedDrivingTime,
                timeoutParking,
                enterExitArea,
                enterExitRoute,
                drivingTimeOfRouteNotEnoughTooLong,
                offTrackAlarm,
                vehicleVSSMalfunction,
                abnormalFuelCapacity,
                vehicleStolen,
                illegalIgnition,
                illegalDisplacement,
                collisionWarning,
                rolloverWarning,
                illegalOpenDoors
            });

            await StatusFlags.create({
                position_id: positiondata.id,
                accOn,
                positioning,
                southLatitude,
                westLongitude,
                stopRunningStatus,
                latitudeLongitudeEncrypted,
                loadStatus,
                oilLineDisconnect,
                circuitDisconnect,
                door1Open,
                door2Open,
                door3Open,
                door4Open,
                door5Open,
                gpsPositioning,
                beidouPositioning,
                glonassPositioning,
                galileoPositioning
            });

            if(obdData)
                await OBD_Data.create({
                    position_id: positiondata.id,
                    vehicleSpeed: obdData.vehicleSpeed??null,
                    engineSpeed: obdData.engineSpeed??null,
                    obdBatteryVoltage: obdData.obdBatteryVoltage??null,
                    totalMileage: obdData.totalMileage??null,
                    idleFuelConsumption: obdData.idleFuelConsumption??null,
                    drivingFuelConsumption: obdData.drivingFuelConsumption??null,
                    engineLoad: obdData.engineLoad??null,
                    coolantTemperature: obdData.coolantTemperature??null,
                    intakeManifoldPressure: obdData.intakeManifoldPressure??null,
                    inletAirTemperature: obdData.inletAirTemperature??null,
                    inletAirFlow: obdData.inletAirFlow??null,
                    absoluteThrottlePosition: obdData.absoluteThrottlePosition??null,
                    ignitionAdvanceAngle: obdData.ignitionAdvanceAngle??null,
                    vehicleVIN: obdData.vehicleVIN??null,
                    vehicleFaultCodes: obdData.vehicleFaultCodes??null,
                    tripID: obdData.tripID??null
                });

            // console.log(`Position saved for device: ${deviceId}`);
        } else {
            const registrationResponse = JT808Request.createRegistrationResponse(deviceId, messageSequence, 0x02, "");
            console.log("Registration Response:", registrationResponse.toString('hex').toUpperCase());
            await socket.write(registrationResponse);
            sendSetParametersCommand(socket, deviceId, messageSequence);

            const commandType = 0x04; // Command type for locking the car

            const requestMessage = JT808Request.createTerminalControlRequest(deviceId, messageSequence, commandType);
            await socket.write(requestMessage);
            console.log(requestMessage.toString('hex')); // Output the message in hex format

            console.warn(`Device not found: ${deviceId}`);
        }
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
    const year = gmt8Date.getFullYear().toString().slice(-2); // Last 2 digits of the year
    const month = String(gmt8Date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(gmt8Date.getDate()).padStart(2, '0');
    const hour = String(gmt8Date.getHours()).padStart(2, '0');
    const minute = String(gmt8Date.getMinutes()).padStart(2, '0');
    const second = String(gmt8Date.getSeconds()).padStart(2, '0');

    // Concatenate components in BCD format
    const bcdDateTime = year + month + day + hour + minute + second;

    return bcdDateTime;
}

module.exports = server;
