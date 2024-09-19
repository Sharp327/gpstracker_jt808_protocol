const app = require('./app');
const { server: tcpServer } = require('./services/tcpServer');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});

tcpServer.listen(5054, () => {
    console.log('TCP server running on port 5054');
});
