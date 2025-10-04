const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createExpense,
  getUserExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  settleExpenseSplit,
  getExpensesBetweenUsers,
  getGroupExpenses,
  getGroupBalance
} = require('../controllers/expenseController');

// @route   POST /api/expenses
router.post('/', authenticateToken, createExpense);

// @route   GET /api/expenses
router.get('/', authenticateToken, getUserExpenses);

// @route   GET /api/expenses/between/:friendId
router.get('/between/:friendId', authenticateToken, getExpensesBetweenUsers);

// @route   GET /api/expenses/:id
router.get('/:id', authenticateToken, getExpenseById);

// @route   PUT /api/expenses/:id
router.put('/:id', authenticateToken, updateExpense);

// @route   DELETE /api/expenses/:id
router.delete('/:id', authenticateToken, deleteExpense);

// @route   POST /api/expenses/:id/settle
router.post('/:id/settle', authenticateToken, settleExpenseSplit);

// @route   GET /api/expenses/group/:groupId
router.get('/group/:groupId', authenticateToken, getGroupExpenses);

// @route   GET /api/expenses/group/:groupId/balance
router.get('/group/:groupId/balance', authenticateToken, getGroupBalance);

module.exports = router;