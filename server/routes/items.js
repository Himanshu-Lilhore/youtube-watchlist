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

    try {
        // Extract YouTube video ID from various URL formats
        const extractVideoId = (url) => {
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
        };

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ message: 'Invalid YouTube URL format.' });
        }

        // Fetch the YouTube page to extract metadata
        console.log('Fetching YouTube page for video:', videoId);
        const pageResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const htmlContent = pageResponse.data;

        // Extract title from various possible locations in the HTML
        let title = 'YouTube Video';

        // Try to get title from meta tags
        const titleMatch = htmlContent.match(/<meta\s+name="title"\s+content="([^"]+)"/i) ||
            htmlContent.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
            htmlContent.match(/<title>([^<]+)<\/title>/i);

        if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].replace(/ - YouTube$/, '').trim();
        }

        // Extract duration (ISO 8601 format: PT1H2M10S)
        const durationMatch = htmlContent.match(/itemprop="duration" content="([^"]+)"/);
        let duration = null;

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

            duration = parts.join(':');
        }

        // Construct thumbnail URL from video ID
        const thumbnail_url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

        // Calculate new rank (add to bottom)
        const lastItem = await Item.findOne().sort({ rank: -1 });
        const newRank = lastItem && lastItem.rank ? lastItem.rank + 1 : 1;

        const newItem = new Item({
            url,
            title,
            thumbnail: thumbnail_url,
            duration, // Save the formatted duration
            tags: tags || [],
            rank: newRank,
            status: 'active'
        });

        const savedItem = await newItem.save();
        console.log('Successfully added video:', title);
        res.status(201).json(savedItem);
    } catch (err) {
        console.error('Error adding item:', err.message);
        if (err.response) {
            console.error('YouTube response status:', err.response.status);
            res.status(400).json({
                message: `Failed to fetch video information. The video may be unavailable or private.`
            });
        } else if (err.request) {
            console.error('No response from YouTube');
            res.status(500).json({ message: 'Failed to connect to YouTube. Please try again.' });
        } else {
            console.error('Error details:', err);
            res.status(400).json({ message: `Error adding item: ${err.message}` });
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

module.exports = router;
