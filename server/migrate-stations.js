require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, Station } = require('./src/models');

async function migrateStations() {
  try {
    await sequelize.sync();
    
    const jsonPath = path.join(__dirname, 'src', 'config', 'stations.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('stations.json not found');
      return;
    }
    
    const { stations } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    for (const s of stations) {
      await Station.upsert({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        email: s.email,
        staffUsername: s.staffUsername,
        staffPasswordHash: s.staffPasswordHash,
      });
      console.log(`Migrated station: ${s.name}`);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateStations();
