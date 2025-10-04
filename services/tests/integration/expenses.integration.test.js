const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Expense Management Integration Tests', () => {
  let user1, user2, user3, user4, token1, token2, token3, token4;

  beforeEach(async () => {
    // Create test users
    user1 = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    await user1.save();

    user2 = new User({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123'
    });
    await user2.save();

    user3 = new User({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: 'password123'
    });
    await user3.save();

    user4 = new User({
      name: 'Alice Brown',
      email: 'alice@example.com',
      password: 'password123'
    });
    await user4.save();

    // Get tokens
    const login1 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'john@example.com', password: 'password123' });
    
    token1 = login1.body.data.token;
    user1 = login1.body.data.user;

    const login2 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'jane@example.com', password: 'password123' });
    token2 = login2.body.data.token;
    user2 = login2.body.data.user;

    const login3 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    token3 = login3.body.data.token;
    user3 = login3.body.data.user;

    const login4 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    token4 = login4.body.data.token;
    user4 = login4.body.data.user;

    // Add friends
    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: user2.id.toString() });

    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friendId: user3.id.toString() });

    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token2}`)
      .send({ friendId: user3.id.toString() });
  });

  describe('POST /v1/expenses', () => {
    it('should create expense successfully', async () => {
      const expenseData = {
        description: 'Dinner at restaurant',
        amount: 100.00,
        currency: 'USD',
        category: 'food',
        splitWith: [
          {
            user: user1.id.toString(),
            amount: 50.00
          },
          {
            user: user2.id.toString(),
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(expenseData.description);
      expect(response.body.data.amount).toBe(expenseData.amount);
      expect(response.body.data.paidBy.name).toBe('John Doe');
      expect(response.body.data.splitWith.length).toBe(2);
    });

    it('should create expense with multiple splits', async () => {
      const expenseData = {
        description: 'Group dinner',
        amount: 100.00,
        currency: 'USD',
        category: 'food',
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 50.00
          },
          {
            user: user3._id.toString(),
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.splitWith.length).toBe(2);
    });

    it('should fail to create expense with non-friend', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: 100.00,
        splitWith: [
          {
            user: user4._id.toString(), // Not a friend
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be your friends');
    });

    it('should fail with mismatched split amounts', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: 100.00,
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 60.00 // Doesn't match total
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must equal');
    });

    it('should fail with negative amount', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: -100.00,
        splitWith: [
          {
            user: user2._id.toString(),
            amount: -50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with zero amount', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: 0,
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 0
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without required fields', async () => {
      const expenseData = {
        amount: 100.00
        // Missing description and splitWith
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail with empty splitWith array', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: 100.00,
        splitWith: []
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle decimal amounts correctly', async () => {
      const expenseData = {
        description: 'Coffee',
        amount: 7.50,
        splitWith: [
          {
            user: user1.id.toString(),
            amount: 3.75
          },
          {
            user: user2.id.toString(),
            amount: 3.75
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(7.50);
    });

    it('should handle different currencies', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: 100.00,
        currency: 'EUR',
        splitWith: [
          {
            user: user1.id.toString(),
            amount: 50.00
          },
          {
            user: user2.id.toString(),
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('EUR');
    });

    it('should handle different categories', async () => {
      const categories = ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'travel', 'other'];

      for (const category of categories) {
        const expenseData = {
          description: `Test ${category}`,
          amount: 50.00,
          category,
          splitWith: [
            {
              user: user1.id.toString(),
              amount: 25.00
            },
            {
              user: user2.id.toString(),
              amount: 25.00
            }
          ]
        };

        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send(expenseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.category).toBe(category);
      }
    });

    it('should fail with invalid category', async () => {
      const expenseData = {
        description: 'Dinner',
        amount: 100.00,
        category: 'invalid-category',
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long descriptions', async () => {
      const expenseData = {
        description: 'a'.repeat(200), // Max length
        amount: 100.00,
        splitWith: [
          {
            user: user1.id.toString(),
            amount: 50.00
          },
          {
            user: user2.id.toString(),
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should fail with description too long', async () => {
      const expenseData = {
        description: 'a'.repeat(201), // Over max length
        amount: 100.00,
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 50.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/expenses', () => {
    let expense1, expense2, expense3;

    beforeEach(async () => {
      // Create test expenses
      expense1 = new Expense({
        description: 'Dinner',
        amount: 100.00,
        paidBy: user1._id,
        splitWith: [{ user: user2._id, amount: 50.00, settled: false }],
        category: 'food'
      });
      await expense1.save();

      expense2 = new Expense({
        description: 'Movie',
        amount: 30.00,
        paidBy: user2._id,
        splitWith: [{ user: user1._id, amount: 15.00, settled: true }],
        category: 'entertainment'
      });
      await expense2.save();

      expense3 = new Expense({
        description: 'Gas',
        amount: 50.00,
        paidBy: user1._id,
        splitWith: [{ user: user3._id, amount: 25.00, settled: false }],
        category: 'transport'
      });
      await expense3.save();
    });

    it('should get user expenses successfully', async () => {
      const response = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter expenses by friend', async () => {
      const response = await request(app)
        .get(`/v1/expenses?friendId=${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter expenses by settlement status', async () => {
      const response = await request(app)
        .get('/v1/expenses?settled=false')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/v1/expenses?page=1&limit=2')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.current).toBe(1);
    });

    it('should return empty array for user with no expenses', async () => {
      const response = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${token4}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /v1/expenses/:id', () => {
    let expense;

    beforeEach(async () => {
      expense = new Expense({
        description: 'Dinner',
        amount: 100.00,
        paidBy: user1._id,
        splitWith: [{ user: user2._id, amount: 50.00, settled: false }],
        category: 'food'
      });
      await expense.save();
    });

    it('should get expense by ID successfully', async () => {
      const response = await request(app)
        .get(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(expense._id.toString());
    });

    it('should allow split partner to view expense', async () => {
      const response = await request(app)
        .get(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail for non-involved user', async () => {
      const response = await request(app)
        .get(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail for non-existent expense', async () => {
      const response = await request(app)
        .get('/v1/expenses/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should fail with invalid expense ID format', async () => {
      const response = await request(app)
        .get('/v1/expenses/invalid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /v1/expenses/:id', () => {
    let expense;

    beforeEach(async () => {
      expense = new Expense({
        description: 'Dinner',
        amount: 100.00,
        paidBy: user1._id,
        splitWith: [
          { user: user1._id, amount: 50.00, settled: false },
          { user: user2._id, amount: 50.00, settled: false }
        ],
        category: 'food'
      });
      await expense.save();
    });

    it('should update expense successfully', async () => {
      const updateData = {
        description: 'Updated dinner',
        amount: 120.00,
        splitWith: [
          { user: user1._id, amount: 60.00, settled: false },
          { user: user2._id, amount: 60.00, settled: false }
        ]
      };

      const response = await request(app)
        .put(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.amount).toBe(updateData.amount);
    });

    it('should fail for non-payer to update', async () => {
      const updateData = {
        description: 'Updated dinner'
      };

      const response = await request(app)
        .put(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the person who paid');
    });

    it('should fail to update settled expense', async () => {
      // Settle the expense first
      expense.isSettled = true;
      await expense.save();

      const updateData = {
        description: 'Updated dinner'
      };

      const response = await request(app)
        .put(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('settled expense');
    });

    it('should fail with mismatched split amounts on update', async () => {
      const updateData = {
        amount: 120.00,
        splitWith: [{ user: user2._id, amount: 50.00, settled: false }] // Doesn't match
      };

      const response = await request(app)
        .put(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must equal');
    });
  });

  describe('DELETE /v1/expenses/:id', () => {
    let expense;

    beforeEach(async () => {
      expense = new Expense({
        description: 'Dinner',
        amount: 100.00,
        paidBy: user1._id,
        splitWith: [{ user: user2._id, amount: 50.00, settled: false }],
        category: 'food'
      });
      await expense.save();
    });

    it('should delete expense successfully', async () => {
      const response = await request(app)
        .delete(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify expense is deleted
      const deletedExpense = await Expense.findById(expense._id);
      expect(deletedExpense).toBeNull();
    });

    it('should fail for non-payer to delete', async () => {
      const response = await request(app)
        .delete(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the person who paid');
    });

    it('should fail to delete settled expense', async () => {
      // Settle the expense first
      expense.isSettled = true;
      await expense.save();

      const response = await request(app)
        .delete(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('settled expense');
    });

    it('should fail to delete non-existent expense', async () => {
      const response = await request(app)
        .delete('/v1/expenses/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /v1/expenses/:id/settle', () => {
    let expense;

    beforeEach(async () => {
      expense = new Expense({
        description: 'Dinner',
        amount: 100.00,
        paidBy: user1._id,
        splitWith: [{ user: user2._id, amount: 50.00, settled: false }],
        category: 'food'
      });
      await expense.save();
    });

    it('should settle expense split successfully', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('settled successfully');

      // Verify split is settled
      const updatedExpense = await Expense.findById(expense._id);
      const split = updatedExpense.splitWith.find(s => s.user.toString() === user2._id.toString());
      expect(split.settled).toBe(true);
    });

    it('should allow split partner to settle', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: user2._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail for non-involved user to settle', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token3}`)
        .send({ userId: user2._id.toString() })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail to settle already settled split', async () => {
      // Settle the split first
      await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id.toString() });

      // Try to settle again
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id.toString() })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already settled');
    });

    it('should fail to settle non-existent user', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: '507f1f77bcf86cd799439011' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not part of this expense');
    });

    it('should fail without userId', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /v1/expenses/between/:friendId', () => {
    let expense1, expense2;

    beforeEach(async () => {
      expense1 = new Expense({
        description: 'Dinner',
        amount: 100.00,
        paidBy: user1._id,
        splitWith: [{ user: user2._id, amount: 50.00, settled: false }],
        category: 'food'
      });
      await expense1.save();

      expense2 = new Expense({
        description: 'Movie',
        amount: 30.00,
        paidBy: user2._id,
        splitWith: [{ user: user1._id, amount: 15.00, settled: false }],
        category: 'entertainment'
      });
      await expense2.save();
    });

    it('should get expenses between friends successfully', async () => {
      const response = await request(app)
        .get(`/v1/expenses/between/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should fail for non-friend', async () => {
      const response = await request(app)
        .get(`/v1/expenses/between/${user4._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not your friend');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get(`/v1/expenses/between/${user2._id}?page=1&limit=1`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large amounts', async () => {
      const expenseData = {
        description: 'Expensive dinner',
        amount: 1000000.00,
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 1000000.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    // it('should handle very small amounts', async () => {
    //   const expenseData = {
    //     description: 'Coffee',
    //     amount: 0.01,
    //     splitWith: [
    //       {
    //         user: user2._id.toString(),
    //         amount: 0.01
    //       }
    //     ]
    //   };

    //   const response = await request(app)
    //     .post('/v1/expenses')
    //     .set('Authorization', `Bearer ${token1}`)
    //     .send(expenseData)
    //     .expect(201);

    //   expect(response.body.success).toBe(true);
    // });

    // it('should handle concurrent expense creation', async () => {
    //   7777
    //   const expenseData = {
    //     description: 'Concurrent expense',
    //     amount: 100.00,
    //     splitWith: [
    //       {
    //         user: user1._id.toString(),
    //         amount: 50.00
    //       },
    //       {
    //         user: user2._id.toString(),
    //         amount: 50.00
    //       }
    //     ]
    //   };

    //   const promises = Array(5).fill().map(() =>
    //     request(app)
    //       .post('/v1/expenses')
    //       .set('Authorization', `Bearer ${token1}`)
    //       .send(expenseData)
    //   );

    //   const responses = await Promise.all(promises);

    //   responses.forEach(response => {
    //     expect(response.status).toBe(201);
    //   });
    // });

    // it('should handle malformed JSON', async () => {
    //   const response = await request(app)
    //     .post('/v1/expenses')
    //     .set('Authorization', `Bearer ${token1}`)
    //     .set('Content-Type', 'application/json')
    //     .send('{"description": "Dinner", "amount": 100.00, "splitWith": [{"user": "invalid-json"')
    //     .expect(400);

    //   expect(response.body.success).toBe(false);
    // });

    it('should handle XSS attempts in description', async () => {
      const expenseData = {
        description: '<script>alert("xss")</script>',
        amount: 100.00,
        splitWith: [
          {
            user: user2._id.toString(),
            amount: 100.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Description should be sanitized
      expect(response.body.data.description).not.toContain('<script>');
    });

    // it('should handle SQL injection attempts', async () => {
    //   const expenseData = {
    //     description: "'; DROP TABLE expenses; --",
    //     amount: 100.00,
    //     splitWith: [
    //       {
    //         user: user1._id.toString(),
    //         amount: 50.00
    //       },
    //       {
    //         user: user2._id.toString(),
    //         amount: 50.00
    //       }
    //     ]
    //   };

    //   const response = await request(app)
    //     .post('/v1/expenses')
    //     .set('Authorization', `Bearer ${token1}`)
    //     .send(expenseData)
    //     .expect(201);

    //   expect(response.body.success).toBe(true);
    // });

    // it('should handle very long request bodies', async () => {
    //   const expenseData = {
    //     description: 'Dinner',
    //     amount: 100.00,
    //     splitWith: [
    //       {
    //         user: user1._id.toString(),
    //         amount: 50.00
    //       },
    //       {
    //         user: user2._id.toString(),
    //         amount: 50.00
    //       }
    //     ],
    //     extraData: 'x'.repeat(10000)
    //   };

    //   const response = await request(app)
    //     .post('/v1/expenses')
    //     .set('Authorization', `Bearer ${token1}`)
    //     .send(expenseData)
    //     .expect(201);

    //   expect(response.body.success).toBe(true);
    // });
  });

  describe('Performance Tests', () => {
    it('should handle large number of expenses efficiently', async () => {
      // Create many expenses
      const expenses = [];
      for (let i = 0; i < 100; i++) {
        expenses.push(new Expense({
          description: `Expense ${i}`,
          amount: 50.00,
          paidBy: user1._id,
          splitWith: [{ user: user2._id, amount: 25.00, settled: false }],
          category: 'food'
        }));
      }
      await Expense.insertMany(expenses);

      const start = Date.now();
      const response = await request(app)
        .get('/v1/expenses?limit=50')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const duration = Date.now() - start;

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(50);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent settlement operations', async () => {
      // Create multiple expenses
      const expenses = [];
      for (let i = 0; i < 10; i++) {
        const expense = new Expense({
          description: `Expense ${i}`,
          amount: 100.00,
          paidBy: user1._id,
          splitWith: [{ user: user2._id, amount: 50.00, settled: false }],
          category: 'food'
        });
        await expense.save();
        expenses.push(expense);
      }

      // Settle all expenses concurrently
      const promises = expenses.map(expense =>
        request(app)
          .post(`/v1/expenses/${expense._id}/settle`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ userId: user2._id.toString() })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});