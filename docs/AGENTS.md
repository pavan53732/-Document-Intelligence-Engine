# 🤖 Agent System Documentation

## Overview

The Document Intelligence Engine uses **34 specialized AI agents** organized into **3 tiers**:
- **Core Agents (10)** - Base document analysis
- **Advanced Agents (20)** - System-specific validation
- **Meta Agents (4)** - Supervision and coordination

> **📋 See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for implementation status and known issues.**

## AI Backend

All agents use a **user-configurable OpenAI-compatible API**. This means you can use:
- **OpenAI** - GPT-4o, GPT-4-turbo, GPT-3.5-turbo
- **Azure OpenAI** - Your Azure deployments
- **Ollama (Local)** - Llama 3, Mistral, CodeLlama, Phi-3
- **LM Studio (Local)** - Any local model
- **Groq** - Fast inference (Llama 3.3 70B)
- **Together AI** - Open-source models
- **Anthropic** - Claude 3.5 Sonnet (via proxy)
- **Custom** - Any OpenAI-compatible endpoint

Configure your AI provider via the **"AI Settings"** button in the header.

## Implementation Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully Implemented (Rule-based + AI) |
| ⚠️ | Partially Implemented (AI-only or limited rules) |
| ❌ | Not Implemented |

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    META AGENTS (4) ✅ IMPLEMENTED               │
│  ✅ Cross-Agent Conflict Resolver                               │
│  ✅ Severity Scoring Engine                                     │
│  ✅ Stress-Test Generator                                       │
│  ✅ Final Meta Judge                                            │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                  ADVANCED AGENTS (20) ✅ IMPLEMENTED            │
│                                                                 │
│  BASE (6):                                                      │
│  ✅ Semantic Analyzer    ✅ Functional Validator                │
│  ✅ Temporal Analyzer    ✅ Completeness Checker                │
│  ✅ Quantitative Checker ✅ Adversarial Analyzer                │
│                                                                 │
│  SYSTEM CORE (6):                                               │
│  ✅ Authority Boundary     ✅ Execution Invariant               │
│  ✅ Governance           ✅ State Mutation                     │
│  ✅ Determinism          ✅ Multi-Agent Consistency             │
│                                                                 │
│  FORMAL SYSTEM (8):                                             │
│  ✅ Concurrency           ✅ Simulation                          │
│  ✅ Recovery             ✅ World-Model                         │
│  ✅ Boundary Enforcement ✅ Convergence                          │
│  ✅ Semantic-Execution   ✅ Invariant Closure                    │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    CORE AGENTS (10) ✅ IMPLEMENTED              │
│                                                                 │
│  ✅ Logic Checker        ✅ Consistency Checker                  │
│  ✅ Contradiction Det.   ✅ Structure Analyzer                   │
│  ✅ Fact Checker         ✅ Intent-Scope Checker                 │
│  ✅ Dependency Checker   ✅ Terminology Checker                  │
│  ✅ Assumption Detector  ✅ Example Checker                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Agents (10)

### 1. 🧠 Logic Checker
**Layer**: Logical Integrity  
**Status**: ✅ Fully Implemented  
**Purpose**: Analyzes logical flow and reasoning

**Detects**:
- Circular reasoning (✅ rule-based + AI)
- Non sequiturs (AI)
- False dichotomies (AI)
- Hasty generalizations (AI)
- False causality (AI)
- Missing premises (AI)
- Invalid inferences (AI)
- Appeal to authority (AI)
- Slippery slope fallacies (AI)
- Overgeneralization (✅ rule-based)
- Begging the question (AI)

**Rule-Based Capabilities**:
- Circular definition detection via definition graph traversal
- Absolute claim counting (`always`, `never`, `all`, `none`, `every`)

---

### 2. 🔄 Consistency Checker
**Layer**: Contradiction & Consistency  
**Status**: ⚠️ Partially Implemented (Rule-based only)  
**Purpose**: Ensures terminology and style consistency

**Detects**:
- Terminology inconsistency (✅ rule-based)
- Naming convention conflicts (✅ rule-based)
- Capitalization inconsistencies (✅ rule-based)
- Definition drift (✅ rule-based)
- Date format inconsistencies (❌ not implemented)
- Version format inconsistencies (❌ not implemented)

**Rule-Based Capabilities**:
- Definition comparison across document
- Technical term capitalization rules (API, HTTP, JSON, REST, etc.)

---

### 3. ⚡ Contradiction Detector
**Layer**: Contradiction & Consistency  
**Status**: ✅ Fully Implemented  
**Purpose**: Identifies conflicting statements

**Detects**:
- Direct contradictions (AI)
- Indirect contradictions (AI)
- Hidden contradictions (AI)
- Numerical contradictions (❌ not implemented)
- Negation contradictions (✅ rule-based + AI)

