require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
const { loadStations } = require('./config/stationConfig');
const auth = require('./middleware/auth');
const stationAuth = require('./middleware/stationAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load station config
app.locals.stations = loadStations();
console.log(`Loaded ${app.locals.stations.length} station(s)`);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/station', require('./routes/stationAuth'));
app.use('/api/stations', auth, require('./routes/stations'));
app.use('/api/preferences/stations', auth, require('./routes/preferences'));
app.use('/api/parcels', auth, require('./routes/parcels'));
app.use('/api/station/parcels', stationAuth, require('./routes/stationParcels'));
app.use('/api/station/reports', stationAuth, require('./routes/reports'));

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
});

// Start
syncDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
  process.exit(1);
});

module.exports = app;
