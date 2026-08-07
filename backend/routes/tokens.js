const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// Routes
router.get('/', tokenController.getTokens);
router.get('/:id', tokenController.getTokenById);
router.post('/generate', tokenController.generateToken);
router.put('/:id/status', tokenController.updateTokenStatus);
router.get('/department/:department', tokenController.getTokensByDepartment);
router.get('/stats/daily', tokenController.getDailyStats);
router.put('/:id', tokenController.updateToken);
router.post('/call-next', tokenController.callNextToken);
router.get('/department-status/:department', tokenController.getDepartmentStatus);

module.exports = router;