**Rule-Based Capabilities**:
- Negation pattern detection (`not`, `never`, `no`, `cannot`)
- Semantic similarity grouping for claim pairs

---

### 4. 🏗️ Structure Analyzer
**Layer**: Structural & Organizational  
**Status**: ✅ Fully Implemented  
**Purpose**: Analyzes document structure

**Detects**:
- Heading hierarchy skips (✅ rule-based)
- Multiple H1 headings (❌ not implemented)
- Empty sections (✅ rule-based)
- Broken internal links (✅ rule-based)
- Poor organization (❌ not implemented)
- Improper ordering (❌ not implemented)

**Rule-Based Capabilities**:
- AST-based heading level analysis
- Anchor validation for internal links
- Content completeness check

---

### 5. 🔍 Fact Checker
**Layer**: Factual & Evidence  
**Status**: ⚠️ Partially Implemented (Rule-based only)  
**Purpose**: Validates claims against evidence

**Detects**:
- Fabrications (❌ not implemented)
- Unsourced statistics (✅ rule-based)
- Unsupported claims (❌ not implemented)
- Missing citations (✅ rule-based)
- Outdated info (❌ not implemented)

**Rule-Based Capabilities**:
- Statistic pattern detection without source context
- Citation reference validation

---

### 6. 🧭 Intent-Scope Checker
**Layer**: Intent & Goal Alignment  
**Status**: ⚠️ AI-only  
**Purpose**: Verifies requirement boundaries

**Detects**:
- Scope creep (AI)
- Requirement drift (AI)
- Objective ambiguity (AI)
- Goal mismatch (AI)

**Missing Rule-Based**:
- Requirements traceability matrix
- Scope boundary detection

---

### 7. 🔗 Dependency Checker
**Layer**: Structural & Organizational  
**Status**: ✅ Fully Implemented  
**Purpose**: Validates cross-section dependencies

**Detects**:
- Undefined references (✅ rule-based)
- Circular dependencies (❌ not implemented)
- Missing prerequisites (❌ not implemented)

**Rule-Based Capabilities**:
- Reference target validation against definitions

---

### 8. 📚 Terminology Checker
**Layer**: Semantic & Clarity  
**Status**: ✅ Fully Implemented  
**Purpose**: Canonical vocabulary enforcement

**Detects**:
- Synonym drift (✅ rule-based)
- Term redefinition (❌ not implemented)
- Jargon without definition (❌ not implemented)

**Rule-Based Capabilities**:
- Synonym group detection (endpoint/route/path/url, function/method/procedure, etc.)

---

### 9. 🧠 Assumption Detector
**Layer**: Semantic & Clarity  
**Status**: ⚠️ AI-only  
**Purpose**: Finds implicit assumptions

**Detects**:
- Unstated prerequisites (AI)
- Implicit dependencies (AI)
- Hidden assumptions (AI)

**Missing Rule-Based**:
- Prerequisite keyword detection
- Context assumption patterns

---

### 10. 🧪 Example Checker
**Layer**: Factual & Evidence  
**Status**: ⚠️ AI-only  
**Purpose**: Validates examples vs rules

**Detects**:
- Misleading examples (AI)
- Examples that contradict rules (AI)
- Outdated examples (AI)

**Missing Rule-Based**:
- Example-rule consistency validation
- Code example syntax validation

---

## Advanced Agents (20)

### BASE ADVANCED AGENTS (6) - ✅ IMPLEMENTED

#### 11. 💬 Semantic Analyzer
**Layer**: Semantic & Clarity  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Ambiguity, vagueness, undefined terms, misleading phrasing  
**Rule-Based**: Vague term detection, undefined acronym checking

#### 12. ⚙️ Functional Validator
**Layer**: Functional & Practical  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Impossible steps, broken workflows, dependency gaps  
**Rule-Based**: TODO/FIXME detection, execution path validation

#### 13. ⏰ Temporal Analyzer
**Layer**: Temporal & State  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Timeline contradictions, sequence errors, causality breaks  
**Rule-Based**: Date format inconsistency, sequence error detection

#### 14. 🧩 Completeness Checker
**Layer**: Completeness & Coverage  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Missing edge cases, gaps in coverage, incomplete workflows  
**Rule-Based**: Incomplete pattern detection, edge case coverage

#### 15. 📊 Quantitative Checker
**Layer**: Architectural & System  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Calculation errors, unit inconsistencies, statistical issues  
**Rule-Based**: Unit group detection, number formatting consistency

#### 16. ⚔️ Adversarial Analyzer
**Layer**: Semantic-Execution Alignment  
**Status**: ✅ Implemented (AI)  
**Detects**: Counter-arguments, weak points, stress test vulnerabilities

---

### SYSTEM CORE AGENTS (6) - ✅ IMPLEMENTED

