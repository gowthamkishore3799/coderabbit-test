import {userJsonSchema} from "./zod.ts";

console.log(userJsonSchema);

// You can annotate the JSON Schema object if you want:
(userJsonSchema as any).title = "User Schema";
