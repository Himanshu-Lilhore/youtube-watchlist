const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('dotenv').config();
const Item = require('./models/Item');

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(async () => {
    const items = await Item.find({ title: /UX Psychology/i }).lean();
    console.log(JSON.stringify(items, null, 2));
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
