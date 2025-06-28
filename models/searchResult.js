const mongoose = require('mongoose');

const SearchResultSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    catalogs: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m' // Automatically delete documents after 10 minutes
    }
});

module.exports = mongoose.model('SearchResult', SearchResultSchema);