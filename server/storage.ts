import { db } from "./db";
import { 
  rumors, evidence, evidenceVotes, auditLog,
  type Rumor, type InsertRumor, 
  type Evidence, type InsertEvidence,
  type EvidenceVote, type AuditLogEntry,
  type RumorStatus
} from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { crypto } from "crypto";

export interface IStorage {
  // Rumors
  getRumors(sort?: 'recent' | 'popular'): Promise<(Rumor & { evidenceCount: number })[]>;
  getRumor(id: number): Promise<(Rumor & { evidence: (Evidence & { helpfulVotes: number, misleadingVotes: number })[], history: AuditLogEntry[] }) | undefined>;
  createRumor(rumor: InsertRumor): Promise<Rumor>;
  updateRumorStatus(id: number, status: RumorStatus): Promise<Rumor>;

  // Evidence
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  getEvidenceForRumor(rumorId: number): Promise<Evidence[]>;

  // Votes & Scoring
  createVote(vote: { evidenceId: number, userId: string, isHelpful: boolean }): Promise<{ success: boolean, newTrustScore?: number, newStatus?: string }>;
}

export class DatabaseStorage implements IStorage {
  async getRumors(sort: 'recent' | 'popular' = 'recent'): Promise<(Rumor & { evidenceCount: number })[]> {
    const allRumors = await db.select().from(rumors).orderBy(sort === 'recent' ? sql`${rumors.createdAt} DESC` : sql`${rumors.viewCount} DESC`);
    
    // Enrich with evidence count (naive N+1 for now, can optimize later)
    const results = [];
    for (const rumor of allRumors) {
      const [count] = await db.select({ count: sql<number>`count(*)` }).from(evidence).where(eq(evidence.rumorId, rumor.id));
      results.push({ ...rumor, evidenceCount: Number(count.count) });
    }
    return results;
  }

  async getRumor(id: number): Promise<(Rumor & { evidence: (Evidence & { helpfulVotes: number, misleadingVotes: number })[], history: AuditLogEntry[] }) | undefined> {
    const [rumor] = await db.select().from(rumors).where(eq(rumors.id, id));
    if (!rumor) return undefined;

    // Increment view count
    await db.update(rumors).set({ viewCount: rumor.viewCount + 1 }).where(eq(rumors.id, id));

    const rumorEvidence = await db.select().from(evidence).where(eq(evidence.rumorId, id));
    
    const enrichedEvidence = [];
    for (const ev of rumorEvidence) {
      const helpful = await db.select({ count: sql<number>`count(*)` }).from(evidenceVotes).where(and(eq(evidenceVotes.evidenceId, ev.id), eq(evidenceVotes.isHelpful, true)));
      const misleading = await db.select({ count: sql<number>`count(*)` }).from(evidenceVotes).where(and(eq(evidenceVotes.evidenceId, ev.id), eq(evidenceVotes.isHelpful, false)));
      
      enrichedEvidence.push({
        ...ev,
        helpfulVotes: Number(helpful[0].count),
        misleadingVotes: Number(misleading[0].count),
      });
    }

    const history = await db.select().from(auditLog).where(eq(auditLog.rumorId, id)).orderBy(sql`${auditLog.createdAt} DESC`);

    return { ...rumor, evidence: enrichedEvidence, history };
  }

  async createRumor(insertRumor: InsertRumor): Promise<Rumor> {
    const [rumor] = await db.insert(rumors).values(insertRumor).returning();
    return rumor;
  }

  async updateRumorStatus(id: number, status: RumorStatus): Promise<Rumor> {
    const [rumor] = await db.update(rumors).set({ status }).where(eq(rumors.id, id)).returning();
    return rumor;
  }

  async createEvidence(insertEvidence: InsertEvidence): Promise<Evidence> {
    const [ev] = await db.insert(evidence).values(insertEvidence).returning();
    
    // Trigger a score recalculation (new evidence acts as a vote of sorts, but for MVP we wait for votes ON evidence)
    // Actually, simply adding evidence shouldn't change the score until the evidence itself is vetted. 
    // BUT, for a lively system, maybe we give it a tiny initial weight? 
    // Let's stick to the proposal: "Trust score updates (Bayesian, evidence-weighted)" implies evidence needs weight.
    
    return ev;
  }

