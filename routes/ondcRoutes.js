const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { createAuthorizationHeaderONDC } = require('../utils/authHelper');
const SearchResult = require('../models/SearchResult');

const router = express.Router();

const BAP_ID = process.env.BAP_ID;
const BAP_URL = process.env.BAP_URL;
const ONDC_GATEWAY_URL = process.env.ONDC_GATEWAY_URL;

// 1. INITIATE SEARCH
router.post('/search', async (req, res) => {
    const { searchTerm } = req.body;
    if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required' });
    }

    const transactionId = uuidv4();
    const messageId = uuidv4();

    const searchPayload = {
        context: {
            domain: process.env.DOMAIN,
            country: process.env.COUNTRY,
            city: process.env.CITY,
            action: "search",
            core_version: "1.2.0",
            bap_id: BAP_ID,
            bap_uri: BAP_URL,
            transaction_id: transactionId,
            message_id: messageId,
            timestamp: new Date().toISOString(),
            ttl: "PT30S"
        },
        message: {
            intent: {
                item: {
                    descriptor: {
                        name: searchTerm
                    }
                },
                fulfillment: {
                    type: "Delivery"
                },
                payment: {
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3"
                }
            }
        }
    };

    try {
        console.log("Initiating search with payload:", JSON.stringify(searchPayload));
        const authHeader = await createAuthorizationHeaderONDC(searchPayload);
        
        console.log("Using Auth Header:", authHeader);

        await axios.post(`${ONDC_GATEWAY_URL}/search`, searchPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });
        
        await SearchResult.create({ transactionId });
        res.json({ message: "Search initiated", transactionId });

    } catch (error) {
        console.error("Error initiating search:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        res.status(500).json({ message: "Failed to initiate search", error: error.response ? error.response.data : error.message });
    }
});

// 2. ONDC CALLBACK ENDPOINT (/on_search)
router.post('/on_search', async (req, res) => {
    console.log("Received on_search callback:", JSON.stringify(req.body, null, 2));
    res.json({ message: { ack: { status: "ACK" } } });

    const { context, message } = req.body;
    const { transaction_id } = context;

    if (message && message.catalog) {
        try {
            await SearchResult.findOneAndUpdate(
                { transactionId: transaction_id },
                { $push: { catalogs: { $each: message.catalog.providers || [] } } },
                { upsert: false }
            );
            console.log(`Successfully updated catalog for ${transaction_id}`);
        } catch (error) {
            console.error("Error updating search results:", error);
        }
    }
});

// 3. POLLING ENDPOINT FOR FRONTEND
router.get('/results/:transactionId', async (req, res) => {
    try {
        const result = await SearchResult.findOne({ transactionId: req.params.transactionId });
        if (result && result.catalogs.length > 0) {
            res.json({ status: 'found', data: result.catalogs });
        } else {
            res.json({ status: 'pending' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch results' });
    }
});

module.exports = router;