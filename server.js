require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const userRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require("./routes/orderRoutes");
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Configure Express Sessions
app.use(session({
    secret: 'aurumreads_secret', // Use an environment variable in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 } // 1 hour
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Use Routes
app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);
app.use("/api/orders", orderRoutes);

// Define a test route
app.get('/', (req, res) => {
    res.send('AurumReads API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
