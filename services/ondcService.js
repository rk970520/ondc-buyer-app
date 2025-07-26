// services/ondcService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const SearchResultCache = require('../models/SearchResultCache');
const {createAuthorizationHeader} = require("ondc-crypto-sdk-nodejs");


// Helper function to send signed requests to the ONDC Gateway
const sendRequestToGateway = async (action, payload) => {
    try {
        const authHeader = await createAuthorizationHeader({
            body: JSON.stringify(payload),
            privateKey: process.env.SIGNING_PRIVATE_KEY,
            subscriberId: process.env.SUBSCRIBER_ID, // Subscriber ID that you get after registering to ONDC Network
            subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID, // Unique Key Id or uKid that you get after registering to ONDC Network
        });

        console.log(`Sending /${action} to Gateway:`, JSON.stringify(payload, null, 2));

        const response = await axios.post(`${process.env.ONDC_GATEWAY_URL}/${action}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error in sendRequestToGateway for /${action}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};

// --- BAP Client Action Services ---

exports.initiateSearch = async (userId, searchTerm) => {
    const transactionId = uuidv4();
    const messageId = uuidv4();

    const transaction = new Transaction({
        transactionId,
        messageId,
        userId,
        status: 'SEARCH_INITIATED',
        lastRequest: 'search',
        search_criteria: { name: searchTerm }
    });

    const payload = {
        context: {
            domain: process.env.DOMAIN,
            country: process.env.COUNTRY,
            city: process.env.CITY,
            action: 'search',
            core_version: process.env.CORE_VERSION,
            bap_id: process.env.BAP_ID,
            bap_uri: process.env.BAP_URL,
            transaction_id: transactionId,
            message_id: messageId,
            timestamp: new Date().toISOString(),
            ttl: "PT30S"
        },
        message: {
            intent: {
                item: { descriptor: { name: searchTerm } },
                fulfillment: { type: "Delivery" }
            }
        }
    };
    transaction.context = payload.context;
    await transaction.save();
    await sendRequestToGateway('search', payload);
    return { transactionId };
};

exports.initiateSelect = async (transactionId, providerId, itemIds) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) throw new Error('Transaction not found');

    const searchResults = await SearchResultCache.find({ transactionId, providerId });
    if (!searchResults.length) throw new Error('Search results not found or expired');

    const selectedItems = [];
    for (const result of searchResults) {
        const items = result.items.filter(item => itemIds.includes(item.id));
        selectedItems.push(...items.map(item => ({ id: item.id, quantity: { count: 1 } }))); // Default quantity to 1
    }

    if (!selectedItems.length) throw new Error('Selected items not found in cache');

    const payload = {
        context: { ...transaction.context, action: 'select', message_id: uuidv4() },
        message: {
            order: {
                provider: { id: providerId },
                items: selectedItems
            }
        }
    };

    transaction.status = 'SELECT_INITIATED';
    transaction.lastRequest = 'select';
    transaction.context = payload.context;
    await transaction.save();
    await sendRequestToGateway('select', payload);
    return { message: 'Select initiated' };
};

exports.initiateInit = async (transactionId, billingDetails, deliveryDetails) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction || !transaction.quote) throw new Error('Transaction or quote not found');

    const payload = {
        context: { ...transaction.context, action: 'init', message_id: uuidv4() },
        message: {
            order: {
                ...transaction.quote, // Use the full quote from on_select
                billing: billingDetails,
                fulfillment: {
                    type: "Delivery",
                    end: {
                        location: deliveryDetails.location,
                        contact: { phone: deliveryDetails.contact.phone, email: deliveryDetails.contact.email }
                    },
                    customer: { person: { name: deliveryDetails.customer.name } }
                }
            }
        }
    };
    transaction.status = 'INIT_INITIATED';
    transaction.lastRequest = 'init';
    transaction.context = payload.context;
    await transaction.save();
    await sendRequestToGateway('init', payload);
    return { message: 'Init initiated' };
};

exports.initiateConfirm = async (transactionId) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction || !transaction.init_details) throw new Error('Transaction or init details not found');

    const payload = {
        context: { ...transaction.context, action: 'confirm', message_id: uuidv4() },
        message: {
            order: {
                ...transaction.init_details, // Use the full order object from on_init
                payment: {
                    type: "ON-ORDER",
                    status: "PAID", // Assuming pre-paid order
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3.0"
                }
            }
        }
    };

    transaction.status = 'CONFIRM_INITIATED';
    transaction.lastRequest = 'confirm';
    transaction.context = payload.context;
    await transaction.save();
    await sendRequestToGateway('confirm', payload);
    return { message: 'Confirm initiated' };
};


exports.initiateStatus = async (transactionId) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction || !transaction.confirmed_order) throw new Error('Confirmed order not found for this transaction');
    
    const orderId = transaction.confirmed_order.id;

    const payload = {
        context: { ...transaction.context, action: 'status', message_id: uuidv4() },
        message: { order_id: orderId }
    };

    transaction.status = 'STATUS_INITIATED';
    transaction.lastRequest = 'status';
    transaction.context = payload.context;
    await transaction.save();
    await sendRequestToGateway('status', payload);
    return { message: 'Status request initiated' };
};


// --- ONDC Protocol Callback Services ---

exports.handleOnSearch = async (payload) => {
    const { context, message } = payload;
    const transaction = await Transaction.findOne({ transactionId: context.transaction_id });
    if (!transaction) {
        console.error('Transaction not found for on_search:', context.transaction_id);
        return;
    }
    
    const providers = message.catalog['bpp/providers'];
    for (const provider of providers) {
        await SearchResultCache.create({
            transactionId: context.transaction_id,
            providerId: provider.id,
            provider_descriptor: provider.descriptor,
            items: provider.items
        });
    }

    transaction.status = 'SEARCH_RESULTS_RECEIVED';
    await transaction.save();
};

exports.handleOnSelect = async (payload) => {
    const { context, message } = payload;
    await Transaction.updateOne(
        { transactionId: context.transaction_id },
        {
            $set: {
                status: 'QUOTE_RECEIVED',
                quote: message.order,
                'context.timestamp': context.timestamp
            }
        }
    );
};

exports.handleOnInit = async (payload) => {
    const { context, message } = payload;
    await Transaction.updateOne(
        { transactionId: context.transaction_id },
        {
            $set: {
                status: 'INIT_DETAILS_RECEIVED',
                init_details: message.order,
                'context.timestamp': context.timestamp
            }
        }
    );
};

exports.handleOnConfirm = async (payload) => {
    const { context, message } = payload;
    await Transaction.updateOne(
        { transactionId: context.transaction_id },
        {
            $set: {
                status: 'ORDER_CONFIRMED',
                confirmed_order: message.order,
                'context.timestamp': context.timestamp
            }
        }
    );
};


exports.handleOnStatus = async (payload) => {
    const { context, message } = payload;
    await Transaction.updateOne(
        { transactionId: context.transaction_id },
        {
            $set: {
                status: 'STATUS_RECEIVED',
                confirmed_order: message.order, // on_status returns the full, updated order object
                'context.timestamp': context.timestamp
            }
        }
    );
};