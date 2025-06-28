// backend/utils/authHelper.js

const crypto = require('crypto');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const {createAuthorizationHeader} = require("ondc-crypto-sdk-nodejs");

async function createAuthorizationHeaderONDC(requestBody) {
    try {
        const header = await createAuthorizationHeader({
            body: requestBody,
            privateKey: process.env.SIGNING_PRIVATE_KEY,
            subscriberId: process.env.SUBSCRIBER_ID, // Subscriber ID that you get after registering to ONDC Network
            subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID, // Unique Key Id or uKid that you get after registering to ONDC Network
        });

         console.log({
            body: requestBody,
            privateKey: process.env.SIGNING_PRIVATE_KEY,
            subscriberId: process.env.SUBSCRIBER_ID, // Subscriber ID that you get after registering to ONDC Network
            subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID, // Unique Key Id or uKid that you get after registering to ONDC Network
        },header);
        // const subscriberId = process.env.SUBSCRIBER_ID;
        // const uniqueKeyId = process.env.UNIQUE_KEY_ID;

        // // --- THIS IS THE KEY CHANGE ---
        // // 1. Decode the Base64 private key from the .env file.
        // const privateKey_64_bytes = naclUtil.decodeBase64(process.env.SIGNING_PRIVATE_KEY);

        // // 2. Explicitly create a signing keyPair from the 64-byte secret key.
        // // This is the most robust way to ensure tweetnacl uses the correct parts of the key.
        // const keyPair = nacl.sign.keyPair.fromSecretKey(privateKey_64_bytes);
        // // --- END OF KEY CHANGE ---

        // // 3. Timestamps
        // const created = Math.floor(Date.now() / 1000).toString(); // Use current time, buffer can sometimes cause issues
        // const expires = (parseInt(created) + 300).toString(); // 5 minutes validity

        // // 4. Generate the BLAKE-512 digest
        // const digest = generateBlake512Digest(requestBody);

        // // 5. Construct the signing string
        // const signingString =
        //     `(created): ${created}\n` +
        //     `(expires): ${expires}\n` +
        //     `digest: BLAKE-512=${digest}`;

        // // 6. Sign the string using the secretKey from the generated keyPair.
        // // We use nacl.sign.detached and pass the full message and the secret key from the pair.
        // const signatureBytes = nacl.sign.detached(
        //     naclUtil.decodeUTF8(signingString),
        //     keyPair.secretKey // Use the secret key from the generated pair
        // );

        // // 7. Convert the signature to Base64
        // const signature = naclUtil.encodeBase64(signatureBytes);

        // // 8. Construct the final header
        // const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

        return header;
    } catch (error) {
        console.error('Error creating authorization header:', error);
        throw new Error('Failed to create authorization header');
    }
}

function generateBlake512Digest(body) {
    return crypto.createHash('blake2b512')
        .update(JSON.stringify(body))
        .digest('base64');
}

module.exports = { createAuthorizationHeaderONDC };