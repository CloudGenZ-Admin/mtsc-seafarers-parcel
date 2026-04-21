const express = require('express');
const { PreferredStation } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const prefs = await PreferredStation.findAll({ where: { userId: req.user.userId } });
    res.json(prefs.map(p => ({ id: p.id, stationId: p.stationId })));
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch preferences' } });
  }
});

router.post('/', async (req, res) => {
  try {
    const { stationId } = req.body;
    if (!stationId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'stationId is required' } });
    }
    const [pref, created] = await PreferredStation.findOrCreate({
      where: { userId: req.user.userId, stationId },
      defaults: { userId: req.user.userId, stationId },
    });
    res.status(created ? 201 : 200).json({ id: pref.id, stationId: pref.stationId });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to save preference' } });
  }
});

router.delete('/:stationId', async (req, res) => {
  try {
    const deleted = await PreferredStation.destroy({
      where: { userId: req.user.userId, stationId: req.params.stationId },
    });
    if (!deleted) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Preference not found' } });
    res.json({ message: 'Preference removed' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to remove preference' } });
  }
});

module.exports = router;
