const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = ['id', 'name', 'address', 'staffUsername', 'staffPasswordHash'];

function validateStationConfig(data) {
  if (!data || !Array.isArray(data.stations)) {
    return { valid: false, error: 'Config must contain a "stations" array' };
  }
  for (let i = 0; i < data.stations.length; i++) {
    const station = data.stations[i];
    for (const field of REQUIRED_FIELDS) {
      if (!station[field] || typeof station[field] !== 'string' || !station[field].trim()) {
        return { valid: false, error: `Station at index ${i} missing or empty field: ${field}` };
      }
    }
  }
  return { valid: true };
}

function loadStations() {
  const filePath = path.join(__dirname, 'stations.json');
  if (!fs.existsSync(filePath)) {
    console.error('Station config file not found:', filePath);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const result = validateStationConfig(data);
  if (!result.valid) {
    console.error('Invalid station config:', result.error);
    process.exit(1);
  }
  if (data.stations.length === 0) {
    console.warn('Warning: stations array is empty');
  }
  return data.stations;
}

module.exports = { loadStations, validateStationConfig };
