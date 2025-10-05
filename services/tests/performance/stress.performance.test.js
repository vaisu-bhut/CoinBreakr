const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Stress Tests - High Load Scenarios', () => {
  let testUsers = [];
  let tokens = [];

  beforeAll(async () => {
    // Create test users for stress testing
    for (let i = 0; i < 100; i++) {
      const user = new User({
        name: `StressUser${i}`,
        email: `stressuser${i}@example.com`,
        password: 'password123'
      });
      await user.save();
      testUsers.push(user);

      // Get token
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: `stressuser${i}@example.com`, password: 'password123' });
      tokens.push(loginResponse.body.data.token);
    }
  });

  describe('Extreme Load Scenarios', () => {
    it('should handle 1000 concurrent requests', async () => {
      const promises = Array(1000).fill().map((_, index) =>
        request(app)
          .get('/v1/users/profile')
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // Check that most requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(900);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle 500 concurrent expense creations', async () => {
      const promises = Array(500).fill().map((_, index) => {
        const userIndex = index % tokens.length;
        const friendIndex = (index + 1) % tokens.length;
        
        return request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${tokens[userIndex]}`)
          .send({
            description: `Stress Expense ${index}`,
            amount: 100.00,
            splitWith: [{
              user: testUsers[friendIndex]._id.toString(),
              amount: 50.00
            }]
          });
      });

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // Check that most requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 201);
      expect(successfulRequests.length).toBeGreaterThan(400);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle mixed workload stress test', async () => {
      const operations = [];
      
      // Mix of different operations
      for (let i = 0; i < 200; i++) {
        const operationType = i % 4;
        const userIndex = i % tokens.length;
        
        switch (operationType) {
          case 0: // Profile requests
            operations.push(
              request(app)
                .get('/v1/users/profile')
                .set('Authorization', `Bearer ${tokens[userIndex]}`)
            );
            break;
          case 1: // Search requests
            operations.push(
              request(app)
                .get(`/v1/users/search?q=User${i % 10}`)
                .set('Authorization', `Bearer ${tokens[userIndex]}`)
            );
            break;
          case 2: // Expense requests
            operations.push(
              request(app)
                .get('/v1/expenses')
                .set('Authorization', `Bearer ${tokens[userIndex]}`)
            );
            break;
          case 3: // Friend requests
            operations.push(
              request(app)
                .get('/v1/users/friends')
                .set('Authorization', `Bearer ${tokens[userIndex]}`)
            );
            break;
        }
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // Check that most requests completed successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(180);
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
    });
  });

  describe('Memory Stress Tests', () => {
    it('should handle large data operations without memory leaks', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create large number of expenses
      const expenses = [];
      for (let i = 0; i < 5000; i++) {
        expenses.push(new Expense({
          description: `Memory Test Expense ${i}`,
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

      // Perform many queries
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/v1/expenses?limit=100')
          .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 200MB)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
    });

    it('should handle concurrent large data operations', async () => {
      const operations = [];
      
      // Create many concurrent operations with large data
      for (let i = 0; i < 100; i++) {
        operations.push(
          request(app)
            .post('/v1/expenses')
            .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
            .send({
              description: `Large Data Expense ${i} with very long description that contains lots of text to test memory usage and performance under stress conditions`,
              amount: 1000.00,
              currency: 'USD',
              category: 'food',
              splitWith: Array(10).fill().map((_, j) => ({
                user: testUsers[(i + j) % testUsers.length]._id.toString(),
                amount: 100.00
              }))
            })
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // Most operations should complete successfully
      const successfulRequests = responses.filter(r => r.status === 201);
      expect(successfulRequests.length).toBeGreaterThan(80);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Database Connection Stress', () => {
    it('should handle database connection pool exhaustion', async () => {
      // Create many concurrent database operations
      const operations = [];
      
      for (let i = 0; i < 500; i++) {
        operations.push(
          request(app)
            .get('/v1/users/profile')
            .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // All operations should complete successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(500);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle concurrent write operations', async () => {
      const operations = [];
      
      // Create many concurrent write operations
      for (let i = 0; i < 200; i++) {
        const user = new User({
          name: `ConcurrentUser${i}`,
          email: `concurrentuser${i}@example.com`,
          password: 'password123'
        });
        operations.push(user.save());
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // All operations should complete successfully
      expect(responses.length).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling Under Stress', () => {
    it('should handle invalid requests gracefully under extreme load', async () => {
      const invalidPromises = Array(1000).fill().map((_, index) =>
        request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
          .send({
            // Invalid data - missing required fields
            description: `Invalid Stress Expense ${index}`
          })
      );

      const start = Date.now();
      const responses = await Promise.all(invalidPromises);
      const duration = Date.now() - start;

      // All requests should return 400 errors
      const errorResponses = responses.filter(r => r.status === 400);
      expect(errorResponses.length).toBe(1000);
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
    });

    it('should handle authentication failures under stress', async () => {
      const authPromises = Array(1000).fill().map((_, index) =>
        request(app)
          .get('/v1/users/profile')
          .set('Authorization', `Bearer invalid-stress-token-${index}`)
      );

      const start = Date.now();
      const responses = await Promise.all(authPromises);
      const duration = Date.now() - start;

      // All requests should return 401 errors
      const errorResponses = responses.filter(r => r.status === 401);
      expect(errorResponses.length).toBe(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Long Running Stress Test', () => {
    it('should maintain performance over extended period', async () => {
      const startTime = Date.now();
      const endTime = startTime + 30000; // Run for 30 seconds
      let requestCount = 0;
      let successCount = 0;

      while (Date.now() < endTime) {
        const promises = Array(50).fill().map((_, index) =>
          request(app)
            .get('/v1/users/profile')
            .set('Authorization', `Bearer ${tokens[index % tokens.length]}`)
        );

        const responses = await Promise.all(promises);
        requestCount += responses.length;
        successCount += responses.filter(r => r.status === 200).length;

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const duration = Date.now() - startTime;
      const successRate = (successCount / requestCount) * 100;

      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(duration).toBeGreaterThan(29000); // Should run for at least 29 seconds
    });
  });

  describe('Resource Exhaustion Tests', () => {
    it('should handle file descriptor exhaustion gracefully', async () => {
      // This test simulates high connection usage
      const operations = [];
      
      for (let i = 0; i < 1000; i++) {
        operations.push(
          request(app)
            .get('/v1/healthz')
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // All requests should complete successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(1000);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle CPU intensive operations', async () => {
      // Create operations that require more CPU processing
      const operations = [];
      
      for (let i = 0; i < 200; i++) {
        operations.push(
          request(app)
            .get(`/v1/users/search?q=${'a'.repeat(100)}`)
            .set('Authorization', `Bearer ${tokens[i % tokens.length]}`)
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;

      // All requests should complete successfully
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
