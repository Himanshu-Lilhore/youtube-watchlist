const mongoose = require('mongoose');

// Singleton-style preferences document. We identify "the" preferences doc by
// a fixed `key` field so we can always upsert it without needing user auth.
const PreferenceSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'default'
    },
    filters: {
        duration: {
            type: String,
            enum: ['all', 'short', 'medium', 'long'],
            default: 'all'
        },
        tags: {
            type: [String],
            default: []
        }
    },
    sortOrder: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'asc'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Preference', PreferenceSchema);
