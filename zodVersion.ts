
import {userJsonSchema} from "./zod.ts";

/**
 * A copy of {@link userJsonSchema} annotated with a human-readable `title` field.
 * Logged to the console at module load time for inspection.
 */
const annotatedUserJsonSchema = {
  ...userJsonSchema,
  title: "User Schema",


console.log(annotatedUserJsonSchema);

