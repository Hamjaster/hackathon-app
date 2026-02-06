# 🕵️ CampusWhisper — Decentralized Anonymous Campus Rumor Verification System

## 📄 Day 1 Submission

**Team:** Solo
**Date:** February 6, 2026

---

## 1. Problem Understanding

We need to build a **trustless, anonymous rumor board** for campus events where:

- Students submit rumors/news **anonymously**
- There is **no central authority** deciding truth
- Other anonymous students **verify or dispute** claims
- Rumors earn **trust scores** through a designed mechanism
- The system must prevent **duplicate voting without collecting identities**
- Popular false rumors must **not auto-win** via mob rule
- The system must handle **score mutation bugs** (verified facts changing scores)
- **Bot accounts** manipulating votes must be detectable
- **Deleted rumors** must not ghost-affect newer rumor scores
- A **mathematical proof** must show the system can't be gamed by coordinated liars

### Core Tension

The fundamental challenge is the **trust trilemma**: the system must be simultaneously **anonymous**, **sybil-resistant**, and **decentralized**. Any two are easy — all three together require careful mechanism design.

---

## 2. Assumptions

| #   | Assumption                                                                                         | Justification                                                                       |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Students have a valid **university email** (e.g., `@campus.edu`)                                   | Needed for one-time enrollment; email is never stored or linked to activity         |
| 2   | The system is **semi-decentralized** — there's a server, but it has no admin control over truth    | Full P2P is infeasible for a hackathon; we decentralize _trust_, not infrastructure |
| 3   | A **semester-based salt** is distributed to all students (e.g., via LMS/email)                     | Required for the hash-based commitment scheme                                       |
| 4   | Users act **rationally** (they prefer gaining tokens over losing them)                             | Required for the game-theoretic proof to hold                                       |
| 5   | The system starts with a **bootstrapping phase** where early votes are treated as lower-confidence | Cold-start problem is acknowledged and handled                                      |
| 6   | Rumors are **text-based** with optional image/link evidence attachments                            | Keeps scope buildable in one day                                                    |
| 7   | A rumor's lifecycle is: `submitted → active → verified/debunked → frozen`                          | Clear state machine for score management                                            |

---

## 3. Proposed Solution & Approach

### 3.1 — Anonymous Identity & Sybil Resistance: **Hash-Based Commitment Scheme**

**How it works:**

1. University distributes a **secret salt** `S` to all enrolled students (per semester, via email/LMS)
2. When a student wants to vote on rumor `R`, their client computes:

```
vote_key = SHA256(student_id + S + rumor_id)
```

3. The `vote_key` is sent to the server. The server:
    - Checks if this `vote_key` has already voted on this rumor → **reject if duplicate**
    - Stores the `vote_key` → **cannot reverse-engineer** `student_id` from it (one-way hash)
    - Has **no knowledge** of which student produced which `vote_key`

4. Each unique `(student, rumor)` pair produces a **unique, deterministic, irreversible** key

**Why this works:**

- ✅ **Sybil-resistant**: One student can only produce one valid `vote_key` per rumor
- ✅ **Anonymous**: Server never sees `student_id`; hash is irreversible
- ✅ **Simple to implement**: One SHA256 call. No crypto libraries needed
- ✅ **Verifiable**: If challenged, a third party with the salt can verify the scheme's integrity

**Edge case — salt leakage:**
If the salt leaks to outsiders, they still need a valid `student_id` in the university's format. We can add an enrollment step where `hash(student_id + enrollment_salt)` is pre-registered (one-time, anonymous), creating a whitelist of valid hash prefixes.

---

### 3.2 — Verification Mechanism: **Stake-Weighted Voting**

**How it works:**

1. Every new (verified-enrolled) user starts with **10 credibility tokens (CT)**
2. To vote on a rumor (verify ✅ or dispute ❌), a user must **stake** tokens:
    - Minimum stake: **1 CT**
    - Maximum stake: **5 CT** (prevents whales from dominating)
3. When a rumor reaches a **resolution state** (verified or debunked):
    - Voters on the **winning side** get: `stake × 1.5` back (50% profit)
    - Voters on the **losing side** lose: their entire stake
