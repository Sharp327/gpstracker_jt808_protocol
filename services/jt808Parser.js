class JT808Parser {
    static parse(cdata) {
        const data = this.unescapeMessage(cdata);
        // console.log("Raw data:", data.toString('hex').toUpperCase());

        // Remove start and end flags (0x7E) and checksum
        if (data[0] !== 0x7E || data[data.length - 1] !== 0x7E) {
            throw new Error('Invalid packet format');
        }
        // Slice off the start flag, end flag, and checksum
        const packetBody = data.slice(1, -2); // Remove start (1 byte), end (1 byte), and checksum (1 byte)

        // Validate packet length
        if (packetBody.length < 12) {
            throw new Error('Packet too short');
        }

        // Message Header Parsing
        const messageId = packetBody.readUInt16BE(0); // Message ID (2 bytes)
        const messageBodyProperties = packetBody.readUInt16BE(2); // Message Body Properties (2 bytes)
        // console.log("packetBody", packetBody);
        const deviceId = packetBody.slice(4, 10).toString('hex'); // Terminal ID (6 bytes)
        // console.log("deviceId", deviceId);
        const messageSequence = packetBody.readUInt16BE(10); // Message Sequence (2 bytes)

        // Start parsing message body based on messageId
        let parsedData = {
            messageId,
            deviceId,
            messageSequence,
        };

        // console.log("parsedData", parsedData);
        // Switch case to handle different message types
        switch (messageId) {
            case 256:
                parsedData = {
                    ...parsedData,
                    ...this.parseTerminalRegistration(packetBody.slice(12)),
                };
                break;
            case 260:
                parsedData = {
                    ...parsedData,
                    parameters: this.parseSetupTrackerParameters(packetBody.slice(12)),
                };
                break;
            case 512:
                parsedData = {
                    ...parsedData,
                    ...this.parseLocationInfo(packetBody.slice(12)),
                };
                break;
            case 3841:
                parsedData = {
                    ...parsedData,
                };
                break;
            case 513:
                const responseSerialNumber = packetBody.slice(12).readUInt16BE(0); // Response Serial Number (2 bytes)
                const locationInfoData = packetBody.slice(12).slice(2);
                parsedData = {
                    ...parsedData,
                    responseSerialNumber,
                    ...this.parseLocationInfo(locationInfoData),
                };
                break;

            case 258: // Terminal Registration Response
                parsedData = {
                    ...parsedData,
                    ...this.parseTerminalAuthentication(packetBody.slice(12)),
                };
                break;
            case 1: // Terminal Registration Response
                parsedData = {
                    ...parsedData,
                    ...this.parseTerminalGeneralResponse(packetBody.slice(12)),
                };
                break;
            case 2: // Terminal Registration Response
                parsedData = {
                    ...parsedData,
                };
                break;
            case 263: // Request Tracker Attribute Response
                parsedData = {
                    ...parsedData,
                    ...this.parseRequestTrackerAttributeResponse(packetBody.slice(12)),
                };
                break;
            case 2304: // 0x0900 Custom Message
                parsedData = {
                    ...parsedData,
                    ...this.parseTransparentTransmission(packetBody.slice(12)),
                };
                break;
            default:
                console.log(`Unknown Message ID: 0x${messageId.toString(16)}`);
        }

        return parsedData;
    }

    
    static unescapeMessage(message) {
        let unescapedMessage = [];
        for (let i = 0; i < message.length; i++) {
        if (message[i] === 0x7d) {
            // Escape sequences: 0x7d 0x02 -> 0x7e, 0x7d 0x01 -> 0x7d
            if (message[i + 1] === 0x02) {
            unescapedMessage.push(0x7e);
            i++; // Skip the next byte (0x02)
            } else if (message[i + 1] === 0x01) {
            unescapedMessage.push(0x7d);
            i++; // Skip the next byte (0x01)
            }
        } else {
            unescapedMessage.push(message[i]);
        }
        }
        return Buffer.from(unescapedMessage);
    }

  
    static parseSetupTrackerParameters(data) {
        const replyNumber = data.readUInt16BE(0)
        const parameterQuantity = data.readUInt8(2); // First byte is the parameter quantity
        let offset = 3; // Start after the parameter quantity byte
        const parameters = [];

        for (let i = 0; i < parameterQuantity; i++) {
            const parameterId = data.readUInt32BE(offset); // Parameter ID (4 bytes)
            const length = data.readUInt8(offset + 4); // Length of the parameter value (1 byte)
            const value = data.slice(offset + 5, offset + 5 + length); // Parameter value

            parameters.push({
                parameterId,
                length,
                value: value.toString('hex'), // Store value as a hex string
            });

            offset += 5 + length; // Move to the next parameter
        }

        return {
            replyNumber,
            parameterQuantity,
            parameters,
        };
    }

    static parseRequestTrackerAttributeResponse(data) {
        let offset = 0;
        const deviceType = data.readUInt16BE(offset); // Device Type (2 bytes)
        offset += 2;
    
        const factoryId = data.slice(offset, offset + 5).toString('ascii'); // Factory ID (5 bytes)
        offset += 5;
    
        const terminalId = data.slice(offset, offset + 20).toString('hex'); // Terminal ID (20 bytes)
        offset += 20;
    
        const manufactureId = data.slice(offset, offset + 7).toString('ascii'); // Manufacture ID (7 bytes)
        offset += 7;
    
        const simICCID = data.slice(offset, offset + 10).toString('hex'); // SIM ICCID (10 bytes BCD)
        offset += 10;
    
        const hardwareVersionLength = data.readUInt8(offset); // Hardware version length (1 byte)
        offset += 1;
    
        const hardwareVersion = data.slice(offset, offset + hardwareVersionLength).toString('ascii'); // Hardware version
        offset += hardwareVersionLength;
    
        const softwareVersionLength = data.readUInt8(offset); // Software version length (1 byte)
        offset += 1;
    
        const softwareVersion = data.slice(offset, offset + softwareVersionLength).toString('ascii'); // Software version
        offset += softwareVersionLength;
    
        const flag = data.readUInt8(offset); // Flag (1 byte)
        offset += 1;
    
        const messageContent = data.slice(offset).toString('ascii'); // Message Content (GBK/ASCII)
    
        return {
            deviceType,
            factoryId,
            terminalId,
            manufactureId,
            simICCID,
            hardwareVersion,
            softwareVersion,
            flag,
            messageContent
        };
    }

    static parseTerminalAuthentication(data) {
        const authenticationCode = data.toString('ascii'); // The entire body is the authentication code (string)
        return { authenticationCode };
    }

    static parseTerminalGeneralResponse(data) {
        // Terminal General Response Parsing
        const responseSerialNumber = data.readUInt16BE(0); // Response Serial Number (2 bytes)
        const responseId = data.readUInt16BE(2); // Response ID (2 bytes)
        const result = data.readUInt8(4); // Result (1 byte)
    
        return {
            responseSerialNumber,
            responseId,
            result,
        };
    }

    // Parse Terminal Registration Message (0x0100)
    static parseTerminalRegistration(data) {
        const provinceId = data.readUInt16BE(0); // Province ID (2 bytes)
        const cityId = data.readUInt16BE(2); // City ID (2 bytes)
        const manufacturerId = data.slice(4, 9).toString('ascii'); // Manufacturer ID (5 bytes)
        const terminalModel = data.slice(9, 29).toString('ascii').trim(); // Terminal Model (20 bytes)
        const terminalId = data.slice(29, 36).toString('ascii').trim(); // Terminal ID (7 bytes)
        const licensePlateColor = data.readUInt8(36); // License Plate Color (1 byte)
        const licensePlate = data.slice(37).toString('ascii').trim(); // License Plate (Variable length)

        return {
            provinceId,
            cityId,
            manufacturerId,
            terminalModel,
            terminalId,
            licensePlateColor,
            licensePlate,
        };
    }


    static parseLocationInfo(data) {
        if (data.length < 28) {
            throw new Error('Data length is too short for a position message.');
        }

        // Fixed position data
        const alarmFlags = data.readUInt32BE(0); // Alarm Flags (4 bytes)
        const statusFlags = data.readUInt32BE(4); // Status Flags (4 bytes)
        const latitude = data.readUInt32BE(8) / 1e6; // Latitude (4 bytes, scaled by 1e6)
        const longitude = data.readUInt32BE(12) / 1e6; // Longitude (4 bytes, scaled by 1e6)
        const altitude = data.readUInt16BE(16); // Altitude (2 bytes)
        const speed = data.readUInt16BE(18) / 10; // Speed (2 bytes, scaled by 10 to get km/h)
        const direction = data.readUInt16BE(20); // Direction (2 bytes)
        const timestamp = this.parseTimestamp(data.slice(22, 28)); // BCD Timestamp (6 bytes)

        // Parsing alarm flags
        const parsedAlarmFlags = this.parseAlarmFlags(alarmFlags);

        // Parsing status flags
        const parsedStatusFlags = this.parseStatusFlags(statusFlags);

        // Extended data parsing
        let extendedData = {};
        if (data.length > 28) {
            extendedData = this.parseExtendedData(data.slice(28));
        }

        return {
            alarmFlags: parsedAlarmFlags,
            statusFlags: parsedStatusFlags,
            latitude,
            longitude,
            altitude,
            speed,
            direction,
            timestamp,
            ...extendedData
        };
    }

    static parseTimestamp(data) {
        // Parse the timestamp from BCD (Binary-Coded Decimal) format
        const year = 2000 + ((data[0] >> 4) * 10 + (data[0] & 0x0F));
        const month = ((data[1] >> 4) * 10 + (data[1] & 0x0F));
        const day = ((data[2] >> 4) * 10 + (data[2] & 0x0F));
        const hour = ((data[3] >> 4) * 10 + (data[3] & 0x0F));
        const minute = ((data[4] >> 4) * 10 + (data[4] & 0x0F));
        const second = ((data[5] >> 4) * 10 + (data[5] & 0x0F));
    
        // Create a Date object in GMT/UTC
        const gmtDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    
        // Adjust for timezone difference (GMT+8 to GMT 0 is a difference of 13 hours)
        const timezoneOffsetHours = 8;
        const localDate = new Date(gmtDate.getTime() - (timezoneOffsetHours * 60 * 60 * 1000));
    
        return localDate;
    }


    static parseAlarmFlags(alarmFlags) {
        return {
            emergencyAlarm: (alarmFlags & 0x00000001) !== 0,
            overSpeedAlarm: (alarmFlags & 0x00000002) !== 0,
            drivingAlarmMalfunction: (alarmFlags & 0x00000004) !== 0,
            riskWarning: (alarmFlags & 0x00000008) !== 0,
            gnssModuleMalfunction: (alarmFlags & 0x00000010) !== 0,
            gnssAntennaNotConnected: (alarmFlags & 0x00000020) !== 0,
            gnssAntennaShortCircuited: (alarmFlags & 0x00000040) !== 0,
            terminalMainPowerUndervoltage: (alarmFlags & 0x00000080) !== 0,
            terminalMainPowerOff: (alarmFlags & 0x00000100) !== 0,
            terminalLCDMalfunction: (alarmFlags & 0x00000200) !== 0,
            ttsModuleMalfunction: (alarmFlags & 0x00000400) !== 0,
            cameraMalfunction: (alarmFlags & 0x00000800) !== 0,
            roadTransportCertificateICCardModuleMalfunction: (alarmFlags & 0x00001000) !== 0,
            overSpeedWarning: (alarmFlags & 0x00002000) !== 0,
            fatigueDrivingWarning: (alarmFlags & 0x00004000) !== 0,
            reserved1: (alarmFlags & 0x00008000) !== 0,
            accumulatedOverSpeedDrivingTime: (alarmFlags & 0x00010000) !== 0,
            timeoutParking: (alarmFlags & 0x00020000) !== 0,
            enterExitArea: (alarmFlags & 0x00040000) !== 0,
            enterExitRoute: (alarmFlags & 0x00080000) !== 0,
            drivingTimeOfRouteNotEnoughTooLong: (alarmFlags & 0x00100000) !== 0,
            offTrackAlarm: (alarmFlags & 0x00200000) !== 0,
            vehicleVSSMalfunction: (alarmFlags & 0x00400000) !== 0,
            abnormalFuelCapacity: (alarmFlags & 0x00800000) !== 0,
            vehicleStolen: (alarmFlags & 0x01000000) !== 0,
            illegalIgnition: (alarmFlags & 0x02000000) !== 0,
            illegalDisplacement: (alarmFlags & 0x04000000) !== 0,
            collisionWarning: (alarmFlags & 0x08000000) !== 0,
            rolloverWarning: (alarmFlags & 0x10000000) !== 0,
            illegalOpenDoors: (alarmFlags & 0x20000000) !== 0
        };
    }

    static parseStatusFlags(statusFlags) {
        return {
            accOn: (statusFlags & 0x00000001) !== 0,
            positioning: (statusFlags & 0x00000002) !== 0,
            southLatitude: (statusFlags & 0x00000004) !== 0,
            westLongitude: (statusFlags & 0x00000008) !== 0,
            stopRunningStatus: (statusFlags & 0x00000010) !== 0,
            latitudeLongitudeEncrypted: (statusFlags & 0x00000020) !== 0,
            loadStatus: (statusFlags & 0x000000c0) >> 6, // 00: Empty, 01: Half, 02: Reserve, 03: Full
            oilLineDisconnect: (statusFlags & 0x00000400) !== 0,
            circuitDisconnect: (statusFlags & 0x00000800) !== 0,
            door1Open: (statusFlags & 0x00001000) !== 0,
            door2Open: (statusFlags & 0x00002000) !== 0,
            door3Open: (statusFlags & 0x00004000) !== 0,
            door4Open: (statusFlags & 0x00008000) !== 0,
            door5Open: (statusFlags & 0x00010000) !== 0,
            gpsPositioning: (statusFlags & 0x00020000) !== 0,
            beidouPositioning: (statusFlags & 0x00040000) !== 0,
            glonassPositioning: (statusFlags & 0x00080000) !== 0,
            galileoPositioning: (statusFlags & 0x00100000) !== 0
        };
    }

    static parseExtendedData(data) {
        const extendedData = {};
        let offset = 0;

        while (offset < data.length) {
            const extendDataId = data.readUInt8(offset); // Extend Data ID (1 byte)
            if(data.length < (offset + 1)) continue;
            const length = data.readUInt8(offset + 1); // Length of Extend Data (1 byte)
            if(data.length < (offset + 2 + length)) continue;
            const infoData = data.slice(offset + 2, offset + 2 + length); // Extract the extended data

            switch (extendDataId) {
                case 0x01: // Mileage
                    extendedData.mileage = infoData.readUInt32BE(0) / 10; // Mileage (DWORD, 1/10km)
                    break;
                case 0x02: // Fuel capacity
                    extendedData.fuelCapacity = infoData.readUInt16BE(0) / 10; // Fuel capacity (WORD, 1/10L)
                    break;
                case 0x03: // Speed from driving record
                    extendedData.recordedSpeed = infoData.readUInt16BE(0) / 10; // Speed (WORD, 1/10km/h)
                    break;
                case 0x04: // Alarm event ID
                    extendedData.alarmEventId = infoData.readUInt16BE(0); // Alarm event ID (WORD)
                    break;
                case 0x11: // Over speed alarm additional info
                    extendedData.overSpeedAlarmInfo = this.parseOverSpeedAlarmInfo(infoData);
                    break;
                case 0x12: // Enter and exit area/route alarm info
                    extendedData.areaRouteAlarmInfo = this.parseAreaRouteAlarmInfo(infoData);
                    break;
                case 0x13: // Driving time of route alarm info
                    extendedData.drivingTimeAlarmInfo = this.parseDrivingTimeAlarmInfo(infoData);
                    break;
                case 0x25: // Expanded vehicle signal status
                    extendedData.vehicleSignalStatus = this.parseVehicleSignalStatus(infoData);
                    break;
                case 0x2A: // IO status
                    extendedData.ioStatus = this.parseIOStatus(infoData);
                    break;
                case 0x2B: // Analog data
                    extendedData.analogData = infoData.toString('hex'); // Analog data (RAW)
                    break;
                case 0x30: // Network signal strength
                    extendedData.networkSignal = infoData.readUInt8(0); // Network signal (BYTE)
                    break;
                case 0x31: // GNSS satellite number
                    extendedData.gnssSatelliteCount = infoData.readUInt8(0); // GNSS satellite count (BYTE)
                    break;
                case 0xE3: // Battery Voltage
                    extendedData.batteryVoltage = infoData.readUInt16BE(2) * 0.01; // Battery Voltage (WORD, 0.001V)
                    break;
                case 0xF3: // OBD data
                    extendedData.obdData = this.parseOBDData(infoData);
                    break;
                default:
                    extendedData[`custom_${extendDataId}`] = infoData.toString('hex'); // Custom or unknown extend data
                    break;
            }

            // Move to the next extended data item
            offset += 2 + length;
        }

        return extendedData;
    }

    static parseOverSpeedAlarmInfo(data) {
        return {
            locationType: data.readUInt8(0), // Location type (BYTE)
            areaOrRouteId: data.readUInt32BE(1) // Area or route ID (DWORD)
        };
    }

    static parseAreaRouteAlarmInfo(data) {
        return {
            locationType: data.readUInt8(0), // Location type (BYTE)
            areaOrRouteId: data.readUInt32BE(1), // Area or route ID (DWORD)
            direction: data.readUInt8(5) // Direction (BYTE)
        };
    }

    static parseDrivingTimeAlarmInfo(data) {
        return {
            routeId: data.readUInt32BE(0), // Route ID (DWORD)
            drivingTime: data.readUInt16BE(4), // Driving time of the route (WORD, in seconds)
            result: data.readUInt8(6) // Result (BYTE)
        };
    }

    static parseVehicleSignalStatus(data) {
        const bitmask = data.readUInt32BE(0); // Vehicle signal status (DWORD)
        return {
            lowBeamSignal: !!(bitmask & (1 << 0)),
            highBeamSignal: !!(bitmask & (1 << 1)),
            rightIndicatorSignal: !!(bitmask & (1 << 2)),
            leftIndicatorSignal: !!(bitmask & (1 << 3)),
            brakeSignal: !!(bitmask & (1 << 4)),
            reverseSignal: !!(bitmask & (1 << 5)),
            fogLightSignal: !!(bitmask & (1 << 6)),
            outlineMarkerLamps: !!(bitmask & (1 << 7)),
            trumpetSignal: !!(bitmask & (1 << 8)),
            airConditionerStatus: !!(bitmask & (1 << 9)),
            neutralGearSignal: !!(bitmask & (1 << 10)),
            retarderOperation: !!(bitmask & (1 << 11)),
            absOperation: !!(bitmask & (1 << 12)),
            heaterOperation: !!(bitmask & (1 << 13)),
            clutchStatus: !!(bitmask & (1 << 14))
        };
    }

    static parseIOStatus(data) {
        const bitmask = data.readUInt16BE(0); // IO status (WORD)
        return {
            deepDormancy: !!(bitmask & (1 << 0)),
            dormancy: !!(bitmask & (1 << 1))
            // Handle other bits if necessary
        };
    }

    static parseOBDData(data) {
        const obdData = {};
        let offset = 0;
    
        while (offset < data.length) {
            const obdId = data.readUInt16BE(offset); // OBD Data ID (2 bytes)
            const length = data.readUInt8(offset + 2); // Length of OBD Data (1 byte)
            const obdInfo = data.slice(offset + 3, offset + 3 + length); // Extract the OBD data
    
            switch (obdId) {
                case 0x0002: // Vehicle speed
                    obdData.vehicleSpeed = obdInfo.readUInt16BE(0) * 0.1; // Speed (0.1KM/H)
                    break;
                case 0x0003: // Engine speed
                    obdData.engineSpeed = obdInfo.readUInt16BE(0); // RPM
                    break;
                case 0x0004: // Battery voltage
                    obdData.obdBatteryVoltage = obdInfo.readUInt16BE(0) * 0.001; // Voltage (0.001V)
                    break;
                case 0x0005: // Total vehicle mileage
                    obdData.totalMileage = obdInfo.readUInt32BE(0) * 0.1; // Mileage (0.1KM)
                    break;
                case 0x0006: // Instantaneous fuel consumption at idle speed
                    obdData.idleFuelConsumption = obdInfo.readUInt16BE(0) * 0.1; // Fuel consumption (0.1L/H)
                    break;
                case 0x0007: // Instantaneous fuel consumption during driving
                    obdData.drivingFuelConsumption = obdInfo.readUInt16BE(0) * 0.1; // Fuel consumption (0.1L/100KM)
                    break;
                case 0x0008: // Engine load
                    obdData.engineLoad = obdInfo.readUInt8(0); // Load (0-100%)
                    break;
                case 0x0009: // Coolant temperature
                    obdData.coolantTemperature = obdInfo.readInt16BE(0) - 40; // Temperature (-40 to 215°C)
                    break;
                case 0x000B: // Intake manifold absolute pressure
                    obdData.intakeManifoldPressure = obdInfo.readUInt16BE(0); // Pressure (0-500 KPA)
                    break;
                case 0x000C: // Inlet air temperature
                    obdData.inletAirTemperature = obdInfo.readInt16BE(0) - 40; // Temperature (-40 to 215°C)
                    break;
                case 0x000D: // Inlet air flow
                    obdData.inletAirFlow = obdInfo.readUInt16BE(0) / 100; // Air flow (G/S)
                    break;
                case 0x000E: // Absolute throttle position
                    obdData.absoluteThrottlePosition = obdInfo.readUInt8(0) * 100 / 255; // Throttle position (0-100%)
                    break;
                case 0x000F: // Ignition advance angle
                    obdData.ignitionAdvanceAngle = (obdInfo.readUInt8(0) * 0.5) - 64; // Advance angle (degrees)
                    break;
                case 0x0050: // Vehicle VIN number
                    obdData.vehicleVIN = obdInfo.toString('ascii'); // VIN number
                    break;
                case 0x0051: // Vehicle fault codes
                    obdData.vehicleFaultCodes = this.parseFaultCodes(obdInfo); // Fault codes
                    break;
                case 0x0052: // The trip ID
                    obdData.tripID = obdInfo.readUInt32BE(0); // Trip ID
                    break;
                // Handle other OBD data items here...
                default:
                    obdData[`custom_obd_${obdId.toString('hex')}`] = obdInfo.toString('hex'); // Custom or unknown OBD data
                    break;
            }
    
            // Move to the next OBD data item
            offset += 3 + length;
        }
    
        return obdData;
    }
    
    static parseFaultCodes(data) {
        // Example of parsing fault codes
        const faultCodes = [];
        for (let i = 0; i < data.length; i += 2) {
            const code = data.readUInt16BE(i).toString(16).padStart(4, '0').toUpperCase();
            faultCodes.push(code);
        }
        return faultCodes;
    }


    static parseTransparentTransmission(data) {
        const result = {};
    
        // Transparent message type
        result.transparentMessageType = data.readUInt8(0);
    
        // Based on the transparent message type, we parse the content differently
        const content = data.slice(1);
    
        switch (result.transparentMessageType) {
            case 0x00: // GNSS module detailed positioning data
                result.gnssData = this.parseGnssData(content);
                break;
            case 0x01: // Road transport license IC card information
                result.roadTransportLicense = this.parseRoadTransportLicense(content);
                break;
            case 0x02: // Serial port 1 transparent transmission
            case 0x03: // Serial port 2 transparent transmission
                result.serialPortTransmission = this.parseSerialPortTransmission(content);
                break;
            case 0xF0: // User-defined transparent transmission
            case 0xF1: // User-defined transparent transmission
            case 0xF2: // User-defined transparent transmission
            case 0xF3: // User-defined transparent transmission
            case 0xF4: // User-defined transparent transmission
                result.userDefinedTransmission = this.parseUserDefinedTransmission(content);
                break;
            default:
                result.unknownTransmission = content.toString('hex'); // Unknown message type
                break;
        }
    
        return result;
    }
    
    static parseGnssData(content) {
        // Example static to parse GNSS data
        // This would depend on the specific format used for GNSS data
        return {
            latitude: content.readUInt32BE(0) / 1e6,
            longitude: content.readUInt32BE(4) / 1e6,
            altitude: content.readUInt16BE(8),
            speed: content.readUInt16BE(10) / 10,
            direction: content.readUInt16BE(12),
            timestamp: this.parseTimestamp(content.slice(14, 20))
        };
    }
    
    static parseRoadTransportLicense(content) {
        // Example static to parse road transport license IC card information
        return {
            licenseNumber: content.toString('ascii', 0, 20).trim(),
            issuedDate: this.parseTimestamp(content.slice(20, 26)),
            expiryDate: this.parseTimestamp(content.slice(26, 32))
        };
    }
    
    static parseSerialPortTransmission(content) {
        // Example static to parse serial port transmission data
        return {
            portNumber: content.readUInt8(0),
            data: content.slice(1).toString('hex')
        };
    }
    
    static parseUserDefinedTransmission(content) {
        // Example static to parse user-defined transparent transmission data
        return {
            transmissionId: content.readUInt16BE(0),
            dataLength: content.readUInt16BE(2),
            data: content.slice(4, 4 + content.readUInt16BE(2)).toString('hex')
        };
    }
    
}

module.exports = JT808Parser;
