const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    // The canonical YouTube video ID (e.g. "dQw4w9WgXcQ"). This is the source
    // of truth for identifying a video — the watch URL is derived from it via
    // the `url` virtual below rather than stored redundantly.
    videoId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String
    },
    duration: {
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
    rank: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'watched'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Include virtuals (like `url`) whenever a document is converted to
    // JSON/object, so API responses keep exposing a full watch URL without
    // needing to store one.
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Derive the canonical watch URL from the stored videoId on the fly.
ItemSchema.virtual('url').get(function () {
    return this.videoId ? `https://www.youtube.com/watch?v=${this.videoId}` : null;
});

module.exports = mongoose.model('Item', ItemSchema);
