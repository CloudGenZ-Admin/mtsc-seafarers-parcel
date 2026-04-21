const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and password are required' } });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'Email is already in use' } });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = jwt.sign({ userId: user.id, role: 'seafarer', email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, userId: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Registration failed' } });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and password are required' } });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    }
    const token = jwt.sign({ userId: user.id, role: 'seafarer', email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, userId: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

module.exports = router;
