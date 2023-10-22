const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mydatabase', 'root', 'mydatabase', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;