  async getEvidenceForRumor(rumorId: number): Promise<Evidence[]> {
    return db.select().from(evidence).where(eq(evidence.rumorId, rumorId));
  }

  async createVote({ evidenceId, userId, isHelpful }: { evidenceId: number, userId: string, isHelpful: boolean }): Promise<{ success: boolean, newTrustScore?: number, newStatus?: string }> {
    // 1. Generate Anonymous Hash
    // Using a dynamic salt would be better, but for MVP we use a consistent one
    const salt = process.env.VOTE_SALT || "HACKATHON_SECRET_SALT_2026"; 
    const hashInput = `${userId}:${salt}:${evidenceId}`;
    
    // Using simple SHA256 simulation since I can't import crypto easily in this environment without checking node types
    // actually I can import crypto in node.
    const { createHash } = await import('crypto');
    const voteHash = createHash('sha256').update(hashInput).digest('hex');

    // 2. Check for duplicate vote
    const existing = await db.select().from(evidenceVotes).where(eq(evidenceVotes.voteHash, voteHash));
    if (existing.length > 0) {
      throw new Error("Duplicate vote detected");
    }

    // 3. Insert Vote
    await db.insert(evidenceVotes).values({
      evidenceId,
      voteHash,
      isHelpful
    });

    // 4. Recalculate Rumor Score
    const [targetEvidence] = await db.select().from(evidence).where(eq(evidence.id, evidenceId));
    if (!targetEvidence) throw new Error("Evidence not found");

    const rumorId = targetEvidence.rumorId;
    const [rumor] = await db.select().from(rumors).where(eq(rumors.id, rumorId));

    const newScore = await this.calculateBayesianScore(rumorId);
    
    // 5. Update Status based on thresholds
    let newStatus: RumorStatus = 'active';
    if (newScore >= 0.8) newStatus = 'verified';
    else if (newScore <= 0.2) newStatus = 'debunked';
    else if (newScore >= 0.4 && newScore <= 0.6) newStatus = 'inconclusive';
    else newStatus = 'active';

    // 6. Update Rumor and Audit Log
    if (Math.abs(newScore - rumor.trustScore) > 0.001 || newStatus !== rumor.status) {
      await db.update(rumors).set({ trustScore: newScore, status: newStatus }).where(eq(rumors.id, rumorId));
      
      await db.insert(auditLog).values({
        rumorId,
        oldScore: rumor.trustScore,
        newScore,
        changeReason: `Vote on evidence ${evidenceId} (Helpful: ${isHelpful})`,
      });
    }

    return { success: true, newTrustScore: newScore, newStatus };
  }

  private async calculateBayesianScore(rumorId: number): Promise<number> {
    // Fetch all evidence
    const allEvidence = await db.select().from(evidence).where(eq(evidence.rumorId, rumorId));

    let alpha = 1.0; // Prior success (Supporting)
    let beta = 1.0;  // Prior failure (Disputing)

    for (const ev of allEvidence) {
      // Get votes for this evidence
      const helpful = await db.select({ count: sql<number>`count(*)` }).from(evidenceVotes).where(and(eq(evidenceVotes.evidenceId, ev.id), eq(evidenceVotes.isHelpful, true)));
      const misleading = await db.select({ count: sql<number>`count(*)` }).from(evidenceVotes).where(and(eq(evidenceVotes.evidenceId, ev.id), eq(evidenceVotes.isHelpful, false)));
      
      const hCount = Number(helpful[0].count);
      const mCount = Number(misleading[0].count);

      // Calculate Evidence Quality/Weight using Log Scaling
      // weight = 1 + ln(votes) roughly.
      // We want net positive votes to count towards the evidence's direction.
      
      const netVotes = hCount - mCount;
      
      // If net votes < 0, the evidence is deemed "bad" and should probably have 0 weight or even negative impact?
      // For simplicity:
      // If evidence is supporting AND verified (net > 0): Add to Alpha
      // If evidence is disputing AND verified (net > 0): Add to Beta
      // If evidence is misleading (net < 0): Ignore it (it's noise)
      
      if (netVotes > 0) {
        const weight = 1 + Math.log(netVotes); // Log scale impact
        
        if (ev.isSupporting) {
          alpha += weight;
        } else {
          beta += weight;
        }
      }
    }

    // Mean of Beta distribution
    return alpha / (alpha + beta);
  }
}

export const storage = new DatabaseStorage();
