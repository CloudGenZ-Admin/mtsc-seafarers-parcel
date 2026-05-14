const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Station', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.TEXT,
    },
    staffUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    staffPasswordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
