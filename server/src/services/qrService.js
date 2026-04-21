const QRCode = require('qrcode');

async function generateQRCode(referenceNumber) {
  return QRCode.toDataURL(referenceNumber);
}

module.exports = { generateQRCode };
