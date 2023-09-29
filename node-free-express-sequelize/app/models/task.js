'use strict';

const Sequelize = require('sequelize');
const sequelize = require('./db');

const { Model } = Sequelize;

class Task extends Model {

    read(filter) {
        return Task.findAll({ where: filter });
    }

    readOne(filter) {
        return Task.findOne({ where: filter });
    }

    add(data) {
        return Task.create(data);
    }

    update(data, filter) {
        return Task.update(data, { where: filter });
    }

    delete(filter) {
        return Task.destroy({ where: filter });
    }
}

Task.init({
    id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    name: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: '',
        field: 'name'
    },
    desc: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
        field: 'desc'
    }
}, {
    sequelize,
    tableName: 'tasks',
    timestamps: false,
    freezeTableName: true
});

module.exports = Task;
