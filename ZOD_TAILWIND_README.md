# Zod v4 and Tailwind v4 Features

This branch demonstrates the latest features from Zod v4 and Tailwind CSS v4.

## Branch Information

- **Branch**: `feature/zod4-tailwind4`
- **Created from**: `main`

## Zod v4 Features

/Code usageee
### New Files
- `zodv4-features.ts` - Comprehensive Zod v4 feature showcase
- `zodv4-examples.ts` - Practical examples and usage patterns

### Key Zod v4 Features Implemented

#### 1. Direct Type Validators
Zod v4 introduces cleaner syntax for common validations:

```typescript
// Instead of z.string().email()
z.email({ message: "Invalid email" })

//Code impleemntation

//Needed more
// Instead of z.string().uuid()
z.uuid({ message: "Invalid UUID" })

// Instead of z.string().url()
z.url({ message: "Invalid URL" })

// Direct number validation
z.number().min(0).max(100)
```

#### 2. String Boolean (z.stringbool())
Parse boolean-like strings:
```typescript
z.stringbool() // Accepts: "true", "false", "1", "0", "yes", "no"
```

#### 3. Branded Types
Type-safe identifiers:
```typescript
const UserId = z.uuid().brand("UserId");
const Email = z.email().brand("Email");
```

#### 4. JSON Schema Generation
```typescript
const schema = z.object({ /* ... */ });
const jsonSchema = z.toJSONSchema(schema);
```

#### 5. Advanced Schemas
- Discriminated unions
- Pipe transformations
- Refined validations
- Partial and Pick utilities

### Usage Examples

```typescript
import { AdvancedUser, validateEmail, validateUuid } from './zodv4-features';

// Validate user data
const user = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  website: "https://example.com",
  age: 25,
  // ...
};

const result = AdvancedUser.safeParse(user);
if (result.success) {
  console.log("Valid user:", result.data);
}

// Quick validation utilities
console.log(validateEmail("test@example.com")); // true
console.log(validateUuid("550e8400-e29b-41d4-a716-446655440000")); // true
```

## Tailwind CSS v4 Features

### New Files
- `tailwind.config.ts` - Tailwind v4 configuration
- `postcss.config.js` - PostCSS setup for Tailwind v4
- `styles.css` - Custom styles and utilities
- `tailwind-demo.html` - Interactive demo page

### Key Tailwind v4 Features Implemented

#### 1. Enhanced Configuration
```typescript
// tailwind.config.ts with TypeScript support
import type { Config } from 'tailwindcss';
```

#### 2. Advanced Color System
```css
colors: {
  primary: { 50: '#f0f9ff', /* ... */ 950: '#082f49' },
  accent: { DEFAULT: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
}
```

#### 3. Custom Animations
```css
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
  'bounce-slow': 'bounce 2s infinite',
}
```

#### 4. Container Queries Support
```css
containerQueries: {
  xs: '20rem', sm: '24rem', /* ... */
}
```

#### 5. Custom Components & Utilities
```css
/* Pre-built component classes */
.btn-primary
.card-hover
.input
.badge-success

/* Custom utilities */
.text-balance
.scrollbar-hide
.gradient-primary
```

#### 6. Performance Optimizations
```typescript
future: {
  hoverOnlyWhenSupported: true,
},
experimental: {
  optimizeUniversalDefaults: true,
}
```

### Usage Examples

```html
<!-- Button variants -->
<button class="btn-primary">Primary Button</button>
<button class="btn-secondary">Secondary Button</button>

<!-- Hover-enabled cards -->
<div class="card-hover">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>

<!-- Form inputs -->
<input type="email" class="input" placeholder="Enter email">

<!-- Gradient backgrounds -->
<div class="gradient-primary text-white p-8">
  Beautiful gradient background
</div>

<!-- Custom animations -->
<div class="animate-fade-in">Fade in content</div>
<div class="animate-slide-up">Slide up content</div>
```

## Installation

```bash
# Install dependencies
npm install

# The following packages are included:
# - zod@^4.1.5
# - tailwindcss@^4.0.0
# - @tailwindcss/postcss@^4.0.0
# - postcss@^8.4.47
```

## Project Structure

```
.
├── zodv4-features.ts       # Zod v4 advanced features
├── zodv4-examples.ts       # Zod v4 practical examples
├── tailwind.config.ts      # Tailwind v4 configuration
├── postcss.config.js       # PostCSS configuration
├── styles.css              # Custom Tailwind styles
├── tailwind-demo.html      # Interactive demo
└── package.json            # Updated dependencies
```

## Demo

To view the Tailwind v4 demo:
1. Build the CSS: `npx tailwindcss -i ./styles.css -o ./dist/output.css`
2. Open `tailwind-demo.html` in your browser

## Features Comparison

### Zod v3 → v4
| Feature | v3 | v4 |
|---------|----|----|
| Email | `z.string().email()` | `z.email()` |
| UUID | `z.string().uuid()` | `z.uuid()` |
| URL | `z.string().url()` | `z.url()` |
| Number | `z.coerce.number()` | `z.number()` |
| Boolean strings | Manual parsing | `z.stringbool()` |
| JSON Schema | External library | Built-in `z.toJSONSchema()` |

### Tailwind CSS v3 → v4
| Feature | v3 | v4 |
|---------|----|----|
| PostCSS Plugin | `tailwindcss` | `@tailwindcss/postcss` |
| Config | JS only | TypeScript support |
| Container Queries | Plugin required | Built-in support |
| Animations | Manual keyframes | Enhanced presets |
| Performance | Good | Optimized with experimental features |

## Next Steps

- Explore the example files to see Zod v4 in action
- Open `tailwind-demo.html` to see Tailwind v4 components
- Run the TypeScript files to test validations
- Customize the Tailwind config for your needs

## Resources

- [Zod Documentation](https://zod.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
