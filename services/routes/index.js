const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const healthRoutes = require('./health');
const userRoutes = require('./users');
const expenseRoutes = require('./expenses');
const groupRoutes = require('./groups');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/expenses', expenseRoutes);
router.use('/groups', groupRoutes);
router.use('/healthz', healthRoutes);

module.exports = router;