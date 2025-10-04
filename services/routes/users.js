const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserProfile,
  searchUsers,
  addFriend,
  removeFriend,
  getFriends,
  getBalanceWithFriend,
  getAllBalances
} = require('../controllers/userController');

// @route   GET /api/users/profile
router.get('/profile', authenticateToken, getUserProfile);

// @route   GET /api/users/search
router.get('/search', authenticateToken, searchUsers);

// @route   GET /api/users/friends
router.get('/friends', authenticateToken, getFriends);

// @route   POST /api/users/friends
router.post('/friends', authenticateToken, addFriend);

// @route   DELETE /api/users/friends/:friendId
router.delete('/friends/:friendId', authenticateToken, removeFriend);

// @route   GET /api/users/friends/:friendId/balance
router.get('/friends/:friendId/balance', authenticateToken, getBalanceWithFriend);

// @route   GET /api/users/balances
router.get('/balances', authenticateToken, getAllBalances);

module.exports = router;