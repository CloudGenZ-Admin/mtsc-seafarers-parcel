const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// stations injected via app.locals
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Username and password are required' } });
    }
    const stations = req.app.locals.stations;
    const station = stations.find(s => s.staffUsername === username);
    if (!station || !(await bcrypt.compare(password, station.staffPasswordHash))) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Credentials are incorrect' } });
    }
    const token = jwt.sign(
      { stationId: station.id, role: 'staff', stationName: station.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, stationId: station.id, stationName: station.name });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

module.exports = router;
