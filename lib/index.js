require('dotenv').config();
const http = require('http');
const app = require('../src/backend')
const httpServer = http.createServer(app);

httpServer.listen(process.env.UPLOAD_SERVICE_PORT, () => {
    console.log('Accepting requests on ' + process.env.UPLOAD_SERVICE_PORT);
});
