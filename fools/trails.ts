import * as z from "zod"; 
 
export const Playersss = z.object({ 
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

