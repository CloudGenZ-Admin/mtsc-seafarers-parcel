const express = require('express');
const { Op } = require('sequelize');
const { ParcelRequest, User } = require('../models');
const { getHandlingFee } = require('../utils/handlingFees');
const { generateUniqueReference } = require('../utils/referenceNumber');
const { validateTransition, getTimestampField } = require('../utils/statusTransitions');
const { createCheckoutSession, retrieveSession } = require('../services/stripeService');
const { generateQRCode } = require('../services/qrService');
const { generateReceiptPDF } = require('../services/receiptService');

const router = express.Router();

function findStation(req, stationId) {
  return req.app.locals.stations.find(s => s.id === stationId);
}

// POST /api/parcels - create parcel + Stripe session
router.post('/', async (req, res) => {
  try {
    const { stationId, size } = req.body;
    if (!stationId || !size) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'stationId and size are required' } });
    }
    const station = findStation(req, stationId);
    if (!station) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Station not found' } });

    let handlingFeeCents;
    try { handlingFeeCents = getHandlingFee(size); } catch {
      return res.status(400).json({ error: { code: 'INVALID_SIZE', message: 'Invalid parcel size' } });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&size=${encodeURIComponent(size)}&stationId=${encodeURIComponent(stationId)}`;
    const cancelUrl = `${frontendUrl}/payment/cancel`;

    const session = await createCheckoutSession({ size, handlingFeeCents, successUrl, cancelUrl });
    res.status(201).json({ sessionUrl: session.url, sessionId: session.id });
  } catch (err) {
    res.status(502).json({ error: { code: 'STRIPE_ERROR', message: 'Failed to create payment session. Please retry.' } });
  }
});

// POST /api/parcels/confirm-payment - verify Stripe session, finalize parcel
router.post('/confirm-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'sessionId is required' } });

    // Idempotency: check if parcel already exists for this session
    const existing = await ParcelRequest.findOne({ where: { stripeSessionId: sessionId } });
    if (existing) {
      const station = findStation(req, existing.stationId);
      return res.json({ ...existing.toJSON(), stationName: station?.name, stationAddress: station?.address, stationPhone: station?.phone, stationEmail: station?.email });
    }

    const { size, stationId } = req.body;
    if (!size || !stationId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'size and stationId are required' } });
    }

    let session;
    try {
      session = await retrieveSession(sessionId);
    } catch (stripeErr) {
      console.error('Stripe retrieve error:', stripeErr.message);
      return res.status(502).json({ error: { code: 'STRIPE_ERROR', message: 'Failed to verify payment with Stripe. Please retry.' } });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: { code: 'PAYMENT_INCOMPLETE', message: 'Payment was not completed' } });
    }

    const handlingFeeCents = getHandlingFee(size);
    const referenceNumber = await generateUniqueReference(async (ref) => {
      return !!(await ParcelRequest.findOne({ where: { referenceNumber: ref } }));
    });

    const parcel = await ParcelRequest.create({
      referenceNumber, userId: req.user.userId, stationId, size,
      handlingFeeCents, status: 'AwaitingShipment', stripeSessionId: sessionId,
    }).catch(async (createErr) => {
      if (createErr.name === 'SequelizeUniqueConstraintError') {
        return ParcelRequest.findOne({ where: { stripeSessionId: sessionId } });
      }
      throw createErr;
    });

    const station = findStation(req, stationId);
    res.json({
      ...parcel.toJSON(),
      stationName: station?.name,
      stationAddress: station?.address,
      stationPhone: station?.phone,
      stationEmail: station?.email,
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: { code: 'PAYMENT_VERIFY_ERROR', message: 'Unable to verify payment. Please try again.' } });
  }
});

// GET /api/parcels/active
router.get('/active', async (req, res) => {
  try {
    const parcels = await ParcelRequest.findAll({
      where: { userId: req.user.userId, status: { [Op.ne]: 'Delivered' } },
      order: [['createdAt', 'DESC']],
    });
    const result = parcels.map(p => {
      const station = findStation(req, p.stationId);
      return { ...p.toJSON(), stationName: station?.name, stationAddress: station?.address, stationPhone: station?.phone, stationEmail: station?.email };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch parcels' } });
  }
});

// GET /api/parcels/delivered
router.get('/delivered', async (req, res) => {
  try {
    const parcels = await ParcelRequest.findAll({
      where: { userId: req.user.userId, status: 'Delivered' },
      order: [['deliveredAt', 'DESC']],
    });
    const result = parcels.map(p => {
      const station = findStation(req, p.stationId);
      return { ...p.toJSON(), stationName: station?.name, stationAddress: station?.address, stationPhone: station?.phone, stationEmail: station?.email };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch parcels' } });
  }
});

// GET /api/parcels/:id
router.get('/:id', async (req, res) => {
  try {
    const parcel = await ParcelRequest.findOne({ where: { id: req.params.id, userId: req.user.userId } });
    if (!parcel) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parcel not found' } });
    const station = findStation(req, parcel.stationId);
    res.json({ ...parcel.toJSON(), stationName: station?.name, stationAddress: station?.address, stationPhone: station?.phone, stationEmail: station?.email });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch parcel' } });
  }
});

// PATCH /api/parcels/:id/tracking
router.patch('/:id/tracking', async (req, res) => {
  try {
    const { trackingLink, shippingFrom, estimatedArrival } = req.body;

    const parcel = await ParcelRequest.findOne({ where: { id: req.params.id, userId: req.user.userId } });
    if (!parcel) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parcel not found' } });

    if (!validateTransition(parcel.status, 'Shipped')) {
      return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${parcel.status} to Shipped` } });
    }

    await parcel.update({ trackingLink: trackingLink || null, shippingFrom: shippingFrom || null, estimatedArrival: estimatedArrival || null, status: 'Shipped', shippedAt: new Date() });
    res.json(parcel.toJSON());
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update tracking' } });
  }
});

// GET /api/parcels/:id/qrcode
router.get('/:id/qrcode', async (req, res) => {
  try {
    const parcel = await ParcelRequest.findOne({ where: { id: req.params.id, userId: req.user.userId } });
    if (!parcel) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parcel not found' } });
    if (parcel.status !== 'Arrived') {
      return res.status(400).json({ error: { code: 'NOT_ARRIVED', message: 'QR code only available for arrived parcels' } });
    }
    const qrCode = parcel.qrCodeDataUrl || await generateQRCode(parcel.referenceNumber);
    res.json({ qrCodeDataUrl: qrCode });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to generate QR code' } });
  }
});

// GET /api/parcels/:id/receipt
router.get('/:id/receipt', async (req, res) => {
  try {
    const parcel = await ParcelRequest.findOne({ where: { id: req.params.id, userId: req.user.userId } });
    if (!parcel) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parcel not found' } });
    if (parcel.status !== 'Delivered') {
      return res.status(400).json({ error: { code: 'NOT_DELIVERED', message: 'Receipt only available for delivered parcels' } });
    }
    const station = findStation(req, parcel.stationId);
    const pdf = await generateReceiptPDF({
      referenceNumber: parcel.referenceNumber, stationName: station?.name || parcel.stationId,
      size: parcel.size, handlingFeeCents: parcel.handlingFeeCents,
      deliveredAt: parcel.deliveredAt, signatureDataUrl: parcel.signatureDataUrl,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${parcel.referenceNumber}.pdf`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to generate receipt' } });
  }
});

module.exports = router;
