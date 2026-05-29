const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');

const DEFAULTS = {
    filters: { duration: 'all', tags: [] },
    sortOrder: 'asc'
};

// GET current preferences. Always returns a doc (creates one if missing).
router.get('/', async (req, res) => {
    try {
        let pref = await Preference.findOne({ key: 'default' });
        if (!pref) {
            pref = await Preference.create({ key: 'default', ...DEFAULTS });
        }
        res.json({
            filters: pref.filters || DEFAULTS.filters,
            sortOrder: pref.sortOrder || DEFAULTS.sortOrder,
            updatedAt: pref.updatedAt
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT update preferences (upsert). Accepts { filters, sortOrder }.
router.put('/', async (req, res) => {
    const { filters, sortOrder } = req.body || {};

    const update = { updatedAt: new Date() };
    if (filters && typeof filters === 'object') {
        update.filters = {
            duration: ['all', 'short', 'medium', 'long'].includes(filters.duration)
                ? filters.duration
                : 'all',
            tags: Array.isArray(filters.tags) ? filters.tags.filter(t => typeof t === 'string') : []
        };
    }
    if (sortOrder === 'asc' || sortOrder === 'desc') {
        update.sortOrder = sortOrder;
    }

    try {
        const pref = await Preference.findOneAndUpdate(
            { key: 'default' },
            { $set: update, $setOnInsert: { key: 'default' } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json({
            filters: pref.filters,
            sortOrder: pref.sortOrder,
            updatedAt: pref.updatedAt
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
