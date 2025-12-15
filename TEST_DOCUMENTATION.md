# Unit Test Documentation

## Overview
This document describes the comprehensive unit tests generated for the modified TypeScript files in this branch.

## Files Modified in Branch
Based on the git diff against `main`, the following files were modified:
- `fools/files.ts` - Added `portfolioUrl`, `imageUrl`, and `name` fields to UserSchema
- `fools/trails.ts` - Simplified to contain only the Playersss schema

## Test Files Created

### 1. `fools/files.test.ts` (636 lines)
Comprehensive tests for the UserSchema and parseUser function from `files.ts`.

#### Test Coverage:

**UserSchema Validation Tests:**
- ✅ Valid user objects with all fields
- ✅ Valid user objects with optional fields omitted
- ✅ Type coercion (age from string to number)
- ✅ String trimming (name field with whitespace)

**UUID Validation (id field):**
- ✅ Valid UUID v4 formats
- ❌ Invalid UUID formats
- ❌ Empty UUIDs
- ❌ UUIDs with invalid characters

**Email Validation:**
- ✅ Various valid email formats (with subdomain, tags, etc.)
- ❌ Invalid email formats (missing @, domain, etc.)

**Age Validation:**
- ✅ Ages 18 and above (boundary: 18, 21, 30, 65, 100)
- ❌ Ages below 18 (0, 5, 10, 17)
- ❌ Non-integer ages
- ❌ Negative ages
- ✅ String to number coercion

**Active Field (stringbool):**
- ✅ Valid stringbool values: 'true', 'false', '1', '0', 'yes', 'no'
- ❌ Invalid values: 'maybe', 'true1', '2', etc.

**Role Enum:**
- ✅ Valid roles: 'admin', 'user', 'manager'
- ❌ Invalid roles: 'superadmin', 'guest', 'moderator'

**URL Validation (website, portfolioUrl, imageUrl):**
- ✅ Valid HTTP/HTTPS URLs with paths, ports, query params
- ❌ Invalid URLs (no protocol, malformed, non-HTTP protocols)
- ✅ Optional portfolioUrl can be undefined
- ❌ Invalid portfolioUrl when provided

**Status Literal:**
- ✅ Valid statuses: 'active', 'inactive', 'banned'
- ❌ Invalid statuses: 'pending', 'deleted', 'suspended'

**Code Template Literal:**
- ✅ Valid formats: 'user-1' through 'user-9999'
- ❌ Missing 'user-' prefix
- ❌ Numbers outside range (0, 10000+)
- ❌ Non-numeric suffixes

**Name Validation:**
- ✅ Names 2-100 characters long
- ❌ Names too short (< 2 chars)
- ❌ Names too long (> 100 chars)
- ✅ Whitespace trimming
- ❌ Empty string after trimming

**Profile Validation (strictObject):**
- ✅ Valid profile with bio and joined date
- ✅ Profile without optional bio
- ❌ Extra properties (strict validation)
- ❌ Missing required joined field
- ❌ Invalid date types

**parseUser Function Tests:**
- ✅ Successfully parses valid input
- ❌ Throws error for invalid input
- ✅ Returns treeified error structure (Zod v4 feature)
- ✅ Handles unknown input types
- ✅ Coerces and trims values correctly
- ✅ Preserves all valid fields

### 2. `fools/trails.test.ts` (601 lines)
Comprehensive tests for the Playersss schema from `trails.ts`.

#### Test Coverage:

**Valid Player Objects:**
- ✅ Complete valid player with all fields
- ✅ Player with zero XP
- ✅ Player with negative XP
- ✅ Player with very large XP (9,999,999)
- ✅ Player with decimal XP

