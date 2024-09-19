const express = require('express');
const sequelize = require('./config/database');
const JT808Request = require('./services/jt808Request');
const bodyParser = require('body-parser');
const { trackerStates } = require('./services/tcpServer');

const app = express();

// Connect to MySQL
sequelize.sync()
    .then(() => {
        console.log('Database synchronized');
    })
    .catch(err => {
        console.error('Database synchronization error:', err);
    });

// Middleware
app.use(bodyParser.json());
app.use(express.json()); // Middleware for parsing JSON bodies

// Example route for sending commands to the tracker
app.post('/send-command', (req, res) => {
    const { trackerId, interval } = req.body;

    if (!interval || !trackerId) {
        console.log("Interval and trackerId are required");
        return res.status(400).send('Interval and trackerId are required');
    }
    
    // Ensure trackerId exists in trackerStates
    const trackerState = trackerStates[trackerId];
    if (trackerState && trackerState.socket) {
        // JT808 Command for setting the reporting interval (e.g., for "interval" seconds)
        const intervalValue = parseInt(interval, 10); // Convert interval to integer
        const intervalBuffer = Buffer.from([intervalValue]);

        // Create the parameters buffer according to the JT808 protocol for setting parameters
        const parameters = Buffer.concat([
            Buffer.from([0x01, 0x0001, 0x01]), // Parameter ID (Heartbeat interval) and length
            intervalBuffer,                 // Heartbeat interval ("interval" seconds in this case)
        ]);

        const messageSequence = 1; // You can track this or increment it as per protocol
        const commonRequest = JT808Request.createSetParametersRequest(trackerId, messageSequence, parameters);

        console.log("server:", commonRequest.toString('hex').toUpperCase());

        // Send the request to the tracker
        trackerState.socket.write(commonRequest);
        console.log(`Command sent to tracker ${trackerId} with interval ${interval} seconds`);
        res.status(200).send(`Command sent to tracker ${trackerId} with interval ${interval} seconds`);
    } else {
        console.log("Tracker not connected");

        res.status(404).send('Tracker not connected');
    }
});

// Example route for setting domain and port in JT808 command
app.post('/set-domain-port', (req, res) => {
    const { trackerId, domain, port } = req.body;

    // Validate request body
    if (!domain || !port || !trackerId) {
        console.log("Domain, port, and trackerId are required");
        return res.status(400).send('Domain, port, and trackerId are required');
    }

    // Validate port number
    const portValue = parseInt(port, 10);
    if (isNaN(portValue) || portValue <= 0 || portValue > 65535) {
        console.log("Invalid port value");
        return res.status(400).send('Invalid port value. Must be a number between 1 and 65535.');
    }

    // Ensure trackerId exists in trackerStates
    const trackerState = trackerStates[trackerId];
    if (trackerState && trackerState.socket) {
        try {
            const domainBuffer = Buffer.from(domain, 'ascii'); // Convert domain to Buffer
            const portBuffer = Buffer.alloc(2); // TCP port, 2 bytes
            portBuffer.writeUInt16BE(port);
        
            // APN, IP, PORT fields in JT808 protocol
            // Parameter IDs:
            // 0x0013 - IP
            // 0x0018 - PORT
        
            // Prepare the parameters as per JT808 format
            const parameters = Buffer.concat([
                Buffer.from([0x00, 0x13]), // Parameter ID for IP
                Buffer.from([domainBuffer.length]), // Length of domain string
                domainBuffer, // Domain name
                Buffer.from([0x00, 0x18, 0x02]), // Parameter ID for PORT
                portBuffer // Port number
            ]);

            // Sequence number - you can generate or increment this based on your needs
            const sequenceNumber = Date.now() % 0xFFFF;

            // Create the JT808 message
            const message = JT808Request.createSetParametersRequest(trackerId, sequenceNumber, parameters);

            // Send the request to the tracker
            trackerState.socket.write(message);
            console.log("server:", message.toString('hex').toUpperCase());

            console.log(`Command sent to tracker ${trackerId} to set domain ${domain} and port ${portValue}`);
            res.status(200).send(`Command sent to tracker ${trackerId} to set domain ${domain} and port ${portValue}`);

        } catch (error) {
            console.error("Error sending command:", error);
            res.status(500).send('Internal server error');
        }
    } else {
        console.log("Tracker not connected");
        res.status(404).send('Tracker not connected');
    }
});

module.exports = app;