4. **Optional evidence bonus**: Attaching evidence (link, screenshot) that gets upvoted by 3+ users gives a **1.2× multiplier** on your stake's influence

**Resolution triggers:**

- Trust score stays above **0.75** for **48 hours** → Verified ✅
- Trust score stays below **0.25** for **48 hours** → Debunked ❌
- Score between 0.25–0.75 after **7 days** → Inconclusive ⚪ (all stakes returned, no profit/loss)

**Why this works:**

- ✅ Rational users won't stake tokens on lies (negative expected value)
- ✅ Higher conviction = higher stake = more influence (but capped)
- ✅ Creates natural **token scarcity** — you can't vote on everything, so you pick battles you know about
- ✅ Directly enables the game theory proof (Section 7)

---

### 3.3 — Trust Score Mechanism: **Bayesian Trust Scoring**

**The Formula:**

Each rumor starts with a prior trust score of **P₀ = 0.5** (maximum uncertainty).

When user `i` casts a vote `vᵢ ∈ {+1, -1}` with stake `sᵢ` and voter reputation `rᵢ`:

```
Trust Score Update:

P_new = P_old × L / (P_old × L + (1 - P_old))

Where L (likelihood ratio) = exp(α × vᵢ × sᵢ × rᵢ)
```

- `α` = learning rate (tuned to 0.1 to prevent single-vote domination)
- `vᵢ` = +1 (verify) or -1 (dispute)
- `sᵢ` = stake amount (1–5), normalized
- `rᵢ` = voter's reputation score (0.0–1.0), derived from historical accuracy

**Voter Reputation (`rᵢ`):**

```
rᵢ = (correct_votes + 1) / (total_votes + 2)    // Laplace smoothing
```

- New users: `r = 1/2 = 0.5` (neutral)
- User with 9/10 correct: `r = 10/12 ≈ 0.83` (high influence)
- User with 2/10 correct: `r = 3/12 = 0.25` (low influence)

**Properties:**

- ✅ Starts uncertain, converges with evidence
- ✅ High-reputation voters shift score more
- ✅ Naturally handles conflicting votes (they partially cancel)
- ✅ Single voter can never dominate (bounded by α and stake cap)

---

### 3.4 — Preventing Popularity = Truth: **Log Scaling + Evidence Ceiling**

**Problem:** If 500 people believe a false rumor, raw voting would make it "true."

**Solution — Two mechanisms combined:**

#### A) Logarithmic Vote Scaling

The effective vote count is scaled logarithmically:

```
effective_weight(n) = 1 + ln(n)

n = 10  → weight = 3.3
n = 100 → weight = 5.6
n = 1000 → weight = 7.9
```

So 1000 votes is only **~2.4×** more powerful than 100 votes, not 10×. This **caps mob power**.

#### B) Evidence Ceiling

A rumor's trust score has a **hard ceiling without evidence**:

| Evidence Status                   | Maximum Trust Score |
| --------------------------------- | ------------------- |
| No evidence attached              | 0.60                |
| Evidence attached but < 3 upvotes | 0.70                |
| Evidence attached with 3+ upvotes | 1.00                |

This means **pure popularity can never push a rumor above 0.60**. To reach "verified" (0.75+), you MUST provide evidence that other users validate.

**Why this works:**

- ✅ Popular lies hit a ceiling at 0.60 — never reach "verified"
- ✅ Unpopular truths with strong evidence CAN reach verified
- ✅ Creates incentive to find evidence, not just recruit voters
- ✅ Simple to implement: one `Math.min()` check

---

### 3.5 — Score Mutation Bug Fix: **Score Freezing + Append-Only Audit Log**

**Problem:** Verified facts from last month are mysteriously changing their trust scores.

**Root Cause Analysis:** Likely caused by:

- Late votes still being processed after resolution
- Voter reputation recalculations retroactively affecting old scores
- Database race conditions on concurrent updates

**Solution:**

#### A) Score Freezing

