// models/SearchResultCache.js
const mongoose = require('mongoose');

const searchResultCacheSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, index: true },
    providerId: { type: String, required: true },
    provider_descriptor: { type: Object },
    items: [Object],
    createdAt: { type: Date, default: Date.now, expires: '15m' } // TTL index, auto-deletes after 15 minutes
});

module.exports = mongoose.model('SearchResultCache', searchResultCacheSchema);