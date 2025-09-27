const express = require('express');
const router = express.Router();
const { healthCheck, detailedHealthCheck } = require('../controllers/healthController');
const { authenticateToken } = require('../middleware/auth');

// Public health check
router.get('/', healthCheck);

// Protected detailed health check
router.get('/detailed', authenticateToken, detailedHealthCheck);

module.exports = router;
