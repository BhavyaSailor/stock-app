const express = require("express");
const { startPull } = require("../controllers/pullController");

const router = express.Router();

router.post("/", startPull);

module.exports = router;
