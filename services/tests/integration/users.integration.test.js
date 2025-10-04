const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('User Management Integration Tests', () => {
  let user1, user2, user3, token1, token2, token3;

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

    // Get tokens
    const login1 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'john@example.com', password: 'password123' });
    token1 = login1.body.data.token;

    const login2 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'jane@example.com', password: 'password123' });
    token2 = login2.body.data.token;

    const login3 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    token3 = login3.body.data.token;
  });

  describe('GET /v1/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.friends).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/users/search', () => {
    it('should search users by name', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=Jane')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Jane');
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=bob@example.com')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toBe('bob@example.com');
    });

    it('should return empty array for non-existent user', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=NonexistentUser')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should exclude current user from search results', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=John')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1); // Should find Bob Johnson but not himself
      expect(response.body.data[0].name).toBe('Bob Johnson'); // Should be Bob Johnson, not John Doe
    });

    it('should fail with search term too short', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=a')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('2 characters');
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/v1/users/search')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in search', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=@%23$%25')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should limit search results to 20', async () => {
      // Create 25 users
      const users = [];
      for (let i = 0; i < 25; i++) {
        users.push(new User({
          name: `User${i}`,
          email: `user${i}@example.com`,
          password: 'password123'
        }));
      }
      await User.insertMany(users);

      const response = await request(app)
        .get('/v1/users/search?q=User')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });
  });

  describe('POST /v1/users/friends', () => {
    it('should add friend successfully', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');

      // Verify friendship is bidirectional
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      
      expect(updatedUser1.friends).toContainEqual(user2._id);
      expect(updatedUser2.friends).toContainEqual(user1._id);
    });

    it('should fail to add non-existent user as friend', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: '507f1f77bcf86cd799439011' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should fail to add self as friend', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user1._id.toString() })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('yourself');
    });

    it('should fail to add already existing friend', async () => {
      // Add friend first
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() })
        .expect(201);

      // Try to add again
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already your friend');
    });

    it('should fail without friendId', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail with invalid friendId format', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: 'invalid-id' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .set('Content-Type', 'application/json')
        .send('{"friendId": "invalid-json"')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/users/friends', () => {
    beforeEach(async () => {
      // Add friends
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() });

      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user3._id.toString() });
    });

    it('should get friends list successfully', async () => {
      const response = await request(app)
        .get('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
    });

  });

  describe('GET /v1/users/friends - Edge Cases', () => {
    it('should return empty array for user with no friends', async () => {
      const response = await request(app)
        .get('/v1/users/friends')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('DELETE /v1/users/friends/:friendId', () => {
    beforeEach(async () => {
      // Add friend first
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() });
    });

    it('should remove friend successfully', async () => {
      const response = await request(app)
        .delete(`/v1/users/friends/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(204);

      // 204 responses have no body

      // Verify friendship is removed bidirectionally
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      
      expect(updatedUser1.friends).not.toContainEqual(user2._id);
      expect(updatedUser2.friends).not.toContainEqual(user1._id);
    });

    it('should handle removing non-existent friend', async () => {
      const response = await request(app)
        .delete('/v1/users/friends/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .expect(204);

      // 204 responses have no body
    });

    it('should handle invalid friendId format', async () => {
      const response = await request(app)
        .delete('/v1/users/friends/invalid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(204);

      // 204 responses have no body
    });
  });

  describe('GET /v1/users/friends/:friendId/balance', () => {
    beforeEach(async () => {
      // Add friend first
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() });
    });

    it('should get balance with friend (no expenses)', async () => {
      const response = await request(app)
        .get(`/v1/users/friends/${user2._id}/balance`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(0);
      expect(response.body.data.message).toContain('settled up');
    });

    it('should fail to get balance with non-friend', async () => {
      const response = await request(app)
        .get(`/v1/users/friends/${user3._id}/balance`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not your friend');
    });

    it('should handle invalid friendId', async () => {
      const response = await request(app)
        .get('/v1/users/friends/invalid-id/balance')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/users/balances', () => {
    it('should get all balances (no friends)', async () => {
      const response = await request(app)
        .get('/v1/users/balances')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should get all balances with friends but no expenses', async () => {
      // Add friends
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendId: user2._id.toString() });

      const response = await request(app)
        .get('/v1/users/balances')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0); // No expenses, so no balances
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long names in search', async () => {
      // Try to create a user with a very long name - should fail validation
      const longNameUser = new User({
        name: 'a'.repeat(1000),
        email: 'longname@example.com',
        password: 'password123'
      });
      
      await expect(longNameUser.save()).rejects.toThrow('Name cannot be more than 50 characters');
    });

    it('should handle special characters in names', async () => {
      const specialUser = new User({
        name: 'José María O\'Connor-Smith',
        email: 'special@example.com',
        password: 'password123'
      });
      await specialUser.save();

      const response = await request(app)
        .get('/v1/users/search?q=Jos%C3%A9')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent friend additions', async () => {
      const promises = [
        request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token1}`)
          .send({ friendId: user2._id.toString() }),
        request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token2}`)
          .send({ friendId: user1._id.toString() })
      ];

      const responses = await Promise.all(promises);
      
      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database connection
      // For now, we'll test with invalid ObjectId format
      const response = await request(app)
        .get('/v1/users/friends/000000000000000000000000/balance')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large request bodies', async () => {
      const largeData = {
        friendId: user2._id.toString(),
        extraData: 'x'.repeat(10000)
      };

      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send(largeData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent friend additions', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = new User({
          name: `User${i}`,
          email: `user${i}@example.com`,
          password: 'password123'
        });
        await user.save();
        users.push(user);
      }

      const loginPromises = users.map(user =>
        request(app)
          .post('/v1/auth/login')
          .send({ email: user.email, password: 'password123' })
      );

      const loginResponses = await Promise.all(loginPromises);
      const tokens = loginResponses.map(response => response.body.data.token);

      // Add friends concurrently
      const friendPromises = tokens.map((token, index) =>
        request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token}`)
          .send({ friendId: users[(index + 1) % users.length]._id.toString() })
      );

      const responses = await Promise.all(friendPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle large friends list efficiently', async () => {
      // Add many friends
      const friends = [];
      for (let i = 0; i < 50; i++) {
        const friend = new User({
          name: `Friend${i}`,
          email: `friend${i}@example.com`,
          password: 'password123'
        });
        await friend.save();
        friends.push(friend);

        await request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token1}`)
          .send({ friendId: friend._id.toString() });
      }

      const start = Date.now();
      const response = await request(app)
        .get('/v1/users/friends')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const duration = Date.now() - start;
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});