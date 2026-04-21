const PDFDocument = require('pdfkit');

function generateReceiptPDF({ referenceNumber, stationName, size, handlingFeeCents, deliveredAt, signatureDataUrl }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fee = (handlingFeeCents / 100).toFixed(2);
    const date = new Date(deliveredAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageWidth = doc.page.width;
    const m = 50;
    const contentWidth = pageWidth - m * 2;

    // Header banner
    doc.rect(0, 0, pageWidth, 110).fill('#0f2744');
    doc.fontSize(22).fillColor('#fbbf24').text('Seafarers Parcel Pickup', m, 32, { width: contentWidth });
    doc.fontSize(10).fillColor('rgba(255,255,255,0.7)').text('Mission to Seafarers Canada', m, 60, { width: contentWidth });
    doc.fontSize(14).fillColor('#ffffff').text('PICKUP RECEIPT', m, 32, { width: contentWidth, align: 'right' });
    doc.fontSize(10).fillColor('rgba(255,255,255,0.7)').text(date, m, 52, { width: contentWidth, align: 'right' });

    // Reference number highlight
    doc.rect(m, 130, contentWidth, 50).fill('#f0f9ff').stroke('#bae6fd');
    doc.fontSize(11).fillColor('#64748b').text('REFERENCE NUMBER', m + 16, 140);
    doc.fontSize(18).fillColor('#0f172a').font('Helvetica-Bold').text(referenceNumber, m + 200, 138).font('Helvetica');

    // Details section
    const detailsTop = 210;
    doc.fontSize(11).fillColor('#94a3b8').text('PARCEL DETAILS', m, detailsTop);
    doc.moveTo(m, detailsTop + 18).lineTo(m + contentWidth, detailsTop + 18).strokeColor('#e2e8f0').stroke();

    const rows = [
      ['Station', stationName],
      ['Parcel Size', size],
      ['Handling Fee', `$${fee} CAD`],
      ['Delivery Date', date],
      ['Status', 'Delivered'],
    ];

    let y = detailsTop + 30;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(m, y - 6, contentWidth, 28).fill('#f8fafc');
      doc.fontSize(11).fillColor('#64748b').text(label, m + 12, y);
      doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text(value, m + 180, y, { width: contentWidth - 192 }).font('Helvetica');
      y += 28;
    });

    // Fee summary box
    y += 12;
    doc.rect(m, y, contentWidth, 44).fill('#fffbeb').stroke('#fde68a');
    doc.fontSize(12).fillColor('#92400e').text('TOTAL PAID', m + 16, y + 14);
    doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold').text(`$${fee} CAD`, m + 16, y + 14, { width: contentWidth - 32, align: 'right' }).font('Helvetica');

    // Signature section
    y += 70;
    doc.fontSize(11).fillColor('#94a3b8').text('SIGNATURE', m, y);
    doc.moveTo(m, y + 18).lineTo(m + contentWidth, y + 18).strokeColor('#e2e8f0').stroke();
    y += 28;

    if (signatureDataUrl && signatureDataUrl.startsWith('data:image')) {
      try {
        const base64 = signatureDataUrl.split(',')[1];
        const imgBuffer = Buffer.from(base64, 'base64');
        doc.rect(m, y, 260, 100).lineWidth(1).strokeColor('#e2e8f0').stroke();
        doc.image(imgBuffer, m + 5, y + 5, { width: 250, height: 90 });
        y += 110;
      } catch {
        doc.fontSize(11).fillColor('#64748b').text('Signature on file', m, y);
        y += 20;
      }
    }

    // Footer
    const footerY = doc.page.height - 80;
    doc.moveTo(m, footerY).lineTo(m + contentWidth, footerY).strokeColor('#e2e8f0').stroke();
    doc.fontSize(9).fillColor('#94a3b8').text('This receipt confirms the pickup and delivery of the above parcel.', m, footerY + 12, { width: contentWidth, align: 'center' });
    doc.text('Seafarers Parcel Pickup Service — Mission to Seafarers Canada — mtsc.ca', m, footerY + 26, { width: contentWidth, align: 'center' });
    doc.text(`Receipt generated on ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`, m, footerY + 40, { width: contentWidth, align: 'center' });

    doc.end();
  });
}

module.exports = { generateReceiptPDF };
