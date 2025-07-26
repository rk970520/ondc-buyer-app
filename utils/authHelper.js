// backend/utils/authHelper.js

const {createAuthorizationHeader} = require("ondc-crypto-sdk-nodejs");

async function createAuthorizationHeaderONDC(requestBody) {
    try {
        const header = await createAuthorizationHeader({
            body: JSON.stringify(requestBody),
            privateKey: process.env.SIGNING_PRIVATE_KEY,
            subscriberId: process.env.SUBSCRIBER_ID, // Subscriber ID that you get after registering to ONDC Network
            subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID, // Unique Key Id or uKid that you get after registering to ONDC Network
        });
        return header;
    } catch (error) {
        console.error('Error creating authorization header:', error);
        throw new Error('Failed to create authorization header');
    }
}
module.exports = { createAuthorizationHeaderONDC };