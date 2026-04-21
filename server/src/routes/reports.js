const express = require('express');
const { Op } = require('sequelize');
const { ParcelRequest } = require('../models');

const router = express.Router();

// GET /api/station/reports?month=1&year=2025
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year = parseInt(req.query.year) || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const parcels = await ParcelRequest.findAll({
      where: {
        stationId: req.user.stationId,
        status: 'Delivered',
        deliveredAt: { [Op.gte]: startDate, [Op.lt]: endDate },
      },
    });

    const breakdown = { Small: { count: 0, fees: 0 }, Medium: { count: 0, fees: 0 }, Large: { count: 0, fees: 0 } };
    let totalCount = 0;
    let totalFees = 0;

    for (const p of parcels) {
      breakdown[p.size].count++;
      breakdown[p.size].fees += p.handlingFeeCents;
      totalCount++;
      totalFees += p.handlingFeeCents;
    }

    res.json({ month, year, totalCount, totalFees, breakdown });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to generate report' } });
  }
});

module.exports = router;
