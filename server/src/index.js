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
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

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
