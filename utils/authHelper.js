// backend/utils/authHelper.js

const crypto = require('crypto');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

async function createAuthorizationHeader(requestBody) {
    try {
        const subscriberId = process.env.SUBSCRIBER_ID;
        const uniqueKeyId = process.env.UNIQUE_KEY_ID;

        // 1. Get the 64-byte private key from .env.
        // tweetnacl expects this as a Uint8Array.
        const privateKey = naclUtil.decodeBase64(process.env.SIGNING_PRIVATE_KEY);

        // 2. Timestamps
        const created = Math.floor(Date.now() / 1000 - 1).toString();
        const expires = (parseInt(created) + 300).toString();

        // 3. Generate the BLAKE-512 digest
        const digest = generateBlake512Digest(requestBody);

        // 4. Construct the signing string
        const signingString =
            `(created): ${created}\n` +
            `(expires): ${expires}\n` +
            `digest: BLAKE-512=${digest}`;

        // 5. Sign the string using tweetnacl's detached signature function.
        // It requires the message to be a Uint8Array.
        const signatureBytes = nacl.sign.detached(
            naclUtil.decodeUTF8(signingString),
            privateKey
        );

        // 6. Convert the signature to Base64
        const signature = naclUtil.encodeBase64(signatureBytes);

        // 7. Construct the final header
        const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

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

module.exports = { createAuthorizationHeader };