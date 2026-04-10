import * as z from "zod";

export const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});



export const statusMessage = "Variable defined";