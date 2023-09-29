'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./app/models/db');
const { port } = require('./app/config');

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(require('./app/routes'));

sequelize.sync()
    .then(() => app.listen(port, () => console.log(`Listening on port: ${port}`)))
    .catch(e => console.error(e));
