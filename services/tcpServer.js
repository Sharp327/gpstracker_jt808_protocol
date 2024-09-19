const net = require('net');
const JT808Parser = require('./jt808Parser');
const JT808Request = require('./jt808Request');
const Device = require('../models/Device');
const Position = require('../models/Position');
const RawData = require('../models/RawData');
const AlarmFlags = require('../models/AlarmFlags');
const StatusFlags = require('../models/StatusFlags');
const OBD_Data = require('../models/OBDData');
const ExtendedData = require('../models/ExtendedData');

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

            trackerStates[deviceId].socket = socket;

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
            } else if (messageId === 0x0200 || messageId === 0x0201 || messageId === 0x0202 || messageId === 0x0203) { // Location Information Report
                await handleLocationReport(parsedData);
                
                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
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
                // console.log(`Heartbeat message: 0x${messageId.toString(16).toUpperCase()}`);
            } else if (messageId === 0x0107) {
                await handleTrackAttributeReport(parsedData);
                
                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, ((!trackerStates[deviceId].registered || !trackerStates[deviceId].authenticated) ? 0x01 : result));
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else if (messageId === 0x0003) {
                console.log("Tracker has logged out:", deviceId);
                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
                console.log("server:", commonRequest.toString('hex').toUpperCase());
                await socket.write(commonRequest);
            } else {
                const commonRequest = JT808Request.createJT808Message(deviceId, messageId, messageSequence, result);
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
                licensePlate,
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
                licensePlate,
            });
            console.log(`Device registered: ${deviceId}`);
        }
    } catch (error) {
        console.error('Error handling terminal registration:', error);
    }
}

async function handleTrackAttributeReport(data) {
    const {
        deviceId,
        simICCID
    } = data;

    try {
        const device = await Device.findOne({ where: { deviceId } });

        if (device) {
            if(simICCID){
                await device.update({
                    iccidCode: simICCID
                });
            }
        }
        
    } catch (error) {
        console.error('Error handling tracker attribute report:', error);
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
        const device = await Device.findOne({ where: { deviceId } });

        if (device) {
            if(extendedData.vinCode){
                await device.update({
                    VIN: extendedData.vinCode
                });
            }
            if(extendedData.iccidCode){
                await device.update({
                    iccidCode: extendedData.iccidCode
                });
            }
            // Save the position to the database
            const positiondata = await Position.create({
                device_id: device.id,
                latitude,
                longitude,
                altitude,
                speed,
                direction,
                timestamp,
            });

            await AlarmFlags.create({
                position_id: positiondata.id,
                ...alarmFlags
            });

            await StatusFlags.create({
                position_id: positiondata.id,
                ...statusFlags
            });

            if(extendedData.OBDData){
                await OBD_Data.create({
                    position_id: positiondata.id,
                    ...extendedData.OBDData
                });
            }

            await ExtendedData.create({
                position_id: positiondata.id,
                ...extendedData,
            });

            console.log(`Position saved for device: ${deviceId}`);
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

module.exports = {
    server,
    trackerStates // Export trackerStates for use in other parts of the application
};
