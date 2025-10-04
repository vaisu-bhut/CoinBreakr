const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Group = require('../../models/Group');
const Expense = require('../../models/Expense');

describe('Group Expenses Integration Tests', () => {
  let testUser1, testUser2, testUser3, testUser4;
  let token1, token2, token3, token4;
  let testGroup;

  beforeEach(async () => {
    // Create test users
    testUser1 = new User({
      name: 'Test User 1',
      email: 'user1@example.com',
      password: 'password123'
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Test User 2',
      email: 'user2@example.com',
      password: 'password123'
    });
    await testUser2.save();

    testUser3 = new User({
      name: 'Test User 3',
      email: 'user3@example.com',
      password: 'password123'
    });
    await testUser3.save();

    testUser4 = new User({
      name: 'Test User 4',
      email: 'user4@example.com',
      password: 'password123'
    });
    await testUser4.save();

    // Get tokens for all users
    const login1 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    token1 = login1.body.data.token;

    const login2 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' });
    token2 = login2.body.data.token;

    const login3 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user3@example.com', password: 'password123' });
    token3 = login3.body.data.token;

    const login4 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user4@example.com', password: 'password123' });
    token4 = login4.body.data.token;

    // Create test group
    testGroup = new Group({
      name: 'Test Group',
      description: 'A test group for expenses',
      createdBy: testUser1._id,
      members: [
        { user: testUser1._id, role: 'admin' },
        { user: testUser2._id, role: 'member' },
        { user: testUser3._id, role: 'member' }
      ]
    });
    await testGroup.save();
  });

  describe('POST /v1/expenses - Create Group Expense', () => {
    it('should create a group expense successfully', async () => {
      const expenseData = {
        description: 'Group dinner',
        amount: 120.00,
        currency: 'USD',
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 40.00 },
          { user: testUser2._id.toString(), amount: 40.00 },
          { user: testUser3._id.toString(), amount: 40.00 }
        ],
        category: 'food'
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Group dinner');
      expect(response.body.data.amount).toBe(120.00);
      expect(response.body.data.group._id).toBe(testGroup._id.toString());
      expect(response.body.data.splitWith).toHaveLength(3);
      expect(response.body.data.paidBy._id).toBe(testUser1._id.toString());
    });

    it('should create group expense with all group members', async () => {
      const expenseData = {
        description: 'Group activity',
        amount: 300.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 100.00 },
          { user: testUser2._id.toString(), amount: 100.00 },
          { user: testUser3._id.toString(), amount: 100.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token2}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.splitWith).toHaveLength(3);
    });

    it('should create group expense with partial group members', async () => {
      const expenseData = {
        description: 'Partial group expense',
        amount: 80.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 40.00 },
          { user: testUser2._id.toString(), amount: 40.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.splitWith).toHaveLength(2);
    });

    it('should fail to create group expense for non-member', async () => {
      const expenseData = {
        description: 'Unauthorized expense',
        amount: 100.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 50.00 },
          { user: testUser2._id.toString(), amount: 50.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token4}`)
        .send(expenseData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should fail to create group expense with non-group members', async () => {
      const expenseData = {
        description: 'Invalid expense',
        amount: 100.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 50.00 },
          { user: testUser4._id.toString(), amount: 50.00 } // Non-group member
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be members of the group');
    });

    it('should fail to create expense for non-existent group', async () => {
      const fakeGroupId = testUser1._id; // Valid ObjectId but not a group
      const expenseData = {
        description: 'Invalid group expense',
        amount: 100.00,
        groupId: fakeGroupId.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 100.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Group not found');
    });

    it('should create individual expense without groupId', async () => {
      // First make users friends
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: testUser2._id.toString() });

      const expenseData = {
        description: 'Individual expense',
        amount: 50.00,
        splitWith: [
          { user: testUser2._id.toString(), amount: 50.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.group).toBeNull();
    });
  });

  describe('GET /v1/expenses/group/:groupId - Get Group Expenses', () => {
    let groupExpense1, groupExpense2, individualExpense;

    beforeEach(async () => {
      // Create group expenses
      groupExpense1 = new Expense({
        description: 'Group dinner',
        amount: 120.00,
        paidBy: testUser1._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 40.00, settled: false },
          { user: testUser2._id, amount: 40.00, settled: false },
          { user: testUser3._id, amount: 40.00, settled: false }
        ],
        category: 'food'
      });
      await groupExpense1.save();

      groupExpense2 = new Expense({
        description: 'Group activity',
        amount: 90.00,
        paidBy: testUser2._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 30.00, settled: true },
          { user: testUser2._id, amount: 30.00, settled: false },
          { user: testUser3._id, amount: 30.00, settled: false }
        ],
        category: 'entertainment'
      });
      await groupExpense2.save();

      // Create individual expense (not in group)
      individualExpense = new Expense({
        description: 'Individual expense',
        amount: 50.00,
        paidBy: testUser1._id,
        splitWith: [
          { user: testUser2._id, amount: 50.00, settled: false }
        ],
        category: 'food'
      });
      await individualExpense.save();
    });

    it('should get all group expenses for member', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].group._id).toBe(testGroup._id.toString());
      expect(response.body.data[1].group._id).toBe(testGroup._id.toString());
    });

    it('should get group expenses for another member', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter group expenses by settlement status', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}?settled=true`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe('Group activity');
    });

    it('should filter group expenses by unsettled status', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}?settled=false`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe('Group dinner');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}?page=1&limit=1`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.current).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should populate user and group data', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const expense = response.body.data[0];
      expect(expense.paidBy.name).toBeDefined();
      expect(expense.paidBy.email).toBeDefined();
      expect(expense.splitWith[0].user.name).toBeDefined();
      expect(expense.group.name).toBe('Test Group');
    });

    it('should fail for non-member to get group expenses', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${token4}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should fail for non-existent group', async () => {
      const fakeGroupId = testUser1._id;
      const response = await request(app)
        .get(`/v1/expenses/group/${fakeGroupId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Group not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/expenses/group/:groupId/balance - Get Group Balance', () => {
    let groupExpense1, groupExpense2;

    beforeEach(async () => {
      // Create group expenses with different payment scenarios
      groupExpense1 = new Expense({
        description: 'User1 paid for all',
        amount: 120.00,
        paidBy: testUser1._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 40.00, settled: false },
          { user: testUser2._id, amount: 40.00, settled: false },
          { user: testUser3._id, amount: 40.00, settled: false }
        ]
      });
      await groupExpense1.save();

      groupExpense2 = new Expense({
        description: 'User2 paid for all',
        amount: 90.00,
        paidBy: testUser2._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 30.00, settled: false },
          { user: testUser2._id, amount: 30.00, settled: false },
          { user: testUser3._id, amount: 30.00, settled: false }
        ]
      });
      await groupExpense2.save();
    });

    it('should calculate group balances correctly', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.group.name).toBe('Test Group');
      expect(response.body.data.group.members).toHaveLength(3);
      expect(response.body.data.balances).toBeDefined();
      expect(response.body.data.totalExpenses).toBe(2);
    });

    it('should show correct balance for user1', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const balances = response.body.data.balances;
      const user1Balance = balances[testUser1._id.toString()];
      
      // User1 paid 120, owes 40 (from expense1) + 30 (from expense2) = 70
      // Net: 120 - 70 = 50 (should be owed money)
      expect(user1Balance).toBe(50);
    });

    it('should show correct balance for user2', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const balances = response.body.data.balances;
      const user2Balance = balances[testUser2._id.toString()];
      
      // User2 paid 90, owes 40 (from expense1) + 30 (from expense2) = 70
      // Net: 90 - 70 = 20 (should be owed money)
      expect(user2Balance).toBe(20);
    });

    it('should show correct balance for user3', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(200);

      const balances = response.body.data.balances;
      const user3Balance = balances[testUser3._id.toString()];
      
      // User3 paid 0, owes 40 (from expense1) + 30 (from expense2) = 70
      // Net: 0 - 70 = -70 (should owe money)
      expect(user3Balance).toBe(-70);
    });

    it('should populate member data correctly', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const members = response.body.data.group.members;
      expect(members).toHaveLength(3);
      expect(members[0].user.name).toBeDefined();
      expect(members[0].user.email).toBeDefined();
      expect(members[0].role).toBeDefined();
    });

    it('should fail for non-member to get group balance', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token4}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should handle group with no expenses', async () => {
      // Create a new group with no expenses
      const emptyGroup = new Group({
        name: 'Empty Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await emptyGroup.save();

      const response = await request(app)
        .get(`/v1/expenses/group/${emptyGroup._id}/balance`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalExpenses).toBe(0);
      expect(response.body.data.balances[testUser1._id.toString()]).toBe(0);
      expect(response.body.data.balances[testUser2._id.toString()]).toBe(0);
    });
  });

  describe('Group Expense Settlement', () => {
    let groupExpense;

    beforeEach(async () => {
      groupExpense = new Expense({
        description: 'Group expense for settlement',
        amount: 90.00,
        paidBy: testUser1._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 30.00, settled: false },
          { user: testUser2._id, amount: 30.00, settled: false },
          { user: testUser3._id, amount: 30.00, settled: false }
        ]
      });
      await groupExpense.save();
    });

    it('should allow group member to settle their split', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${groupExpense._id}/settle`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: testUser2._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('settled successfully');

      const updatedExpense = response.body.data;
      const user2Split = updatedExpense.splitWith.find(s => s.user._id === testUser2._id.toString());
      expect(user2Split.settled).toBe(true);
      expect(user2Split.settledAt).toBeDefined();
    });

    it('should mark expense as fully settled when all splits are settled', async () => {
      // Settle all splits
      await request(app)
        .post(`/v1/expenses/${groupExpense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser1._id.toString() });

      await request(app)
        .post(`/v1/expenses/${groupExpense._id}/settle`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: testUser2._id.toString() });

      const response = await request(app)
        .post(`/v1/expenses/${groupExpense._id}/settle`)
        .set('Authorization', `Bearer ${token3}`)
        .send({ userId: testUser3._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isSettled).toBe(true);
      expect(response.body.data.settledAt).toBeDefined();
    });

    it('should fail for non-group member to settle', async () => {
      const response = await request(app)
        .post(`/v1/expenses/${groupExpense._id}/settle`)
        .set('Authorization', `Bearer ${token4}`)
        .send({ userId: testUser2._id.toString() })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('Group Expense Edge Cases', () => {
    it('should handle group expense with zero amount', async () => {
      const expenseData = {
        description: 'Zero amount expense',
        amount: 0,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 0 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle group expense with very large amount', async () => {
      const expenseData = {
        description: 'Large amount expense',
        amount: 999999.99,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 333333.33 },
          { user: testUser2._id.toString(), amount: 333333.33 },
          { user: testUser3._id.toString(), amount: 333333.33 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(999999.99);
    });

    it('should handle group expense with decimal precision', async () => {
      const expenseData = {
        description: 'Decimal precision expense',
        amount: 100.33,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 33.44 },
          { user: testUser2._id.toString(), amount: 33.44 },
          { user: testUser3._id.toString(), amount: 33.45 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(100.33);
    });

    it('should handle group expense with special characters in description', async () => {
      const expenseData = {
        description: 'Expense with special chars: !@#$%^&*() and émojis 🚀',
        amount: 100.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 50.00 },
          { user: testUser2._id.toString(), amount: 50.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(expenseData.description);
    });

    it('should handle concurrent group expense creation', async () => {
      const expenseData1 = {
        description: 'Concurrent expense 1',
        amount: 100.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 50.00 },
          { user: testUser2._id.toString(), amount: 50.00 }
        ]
      };

      const expenseData2 = {
        description: 'Concurrent expense 2',
        amount: 200.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 100.00 },
          { user: testUser3._id.toString(), amount: 100.00 }
        ]
      };

      const promises = [
        request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send(expenseData1),
        request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token2}`)
          .send(expenseData2)
      ];

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify both expenses were created
      const groupExpenses = await Expense.find({ group: testGroup._id });
      expect(groupExpenses).toHaveLength(2);
    });

    it('should handle group member leaving after expense creation', async () => {
      // Create expense
      const expenseData = {
        description: 'Expense before member leaves',
        amount: 90.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 30.00 },
          { user: testUser2._id.toString(), amount: 30.00 },
          { user: testUser3._id.toString(), amount: 30.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // User3 leaves the group
      await request(app)
        .delete(`/v1/groups/${testGroup._id}/leave`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(200);

      // Expense should still exist and be accessible by remaining members
      const getResponse = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data).toHaveLength(1);
    });
  });
});
