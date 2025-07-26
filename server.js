// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const clientRoutes = require('./routes/clientRoutes');
const protocolRoutes = require('./routes/protocolRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Mount Routers
app.use('/client/v1', clientRoutes); // For your frontend to call
app.use('/', protocolRoutes);       // For ONDC Gateway to call (root path as per BAP_URL)

// Health check
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 4434;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`BAP URL is configured as: ${process.env.BAP_URL}`);
});