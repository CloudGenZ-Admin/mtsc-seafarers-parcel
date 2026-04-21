const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const ParcelRequest = require('./ParcelRequest')(sequelize);
const PreferredStation = require('./PreferredStation')(sequelize);

User.hasMany(ParcelRequest, { foreignKey: 'userId' });
ParcelRequest.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(PreferredStation, { foreignKey: 'userId' });
PreferredStation.belongsTo(User, { foreignKey: 'userId' });

async function syncDatabase() {
  await sequelize.sync();
  console.log('Database synced successfully');
}

module.exports = { sequelize, User, ParcelRequest, PreferredStation, syncDatabase };
