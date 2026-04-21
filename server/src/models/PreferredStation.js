const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PreferredStation = sequelize.define('PreferredStation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    stationId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'stationId'],
      },
    ],
    updatedAt: false,
  });

  return PreferredStation;
};
