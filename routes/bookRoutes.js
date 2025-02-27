const express = require("express");
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require("../middleware/authMiddleware");
const { createBook, getBooks, getBookById, updateBook, deleteBook } = require("../controllers/bookController");

// Create a new book (Admin only)
router.post("/", authenticateUser, authenticateAdmin, createBook);

// Get all books (with pagination, filtering, searching, and sorting)
router.get("/", getBooks);

// Get a single book by ID
router.get("/:id", getBookById);

//  Update a book (Admin only)
router.put("/:id", authenticateUser, authenticateAdmin, updateBook);

// Delete a book (Admin only)
router.delete("/:id", authenticateUser, authenticateAdmin, deleteBook);

module.exports = router;
