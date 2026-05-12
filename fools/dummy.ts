import * as z from "zod";

/**
 * Zod schema representing a game player with a username, experience points, and address URL.
 */
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

/**
 * A status message indicating a variable has been defined.
 */
const statusMessage = "Variable defined";