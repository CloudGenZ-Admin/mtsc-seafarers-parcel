const crypto = require('crypto');

function generateReference() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(8);
  let result = 'MTSC-';
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function generateUniqueReference(existsCheck) {
  let ref;
  let attempts = 0;
  do {
    ref = generateReference();
    attempts++;
    if (attempts > 100) throw new Error('Unable to generate unique reference number');
  } while (await existsCheck(ref));
  return ref;
}

module.exports = { generateReference, generateUniqueReference };
