class JT808Parser {
    static parse(cdata) {
        const data = this.unescapeMessage(cdata);

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
        const deviceId = packetBody
            .slice(4, 10)
            .toString('hex'); // Terminal ID (6 bytes)
        const messageSequence = packetBody.readUInt16BE(10); // Message Sequence (2 bytes)

        // Start parsing message body based on messageId
        let parsedData = {
            messageId,
            deviceId,
            messageSequence
        };

        // console.log("parsedData", parsedData); Switch case to handle different
        // message types
        switch (messageId) {
            case 256:
                parsedData = {
                    ...parsedData,
                    ...this.parseTerminalRegistration(packetBody.slice(12))
                };
                break;
            case 260:
                parsedData = {
                    ...parsedData,
                    parameters: this.parseSetupTrackerParameters(packetBody.slice(12))
                };
                break;
            case 512:
            case 513:
            case 514:
            case 515:
                parsedData = {
                    ...parsedData,
                    ...this.parseLocationInfo(packetBody.slice(12))
                };
                break;
            case 3841:
                parsedData = {
                    ...parsedData
                };
                break;
            case 258:
                parsedData = {
                    ...parsedData,
                    ...this.parseTerminalAuthentication(packetBody.slice(12))
                };
                break;
            case 1:
                parsedData = {
                    ...parsedData,
                    ...this.parseTerminalGeneralResponse(packetBody.slice(12))
                };
                break;
            case 2:
                parsedData = {
                    ...parsedData
                };
                break;
            case 263:
                parsedData = {
                    ...parsedData,
                    ...this.parseRequestTrackerAttributeResponse(packetBody.slice(12))
                };
                break;
            case 2304: // 0x0900 Custom Message
                parsedData = {
                    ...parsedData,
                    ...this.parseTransparentTransmission(packetBody.slice(12))
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
                parameterId, length, value: value.toString('hex'), // Store value as a hex string
            });

            offset += 5 + length; // Move to the next parameter
        }

