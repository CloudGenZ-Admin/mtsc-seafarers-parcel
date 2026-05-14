const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, Station } = require('../models');

const router = express.Router();

// stations injected via app.locals
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Username and password are required' } });
    }
    
    // Check if it's a Station Staff
    const station = await Station.findOne({ where: { staffUsername: username } });

    if (station && (await bcrypt.compare(password, station.staffPasswordHash))) {
      const token = jwt.sign(
        { stationId: station.id, role: 'staff', stationName: station.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token, stationId: station.id, stationName: station.name, role: 'staff' });
    }

    // Check if it's a Super Admin
    const admin = await Admin.findOne({ where: { username } });
    if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
      const token = jwt.sign(
        { adminId: admin.id, role: 'admin', username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // For Super Admin, we'll default to the first station but they can switch
      const stations = await Station.findAll();
      const defaultStation = stations[0];
      return res.json({ 
        token, 
        stationId: defaultStation.id, 
        stationName: defaultStation.name, 
        role: 'admin',
        username: admin.username 
      });
    }

    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Credentials are incorrect' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

module.exports = router;
