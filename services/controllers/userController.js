const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/Expense');

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('name email profileImage phoneNumber').select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search term must be at least 2 characters long'
            });
        }

        // Escape special regex characters to prevent errors
        const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const users = await User.find({
            $and: [
                { _id: { $ne: req.userId } }, // Exclude current user
                {
                    $or: [
                        { name: { $regex: escapedQuery, $options: 'i' } },
                        { email: { $regex: escapedQuery, $options: 'i' } }
                    ]
                }
            ]
        }).select('name email profileImage').limit(20);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('friends', 'name email profileImage')
            .select('friends');

        res.json({
            success: true,
            data: user.friends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const addFriend = async (req, res) => {
    try {
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: 'Friend ID is required'
            });
        }

        if (friendId.toString() === req.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add yourself as a friend'
            });
        }

        // Check if friend exists
        let friend;
        try {
            friend = await User.findById(friendId);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw error;
        }
        
        if (!friend) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already friends
        const user = await User.findById(req.userId);
        if (user.friends.includes(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already your friend'
            });
        }

        // Add friend to both users
        await User.findByIdAndUpdate(req.userId, {
            $addToSet: { friends: friendId }
        });

        await User.findByIdAndUpdate(friendId, {
            $addToSet: { friends: req.userId }
        });

        res.status(201).json({
            success: true,
            message: 'Friend added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;

        // Validate ObjectId format
        try {
            new mongoose.Types.ObjectId(friendId);
        } catch (error) {
            return res.status(204).send();
        }

        // Remove friend from both users
        await User.findByIdAndUpdate(req.userId, {
            $pull: { friends: friendId }
        });

        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.userId }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const getBalanceWithFriend = async (req, res) => {
    try {
        const { friendId } = req.params;

        // Check if users are friends
        const user = await User.findById(req.userId);
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not your friend'
            });
        }

        const balance = await Expense.getBalanceWithUser(req.userId, friendId);
        const friend = await User.findById(friendId).select('name profileImage');

        res.status(200).json({
            success: true,
            data: {
                friend,
                balance,
                message: balance > 0
                    ? `You are owed $${balance.toFixed(2)}`
                    : balance < 0
                        ? `You owe $${Math.abs(balance).toFixed(2)}`
                        : 'You are settled up'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const getAllBalances = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('friends', 'name profileImage');
        const balances = [];

        for (const friend of user.friends) {
            const balance = await Expense.getBalanceWithUser(req.userId, friend._id);
            if (balance !== 0) {
                balances.push({
                    friend,
                    balance,
                    message: balance > 0
                        ? `You are owed $${balance.toFixed(2)}`
                        : `You owe $${Math.abs(balance).toFixed(2)}`
                });
            }
        }

        res.status(200).json({
            success: true,
            data: balances
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getUserProfile,
    searchUsers,
    addFriend,
    removeFriend,
    getFriends,
    getBalanceWithFriend,
    getAllBalances
};