const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const public_users = express.Router();
const regd_users = express.Router();
const JWT_SECRET = 'mySuperSecretKey12345!';  // Use environment variable for JWT_SECRET

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];  // Get token from Authorization header

    if (!token) {
        return res.status(403).json({ message: "No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Failed to authenticate token." });
        }
        req.username = decoded.username;  // Attach the username to the request object
        next();
    });
};

public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required!" });
    }

    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ message: "Username already exists!" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User registered successfully!" });
});

public_users.post("/customer/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Both username and password are required." });
    }

    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
        return res.status(400).json({ message: "Invalid username or password." });
    }

    // Generate JWT token
    const token = jwt.sign({ username: username }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: "Login successful.", token: token });
});

public_users.get('/', async (req, res) => {
   try {
     const response = await axios.get('http://localhost:5000/books');
      const booksList = response.data;
       return res.status(200).json(booksList);
       } catch (error) {
       return res.status(500).json({ message: "Error fetching books list." });
       }
       });

       public_users.get('/isbn/:isbn', async (req, res) => {
       const isbn = req.params.isbn;
        try { 
        const response = await axios.get(`http://localhost:5000/books/isbn/${isbn}`);
       const book = response.data;
        return res.status(200).json(book);
       } catch (error) {
         return res.status(404).json({ message: "Book not found!" });
         } 
        });

        public_users.get('/author/:author', async (req, res) => {
           const author = req.params.author;
            try {
               const response = await axios.get(`http://localhost:5000/books/author/${author}`);
                const booksByAuthor = response.data;
                 return res.status(200).json(booksByAuthor);
                 } catch (error) {
                   return res.status(404).json({ message: "No books found for this author!" });
                   } 
                  });
                  public_users.get('/title/:title', async (req, res) => {
                   const title = req.params.title; 
                   try { 
                    const response = await axios.get(`http://localhost:5000/books/title/${title}`);
                     const booksByTitle = response.data;
                      return res.status(200).json(booksByTitle);
                     } catch (error) {
                       return res.status(404).json({ message: "No books found with this title!" });
                       } 
                      });

public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book && book.reviews) {
        return res.status(200).json(book.reviews);
    } else {
        return res.status(404).json({ message: "No reviews found for this book!" });
    }
});

// Task 8: Add or Modify a Book Review
public_users.post('/review/:isbn', verifyToken, (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;  // Get review from the request body
    const username = req.username;  // Get username from the decoded JWT

    if (!review || !isbn) {
        return res.status(400).json({ message: "Review and ISBN are required." });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Initialize reviews if not already present
    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    // Add or modify the review for the book
    books[isbn].reviews[username] = review;  // Add or update the review
    return res.status(200).json({ message: "Review added or updated successfully." });
});

// Task 9: Delete a Book Review
regd_users.delete("/auth/review/:isbn", verifyToken, (req, res) => {
    const isbn = req.params.isbn;
    const username = req.username;  // Get username from the decoded JWT

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    if (books[isbn].reviews && books[isbn].reviews[username]) {
        delete books[isbn].reviews[username];  // Delete the review
        return res.status(200).json({ message: "Review deleted successfully." });
    } else {
        return res.status(404).json({ message: "Review not found." });
    }
});

module.exports.general = public_users;
module.exports.auth = regd_users;
