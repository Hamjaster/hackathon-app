# CampusWhisper — Summary (Skim Version)

## Problem in one line

Build an anonymous campus rumor system with no central truth authority, while preventing duplicate votes, bot manipulation, mob-rule falsehoods, and score bugs — and prove it can’t be gamed by coordinated liars.

---

## Core Idea

Truth emerges via **stake-weighted anonymous voting**, **Bayesian trust scoring**, and **evidence-gated verification**, all while keeping identities hidden and preventing Sybil attacks.

---

## Key Mechanisms (Quick Scan)

### 1) Anonymous + Sybil-Resistant Voting

- **Hash-based commitment**: `SHA256(student_id + salt + rumor_id)`
- One student = one vote per rumor, without revealing identity

### 2) Verification / Dispute System

- **Stake-weighted voting** using credibility tokens (CT)
- Winners earn **1.5×** stake; losers lose stake
- Optional evidence gives **1.2×** influence bonus

### 3) Trust Score Engine

- **Bayesian update** from prior $P_0 = 0.5$
- Vote influence = stake × voter reputation
- Reputation = smoothed accuracy ratio

### 4) Popularity ≠ Truth

- **Logarithmic vote scaling** caps mob impact
- **Evidence ceiling**: without evidence, trust score max = **0.60**

### 5) Score Mutation Bug Fix

- **Score freezing** after sustained verification/debunking
- **Append-only audit log** for every score update

### 6) Bot Manipulation Defense

- **Behavioral fingerprinting** (timing, clustering, agreement correlation)
- Votes get down-weighted or quarantined if suspicious

### 7) Ghost Rumor Bug Fix

- **Soft delete** + retroactive reputation recalculation
- Prevents deleted rumors from inflating new ones

---

## Architecture (High-Level)

- **Client (Next.js)** computes vote_key locally
- **Server (Next.js API)** validates, scores, logs
- **Supabase (Postgres)** stores rumors, votes, users, audit log
- Realtime updates for trust scores

---

## Mathematical Proof (Why it’s hard to game)

- **Honest voting has positive expected value**
- **Dishonest voting has negative expected value** (stake loss + reputation decay)
- Coordinated attackers face **log-scaling**, **evidence ceiling**, and **token cost**, making manipulation economically irrational
- Honest voting is a **Nash Equilibrium**

---

## Why it’s buildable in one day

- No blockchain, no ML required
- Uses simple hashing + Bayesian math
- Next.js + Supabase makes real-time scoring fast to implement

---

## Deliverable Focus

- Mechanism design is explicit, defensible, and provable
- Each hackathon “bug” has a clean, implementable fix
- Presentation-ready: formulas, state machine, and architecture diagrams already defined
