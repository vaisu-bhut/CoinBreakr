const express = require('express');
const { body } = require('express-validator');
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup
} = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 100 })
    .withMessage('Group name cannot be more than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Group name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Group name cannot be more than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
];

const addMemberValidation = [
  body('memberEmail')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['member', 'admin'])
    .withMessage('Role must be either member or admin')
];

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', authenticateToken, createGroupValidation, createGroup);

// @route   GET /api/groups
// @desc    Get all groups for the authenticated user
// @access  Private
router.get('/', authenticateToken, getGroups);

// @route   GET /api/groups/:id
// @desc    Get a specific group
// @access  Private
router.get('/:id', authenticateToken, getGroup);

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Private
router.put('/:id', authenticateToken, updateGroupValidation, updateGroup);

// @route   DELETE /api/groups/:id
// @desc    Delete a group (only creator can delete)
// @access  Private
router.delete('/:id', authenticateToken, deleteGroup);

// @route   POST /api/groups/:id/members
// @desc    Add a member to the group
// @access  Private
router.post('/:id/members', authenticateToken, addMemberValidation, addMember);

// @route   DELETE /api/groups/:id/members/:memberId
// @desc    Remove a member from the group
// @access  Private
router.delete('/:id/members/:memberId', authenticateToken, removeMember);

// @route   DELETE /api/groups/:id/leave
// @desc    Leave the group (user removes themselves)
// @access  Private
router.delete('/:id/leave', authenticateToken, leaveGroup);

module.exports = router;
