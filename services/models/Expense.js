const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Please provide a description for the expense'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    maxlength: [3, 'Currency code must be 3 characters']
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who paid for this expense']
  },
  splitWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Split amount cannot be negative']
    },
    settled: {
      type: Boolean,
      default: false
    },
    settledAt: {
      type: Date
    }
  }],
  category: {
    type: String,
    enum: ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'travel', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  isSettled: {
    type: Boolean,
    default: false
  },
  settledAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before findOneAndUpdate
expenseSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual to calculate total split amount
expenseSchema.virtual('totalSplitAmount').get(function() {
  return this.splitWith.reduce((total, split) => total + split.amount, 0);
});

// Virtual to check if expense is fully settled
expenseSchema.virtual('isFullySettled').get(function() {
  return this.splitWith.every(split => split.settled);
});

// Instance method to settle a specific split
expenseSchema.methods.settleSplit = function(userId) {
  const split = this.splitWith.find(s => s.user.toString() === userId.toString());
  if (split && !split.settled) {
    split.settled = true;
    split.settledAt = new Date();
    
    // Check if all splits are settled
    const allSettled = this.splitWith.every(s => s.settled);
    if (allSettled) {
      this.isSettled = true;
      this.settledAt = new Date();
    }
    
    return true;
  }
  return false;
};

// Instance method to add a split
expenseSchema.methods.addSplit = function(userId, amount) {
  // Check if user is already in the split
  const existingSplit = this.splitWith.find(s => s.user.toString() === userId.toString());
  if (existingSplit) {
    existingSplit.amount += amount;
  } else {
    this.splitWith.push({
      user: userId,
      amount: amount,
      settled: false
    });
  }
};

// Static method to get expenses between two users
expenseSchema.statics.getExpensesBetweenUsers = function(userId1, userId2) {
  return this.find({
    $or: [
      { paidBy: userId1, 'splitWith.user': userId2 },
      { paidBy: userId2, 'splitWith.user': userId1 }
    ]
  }).populate('paidBy', 'name email').populate('splitWith.user', 'name email');
};

// Static method to get user's balance with another user
expenseSchema.statics.getBalanceWithUser = async function(userId1, userId2) {
  const expenses = await this.getExpensesBetweenUsers(userId1, userId2);
  
  let balance = 0;
  
  expenses.forEach(expense => {
    if (expense.paidBy._id.toString() === userId1.toString()) {
      // User1 paid, so they are owed money
      const split = expense.splitWith.find(s => s.user._id.toString() === userId2.toString());
      if (split) {
        balance += split.amount;
      }
    } else {
      // User2 paid, so user1 owes money
      const split = expense.splitWith.find(s => s.user._id.toString() === userId1.toString());
      if (split) {
        balance -= split.amount;
      }
    }
  });
  
  return balance;
};

// Static method to get expenses for a group
expenseSchema.statics.getGroupExpenses = function(groupId) {
  return this.find({ group: groupId })
    .populate('paidBy', 'name email profileImage')
    .populate('splitWith.user', 'name email profileImage')
    .populate('group', 'name')
    .sort({ date: -1 });
};

// Static method to get user's balance in a group
expenseSchema.statics.getUserGroupBalance = async function(userId, groupId) {
  const expenses = await this.getGroupExpenses(groupId);
  
  let balance = 0;
  
  expenses.forEach(expense => {
    if (expense.paidBy._id.toString() === userId.toString()) {
      // User paid, so they are owed money
      const split = expense.splitWith.find(s => s.user._id.toString() === userId.toString());
      if (split) {
        balance += split.amount;
      }
    } else {
      // Someone else paid, check if user owes money
      const split = expense.splitWith.find(s => s.user._id.toString() === userId.toString());
      if (split) {
        balance -= split.amount;
      }
    }
  });
  
  return balance;
};

module.exports = mongoose.model('Expense', expenseSchema);
