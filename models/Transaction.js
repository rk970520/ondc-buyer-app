// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true, index: true },
    messageId: { type: String, required: true },
    userId: { type: String, required: true }, // In a real app, this would be a mongoose.Schema.Types.ObjectId
    status: {
        type: String,
        enum: [
            'SEARCH_INITIATED', 'SEARCH_RESULTS_RECEIVED',
            'SELECT_INITIATED', 'QUOTE_RECEIVED',
            'INIT_INITIATED', 'INIT_DETAILS_RECEIVED',
            'CONFIRM_INITIATED', 'ORDER_CONFIRMED',
            'TRACK_INITIATED', 'TRACKING_RECEIVED',
            'STATUS_INITIATED', 'STATUS_RECEIVED',
            'CANCEL_INITIATED', 'ORDER_CANCELLED',
            'COMPLETED', 'FAILED'
        ],
        required: true
    },
    lastRequest: { type: String }, // To know which ONDC action was last performed
    context: { type: Object }, // Store the latest context
    search_criteria: { type: Object },
    quote: { type: Object }, // From on_select
    init_details: { type: Object }, // From on_init
    confirmed_order: { type: Object }, // From on_confirm
    tracking_info: { type: Object }, // From on_track
    cancellation_reason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);