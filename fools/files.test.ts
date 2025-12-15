import { describe, it, expect } from 'vitest';
import { UserSchema } from './files';
import { z } from 'zod';

describe('UserSchema', () => {
  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'name+tag@subdomain.example.com',
      ];

      validEmails.forEach(email => {
        const result = UserSchema.safeParse({
          email,
          website: 'https://example.com',
          portfolioUrl: 'https://portfolio.com',
          status: ['active', 'inactive', 'banned'],
          code: 'ABC-1234',
          imageUrl: 'https://example.com/image.jpg',
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        '',
      ];

      invalidEmails.forEach(email => {
        const result = UserSchema.safeParse({
          email,
          website: 'https://example.com',
          status: ['active', 'inactive', 'banned'],
          code: 'ABC-1234',
          imageUrl: 'https://example.com/image.jpg',
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(expect.any(Number));
        }
      });
    });
  });

  describe('website URL validation', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.co.uk',
        'https://example.com/path',
        'https://example.com:8080',
      ];

      validUrls.forEach(website => {
        const result = UserSchema.safeParse({
          email: 'user@example.com',
          website,
          status: ['active', 'inactive', 'banned'],
          code: 'ABC-1234',
          imageUrl: 'https://example.com/image.jpg',
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'example.com',
        '',
        'javascript:alert(1)',
      ];

      invalidUrls.forEach(website => {
        const result = UserSchema.safeParse({
          email: 'user@example.com',
          website,
          status: ['active', 'inactive', 'banned'],
          code: 'ABC-1234',
          imageUrl: 'https://example.com/image.jpg',
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(false);
      });
    });

    it('should display custom error message for invalid URLs', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'not-a-url',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const urlError = result.error.issues.find(
          issue => issue.path.includes('website')
        );
        expect(urlError?.message).toBe('Invalid URL');
      }
    });
  });

  describe('portfolioUrl validation (optional field)', () => {
    it('should accept valid portfolio URLs', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        portfolioUrl: 'https://portfolio.example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.portfolioUrl).toBe('https://portfolio.example.com');
      }
    });

    it('should accept undefined portfolioUrl', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid portfolioUrl', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        portfolioUrl: 'not-a-valid-url',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('status multi-literal validation', () => {
    it('should accept valid status array', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid status values', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['invalid-status'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('code template literal validation', () => {
    it('should accept valid code format', () => {
      const validCodes = ['ABC-1234', 'XYZ-9999', 'AAA-0001'];

      validCodes.forEach(code => {
        const result = UserSchema.safeParse({
          email: 'user@example.com',
          website: 'https://example.com',
          status: ['active', 'inactive', 'banned'],
          code,
          imageUrl: 'https://example.com/image.jpg',
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid code formats', () => {
      const invalidCodes = [
        'ABC-12345', // too many digits
        'AB-1234',   // too few letters
        'ABCD-1234', // too many letters
        'ABC-0',     // number too small
        'ABC-10000', // number too large
        'abc-1234',  // lowercase letters
        '123-1234',  // numbers instead of letters
      ];

      invalidCodes.forEach(code => {
        const result = UserSchema.safeParse({
          email: 'user@example.com',
          website: 'https://example.com',
          status: ['active', 'inactive', 'banned'],
          code,
          imageUrl: 'https://example.com/image.jpg',
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('imageUrl validation', () => {
    it('should accept valid image URLs', () => {
      const validImageUrls = [
        'https://example.com/image.jpg',
        'https://cdn.example.com/assets/photo.png',
        'https://example.com/path/to/image.gif',
      ];

      validImageUrls.forEach(imageUrl => {
        const result = UserSchema.safeParse({
          email: 'user@example.com',
          website: 'https://example.com',
          status: ['active', 'inactive', 'banned'],
          code: 'ABC-1234',
          imageUrl,
          name: 'John Doe',
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid image URLs', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'not-a-url',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should require imageUrl field', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        name: 'John Doe',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
        // imageUrl omitted
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const imageUrlError = result.error.issues.find(
          issue => issue.path.includes('imageUrl')
        );
        expect(imageUrlError).toBeDefined();
      }
    });
  });

  describe('name validation with trim', () => {
    it('should accept valid names', () => {
      const validNames = [
        'John Doe',
        'Jane',
        'Dr. Smith-Johnson',
        'José García',
        'A'.repeat(100), // max length
      ];

      validNames.forEach(name => {
        const result = UserSchema.safeParse({
          email: 'user@example.com',
          website: 'https://example.com',
          status: ['active', 'inactive', 'banned'],
          code: 'ABC-1234',
          imageUrl: 'https://example.com/image.jpg',
          name,
          profile: {
            bio: 'Test bio',
            joined: new Date(),
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it('should trim whitespace from names', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: '  John Doe  ',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should reject names that are too short', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'A', // only 1 character
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject names that are too long', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'A'.repeat(101), // 101 characters
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty name after trimming', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: '   ', // only whitespace
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('profile strict object validation', () => {
    it('should accept valid profile with bio', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'This is my bio',
          joined: new Date('2024-01-01'),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid profile without bio', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          joined: new Date('2024-01-01'),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject profile with invalid date', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'This is my bio',
          joined: 'not-a-date',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject profile with extra properties (strict object)', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'This is my bio',
          joined: new Date('2024-01-01'),
          extraField: 'should be rejected',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should require joined date', () => {
      const result = UserSchema.safeParse({
        email: 'user@example.com',
        website: 'https://example.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          bio: 'This is my bio',
          // joined omitted
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('complete schema integration tests', () => {
    it('should accept a fully valid user object with all optional fields', () => {
      const validUser = {
        email: 'john.doe@example.com',
        website: 'https://johndoe.com',
        portfolioUrl: 'https://portfolio.johndoe.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/john.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Software developer and tech enthusiast',
          joined: new Date('2024-01-15'),
        },
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject(validUser);
      }
    });

    it('should accept a valid user object without optional fields', () => {
      const validUser = {
        email: 'jane@example.com',
        website: 'https://jane.com',
        status: ['active', 'inactive', 'banned'],
        code: 'XYZ-5678',
        imageUrl: 'https://example.com/jane.jpg',
        name: 'Jane Smith',
        profile: {
          joined: new Date('2024-02-20'),
        },
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject completely invalid data', () => {
      const invalidUser = {
        email: 'not-an-email',
        website: 'not-a-url',
        status: 'invalid',
        code: 'WRONG',
        imageUrl: 'bad-url',
        name: 'X',
        profile: {
          bio: 123,
          joined: 'not-a-date',
        },
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple errors
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });

    it('should handle missing required fields', () => {
      const result = UserSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should report all missing required fields
        const paths = result.error.issues.map(issue => issue.path.join('.'));
        expect(paths).toContain('email');
        expect(paths).toContain('website');
        expect(paths).toContain('status');
        expect(paths).toContain('code');
        expect(paths).toContain('imageUrl');
        expect(paths).toContain('name');
        expect(paths).toContain('profile');
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null values appropriately', () => {
      const result = UserSchema.safeParse({
        email: null,
        website: null,
        status: null,
        code: null,
        imageUrl: null,
        name: null,
        profile: null,
      });

      expect(result.success).toBe(false);
    });

    it('should handle undefined values appropriately', () => {
      const result = UserSchema.safeParse({
        email: undefined,
        website: undefined,
        status: undefined,
        code: undefined,
        imageUrl: undefined,
        name: undefined,
        profile: undefined,
      });

      expect(result.success).toBe(false);
    });

    it('should provide detailed error information', () => {
      const result = UserSchema.safeParse({
        email: 'invalid-email',
        website: 'invalid-url',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          expect(issue).toHaveProperty('code');
          expect(issue).toHaveProperty('message');
          expect(issue).toHaveProperty('path');
        });
      }
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript types', () => {
      type User = z.infer<typeof UserSchema>;
      
      // This is a compile-time test
      const user: User = {
        email: 'test@example.com',
        website: 'https://example.com',
        portfolioUrl: 'https://portfolio.com',
        status: ['active', 'inactive', 'banned'],
        code: 'ABC-1234',
        imageUrl: 'https://example.com/image.jpg',
        name: 'Test User',
        profile: {
          bio: 'Test bio',
          joined: new Date(),
        },
      };

      expect(user).toBeDefined();
    });
  });
});