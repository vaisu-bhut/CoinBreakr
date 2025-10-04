const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Group = require('../../models/Group');
const Expense = require('../../models/Expense');

describe('Groups Edge Cases and Data Validation', () => {
  let testUser1, testUser2, testUser3, testUser4;
  let token1, token2, token3, token4;

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

    // Get tokens
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
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle extremely long group names', async () => {
      const longName = 'a'.repeat(1000);
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: longName })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle extremely long descriptions', async () => {
      const longDescription = 'a'.repeat(10000);
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
          name: 'Test Group',
          description: longDescription 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle null and undefined values', async () => {
      const nullInputs = [
        { name: null },
        { name: undefined },
        { description: null },
        { description: undefined }
      ];

      for (const input of nullInputs) {
        const response = await request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send(input)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle empty strings and whitespace', async () => {
      const emptyInputs = [
        { name: '' },
        { name: '   ' },
        { name: '\t\n' },
        { description: '' },
        { description: '   ' }
      ];

      for (const input of emptyInputs) {
        const response = await request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send(input)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle special characters and unicode', async () => {
      const specialInputs = [
        { name: 'Group with émojis 🚀🎉💯' },
        { name: 'Group with unicode: 中文测试' },
        { name: 'Group with Arabic: العربية' },
        { name: 'Group with Hebrew: עברית' },
        { name: 'Group with Cyrillic: русский' },
        { name: 'Group with symbols: !@#$%^&*()_+-=[]{}|;:,.<>?' }
      ];

      for (const input of specialInputs) {
        const response = await request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send(input)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(input.name);
      }
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Test Group", "description": "Test"')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle non-JSON content type', async () => {
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .set('Content-Type', 'text/plain')
        .send('name=Test Group')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Member Management Edge Cases', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should handle adding member with invalid email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..double@example.com',
        'user@.example.com',
        'user@example.',
        'user@example.com.',
        'user name@example.com',
        'user@exam ple.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: email })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle adding member with case insensitive email', async () => {
      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmail: 'USER3@EXAMPLE.COM' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle adding member with special characters in email', async () => {
      // Create user with special characters in email
      const specialUser = new User({
        name: 'Special User',
        email: 'user+test@example.com',
        password: 'password123'
      });
      await specialUser.save();

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmail: 'user+test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent member additions', async () => {
      const promises = [
        request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: 'user3@example.com' }),
        request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token2}`)
          .send({ memberEmail: 'user4@example.com' })
      ];

      const responses = await Promise.all(promises);
      
      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify final state
      const finalGroup = await Group.findById(testGroup._id);
      expect(finalGroup.members).toHaveLength(4);
    });

    it('should handle removing non-existent member', async () => {
      const fakeUserId = testUser1._id; // Valid ObjectId but not in group
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${fakeUserId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle removing member with invalid ObjectId', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/invalid-id`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle member role updates with invalid roles', async () => {
      const invalidRoles = ['superadmin', 'moderator', 'guest', '', null, undefined];

      for (const role of invalidRoles) {
        const response = await request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ 
            memberEmail: 'user3@example.com',
            role: role 
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Group Operations Edge Cases', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should handle updating group with invalid ObjectId', async () => {
      const response = await request(app)
        .put('/v1/groups/invalid-id')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Updated Group' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle updating non-existent group', async () => {
      const fakeId = testUser1._id; // Valid ObjectId but not a group
      const response = await request(app)
        .put(`/v1/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Updated Group' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle deleting group with invalid ObjectId', async () => {
      const response = await request(app)
        .delete('/v1/groups/invalid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent group updates', async () => {
      const promises = [
        request(app)
          .put(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ name: 'Updated by User1' }),
        request(app)
          .put(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${token2}`)
          .send({ description: 'Updated by User2' })
      ];

      const responses = await Promise.all(promises);
      
      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle group operations after user deletion', async () => {
      // Delete a user who is a group member
      await User.findByIdAndDelete(testUser2._id);

      // Group should still exist but with orphaned reference
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(2);
    });

    it('should handle group operations with deactivated user', async () => {
      // Deactivate a user
      testUser2.isActive = false;
      await testUser2.save();

      // User should still be able to access group operations
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Group Expense Edge Cases', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' },
          { user: testUser3._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should handle group expense with mismatched split amounts', async () => {
      const expenseData = {
        description: 'Mismatched amounts',
        amount: 100.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: 30.00 },
          { user: testUser2._id.toString(), amount: 30.00 },
          { user: testUser3._id.toString(), amount: 30.00 } // Total: 90, not 100
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must equal the total');
    });

    it('should handle group expense with negative amounts', async () => {
      const expenseData = {
        description: 'Negative amounts',
        amount: -100.00,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: -50.00 },
          { user: testUser2._id.toString(), amount: -50.00 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle group expense with zero amount', async () => {
      const expenseData = {
        description: 'Zero amount',
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

    it('should handle group expense with very large amounts', async () => {
      const largeAmount = 999999999.99;
      const expenseData = {
        description: 'Large amount',
        amount: largeAmount,
        groupId: testGroup._id.toString(),
        splitWith: [
          { user: testUser1._id.toString(), amount: largeAmount / 3 },
          { user: testUser2._id.toString(), amount: largeAmount / 3 },
          { user: testUser3._id.toString(), amount: largeAmount / 3 }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(largeAmount);
    });

    it('should handle group expense with decimal precision', async () => {
      const expenseData = {
        description: 'Decimal precision',
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

    it('should handle group expense with invalid currency', async () => {
      const expenseData = {
        description: 'Invalid currency',
        amount: 100.00,
        currency: 'INVALID',
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
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle group expense with invalid category', async () => {
      const expenseData = {
        description: 'Invalid category',
        amount: 100.00,
        category: 'invalid_category',
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
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle group expense with future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const expenseData = {
        description: 'Future expense',
        amount: 100.00,
        date: futureDate.toISOString(),
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
      expect(new Date(response.body.data.date)).toEqual(futureDate);
    });

    it('should handle group expense with very old date', async () => {
      const oldDate = new Date('1900-01-01');

      const expenseData = {
        description: 'Old expense',
        amount: 100.00,
        date: oldDate.toISOString(),
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
      expect(new Date(response.body.data.date)).toEqual(oldDate);
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should handle group with maximum number of members', async () => {
      // Create a group with many members
      const members = [];
      for (let i = 0; i < 50; i++) {
        const user = new User({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'password123'
        });
        await user.save();
        members.push({ user: user._id, role: 'member' });
      }

      const group = new Group({
        name: 'Large Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }, ...members]
      });
      await group.save();

      expect(group.members).toHaveLength(51);
    });

    it('should handle group with duplicate member entries', async () => {
      const group = new Group({
        name: 'Duplicate Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' },
          { user: testUser2._id, role: 'member' } // Duplicate
        ]
      });
      await group.save();

      expect(group.members).toHaveLength(3);
      expect(group.isMember(testUser2._id)).toBe(true);
    });

    it('should handle group operations with circular references', async () => {
      // This should not cause issues as we're not storing circular references
      const group = new Group({
        name: 'Circular Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();

      const response = await request(app)
        .get(`/v1/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle group with very long member list', async () => {
      const longMemberList = Array(1000).fill().map((_, i) => ({
        user: testUser1._id, // All same user for simplicity
        role: 'member'
      }));

      const group = new Group({
        name: 'Very Large Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }, ...longMemberList]
      });
      await group.save();

      expect(group.members).toHaveLength(1001);
    });
  });

  describe('Concurrent Operations Edge Cases', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Concurrent Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await testGroup.save();
    });

    it('should handle concurrent group creation by same user', async () => {
      const groupData = {
        name: 'Concurrent Group',
        description: 'Created concurrently'
      };

      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send(groupData)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle concurrent member additions to same group', async () => {
      const promises = [
        request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: 'user2@example.com' }),
        request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: 'user3@example.com' }),
        request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: 'user4@example.com' })
      ];

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify final state
      const finalGroup = await Group.findById(testGroup._id);
      expect(finalGroup.members).toHaveLength(4);
    });

    it('should handle concurrent group updates', async () => {
      const promises = [
        request(app)
          .put(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ name: 'Updated Name 1' }),
        request(app)
          .put(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ description: 'Updated Description 1' }),
        request(app)
          .put(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ name: 'Updated Name 2' })
      ];

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
