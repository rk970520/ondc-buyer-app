const crypto = require('crypto');

async function createAuthorizationHeader(requestBody) {
    const subscriberId = process.env.SUBSCRIBER_ID;
    const uniqueKeyId = process.env.UNIQUE_KEY_ID;
    const privateKey = Buffer.from(process.env.SIGNING_PRIVATE_KEY, 'base64');

    const created = Math.floor(new Date().getTime() / 1000 - 1).toString(); // Add a 1-second buffer
    const expires = (parseInt(created) + 300).toString(); // 5 minutes validity

    const digest = generateBlakeHash(requestBody);

    const signingString =
        `(created): ${created}\n` +
        `(expires): ${expires}\n` +
        `digest: BLAKE-512=${digest}`;
    
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingString);
    const signature = signer.sign(privateKey, 'base64');
    
    const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

    return header;
}

function generateBlakeHash(body) {
    const hash = crypto.createHash('blake2b512');
    hash.update(JSON.stringify(body));
    return hash.digest('base64');
}

module.exports = { createAuthorizationHeader };