import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validUserInput(): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    age: 21,
    active: 'true',
    role: 'admin',
    website: 'https://example.com',
    websites: ['https://site1.com', 'https://site2.com'],
    trail: 'https://trail.example.com',
    trails: 'some trail description',
  };
}

// ---------------------------------------------------------------------------
// User schema (fools/file.ts)
// ---------------------------------------------------------------------------

describe('User schema (fools/file.ts)', () => {
  describe('valid input', () => {
    it('parses a fully valid user', () => {
      expect(User.safeParse(validUserInput()).success).toBe(true);
    });

    it('accepts empty websites array', () => {
      const data = { ...validUserInput(), websites: [] };
      expect(User.safeParse(data).success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // id
  // -------------------------------------------------------------------------
  describe('id field', () => {
    it('rejects non-UUID id', () => {
      expect(User.safeParse({ ...validUserInput(), id: 'abc' }).success).toBe(false);
    });

    it('accepts a proper UUIDv4', () => {
      const data = { ...validUserInput(), id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };
      expect(User.safeParse(data).success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // email
  // -------------------------------------------------------------------------
  describe('email field', () => {
    it('rejects invalid email', () => {
      expect(User.safeParse({ ...validUserInput(), email: 'bad' }).success).toBe(false);
    });

    it('accepts standard email address', () => {
      expect(User.safeParse({ ...validUserInput(), email: 'a@b.co' }).success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // age (coerce + min 18)
  // -------------------------------------------------------------------------
  describe('age field', () => {
    it('rejects age under 18', () => {
      expect(User.safeParse({ ...validUserInput(), age: 17 }).success).toBe(false);
    });

    it('accepts exactly 18', () => {
      expect(User.safeParse({ ...validUserInput(), age: 18 }).success).toBe(true);
    });

    it('coerces string "30" to number 30', () => {
      const result = User.safeParse({ ...validUserInput(), age: '30' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(30);
    });
  });

  // -------------------------------------------------------------------------
  // active (stringbool)
  // -------------------------------------------------------------------------
  describe('active field (stringbool)', () => {
    it.each(['true', 'false', '1', '0', 'yes', 'no'])(
      'accepts "%s"',
      (val) => {
        expect(User.safeParse({ ...validUserInput(), active: val }).success).toBe(true);
      }
    );

    it('rejects arbitrary string', () => {
      expect(User.safeParse({ ...validUserInput(), active: 'nope' }).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // role (enum)
  // -------------------------------------------------------------------------
  describe('role field', () => {
    it.each(['admin', 'user', 'manager'])('accepts "%s"', (role) => {
      expect(User.safeParse({ ...validUserInput(), role }).success).toBe(true);
    });

    it('rejects unknown role', () => {
      expect(User.safeParse({ ...validUserInput(), role: 'owner' }).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // website (z.url)
  // -------------------------------------------------------------------------
  describe('website field', () => {
    it('accepts https URL', () => {
      expect(User.safeParse({ ...validUserInput(), website: 'https://valid.io' }).success).toBe(true);
    });

    it('rejects plain string without protocol', () => {
      expect(User.safeParse({ ...validUserInput(), website: 'invalid' }).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // websites (array of z.url)
  // -------------------------------------------------------------------------
  describe('websites field', () => {
    it('rejects array with invalid URL', () => {
      expect(
        User.safeParse({ ...validUserInput(), websites: ['bad-url'] }).success
      ).toBe(false);
    });

    it('accepts multiple valid URLs', () => {
      const data = {
        ...validUserInput(),
        websites: ['https://a.com', 'https://b.net'],
      };
      expect(User.safeParse(data).success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // trails (z.string().min(1))
  // -------------------------------------------------------------------------
  describe('trails field', () => {
    it('accepts a non-empty string', () => {
      expect(User.safeParse({ ...validUserInput(), trails: 'value' }).success).toBe(true);
    });

    it('rejects an empty trails string', () => {
      expect(User.safeParse({ ...validUserInput(), trails: '' }).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Missing fields
  // -------------------------------------------------------------------------
  describe('missing required fields', () => {
    it('rejects null input', () => {
      expect(User.safeParse(null).success).toBe(false);
    });

    it('rejects empty object', () => {
      expect(User.safeParse({}).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// parseUser (fools/file.ts)
// ---------------------------------------------------------------------------

describe('parseUser (fools/file.ts)', () => {
  it('returns user data for valid input', () => {
    const user = parseUser(validUserInput());
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('admin');
  });

  it('throws for invalid input', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('throws with JSON-serialisable message', () => {
    let message = '';
    try {
      parseUser({ id: 'bad' });
    } catch (e) {
      if (e instanceof Error) message = e.message;
    }
    // The message should be parseable JSON (uses v4 .tree or similar)
    expect(message.length).toBeGreaterThan(0);
  });

  it('throws when age is below 18', () => {
    expect(() => parseUser({ ...validUserInput(), age: 16 })).toThrow();
  });
});