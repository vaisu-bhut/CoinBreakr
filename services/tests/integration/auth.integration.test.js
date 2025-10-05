const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Authentication Integration Tests', () => {
  describe('POST /v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail to register with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    it('should fail to register with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('6 characters');
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to register with missing required fields', async () => {
      const userData = {
        name: 'John Doe'
        // Missing email and password
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to register with empty name', async () => {
      const userData = {
        name: '',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to register with name too long', async () => {
      const userData = {
        name: 'a'.repeat(51), // 51 characters
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"name": "John", "email": "john@example.com", "password": "password123"')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await testUser.save();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to login with missing password', async () => {
      const loginData = {
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to login with empty credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle case insensitive email login', async () => {
      const loginData = {
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle SQL injection attempts in email', async () => {
      const loginData = {
        email: "'; DROP TABLE users; --",
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle XSS attempts in email', async () => {
      const loginData = {
        email: '<script>alert("xss")</script>@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Validation', () => {
    let testUser, validToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await testUser.save();

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      validToken = loginResponse.body.data.token;
    });

    it('should accept valid JWT token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should reject request with malformed token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'Bearer not.a.valid.jwt')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should reject request with token for non-existent user', async () => {
      const fakeToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle token with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { id: testUser._id },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty authorization header', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple rapid requests
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // All should fail with 401, not rate limit
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before saving', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email }).select('+password');
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should handle very long passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'a'.repeat(1000)
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
