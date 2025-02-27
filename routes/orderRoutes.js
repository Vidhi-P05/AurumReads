const express = require("express");
const Order = require("../models/Order");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new order (Checkout)
router.post("/checkout", authenticateUser, async (req, res) => {
    try {
        const { items, totalPrice, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in the order" });
        }

        const order = new Order({
            user: req.user.id,
            items,
            totalPrice,
            shippingAddress,
            paymentStatus: "Pending"
        });

        await order.save();
        res.status(201).json({ message: "Order placed successfully", order });

    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get orders for logged-in user
router.get("/my-orders", authenticateUser, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate("items.book");
        res.json(orders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all orders (Admin only)
router.get("/all-orders", authenticateUser, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const orders = await Order.find().populate("user", "username email").populate("items.book");
        res.json(orders);
    } catch (error) {
        console.error("Admin Orders Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
