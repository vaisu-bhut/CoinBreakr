const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Security Edge Cases and Attack Vectors', () => {
  let testUser, friendUser, token;

  beforeEach(async () => {
    testUser = new User({
      name: 'Security Test User',
      email: 'security@example.com',
      password: 'password123'
    });
    await testUser.save();

    friendUser = new User({
      name: 'Security Friend User',
      email: 'securityfriend@example.com',
      password: 'password123'
    });
    await friendUser.save();

    const loginResponse = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'security@example.com', password: 'password123' });
    token = loginResponse.body.data.token;

    // Add friend
    await request(app)
      .post('/v1/users/friends')
      .set('Authorization', `Bearer ${token}`)
      .send({ friendId: friendUser._id.toString() });
  });

  // describe('SQL Injection Attacks', () => {
  //   it('should prevent SQL injection in email field', async () => {
  //     const maliciousPayloads = [
  //       "'; DROP TABLE users; --",
  //       "' OR '1'='1",
  //       "admin'--",
  //       "' UNION SELECT * FROM users--",
  //       "'; DELETE FROM users WHERE '1'='1",
  //       "' OR 1=1#",
  //       "admin'/*",
  //       "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com', 'password'); --"
  //     ];

  //     for (const payload of maliciousPayloads) {
  //       const response = await request(app)
  //         .post('/v1/auth/login')
  //         .send({ email: payload, password: 'password123' })
  //         .expect(401);

  //       expect(response.body.success).toBe(false);
  //       expect(response.body.message).toContain('Invalid credentials');
  //     }
  //   });

  //   it('should prevent SQL injection in search queries', async () => {
  //     const maliciousPayloads = [
  //       "'; DROP TABLE users; --",
  //       "' OR '1'='1",
  //       "' UNION SELECT * FROM users--",
  //       "'; DELETE FROM users WHERE '1'='1",
  //       "' OR 1=1#"
  //     ];

  //     for (const payload of maliciousPayloads) {
  //       const response = await request(app)
  //         .get(`/v1/users/search?q=${encodeURIComponent(payload)}`)
  //         .set('Authorization', `Bearer ${token}`)
  //         .expect(200);

  //       expect(response.body.success).toBe(true);
  //       expect(Array.isArray(response.body.data)).toBe(true);
  //       // Should return empty results, not crash
  //     }
  //   });

  //   it('should prevent SQL injection in expense descriptions', async () => {
  //     const maliciousPayloads = [
  //       "'; DROP TABLE expenses; --",
  //       "' OR '1'='1",
  //       "'; DELETE FROM expenses WHERE '1'='1",
  //       "' UNION SELECT * FROM expenses--"
  //     ];

  //     for (const payload of maliciousPayloads) {
  //       const response = await request(app)
  //         .post('/v1/expenses')
  //         .set('Authorization', `Bearer ${token}`)
  //         .send({
  //           description: payload,
  //           amount: 100.00,
  //           splitWith: [{ user: friendUser._id.toString(), amount: 100.00 }]
  //         })
  //         .expect(400); // Should fail validation, not crash

  //       expect(response.body.success).toBe(false);
  //     }
  //   });
  // });

  describe('XSS (Cross-Site Scripting) Attacks', () => {
    it('should sanitize XSS attempts in user names', async () => {
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
          .post('/v1/auth/register')
          .send({
            name: payload,
            email: `xss${Date.now()}@example.com`,
            password: 'password123'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Name should be sanitized
        expect(response.body.data.user.name).not.toContain('<script>');
        expect(response.body.data.user.name).not.toContain('javascript:');
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
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: payload,
            amount: 100.00,
            splitWith: [{ user: friendUser._id.toString(), amount: 100.00 }]
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Description should be sanitized
        expect(response.body.data.description).not.toContain('<script>');
        expect(response.body.data.description).not.toContain('javascript:');
      }
    });

    it('should sanitize XSS attempts in search queries', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .get(`/v1/users/search?q=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Should not execute scripts
        expect(response.body.data).toBeDefined();
      }
    });
  });

  describe('NoSQL Injection Attacks', () => {
    it('should prevent NoSQL injection in login', async () => {
      const nosqlPayloads = [
        { email: { $ne: null }, password: { $ne: null } },
        { email: { $regex: '.*' }, password: { $regex: '.*' } },
        { email: { $gt: '' }, password: { $gt: '' } },
        { email: { $where: 'this.password' }, password: 'anything' }
      ];

      for (const payload of nosqlPayloads) {
        const response = await request(app)
          .post('/v1/auth/login')
          .send(payload)
          .expect(400); // Should fail validation

        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent NoSQL injection in user search', async () => {
      const nosqlPayloads = [
        { $ne: null },
        { $regex: '.*' },
        { $gt: '' },
        { $where: 'this.email' }
      ];

      for (const payload of nosqlPayloads) {
        const response = await request(app)
          .get(`/v1/users/search?q=${encodeURIComponent(JSON.stringify(payload))}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  // describe('Authentication Bypass Attempts', () => {
  //   it('should prevent JWT token manipulation', async () => {
  //     const manipulatedTokens = [
  //       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid-signature',
  //       'Bearer invalid-token',
  //       'Bearer ',
  //       'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJpYXQiOjE1MTYyMzkwMjJ9.manipulated',
  //       'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJpYXQiOjE1MTYyMzkwMjJ9'
  //     ];

  //     for (const manipulatedToken of manipulatedTokens) {
  //       const response = await request(app)
  //         .get('/v1/users/profile')
  //         .set('Authorization', manipulatedToken)
  //         .expect(401);

  //       expect(response.body.success).toBe(false);
  //     }
  //   });

  //   it('should prevent privilege escalation attempts', async () => {
  //     // Try to access admin endpoints with regular user token
  //     const adminEndpoints = [
  //       '/v1/admin/users',
  //       '/v1/admin/expenses',
  //       '/v1/admin/stats'
  //     ];

  //     for (const endpoint of adminEndpoints) {
  //       const response = await request(app)
  //         .get(endpoint)
  //         .set('Authorization', `Bearer ${token}`)
  //         .expect(404); // Should not exist or be forbidden

  //       expect(response.body.success).toBe(false);
  //     }
  //   });

  //   it('should prevent token replay attacks', async () => {
  //     // Use the same token multiple times
  //     const responses = [];
  //     for (let i = 0; i < 10; i++) {
  //       const response = await request(app)
  //         .get('/v1/users/profile')
  //         .set('Authorization', `Bearer ${token}`);
  //       responses.push(response);
  //     }

  //     // All requests should succeed (token is valid)
  //     responses.forEach(response => {
  //       expect(response.status).toBe(200);
  //       expect(response.body.success).toBe(true);
  //     });
  //   });
  // });

  // describe('Input Validation Attacks', () => {
  //   it('should handle extremely long inputs', async () => {
  //     const longString = 'a'.repeat(10000);

  //     const response = await request(app)
  //       .post('/v1/auth/register')
  //       .send({
  //         name: longString,
  //         email: 'longinput@example.com',
  //         password: 'password123'
  //       })
  //       .expect(400);

  //     expect(response.body.success).toBe(false);
  //   });

  //   it('should handle null and undefined inputs', async () => {
  //     const nullInputs = [
  //       { name: null, email: 'test@example.com', password: 'password123' },
  //       { name: 'Test User', email: null, password: 'password123' },
  //       { name: 'Test User', email: 'test@example.com', password: null },
  //       { name: undefined, email: 'test@example.com', password: 'password123' },
  //       { name: 'Test User', email: undefined, password: 'password123' },
  //       { name: 'Test User', email: 'test@example.com', password: undefined }
  //     ];

  //     for (const input of nullInputs) {
  //       const response = await request(app)
  //         .post('/v1/auth/register')
  //         .send(input)
  //         .expect(400);

  //       expect(response.body.success).toBe(false);
  //     }
  //   });

  //   it('should handle special characters in inputs', async () => {
  //     const specialChars = [
  //       '!@#$%^&*()_+-=[]{}|;:,.<>?',
  //       '🚀🎉💯🔥',
  //       'ñáéíóú',
  //       '中文测试',
  //       'العربية',
  //       'עברית',
  //       'русский'
  //     ];

  //     for (const chars of specialChars) {
  //       const response = await request(app)
  //         .post('/v1/auth/register')
  //         .send({
  //           name: `Test ${chars}`,
  //           email: `test${Date.now()}@example.com`,
  //           password: 'password123'
  //         })
  //         .expect(201);

  //       expect(response.body.success).toBe(true);
  //     }
  //   });

  //   it('should handle buffer overflow attempts', async () => {
  //     const bufferOverflow = Buffer.alloc(1000000, 'A').toString();

  //     const response = await request(app)
  //       .post('/v1/expenses')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send({
  //         description: bufferOverflow,
  //         amount: 100.00,
  //         splitWith: [{ user: friendUser._id.toString(), amount: 100.00 }]
  //       })
  //       .expect(400);

  //     expect(response.body.success).toBe(false);
  //   });
  // });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle rapid successive requests', async () => {
      const promises = Array(100).fill().map(() =>
        request(app)
          .post('/v1/auth/login')
          .send({ email: 'security@example.com', password: 'wrongpassword' })
      );

      const responses = await Promise.all(promises);
      
      // All should return 401 (wrong password), not rate limit
      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    it('should handle large request bodies', async () => {
      const largeBody = {
        description: 'Test',
        amount: 100.00,
        splitWith: Array(1000).fill().map((_, i) => ({
          user: testUser._id.toString(),
          amount: 0.10
        }))
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(largeBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // describe('Path Traversal Attacks', () => {
  //   it('should prevent path traversal in file uploads', async () => {
  //     const pathTraversalPayloads = [
  //       '../../../etc/passwd',
  //       '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
  //       '....//....//....//etc/passwd',
  //       '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  //       '..%252f..%252f..%252fetc%252fpasswd'
  //     ];

  //     for (const payload of pathTraversalPayloads) {
  //       const response = await request(app)
  //         .post('/v1/expenses')
  //         .set('Authorization', `Bearer ${token}`)
  //         .send({
  //           description: payload,
  //           amount: 100.00,
  //           splitWith: [{ user: friendUser._id.toString(), amount: 100.00 }]
  //         })
  //         .expect(201); // Should be treated as normal text

  //       expect(response.body.success).toBe(true);
  //       expect(response.body.data.description).toBe(payload);
  //     }
  //   });
  // });

  // describe('HTTP Header Injection', () => {
  //   it('should prevent header injection attacks', async () => {
  //     const headerInjectionPayloads = [
  //       'test@example.com\r\nX-Injected-Header: malicious',
  //       'test@example.com\nX-Injected-Header: malicious',
  //       'test@example.com\rX-Injected-Header: malicious'
  //     ];

  //     for (const payload of headerInjectionPayloads) {
  //       const response = await request(app)
  //         .post('/v1/auth/register')
  //         .send({
  //           name: 'Test User',
  //           email: payload,
  //           password: 'password123'
  //         })
  //         .expect(400);

  //       expect(response.body.success).toBe(false);
  //     }
  //   });
  // });

  // describe('CSRF Protection', () => {
  //   it('should handle requests without proper headers', async () => {
  //     const response = await request(app)
  //       .post('/v1/expenses')
  //       .set('Authorization', `Bearer ${token}`)
  //       .set('Origin', 'http://malicious-site.com')
  //       .set('Referer', 'http://malicious-site.com')
  //       .send({
  //         description: 'CSRF Test',
  //         amount: 100.00,
  //         splitWith: [{ user: friendUser._id.toString(), amount: 100.00 }]
  //       })
  //       .expect(201); // Should still work as we don't have CSRF protection implemented

  //     expect(response.body.success).toBe(true);
  //   });
  // });

  // describe('Data Type Confusion', () => {
  //   it('should handle type confusion attacks', async () => {
  //     const typeConfusionPayloads = [
  //       { amount: '100', splitWith: [{ user: testUser._id.toString(), amount: '50' }] },
  //       { amount: true, splitWith: [{ user: testUser._id.toString(), amount: false }] },
  //       { amount: [], splitWith: [{ user: testUser._id.toString(), amount: {} }] },
  //       { amount: null, splitWith: [{ user: testUser._id.toString(), amount: null }] }
  //     ];

  //     for (const payload of typeConfusionPayloads) {
  //       const response = await request(app)
  //         .post('/v1/expenses')
  //         .set('Authorization', `Bearer ${token}`)
  //         .send({
  //           description: 'Type confusion test',
  //           ...payload
  //         })
  //         .expect(400);

  //       expect(response.body.success).toBe(false);
  //     }
  //   });
  // });

  // describe('Business Logic Attacks', () => {
  //   it('should prevent negative expense amounts', async () => {
  //     const response = await request(app)
  //       .post('/v1/expenses')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send({
  //         description: 'Negative amount test',
  //         amount: -100.00,
  //         splitWith: [{ user: testUser._id.toString(), amount: -50.00 }]
  //       })
  //       .expect(400);

  //     expect(response.body.success).toBe(false);
  //   });

  //   it('should prevent self-expense creation', async () => {
  //     const response = await request(app)
  //       .post('/v1/expenses')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send({
  //         description: 'Self expense test',
  //         amount: 100.00,
  //         splitWith: [{ user: testUser._id.toString(), amount: 100.00 }]
  //       })
  //       .expect(400);

  //     expect(response.body.success).toBe(false);
  //   });

  //   it('should prevent expense amount manipulation', async () => {
  //     const response = await request(app)
  //       .post('/v1/expenses')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send({
  //         description: 'Amount manipulation test',
  //         amount: 100.00,
  //         splitWith: [{ user: testUser._id.toString(), amount: 200.00 }] // More than total
  //       })
  //       .expect(400);

  //     expect(response.body.success).toBe(false);
  //   });
  // });
});