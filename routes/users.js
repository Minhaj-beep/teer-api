const express = require('express');
const router = express.Router();
const Users = require('../models/users');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await Users.find();
        res.json(users);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Route to check user status by username using query parameters
router.get('/status', async (req, res) => {
    const { name } = req.query;

    try {
        const user = await Users.findOne({ name });
        if (user) {
            res.json({ name: user.name, status: user.status });
        } else {
            res.status(404).json({ message: "User not found." });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get one user by ID
router.get('/:id', getUser, (req, res) => {
    res.json(res.user);
});

// Create a new user
router.post('/', checkDuplicateName, async (req, res) => {
    const user = new Users({
        name: req.body.name,
        pass: req.body.pass,
        status: req.body.status // Assuming status is provided in the request body
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

// Delete a user by ID
router.delete('/:id', getUser, async (req, res) => {
    try {
        await Users.deleteOne({ _id: res.user._id });
        res.json({ message: "User Deleted." });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Update a user by ID
router.patch('/:id', getUser, checkDuplicateNameOnUpdate, async (req, res) => {
    if (req.body.name != null) {
        res.user.name = req.body.name;
    }
    if (req.body.pass != null) {
        res.user.pass = req.body.pass;
    }
    if (req.body.status != null) {
        res.user.status = req.body.status;
    }
    try {
        const updatedUser = await res.user.save();
        res.json(updatedUser);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

async function checkDuplicateNameOnUpdate(req, res, next) {
    try {
        const existingUser = await Users.findOne({ name: req.body.name });
        if (existingUser && existingUser._id.toString() !== req.params.id) {
            return res.status(400).json({ message: "Username already exists." });
        }
        next();
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

// Login route
router.post('/login', async (req, res) => {
    const { name, pass } = req.body;

    try {
        const user = await Users.findOne({ name, pass });
        if (user) {
            if (user.status) {
                res.json({ message: "Login successful." });
            } else {
                res.status(403).json({ message: "User is inactive." });
            }
        } else {
            res.status(401).json({ message: "Invalid credentials." });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

async function getUser(req, res, next) {
    let user;
    try {
        user = await Users.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
    res.user = user;
    next();
}

async function checkDuplicateName(req, res, next) {
    try {
        const existingUser = await Users.findOne({ name: req.body.name });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists." });
        }
        next();
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

module.exports = router;