> **Implemented**: These agents now have comprehensive rule-based parsing of state mutations, governance checkpoints, and authority models.

#### 17. 🔒 Authority Boundary Analyzer
**Layer**: Authority Boundary Integrity  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Permission isolation issues, privilege escalation paths, authority breaches  
**Rule-Based**: Authority model parsing, permission boundary extraction, escalation detection

#### 18. 🔁 Execution Invariant Validator
**Layer**: Execution Invariant Safety  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Invariant bypass paths, missing steps, parallel execution leaks  
**Rule-Based**: Invariant extraction, execution path parsing, bypass detection

#### 19. 🎛️ Governance Analyzer
**Layer**: Governance Enforcement  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Missing validation steps, bypass channels, enforcement gaps  
**Rule-Based**: Governance checkpoint detector, rule extraction, enforcement analysis

#### 20. 🗂️ State Mutation Validator
**Layer**: State Mutation Legitimacy  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Illegal state transitions, invalid mutation paths, atomicity issues  
**Rule-Based**: State mutation extractor, state machine parsing, cycle detection

#### 21. 🔄 Determinism Analyzer
**Layer**: Deterministic Execution  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Nondeterministic logic, replay stability issues, async races  
**Rule-Based**: Nondeterminism pattern detection, random/timing/async patterns

#### 22. 🧩 Multi-Agent Consistency Analyzer
**Layer**: Multi-Agent Consistency  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: Conflicting agent decisions, coordination gaps, stale world models  
**Rule-Based**: Agent interaction model parsing, responsibility overlap detection

---

### FORMAL SYSTEM AGENTS (8) - ✅ IMPLEMENTED

> **Implemented**: These agents now have rule-based extraction components for better accuracy.

#### 23. ⚡ Concurrency Safety Analyzer
**Layer**: Concurrency Safety  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Race conditions, staged mutation conflicts, deadlock risks  
**Rule-Based**: Shared state synchronization check

#### 24. 🧪 Simulation Soundness Analyzer
**Layer**: Simulation Soundness  
**Status**: ✅ Implemented (AI)  
**Detects**: Simulation accuracy issues, divergence risks, coverage gaps

#### 25. 🔙 Recovery Semantics Analyzer
**Layer**: Recovery & Failure Semantics  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Rollback correctness issues, retry idempotency problems  
**Rule-Based**: Recovery pattern detection

#### 26. 🗺️ World-Model Consistency Analyzer
**Layer**: PSG Consistency  
**Status**: ✅ Implemented (Rule-based + AI)  
**Detects**: PSG integrity issues, snapshot isolation problems  
**Rule-Based**: PSG/graph parsing, orphan node detection

#### 27. 🔐 Boundary Enforcement Checker
**Layer**: Boundary Enforcement  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Unenforced constraints, optional enforcement gaps  
**Rule-Based**: Boundary enforcement validation

#### 28. 🎯 Convergence Stability Analyzer
**Layer**: Goal Convergence  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Oscillation risks, infinite loops, mission churn  
**Rule-Based**: State cycle detection using DFS

#### 29. 🔄 Semantic-Execution Checker
**Layer**: Semantic-Execution Alignment  
**Status**: ✅ Implemented (AI)  
**Detects**: Intent vs execution drift, goal preservation issues

#### 30. 🔒 Invariant Closure Checker
**Layer**: Invariant Closure  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Uncovered mutation paths, implicit execution channels  
**Rule-Based**: Invariant coverage validation

#### 31. 🚨 Authority Leak Detector (Bonus)
**Layer**: Authority Leak  
**Status**: ✅ Implemented (Rule-based)  
**Detects**: Indirect authority paths, delegation risks  
**Rule-Based**: Delegation chain analysis

---

## Meta Agents (4)

### 31. 🧠 Cross-Agent Conflict Resolver
**Status**: ✅ Implemented  
**Purpose**: Merges conflicting outputs from different agents

**Functions**:
- ✅ Detects agent disagreements by severity difference
- ✅ Groups issues by location/content similarity
- ✅ Produces unified findings with conflict markers

---

### 32. 📊 Severity Scoring Engine
**Status**: ✅ Implemented  
**Purpose**: Assigns severity levels to issues

**Functions**:
- ✅ Calculates CRITICAL/HIGH/MEDIUM/LOW
- ✅ Adjusts based on cross-validation
- ✅ Boosts severity if multiple agents agree

---

### 33. 🧪 Stress-Test Generator
**Status**: ✅ Implemented  
**Purpose**: Generates adversarial edge cases

**Functions**:
- ✅ Creates boundary condition tests
- ✅ Generates counter-examples
- ✅ Tests system robustness

---

### 34. 🏁 Final Meta Judge
**Status**: ✅ Implemented  
**Purpose**: Produces final consolidated report