```
State Machine:

ACTIVE → (score > 0.75 for 48h) → VERIFIED_PENDING → (no challenges in 24h) → FROZEN ❄️
ACTIVE → (score < 0.25 for 48h) → DEBUNKED_PENDING → (no challenges in 24h) → FROZEN ❄️
FROZEN → (challenge with 5+ CT stake) → CHALLENGED → ACTIVE (re-opened)
```

- **FROZEN** rumors have their score **immutably recorded**
- New votes on frozen rumors are **rejected** (unless a formal challenge is opened)
- Re-opening a frozen rumor requires a **minimum 5 CT stake** (high bar)

#### B) Append-Only Audit Log

Every score change is logged:

```json
{
    "rumor_id": "r_abc123",
    "timestamp": "2026-02-06T14:30:00Z",
    "previous_score": 0.72,
    "new_score": 0.74,
    "trigger": "vote",
    "vote_key_hash": "sha256:...",
    "stake": 3,
    "direction": "verify"
}
```

- Logs are **append-only** (INSERT only, no UPDATE/DELETE)
- Any score can be **reconstructed** by replaying the log
- **Anomaly detection**: if `new_score` doesn't match replayed calculation → flag corruption

---

### 3.6 — Bot Detection: **Behavioral Fingerprinting**

**Problem:** Users creating bot accounts to manipulate votes.

**Solution — Statistical Pattern Detection (no ML needed):**

#### Signals Tracked:

| Signal                    | Threshold                                                       | Action                                       |
| ------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| **Voting speed**          | < 3 seconds between vote page load and vote submission          | Flag + reduce vote weight to 0.1×            |
| **Temporal clustering**   | 5+ accounts voting on same rumor within 10-second window        | Flag entire cluster                          |
| **Agreement correlation** | Two accounts agree on > 90% of votes (across 10+ shared rumors) | Merge their vote weight (treat as one voter) |
| **Stake pattern**         | Always stakes exactly the same amount                           | Soft flag (low confidence)                   |
| **Session fingerprint**   | Same browser fingerprint hash across multiple accounts          | Hard flag + suspend                          |

#### Penalty System:

```
flag_score = weighted_sum(signals)

flag_score < 0.3  → Normal user
flag_score 0.3–0.7 → Reduced vote weight (multiplied by 1 - flag_score)
flag_score > 0.7  → Vote quarantined (not counted until manual review)
```

**Why this works:**

- ✅ No identity collection needed — purely behavioral
- ✅ Bots can technically vote, but their votes are **effectively worthless**
- ✅ False positives are handled gracefully (reduced weight, not banned)
- ✅ Correlation detection catches **coordinated** bot rings, not just individuals

---

### 3.7 — Ghost Rumor Bug Fix: **Soft Delete with Isolation**

**Problem:** Deleted rumors are still affecting trust scores of newer related rumors.

**Root Cause Analysis:** When a rumor is deleted:

- Voter reputation scores were calculated INCLUDING votes on the now-deleted rumor
- If rumor A was deleted but user X voted correctly on A, X's reputation still reflects that vote
- X's inflated reputation then affects their votes on rumor B → ghost influence

**Solution:**

#### Soft Delete with Retroactive Recalculation

```
On delete(rumor_id):
  1. Mark rumor as status = 'DELETED'
  2. Exclude rumor from ALL future queries (filter: status != 'DELETED')
  3. Collect all voters who voted on this rumor
  4. For each voter:
     - Recalculate their reputation WITHOUT this rumor's votes
     - Update their reputation score
  5. For each ACTIVE rumor these voters also voted on:
     - Recalculate trust score with updated voter reputations
  6. Log the cascade in audit trail
```

**Implementation detail:**

- Voter reputation formula already uses `correct_votes / total_votes`
- On delete: simply decrement the relevant counter and recalculate
- Use a **database transaction** to ensure atomicity
- Add a `deleted_at` timestamp for audit purposes

**Prevention:**

