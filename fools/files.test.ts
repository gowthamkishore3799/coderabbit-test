import { describe, it, expect } from 'vitest'
import { UserSchema, parseUser, type User } from './files'
import { z } from 'zod'

describe('UserSchema', () => {
  describe('Valid User Objects', () => {
    it('should validate a complete valid user object', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        age: 25,
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        portfolioUrl: 'https://portfolio.example.com',
        status: 'active',
        code: 'user-1234',
        imageUrl: 'https://images.example.com/photo.jpg',
        name: 'John Doe',
        profile: {
          bio: 'Software developer',
          joined: new Date('2023-01-01'),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.age).toBe(25)
      }
    })

    it('should validate a user without optional portfolioUrl', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@test.com',
        age: 30,
        active: '1',
        role: 'admin',
        website: 'https://website.com',
        status: 'active',
        code: 'user-5678',
        imageUrl: 'https://img.com/avatar.png',
        name: 'Jane Smith',
        profile: {
          joined: new Date('2024-01-01'),
        },
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should coerce string age to number', () => {
      const userWithStringAge = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'coerce@test.com',
        age: '35', // String that should be coerced to number
        active: 'yes',
        role: 'manager',
        website: 'https://test.com',
        status: 'active',
        code: 'user-999',
        imageUrl: 'https://cdn.test.com/img.jpg',
        name: 'Bob',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(userWithStringAge)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.age).toBe(35)
        expect(typeof result.data.age).toBe('number')
      }
    })

    it('should trim whitespace from name field', () => {
      const userWithWhitespaceName = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'trim@test.com',
        age: 25,
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-100',
        imageUrl: 'https://img.example.com/pic.jpg',
        name: '  Trimmed Name  ',
        profile: {
          joined: new Date(),
        },
      }

      const result = UserSchema.safeParse(userWithWhitespaceName)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Trimmed Name')
      }
    })
  })

  describe('UUID Validation (id field)', () => {
    it('should accept valid UUID v4', () => {
      const user = createValidUser({ id: '123e4567-e89b-12d3-a456-426614174000' })
      expect(UserSchema.safeParse(user).success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const user = createValidUser({ id: 'not-a-valid-uuid' })
      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid ID')
      }
    })

    it('should reject empty UUID', () => {
      const user = createValidUser({ id: '' })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject UUID with invalid characters', () => {
      const user = createValidUser({ id: '550e8400-e29b-41d4-a716-44665544000g' })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })
  })

  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'simple@example.com',
        'user.name+tag@example.co.uk',
        'test_email@subdomain.example.com',
        'admin@localhost.localdomain',
      ]

      validEmails.forEach(email => {
        const user = createValidUser({ email })
        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user..name@example.com',
      ]

      invalidEmails.forEach(email => {
        const user = createValidUser({ email })
        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid email')
        }
      })
    })
  })

  describe('Age Validation', () => {
    it('should accept ages 18 and above', () => {
      const validAges = [18, 21, 30, 65, 100]
      
      validAges.forEach(age => {
        const user = createValidUser({ age })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject ages below 18', () => {
      const invalidAges = [0, 5, 10, 17]

      invalidAges.forEach(age => {
        const user = createValidUser({ age })
        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Must be 18+')
        }
      })
    })

    it('should reject non-integer ages', () => {
      const user = createValidUser({ age: 25.5 })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject negative ages', () => {
      const user = createValidUser({ age: -5 })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should coerce numeric strings to numbers', () => {
      const user = createValidUser({ age: '25' as any })
      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.age).toBe(25)
      }
    })
  })

  describe('Active Field (stringbool)', () => {
    it('should accept string boolean values', () => {
      const validValues = ['true', 'false', '1', '0', 'yes', 'no']

      validValues.forEach(active => {
        const user = createValidUser({ active })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject invalid stringbool values', () => {
      const invalidValues = ['maybe', 'true1', '2', 'TRUE', 'FALSE']

      invalidValues.forEach(active => {
        const user = createValidUser({ active })
        expect(UserSchema.safeParse(user).success).toBe(false)
      })
    })
  })

  describe('Role Enum Validation', () => {
    it('should accept valid role values', () => {
      const validRoles = ['admin', 'user', 'manager']

      validRoles.forEach(role => {
        const user = createValidUser({ role })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject invalid role values', () => {
      const invalidRoles = ['superadmin', 'guest', 'moderator', '']

      invalidRoles.forEach(role => {
        const user = createValidUser({ role })
        expect(UserSchema.safeParse(user).success).toBe(false)
      })
    })
  })

  describe('URL Validation (website, portfolioUrl, imageUrl)', () => {
    it('should accept valid URLs for website', () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.co.uk',
        'https://example.com/path/to/page',
        'https://example.com:8080/path?query=value',
      ]

      validUrls.forEach(website => {
        const user = createValidUser({ website })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject invalid URLs for website', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
      ]

      invalidUrls.forEach(website => {
        const user = createValidUser({ website })
        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid URL')
        }
      })
    })

    it('should accept valid portfolioUrl when provided', () => {
      const user = createValidUser({ portfolioUrl: 'https://portfolio.dev' })
      expect(UserSchema.safeParse(user).success).toBe(true)
    })

    it('should accept undefined portfolioUrl (optional field)', () => {
      const user = createValidUser({})
      delete (user as any).portfolioUrl
      expect(UserSchema.safeParse(user).success).toBe(true)
    })

    it('should reject invalid portfolioUrl when provided', () => {
      const user = createValidUser({ portfolioUrl: 'invalid-url' })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should accept valid imageUrl', () => {
      const user = createValidUser({ imageUrl: 'https://cdn.example.com/images/avatar.png' })
      expect(UserSchema.safeParse(user).success).toBe(true)
    })

    it('should reject invalid imageUrl', () => {
      const user = createValidUser({ imageUrl: 'not-an-image-url' })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })
  })

  describe('Status Literal Validation', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['active', 'inactive', 'banned']

      validStatuses.forEach(status => {
        const user = createValidUser({ status })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject invalid status values', () => {
      const invalidStatuses = ['pending', 'deleted', 'suspended', '']

      invalidStatuses.forEach(status => {
        const user = createValidUser({ status })
        expect(UserSchema.safeParse(user).success).toBe(false)
      })
    })
  })

  describe('Code Template Literal Validation', () => {
    it('should accept valid code formats', () => {
      const validCodes = ['user-1', 'user-100', 'user-9999', 'user-5432']

      validCodes.forEach(code => {
        const user = createValidUser({ code })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject codes without "user-" prefix', () => {
      const invalidCodes = ['admin-123', '1234', 'user123', 'USER-456']

      invalidCodes.forEach(code => {
        const user = createValidUser({ code })
        expect(UserSchema.safeParse(user).success).toBe(false)
      })
    })

    it('should reject codes with numbers outside valid range', () => {
      const invalidCodes = ['user-0', 'user-10000', 'user-99999']

      invalidCodes.forEach(code => {
        const user = createValidUser({ code })
        expect(UserSchema.safeParse(user).success).toBe(false)
      })
    })

    it('should reject codes with non-numeric suffix', () => {
      const invalidCodes = ['user-abc', 'user-12a', 'user-']

      invalidCodes.forEach(code => {
        const user = createValidUser({ code })
        expect(UserSchema.safeParse(user).success).toBe(false)
      })
    })
  })

  describe('Name Validation', () => {
    it('should accept valid names within length constraints', () => {
      const validNames = [
        'Jo',
        'John Doe',
        'A'.repeat(100),
        'Mary Jane Watson-Parker',
      ]

      validNames.forEach(name => {
        const user = createValidUser({ name })
        expect(UserSchema.safeParse(user).success).toBe(true)
      })
    })

    it('should reject names that are too short', () => {
      const user = createValidUser({ name: 'J' })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject names that are too long', () => {
      const user = createValidUser({ name: 'A'.repeat(101) })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should trim whitespace from names', () => {
      const user = createValidUser({ name: '  John  ' })
      const result = UserSchema.safeParse(user)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John')
      }
    })

    it('should reject empty string after trimming', () => {
      const user = createValidUser({ name: '   ' })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })
  })

  describe('Profile Validation (strictObject)', () => {
    it('should accept valid profile with all fields', () => {
      const user = createValidUser({
        profile: {
          bio: 'Software engineer passionate about TypeScript',
          joined: new Date('2023-06-15'),
        },
      })
      expect(UserSchema.safeParse(user).success).toBe(true)
    })

    it('should accept profile without optional bio', () => {
      const user = createValidUser({
        profile: {
          joined: new Date(),
        },
      })
      expect(UserSchema.safeParse(user).success).toBe(true)
    })

    it('should reject profile with extra properties (strictObject)', () => {
      const user = createValidUser({
        profile: {
          bio: 'Test bio',
          joined: new Date(),
          extraField: 'should not be allowed',
        } as any,
      })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject profile without required joined field', () => {
      const user = createValidUser({
        profile: {
          bio: 'Test bio',
        } as any,
      })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject profile with invalid date type', () => {
      const user = createValidUser({
        profile: {
          joined: 'not-a-date' as any,
        },
      })
      expect(UserSchema.safeParse(user).success).toBe(false)
    })
  })

  describe('Missing Required Fields', () => {
    it('should reject user missing id', () => {
      const user = createValidUser({})
      delete (user as any).id
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject user missing email', () => {
      const user = createValidUser({})
      delete (user as any).email
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject user missing required imageUrl', () => {
      const user = createValidUser({})
      delete (user as any).imageUrl
      expect(UserSchema.safeParse(user).success).toBe(false)
    })

    it('should reject user missing name', () => {
      const user = createValidUser({})
      delete (user as any).name
      expect(UserSchema.safeParse(user).success).toBe(false)
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer User type from schema', () => {
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'type@test.com',
        age: 25,
        active: 'true',
        role: 'user',
        website: 'https://example.com',
        status: 'active',
        code: 'user-123',
        imageUrl: 'https://img.com/pic.jpg',
        name: 'Type Test',
        profile: {
          joined: new Date(),
        },
      }

      expect(UserSchema.safeParse(user).success).toBe(true)
    })
  })
})

