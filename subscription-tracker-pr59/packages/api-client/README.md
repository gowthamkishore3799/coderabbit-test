# API Client

Type-safe API client for Subscription Tracker application.

## Usage

```typescript
import { login, register } from '@subscription-tracker/api-client';

// Login
const authResponse = await login({
  email: 'user@example.com',
  password: 'password123',
});

// Register
const registerResponse = await register({
  email: 'user@example.com',
  password: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
});
```
