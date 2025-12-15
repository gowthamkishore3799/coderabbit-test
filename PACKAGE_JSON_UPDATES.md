# Package.json Updates Required for Tests

The test suite requires adding test dependencies and updating scripts. Here are the recommended changes:

## Changes to Make

### 1. Update Scripts Section
Replace the current scripts section with:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:verbose": "jest --verbose",
  "test:files": "jest files.test.ts",
  "test:trails": "jest trails.test.ts"
}
```

### 2. Add devDependencies
Add these to the devDependencies section:

```json
"devDependencies": {
  "@types/jest": "^29.5.0",
  "jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "typescript": "^5.0.0"
}
```

## Full Updated package.json

```json
{
  "name": "coderabbit-test",
  "version": "1.0.0",
  "description": "Hi asd",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose",
    "test:files": "jest files.test.ts",
    "test:trails": "jest trails.test.ts"
  },
  "repository": {
    "type": "git",
    "url": "git+https://gowthamkishore3799@github.com/gowthamkishore3799/coderabbit-test.git"
  },
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/gowthamkishore3799/coderabbit-test/issues"
  },
  "homepage": "https://github.com/gowthamkishore3799/coderabbit-test#readme",
  "dependencies": {
    "zod": "^4.1.5",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "postcss": "^8.4.47",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
```

## Installation Instructions

After updating package.json, run:

```bash
npm install
```

## Running Tests

Once installed, you can run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run only files.test.ts
npm run test:files

# Run only trails.test.ts
npm run test:trails
```

## Coverage Reports

After running `npm run test:coverage`, you'll find coverage reports in:
- Terminal output
- `coverage/` directory (HTML report)

Open `coverage/index.html` in a browser to view the coverage report.
