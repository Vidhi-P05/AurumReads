const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    coverImage: { type: String, required: true }, // URL of the book cover
    category: { type: String, required: true },
    stock: { type: Number, default: 0 }, // Number of books available
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin user who added the book
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
