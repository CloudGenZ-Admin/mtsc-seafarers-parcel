const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendResetPasswordEmail } = require('../services/emailService');

const router = express.Router();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email, password, first name, and last name are required' } });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'Email is already in use' } });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, firstName, lastName, phone: phone || null });
    const token = jwt.sign({ userId: user.id, role: 'seafarer', email: user.email, firstName: user.firstName, lastName: user.lastName }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
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
    const token = jwt.sign({ userId: user.id, role: 'seafarer', email: user.email, firstName: user.firstName, lastName: user.lastName }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

// POST /api/auth/forgot-password - Send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email is required' } });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, an OTP has been sent' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await user.update({
      resetOtp: otp,
      resetOtpExpiry: otpExpiry,
    });

    await sendResetPasswordEmail({
      email: user.email,
      firstName: user.firstName,
      otp,
    });

    res.json({ message: 'If the email exists, an OTP has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to process request' } });
  }
});

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and OTP are required' } });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });
    }

    if (new Date() > user.resetOtpExpiry) {
      await user.update({ resetOtp: null, resetOtpExpiry: null });
      return res.status(400).json({ error: { code: 'EXPIRED_OTP', message: 'OTP has expired' } });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid OTP' } });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to verify OTP' } });
  }
});

// POST /api/auth/reset-password - Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email, OTP, and new password are required' } });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });
    }

    if (new Date() > user.resetOtpExpiry) {
      await user.update({ resetOtp: null, resetOtpExpiry: null });
      return res.status(400).json({ error: { code: 'EXPIRED_OTP', message: 'OTP has expired' } });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid OTP' } });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({
      passwordHash,
      resetOtp: null,
      resetOtpExpiry: null,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to reset password' } });
  }
});

module.exports = router;
