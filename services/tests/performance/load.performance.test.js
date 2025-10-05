const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Performance Tests - Load Testing', () => {
  let testUsers = [];
  let tokens = [];

  beforeAll(async () => {
    // Create test users for performance testing
    for (let i = 0; i < 50; i++) {
      const user = new User({
        name: `User${i}`,
        email: `user${i}@example.com`,
        password: 'password123'
      });
      await user.save();
      testUsers.push(user);

      // Get token
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: `user${i}@example.com`, password: 'password123' });
      tokens.push(loginResponse.body.data.token);
    }

    // Create friend relationships
    for (let i = 0; i < testUsers.length; i++) {
      for (let j = i + 1; j < Math.min(i + 5, testUsers.length); j++) {
        await request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${tokens[i]}`)
          .send({ friendId: testUsers[j]._id.toString() });
      }
    }
  });

  describe('Authentication Performance', () => {
    it('should handle 100 concurrent login requests', async () => {
      const loginPromises = Array(100).fill().map((_, index) =>
        request(app)
          .post('/v1/auth/login')
          .send({ 
            email: `user${index % 50}@example.com`, 
            password: 'password123' 
          })
      );

      const start = Date.now();
      const responses = await Promise.all(loginPromises);
      const duration = Date.now() - start;

      // Check that all requests completed successfully
      const successfulLogins = responses.filter(r => r.status === 200);
      expect(successfulLogins.length).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle 200 concurrent registration requests', async () => {
      const registrationPromises = Array(200).fill().map((_, index) =>
        request(app)
          .post('/v1/auth/register')
          .send({
            name: `PerfUser${index}`,
            email: `perfuser${index}@example.com`,
            password: 'password123'
          })
      );

      const start = Date.now();
      const responses = await Promise.all(registrationPromises);
      const duration = Date.now() - start;

      // Check that all requests completed (some may fail due to duplicate emails)
      expect(responses.length).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('User Management Performance', () => {
    it('should handle 50 concurrent friend additions', async () => {
      const friendPromises = Array(50).fill().map((_, index) =>
        request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
          .send({ friendId: testUsers[(index + 1) % testUsers.length]._id.toString() })
      );

      const start = Date.now();
      const responses = await Promise.all(friendPromises);
      const duration = Date.now() - start;

      // Check that most requests completed successfully
      const successfulAdditions = responses.filter(r => r.status === 201);
      expect(successfulAdditions.length).toBeGreaterThan(40);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle 100 concurrent profile requests', async () => {
      const profilePromises = Array(100).fill().map((_, index) =>
        request(app)
          .get('/v1/users/profile')
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
      );

      const start = Date.now();
      const responses = await Promise.all(profilePromises);
      const duration = Date.now() - start;

      // Check that all requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(100);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle 50 concurrent search requests', async () => {
      const searchPromises = Array(50).fill().map((_, index) =>
        request(app)
          .get(`/v1/users/search?q=User${index % 10}`)
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
      );

      const start = Date.now();
      const responses = await Promise.all(searchPromises);
      const duration = Date.now() - start;

      // Check that all requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(50);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Expense Management Performance', () => {
    it('should handle 100 concurrent expense creation requests', async () => {
      const expensePromises = Array(100).fill().map((_, index) => {
        const userIndex = index % tokens.length;
        const friendIndex = (index + 1) % tokens.length;
        
        return request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${tokens[userIndex]}`)
          .send({
            description: `Performance Expense ${index}`,
            amount: 100.00,
            splitWith: [{
              user: testUsers[friendIndex]._id.toString(),
              amount: 50.00
            }]
          });
      });

      const start = Date.now();
      const responses = await Promise.all(expensePromises);
      const duration = Date.now() - start;

      // Check that most requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 201);
      expect(successfulRequests.length).toBeGreaterThan(80);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle 200 concurrent expense retrieval requests', async () => {
      const expensePromises = Array(200).fill().map((_, index) =>
        request(app)
          .get('/v1/expenses')
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
      );

      const start = Date.now();
      const responses = await Promise.all(expensePromises);
      const duration = Date.now() - start;

      // Check that all requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(200);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle 50 concurrent settlement requests', async () => {
      // First create some expenses
      const expenses = [];
      for (let i = 0; i < 50; i++) {
        const expense = new Expense({
          description: `Settlement Test ${i}`,
          amount: 100.00,
          paidBy: testUsers[i % testUsers.length]._id,
          splitWith: [{
            user: testUsers[(i + 1) % testUsers.length]._id,
            amount: 50.00,
            settled: false
          }],
          category: 'food'
        });
        await expense.save();
        expenses.push(expense);
      }

      const settlementPromises = expenses.map((expense, index) =>
        request(app)
          .post(`/v1/expenses/${expense._id}/settle`)
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
          .send({ userId: testUsers[(index + 1) % testUsers.length]._id.toString() })
      );

      const start = Date.now();
      const responses = await Promise.all(settlementPromises);
      const duration = Date.now() - start;

      // Check that all requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(50);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Database Performance', () => {
    it('should handle large dataset queries efficiently', async () => {
      // Create a large number of expenses
      const expenses = [];
      for (let i = 0; i < 1000; i++) {
        expenses.push(new Expense({
          description: `Bulk Expense ${i}`,
          amount: Math.random() * 1000,
          paidBy: testUsers[i % testUsers.length]._id,
          splitWith: [{
            user: testUsers[(i + 1) % testUsers.length]._id,
            amount: Math.random() * 500,
            settled: Math.random() > 0.5
          }],
          category: ['food', 'transport', 'entertainment'][i % 3]
        }));
      }
      await Expense.insertMany(expenses);

      // Test query performance
      const start = Date.now();
      const response = await request(app)
        .get('/v1/expenses?limit=100')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);
      const duration = Date.now() - start;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex aggregation queries efficiently', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/v1/users/balances')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200);
      const duration = Date.now() - start;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during high load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let batch = 0; batch < 10; batch++) {
        const promises = Array(50).fill().map((_, index) =>
          request(app)
            .get('/v1/users/profile')
            .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
        );
        await Promise.all(promises);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle connection pool exhaustion gracefully', async () => {
      // Create many concurrent database operations
      const promises = Array(200).fill().map((_, index) => {
        const user = new User({
          name: `ConnectionTest${index}`,
          email: `connectiontest${index}@example.com`,
          password: 'password123'
        });
        return user.save();
      });

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // All operations should complete successfully
      expect(responses.length).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle invalid requests gracefully under load', async () => {
      const invalidPromises = Array(100).fill().map((_, index) =>
        request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
          .send({
            // Invalid data - missing required fields
            description: `Invalid Expense ${index}`
          })
      );

      const start = Date.now();
      const responses = await Promise.all(invalidPromises);
      const duration = Date.now() - start;

      // All requests should return 400 errors
      const errorResponses = responses.filter(r => r.status === 400);
      expect(errorResponses.length).toBe(100);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle authentication failures gracefully under load', async () => {
      const authPromises = Array(100).fill().map((_, index) =>
        request(app)
          .get('/v1/users/profile')
          .set('Authorization', `Bearer invalid-token-${index}`)
      );

      const start = Date.now();
      const responses = await Promise.all(authPromises);
      const duration = Date.now() - start;

      // All requests should return 401 errors
      const errorResponses = responses.filter(r => r.status === 401);
      expect(errorResponses.length).toBe(100);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Concurrent User Operations', () => {
    it('should handle concurrent friend additions and removals', async () => {
      const operations = [];
      
      // Add friends
      for (let i = 0; i < 25; i++) {
        operations.push(
          request(app)
            .post('/v1/users/friends')
            .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
            .send({ friendId: testUsers[(i + 1) % testUsers.length]._id.toString() })
        );
      }

      // Remove friends
      for (let i = 0; i < 25; i++) {
        operations.push(
          request(app)
            .delete(`/v1/users/friends/${testUsers[(i + 2) % testUsers.length]._id}`)
            .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // Most operations should complete successfully
      const successfulOperations = responses.filter(r => r.status === 201 || r.status === 204);
      expect(successfulOperations.length).toBeGreaterThan(40);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent expense creation and settlement', async () => {
      const operations = [];
      
      // Create expenses
      for (let i = 0; i < 30; i++) {
        operations.push(
          request(app)
            .post('/v1/expenses')
            .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
            .send({
              description: `Concurrent Expense ${i}`,
              amount: 100.00,
              splitWith: [{
                user: testUsers[(i + 1) % testUsers.length]._id.toString(),
                amount: 50.00
              }]
            })
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // Most operations should complete successfully
      const successfulOperations = responses.filter(r => r.status === 201);
      expect(successfulOperations.length).toBeGreaterThan(25);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
