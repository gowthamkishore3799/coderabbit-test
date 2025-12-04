import z, { ZodError } from "zod" // v4

const player = z.object({
    name: z.string(),
    age: z.number(),
    address: z.url(),
    file: z.file(),
})
console.log("DATA", player)
// ✅ Example data
const goodData = {
  name: "Messi",
  age: 36,
  address: 36,
}


console.log(player.parse(goodData))