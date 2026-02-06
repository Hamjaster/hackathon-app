/**
 * Inngest HTTP Handler
 * Serves the Inngest API endpoint for function execution
 */

import { serve } from "inngest/express";
import { inngest } from "./client";
import * as functions from "./functions";

// Create the Inngest handler
export const inngestHandler = serve({
  client: inngest,
  functions: Object.values(functions),
});
