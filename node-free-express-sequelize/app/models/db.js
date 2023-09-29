'use strict';

const Sequelize = require('sequelize');

const { mysqlUrl } = require('../config');

const sequelize = new Sequelize(mysqlUrl, {
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: console.log
});

module.exports = sequelize;