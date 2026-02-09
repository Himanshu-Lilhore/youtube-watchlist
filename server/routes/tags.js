const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Item = require('../models/Item');

// Get all tags
router.get('/', async (req, res) => {
    try {
        const tags = await Tag.find().sort({ name: 1 });
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new tag
router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        const existingTag = await Tag.findOne({ name });
        if (existingTag) {
            return res.status(400).json({ message: 'Tag already exists' });
        }

        const newTag = new Tag({ name });
        const savedTag = await newTag.save();
        res.status(201).json(savedTag);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a tag
// Note: This removes the tag from GLobal list AND from all items utilizing it
router.delete('/:id', async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // Remove this tag string from all items
        await Item.updateMany(
            { tags: tag.name },
            { $pull: { tags: tag.name } }
        );

        await Tag.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tag deleted and removed from items' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a tag (Rename)
router.patch('/:id', async (req, res) => {
    const { name } = req.body;
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        const oldName = tag.name;

        // Update the tag itself
        tag.name = name;
        const updatedTag = await tag.save();

        // Update all items that had the old tag name
        await Item.updateMany(
            { tags: oldName },
            { $set: { "tags.$[elem]": name } },
            { arrayFilters: [{ "elem": oldName }] }
        );

        res.json(updatedTag);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
