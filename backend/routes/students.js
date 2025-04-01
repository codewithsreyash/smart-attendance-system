const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([{ name: "Alice", age: 22, status: "Present" }]);
});

module.exports = router;
