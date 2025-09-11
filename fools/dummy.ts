import * as z from "zod"; 
 
const Player = z.object({ 
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});



const var = "Variable DEfined";