**Username Validation:**
- ✅ Various formats (alphanumeric, underscores, hyphens, dots)
- ✅ Empty string username
- ✅ Special characters (!@#$%^&*())
- ✅ Unicode characters (用户名)
- ✅ Emojis (🎮player🎯)
- ❌ Non-string types (number, null, undefined, array, object)

**XP (Experience Points) Validation:**
- ✅ Integer values (0, 1, 100, 1000, etc.)
- ✅ Floating point values (0.5, 1.25, 99.99)
- ✅ Negative values (-1, -100, -1000.5)
- ❌ Non-numeric types (string, null, undefined, array, object, boolean)
- ❌ NaN values
- ❌ Infinity/-Infinity

**Address (URL) Validation:**
- ✅ Valid HTTP URLs (with subdomains, ports, paths)
- ✅ Valid HTTPS URLs (with query params, fragments)
- ✅ URLs with special characters in path
- ❌ Invalid formats (no protocol, ftp://, file://, mailto:, javascript:)
- ❌ Malformed URLs (http://, http://., etc.)
- ❌ Non-string values

**Missing Required Fields:**
- ❌ Missing username
- ❌ Missing xp
- ❌ Missing address
- ❌ Empty object

**Extra Fields Handling:**
- ✅ Strips extra fields by default (tests Zod's default behavior)

**Edge Cases:**
- ✅ All boundary values (empty string, 0 xp, minimal URL)
- ✅ Maximum practical values (long username, MAX_SAFE_INTEGER xp)
- ✅ Very long URLs

**Schema Composition:**
- ✅ Type inference with z.infer
- ✅ Schema extension with .extend()
- ✅ Partial schema with .partial()
- ✅ Field picking with .pick()

**Error Messages:**
- ✅ Clear error for invalid username type
- ✅ Clear error for invalid xp type
- ✅ Clear error for invalid address
- ✅ Multiple errors accumulated

## Test Configuration

### `vitest.config.ts`
- **Test runner**: Vitest v1.0.4
- **Environment**: Node.js
- **Globals**: Enabled (describe, it, expect available globally)
- **Coverage provider**: v8
- **Coverage reporters**: text, json, html

### `tsconfig.json`
- **Target**: ES2020
- **Module**: ESNext
- **Strict mode**: Enabled
- **Types**: vitest/globals, node

### `package.json` - New Scripts
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Statistics

| File | Test Suites | Total Tests | Lines of Code |
|------|------------|-------------|---------------|
| `fools/files.test.ts` | 14 | 80+ | 636 |
| `fools/trails.test.ts` | 13 | 70+ | 601 |
| **Total** | **27** | **150+** | **1,237** |

## Testing Approach

### 1. **Happy Path Testing**
Every valid input scenario is tested to ensure the schemas accept correct data.

### 2. **Edge Case Testing**
Boundary conditions are thoroughly tested:
- Minimum/maximum values
- Empty strings
- Zero values
- Very large numbers
- Special characters

### 3. **Failure Condition Testing**
Invalid inputs are tested to ensure proper validation:
- Wrong types
- Out-of-range values
- Malformed data
- Missing required fields

### 4. **Zod v4 Features**
Tests specifically validate Zod v4 capabilities:
- Direct validators (z.uuid(), z.email(), z.url())
- String coercion (z.coerce.number())
- String trimming (.trim())
- Template literals
- Strict objects (strictObject)
- Multi-literal values
- Error treeification

### 5. **Type Safety**
Tests verify TypeScript type inference and type safety throughout.

## Key Testing Principles Applied

1. **Comprehensive Coverage**: Every field and validation rule is tested
2. **Clear Test Names**: Each test clearly describes what it validates
3. **Isolated Tests**: Each test is independent and can run in any order
4. **Helper Functions**: Reusable `createValidUser()` helper for test data
5. **Edge Cases**: Boundary conditions and special cases are covered
6. **Error Validation**: Not just checking if validation fails, but also verifying error messages
7. **Type Inference**: Tests demonstrate proper TypeScript integration

## Changes Made to Modified Files

### `fools/files.ts`
**Added fields:**
- `portfolioUrl: z.url().optional()` - Optional portfolio URL
- `imageUrl: z.url()` - Required image URL
- `name: z.string().min(2).max(100).trim()` - Name with length constraints and trimming

**Tests created:** 80+ tests covering all validation scenarios for these new fields plus comprehensive tests for existing fields.

### `fools/trails.ts`
**Simplified schema:**
- Removed extensive Zod v4 feature demonstrations
- Kept only the Playersss schema with username, xp, and address fields

**Tests created:** 70+ tests covering all aspects of the simplified schema, including extensive edge case testing.

## Dependencies Added

```json
{
  "devDependencies": {
    "vitest": "^1.0.4",
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6"
  }
}
```

## Next Steps

1. **Run `npm install`** to install the testing dependencies
2. **Run `npm test`** to execute all tests
3. **Review coverage report** with `npm run test:coverage`
4. **Maintain tests** as schemas evolve

## Notes

- All tests follow Vitest best practices
- Tests are written with a bias for action and comprehensive coverage
- Every public interface is validated
- Tests serve as living documentation for the schemas
- Error cases are thoroughly tested to ensure robust validation