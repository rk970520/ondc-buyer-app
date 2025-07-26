// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Search and get results
router.post('/search', clientController.search);
router.get('/search/results/:transactionId', clientController.getSearchResults);

// Get quote
router.post('/select', clientController.select);

// Add delivery/billing info
router.post('/init', clientController.init);

// Confirm order
router.post('/confirm', clientController.confirm);

// Get order status
router.post('/status', clientController.status);

// A generic endpoint to poll for the latest transaction state
router.get('/transaction/:transactionId', clientController.getTransactionDetails);

module.exports = router;