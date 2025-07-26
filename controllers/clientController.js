// controllers/clientController.js
const ondcService = require('../services/ondcService');
const Transaction = require('../models/Transaction');
const SearchResultCache = require('../models/SearchResultCache');

exports.search = async (req, res) => {
    try {
        // Assume userId is available from auth middleware in a real app
        const { userId = 'temp-user-id', searchTerm } = req.body;
        if (!searchTerm) {
            return res.status(400).json({ message: 'Search term is required' });
        }
        const result = await ondcService.initiateSearch(userId, searchTerm);
        res.status(202).json({ message: 'Search initiated successfully', ...result });
    } catch (error) {
        res.status(500).json({ message: 'Error initiating search', error: error.message });
    }
};

exports.getSearchResults = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const results = await SearchResultCache.find({ transactionId });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching search results', error: error.message });
    }
};

exports.select = async (req, res) => {
    try {
        const { transactionId, providerId, itemIds } = req.body;
        const result = await ondcService.initiateSelect(transactionId, providerId, itemIds);
        res.status(202).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error initiating select', error: error.message });
    }
};

exports.init = async (req, res) => {
    try {
        const { transactionId, billingDetails, deliveryDetails } = req.body;
        const result = await ondcService.initiateInit(transactionId, billingDetails, deliveryDetails);
        res.status(202).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error initiating init', error: error.message });
    }
};

exports.confirm = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const result = await ondcService.initiateConfirm(transactionId);
        res.status(202).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error initiating confirm', error: error.message });
    }
};

exports.status = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const result = await ondcService.initiateStatus(transactionId);
        res.status(202).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error initiating status check', error: error.message });
    }
};


exports.getTransactionDetails = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transaction details', error: error.message });
    }
};