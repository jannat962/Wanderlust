// const express = require("express");
// const app = express();
// const session = require("express-session");

// app.use(session({secret:"mysuper"}));

// app.get("/test", (req, res)=>{
//     res.send("test successful");
// });

// app.listen(3000, ()=>{
//     console.log("server is listining to 3000");
// });

// Import necessary modules
const express = require('express');
const jwt = require('jsonwebtoken');

// Create an instance of Express
const app = express();

// Secret key for JWT
const secretKey = 'yourSecretKey'; // Replace 'yourSecretKey' with your own secret key

// Dummy user data (replace this with your actual user authentication logic)
const users = [
    {
        id: 1,
        username: 'user1',
        password: 'password1'
    },
    {
        id: 2,
        username: 'user2',
        password: 'password2'
    }
];

// Login endpoint
app.post('/login', (req, res) => {
    // Dummy authentication logic (replace this with your actual authentication logic)
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

    res.json({ token });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }

        req.userId = decoded.userId;
        next();
    });
}

// Protected endpoint (only accessible with a valid JWT token)
app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'You are accessing protected resource' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
