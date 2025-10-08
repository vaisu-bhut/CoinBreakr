const request = require('supertest');
const app = require('../../server');

describe('Smoke Tests - Basic API Functionality', () => {
  
  describe('Health Check Endpoint', () => {
    test('GET /v1/healthz should return 200 and health status', async () => {
      const response = await request(app)
        .get('/v1/healthz')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /v1/auth/register should accept valid user data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('POST /v1/auth/login should authenticate valid credentials', async () => {
      // First register a user
      const userData = {
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData);

      // Then login
      const loginData = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('User Endpoints', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login a user for authenticated tests
      const userData = {
        name: 'Auth Test User',
        email: 'auth@example.com',
        password: 'password123'
      };

      const registerResponse = await request(app)
        .post('/v1/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user._id;
    });

    test('GET /v1/users/profile should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', userId);
      expect(response.body.data).toHaveProperty('name', 'Auth Test User');
      expect(response.body.data).toHaveProperty('email', 'auth@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('GET /v1/users/profile should return 401 without token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('GET /v1/users/search should return users with valid search', async () => {
      // Create another user to search for
      const anotherUser = {
        name: 'Search Target User',
        email: 'search@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(anotherUser);

      const response = await request(app)
        .get('/v1/users/search?userId=Search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('GET /v1/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('POST /v1/auth/register should return 400 for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Database Connectivity', () => {
    test('Server should be able to connect to database', async () => {
      // This test verifies that the database connection is working
      // by successfully creating and retrieving a user
      const userData = {
        name: 'DB Test User',
        email: 'db@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBeDefined();
    });
  });
});
