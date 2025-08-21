// routes/userRoutes.js
const express = require('express');
const { registerUser, getUsers, login } = require('../Controllers/userController');
const { validateUser } = require("../middleware/validation");
const { authMiddleware } = require("../middleware/authmiddleware");
const router = express.Router();

router.post('/register', validateUser, registerUser); 
router.get('/profile', authMiddleware, getUsers); 
router.post('/login', login);

module.exports = router;
