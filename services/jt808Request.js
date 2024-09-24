const net = require('net');
const iconv = require('iconv-lite');

class JT808Request {
    static createTimeSyncResponse(result, timestamp) {
        // Message ID: 0x8F01
        const messageId = Buffer.from([0x8F, 0x01]);

        // Result: 1 byte
        const resultByte = Buffer.from([result]);

        // Timestamp: BCD[6] (YYMMDDhhmmss)
        const timestampBuffer = Buffer.from(timestamp, 'hex'); // Ensure timestamp is in BCD format

        // Message Body
        const body = Buffer.concat([resultByte, timestampBuffer]);

        // Message Length
        const messageLength = Buffer.alloc(2);
        messageLength.writeUInt16BE(body.length, 0);

        // Build the entire header
        const header = Buffer.concat([messageId, messageLength]);

        // Full message without start and end flags
        const fullMessage = Buffer.concat([header, body]);

        // Calculate checksum (XOR of all bytes except start and end markers)
        let checksum = 0;
        for (let i = 0; i < fullMessage.length; i++) {
            checksum ^= fullMessage[i];
        }

        // Final message with start, body, checksum, and end flags
        let message = Buffer.concat([
            Buffer.from([0x7E]),
            fullMessage,
            Buffer.from([checksum]),
            Buffer.from([0x7E])
        ]);

        return message;
    }

    // Function to create JT808 message for response
    static createJT808Message(deviceId, responseId, responseSerialNumber, result) {
        // Define the message ID
        const messageId = Buffer.from([0x80, 0x01]); // Message ID: 0x8001

        // Define the message body fields
        const responseSerialNumberBuffer = Buffer.alloc(2);
        responseSerialNumberBuffer.writeUInt16BE(responseSerialNumber, 0);

        const responseIdBuffer = Buffer.alloc(2);
        responseIdBuffer.writeUInt16BE(responseId, 0);

        const resultBuffer = Buffer.from([result]); // Result is a single byte

        // Combine message body fields
        const body = Buffer.concat(
            [responseSerialNumberBuffer, responseIdBuffer, resultBuffer]
        );

        // Define the Terminal ID (deviceId) and sequence number
        const deviceIdBuffer = Buffer.from(deviceId, 'hex'); // Terminal ID (6 bytes)
        const seqNumber = Buffer.alloc(2);
        seqNumber.writeUInt16BE(0, 0);

        // Define the length of the message body
        const messageBodyProperties = Buffer.alloc(2);
        messageBodyProperties.writeUInt16BE(body.length, 0); // Length of body

        // Create the full message header
        const header = Buffer.concat(
            [messageId, messageBodyProperties, deviceIdBuffer, seqNumber]
        );

        // Concatenate header and body
        const fullMessage = Buffer.concat([header, body]);

        // Calculate checksum (XOR of all bytes except start and end markers)
        let checksum = 0;
        for (let i = 0; i < fullMessage.length; i++) {
            checksum ^= fullMessage[i];
        }

        // Create the final message with start and end markers
        let message = Buffer.concat([
            Buffer.from([0x7E]), // Start marker
            fullMessage,
            Buffer.from([checksum]), // Checksum
            Buffer.from([0x7E]) // End marker
        ]);

        return message;
    }

    static createRegistrationResponse(deviceId, sequenceNumber, result, authCode) {
        const messageId = Buffer.from([0x81, 0x00]); // Message ID: 0x8100
        // const responseBody = Buffer.alloc(0);  No body data for this message
        const deviceIdBuffer = Buffer.from(deviceId, 'hex'); // Terminal ID as 6-byte hex
        const seqNumber = Buffer.alloc(2);
        seqNumber.writeUInt16BE(sequenceNumber, 0);
        // Message Body
        const resultBuffer = Buffer.from([result]); // Result code (0x00 for success)
        const authCodeBuffer = Buffer.from(authCode, 'ascii'); // Authentication code (in ASCII)
        let messageBody;
        if (result == 0x00) {
            messageBody = Buffer.concat([seqNumber, resultBuffer, authCodeBuffer]);
        } else {
            messageBody = Buffer.concat([seqNumber, resultBuffer]);
        }

        // Message Body Properties
        const messageBodyProperties = Buffer.alloc(2);
        messageBodyProperties.writeUInt16BE(messageBody.length, 0); // Set body length based on message body

        const headerSeqNumber = Buffer.alloc(2);
        headerSeqNumber.writeUInt16BE(0, 0);

        // Build the entire header
        const header = Buffer.concat(
            [messageId, messageBodyProperties, deviceIdBuffer, headerSeqNumber]
        );

        // Concatenate header and body
        const fullMessage = Buffer.concat([header, messageBody]);

        // Calculate checksum (XOR of all bytes except the start and end markers)
        let checksum = 0;
        for (let i = 0; i < fullMessage.length; i++) {
            checksum ^= fullMessage[i];
        }

        // Append the checksum and end marker
        let message = Buffer.concat([
            Buffer.from([0x7E]),
            fullMessage,
            Buffer.from([checksum]),
            Buffer.from([0x7E])
        ]);

        return message;
    }

    static createSetParametersRequest(deviceId, sequenceNumber, parameters) {
        const messageId = Buffer.from([0x81, 0x03]); // Message ID: 0x8103 (Set Terminal Parameters)
        const deviceIdBuffer = Buffer.from(deviceId, 'hex'); // Terminal ID as 6-byte hex
        const seqNumber = Buffer.alloc(2);
        seqNumber.writeUInt16BE(sequenceNumber, 0);

        // Message Body Properties
        const messageBodyProperties = Buffer.alloc(2);
        messageBodyProperties.writeUInt16BE(parameters.length, 0); // Set body length based on parameters

        // Build the entire header
        const header = Buffer.concat(
            [messageId, messageBodyProperties, deviceIdBuffer, seqNumber]
        );

        // Concatenate header and parameters
        const fullMessage = Buffer.concat([header, parameters]);

        // Calculate checksum (XOR of all bytes except the start and end markers)
        let checksum = 0;
        for (let i = 0; i < fullMessage.length; i++) {
            checksum ^= fullMessage[i];
        }

        // Append the checksum and end marker
        let message = Buffer.concat([
            Buffer.from([0x7E]),
            fullMessage,
            Buffer.from([checksum]),
            Buffer.from([0x7E])
        ]);

        return message;
    }

    static escapeMessage(buffer) {
        let escaped = [];
        for (let byte of buffer) {
            if (byte === 0x7E) {
                escaped.push(0x7D, 0x02);
            } else if (byte === 0x7D) {
                escaped.push(0x7D, 0x01);
            } else {
                escaped.push(byte);
            }
        }
        return Buffer.from(escaped);
    }
}

module.exports = JT808Request;