describe('parseUser function', () => {
  it('should successfully parse valid user input', () => {
    const validInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'parse@test.com',
      age: 28,
      active: 'true',
      role: 'admin',
      website: 'https://example.com',
      status: 'active',
      code: 'user-500',
      imageUrl: 'https://images.com/avatar.jpg',
      name: 'Parse Test',
      profile: {
        bio: 'Testing parseUser',
        joined: new Date('2024-01-01'),
      },
    }

    const result = parseUser(validInput)
    expect(result).toBeDefined()
    expect(result.email).toBe('parse@test.com')
    expect(result.age).toBe(28)
  })

  it('should throw error for invalid user input', () => {
    const invalidInput = {
      id: 'invalid-uuid',
      email: 'not-an-email',
      age: 15,
    }

    expect(() => parseUser(invalidInput)).toThrow()
  })

  it('should throw error with treeified error structure', () => {
    const invalidInput = {
      email: 'invalid-email',
      age: 10,
    }

    try {
      parseUser(invalidInput)
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      if (error instanceof Error) {
        expect(error.message).toBeTruthy()
        // Should be valid JSON
        expect(() => JSON.parse(error.message)).not.toThrow()
      }
    }
  })

  it('should handle unknown input types gracefully', () => {
    const invalidInputs = [
      null,
      undefined,
      'string',
      123,
      [],
      true,
    ]

    invalidInputs.forEach(input => {
      expect(() => parseUser(input)).toThrow()
    })
  })

  it('should parse user with coerced values correctly', () => {
    const input = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'coerce@test.com',
      age: '30', // String to be coerced
      active: 'yes',
      role: 'user',
      website: 'https://example.com',
      status: 'active',
      code: 'user-789',
      imageUrl: 'https://cdn.example.com/img.png',
      name: '  Coerced Name  ', // Should be trimmed
      profile: {
        joined: new Date(),
      },
    }

    const result = parseUser(input)
    expect(result.age).toBe(30)
    expect(typeof result.age).toBe('number')
    expect(result.name).toBe('Coerced Name')
  })

  it('should preserve all valid fields in parsed result', () => {
    const input = createValidUser({
      portfolioUrl: 'https://portfolio.example.com',
      profile: {
        bio: 'Full profile',
        joined: new Date('2023-01-01'),
      },
    })

    const result = parseUser(input)
    expect(result.portfolioUrl).toBe('https://portfolio.example.com')
    expect(result.profile.bio).toBe('Full profile')
  })
})

// Helper function to create valid user objects for testing
function createValidUser(overrides: Partial<any> = {}): any {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    website: 'https://example.com',
    portfolioUrl: 'https://portfolio.example.com',
    status: 'active',
    code: 'user-1234',
    imageUrl: 'https://images.example.com/photo.jpg',
    name: 'Test User',
    profile: {
      bio: 'Test bio',
      joined: new Date('2024-01-01'),
    },
    ...overrides,
  }
}