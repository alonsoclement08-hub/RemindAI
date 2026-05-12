const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getPriceComparison } = require("../services/priceComparison");

const router = express.Router();
router.use(authMiddleware);

// GET /api/products/price-comparison?product=croquettes+chat
router.get("/price-comparison", async (req, res) => {
  const product = req.query.product?.toString().trim();
  if (!product || product.length < 2) {
    return res.status(400).json({ error: "Query param 'product' is required (min 2 chars)" });
  }
  if (product.length > 200) {
    return res.status(400).json({ error: "Product name too long (max 200 chars)" });
  }

  try {
    const result = await getPriceComparison(product);
    res.json(result);
  } catch (err) {
    console.error("Price comparison error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
