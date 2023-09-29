'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => res.sendFile('index.html'));

router.use('/tasks', require('./tasks'));

module.exports = router;