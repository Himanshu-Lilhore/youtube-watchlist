require('dotenv').config();
const dns = require('dns');
// Force Google DNS to bypass local DNS issues with MongoDB SRV records
if (process.env.ENVIRONMENT == "DEV") dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: function (origin, callback) {
        if (!origin ||
            origin.startsWith(process.env.FRONTEND_URL)) {
            callback(null, true)
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
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
