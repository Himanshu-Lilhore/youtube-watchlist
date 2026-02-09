const dns = require('dns');
// Force Google DNS to bypass local DNS issues with MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - allows both local and production URLs
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    // Add your production frontend URL here when deployed
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
const itemsRouter = require('./routes/items');
app.use('/api/items', itemsRouter);

app.get('/', (req, res) => {
    res.send('YouTube Watchlist API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
