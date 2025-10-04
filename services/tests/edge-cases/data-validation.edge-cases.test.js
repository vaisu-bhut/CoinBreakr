const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');

describe('Data Validation Edge Cases', () => {
  let testUser, token;

  beforeEach(async () => {
    testUser = new User({
      name: 'Validation Test User',
      email: 'validation@example.com',
      password: 'password123'
    });
    await testUser.save();

    const loginResponse = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'validation@example.com', password: 'password123' });
    token = loginResponse.body.data.token;
  });

  describe('User Registration Edge Cases', () => {
    // it('should handle boundary name lengths', async () => {
    //   // Test minimum length (1 character)
    //   const minNameResponse = await request(app)
    //     .post('/v1/auth/register')
    //     .send({
    //       name: 'A',
    //       email: 'minname@example.com',
    //       password: 'password123'
    //     })
    //     .expect(201);

    //   expect(minNameResponse.body.success).toBe(true);

    //   // Test maximum length (50 characters)
    //   const maxName = 'A'.repeat(50);
    //   const maxNameResponse = await request(app)
    //     .post('/v1/auth/register')
    //     .send({
    //       name: maxName,
    //       email: 'maxname@example.com',
    //       password: 'password123'
    //     })
    //     .expect(201);

    //   expect(maxNameResponse.body.success).toBe(true);

    //   // Test over maximum length (51 characters)
    //   const overMaxName = 'A'.repeat(51);
    //   const overMaxNameResponse = await request(app)
    //     .post('/v1/auth/register')
    //     .send({
    //       name: overMaxName,
    //       email: 'overmaxname@example.com',
    //       password: 'password123'
    //     })
    //     .expect(400);

    //   expect(overMaxNameResponse.body.success).toBe(false);
    // });

    // it('should handle boundary password lengths', async () => {
    //   // Test minimum length (6 characters)
    //   const minPasswordResponse = await request(app)
    //     .post('/v1/auth/register')
    //     .send({
    //       name: 'Test User',
    //       email: 'minpass@example.com',
    //       password: '123456'
    //     })
    //     .expect(201);

    //   expect(minPasswordResponse.body.success).toBe(true);

    //   // Test under minimum length (5 characters)
    //   const underMinPasswordResponse = await request(app)
    //     .post('/v1/auth/register')
    //     .send({
    //       name: 'Test User',
    //       email: 'underminpass@example.com',
    //       password: '12345'
    //     })
    //     .expect(400);

    //   expect(underMinPasswordResponse.body.success).toBe(false);
    // });

    it('should handle various email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example123.com',
        'test@sub.example.com',
        'user@example.co.uk',
        'user@example-domain.com',
        'user@example.museum'
      ];

      for (let i = 0; i < validEmails.length; i++) {
        const response = await request(app)
          .post('/v1/auth/register')
          .send({
            name: `Test User ${i}`,
            email: validEmails[i],
            password: 'password123'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example..com',
        'user@example.com.',
        'user name@example.com',
        'user@exam ple.com',
        'user@example',
        'user@@example.com',
        'user@example@com'
      ];

      for (let i = 0; i < invalidEmails.length; i++) {
        const response = await request(app)
          .post('/v1/auth/register')
          .send({
            name: 'Test User',
            email: invalidEmails[i],
            password: 'password123'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle whitespace in inputs', async () => {
      const whitespaceTests = [
        { name: '  Test User  ', email: '  whitespace@example.com  ', password: '  password123  ' },
        { name: '\tTest User\t', email: '\twhitespace2@example.com\t', password: '\tpassword123\t' },
        { name: '\nTest User\n', email: '\nwhitespace3@example.com\n', password: '\npassword123\n' }
      ];

      for (let i = 0; i < whitespaceTests.length; i++) {
        const response = await request(app)
          .post('/v1/auth/register')
          .send(whitespaceTests[i])
          .expect(201);

        expect(response.body.success).toBe(true);
        // Should trim whitespace
        expect(response.body.data.user.name).toBe('Test User');
        expect(response.body.data.user.email).toBe(`whitespace${i === 0 ? '' : i + 1}@example.com`);
      }
    });

    it('should handle empty strings', async () => {
      const emptyStringTests = [
        { name: '', email: 'empty@example.com', password: 'password123' },
        { name: 'Test User', email: '', password: 'password123' },
        { name: 'Test User', email: 'empty2@example.com', password: '' }
      ];

      for (const test of emptyStringTests) {
        const response = await request(app)
          .post('/v1/auth/register')
          .send(test)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Expense Creation Edge Cases', () => {
    let friendUser, friendId;

    beforeEach(async () => {
      friendUser = new User({
        name: 'Friend User',
        email: 'friend@example.com',
        password: 'password123'
      });
      await friendUser.save();
      friendId = friendUser._id.toString();

      // Add friend
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });
    });

    it('should handle boundary expense amounts', async () => {
      // Test minimum amount (0.01)
      const minAmountResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Minimum amount test',
          amount: 0.01,
          splitWith: [{ user: friendId, amount: 0.01 }]
        })
        .expect(201);

      expect(minAmountResponse.body.success).toBe(true);

      // Test zero amount
      const zeroAmountResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Zero amount test',
          amount: 0,
          splitWith: [{ user: friendId, amount: 0 }]
        })
        .expect(400);

      expect(zeroAmountResponse.body.success).toBe(false);

      // Test negative amount
      const negativeAmountResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Negative amount test',
          amount: -10.00,
          splitWith: [{ user: friendId, amount: -5.00 }]
        })
        .expect(400);

      expect(negativeAmountResponse.body.success).toBe(false);
    });

    it('should handle very large amounts', async () => {
      const largeAmountResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Large amount test',
          amount: 1000000000.00,
          splitWith: [{ user: friendId, amount: 1000000000.00 }]
        })
        .expect(201);

      expect(largeAmountResponse.body.success).toBe(true);
    });

    it('should handle decimal precision', async () => {
      const decimalTests = [
        { amount: 10.1, split: 10.1 },
        { amount: 10.12, split: 10.12 },
        { amount: 10.123, split: 10.123 },
        { amount: 10.1234, split: 10.1234 },
        { amount: 10.12345, split: 10.12345 }
      ];

      for (let i = 0; i < decimalTests.length; i++) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: `Decimal test ${i}`,
            amount: decimalTests[i].amount,
            splitWith: [{ user: friendId, amount: decimalTests[i].split }]
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle split amount precision', async () => {
      // Test that split amounts must equal total amount
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Split precision test',
          amount: 100.00,
          splitWith: [{ user: friendId, amount: 50.001 }] // Slightly off
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle boundary description lengths', async () => {
      // Test maximum length (200 characters)
      const maxDescription = 'A'.repeat(200);
      const maxDescResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: maxDescription,
          amount: 100.00,
          splitWith: [{ user: friendId, amount: 100.00 }]
        })
        .expect(201);

      expect(maxDescResponse.body.success).toBe(true);

      // Test over maximum length (201 characters)
      const overMaxDescription = 'A'.repeat(201);
      const overMaxDescResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: overMaxDescription,
          amount: 100.00,
          splitWith: [{ user: friendId, amount: 50.00 }]
        })
        .expect(400);

      expect(overMaxDescResponse.body.success).toBe(false);
    });

    it('should handle all expense categories', async () => {
      const categories = ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'travel', 'other'];

      for (const category of categories) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: `${category} expense`,
            amount: 100.00,
            category,
            splitWith: [{ user: friendId, amount: 100.00 }]
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.category).toBe(category);
      }
    });

    it('should reject invalid categories', async () => {
      const invalidCategories = ['invalid', 'random', 'test', ''];

      for (const category of invalidCategories) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: 'Invalid category test',
            amount: 100.00,
            category,
            splitWith: [{ user: friendId, amount: 50.00 }]
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle multiple splits', async () => {
      // Create additional friend
      const friend2 = new User({
        name: 'Friend 2',
        email: 'friend2@example.com',
        password: 'password123'
      });
      await friend2.save();

      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId: friend2._id.toString() });

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Multiple splits test',
          amount: 150.00,
          splitWith: [
            { user: friendId, amount: 50.00 },
            { user: friend2._id.toString(), amount: 50.00 },
            { user: testUser._id.toString(), amount: 50.00 }
          ]
        })
        .expect(400); // Should fail because user can't split with themselves

      expect(response.body.success).toBe(false);
    });

    it('should handle currency codes', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

      for (const currency of currencies) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: `${currency} expense`,
            amount: 100.00,
            currency,
            splitWith: [{ user: friendId, amount: 100.00 }]
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.currency).toBe(currency);
      }
    });

    it('should handle invalid currency codes', async () => {
      const invalidCurrencies = ['INVALID', 'US', 'EURO', '123', ''];

      for (const currency of invalidCurrencies) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: 'Invalid currency test',
            amount: 100.00,
            currency,
            splitWith: [{ user: friendId, amount: 50.00 }]
          })
          .expect(400); // Should fail validation

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Date Handling Edge Cases', () => {
    let friendUser, friendId;

    beforeEach(async () => {
      friendUser = new User({
        name: 'Friend User',
        email: 'friend@example.com',
        password: 'password123'
      });
      await friendUser.save();
      friendId = friendUser._id.toString();

      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });
    });

    it('should handle various date formats', async () => {
      const dateFormats = [
        '2024-01-15',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00+00:00',
        '2024-01-15T10:30:00-05:00',
        '2024-01-15 10:30:00'
      ];

      for (let i = 0; i < dateFormats.length; i++) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: `Date format test ${i}`,
            amount: 100.00,
            date: dateFormats[i],
            splitWith: [{ user: friendId, amount: 100.00 }]
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.date).toBeDefined();
      }
    });

    it('should handle invalid dates', async () => {
      const invalidDates = [
        'invalid-date',
        '2024-13-01', // Invalid month
        '2024-01-32', // Invalid day
        '2024-02-30', // Invalid day for February
        '2024-01-15T25:00:00Z', // Invalid hour
        '2024-01-15T10:60:00Z', // Invalid minute
        '2024-01-15T10:30:60Z'  // Invalid second
      ];

      for (const invalidDate of invalidDates) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: 'Invalid date test',
            amount: 100.00,
            date: invalidDate,
            splitWith: [{ user: friendId, amount: 50.00 }]
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Future date test',
          amount: 100.00,
          date: futureDate.toISOString(),
          splitWith: [{ user: friendId, amount: 100.00 }]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle very old dates', async () => {
      const oldDate = new Date('1900-01-01');

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Old date test',
          amount: 100.00,
          date: oldDate.toISOString(),
          splitWith: [{ user: friendId, amount: 100.00 }]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('ObjectId Validation Edge Cases', () => {
    it('should handle invalid ObjectId formats', async () => {
      const invalidObjectIds = [
        'invalid-id',
        '123',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd7994390111', // Too long
        '507f1f77bcf86cd79943901g' // Invalid character
      ];

      for (const invalidId of invalidObjectIds) {
        const response = await request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token}`)
          .send({ friendId: invalidId })
          .expect(404);

        expect(response.body.success).toBe(false);
      }

      // Test missing/empty values separately
      const missingValues = ['', null, undefined];
      for (const missingValue of missingValues) {
        const response = await request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token}`)
          .send({ friendId: missingValue })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle non-existent ObjectIds', async () => {
      const nonExistentIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013'
      ];

      for (const nonExistentId of nonExistentIds) {
        const response = await request(app)
          .post('/v1/users/friends')
          .set('Authorization', `Bearer ${token}`)
          .send({ friendId: nonExistentId })
          .expect(404);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Array and Object Validation Edge Cases', () => {
    let friendUser, friendId;

    beforeEach(async () => {
      friendUser = new User({
        name: 'Friend User',
        email: 'friend@example.com',
        password: 'password123'
      });
      await friendUser.save();
      friendId = friendUser._id.toString();

      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });
    });

    it('should handle empty arrays', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Empty array test',
          amount: 100.00,
          splitWith: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed split objects', async () => {
      const malformedSplits = [
        [{ user: friendId }], // Missing amount
        [{ amount: 50.00 }], // Missing user
        [{ user: friendId, amount: 'invalid' }], // Invalid amount type
        [{ user: 'invalid-id', amount: 50.00 }], // Invalid user ID
        [{ user: friendId, amount: -50.00 }] // Negative amount
      ];

      for (const split of malformedSplits) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            description: 'Malformed split test',
            amount: 100.00,
            splitWith: split
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle nested object validation', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Nested object test',
          amount: 100.00,
          splitWith: [{
            user: friendId,
            amount: 100.00,
            extraField: 'should be ignored'
          }]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Type Coercion Edge Cases', () => {
    let friendUser, friendId;

    beforeEach(async () => {
      friendUser = new User({
        name: 'Friend User',
        email: 'friend@example.com',
        password: 'password123'
      });
      await friendUser.save();
      friendId = friendUser._id.toString();

      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });
    });

    it('should handle string numbers', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'String number test',
          amount: '100.00',
          splitWith: [{ user: friendId, amount: '100.00' }]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.amount).toBe('number');
    });

    it('should handle boolean values', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Boolean test',
          amount: true,
          splitWith: [{ user: friendId, amount: false }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle array values', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Array test',
          amount: [100.00],
          splitWith: [{ user: friendId, amount: [50.00] }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});