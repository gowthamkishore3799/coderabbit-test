import { describe, it, expect } from 'vitest'
import { UserSchema, parseUser, type User } from './files'
import { z } from 'zod'

describe('UserSchema', () => {
  describe('Happy Path - Valid User Data', () => {
    it('should parse a complete valid user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        portfolioUrl: 'https://portfolio.example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          bio: 'Software developer',
          joined: new Date('2024-01-01'),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatchObject(validUser)
      }
    })

    it('should parse user with optional portfolioUrl omitted', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 18,
        active: 'yes',
        role: 'user',
        website: 'https://example.com',
        status: 'inactive',
        code: 'user-1',
        imageUrl: 'https://example.com/image.png',
        name: 'Jane',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should parse user with optional bio omitted', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@company.io',
        age: '30',
        active: '1',
        role: 'manager',
        website: 'https://company.io',
        portfolioUrl: 'https://portfolio.io',
        status: 'banned',
        code: 'user-9999',
        imageUrl: 'https://company.io/avatar.jpg',
        name: 'Admin User',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })
  })

  describe('UUID Validation', () => {
    it('should reject invalid UUID format', () => {
      const invalidUser = {
        id: 'not-a-uuid',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid')
      }
    })

    it('should reject empty UUID', () => {
      const invalidUser = {
        id: '',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Email Validation', () => {
    it('should reject invalid email format', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'not-an-email',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email')
      }
    })

    it('should reject email without domain', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should accept valid email with subdomains', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@mail.example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })
  })

  describe('Age Coercion and Validation', () => {
    it('should coerce string age to number', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: '25',
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.age).toBe('number')
        expect(result.data.age).toBe(25)
      }
    })

    it('should reject age under 18', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 17,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be 18+')
      }
    })

    it('should reject non-integer age', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25.5,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should accept age exactly 18', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 18,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject non-coercible age values', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 'not-a-number',
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('StringBool Validation', () => {
    it('should accept "true" string', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should accept "false" string', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'false',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should accept "1" and "0" strings', () => {
      const user1 = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: '1',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result1 = UserSchema.safeParse(user1)
      expect(result1.success).toBe(true)

      const user2 = { ...user1, active: '0' }
      const result2 = UserSchema.safeParse(user2)
      expect(result2.success).toBe(true)
    })

    it('should accept "yes" and "no" strings', () => {
      const user1 = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'yes',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result1 = UserSchema.safeParse(user1)
      expect(result1.success).toBe(true)

      const user2 = { ...user1, active: 'no' }
      const result2 = UserSchema.safeParse(user2)
      expect(result2.success).toBe(true)
    })

    it('should reject invalid stringbool values', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'maybe',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Role Enum Validation', () => {
    it('should accept all valid role values', () => {
      const roles = ['admin', 'user', 'manager']
      
      roles.forEach(role => {
        const user = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          age: 25,
          active: 'true',
          role,
          website: 'https://example.com',
          status: 'active',
          code: 'user-1234',
          imageUrl: 'https://example.com/image.png',
          name: 'John Doe',
          profile: {
            joined: new Date(),
          },
        }

        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid role value', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'superadmin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('URL Validation - website, portfolioUrl, imageUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://www.example.com',
        portfolioUrl: 'https://portfolio.dev',
        imageUrl: 'https://cdn.example.com/images/profile.jpg',
        status: 'active',
        code: 'user-1234',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should accept valid HTTP URLs', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'http://example.com',
        portfolioUrl: 'http://portfolio.dev',
        imageUrl: 'http://example.com/image.png',
        status: 'active',
        code: 'user-1234',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should reject invalid website URL', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'not-a-url',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid URL')
      }
    })

    it('should reject invalid imageUrl', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        imageUrl: 'invalid-url',
        status: 'active',
        code: 'user-1234',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should accept optional portfolioUrl as undefined', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        imageUrl: 'https://example.com/image.png',
        status: 'active',
        code: 'user-1234',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should reject invalid optional portfolioUrl when provided', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        portfolioUrl: 'not a url',
        imageUrl: 'https://example.com/image.png',
        status: 'active',
        code: 'user-1234',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Status Literal Validation', () => {
    it('should accept all valid status literals', () => {
      const statuses = ['active', 'inactive', 'banned']
      
      statuses.forEach(status => {
        const user = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          age: 25,
          active: 'true',
          role: 'admin',
          website: 'https://example.com',
          status,
          code: 'user-1234',
          imageUrl: 'https://example.com/image.png',
          name: 'John Doe',
          profile: {
            joined: new Date(),
          },
        }

        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status value', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'suspended',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Template Literal Code Validation', () => {
    it('should accept valid code format with minimum number', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should accept valid code format with maximum number', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-9999',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should reject code with number less than 1', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-0',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject code with number greater than 9999', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-10000',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject code without correct prefix', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'admin-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject code with non-numeric suffix', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-abc',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Name String Validation with Trim', () => {
    it('should accept valid name within length constraints', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should trim whitespace from name', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: '  John Doe  ',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John Doe')
      }
    })

    it('should accept minimum length name (2 chars)', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'Jo',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should accept maximum length name (100 chars)', () => {
      const longName = 'A'.repeat(100)
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: longName,
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should reject name shorter than 2 chars', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'J',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 chars', () => {
      const longName = 'A'.repeat(101)
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: longName,
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject empty name after trim', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: '   ',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Profile StrictObject Validation', () => {
    it('should accept profile with all fields', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          bio: 'Full-stack developer',
          joined: new Date('2024-01-01'),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should accept profile with only required field (joined)', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should reject profile with extra fields (strict object)', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          bio: 'Developer',
          joined: new Date(),
          extraField: 'not allowed',
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject profile without joined date', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          bio: 'Developer',
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject invalid date format for joined', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: 'not-a-date',
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Missing Required Fields', () => {
    it('should reject user missing id', () => {
      const invalidUser = {
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject user missing email', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject user missing imageUrl', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        name: 'John Doe',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject user missing name', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer User type from schema', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'admin',
        website: 'https://example.com',
        portfolioUrl: 'https://portfolio.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://example.com/image.png',
        name: 'John Doe',
        profile: {
          bio: 'Developer',
          joined: new Date(),
        },
      }

      // This test primarily validates TypeScript compilation
      expect(user).toBeDefined()
    })
  })
})

describe('parseUser function', () => {
  it('should successfully parse valid user data', () => {
    const validUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      age: 25,
      active: 'true',
      role: 'admin',
      website: 'https://example.com',
      status: 'active',
      code: 'user-1234',
      imageUrl: 'https://example.com/image.png',
      name: 'John Doe',
      profile: {
        joined: new Date(),
      },
    }

    const result = parseUser(validUser)
    expect(result).toEqual(validUser)
  })

  it('should throw error with structured error message for invalid data', () => {
    const invalidUser = {
      id: 'invalid-uuid',
      email: 'invalid-email',
      age: 15,
      active: 'maybe',
      role: 'invalid-role',
      website: 'not-a-url',
      status: 'unknown',
      code: 'wrong-format',
      imageUrl: 'invalid',
      name: 'J',
      profile: {
        joined: 'not-a-date',
      },
    }

    expect(() => parseUser(invalidUser)).toThrow()
  })

  it('should throw error for null input', () => {
    expect(() => parseUser(null)).toThrow()
  })

  it('should throw error for undefined input', () => {
    expect(() => parseUser(undefined)).toThrow()
  })

  it('should throw error with treeified error structure', () => {
    const invalidUser = {
      id: 'invalid',
      email: 'test@example.com',
      age: 25,
      active: 'true',
      role: 'admin',
      website: 'https://example.com',
      status: 'active',
      code: 'user-1234',
      imageUrl: 'https://example.com/image.png',
      name: 'John Doe',
      profile: {
        joined: new Date(),
      },
    }

    try {
      parseUser(invalidUser)
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      if (error instanceof Error) {
        expect(error.message).toBeDefined()
        // Error message should be parseable JSON
        expect(() => JSON.parse(error.message)).not.toThrow()
      }
    }
  })

  it('should handle edge case with all optional fields missing', () => {
    const minimalUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      age: 25,
      active: 'true',
      role: 'admin',
      website: 'https://example.com',
      status: 'active',
      code: 'user-1234',
      imageUrl: 'https://example.com/image.png',
      name: 'John Doe',
      profile: {
        joined: new Date(),
      },
    }

    const result = parseUser(minimalUser)
    expect(result).toBeDefined()
    expect(result.portfolioUrl).toBeUndefined()
    expect(result.profile.bio).toBeUndefined()
  })
})