import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";
import { rateLimit } from "./middleware/rateLimit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Apply rate limiting to all API routes
  app.use("/api", rateLimit);

  // Rumor Routes
  app.get(api.rumors.list.path, async (req, res) => {
    const rumors = await storage.getRumors();
    res.json(rumors);
  });

  app.post(api.rumors.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const input = api.rumors.create.input.parse(req.body);
      // Initialize with default values
      const rumor = await storage.createRumor(input);
      res.status(201).json(rumor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.rumors.get.path, async (req, res) => {
    const rumor = await storage.getRumor(Number(req.params.id));
    if (!rumor) return res.status(404).json({ message: "Rumor not found" });
    res.json(rumor);
  });

  // Evidence Routes
  app.post(api.evidence.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const input = api.evidence.create.input.parse(req.body);
      const evidence = await storage.createEvidence({
        ...input,
        rumorId: Number(req.params.id)
      });
      res.status(201).json(evidence);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.evidence.vote.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const { isHelpful } = api.evidence.vote.input.parse(req.body);
      const userId = (req.user as any).claims.sub; // Replit Auth ID
      
      const result = await storage.createVote({
        evidenceId: Number(req.params.id),
        userId,
        isHelpful
      });
      
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === "Duplicate vote detected") {
         return res.status(400).json({ message: "You have already voted on this evidence." });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

// Seed Data Helper
async function seedData() {
  const existingRumors = await storage.getRumors();
  if (existingRumors.length === 0) {
    console.log("Seeding data...");
    
    const r1 = await storage.createRumor({
      content: "The library 3rd floor is haunted by a ghost that helps you pass calculus.",
    });

    await storage.createEvidence({
      rumorId: r1.id,
      content: "I fell asleep there and woke up with a completed derivative worksheet.",
      isSupporting: true
    });

    await storage.createEvidence({
      rumorId: r1.id,
      content: "It's just the janitor, Bob. He has a math degree.",
      isSupporting: false
    });
    
    const r2 = await storage.createRumor({
      content: "Tuition is increasing by 15% next semester to fund a new e-sports arena.",
    });
    
     await storage.createEvidence({
      rumorId: r2.id,
      content: "http://university-news-leak.com/budget-2026",
      url: "http://university-news-leak.com/budget-2026",
      isSupporting: true
    });

    console.log("Seeding complete.");
  }
}

// Run seed
seedData();
