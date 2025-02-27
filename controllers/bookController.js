const Book = require("../models/Book");

// Create a new book
const createBook = async (req, res) => {
    try {
        const { title, author, description, price, coverImage, category } = req.body;
        const newBook = new Book({ title, author, description, price, coverImage, category });
        await newBook.save();
        res.status(201).json({ message: "Book created successfully", book: newBook });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all books (with pagination, filtering, searching, and sorting)
const getBooks = async (req, res) => {
    try {
        const { category, search, sortBy, order, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (category) filter.category = category;
        if (search) filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { author: { $regex: search, $options: "i" } }
        ];

        let sortOptions = {};
        if (sortBy) sortOptions[sortBy] = order === "desc" ? -1 : 1;

        const books = await Book.find(filter)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single book by ID
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a book (Admin only)
const updateBook = async (req, res) => {
    try {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBook) return res.status(404).json({ message: "Book not found" });
        res.status(200).json({ message: "Book updated successfully", book: updatedBook });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a book (Admin only)
const deleteBook = async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params.id);
        if (!deletedBook) return res.status(404).json({ message: "Book not found" });
        res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook };
