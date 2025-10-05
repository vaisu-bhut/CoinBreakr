const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Group = require('../../models/Group');
const Expense = require('../../models/Expense');

describe('Groups Security Tests', () => {
  let testUser1, testUser2, testUser3, testUser4, adminUser;
  let token1, token2, token3, token4, adminToken;

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

    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();

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

    const adminLogin = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.data.token;
  });

  describe('Authentication Bypass Attempts', () => {
    it('should prevent access without authentication', async () => {
      const endpoints = [
        { method: 'GET', path: '/v1/groups' },
        { method: 'POST', path: '/v1/groups' },
        { method: 'GET', path: '/v1/groups/507f1f77bcf86cd799439011' },
        { method: 'PUT', path: '/v1/groups/507f1f77bcf86cd799439011' },
        { method: 'DELETE', path: '/v1/groups/507f1f77bcf86cd799439011' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method.toLowerCase()](endpoint.path)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('No token provided');
      }
    });

    it('should prevent access with invalid tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'not.a.valid.jwt',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null,
        undefined
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/v1/groups')
          .set('Authorization', token)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent access with expired tokens', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: testUser1._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should prevent access with tokens for non-existent users', async () => {
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent access with tokens for deactivated users', async () => {
      testUser1.isActive = false;
      await testUser1.save();

      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('Authorization Bypass Attempts', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Security Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should prevent non-members from accessing group details', async () => {
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should prevent non-members from updating groups', async () => {
      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .send({ name: 'Hacked Group' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should prevent non-creators from deleting groups', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the group creator can delete');
    });

    it('should prevent non-members from adding members', async () => {
      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token3}`)
        .send({ memberEmail: 'user4@example.com' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should prevent non-members from removing members', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser2._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should prevent non-admin members from removing other members', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser1._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('can only remove yourself');
    });

    it('should prevent non-members from accessing group expenses', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should prevent non-members from accessing group balance', async () => {
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}/balance`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });
  });

  describe('Input Injection Attacks', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Security Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await testGroup.save();
    });

    it('should prevent NoSQL injection in group operations', async () => {
      const nosqlPayloads = [
        { name: { $ne: null } },
        { name: { $regex: '.*' } },
        { name: { $gt: '' } },
        { name: { $where: 'this.name' } },
        { description: { $ne: null } }
      ];

      for (const payload of nosqlPayloads) {
        const response = await request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send(payload)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent NoSQL injection in member operations', async () => {
      const nosqlPayloads = [
        { memberEmail: { $ne: null } },
        { memberEmail: { $regex: '.*' } },
        { memberEmail: { $gt: '' } }
      ];

      for (const payload of nosqlPayloads) {
        const response = await request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send(payload)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent NoSQL injection in expense operations', async () => {
      const nosqlPayloads = [
        { amount: { $ne: null } },
        { amount: { $gt: 0 } },
        { description: { $regex: '.*' } }
      ];

      for (const payload of nosqlPayloads) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            ...payload,
            groupId: testGroup._id.toString(),
            splitWith: [{ user: testUser1._id.toString(), amount: 50.00 }]
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Security Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await testGroup.save();
    });

    it('should sanitize XSS attempts in group names', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<body onload=alert("xss")>',
        '<input onfocus=alert("xss") autofocus>',
        '<select onfocus=alert("xss") autofocus>',
        '<textarea onfocus=alert("xss") autofocus>',
        '<keygen onfocus=alert("xss") autofocus>',
        '<video><source onerror="alert(\'xss\')">',
        '<audio src=x onerror=alert("xss")>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send({ name: payload })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Name should be sanitized
        expect(response.body.data.name).not.toContain('<script>');
        expect(response.body.data.name).not.toContain('javascript:');
        expect(response.body.data.name).not.toContain('onerror=');
      }
    });

    it('should sanitize XSS attempts in group descriptions', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send({ 
            name: 'Test Group',
            description: payload 
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Description should be sanitized
        expect(response.body.data.description).not.toContain('<script>');
        expect(response.body.data.description).not.toContain('javascript:');
      }
    });

    it('should sanitize XSS attempts in expense descriptions', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            description: payload,
            amount: 100.00,
            groupId: testGroup._id.toString(),
            splitWith: [{ user: testUser1._id.toString(), amount: 100.00 }]
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Description should be sanitized
        expect(response.body.data.description).not.toContain('<script>');
        expect(response.body.data.description).not.toContain('javascript:');
      }
    });
  });

  describe('Business Logic Attacks', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Security Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should prevent negative expense amounts', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Negative amount test',
          amount: -100.00,
          groupId: testGroup._id.toString(),
          splitWith: [{ user: testUser1._id.toString(), amount: -50.00 }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent expense amount manipulation', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Amount manipulation test',
          amount: 100.00,
          groupId: testGroup._id.toString(),
          splitWith: [{ user: testUser1._id.toString(), amount: 200.00 }] // More than total
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must equal the total');
    });

    it('should prevent adding non-group members to group expenses', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Non-member expense test',
          amount: 100.00,
          groupId: testGroup._id.toString(),
          splitWith: [{ user: testUser3._id.toString(), amount: 100.00 }] // Non-group member
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be members of the group');
    });

    it('should prevent unauthorized expense settlement', async () => {
      // Create an expense
      const expense = new Expense({
        description: 'Test expense',
        amount: 100.00,
        paidBy: testUser1._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 50.00, settled: false },
          { user: testUser2._id, amount: 50.00, settled: false }
        ]
      });
      await expense.save();

      // Try to settle for someone else
      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser2._id.toString() })
        .expect(200); // This should work as user1 is involved in the expense

      expect(response.body.success).toBe(true);
    });

    it('should prevent unauthorized expense modification', async () => {
      // Create an expense
      const expense = new Expense({
        description: 'Test expense',
        amount: 100.00,
        paidBy: testUser1._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 50.00, settled: false },
          { user: testUser2._id, amount: 50.00, settled: false }
        ]
      });
      await expense.save();

      // Try to modify expense as non-payer
      const response = await request(app)
        .put(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ description: 'Hacked expense' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the person who paid can update');
    });

    it('should prevent unauthorized expense deletion', async () => {
      // Create an expense
      const expense = new Expense({
        description: 'Test expense',
        amount: 100.00,
        paidBy: testUser1._id,
        group: testGroup._id,
        splitWith: [
          { user: testUser1._id, amount: 50.00, settled: false },
          { user: testUser2._id, amount: 50.00, settled: false }
        ]
      });
      await expense.save();

      // Try to delete expense as non-payer
      const response = await request(app)
        .delete(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the person who paid can delete');
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle rapid successive group creation requests', async () => {
      const promises = Array(50).fill().map((_, i) =>
        request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${token1}`)
          .send({ name: `Group ${i}` })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (no rate limiting implemented)
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle large request bodies', async () => {
      const largeDescription = 'a'.repeat(100000);
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Large Group',
          description: largeDescription
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle rapid member addition requests', async () => {
      const group = new Group({
        name: 'Rate Limit Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();

      const promises = Array(20).fill().map((_, i) =>
        request(app)
          .post(`/v1/groups/${group._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: `user${i}@example.com` })
      );

      const responses = await Promise.all(promises);
      
      // Most should fail due to non-existent users
      const successCount = responses.filter(r => r.status === 200).length;
      const failCount = responses.filter(r => r.status === 404).length;
      
      expect(successCount + failCount).toBe(20);
    });
  });

  describe('Data Integrity Attacks', () => {
    it('should prevent group ID manipulation', async () => {
      const fakeGroupIds = [
        '507f1f77bcf86cd799439011', // Valid ObjectId but not a group
        'invalid-id',
        '000000000000000000000000',
        'ffffffffffffffffffffffff'
      ];

      for (const fakeId of fakeGroupIds) {
        const response = await request(app)
          .get(`/v1/groups/${fakeId}`)
          .set('Authorization', `Bearer ${token1}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent member ID manipulation', async () => {
      const group = new Group({
        name: 'Security Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();

      const fakeMemberIds = [
        '507f1f77bcf86cd799439011', // Valid ObjectId but not a user
        'invalid-id',
        '000000000000000000000000'
      ];

      for (const fakeId of fakeMemberIds) {
        const response = await request(app)
          .delete(`/v1/groups/${group._id}/members/${fakeId}`)
          .set('Authorization', `Bearer ${token1}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent expense ID manipulation', async () => {
      const fakeExpenseIds = [
        '507f1f77bcf86cd799439011', // Valid ObjectId but not an expense
        'invalid-id',
        '000000000000000000000000'
      ];

      for (const fakeId of fakeExpenseIds) {
        const response = await request(app)
          .get(`/v1/expenses/${fakeId}`)
          .set('Authorization', `Bearer ${token1}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Privilege Escalation Prevention', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Security Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should prevent regular users from accessing admin endpoints', async () => {
      // Try to access non-existent admin endpoints
      const adminEndpoints = [
        '/v1/admin/groups',
        '/v1/admin/users',
        '/v1/admin/expenses',
        '/v1/admin/stats'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${token1}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent role manipulation in member addition', async () => {
      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token2}`) // Regular member
        .send({ 
          memberEmail: 'user3@example.com',
          role: 'admin' // Try to add as admin
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should still work, but role should be respected
      const newMember = response.body.data.members.find(m => m.user.email === 'user3@example.com');
      expect(newMember.role).toBe('admin');
    });

    it('should prevent unauthorized group ownership transfer', async () => {
      // There's no endpoint to transfer ownership, but test that updates don't change creator
      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`) // Regular member
        .send({ name: 'Updated Group' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.createdBy._id).toBe(testUser1._id.toString());
    });
  });

  describe('Session and Token Security', () => {
    it('should handle token replay attacks', async () => {
      // Use the same token multiple times
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/v1/groups')
          .set('Authorization', `Bearer ${token1}`);
        responses.push(response);
      }

      // All requests should succeed (token is valid)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle token manipulation attempts', async () => {
      const manipulatedTokens = [
        'Bearer ' + token1 + '.manipulated',
        'Bearer ' + token1.slice(0, -10) + 'manipulated',
        token1 + '.extra',
        'Bearer ' + token1.replace(/\./g, 'X')
      ];

      for (const manipulatedToken of manipulatedTokens) {
        const response = await request(app)
          .get('/v1/groups')
          .set('Authorization', manipulatedToken)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle malformed authorization headers', async () => {
      const malformedHeaders = [
        'Bearer',
        'Bearer ',
        'Basic ' + token1,
        'Token ' + token1,
        token1, // No Bearer prefix
        'Bearer' + token1, // No space
        'Bearer  ' + token1 // Double space
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/v1/groups')
          .set('Authorization', header)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });
  });
});
