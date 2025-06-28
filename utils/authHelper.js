// backend/utils/authHelper.js

const crypto = require('crypto'); // Still needed for the Blake512 digest

async function createAuthorizationHeader(requestBody) {
    try {
        // --- THIS IS THE FINAL FIX ---
        // 1. Import both noble libraries
        const ed = await import('@noble/ed25519');
        const { sha512 } = await import('@noble/hashes/sha512');

        // 2. Attach the sha512 hash function to the ed25519 library
        // The sha512 function is called directly, not via a 'sync' property.
        ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
        // --- END OF FIX ---

        const subscriberId = process.env.SUBSCRIBER_ID;
        const uniqueKeyId = process.env.UNIQUE_KEY_ID;

        // Get the 64-byte private key from .env and slice to get the 32-byte secret key.
        const fullPrivateKey = Buffer.from(process.env.SIGNING_PRIVATE_KEY, 'base64');
        const privateKeyBytes = fullPrivateKey.slice(0, 32); 

        // Timestamps
        const created = Math.floor(Date.now() / 1000 - 1).toString();
        const expires = (parseInt(created) + 300).toString();

        // Generate the BLAKE-512 digest for the signing string body
        const digest = generateBlake512Digest(requestBody);

        // Construct the signing string
        const signingString =
            `(created): ${created}\n` +
            `(expires): ${expires}\n` +
            `digest: BLAKE-512=${digest}`;

        // Sign the signing string.
        const signatureBytes = await ed.sign(Buffer.from(signingString), privateKeyBytes);
        const signature = Buffer.from(signatureBytes).toString('base64');

        // Construct the final header.
        const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

        return header;
    } catch (error) {
        console.error('Error creating authorization header:', error);
        throw new Error('Failed to create authorization header');
    }
}

// Correct ONDC-compliant digest function
function generateBlake512Digest(body) {
    return crypto.createHash('blake2b512')
        .update(JSON.stringify(body))
        .digest('base64');
}

module.exports = { createAuthorizationHeader };