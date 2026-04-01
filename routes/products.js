const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

let products = [
  { id: 1, name: "Widget A", price: 9.99, stock: 100 },
  { id: 2, name: "Widget B", price: 19.99, stock: 50 },
  { id: 3, name: "Gadget X", price: 49.99, stock: 25 },
];

// GET /products — list all, supports ?category= and ?minPrice=
router.get("/", (req, res) => {
  let result = products;
  if (req.query.minPrice) {
    result = result.filter((p) => p.price >= parseFloat(req.query.minPrice));
  }
  res.json(result);
});

// GET /products/:id
router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// POST /products — protected
router.post("/", authenticate, (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: "name and price are required" });
  }
  const newProduct = { id: products.length + 1, name, price, stock: stock ?? 0 };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH /products/:id — partial update, protected
router.patch("/:id", authenticate, (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  const { name, price, stock } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;
  res.json(product);
});

// DELETE /products/:id — protected
router.delete("/:id", authenticate, (req, res) => {
  const index = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  const [removed] = products.splice(index, 1);
  res.json({ message: "Product deleted", product: removed });
});

module.exports = router;
