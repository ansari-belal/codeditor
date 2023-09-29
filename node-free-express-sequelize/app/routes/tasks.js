'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const Task = require('../models/task');

router.get('/', (request, response) => {

    new Task().read()
        .then(res => response.send(res))
        .catch(e => {
            console.error(e);
            response.sendStatus(500);
        });
});

router.get('/:id', (request, response) => {

    const { id } = request.params;

    new Task().readOne({ id })
        .then(res => response.send(res))
        .catch(e => {
            console.error(e);
            response.sendStatus(500);
        });
});

router.post('/', (request, response) => {

    const { name, desc } = request.body;

    if (!name || !desc) return response.sendStatus(400);

    new Task().add({ name, desc })
        .then(res => response.send(res))
        .catch(e => {
            console.error(e);
            response.sendStatus(500);
        });
});

router.put('/:id', async (request, response) => {

    const { id } = request.params;
    const { name, desc } = request.body;

    if (!name && !desc) return response.sendStatus(400);

    new Task().update({ name, desc }, { id })
        .then(() => response.sendStatus(200))
        .catch(e => {
            console.error(e);
            response.sendStatus(500);
        });
});

router.delete('/:id', async (request, response) => {

    const { id } = request.params;

    new Task().delete({ id })
        .then(() => response.sendStatus(200))
        .catch(e => {
            console.error(e);
            response.sendStatus(500);
        });
});

module.exports = router;