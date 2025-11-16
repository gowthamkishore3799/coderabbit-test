import * as z from "zod";

const Playersss = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// Some correct TypeScript code
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}

const exampleUser: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};

const greeting = greetUser(exampleUser);
console.log(greeting);

// Type-safe array operations
const numbers: number[] = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// Invalid code below for testing
const broken = {
  missing: "semicolon"
  another: "property",
}

function invalidFunc(
  console.log("syntax error here"
  return undefinedVariable + anotherUndefined;
}

const badType: string = 12345;
const missingParen = (x: number => x * 2;

class BrokenClass {
  constructor(public name string) {
    this.nonExistent = "value";
  }

  invalidMethod( {
    return this is broken;
  }
