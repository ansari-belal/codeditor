const express = require("express");
const router = express.Router();
//const userController = require("../controllers/userController.js");

router.get('/', (req, res) => {
  res.sendFile(__dirname + "/views/editor.html")
});

module.exports = router;