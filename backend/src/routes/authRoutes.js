const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Vérifier que register et login existent
console.log('📦 register:', typeof register);
console.log('📦 login:', typeof login);

// Routes publiques
router.post('/register', register);
router.post('/login', login);

module.exports = router;