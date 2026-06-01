const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createTutorial,
  listTutorials,
  getTutorial,
  updateTutorial,
  deleteTutorial
} = require("../controllers/tutorialsController");

// Públicos
router.get("/", listTutorials);
router.get("/:slug", getTutorial);

// Protegidos
router.post("/", auth, createTutorial);
router.patch("/:slug", auth, updateTutorial);
router.delete("/:slug", auth, deleteTutorial);

module.exports = router;