- Instead of allowing arbitrary deletion, use **archival**: rumor becomes invisible to users but remains in the calculation engine until a proper recalculation cycle runs
- Run recalculation as a **background job** to avoid blocking the UI

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Submit   │  │  Vote    │  │  Browse  │  │  Evidence     │  │
│  │  Rumor    │  │  Panel   │  │  Feed    │  │  Upload       │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │             │               │            │
│  ┌────┴──────────────┴─────────────┴───────────────┴────────┐  │
│  │              Client-Side Vote Key Generator               │  │
│  │         vote_key = SHA256(student_id + salt + rumor_id)    │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS (vote_key, NOT student_id)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Next.js API Routes)                  │
│                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
│  │  Auth Gate   │  │  Scoring       │  │  Bot Detection      │ │
│  │  (vote_key   │  │  Engine        │  │  Engine             │ │
│  │   dedup)     │  │  (Bayesian)    │  │  (Behavioral)       │ │
│  └──────┬───────┘  └───────┬────────┘  └──────────┬──────────┘ │
│         │                  │                       │            │
│  ┌──────┴──────────────────┴───────────────────────┴──────────┐ │
│  │                    Business Logic Layer                     │ │
│  │  - Stake management    - Score freezing                    │ │
│  │  - Evidence validation - Ghost rumor cleanup               │ │
│  │  - Audit logging       - Reputation recalculation          │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                       │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  rumors     │ │  votes     │ │  users   │ │  audit_log    │  │
│  │            │ │            │ │ (anon)   │ │  (append-only)│  │
│  │- id        │ │- vote_key  │ │- token_  │ │- rumor_id     │  │
│  │- content   │ │- rumor_id  │ │  hash    │ │- old_score    │  │
│  │- score     │ │- direction │ │- tokens  │ │- new_score    │  │
│  │- status    │ │- stake     │ │- reputa- │ │- trigger      │  │
│  │- evidence[]│ │- timestamp │ │  tion    │ │- timestamp    │  │
│  │- created_at│ │- bot_score │ │- bot_    │ │               │  │
│  │- frozen_at │ │            │ │  flag    │ │               │  │
│  └────────────┘ └────────────┘ └──────────┘ └───────────────┘  │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  Realtime             │  │  Row Level Security          │    │
│  │  (live score updates) │  │  (no direct DB access)       │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Voting

```
1. User opens rumor page
2. Client computes: vote_key = SHA256(student_id + salt + rumor_id)
3. Client sends: { vote_key, rumor_id, direction, stake, evidence? }
4. Server checks:
   a. vote_key not already used for this rumor? → proceed
   b. User has enough tokens? → proceed
   c. Rumor is ACTIVE (not FROZEN)? → proceed
   d. Bot detection score < threshold? → proceed
5. Server deducts stake from user's token balance
6. Server computes new Bayesian trust score
7. Server logs change to audit_log
8. Server broadcasts new score via Supabase Realtime
9. Client updates UI in real-time
```

### Data Flow — Resolution

```
1. CRON job runs every hour
2. For each ACTIVE rumor:
   a. If score > 0.75 AND has been > 0.75 for 48h → VERIFIED_PENDING
   b. If score < 0.25 AND has been < 0.25 for 48h → DEBUNKED_PENDING
   c. If age > 7 days AND score between 0.25–0.75 → INCONCLUSIVE
3. For VERIFIED/DEBUNKED_PENDING (after 24h grace period):
   a. Freeze score
   b. Distribute token rewards/penalties
   c. Update voter reputations
   d. Log to audit trail
```

---

## 5. Tech Stack

| Layer           | Technology                            | Justification                                                  |
| --------------- | ------------------------------------- | -------------------------------------------------------------- |
| Frontend        | **Next.js 14 (App Router)**           | SSR for SEO, API routes for backend, fast to build             |
| Styling         | **Tailwind CSS + shadcn/ui**          | Rapid UI development, polished look                            |
| Database        | **Supabase (PostgreSQL)**             | Complex queries for trust scoring, realtime subscriptions, RLS |
| Auth            | **None (by design)**                  | Anonymous system; enrollment via hashed tokens only            |
| Hashing         | **Web Crypto API (client-side)**      | SHA-256 runs in browser, no server-side identity exposure      |
| Deployment      | **Vercel**                            | Zero-config Next.js deployment, serverless functions           |
| Background Jobs | **Supabase Edge Functions / pg_cron** | Hourly resolution checks, reputation recalculation             |

