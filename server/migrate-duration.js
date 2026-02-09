const mongoose = require('mongoose');
const axios = require('axios');
const Item = require('./models/Item');
require('dotenv').config();

// Fix for Google DNS in dev environment
if (process.env.ENVIRONMENT == "DEV") {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    .then(() => {
        console.log('MongoDB Connected');
        updateDurations();
    })
    .catch(err => console.log(err));

async function updateDurations() {
    try {
        const items = await Item.find({ duration: { $exists: false } });
        console.log(`Found ${items.length} items without duration`);

        for (const item of items) {
            console.log(`Processing: ${item.title}`);
            const videoId = extractVideoId(item.url);

            if (videoId) {
                const duration = await fetchDuration(videoId);
                if (duration) {
                    item.duration = duration;
                    await item.save();
                    console.log(`Updated duration for: ${item.title} -> ${duration}`);
                } else {
                    console.log(`Could not fetch duration for: ${item.title}`);
                }
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Done upgrading items');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function fetchDuration(videoId) {
    try {
        const pageResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const htmlContent = pageResponse.data;
        const durationMatch = htmlContent.match(/itemprop="duration" content="([^"]+)"/);

        if (durationMatch && durationMatch[1]) {
            const isoDuration = durationMatch[1];
            // Convert PT1H2M10S to HH:MM:SS
            const matches = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

            const hours = (matches[1] || '').replace('H', '');
            const minutes = (matches[2] || '').replace('M', '');
            const seconds = (matches[3] || '').replace('S', '');

            const parts = [];
            if (hours) parts.push(hours);
            parts.push(hours ? (minutes || '0').padStart(2, '0') : (minutes || '0'));
            parts.push((seconds || '0').padStart(2, '0'));

            return parts.join(':');
        }
        return null;
    } catch (error) {
        console.error(`Error fetching duration for ${videoId}:`, error.message);
        return null;
    }
}
