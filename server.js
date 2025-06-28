require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ondcRoutes = require('./routes/ondcRoutes');

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware
const corsOptions = {
    origin: '*' // Be more specific in production e.g., 'https://your-frontend-domain.com'
};
app.use(cors(corsOptions));
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mount the ONDC routes at the /ondc path to match your subscriber_url
app.use('/ondc', ondcRoutes);

// Root endpoint for health check
app.get('/', (req, res) => {
    res.send('ONDC Buyer App Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`ONDC callbacks are expected at: ${process.env.BAP_URL}/[action]`);
    if(!process.env.BAP_URL || !process.env.BAP_URL.startsWith('https://')){
        console.warn('WARNING: BAP_URL is not set or is not a valid HTTPS URL. ONDC callbacks will fail.');``
    }
});