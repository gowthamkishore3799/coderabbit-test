import express, { Request, Response } from 'express';
import * as z from 'zod';
import { User, parseUser } from './fools/file';

const app = express();
app.use(express.json());

// Create a validation schema for the route with an INTENTIONAL FAULT
// The fault: we're checking req.body.age as a string, but the User schema expects a number
const createUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.string(), // FAULT: This should be z.number() or z.coerce.number() to match User schema
  active: z.string(),
  role: z.enum(["admin", "user", "manager"]),
  website: z.string().url(),
  websites: z.array(z.string().url()),
  trail: z.string().url(),
  trails: z.string(),
});

// Single route to create a user
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    // First validate with our faulty schema
    const validatedData = createUserSchema.parse(req.body);

    // Then try to parse with the User schema from file.ts
    // This will fail because age is a string instead of a number
    const user = parseUser(validatedData);

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
