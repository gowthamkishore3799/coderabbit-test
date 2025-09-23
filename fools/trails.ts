import * as z from "zod"; 
 
const Playersss = z.object({ 
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

