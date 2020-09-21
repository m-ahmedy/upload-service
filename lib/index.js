require('dotenv').config();
const express = require('express');
const http = require('http');

const app = express();
const { uploadHandler, middleware } = require('../src/backend');

middleware.forEach(middleware => {
    app.use(middleware)
});
app.post('/upload', uploadHandler);

const httpServer = http.createServer(app);

httpServer.listen(process.env.UPLOAD_SERVICE_PORT, () => {
    console.log('Accepting requests on ' + process.env.UPLOAD_SERVICE_PORT);
});
