# Test Suite Documentation

This repository now includes comprehensive unit tests for the Zod schemas using **Vitest**.

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Files

### `fools/files.test.ts`
Comprehensive tests for the `UserSchema` in `fools/files.ts`. Covers:

- **Email validation**: Valid/invalid formats
- **URL validation**: Multiple URL fields (website, portfolioUrl, imageUrl)
- **Status validation**: Multi-literal array handling
- **Code validation**: Template literal format (ABC-1234)
- **Name validation**: String length, trimming, edge cases
- **Profile validation**: Strict object, optional bio, required joined date
- **Integration tests**: Complete valid/invalid objects
- **Edge cases**: Null, undefined, type mismatches
- **Error messages**: Detailed error reporting

**Total test cases**: 50+ tests covering happy paths, edge cases, and error conditions

### `fools/trails.test.ts`
Comprehensive tests for the `Playersss` schema in `fools/trails.ts`. Covers:

- **Username validation**: String types, empty strings, special characters
- **XP validation**: Numbers (positive, negative, zero, decimals, boundaries)
- **Address validation**: URL format, various protocols, international domains
- **Integration tests**: Valid/invalid complete objects
- **Edge cases**: Very large values, special characters, NaN, Infinity
- **Error handling**: Parse vs safeParse, error messages
- **Real-world scenarios**: New players, veterans, malicious data

**Total test cases**: 45+ tests covering all scenarios

## Test Coverage

The test suite aims for comprehensive coverage including:
- ✅ Happy path validation
- ✅ Edge cases and boundary values
- ✅ Invalid input rejection
- ✅ Required field validation
- ✅ Optional field handling
- ✅ Type checking
- ✅ Error message validation
- ✅ Integration scenarios
- ✅ Real-world use cases

## Testing Strategy

### 1. Schema Validation Tests
Each field is tested individually for:
- Valid inputs (multiple variations)
- Invalid inputs (multiple types of failures)
- Required vs optional handling
- Default values and transformations

### 2. Integration Tests
Complete objects are tested to ensure:
- All fields work together correctly
- Multiple errors are reported
- Missing fields are caught
- Extra fields are handled appropriately

### 3. Edge Case Testing
Boundary conditions and edge cases:
- Empty strings
- Very long strings
- Very large/small numbers
- Special characters
- Null and undefined
- NaN and Infinity
- Type mismatches

### 4. Error Reporting Tests
Validation that errors are:
- Clear and descriptive
- Properly attributed to fields
- Complete (all issues reported)
- Structured for debugging

## Best Practices Followed

1. **Descriptive test names**: Each test clearly states what it validates
2. **Arrange-Act-Assert pattern**: Clear test structure
3. **Multiple assertions**: Comprehensive validation per test
4. **Edge case coverage**: Boundary values and unusual inputs
5. **Error validation**: Not just success, but proper failure modes
6. **Type safety**: TypeScript integration tested
7. **Real-world scenarios**: Practical use case validation

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
```bash
npm test -- --reporter=junit --outputFile=test-results.xml
```

## Adding More Tests

When adding new schema fields:
1. Add validation tests for the field
2. Add integration tests with other fields
3. Add edge case tests
4. Update this documentation

## Dependencies

- **Vitest**: Fast, modern test framework with excellent TypeScript support
- **@vitest/coverage-v8**: Code coverage reporting
- **Zod**: Runtime type validation and schema definition

## Notes

- Tests use `safeParse()` for controlled error handling
- All schemas are validated for both success and failure cases
- Error messages are tested to ensure good developer experience
- TypeScript type inference is validated for compile-time safety