---

## 6. Database Schema (Key Tables)

```sql
-- Rumors table
CREATE TABLE rumors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  category VARCHAR(50),
  trust_score DECIMAL(4,3) DEFAULT 0.500,
  status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, VERIFIED, DEBUNKED, INCONCLUSIVE, DELETED
  evidence JSONB DEFAULT '[]',
  vote_count_verify INT DEFAULT 0,
  vote_count_dispute INT DEFAULT 0,
  score_ceiling DECIMAL(4,3) DEFAULT 0.600,  -- raised when evidence is validated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  frozen_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_key_hash VARCHAR(64) NOT NULL,  -- SHA256 of the vote_key (double-hashed)
  rumor_id UUID REFERENCES rumors(id),
  direction SMALLINT NOT NULL,  -- +1 verify, -1 dispute
  stake INT NOT NULL CHECK (stake BETWEEN 1 AND 5),
  voter_reputation DECIMAL(4,3),  -- snapshot at time of vote
  bot_flag_score DECIMAL(4,3) DEFAULT 0.000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vote_key_hash, rumor_id)  -- prevents duplicate votes
);

-- Anonymous users (identified only by token_hash)
CREATE TABLE users (
  token_hash VARCHAR(64) PRIMARY KEY,  -- SHA256 of enrollment token
  credibility_tokens INT DEFAULT 10,
  reputation DECIMAL(4,3) DEFAULT 0.500,
  correct_votes INT DEFAULT 0,
  total_votes INT DEFAULT 0,
  bot_flag_score DECIMAL(4,3) DEFAULT 0.000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Append-only audit log
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  rumor_id UUID REFERENCES rumors(id),
  previous_score DECIMAL(4,3),
  new_score DECIMAL(4,3),
  trigger VARCHAR(50),  -- 'vote', 'resolution', 'recalculation', 'freeze'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence table
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumor_id UUID REFERENCES rumors(id),
  content_url TEXT,
  description TEXT,
  upvotes INT DEFAULT 0,
  submitted_by VARCHAR(64),  -- token_hash
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Mathematical Proof: System Cannot Be Gamed

### Theorem: Honest voting is a Nash Equilibrium

**Setup:**

- Let there be `n` voters, of which `k` are coordinated liars
- Each voter has reputation `rᵢ` and stakes `sᵢ` tokens
- Honest voters vote according to their genuine belief
- Liars vote to push a false rumor to "verified"

**Proof:**

#### Step 1: Expected Value of Honest Voting

For an honest voter with reputation `r` staking `s` tokens:

```
E[honest] = P(correct) × s × 1.5 + P(incorrect) × (-s)
```

Since honest voters vote on what they believe, and beliefs correlate with truth:

```
P(correct | honest) ≥ 0.5 + ε    (for some ε > 0, by definition of "honest")

E[honest] ≥ (0.5 + ε)(1.5s) + (0.5 - ε)(-s)
         = 0.75s + 1.5εs - 0.5s + εs
         = 0.25s + 2.5εs
         > 0    ✓
```

**Honest voting has positive expected value.**

#### Step 2: Expected Value of Dishonest Voting

For a liar voting against their actual knowledge:

```
P(correct | dishonest) ≤ 0.5 - ε

E[dishonest] ≤ (0.5 - ε)(1.5s) + (0.5 + ε)(-s)
             = 0.75s - 1.5εs - 0.5s - εs
             = 0.25s - 2.5εs
```

For any `ε > 0` and sufficiently many interactions, this converges to **negative expected value**.

Additionally, dishonest voting **degrades reputation** `rᵢ`, which:

- Reduces future vote influence (less power)
- Reduces future expected returns (lower `rᵢ` means lower weight means lower share of rewards)

**Dishonest voting has negative expected value AND compounds negatively over time.**

#### Step 3: Cost of Coordinated Attack

For `k` coordinated liars to push a false rumor's score from 0.5 to 0.75:

```
Required: Σ(sᵢ × rᵢ) for liars > Σ(sⱼ × rⱼ) for honest voters

