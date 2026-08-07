const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Routes
router.post('/login', staffController.login);
router.post('/register', staffController.register);
router.get('/profile', staffController.getProfile);
router.put('/profile', staffController.updateProfile);
router.get('/', staffController.getAllStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;