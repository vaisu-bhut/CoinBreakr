const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const healthRoutes = require('./health');

// Mount routes
router.use('/auth', authRoutes);
router.use('/healthz', healthRoutes);

// Default API info route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CoinBreakr API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/healthz',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (Protected)',
        updateProfile: 'PUT /api/auth/profile (Protected)'
      }
    }
  });
});

module.exports = router;
