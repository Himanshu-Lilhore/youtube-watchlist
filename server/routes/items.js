const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const axios = require('axios');

// Get all active items, sorted by rank
router.get('/', async (req, res) => {
    try {
        const items = await Item.find({ status: 'active' }).sort({ rank: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new item
router.post('/', async (req, res) => {
    const { url, tags } = req.body;

    // Helper to parse ISO 8601 duration (PT1H2M10S) to HH:MM:SS or MM:SS
    const parseDuration = (isoDuration) => {
        const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return '0:00';

        const hours = matches[1] ? parseInt(matches[1]) : 0;
        const minutes = matches[2] ? parseInt(matches[2]) : 0;
        const seconds = matches[3] ? parseInt(matches[3]) : 0;

        const parts = [];
        if (hours > 0) {
            parts.push(hours.toString());
            parts.push(minutes.toString().padStart(2, '0'));
        } else {
            parts.push(minutes.toString());
        }
        parts.push(seconds.toString().padStart(2, '0'));

        return parts.join(':');
    };

    try {
        // Extract YouTube video ID from various URL formats
        const extractVideoId = (url) => {
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
                /youtube\.com\/v\/([^&\n?#]+)/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
            return null;
        };

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ message: 'Invalid YouTube URL format.' });
        }

        console.log('Fetching YouTube API for video:', videoId);
        const API_KEY = process.env.YOUTUBE_API_KEY;
        const apiResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,contentDetails',
                id: videoId,
                key: API_KEY
            }
        });

        if (!apiResponse.data.items || apiResponse.data.items.length === 0) {
            return res.status(404).json({ message: 'Video not found, private, or invalid API key.' });
        }

        const videoData = apiResponse.data.items[0];
        const title = videoData.snippet.title;
        const thumbnail = videoData.snippet.thumbnails.high?.url || videoData.snippet.thumbnails.medium?.url || videoData.snippet.thumbnails.default?.url;
        const duration = parseDuration(videoData.contentDetails.duration);

        // Calculate new rank (add to bottom)
        const lastItem = await Item.findOne().sort({ rank: -1 });
        const newRank = lastItem && lastItem.rank ? lastItem.rank + 1 : 1;

        const newItem = new Item({
            url,
            title,
            thumbnail,
            duration,
            tags: tags || [],
            rank: newRank,
            status: 'active'
        });

        const savedItem = await newItem.save();
        console.log('Successfully added video:', title);
        res.status(201).json(savedItem);
    } catch (err) {
        console.error('Error adding item:', err.message);
        if (err.response && err.response.data && err.response.data.error) {
            console.error('YouTube API Error:', err.response.data.error.message);
            res.status(400).json({
                message: `YouTube API Error: ${err.response.data.error.message}`
            });
        } else {
            res.status(500).json({ message: `Error adding item: ${err.message}` });
        }
    }
});


// Reorder items (Drag & Drop)
router.put('/reorder', async (req, res) => {
    const { items } = req.body;

    // SAFETY CHECK: Ensure items is actually an array
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid data format' });
    }

    try {
        const bulkOps = items.map(item => ({
            updateOne: {
                filter: { _id: item._id },
                update: { rank: item.rank }
            }
        }));

        if (bulkOps.length > 0) {
            await Item.bulkWrite(bulkOps);
        }

        res.json({ message: 'Reordered successfully' });
    } catch (err) {
        console.error(err); // Log exact error to server console
        res.status(500).json({ message: err.message });
    }
});

// Deprioritize (Send to bottom)
router.patch('/:id/deprioritize', async (req, res) => {
    try {
        const lastItem = await Item.findOne().sort({ rank: -1 });
        const newRank = lastItem ? lastItem.rank + 1 : 1;

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { rank: newRank },
            { new: true }
        );
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark as watched (Soft Delete)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body; // 'watched' or 'active'

    try {
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update item tags
router.patch('/:id/tags', async (req, res) => {
    const { tags } = req.body; // Array of strings

    try {
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { tags: tags },
            { new: true }
        );
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
