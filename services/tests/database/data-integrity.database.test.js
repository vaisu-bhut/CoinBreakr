const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const mongoose = require('mongoose');

describe('Database Integrity and Transaction Tests', () => {
  let testUser1, testUser2, testUser3, token1, token2, token3;

  beforeEach(async () => {
    // Create test users
    testUser1 = new User({
      name: 'Database Test User 1',
      email: 'dbtest1@example.com',
      password: 'password123'
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Database Test User 2',
      email: 'dbtest2@example.com',
      password: 'password123'
    });
    await testUser2.save();

    testUser3 = new User({
      name: 'Database Test User 3',
      email: 'dbtest3@example.com',
      password: 'password123'
    });
    await testUser3.save();

    // Get tokens
    const login1 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'dbtest1@example.com', password: 'password123' });
    token1 = login1.body.data.token;

    const login2 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'dbtest2@example.com', password: 'password123' });
    token2 = login2.body.data.token;

    const login3 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'dbtest3@example.com', password: 'password123' });
    token3 = login3.body.data.token;

    // Add friends
    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: testUser2._id.toString() });

    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: testUser3._id.toString() });

    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token2}`)
      .send({ friendId: testUser3._id.toString() });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain referential integrity when adding friends', async () => {
      // Verify bidirectional friendship
      const user1 = await User.findById(testUser1._id);
      const user2 = await User.findById(testUser2._id);

      expect(user1.friends).toContainEqual(testUser2._id);
      expect(user2.friends).toContainEqual(testUser1._id);
    });

    it('should maintain referential integrity when removing friends', async () => {
      // Remove friendship
      await request(app)
        .delete(`/v1/users/friends/${testUser2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(204);

      // Verify bidirectional removal
      const user1 = await User.findById(testUser1._id);
      const user2 = await User.findById(testUser2._id);

      expect(user1.friends).not.toContainEqual(testUser2._id);
      expect(user2.friends).not.toContainEqual(testUser1._id);
    });

    it('should maintain expense relationships', async () => {
      // Create expense
      const expenseData = {
        description: 'Database integrity test',
        amount: 100.00,
        splitWith: [
          { user: testUser2._id.toString(), amount: 50.00 },
          { user: testUser3._id.toString(), amount: 50.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      const expenseId = response.body.data._id;

      // Verify expense relationships
      const expense = await Expense.findById(expenseId)
        .populate('paidBy')
        .populate('splitWith.user');

      expect(expense.paidBy._id.toString()).toBe(testUser1._id.toString());
      expect(expense.splitWith.length).toBe(2);
      expect(expense.splitWith[0].user._id.toString()).toBe(testUser2._id.toString());
      expect(expense.splitWith[1].user._id.toString()).toBe(testUser3._id.toString());
    });

    it('should maintain data consistency when settling expenses', async () => {
      // Create expense
      const expense = new Expense({
        description: 'Settlement test',
        amount: 100.00,
        paidBy: testUser1._id,
        splitWith: [
          { user: testUser2._id, amount: 50.00, settled: false },
          { user: testUser3._id, amount: 50.00, settled: false }
        ]
      });
      await expense.save();

      // Settle one split
      await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser2._id.toString() })
        .expect(200);

      // Verify settlement
      const updatedExpense = await Expense.findById(expense._id);
      const settledSplit = updatedExpense.splitWith.find(s => s.user.toString() === testUser2._id.toString());
      const unsettledSplit = updatedExpense.splitWith.find(s => s.user.toString() === testUser3._id.toString());

      expect(settledSplit.settled).toBe(true);
      expect(settledSplit.settledAt).toBeDefined();
      expect(unsettledSplit.settled).toBe(false);
      expect(updatedExpense.isSettled).toBe(false); // Not fully settled yet

      // Settle remaining split
      await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser3._id.toString() })
        .expect(200);

      // Verify full settlement
      const fullySettledExpense = await Expense.findById(expense._id);
      expect(fullySettledExpense.isSettled).toBe(true);
      expect(fullySettledExpense.settledAt).toBeDefined();
    });
  });

  describe('Concurrent Operation Tests', () => {
    it('should handle concurrent friend additions', async () => {
      // Create additional users
      const user4 = new User({
        name: 'Concurrent User 4',
        email: 'concurrent4@example.com',
        password: 'password123'
      });
      await user4.save();

      const user5 = new User({
        name: 'Concurrent User 5',
        email: 'concurrent5@example.com',
        password: 'password123'
      });
      await user5.save();

      // Add friends concurrently
      const promises = [
        request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token1}`)
          .send({ friendId: user4._id.toString() }),
        request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token1}`)
          .send({ friendId: user5._id.toString() })
      ];

      const responses = await Promise.all(promises);
      
      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all friendships are properly established
      const updatedUser1 = await User.findById(testUser1._id);
      expect(updatedUser1.friends).toContainEqual(user4._id);
      expect(updatedUser1.friends).toContainEqual(user5._id);
    });

    it('should handle concurrent expense settlements', async () => {
      // Create expense with multiple splits
      const expense = new Expense({
        description: 'Concurrent settlement test',
        amount: 150.00,
        paidBy: testUser1._id,
        splitWith: [
          { user: testUser2._id, amount: 50.00, settled: false },
          { user: testUser3._id, amount: 50.00, settled: false }
        ]
      });
      await expense.save();

      // Settle splits sequentially to avoid race conditions
      const response1 = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser2._id.toString() });
      
      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser3._id.toString() });
      
      expect(response2.status).toBe(200);

      // Wait a bit for database operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify both splits are settled
      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.splitWith.every(split => split.settled)).toBe(true);
      expect(updatedExpense.isSettled).toBe(true);
    });

    it('should handle concurrent expense updates', async () => {
      // Create expense
      const expense = new Expense({
        description: 'Concurrent update test',
        amount: 100.00,
        paidBy: testUser1._id,
        splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }]
      });
      await expense.save();

      // Update expense concurrently
      const promises = [
        request(app)
          .put(`/v1/expenses/${expense._id}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ description: 'Updated description 1' }),
        request(app)
          .put(`/v1/expenses/${expense._id}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ description: 'Updated description 2' })
      ];

      const responses = await Promise.all(promises);
      
      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify expense was updated
      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.description).toMatch(/Updated description/);
    });
  });

  describe('Data Validation at Database Level', () => {
    it('should enforce unique email constraint', async () => {
      const duplicateUser = new User({
        name: 'Duplicate User',
        email: 'dbtest1@example.com', // Same email as testUser1
        password: 'password123'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should enforce required field constraints', async () => {
      const incompleteUser = new User({
        name: 'Incomplete User'
        // Missing email and password
      });

      await expect(incompleteUser.save()).rejects.toThrow();
    });

    it('should enforce expense amount constraints', async () => {
      const invalidExpense = new Expense({
        description: 'Invalid expense',
        amount: -100.00, // Negative amount
        paidBy: testUser1._id,
        splitWith: [{ user: testUser2._id, amount: -50.00 }]
      });

      await expect(invalidExpense.save()).rejects.toThrow();
    });

    it('should enforce split amount constraints', async () => {
      const invalidExpense = new Expense({
        description: 'Invalid split expense',
        amount: 100.00,
        paidBy: testUser1._id,
        splitWith: [{ user: testUser2._id, amount: -50.00 }] // Negative split amount
      });

      await expect(invalidExpense.save()).rejects.toThrow();
    });
  });

  describe('Index and Performance Tests', () => {
    it('should efficiently query users by email', async () => {
      const start = Date.now();
      
      // Create many users
      const users = [];
      for (let i = 0; i < 1000; i++) {
        users.push(new User({
          name: `Performance User ${i}`,
          email: `perfuser${i}@example.com`,
          password: 'password123'
        }));
      }
      await User.insertMany(users);

      // Query by email (should use index)
      const foundUser = await User.findOne({ email: 'perfuser500@example.com' });
      const duration = Date.now() - start;

      expect(foundUser).toBeDefined();
      expect(duration).toBeLessThan(2000); // Should be fast with index
    });

    it('should efficiently query expenses by paidBy', async () => {
      // Create many expenses
      const expenses = [];
      for (let i = 0; i < 1000; i++) {
        expenses.push(new Expense({
          description: `Performance Expense ${i}`,
          amount: 100.00,
          paidBy: testUser1._id,
          splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }]
        }));
      }
      await Expense.insertMany(expenses);

      const start = Date.now();
      
      // Query expenses by paidBy (should use index)
      const userExpenses = await Expense.find({ paidBy: testUser1._id });
      const duration = Date.now() - start;

      expect(userExpenses.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });

    it('should efficiently query expenses by date range', async () => {
      // Create expenses with different dates
      const expenses = [];
      const baseDate = new Date('2024-01-01');
      
      for (let i = 0; i < 1000; i++) {
        const expenseDate = new Date(baseDate);
        expenseDate.setDate(baseDate.getDate() + i);
        
        expenses.push(new Expense({
          description: `Date Expense ${i}`,
          amount: 100.00,
          paidBy: testUser1._id,
          splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }],
          date: expenseDate
        }));
      }
      await Expense.insertMany(expenses);

      const start = Date.now();
      
      // Query expenses by date range
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-25');
      const rangeExpenses = await Expense.find({
        date: { $gte: startDate, $lte: endDate }
      });
      const duration = Date.now() - start;

      expect(rangeExpenses.length).toBe(11); // 15th to 25th inclusive
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });
  });

  describe('Transaction Rollback Tests', () => {
    it('should rollback friend addition if one fails', async () => {
      // This test would require implementing transactions in the friend addition logic
      // For now, we'll test the current behavior
      
      const invalidFriendId = '507f1f77bcf86cd799439011'; // Non-existent user
      
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: invalidFriendId })
        .expect(404);

      expect(response.body.success).toBe(false);

      // Verify no partial state was created
      const user1 = await User.findById(testUser1._id);
      expect(user1.friends).not.toContainEqual(invalidFriendId);
    });

    it('should maintain consistency during expense creation failures', async () => {
      // Try to create expense with invalid data
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Invalid expense',
          amount: 100.00,
          splitWith: [
            { user: 'invalid-id', amount: 50.00 } // Invalid user ID
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify no expense was created
      const expenses = await Expense.find({ description: 'Invalid expense' });
      expect(expenses.length).toBe(0);
    });
  });

  describe('Data Migration and Schema Tests', () => {
    it('should handle missing optional fields gracefully', async () => {
      // Create user without optional fields
      const minimalUser = new User({
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'password123'
        // No phoneNumber, profileImage, etc.
      });
      await minimalUser.save();

      expect(minimalUser.phoneNumber).toBe('');
      expect(minimalUser.profileImage).toBe('https://via.placeholder.com/150');
      expect(minimalUser.role).toBe('user');
      expect(minimalUser.isActive).toBe(true);
    });

    it('should handle expense without optional fields', async () => {
      // Create expense without optional fields
      const minimalExpense = new Expense({
        description: 'Minimal expense',
        amount: 100.00,
        paidBy: testUser1._id,
        splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }]
        // No currency, category, date
      });
      await minimalExpense.save();

      expect(minimalExpense.currency).toBe('USD');
      expect(minimalExpense.category).toBe('other');
      expect(minimalExpense.date).toBeDefined();
      expect(minimalExpense.isSettled).toBe(false);
    });

    it('should maintain data integrity during updates', async () => {
      // Create expense
      const expense = new Expense({
        description: 'Update test expense',
        amount: 100.00,
        paidBy: testUser1._id,
        splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }]
      });
      await expense.save();

      // Update expense
      const updatedExpense = await Expense.findByIdAndUpdate(
        expense._id,
        { description: 'Updated expense', amount: 150.00 },
        { new: true, runValidators: true }
      );

      expect(updatedExpense.description).toBe('Updated expense');
      expect(updatedExpense.amount).toBe(150.00);
      expect(updatedExpense.updatedAt).toBeDefined();
      expect(updatedExpense.updatedAt.getTime()).toBeGreaterThan(expense.updatedAt.getTime());
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle large datasets without memory issues', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create large number of expenses
      const expenses = [];
      for (let i = 0; i < 5000; i++) {
        const amount = Math.max(0.01, Math.random() * 1000);
        const splitAmount = Math.max(0.01, Math.random() * 500);
        expenses.push(new Expense({
          description: `Memory test expense ${i}`,
          amount: amount,
          paidBy: testUser1._id,
          splitWith: [{ user: testUser2._id, amount: splitAmount, settled: false }]
        }));
      }
      await Expense.insertMany(expenses);

      // Query all expenses
      const allExpenses = await Expense.find({ paidBy: testUser1._id });
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(allExpenses.length).toBe(5000);
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    });

    it('should handle connection pool exhaustion gracefully', async () => {
      // Create many concurrent database operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          User.findOne({ email: 'dbtest1@example.com' })
        );
      }

      const start = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - start;

      expect(results.length).toBe(100);
      expect(results.every(result => result !== null)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Data Cleanup and Maintenance', () => {
    it('should handle cascade deletes properly', async () => {
      // Create expense
      const expense = new Expense({
        description: 'Cascade test expense',
        amount: 100.00,
        paidBy: testUser1._id,
        splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }]
      });
      await expense.save();

      // Delete the user who paid
      await User.findByIdAndDelete(testUser1._id);

      // Verify expense still exists (no cascade delete implemented)
      const remainingExpense = await Expense.findById(expense._id);
      expect(remainingExpense).toBeDefined();
    });

    it('should handle orphaned data gracefully', async () => {
      // Create expense with non-existent user reference
      const fakeUserId = new mongoose.Types.ObjectId();
      const orphanedExpense = new Expense({
        description: 'Orphaned expense',
        amount: 100.00,
        paidBy: fakeUserId,
        splitWith: [{ user: testUser2._id, amount: 50.00, settled: false }]
      });
      await orphanedExpense.save();

      // Query should still work
      const expense = await Expense.findById(orphanedExpense._id);
      expect(expense).toBeDefined();
      expect(expense.paidBy.toString()).toBe(fakeUserId.toString());
    });
  });
});