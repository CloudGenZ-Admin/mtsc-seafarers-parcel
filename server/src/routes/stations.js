const express = require('express');
const router = express.Router();

const { Station } = require('../models');

// GET /api/stations - list all stations (no credentials exposed)
router.get('/', async (req, res) => {
  try {
    const stations = await Station.findAll({
      attributes: ['id', 'name', 'address', 'phone', 'email']
    });
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch stations' } });
  }
});

module.exports = router;