        return {replyNumber, parameterQuantity, parameters};
    }

    static parseRequestTrackerAttributeResponse(data) {
        let offset = 0;

        // Terminal Type (WORD - 2 bytes)
        const terminalType = data.readUInt16BE(offset);
        offset += 2;

        // Manufacturer ID (BYTE[5] - 5 bytes, ASCII)
        const manufacturerId = data
            .slice(offset, offset + 5)
            .toString('ascii');
        offset += 5;

        // Terminal Model (BYTE[20] - 20 bytes, ASCII)
        const terminalModel = data
            .slice(offset, offset + 20)
            .toString('ascii')
            .replace(/\0/g, ''); // Removing null bytes
        offset += 20;

        // Terminal ID (BYTE[7] - 7 bytes, ASCII)
        const terminalId = data
            .slice(offset, offset + 7)
            .toString('ascii')
            .replace(/\0/g, '');
        offset += 7;

        // SIM ICCID (BCD[10] - 10 bytes)
        const simICCID = data
            .slice(offset, offset + 10)
            .toString('hex');
        offset += 10;

        // Terminal Hardware Edition
        const hardwareVersionLength = data.readUInt8(offset); // Length of the hardware version (1 byte)
        offset += 1;
        const hardwareVersion = data
            .slice(offset, offset + hardwareVersionLength)
            .toString('ascii');
        offset += hardwareVersionLength;

        // Terminal Firmware Version
        const firmwareVersionLength = data.readUInt8(offset); // Length of the firmware version (1 byte)
        offset += 1;
        const firmwareVersion = data
            .slice(offset, offset + firmwareVersionLength)
            .toString('ascii');
        offset += firmwareVersionLength;

        // GNSS Module Type (1 byte flags)
        const gnssModuleType = data.readUInt8(offset);
        offset += 1;

        // Communication Module (1 byte flags)
        const communicationModule = data.readUInt8(offset);
        offset += 1;

        // Parsing GNSS Module flags (bitwise operations)
        const supportsGPS = (gnssModuleType & 0b00000001) !== 0;
        const supportsBeidou = (gnssModuleType & 0b00000010) !== 0;
        const supportsGLONASS = (gnssModuleType & 0b00000100) !== 0;
        const supportsGalileo = (gnssModuleType & 0b00001000) !== 0;

        // Parsing Communication Module flags
        const supportsGPRS = (communicationModule & 0b00000001) !== 0;
        const supportsCDMA = (communicationModule & 0b00000010) !== 0;
        const supportsTDSCDMA = (communicationModule & 0b00000100) !== 0;
        const supportsWCDMA = (communicationModule & 0b00001000) !== 0;
        const supportsCDMA2000 = (communicationModule & 0b00010000) !== 0;
        const supportsTDLTE = (communicationModule & 0b00100000) !== 0;
        const supportsOtherCommunication = (communicationModule & 0b10000000) !== 0;

        // Additional message content (GBK/ASCII)
        const messageContent = data
            .slice(offset)
            .toString('ascii');

        return {
            terminalType,
            manufacturerId,
            terminalModel,
            terminalId,
            simICCID,
            hardwareVersion,
            firmwareVersion,
            gnssModule: {
                supportsGPS,
                supportsBeidou,
                supportsGLONASS,
                supportsGalileo
            },
            communicationModule: {
                supportsGPRS,
                supportsCDMA,
                supportsTDSCDMA,
                supportsWCDMA,
                supportsCDMA2000,
                supportsTDLTE,
                supportsOtherCommunication
            },
            messageContent
        };
    }

    static parseTerminalAuthentication(data) {
        const authenticationCode = data.toString('ascii'); // The entire body is the authentication code (string)
        return {authenticationCode};
    }

    static parseTerminalGeneralResponse(data) {
        // Terminal General Response Parsing
        const responseSerialNumber = data.readUInt16BE(0); // Response Serial Number (2 bytes)
        const responseId = data.readUInt16BE(2); // Response ID (2 bytes)
        const result = data.readUInt8(4); // Result (1 byte)

        return {responseSerialNumber, responseId, result};
    }

    // Parse Terminal Registration Message (0x0100)
    static parseTerminalRegistration(data) {
        const provinceId = data.readUInt16BE(0); // Province ID (2 bytes)
        const cityId = data.readUInt16BE(2); // City ID (2 bytes)
        const manufacturerId = data
            .slice(4, 9)
            .toString('ascii'); // Manufacturer ID (5 bytes)
        const terminalModel = data
            .slice(9, 29)
            .toString('ascii')
            .trim(); // Terminal Model (20 bytes)
        const terminalId = data
            .slice(29, 36)
            .toString('ascii')
            .trim(); // Terminal ID (7 bytes)
        const licensePlateColor = data.readUInt8(36); // License Plate Color (1 byte)
        const licensePlate = data
            .slice(37)
            .toString('ascii')
            .trim(); // License Plate (Variable length)

        return {
            provinceId,
            cityId,
            manufacturerId,
            terminalModel,
            terminalId,
            licensePlateColor,
            licensePlate
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
            extendedData
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
        const localDate = new Date(
            gmtDate.getTime() - (timezoneOffsetHours * 60 * 60 * 1000)
        );

        return localDate;
    }

    static parseAlarmFlags(alarmFlags) {
        return {
            overspeedAlarm: (alarmFlags & 0x00000001) !== 0, // Bit 1
            fatigueDriving: (alarmFlags & 0x00000002) !== 0, // Bit 2
            terminalMainPowerUndervoltage: (alarmFlags & 0x00000080) !== 0, // Bit 7
            terminalMainPowerOff: (alarmFlags & 0x00000100) !== 0, // Bit 8
            highWaterTemperature: (alarmFlags & 0x00001000) !== 0, // Bit 12
            idling: (alarmFlags & 0x00002000) !== 0, // Bit 13
            vibrationAlarm: (alarmFlags & 0x00010000) !== 0, // Bit 16
            sharpTurn: (alarmFlags & 0x00020000) !== 0, // Bit 17
            illegalVehicleMovement: (alarmFlags & 0x01000000) !== 0, // Bit 28
            collisionAlarm: (alarmFlags & 0x02000000) !== 0 // Bit 29
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
        let index = 0;
        const additionalInfo = {};

        while (index < data.length) {
            const infoId = data.readUInt8(index); // Info ID (1 byte)

            if (data.length < (index + 1)) 
                continue;
            const length = data.readUInt8(index + 1); // Length of Extend Data (1 byte)
            if (data.length < (index + 2 + length)) 
                continue;
            const infoData = data.slice(index + 2, index + 2 + length); // Extract the extended data

            switch (infoId) {
                case 0x01: // Mileage
                    additionalInfo.mileage = infoData.readUInt32BE(0) / 10; // 1/10 km
                    break;

                case 0x02: // Fuel level
                    additionalInfo.fuelLevel = infoData.readUInt16BE(0) / 10; // 1/10 L
                    break;

                case 0x03: // Speed from driving recorder
                    additionalInfo.recorderSpeed = infoData.readUInt16BE(0) / 10; // 1/10 km/h
                    break;

                case 0x04: // ID  of  the  alarm  event  needs  to  be  manually  confirmed
                    additionalInfo.manualAlarmCount = infoData.readUInt16BE(0); // manual alarm count
                    break;

                case 0x31: // Number of GPS satellites
                    additionalInfo.numberOfGPSSatellites = infoData.readUInt8(0); // 1 byte
                    break;
    
                case 0x51: // 16 bytes of 8-channel temperatures
                    additionalInfo.temperatures = [];
                    for (let i = 0; i < length / 2; i++) {
                        additionalInfo.temperatures.push(infoData.readUInt16BE(i * 2));
                    }
                    break;
    
                case 0x52: // Forward reversal status
                    additionalInfo.forwardReversal = infoData.readUInt8(0); // 1 byte
                    break;
    
                case 0x53: // 2G base station data
                    const numBaseStations = infoData.readUInt8(0);
                    additionalInfo.baseStations = [];
                    for (let i = 0; i < numBaseStations; i++) {
                        const baseStation = {
                            MCC: infoData.readUInt16BE(1 + i * 8),
                            MNC: infoData.readUInt8(3 + i * 8),
                            LAC: infoData.readUInt16BE(4 + i * 8),
                            CELLID: infoData.readUInt16BE(6 + i * 8),
                            signalStrength: infoData.readUInt8(8 + i * 8)
                        };
                        additionalInfo.baseStations.push(baseStation);
                    }
                    break;
    
                case 0x54: // Wi-Fi data
                    const numWifi = infoData.readUInt8(0);
                    additionalInfo.wifiData = [];
                    for (let i = 0; i < numWifi; i++) {
                        const wifi = {
                            mac: infoData.slice(1 + i * 7, 1 + i * 7 + 6).toString('hex'), // WiFi MAC address (6 bytes)
                            signalStrength: infoData.readUInt8(7 + i * 7) // Signal strength (1 byte)
                        };
                        additionalInfo.wifiData.push(wifi);
                    }
                    break;
    
                case 0x56: // Internal battery power
                    additionalInfo.internalBatteryPower = {
                        level: infoData.readUInt8(0), // Power level 0-10
                        percentage: infoData.readUInt8(1) // Power percentage 1-100 (if supported)
                    };
                    break;
    
                case 0x5D: // 4G base station data
                    const num4GBaseStations = infoData.readUInt8(0);
                    additionalInfo.baseStations4G = [];
                    for (let i = 0; i < num4GBaseStations; i++) {
                        const baseStation4G = {
                            MCC: infoData.readUInt16BE(1 + i * 10),
                            MNC: infoData.readUInt8(3 + i * 10),
                            LAC: infoData.readUInt16BE(4 + i * 10),
                            CELLID: infoData.readUInt32BE(6 + i * 10),
                            signalStrength: infoData.readUInt8(10 + i * 10)
                        };
                        additionalInfo.baseStations4G.push(baseStation4G);
                    }
                    break;
    
                case 0x61: // Main power supply voltage
                    additionalInfo.mainPowerSupplyVoltage = infoData.readUInt16BE(0) * 0.01; // Voltage in 0.01V
                    break;
    
                case 0xF1: // ICCID for terminal authentication
                    additionalInfo.iccidCode = infoData
                        .slice(0, length)
                        .toString('ascii');
                    break;
    
                case 0xF3: //  OBD Data | Fortification/withdrawal state
                    if(length == 1){
                        additionalInfo.fortificationState = infoData.readUInt8(0) === 0x01 ? 'fortification' : 'withdrawal';
                    }else{
                        additionalInfo.OBDData = this.parseOBDData(infoData);
                    }
                    break;
    
                case 0xF4: // Extended alarm bit (16 bits)
                    additionalInfo.extendedAlarm = {
                        accelerationAlarm: !!(infoData.readUInt16BE(0) & 0x0001),
                        sharpDecelerationAlarm: !!(infoData.readUInt16BE(0) & 0x0002),
                        suddenBrakeAlarm: !!(infoData.readUInt16BE(0) & 0x0004),
                        sharpTurnAlarm: !!(infoData.readUInt16BE(0) & 0x0008),
                        collisionAlarm: !!(infoData.readUInt16BE(0) & 0x0010),
                        sideOverAlarm: !!(infoData.readUInt16BE(0) & 0x0020),
                        highTemperatureAlarm: !!(infoData.readUInt16BE(0) & 0x0100)
                    };
                    break;
    
                case 0xF5: // 3-axis g-sensor data
                    additionalInfo.gSensorData = {
                        xAxis: infoData.readInt16BE(0), // X-axis data (2 bytes)
                        yAxis: infoData.readInt16BE(2), // Y-axis data (2 bytes)
                        zAxis: infoData.readInt16BE(4) // Z-axis data (2 bytes)
                    };
                    break;
    
                case 0xF6: // Wireless device working mode
                    additionalInfo.wirelessDeviceMode = {
                        deviceMode: infoData.readUInt8(0), // Device working mode
                        positioningMode: infoData.readUInt8(1) // Positioning mode (e.g. Wi-Fi, GPS)
                    };
                    break;
                    
                case 0x25: //  Extended  vehicle  signal  status  bit,  see  table  for  definition
                    additionalInfo.vehicleSignalStatus = this.parseVehicleSignalStatus(infoData); // parse Vehicle Signal Status
                    break;

                case 0x2A: //  IO  status  bit,  see  Table  8-23  for  definition
                    additionalInfo.IOStatus = this.parseIOStatus(infoData); // parse IO Status
                    break;

                case 0x2B: //  Analog,  bit0-15, AD0;  bit16-31, AD1
                    additionalInfo.analogBit = infoData.readUInt32BE(0); // analog bit
                    break;

                case 0x30: // Wireless network signal strength
                    additionalInfo.signalStrength = infoData.readUInt8(0);
                    break;

                case 0x80: // Instantaneous speed
                    additionalInfo.instantaneousSpeed = infoData.readUInt8(0); // km/h
                    break;

                case 0x81: // Engine speed
                    additionalInfo.engineSpeed = infoData.readUInt16BE(0); // RPM
                    break;

                case 0x82: // Battery voltage
                    additionalInfo.batteryVoltage = infoData.readUInt16BE(0) / 10; // 0.1 V
                    break;

                case 0x83: // Engine load
                    additionalInfo.engineLoad = infoData.readUInt8(0); // percentage
                    break;

                case 0x84: // Coolant temperature
                    additionalInfo.coolantTemperature = infoData.readUInt8(0) - 40; // Celsius
                    break;

                case 0x85: // Instantaneous fuel consumption
                    additionalInfo.instantaneousFuelConsumption = infoData.readUInt16BE(0); // ML/H
                    break;

                case 0x86: // Intake air temperature
                    additionalInfo.intakeAirTemperature = infoData.readUInt8(0) - 40; // Celsius
                    break;

                case 0x87: // Airflow
                    additionalInfo.airflow = infoData.readUInt16BE(0); // g/s
                    break;

                case 0x88: // Absolute manifold pressure
                    additionalInfo.manifoldPressure = infoData.readUInt8(0); // kPa
                    break;

                case 0x89: // Throttle position
                    additionalInfo.throttlePosition = infoData.readUInt8(0); // percentage
                    break;

                case 0x8A: // Fuel pressure
                    additionalInfo.fuelPressure = infoData.readUInt16BE(0); // kPa
                    break;

                case 0x8B: // VIN code
                    additionalInfo.vinCode = infoData
                        .slice(0, length)
                        .toString('ascii');
                    break;

                case 0x8C: // Total mileage
                    additionalInfo.totalMileage = infoData.readUInt32BE(0) / 10; // 1/10 km
                    break;

                case 0x8D: // Remaining mileage
                    additionalInfo.remainingMileage = infoData.readUInt16BE(0); // km
                    break;

                case 0x8E: // Fuel level percentage
                    additionalInfo.fuelLevelPercentage = infoData.readUInt8(0); // percentage
                    break;

                case 0x8F: // Rapid accelerations during trip
                    additionalInfo.rapidAccelerations = infoData.readUInt8(0); // count
                    break;

                case 0x90: // Rapid decelerations during trip
                    additionalInfo.rapidDecelerations = infoData.readUInt8(0); // count
                    break;

                case 0x91: // Sharp turns during trip
                    additionalInfo.sharpTurns = infoData.readUInt8(0); // count
                    break;

                case 0x92: // Distance traveled during trip
                    additionalInfo.distanceTraveled = infoData.readUInt32BE(0) / 10; // 1/10 km
                    break;

                case 0x93: // Fuel consumption during trip
                    additionalInfo.fuelConsumption = infoData.readUInt16BE(0); // ML
                    break;

                case 0x94: // Average speed during trip
                    additionalInfo.averageSpeed = infoData.readUInt16BE(0); // km/h
                    break;

                case 0x95: // Maximum speed during trip
                    additionalInfo.maxSpeed = infoData.readUInt16BE(0); // km/h
                    break;

                case 0x96: // Overspeed events during trip
                    additionalInfo.overspeedEvents = infoData.readUInt8(0); // count
                    break;

                case 0x97: // Idle events during trip
                    additionalInfo.idleEvents = infoData.readUInt8(0); // count
                    break;

                case 0x98: // Total fuel consumption
                    additionalInfo.totalFuelConsumption = infoData.readUInt32BE(0) / 10; // 1/10 L
                    break;

                case 0x9F: // Base station information
                    additionalInfo.baseStationInfo = this.parseBaseStationInfo(infoData); // Parse separately
                    break;

                case 0xA0: // Fault code information
                    additionalInfo.faultCodeInfo = this.parseFaultCodeInfo(infoData); // Parse separately
                    break;

                case 0xCC: // ICCID code
                    additionalInfo.iccidCode = infoData
                        .slice(0, length)
                        .toString('ascii');
                    break;

                default:
                    additionalInfo[`custom_${infoId}`] = infoData.toString('hex'); // Custom or unknown extend data
            }

            index += 2 + length;
        }

        return additionalInfo;
    }

    static parseBaseStationInfo(data) {
        const baseStationInfo = data.toString('ascii');
        const parts = baseStationInfo.split(',');
        return {
            MCC: parts[0],
            MNC: parts[1],
            LAC: parts[2],
            CELLID: parts[3],
            SignalStrength: parts[4],
            nearbyStations: parts.slice(5)
        };
    }

    static parseFaultCodeInfo(data) {
        const faultCodeInfo = data.toString('ascii');
        console.log("faultCodeInfo", faultCodeInfo);
        return faultCodeInfo.split(',');
    }

    static parseOBDData(data) {
        let index = 0;
        const additionalInfo = {};

        while (index < data.length) {
            const infoId = data.readUInt16BE(index); // Info ID (WORD = 2 bytes)

            if (data.length < (index + 2)) 
                continue;
            const length = data.readUInt8(index + 2); // Length of Extend Data (BYTE = 1 byte)
            if (data.length < (index + 3 + length)) 
                continue;
            const infoData = data.slice(index + 3, index + 3 + length); // Extract the extended data

            switch (infoId) {
                case 0x0002: // Vehicle speed
                    additionalInfo.vehicleSpeed = infoData.readUInt16BE(0) / 10; // 0.1 KM/H
                    break;

                case 0x0003: // Engine speed
                    additionalInfo.engineSpeed = infoData.readUInt16BE(0); // RPM
                    break;

                case 0x0004: // Battery voltage
                    additionalInfo.batteryVoltage = infoData.readUInt16BE(0) * 0.001; // 0.001 V
                    break;

                case 0x0005: // Total vehicle mileage
                    additionalInfo.totalMileage = infoData.readUInt32BE(0) / 10; // 0.1 KM
                    break;

                case 0x0006: // Idle instantaneous fuel consumption
                    additionalInfo.idleFuelConsumption = infoData.readUInt16BE(0) / 10; // 0.1 L/H
                    break;

                case 0x0007: // Driving instantaneous fuel consumption
                    additionalInfo.drivingFuelConsumption = infoData.readUInt16BE(0) / 10; // 0.1 L/100 KM
                    break;

                case 0x0008: // Engine load
                    additionalInfo.engineLoad = infoData.readUInt8(0); // 0-100 %
                    break;

                case 0x0009: // Coolant temperature
                    additionalInfo.coolantTemperature = infoData.readInt16BE(0) - 40; // -40 to 215 °C
                    break;

                case 0x000B: // Intake manifold absolute pressure
                    additionalInfo.intakeManifoldPressure = infoData.readUInt16BE(0); // 0-500 KPA
                    break;

                case 0x000C: // Intake temperature
                    additionalInfo.intakeTemperature = infoData.readInt16BE(0) - 40; // -40 to 215 °C
                    break;

                case 0x000D: // Intake flow
                    additionalInfo.intakeFlow = infoData.readUInt16BE(0) / 100; // 0-655.35 G/S
                    break;

                case 0x000E: // Throttle position
                    additionalInfo.throttlePosition = (infoData.readUInt8(0) * 100) / 255; // 0-100 %
                    break;

                case 0x000F: // Ignition advance angle
                    additionalInfo.ignitionAdvance = (infoData.readUInt8(0) * 0.5) - 64; // Degrees
                    break;

                case 0x0050: // Vehicle VIN code
                    additionalInfo.vinCode = infoData.toString('ascii'); // VIN code
                    break;

                case 0x0051: // Vehicle fault code
                    additionalInfo.faultCode = infoData.toString('hex'); // Fault code in hex
                    break;

                case 0x0052: // Trip ID
                    additionalInfo.tripId = infoData.readUInt32BE(0); // Trip ID
                    break;

                case 0x0100: // Trip total mileage (from ignition to stop)
                    additionalInfo.tripMileage = infoData.readUInt16BE(0) / 10; // 0.1 KM
                    break;

                case 0x0101: // Total mileage since terminal connection
                    additionalInfo.totalMileageSinceConnection = infoData.readUInt32BE(0) / 10; // 0.1 KM
                    break;

                case 0x0102: // Trip total fuel consumption (from ignition to stop)
                    additionalInfo.tripFuelConsumption = infoData.readUInt16BE(0) / 10; // 0.1 L
                    break;

                case 0x0103: // Total fuel consumption since terminal connection
                    additionalInfo.totalFuelConsumption = infoData.readUInt32BE(0) / 10; // 0.1 L
                    break;

                case 0x0104: // Average fuel consumption for the trip
                    additionalInfo.averageFuelConsumption = infoData.readUInt16BE(0) / 10; // 0.1 L/100 KM
                    break;

                case 0x0105: // Overspeed duration for the trip
                    additionalInfo.overspeedDuration = infoData.readUInt32BE(0); // Seconds
                    break;

                case 0x0106: // High engine speed counts for the trip
                    additionalInfo.highEngineSpeedCounts = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0107: // High engine speed duration for the trip
                    additionalInfo.highEngineSpeedDuration = infoData.readUInt32BE(0); // Seconds
                    break;

                case 0x0108: // Excessive idle counts for the trip
                    additionalInfo.excessiveIdleCounts = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0109: // Total idle duration for the trip
                    additionalInfo.totalIdleDuration = infoData.readUInt32BE(0); // Seconds
                    break;

                case 0x010A: // Total idle fuel consumption for the trip
                    additionalInfo.totalIdleFuelConsumption = infoData.readUInt16BE(0) / 10; // 0.1 L
                    break;

                case 0x010B: // Fatigue driving total duration for the trip
                    additionalInfo.fatigueDrivingDuration = infoData.readUInt32BE(0); // Seconds
                    break;

                case 0x010C: // Average speed for the trip
                    additionalInfo.averageTripSpeed = infoData.readUInt16BE(0) / 10; // 0.1 KM/H
                    break;

                case 0x010D: // Maximum speed for the trip
                    additionalInfo.maxTripSpeed = infoData.readUInt16BE(0) / 10; // 0.1 KM/H
                    break;

                case 0x010E: // Maximum engine speed for the trip
                    additionalInfo.maxEngineSpeed = infoData.readUInt16BE(0); // RPM
                    break;

                case 0x010F: // Maximum engine water temperature for the trip
                    additionalInfo.maxEngineWaterTemp = infoData.readInt16BE(0); // °C
                    break;

                case 0x0110: // Maximum voltage for the trip
                    additionalInfo.maxTripVoltage = infoData.readUInt16BE(0) * 0.001; // 0.001 V
                    break;

                case 0x0111: // Overspeed count for the trip
                    additionalInfo.overspeedCount = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0112: // Sudden acceleration count for the trip
                    additionalInfo.suddenAccelerationCount = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0113: // Sudden deceleration count for the trip
                    additionalInfo.suddenDecelerationCount = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0114: // Sharp turn count for the trip
                    additionalInfo.sharpTurnCount = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0115: // Sudden lane change count for the trip
                    additionalInfo.suddenLaneChangeCount = infoData.readUInt16BE(0); // Counts
                    break;

                case 0x0116: // Sudden braking count for the trip
                    additionalInfo.suddenBrakingCount = infoData.readUInt16BE(0); // Counts
                    break;

                default:
                    additionalInfo[`custom_${infoId.toString(16)}`] = infoData.toString('hex'); // Custom or unknown data
            }

            index += 3 + length;
        }

        return additionalInfo;
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
        return {
            licenseNumber: content
                .toString('ascii', 0, 20)
                .trim(),
            issuedDate: this.parseTimestamp(content.slice(20, 26)),
            expiryDate: this.parseTimestamp(content.slice(26, 32))
        };
    }

    static parseSerialPortTransmission(content) {
        return {
            portNumber: content.readUInt8(0), data: content
                .slice(1)
                .toString('hex')
        };
    }

    static parseUserDefinedTransmission(content) {
        return {
            transmissionId: content.readUInt16BE(0),
            dataLength: content.readUInt16BE(2),
            data: content
                .slice(4, 4 + content.readUInt16BE(2))
                .toString('hex')
        };
    }

}

module.exports = JT808Parser;
