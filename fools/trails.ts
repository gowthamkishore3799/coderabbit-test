import * as z from "zod";

// ============================================
// Zod v4 Features Demo
// ============================================

// 1. Standalone String Format Schemas (NEW in v4)
const emailSchema = z.email();
const uuidSchema = z.uuid(); // Strict RFC validation
const guidSchema = z.guid(); // Permissive UUID-like validation
const emojiSchema = z.emoji();
const base64Schema = z.base64();
const base64UrlSchema = z.base64url();
const nanoidSchema = z.nanoid();
const cuidSchema = z.cuid();
const cuid2Schema = z.cuid2();
const ulidSchema = z.ulid();
const ipv4Schema = z.ipv4();
const ipv6Schema = z.ipv6();
const cidrv4Schema = z.cidrv4();
const cidrv6Schema = z.cidrv6();

// ISO Format Validators
const isoDateSchema = z.iso.date();
const isoTimeSchema = z.iso.time();
const isoDatetimeSchema = z.iso.datetime();
const isoDurationSchema = z.iso.duration();

// 2. Unified Error Customization
const usernameSchema = z.string().min(5, {
  error: (issue) => {
    if (issue.code === 'too_small') {
      return 'Username must be at least ' + issue.minimum + ' characters';
    }
  },
});

// 3. Improved Number Schema
const safeIntSchema = z.number().int(); // Only safe integers
const finiteNumberSchema = z.number(); // No infinite values allowed

// 4. Default Value Logic with .default()
const PlayerWithDefaults = z.object({
  username: z.string(),
  xp: z.number().default(0), // Returns 0 if undefined
  level: z.string().transform(v => v.length).default(1),
  isActive: z.boolean().default(true).optional(), // Default applied even in optional
});

// 5. Prefault for pre-parse defaults (old Zod 3 behavior)
const PlayerWithPrefault = z.object({
  username: z.string(),
  score: z.string().transform(v => parseInt(v)).prefault("0"),
});

// 6. StrictObject and LooseObject
const strictPlayerSchema = z.strictObject({
  username: z.string(),
  xp: z.number(),
}); // Rejects unknown keys

const loosePlayerSchema = z.looseObject({
  username: z.string(),
  xp: z.number(),
}); // Allows unknown keys

// 7. Enhanced Object Schema with Common Methods
const BasePlayer = z.object({
  username: z.string(),
  xp: z.number(),
  email: z.email(),
  createdAt: z.date(),
});

const PartialPlayer = BasePlayer.partial(); // All properties optional
const RequiredPlayer = PartialPlayer.required(); // All properties required
const PlayerNameOnly = BasePlayer.pick({ username: true }); // Only username
const PlayerWithoutEmail = BasePlayer.omit({ email: true }); // Exclude email

const ExtendedPlayer = BasePlayer.extend({
  level: z.number(),
  achievements: z.array(z.string()),
});

// 8. Enum with TypeScript Enums
enum GameMode {
  Solo = 'solo',
  Team = 'team',
  Ranked = 'ranked',
}

const gameModeSchema = z.enum(GameMode);

// 9. Record Schema with Required Keys
const playerStatsRecord = z.record(
  z.enum(['kills', 'deaths', 'assists']),
  z.number()
);

// Partial Record for optional keys
const optionalStatsRecord = z.partialRecord(
  z.enum(['headshots', 'criticals', 'accuracy']),
  z.number()
);

// 10. Function Schema (redesigned in v4)
const greetPlayer = z.function({
  input: [z.object({ name: z.string(), age: z.number().int() })],
  output: z.string(),
});

const greetPlayerImpl = greetPlayer.implement((input) =>
  `Hello ${input.name}, age ${input.age}`
);

const greetPlayerAsync = greetPlayer.implementAsync(async (input) =>
  `Hello ${input.name}, age ${input.age}`
);

// 11. Union and Discriminated Union
const stringOrNumber = z.union([z.string(), z.number()]);

const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
  z.object({ type: z.literal('keypress'), key: z.string() }),
  z.object({ type: z.literal('scroll'), delta: z.number() }),
]);

// 12. Array Schema with Constraints
const playerInventory = z.array(z.string()).min(1).max(50);
const nonEmptyTags = z.array(z.string()).nonempty();

// 13. Tuple Schema
const playerPosition = z.tuple([z.number(), z.number(), z.number()]); // [x, y, z]

// 14. Set and Map Collections
const uniquePlayerIds = z.set(z.string());
const playerScores = z.map(z.string(), z.number());

// 15. Transform Pipeline
const stringToNumberTransform = z.transform(input => String(input));

// 16. Template Literal (NEW in v4)
const playerIdTemplate = z.templateLiteral();

// 17. Nullable and Optional
const nullableEmail = z.email().nullable();
const optionalUsername = z.string().optional();

// Original Schema (updated to use z.email())
const Playersss = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.email(), // Using new standalone email schema
});

// 18. Complete Player Schema with v4 Features
const CompletePlayerSchema = z.object({
  id: z.uuid(),
  username: z.string().min(3, {
    error: (issue) => {
      if (issue.code === 'too_small') {
        return `Username too short! Minimum is ${issue.minimum} characters`;
      }
    },
  }),
  email: z.email(),
  xp: z.number().int().default(0),
  level: z.number().int().min(1).max(100).default(1),
  gameMode: z.enum(GameMode),
  stats: z.record(z.enum(['kills', 'deaths', 'assists']), z.number()),
  inventory: z.array(z.string()).max(50).default([]),
  position: z.tuple([z.number(), z.number(), z.number()]),
  isOnline: z.boolean().default(false),
  lastSeen: z.iso.datetime().nullable(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// Export types
export type Player = z.infer<typeof Playersss>;
export type CompletePlayer = z.infer<typeof CompletePlayerSchema>;
export type GameModeType = z.infer<typeof gameModeSchema>;
export type EventType = z.infer<typeof eventSchema>;

