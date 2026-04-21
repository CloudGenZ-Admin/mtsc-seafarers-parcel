const express = require('express');
const { Op } = require('sequelize');
const { ParcelRequest, User } = require('../models');
const { validateTransition } = require('../utils/statusTransitions');
const { generateQRCode } = require('../services/qrService');
const { sendArrivalEmail, sendDeliveryEmail } = require('../services/emailService');

const router = express.Router();

function findStation(req, stationId) {
  return req.app.locals.stations.find(s => s.id === stationId);
}

// GET /api/station/parcels/incoming
router.get('/incoming', async (req, res) => {
  try {
    const parcels = await ParcelRequest.findAll({
      where: { stationId: req.user.stationId, status: { [Op.in]: ['AwaitingShipment', 'Shipped'] } },
      include: [{ model: User, attributes: ['email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(parcels.map(p => ({
      ...p.toJSON(),
      seafarerEmail: p.User?.email,
    })));
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch incoming parcels' } });
  }
});

// PATCH /api/station/parcels/:id/arrived
router.patch('/:id/arrived', async (req, res) => {
  try {
    const parcel = await ParcelRequest.findOne({
      where: { id: req.params.id, stationId: req.user.stationId },
      include: [{ model: User, attributes: ['email'] }],
    });
    if (!parcel) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parcel not found' } });

    if (!validateTransition(parcel.status, 'Arrived')) {
      return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${parcel.status} to Arrived` } });
    }

    const qrCodeDataUrl = await generateQRCode(parcel.referenceNumber);
    await parcel.update({ status: 'Arrived', arrivedAt: new Date(), qrCodeDataUrl });

    const station = findStation(req, parcel.stationId);
    await sendArrivalEmail({
      email: parcel.User?.email,
      referenceNumber: parcel.referenceNumber,
      stationName: station?.name,
      stationAddress: station?.address,
      qrCodeDataUrl,
    });

    res.json(parcel.toJSON());
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update parcel status' } });
  }
});

// GET /api/station/parcels/lookup/:ref
router.get('/lookup/:ref', async (req, res) => {
  try {
    const parcel = await ParcelRequest.findOne({
      where: { referenceNumber: req.params.ref, stationId: req.user.stationId },
      include: [{ model: User, attributes: ['email'] }],
    });
    if (!parcel) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No active parcel found for this reference number' } });
    }
    res.json({ ...parcel.toJSON(), seafarerEmail: parcel.User?.email });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Lookup failed' } });
  }
});

// POST /api/station/parcels/:id/deliver
router.post('/:id/deliver', async (req, res) => {
  try {
    const { signatureDataUrl } = req.body;
    if (!signatureDataUrl) {
      return res.status(400).json({ error: { code: 'MISSING_SIGNATURE', message: 'Signature is required' } });
    }

    const parcel = await ParcelRequest.findOne({
      where: { id: req.params.id, stationId: req.user.stationId },
      include: [{ model: User, attributes: ['email'] }],
    });
    if (!parcel) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parcel not found' } });

    if (!validateTransition(parcel.status, 'Delivered')) {
      return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${parcel.status} to Delivered` } });
    }

    const deliveredAt = new Date();
    await parcel.update({ status: 'Delivered', deliveredAt, signatureDataUrl });

    const station = findStation(req, parcel.stationId);
    await sendDeliveryEmail({
      email: parcel.User?.email,
      referenceNumber: parcel.referenceNumber,
      stationName: station?.name,
      size: parcel.size,
      deliveredAt,
      signatureDataUrl,
    });

    res.json({ id: parcel.id, status: 'Delivered', deliveredAt });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to confirm delivery' } });
  }
});

module.exports = router;