Since max stake = 5 and new accounts have r = 0.5:
- Each liar contributes at most: 5 × 0.5 = 2.5 effective weight
- k liars contribute: 2.5k total weight

But with log scaling:
- Effective weight of k votes = 1 + ln(k)
- Cost paid by liars = k × stake (linear)
- Influence gained = O(ln(k)) (logarithmic)
```

**The cost-to-influence ratio grows as O(k / ln(k)) → ∞**

To shift a score by `δ`, attackers need:

```
k ≥ e^(δ/α) / max_stake

For δ = 0.25 (0.5 → 0.75) and α = 0.1:
k ≥ e^2.5 / 5 ≈ 2.44

BUT the evidence ceiling caps score at 0.60 without evidence!
So attackers also need to fabricate evidence that gets 3+ upvotes.
```

**The attack requires both vote manipulation AND evidence fabrication — a much harder problem.**

#### Step 4: Nash Equilibrium

Given:

- `E[honest] > 0` for all players
- `E[dishonest] < 0` for all players (in the long run)
- No player can improve their payoff by switching from honest to dishonest

**∴ Honest voting is a Nash Equilibrium. □**

#### Resilience Bound

The system tolerates up to `f < n/3` coordinated bad actors before trust scores can be reliably manipulated, assuming:

- Honest voters have average reputation ≥ 0.5
- Bad actors are new accounts with reputation = 0.5
- Evidence ceiling is enforced

This aligns with classical **Byzantine Fault Tolerance** bounds.

---

## 8. Summary of How Each Challenge is Addressed

| Challenge                      | Solution                                                  | Mechanism                                                              |
| ------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| No central authority           | Stake-weighted voting with Bayesian scoring               | Crowd-sourced truth with mathematical convergence                      |
| Anonymous duplicate prevention | Hash-based commitment: `SHA256(id + salt + rumor_id)`     | Deterministic, irreversible, unique per student per rumor              |
| Popular lies winning           | Log scaling + evidence ceiling at 0.60                    | Votes alone can never verify; evidence required                        |
| Score mutation bug             | Score freezing after 48h + append-only audit log          | Immutable snapshots with full reconstruction capability                |
| Bot manipulation               | Behavioral fingerprinting (timing, correlation, patterns) | Statistical detection, graduated penalties                             |
| Ghost rumor bug                | Soft delete with retroactive reputation recalculation     | Cascade cleanup removes phantom influence                              |
| Mathematical proof             | Game theory: honest voting = Nash Equilibrium             | Positive EV for honesty, negative EV for lying, O(k/ln(k)) attack cost |

---

## 9. Implementation Plan (Day 2)

| Time        | Task                                                     |
| ----------- | -------------------------------------------------------- |
| 9:00–10:00  | Supabase setup: tables, RLS policies, realtime config    |
| 10:00–11:30 | Core API: enrollment, rumor submission, voting endpoint  |
| 11:30–12:30 | Bayesian scoring engine + stake management               |
| 12:30–1:00  | Lunch break                                              |
| 1:00–2:00   | Frontend: rumor feed, voting UI, real-time score updates |
| 2:00–3:00   | Bot detection engine + evidence system                   |
| 3:00–3:30   | Score freezing + audit log                               |
| 3:30–4:00   | Ghost rumor cleanup + soft delete                        |
| 4:00–4:30   | Testing + bug fixes                                      |
| 4:30–5:00   | Presentation prep + deployment to Vercel                 |

---

## 10. Key Design Principles

1. **Trust is earned, not given** — reputation must be built through accurate voting
2. **Skin in the game** — every vote costs something; no free opinions
3. **Evidence over popularity** — hard ceiling without proof
4. **Transparency without identity** — full audit trail, zero personal data
5. **Graceful degradation** — bots aren't banned, they're weakened; deleted rumors are cleaned, not ignored
6. **Mathematical rigor** — every mechanism has a formal justification

---

_CampusWhisper: Where truth emerges from the crowd, not from authority._