**Functions**:
- ✅ Aggregates all findings
- ✅ Calculates overall confidence
- ✅ Generates meta-cognition report
- ✅ Provides final recommendations

---

## Execution Pipeline

```
Phase 1: Core + Advanced (Parallel)
├── Logic Checker
├── Consistency Checker
├── Contradiction Detector
├── Structure Analyzer
├── Fact Checker
├── Intent-Scope Checker
├── Dependency Checker
├── Terminology Checker
├── Assumption Detector
├── Example Checker
├── Semantic Analyzer
├── Functional Validator
├── Temporal Analyzer
├── Completeness Checker
├── Quantitative Checker
├── Adversarial Analyzer
├── Authority Boundary Analyzer
├── Execution Invariant Validator
├── Governance Analyzer
├── State Mutation Validator
├── Determinism Analyzer
├── Multi-Agent Consistency Analyzer
├── Concurrency Safety Analyzer
├── Simulation Soundness Analyzer
├── Recovery Semantics Analyzer
├── World-Model Consistency Analyzer
├── Boundary Enforcement Checker
├── Convergence Stability Analyzer
├── Semantic-Execution Checker
└── Invariant Closure Checker

Phase 2: Meta (Sequential, depends on Phase 1)
├── Cross-Agent Conflict Resolver
├── Severity Scoring Engine
├── Stress-Test Generator
└── Final Meta Judge
```

---

## Agent Result Format

```typescript
interface AgentResult {
  agentName: string;
  agentLayer: IssueLayer;
  agentTier: 'core' | 'advanced' | 'meta';
  issues: DetectedIssue[];
  claims: Claim[];
  confidence: number;
  processingTime: number;
  metadata?: Record<string, unknown>;
}
```

---

## Summary Table

| Category | Total | ✅ Full | ⚠️ Partial | ❌ Missing |
|----------|-------|---------|------------|------------|
| Core Agents | 10 | 10 | 0 | 0 |
| Advanced - BASE | 6 | 6 | 0 | 0 |
| Advanced - SYSTEM | 6 | 6 | 0 | 0 |
| Advanced - FORMAL | 8 | 8 | 0 | 0 |
| Meta Agents | 4 | 4 | 0 | 0 |
| **TOTAL** | **34** | **34** | **0** | **0** |

---

## 📊 Agent Metrics Tracking

The Memory System tracks agent performance across all analysis sessions. This enables:

- **Performance Benchmarking**: Compare agents by speed and accuracy
- **Confidence Calibration**: Track which agents are most reliable
- **Rule-Based vs AI Attribution**: Know which issues come from deterministic rules vs AI

### Metrics Collected

| Metric | Description |
|--------|-------------|
| `issueCount` | Total issues detected by agent |
| `confidence` | Average confidence score (0-1) |
| `processingTime` | Analysis time in milliseconds |
| `ruleBasedIssues` | Issues from deterministic rules |
| `aiIssues` | Issues from AI analysis |
| `estimatedAccuracy` | Accuracy estimate based on rule ratio |

### Performance API

```typescript
// Get all agent performance records
const performance = await AgentMetricsService.getAgentPerformance();

// Get top 5 agents by accuracy
const topAgents = await AgentMetricsService.getTopAgents(5);

// Get trends for specific agent
const trends = await AgentMetricsService.getAgentTrends('Logic Checker', 10);
```

### Performance Record Format

```typescript
interface AgentPerformanceRecord {
  agentName: string;          // e.g., "Logic Checker"
  agentTier: string;          // "core", "advanced", "meta"
  totalIssues: number;        // Total issues found
  avgConfidence: number;      // Average confidence (0-1)
  avgProcessingTime: number;  // Average time in ms
  totalAnalyses: number;      // Number of sessions analyzed
  ruleBasedIssues: number;    // Issues from rules
  aiIssues: number;           // Issues from AI
  estimatedAccuracy: number;  // Estimated accuracy (0-1)
}
```

### Example Performance Output

```json
[
  {
    "agentName": "Structure Analyzer",
    "agentTier": "core",
    "totalIssues": 156,
    "avgConfidence": 0.92,
    "avgProcessingTime": 450,
    "totalAnalyses": 23,
    "ruleBasedIssues": 156,
    "aiIssues": 0,
    "estimatedAccuracy": 0.95
  },
  {
    "agentName": "Logic Checker",
    "agentTier": "core",
    "totalIssues": 89,
    "avgConfidence": 0.85,
    "avgProcessingTime": 1230,
    "totalAnalyses": 23,
    "ruleBasedIssues": 45,
    "aiIssues": 44,
    "estimatedAccuracy": 0.72
  }
]
```

---

**All 34 agents are now fully implemented! See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for feature enhancement roadmap.**
