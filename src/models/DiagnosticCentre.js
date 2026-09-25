const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DiagnosticCentre = sequelize.define(
  "DiagnosticCentre",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "diagnostic_centres",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = DiagnosticCentre;