const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration
const config = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    }
  },
  test: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database_test.sqlite'),
    logging: false
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    }
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(config[process.env.NODE_ENV || 'development']);

module.exports = { sequelize, config };