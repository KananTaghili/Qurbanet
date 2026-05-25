const express = require("express");
const router  = express.Router();
const {
  handleResult,
  handleReturn,
  createTransactionHandler,
  createPreAuthHandler,
  completePreAuthHandler,
  getTransactionHandler,
  getTransactionsHandler,
  reverseHandler,
  registerCardHandler,
  executePayHandler,
} = require("../controllers/epointController");

// ─── Callbacks ────────────────────────────────────────────────────────────────
// POST /api/epoint/result          — merchant panel-də result_url olaraq qeyd et
// POST /api/epoint/callback/result — eyni handler, Qurbanet-Service uyğun yol
router.post("/result",          handleResult);
router.post("/callback/result", handleResult);

// ─── Browser redirect ─────────────────────────────────────────────────────────
// GET /api/epoint/return
router.get("/return", handleReturn);

// ─── Standalone Epoint operations (no MongoDB) ────────────────────────────────
// POST /api/epoint/create-transaction
router.post("/create-transaction", createTransactionHandler);

// POST /api/epoint/create-preauth
router.post("/create-preauth", createPreAuthHandler);

// POST /api/epoint/preauth-complete/:id
router.post("/preauth-complete/:id", completePreAuthHandler);

// POST /api/epoint/reverse/:id
router.post("/reverse/:id", reverseHandler);

// POST /api/epoint/card-registration
router.post("/card-registration", registerCardHandler);

// POST /api/epoint/execute-pay
router.post("/execute-pay", executePayHandler);

// GET /api/epoint/transaction/:id
router.get("/transaction/:id", getTransactionHandler);

// GET /api/epoint/transactions
router.get("/transactions", getTransactionsHandler);

module.exports = router;
