// controllers/protocolController.js
const { isHeaderValid } = require('ondc-crypto-sdk-nodejs');
const ondcService = require('../services/ondcService');

const handleCallback = (handler) => async (req, res) => {
    // Acknowledge first
    res.status(200).json({ message: { ack: { status: 'ACK' } } });

    const signature = req.headers['authorization'];
    // const verified = await isHeaderValid({
    //   header: signature, // The Authorisation header sent by other network participants
    //   body: req.body,
    //   publicKey: publicKey,
    // });

    // console.log(`Signature verification for ${req.body.context.action}:`, verified);
    // Process the callback asynchronously
    try {
        await handler(req.body);
    } catch (error) {
        console.error(`Error processing callback for ${req.body.context.action}:`, error);
    }
};

exports.onSearch = handleCallback(ondcService.handleOnSearch);
exports.onSelect = handleCallback(ondcService.handleOnSelect);
exports.onInit = handleCallback(ondcService.handleOnInit);
exports.onConfirm = handleCallback(ondcService.handleOnConfirm);
exports.onStatus = handleCallback(ondcService.handleOnStatus);
// Add other handlers (on_track, on_cancel, etc.) here