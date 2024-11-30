const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Configure session middleware
app.use("/customer", session({
    secret: "fingerprint_customer", // Secret key for signing the session ID
    resave: true,                  // Forces the session to be saved back to the session store
    saveUninitialized: true        // Forces a session to be saved even if it's uninitialized
}));

// Authentication middleware for routes under "/customer/auth/*"
app.use("/customer/auth/*", function auth(req, res, next) {
    // Retrieve token from session
    const token = req.session.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify the token
    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        req.user = decoded; // Attach decoded user data to the request object
        next(); // Proceed to the next middleware/route handler
    });
});

// Routes
const PORT = 5000;

app.use("/customer", customer_routes); // Protected customer routes
app.use("/", genl_routes);            // General routes

// Start the server
app.listen(PORT, () => console.log("Server is running on port " + PORT));
