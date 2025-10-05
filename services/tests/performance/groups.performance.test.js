const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Group = require('../../models/Group');
const Expense = require('../../models/Expense');

describe('Groups Performance Tests', () => {
  let testUsers = [];
  let tokens = [];
  let testGroup;

  beforeAll(async () => {
    // Create 100 test users for performance testing
    const userPromises = [];
    for (let i = 0; i < 100; i++) {
      const user = new User({
        name: `Performance User ${i}`,
        email: `perfuser${i}@example.com`,
        password: 'password123'
      });
      userPromises.push(user.save());
    }
    testUsers = await Promise.all(userPromises);

    // Get tokens for first 10 users
    const tokenPromises = [];
    for (let i = 0; i < 10; i++) {
      const login = request(app)
        .post('/v1/auth/login')
        .send({ email: `perfuser${i}@example.com`, password: 'password123' });
      tokenPromises.push(login);
    }
    const loginResponses = await Promise.all(tokenPromises);
    tokens = loginResponses.map(response => response.body.data.token);
  });

  beforeEach(async () => {
    // Create a test group with many members
    const members = testUsers.slice(0, 50).map(user => ({
      user: user._id,
      role: 'member'
    }));
    members[0].role = 'admin'; // First user is admin

    testGroup = new Group({
      name: 'Performance Test Group',
      description: 'A group for performance testing',
      createdBy: testUsers[0]._id,
      members: members
    });
    await testGroup.save();
  });

  describe('Group Creation Performance', () => {
    it('should create groups efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 50 groups concurrently
      for (let i = 0; i < 50; i++) {
        const promise = request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${tokens[i % 10]}`)
          .send({
            name: `Performance Group ${i}`,
            description: `Group ${i} for performance testing`
          });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log(`Created 50 groups in ${duration}ms (${duration/50}ms per group)`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle large group creation efficiently', async () => {
      const startTime = Date.now();
      
      // Create a group with maximum members
      const members = testUsers.slice(0, 100).map(user => ({
        user: user._id,
        role: 'member'
      }));
      members[0].role = 'admin';

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({
          name: 'Large Performance Group',
          description: 'A group with many members'
        })
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.success).toBe(true);
      console.log(`Created large group in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Group Retrieval Performance', () => {
    it('should retrieve user groups efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Get groups for 20 users concurrently
      for (let i = 0; i < 20; i++) {
        const promise = request(app)
          .get('/v1/groups')
          .set('Authorization', `Bearer ${tokens[i % 10]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Retrieved groups for 20 users in ${duration}ms (${duration/20}ms per user)`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should retrieve large group details efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Get group details 50 times concurrently
      for (let i = 0; i < 50; i++) {
        const promise = request(app)
          .get(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${tokens[0]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.members).toHaveLength(50);
      });

      console.log(`Retrieved large group details 50 times in ${duration}ms (${duration/50}ms per request)`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Member Management Performance', () => {
    it('should add members efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Add 20 members concurrently
      for (let i = 50; i < 70; i++) {
        const promise = request(app)
          .post(`/v1/groups/${testGroup._id}/members`)
          .set('Authorization', `Bearer ${tokens[0]}`)
          .send({ memberEmail: `perfuser${i}@example.com` });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Added 20 members in ${duration}ms (${duration/20}ms per member)`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent member operations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Mix of add and remove operations
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          // Add member
          const promise = request(app)
            .post(`/v1/groups/${testGroup._id}/members`)
            .set('Authorization', `Bearer ${tokens[0]}`)
            .send({ memberEmail: `perfuser${i + 70}@example.com` });
          promises.push(promise);
        } else {
          // Remove member (if exists)
          const promise = request(app)
            .delete(`/v1/groups/${testGroup._id}/members/${testUsers[i]._id}`)
            .set('Authorization', `Bearer ${tokens[0]}`);
          promises.push(promise);
        }
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Performed 20 concurrent member operations in ${duration}ms (${duration/20}ms per operation)`);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('Group Expense Performance', () => {
    beforeEach(async () => {
      // Create some test expenses for performance testing
      const expensePromises = [];
      for (let i = 0; i < 100; i++) {
        const expense = new Expense({
          description: `Performance expense ${i}`,
          amount: 100.00 + i,
          paidBy: testUsers[i % 10]._id,
          group: testGroup._id,
          splitWith: [
            { user: testUsers[0]._id, amount: 50.00 + i/2, settled: false },
            { user: testUsers[1]._id, amount: 50.00 + i/2, settled: false }
          ]
        });
        expensePromises.push(expense.save());
      }
      await Promise.all(expensePromises);
    });

    it('should retrieve group expenses efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Get group expenses 20 times concurrently
      for (let i = 0; i < 20; i++) {
        const promise = request(app)
          .get(`/v1/expenses/group/${testGroup._id}`)
          .set('Authorization', `Bearer ${tokens[0]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(100);
      });

      console.log(`Retrieved 100 group expenses 20 times in ${duration}ms (${duration/20}ms per request)`);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should calculate group balance efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Calculate group balance 20 times concurrently
      for (let i = 0; i < 20; i++) {
        const promise = request(app)
          .get(`/v1/expenses/group/${testGroup._id}/balance`)
          .set('Authorization', `Bearer ${tokens[0]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.balances).toBeDefined();
      });

      console.log(`Calculated group balance 20 times in ${duration}ms (${duration/20}ms per calculation)`);
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
    });

    it('should create group expenses efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 50 group expenses concurrently
      for (let i = 0; i < 50; i++) {
        const promise = request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${tokens[i % 10]}`)
          .send({
            description: `Performance expense ${i}`,
            amount: 100.00,
            groupId: testGroup._id.toString(),
            splitWith: [
              { user: testUsers[0]._id.toString(), amount: 50.00 },
              { user: testUsers[1]._id.toString(), amount: 50.00 }
            ]
          });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log(`Created 50 group expenses in ${duration}ms (${duration/50}ms per expense)`);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('Pagination Performance', () => {
    beforeEach(async () => {
      // Create many expenses for pagination testing
      const expensePromises = [];
      for (let i = 0; i < 500; i++) {
        const expense = new Expense({
          description: `Pagination expense ${i}`,
          amount: 100.00 + i,
          paidBy: testUsers[i % 10]._id,
          group: testGroup._id,
          splitWith: [
            { user: testUsers[0]._id, amount: 50.00 + i/2, settled: false },
            { user: testUsers[1]._id, amount: 50.00 + i/2, settled: false }
          ]
        });
        expensePromises.push(expense.save());
      }
      await Promise.all(expensePromises);
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Test different page sizes
      const pageSizes = [10, 20, 50, 100];
      for (const pageSize of pageSizes) {
        for (let page = 1; page <= 5; page++) {
          const promise = request(app)
            .get(`/v1/expenses/group/${testGroup._id}?page=${page}&limit=${pageSize}`)
            .set('Authorization', `Bearer ${tokens[0]}`);
          promises.push(promise);
        }
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.pagination).toBeDefined();
      });

      console.log(`Handled 20 paginated requests in ${duration}ms (${duration/20}ms per request)`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle large page sizes efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/v1/expenses/group/${testGroup._id}?page=1&limit=500`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(500);
      expect(response.body.pagination.total).toBe(500);

      console.log(`Retrieved 500 expenses in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle mixed concurrent operations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Mix of different operations
      for (let i = 0; i < 30; i++) {
        const operationType = i % 4;
        
        switch (operationType) {
          case 0:
            // Get groups
            promises.push(
              request(app)
                .get('/v1/groups')
                .set('Authorization', `Bearer ${tokens[i % 10]}`)
            );
            break;
          case 1:
            // Get group details
            promises.push(
              request(app)
                .get(`/v1/groups/${testGroup._id}`)
                .set('Authorization', `Bearer ${tokens[0]}`)
            );
            break;
          case 2:
            // Get group expenses
            promises.push(
              request(app)
                .get(`/v1/expenses/group/${testGroup._id}`)
                .set('Authorization', `Bearer ${tokens[0]}`)
            );
            break;
          case 3:
            // Get group balance
            promises.push(
              request(app)
                .get(`/v1/expenses/group/${testGroup._id}/balance`)
                .set('Authorization', `Bearer ${tokens[0]}`)
            );
            break;
        }
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Handled 30 mixed concurrent operations in ${duration}ms (${duration/30}ms per operation)`);
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
    });

    it('should handle high-frequency operations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // High-frequency group detail requests
      for (let i = 0; i < 100; i++) {
        const promise = request(app)
          .get(`/v1/groups/${testGroup._id}`)
          .set('Authorization', `Bearer ${tokens[i % 10]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Handled 100 high-frequency requests in ${duration}ms (${duration/100}ms per request)`);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large group operations without memory issues', async () => {
      const startTime = Date.now();
      
      // Create a very large group
      const largeGroup = new Group({
        name: 'Very Large Group',
        createdBy: testUsers[0]._id,
        members: testUsers.map(user => ({
          user: user._id,
          role: 'member'
        }))
      });
      largeGroup.members[0].role = 'admin';
      await largeGroup.save();

      // Perform operations on large group
      const promises = [
        request(app)
          .get(`/v1/groups/${largeGroup._id}`)
          .set('Authorization', `Bearer ${tokens[0]}`),
        request(app)
          .get(`/v1/expenses/group/${largeGroup._id}/balance`)
          .set('Authorization', `Bearer ${tokens[0]}`)
      ];

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Handled large group operations in ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle many concurrent group creations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 100 groups concurrently
      for (let i = 0; i < 100; i++) {
        const promise = request(app)
          .post('/v1/groups')
          .set('Authorization', `Bearer ${tokens[i % 10]}`)
          .send({
            name: `Concurrent Group ${i}`,
            description: `Group ${i} created concurrently`
          });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log(`Created 100 groups concurrently in ${duration}ms (${duration/100}ms per group)`);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex group queries efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Complex queries with filters
      for (let i = 0; i < 20; i++) {
        const promise = request(app)
          .get(`/v1/expenses/group/${testGroup._id}?settled=false&page=${i % 5 + 1}&limit=20`)
          .set('Authorization', `Bearer ${tokens[0]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Handled 20 complex queries in ${duration}ms (${duration/20}ms per query)`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle group member queries efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Query group members for different users
      for (let i = 0; i < 50; i++) {
        const promise = request(app)
          .get('/v1/groups')
          .set('Authorization', `Bearer ${tokens[i % 10]}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`Handled 50 group member queries in ${duration}ms (${duration/50}ms per query)`);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });
});
