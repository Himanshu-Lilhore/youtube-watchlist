// One-off migration: backfill the new `videoId` field on existing items from
// their legacy `url` field, then drop `url` from the stored documents (the
// Item model now derives `url` on the fly via a virtual).
//
// Run once after deploying the videoId schema change:
//   node migrate-video-id.js

const mongoose = require('mongoose');
require('dotenv').config();

if (process.env.ENVIRONMENT == "DEV") {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

function extractVideoId(url) {
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
}

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    .then(() => {
        console.log('MongoDB Connected');
        return migrate();
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });

async function migrate() {
    // Use the raw driver collection so we can see the legacy `url` field,
    // which is no longer part of the Mongoose schema.
    const collection = mongoose.connection.collection('items');

    try {
        const docs = await collection.find({
            url: { $exists: true },
            videoId: { $exists: false }
        }).toArray();

        console.log(`Found ${docs.length} item(s) with a legacy url and no videoId`);

        let migrated = 0;
        let skipped = 0;

        for (const doc of docs) {
            const videoId = extractVideoId(doc.url);
            if (!videoId) {
                console.warn(`Could not extract videoId from url, skipping: ${doc.url}`);
                skipped++;
                continue;
            }

            await collection.updateOne(
                { _id: doc._id },
                { $set: { videoId }, $unset: { url: '' } }
            );
            migrated++;
            console.log(`Migrated "${doc.title || doc._id}" -> videoId=${videoId}`);
        }

        console.log(`Done. Migrated: ${migrated}, skipped: ${skipped}`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
