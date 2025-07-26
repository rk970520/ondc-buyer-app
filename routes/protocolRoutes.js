// routes/protocolRoutes.js
const express = require('express');
const router = express.Router();
const protocolController = require('../controllers/protocolController');

// All ONDC callback endpoints
router.post('/on_search', protocolController.onSearch);
router.post('/on_select', protocolController.onSelect);
router.post('/on_init', protocolController.onInit);
router.post('/on_confirm', protocolController.onConfirm);
router.post('/on_status', protocolController.onStatus);
// Add other endpoints (on_track, on_cancel, etc.) here

module.exports = router;