function arrivalEmailHtml({ stationName, stationAddress, referenceNumber, qrCodeDataUrl }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1B2A4A;">
<h2>Your Parcel Has Arrived!</h2>
<p>Your parcel <strong>${referenceNumber}</strong> has arrived at <strong>${stationName}</strong>.</p>
<p>Station Address: ${stationAddress}</p>
<p>Please present this QR code at the station for pickup:</p>
<img src="${qrCodeDataUrl}" alt="QR Code" style="width:200px;height:200px;" />
<p>Thank you,<br/>Mission to Seafarers Canada</p>
</body></html>`;
}

function deliveryEmailHtml({ stationName, referenceNumber, size, deliveredAt, signatureDataUrl }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1B2A4A;">
<h2>Delivery Confirmation</h2>
<p>Your parcel <strong>${referenceNumber}</strong> has been delivered at <strong>${stationName}</strong>.</p>
<p>Size: ${size} | Date: ${new Date(deliveredAt).toLocaleDateString()}</p>
<p>Signature:</p>
<img src="${signatureDataUrl}" alt="Signature" style="max-width:300px;" />
<p>Thank you,<br/>Mission to Seafarers Canada</p>
</body></html>`;
}

async function sendArrivalEmail(parcelData) {
  const html = arrivalEmailHtml(parcelData);
  const to = parcelData.email;
  const subject = `Parcel ${parcelData.referenceNumber} has arrived at ${parcelData.stationName}`;
  if (process.env.EMAIL_PROVIDER === 'smtp') {
    // Future SMTP integration
    console.log('SMTP send not implemented');
  }
  console.log('--- EMAIL ---');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', html);
  console.log('--- END EMAIL ---');
}

async function sendDeliveryEmail(parcelData) {
  const html = deliveryEmailHtml(parcelData);
  const to = parcelData.email;
  const subject = `Delivery confirmation for ${parcelData.referenceNumber}`;
  if (process.env.EMAIL_PROVIDER === 'smtp') {
    console.log('SMTP send not implemented');
  }
  console.log('--- EMAIL ---');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', html);
  console.log('--- END EMAIL ---');
}

module.exports = { sendArrivalEmail, sendDeliveryEmail, arrivalEmailHtml, deliveryEmailHtml };
