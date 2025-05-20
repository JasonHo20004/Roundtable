import crypto from 'crypto';

function generateShortCode(length = 6) {
    // Generates a random numeric string of specified length
    // const buffer = crypto.randomBytes(Math.ceil(length / 2));
    // let code = buffer.toString('hex').slice(0, length);
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return String(crypto.randomInt(min, max + 1)).padStart(length, '0');
}

export {generateShortCode};