
import {userJsonSchema} from "./zod.ts";

const annotatedUserJsonSchema = {
  ...userJsonSchema,
  title: "User Schema",
};

console.log(annotatedUserJsonSchema);

