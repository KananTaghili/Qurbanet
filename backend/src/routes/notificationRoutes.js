const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

// Bütün bildiriş endpointləri qeydiyyatlı istifadəçi tələb edir
router.use(authenticate);

router.get("/",              ctrl.list);
router.get("/unread-count",  ctrl.unreadCount);
router.patch("/read-all",    ctrl.markAllRead);
router.patch("/:id/read",    ctrl.markRead);

module.exports = router;
