const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configure nodemailer transporter
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Save base64 image to uploads folder
function saveImage(base64Data, referenceNumber, type) {
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Image = base64Data.split(';base64,').pop();
    const filename = `${referenceNumber}_${type}.png`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    fs.writeFileSync(filepath, base64Image, { encoding: 'base64' });

    // Return URL (using BACKEND_URL from env or construct it)
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace(/:\d+$/, ':3001') || 'http://localhost:3001';
    return `${backendUrl}/uploads/${filename}`;
  } catch (error) {
    console.error(`Failed to save ${type} image:`, error.message);
    return null;
  }
}

function arrivalEmailHtml({ stationName, stationAddress, referenceNumber, qrCodeUrl }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1B2A4A;">
<h2>Your Parcel Has Arrived!</h2>
<p>Your parcel <strong>${referenceNumber}</strong> has arrived at <strong>${stationName}</strong>.</p>
<p>Station Address: ${stationAddress}</p>
<p>Please present this QR code at the station for pickup:</p>
<img src="${qrCodeUrl}" alt="QR Code" style="width:200px;height:200px;" />
<p>Thank you,<br/>Mission to Seafarers Canada</p>
</body></html>`;
}

function deliveryEmailHtml({ stationName, referenceNumber, size, deliveredAt, signatureUrl }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1B2A4A;">
<h2>Delivery Confirmation</h2>
<p>Your parcel <strong>${referenceNumber}</strong> has been delivered at <strong>${stationName}</strong>.</p>
<p>Size: ${size} | Date: ${new Date(deliveredAt).toLocaleDateString()}</p>
<p>Signature:</p>
<img src="${signatureUrl}" alt="Signature" style="max-width:300px;" />
<p>Thank you,<br/>Mission to Seafarers Canada</p>
</body></html>`;
}

async function sendArrivalEmail(parcelData) {
  // Save QR code image and get URL
  const qrCodeUrl = saveImage(parcelData.qrCodeDataUrl, parcelData.referenceNumber, 'QR');
  
  if (!qrCodeUrl) {
    console.error('Failed to save QR code image, using base64 fallback');
  }

  const html = arrivalEmailHtml({
    ...parcelData,
    qrCodeUrl: qrCodeUrl || parcelData.qrCodeDataUrl,
  });
  
  const to = parcelData.email;
  const subject = `Parcel ${parcelData.referenceNumber} has arrived at ${parcelData.stationName}`;
  
  const transport = getTransporter();
  
  if (transport) {
    try {
      await transport.sendMail({
        from: `"Mission to Seafarers Canada" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`Arrival email sent to ${to} for parcel ${parcelData.referenceNumber}`);
    } catch (error) {
      console.error('Failed to send arrival email:', error.message);
      console.log('--- EMAIL (FALLBACK) ---');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('--- END EMAIL ---');
    }
  } else {
    console.log('--- EMAIL (NO CONFIG) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('QR Code URL:', qrCodeUrl);
    console.log('--- END EMAIL ---');
  }
}

async function sendDeliveryEmail(parcelData) {
  // Save signature image and get URL
  const signatureUrl = saveImage(parcelData.signatureDataUrl, parcelData.referenceNumber, 'signature');
  
  if (!signatureUrl) {
    console.error('Failed to save signature image, using base64 fallback');
  }

  const html = deliveryEmailHtml({
    ...parcelData,
    signatureUrl: signatureUrl || parcelData.signatureDataUrl,
  });
  
  const to = parcelData.email;
  const subject = `Delivery confirmation for ${parcelData.referenceNumber}`;
  
  const transport = getTransporter();
  
  if (transport) {
    try {
      await transport.sendMail({
        from: `"Mission to Seafarers Canada" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`Delivery email sent to ${to} for parcel ${parcelData.referenceNumber}`);
    } catch (error) {
      console.error('Failed to send delivery email:', error.message);
      console.log('--- EMAIL (FALLBACK) ---');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('--- END EMAIL ---');
    }
  } else {
    console.log('--- EMAIL (NO CONFIG) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Signature URL:', signatureUrl);
    console.log('--- END EMAIL ---');
  }
}

module.exports = { sendArrivalEmail, sendDeliveryEmail, arrivalEmailHtml, deliveryEmailHtml };
