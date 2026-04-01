const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

let orders = [];
let nextId = 1;

// GET /orders — list orders for authenticated user
router.get("/", authenticate, (req, res) => {
  const userOrders = orders.filter((o) => o.userId === req.user.id);
  res.json(userOrders);
});

// GET /orders/:id
router.get("/:id", authenticate, (req, res) => {
  const order = orders.find(
    (o) => o.id === parseInt(req.params.id) && o.userId === req.user.id
  );
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// POST /orders — place a new order
router.post("/", authenticate, (req, res) => {
  const { items } = req.body; // [{ productId, quantity }]
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }
  const order = {
    id: nextId++,
    userId: req.user.id,
    items,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  res.status(201).json(order);
});

// PATCH /orders/:id/status — update order status
router.patch("/:id/status", authenticate, (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  const { status } = req.body;
  const valid = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(", ")}` });
  }
  order.status = status;
  res.json(order);
});

module.exports = router;
