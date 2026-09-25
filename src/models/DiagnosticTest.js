const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DiagnosticTest = sequelize.define(
  "DiagnosticTest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    centreId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "centre_id",
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "diagnostic_tests",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = DiagnosticTest;