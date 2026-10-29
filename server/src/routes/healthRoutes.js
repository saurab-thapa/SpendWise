import express from "express";

const router = express.Router();

router.get("/health", function getHealth(req, res) {
  res.json({ success: true, data: { status: "ok" } });
});

export default router;
