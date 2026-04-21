const express = require('express');
const router = express.Router();

// GET /api/stations - list all stations (no credentials exposed)
router.get('/', (req, res) => {
  const stations = req.app.locals.stations.map(({ id, name, address }) => ({ id, name, address }));
  res.json(stations);
});

module.exports = router;
