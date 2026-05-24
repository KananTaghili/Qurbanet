const express = require("express");
const router = express.Router();
const { handleResult, handleReturn } = require("../controllers/epointController");

// POST /api/epoint/result — EPoint server-to-server callback (merchant paneldə result_url kimi qeyd et)
router.post("/result", handleResult);

// GET /api/epoint/return — EPoint brauzer yönləndirilməsi
router.get("/return", handleReturn);

module.exports = router;
