import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { UserSchema, parseUser, User } from './files';

describe('UserSchema - Zod v4 Schema Tests', () => {
  describe('Happy Path - Valid User Creation', () => {
    test('should parse a complete valid user object', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        age: '25',
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        portfolioUrl: 'https://portfolio.example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'A software developer',
          joined: new Date('2023-01-01'),
        },
      };

      const result = UserSchema.safeParse(validUser);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.email, 'user@example.com');
      assert.strictEqual(result.data.age, 25);
      assert.strictEqual(result.data.role, 'admin');
    });

    test('should parse user without optional portfolioUrl', () => {
      const userWithoutPortfolio = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        age: '30',
        active: 'false',
        role: 'user',
        website: 'https://example.com',
        status: 'inactive',
        code: 'user-5000',
        imageUrl: 'https://example.com/avatar.png',
        name: 'Jane Smith',
        profile: {
          joined: new Date('2023-06-15'),
        },
      };

      const result = UserSchema.safeParse(userWithoutPortfolio);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.portfolioUrl, undefined);
    });

    test('should coerce age from string to number', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '45',
        active: 'yes',
        role: 'manager',
        website: 'https://example.com',
        status: 'active',
        code: 'user-999',
        imageUrl: 'https://example.com/pic.jpg',
        name: 'Bob Manager',
        profile: {
          joined: new Date(),
        },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(typeof result.data.age, 'number');
      assert.strictEqual(result.data.age, 45);
    });

    test('should parse boolean from various stringbool formats', () => {
      const testCases = [
        { active: 'true', expected: true },
        { active: 'false', expected: false },
        { active: 'yes', expected: true },
        { active: 'no', expected: false },
        { active: '1', expected: true },
        { active: '0', expected: false },
      ];

      testCases.forEach(({ active, expected }) => {
        const user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          age: '25',
          active,
          role: 'user',
          website: 'https://example.com',
          status: 'active',
          code: 'user-100',
          imageUrl: 'https://example.com/img.jpg',
          name: 'Test User',
          profile: { joined: new Date() },
        };

        const result = UserSchema.safeParse(user);
        assert.strictEqual(result.success, true);
        assert(result.data);
        assert.strictEqual(result.data.active, expected);
      });
    });

    test('should trim name field', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-200',
        imageUrl: 'https://example.com/img.jpg',
        name: '  John Doe  ',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.name, 'John Doe');
    });

    test('should accept all enum role values', () => {
      const roles = ['admin', 'user', 'manager'];
      
      roles.forEach(role => {
        const user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          age: '25',
          active: 'true',
          role,
          website: 'https://example.com',
          status: 'active',
          code: 'user-300',
          imageUrl: 'https://example.com/img.jpg',
          name: 'Test',
          profile: { joined: new Date() },
        };

        const result = UserSchema.safeParse(user);
        assert.strictEqual(result.success, true);
        assert(result.data);
        assert.strictEqual(result.data.role, role);
      });
    });

    test('should accept all literal status values', () => {
      const statuses = ['active', 'inactive', 'banned'];
      
      statuses.forEach(status => {
        const user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          age: '25',
          active: 'true',
          role: 'user',
          website: 'https://example.com',
          status,
          code: 'user-400',
          imageUrl: 'https://example.com/img.jpg',
          name: 'Test',
          profile: { joined: new Date() },
        };

        const result = UserSchema.safeParse(user);
        assert.strictEqual(result.success, true);
        assert(result.data);
        assert.strictEqual(result.data.status, status);
      });
    });
  });

  describe('Edge Cases - Boundary Conditions', () => {
    test('should accept minimum age (18)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'teen@example.com',
        age: '18',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-500',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Teen User',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.age, 18);
    });

    test('should accept minimum name length (2 characters)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-600',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Jo',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.name, 'Jo');
    });

    test('should accept maximum name length (100 characters)', () => {
      const longName = 'A'.repeat(100);
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-700',
        imageUrl: 'https://example.com/img.jpg',
        name: longName,
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.name.length, 100);
    });

    test('should accept code with minimum number (1)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
    });

    test('should accept code with maximum number (9999)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-9999',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
    });

    test('should accept profile without optional bio', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-800',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: {
          joined: new Date(),
        },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.profile.bio, undefined);
    });

    test('should handle empty string bio (optional)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-900',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: {
          bio: '',
          joined: new Date(),
        },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.profile.bio, '');
    });
  });

  describe('Validation Failures - Invalid Inputs', () => {
    test('should reject invalid UUID format', () => {
      const user = {
        id: 'not-a-uuid',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1000',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid email format', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'not-an-email',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1100',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject age below 18', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '17',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1200',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject age that is not an integer', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25.5',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1300',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid role', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'superadmin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1400',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid status literal', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'pending',
        code: 'user-1500',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid URL format for website', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'not-a-url',
        status: 'active',
        code: 'user-1600',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid URL format for portfolioUrl', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        portfolioUrl: 'invalid-url',
        status: 'active',
        code: 'user-1700',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid URL format for imageUrl', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1800',
        imageUrl: 'not-a-url',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject name shorter than 2 characters', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1900',
        imageUrl: 'https://example.com/img.jpg',
        name: 'A',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject name longer than 100 characters', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2000',
        imageUrl: 'https://example.com/img.jpg',
        name: 'A'.repeat(101),
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject invalid code format (wrong prefix)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'admin-1000',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject code with number below 1', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-0',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject code with number above 9999', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-10000',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject missing required fields', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });

    test('should reject missing profile.joined (required)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2100',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: {},
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, false);
    });
  });

  describe('parseUser Function Tests', () => {
    test('should successfully parse valid user with parseUser function', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2200',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test User',
        profile: { joined: new Date() },
      };

      const user = parseUser(validUser);
      assert.strictEqual(user.email, 'user@example.com');
      assert.strictEqual(user.age, 25);
    });

    test('should throw error with treeified error message on invalid input', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2300',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      assert.throws(() => parseUser(invalidUser), Error);
    });

    test('should throw error with JSON stringified error details', () => {
      const invalidUser = {
        id: 'not-a-uuid',
        email: 'invalid-email',
      };

      try {
        parseUser(invalidUser);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error instanceof Error);
        assert(error.message.includes('Invalid'));
      }
    });
  });

  describe('Type Inference Tests', () => {
    test('should correctly infer User type from schema', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        age: '25',
        active: 'true',
        role: 'admin' as const,
        website: 'https://example.com',
        status: 'active' as const,
        code: 'user-2400',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: { joined: new Date() },
      };

      const result = UserSchema.safeParse(validUser);
      assert.strictEqual(result.success, true);
      if (result.success) {
        const user: User = result.data;
        assert.strictEqual(typeof user.email, 'string');
        assert.strictEqual(typeof user.age, 'number');
      }
    });
  });

  describe('Strict Object Tests', () => {
    test('should allow extra properties when parsed (Zod default behavior)', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2500',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: {
          joined: new Date(),
          extraField: 'should be stripped in strict object',
        },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Date Handling Tests', () => {
    test('should accept Date object in profile.joined', () => {
      const now = new Date();
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2600',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: {
          joined: now,
        },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.profile.joined.getTime(), now.getTime());
    });

    test('should accept ISO string date and coerce to Date', () => {
      const isoDate = '2023-01-15T10:30:00Z';
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-2700',
        imageUrl: 'https://example.com/img.jpg',
        name: 'Test',
        profile: {
          joined: isoDate,
        },
      };

      const result = UserSchema.safeParse(user);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert(result.data.profile.joined instanceof Date);
    });
  });
});