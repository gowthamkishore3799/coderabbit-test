# Test Documentation - Zod Schema Validation Tests

This directory contains comprehensive unit tests for the TypeScript/Zod modules in the `fools` directory.

## Test Files

### 1. `files.test.ts` - UserSchema Tests
Tests for the `UserSchema` Zod object and related functions in `files.ts`.

#### Test Coverage

##### UserSchema Validation Tests
- **Valid User Schema - Happy Path**
  - Complete valid user object validation
  - Optional field handling (portfolioUrl)
  - All status literal values
  - All role enum values

- **UUID Field Validation**
  - Valid UUID acceptance
  - Invalid UUID format rejection
  - Missing UUID rejection

- **Email Field Validation**
  - Valid email address patterns
  - Invalid email format rejection
  - Missing email rejection
  - Edge cases (special characters, domains, etc.)

- **Age Field Validation and Coercion**
  - Number coercion from strings
  - Minimum age validation (18 years)
  - Integer-only validation (no decimals)
  - Boundary conditions (age 18, very high ages)
  - Invalid age rejection

- **Active Field (stringbool) Validation**
  - String parsing ("true", "false", "1", "0", "yes", "no")
  - Invalid stringbool value rejection
  - Multiple string representations

- **URL Field Validation**
  - Valid HTTP/HTTPS URLs
  - URL validation for multiple fields (website, portfolioUrl, imageUrl)
  - Invalid URL format rejection
  - Required vs optional URL fields

- **Code Field (Template Literal) Validation**
  - Valid template format "user-{1-9999}"
  - Boundary values (user-1, user-9999)
  - Invalid format rejection
  - Out of range numbers

- **Name Field Validation**
  - String length constraints (min 2, max 100)
  - Whitespace trimming
  - Boundary conditions (2 and 100 characters)
  - Invalid length rejection

- **Profile Field (Strict Object) Validation**
  - Valid profile with all fields
  - Optional bio field
  - Required joined date
  - Invalid profile structure rejection
  - Extra properties rejection (strict mode)
  - Invalid date type rejection

- **Type Inference**
  - Correct TypeScript type inference
  - Type properties validation

- **Extra Properties Rejection**
  - Handling of unexpected fields

##### parseUser Function Tests

- **Valid Input**
  - Successful parsing of valid user data
  - Correct return type and structure

- **Invalid Input (throws with structured error)**
  - Invalid email error
  - Missing required field error
  - Invalid age error
  - Invalid UUID error
  - Invalid URL error
  - Wrong enum value error
  - Wrong literal value error
  - Invalid template literal format error
  - Invalid profile structure error
  - Structured error format validation

- **Edge Cases**
  - Null input handling
  - Undefined input handling
  - Empty object handling
  - Object with null values
  - String input handling
  - Number input handling
  - Array input handling

**Total Tests in files.test.ts: 80+**

### 2. `trails.test.ts` - Playersss Schema Tests
Tests for the `Playersss` Zod object schema in `trails.ts`.

#### Test Coverage

##### Playersss Schema Validation Tests

- **Valid Player Schema - Happy Path**
  - Complete valid player object
  - Player with numeric username
  - Player with special characters
  - Very long username handling
  - Minimum and maximum XP values

- **Username Field Validation**
  - Valid username patterns
  - Empty string username
  - Non-string type rejection
  - Missing username rejection
  - Unicode character support
  - Spaces in username

- **XP (Experience Points) Field Validation**
  - Valid XP number values
  - String to number coercion
  - Negative XP rejection
  - Decimal XP handling
  - Non-numeric XP rejection
  - Missing XP rejection
  - Boundary conditions (0, MAX_SAFE_INTEGER)
  - Infinity and NaN handling

- **Address (URL) Field Validation**
  - Valid HTTP/HTTPS URLs
  - URLs with authentication
  - Invalid URL format rejection
  - Non-string address rejection
  - Missing address rejection
  - Special characters in path
  - IPv6 URL support
  - Relative URL rejection

- **Complete Object Validation**
  - All required fields validation
  - Missing field rejection
  - Extra field handling
  - Empty object rejection
  - Type mismatch rejection (null, undefined, string, array, number, boolean)

- **Data Type Coercion**
  - Numeric string to number coercion
  - Non-numeric string rejection
  - Mixed type input handling

- **Schema Type Inference**
  - Correct type inference for parsed data
  - Type property validation

- **Validation Error Handling**
  - Meaningful error messages
  - Multiple field errors
  - Error path information

- **Edge Cases and Boundary Conditions**
  - Extremely long username
  - Whitespace-only username
  - Extremely long URL path
  - Frozen objects
  - Symbol keys in objects
  - Validation consistency
  - Circular references

**Total Tests in trails.test.ts: 100+**

## Running Tests

### Prerequisites
```bash
npm install --save-dev jest ts-jest @types/jest typescript
```

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- files.test.ts
npm test -- trails.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## Test Structure

Each test file follows this structure:

1. **Setup** - Import necessary modules and types
2. **Describe Blocks** - Organize tests by feature/component
3. **It Blocks** - Individual test cases
4. **Assertions** - Verify expected behavior using Jest matchers

### Example Test Pattern

```typescript
describe("Feature Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = { /* ... */ };
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## Test Categories

### 1. Happy Path Tests
Tests that verify the happy path - when input is valid and complete.

### 2. Edge Case Tests
Tests that verify behavior with boundary conditions and unusual inputs.

### 3. Error Case Tests
Tests that verify proper error handling and validation rejection.

### 4. Type Tests
Tests that verify TypeScript type inference and type safety.

### 5. Coercion Tests
Tests that verify Zod's type coercion behavior (e.g., "123" → 123).

## Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## Key Scenarios Covered

### UserSchema Specific
- ✅ UUID validation with error messages
- ✅ Email validation with format checking
- ✅ Age coercion and minimum validation
- ✅ Stringbool custom type parsing
- ✅ Enum validation for roles
- ✅ Literal array validation for status
- ✅ Template literal validation for codes
- ✅ String trimming and length constraints
- ✅ Strict object validation for profiles
- ✅ Date type validation
- ✅ Optional vs required field handling
- ✅ Structured error reporting

### Playersss Schema Specific
- ✅ String validation for usernames
- ✅ Number validation for XP
- ✅ URL validation for addresses
- ✅ Type coercion from strings
- ✅ Missing field detection
- ✅ Extra property handling
- ✅ Multiple validation error scenarios

## Notes

- Tests use `safeParse()` for non-throwing validation checks
- Tests use `parseUser()` for throwing validation with structured errors
- Tests verify both success and failure cases
- Tests include boundary value analysis
- Tests cover type coercion and transformation
- Tests validate error messages and structured error formats

## Maintenance

When updating schemas:
1. Add tests for new fields
2. Update boundary conditions if constraints change
3. Add type inference tests for new types
4. Ensure error messages are descriptive

## Common Issues and Solutions

### Test Fails on Type Coercion
Zod has specific coercion rules - verify your input types match what Zod expects.

### URL Validation Strict
Some URL formats (relative URLs, FTP) are rejected - this is expected behavior.

### Template Literal Edge Cases
The `z.templateLiteral()` validator is strict about format - test actual constraints.

### Stringbool Parsing
The stringbool custom validator only accepts specific string values - refer to implementation.
