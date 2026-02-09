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
        // Fetch metadata from YouTube oEmbed
        const oembedUrl = `https://www.youtube.com/oembed?url=${url}&format=json`;
        const metadataResponse = await axios.get(oembedUrl);
        const { title, thumbnail_url } = metadataResponse.data;

        // Calculate new rank (add to bottom)
        const lastItem = await Item.findOne().sort({ rank: -1 });
        const newRank = lastItem && lastItem.rank ? lastItem.rank + 1 : 1;

        const newItem = new Item({
            url,
            title,
            thumbnail: thumbnail_url,
            tags: tags || [],
            rank: newRank,
            status: 'active'
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding item. Ensure URL is a valid ranking YouTube link.' });
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
