/**
 * Inngest Client Configuration
 * Handles event-driven background processing for AI analysis
 */

import { Inngest, EventSchemas } from "inngest";

// Define event types for type safety
type RumorEvents = {
  "rumor/created": {
    data: {
      rumorId: string;
      content: string;
      createdAt: string;
    };
  };
};

// Create Inngest client with app ID
export const inngest = new Inngest({
  id: "campus-whisper",
  schemas: new EventSchemas().fromRecord<RumorEvents>(),
});
