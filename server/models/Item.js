const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
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
});

module.exports = mongoose.model('Item', ItemSchema);
