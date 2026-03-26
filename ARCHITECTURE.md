# 🏗️ Architecture - Document Intelligence Engine

## System Overview

The Document Intelligence Engine is a multi-layered AI-powered document analysis system designed to detect hallucinations, contradictions, and various quality issues across **42 analysis layers** using **55 specialized agents** with a **5-level severity system**.

> **📋 See [GAP_ANALYSIS.md](./docs/GAP_ANALYSIS.md) for implementation status and known issues.**

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT INTELLIGENCE ENGINE                      │
│                           55 Agents • 42 Layers                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        PRESENTATION LAYER                           │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  Frontend (Next.js 16 + React 19 + Tailwind CSS 4)         │   │ │
│  │  │  - File Upload Interface                                    │   │ │
│  │  │  - Real-time Progress Visualization                         │   │ │
│  │  │  - Interactive Dashboard                                    │   │ │
│  │  │  - Issue Cards & Detail Views                               │   │ │
│  │  │  - Export Functionality                                     │   │ │
│  │  │  - Reasoning Trace Visualization                            │   │ │
│  │  │  - Cross-Layer Validation Dashboard                         │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                           API LAYER                                │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  Next.js API Routes (/api/analyze)                          │   │ │
│  │  │  - POST: createSession, analyze                             │   │ │
│  │  │  - GET: retrieve sessions, results                          │   │ │
│  │  │  - POST: getMemoryDashboard, getAgentPerformance            │   │ │
│  │  │  - POST: getReasoningTrace, getCrossLayerValidation         │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    MULTI-AGENT ANALYSIS LAYER                      │ │
│  │  ┌───────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Meta Analyzer (Orchestrator)               │ │ │
│  │  │  - Agent Initialization (55 agents)                          │ │ │
│  │  │  - Parallel Agent Execution                                  │ │ │
│  │  │  - Cross-Layer Validation (5 rules)                          │ │ │
│  │  │  - Reasoning Trace Generation                                │ │ │
│  │  │  - Health Score Calculation                                  │ │ │
│  │  │  - Evidence Binding & Uncertainty Propagation                │ │ │
│  │  └───────────────────────────────────────────────────────────────┘ │ │
│  │                              │                                      │ │
│  │    ┌───────────┬───────────┬───────────┬───────────┬───────────┐   │ │
│  │    ▼           ▼           ▼           ▼           ▼           ▼   │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │ │
│  │  │CORE(10)│ │ADV(20) │ │POLICY  │ │FORMAL  │ │VALID   │ │META(4) │ │ │
│  │  │✅ Impl │ │✅ Impl │ │ENG(4)  │ │VERIF(7)│ │(4)     │ │✅ Impl │ │ │
│  │  │        │ │        │ │🆕 NEW  │ │🆕 NEW  │ │🆕 NEW  │ │        │ │ │
│  │  │Logic   │ │BASE(6):│ │        │ │        │ │        │ │Conflict│ │ │
│  │  │Checker │ │Semantic│ │Policy  │ │Inv Enf │ │Context │ │Resolver│ │ │
│  │  │Consist │ │Function│ │Engine  │ │Det Aud │ │Valid   │ │Severity│ │ │
│  │  │Contrad │ │Temporal│ │Rule    │ │Spec    │ │Memory  │ │Engine  │ │ │
│  │  │Struct  │ │Complete│ │Conflict│ │Compl   │ │Safety  │ │Stress  │ │ │
│  │  │Fact    │ │Quant   │ │Resolver│ │Ambig   │ │Perform │ │Test Gen│ │ │
│  │  │Intent  │ │Advers  │ │Audit   │ │State   │ │        │ │Final   │ │ │
│  │  │Depend  │ │        │ │Trail   │ │Explode │ │        │ │Judge   │ │ │
│  │  │Term    │ │SYSTEM  │ │Override│ │Advers  │ │        │ │        │ │ │
│  │  │Assump  │ │CORE(6):│ │Control │ │Formal  │ │        │ │        │ │ │
│  │  │Example │ │Authority│ │        │ │Verif   │ │        │ │        │ │ │
│  │  │        │ │Inv     │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Govern  │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │State   │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Det     │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Multi   │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │        │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │FORMAL  │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │(8):    │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Concurs │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Simul   │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Recov   │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │World   │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Bound   │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Conv    │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Sem-Ex  │ │        │ │        │ │        │ │        │ │ │
│  │  │        │ │Inv Cl  │ │        │ │        │ │        │ │        │ │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     DOCUMENT PARSING LAYER                         │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ✅ Markdown Parser (AST-based)                             │   │ │
│  │  │  - Chunk Extraction (headings, paragraphs, code, lists)     │   │ │
│  │  │  - Heading Hierarchy Analysis                               │   │ │
│  │  │  - Code Block Detection                                     │   │ │
│  │  │  - Link Reference Extraction                                │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ✅ Knowledge Graph Builder                                 │   │ │
│  │  │  - Node Generation (sections, claims, definitions)          │   │ │
│  │  │  - Edge Creation (relationships, dependencies)              │   │ │
│  │  │  - Claim Extraction (facts, opinions, inferences)           │   │ │
│  │  │  - Definition Extraction                                    │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ✅ Reasoning Trace Extractor (NEW)                         │   │ │
│  │  │  - Parse evidence bindings                                  │   │ │
│  │  │  - Extract uncertainty markers                              │   │ │
│  │  │  - Identify multi-step reasoning chains                     │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ✅ State Mutation Extractor                                │   │ │
│  │  │  - Parse state transition patterns                          │   │ │
│  │  │  - Extract pre/postconditions                              │   │ │
│  │  │  - Identify mutation authority                             │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ✅ Governance Checkpoint Detector                          │   │ │
│  │  │  - Parse validation rules                                   │   │ │
│  │  │  - Extract enforcement points                               │   │ │
│  │  │  - Identify bypass channels                                 │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ✅ Authority Model Parser                                  │   │ │
│  │  │  - Parse permission boundaries                              │   │ │
│  │  │  - Extract authority levels                                 │   │ │
│  │  │  - Identify escalation paths                                │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         AI/LLM LAYER                               │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  OpenAI-Compatible API (User Configurable)                  │   │ │
│  │  │  - Supports: OpenAI, Azure, Ollama, LM Studio, Groq, etc.  │   │ │
│  │  │  - Chat Completions                                         │   │ │
│  │  │  - Structured JSON Output                                   │   │ │
│  │  │  - Multi-turn Context Management                            │   │ │
│  │  │  - Token Usage Tracking                                     │   │ │
│  │  │  - Encrypted API Key Storage                                │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        DATA LAYER                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  Prisma ORM + SQLite                                        │   │ │
│  │  │  - AnalysisSession (analysis metadata)                      │   │ │
│  │  │  - AnalysisFile (uploaded file content)                     │   │ │
│  │  │  - Issue (detected issues with 5-level severity)            │   │ │
│  │  │  - ReasoningTrace (reasoning chain data)                    │   │ │
│  │  │  - CrossLayerValidation (validation results)                │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Document Parser (`src/lib/parsers/document-parser.ts`)

**Purpose**: Parse markdown documents into structured data and build knowledge graphs.

**Implemented Features**:
- ✅ AST-based parsing (no regex-heavy approach)
- ✅ Chunk extraction by type (headings, paragraphs, code, lists, tables, quotes)
- ✅ Heading hierarchy analysis with parent-child relationships
- ✅ Code block detection with language identification
- ✅ Link extraction and classification (internal/external)
- ✅ Knowledge graph construction (nodes, edges, claims, definitions, references)
- ✅ Reasoning trace extraction (evidence bindings, uncertainty markers)
- ✅ State mutation extraction (for Layers 11-42)
- ✅ Governance checkpoint detection (for Layer 14)
- ✅ Authority model parsing (for Layer 12)
- ✅ Entity relationship mapping
- ✅ Execution path extraction
- ✅ Invariant extraction

**Output**:
```typescript
interface ParsedDocument {
  chunks: DocumentChunk[];
  graph: DocumentGraph;
  headings: HeadingInfo[];
  codeBlocks: CodeBlockInfo[];
  links: LinkInfo[];
  lists: ListInfo[];
  reasoningTraces: ReasoningTrace[];
}

interface DocumentGraph {
  nodes: GraphNode[];           // ✅ Populated
  edges: GraphEdge[];           // ✅ Populated
  claims: Claim[];              // ✅ Populated
  definitions: Definition[];    // ✅ Populated
  references: Reference[];      // ✅ Populated
  entities: Entity[];           // ✅ Populated
  stateMutations: StateMutation[];     // ✅ Populated
  executionPaths: ExecutionPath[];     // ✅ Populated
  governanceCheckpoints: GovernanceCheckpoint[]; // ✅ Populated
  reasoningTraces: ReasoningTrace[];   // ✅ Populated (NEW)
}
```

### 2. Agent System (`src/lib/agents/`)

**Purpose**: Multi-agent analysis architecture for comprehensive document validation.

#### Core Agents (`core-agents.ts`) - 10 Agents ✅

| Agent | Layer | Rule-Based | AI | Status |
|-------|-------|------------|-----|--------|
| Logic Checker | Logical | ✅ Circular defs, absolute claims | ✅ Fallacies | ✅ Full |
| Consistency Checker | Contradiction | ✅ Terminology, capitalization | ❌ | ⚠️ Partial |
| Contradiction Detector | Contradiction | ✅ Negation patterns | ✅ Semantic | ✅ Full |
| Structure Analyzer | Structural | ✅ Hierarchy, links, empty sections | ❌ | ✅ Full |
| Fact Checker | Factual | ✅ Statistics, citations | ❌ | ⚠️ Partial |
| Intent-Scope Checker | Intent | ❌ | ✅ | ⚠️ AI-only |
| Dependency Checker | Structural | ✅ Reference validation | ❌ | ✅ Full |
| Terminology Checker | Semantic | ✅ Synonym detection | ❌ | ✅ Full |
| Assumption Detector | Semantic | ❌ | ✅ | ⚠️ AI-only |
| Example Checker | Factual | ❌ | ✅ | ⚠️ AI-only |

#### Advanced Agents (`advanced-agents.ts`) - 20 Agents ✅

| Category | Count | Rule-Based | AI-Only | Status |
|----------|-------|------------|---------|--------|
| BASE Advanced | 6 | 40% | 60% | ✅ Enhanced |
| SYSTEM CORE | 6 | 70% | 30% | ✅ Enhanced |
| FORMAL SYSTEM | 8 | 50% | 50% | ✅ Enhanced |

**Enhanced**: SYSTEM CORE and FORMAL SYSTEM agents now have comprehensive rule-based validation:
- ✅ Execution invariant bypass paths
- ✅ Authority escalation channels
- ✅ Nondeterministic execution branches
- ✅ Governance enforcement gaps

#### Policy Engine Agents (`policy-agents.ts`) - 4 Agents 🆕 NEW

| Agent | Purpose | Status |
|-------|---------|--------|
| Policy Engine | Evaluate policy compliance and rule adherence | ✅ Implemented |
| Rule Conflict Resolver | Detect and resolve conflicting policy rules | ✅ Implemented |
| Audit Trail Generator | Generate audit trails for policy decisions | ✅ Implemented |
| Override Controller | Validate and control override mechanisms | ✅ Implemented |

#### Formal Verification Agents (`formal-verification-agents.ts`) - 7 Agents 🆕 NEW

| Agent | Purpose | Status |
|-------|---------|--------|
| Invariant Enforcer | Ensure invariants are enforced at all times | ✅ Implemented |
| Determinism Auditor | Audit for deterministic behavior | ✅ Implemented |
| Spec Compliance | Verify specification compliance | ✅ Implemented |
| Ambiguity Eliminator | Eliminate ambiguous specifications | ✅ Implemented |
| State Explosion Controller | Control state space explosion | ✅ Implemented |
| Adversarial Tester | Perform adversarial testing | ✅ Implemented |
| Formal Verifier | Perform formal verification proofs | ✅ Implemented |

#### Validation Agents (`validation-agents.ts`) - 4 Agents 🆕 NEW

| Agent | Purpose | Status |
|-------|---------|--------|
| Context Validator | Validate context consistency | ✅ Implemented |
| Memory Integrity | Validate memory integrity | ✅ Implemented |
| Safety Validator | Validate safety properties | ✅ Implemented |
| Performance Validator | Validate performance constraints | ✅ Implemented |

#### Meta Agents (`meta-agents.ts`) - 4 Agents ✅

| Agent | Purpose | Status |
|-------|---------|--------|
| Cross-Agent Conflict Resolver | Merge conflicting outputs | ✅ |
| Severity Scoring Engine | Assign severity levels (5 levels) | ✅ |
| Stress-Test Generator | Generate adversarial edge cases | ✅ |
| Final Meta Judge | Produce consolidated report | ✅ |

### 3. Meta Analyzer (`meta-analyzer.ts`)

**Purpose**: Orchestrates all agents and performs cross-validation.

**Key Responsibilities**:
- ✅ Initialize and manage all agent instances
- ✅ Execute agents in parallel for performance
- ✅ Cross-validate findings between agents
- ✅ Calculate confidence scores
- ✅ Generate meta-cognition reports
- ✅ Calculate document health scores
- ✅ Calculate execution safety scores
- ✅ Calculate governance scores
- ✅ Calculate reasoning trace scores (NEW)
- ✅ Calculate evidence binding scores (NEW)
- ✅ Calculate policy compliance scores (NEW)
- ✅ Calculate cross-layer validation scores (NEW)
- ✅ Perform cross-layer validation with 5 rules (NEW)

**Cross-Validation Algorithm**:
```
1. Collect all issues from all agents
2. Group issues by type and location similarity
3. If multiple agents detect same issue:
   - Increase confidence score (+0.15)
   - Add cross-references
4. If single agent detects issue:
   - Apply confidence threshold (0.8)
   - Mark as "uncertain" if below threshold
5. Run Cross-Layer Validation (5 rules):
   - Rule 1: Layer consistency check
   - Rule 2: Severity alignment check
   - Rule 3: Evidence binding validation
   - Rule 4: Uncertainty propagation check
   - Rule 5: Multi-step reasoning validation
6. Generate meta-cognition report
7. Generate reasoning trace report
```

**Limitations**:
- Doesn't consider layer compatibility
- Doesn't weight agent credibility
- Doesn't handle conflicting findings (A says X, B says not-X)

### 4. Reasoning Trace System 🆕 NEW

**Purpose**: Track and validate reasoning chains through the document.

**Components**:
- **Evidence Binding**: Links claims to supporting evidence
- **Uncertainty Propagation**: Tracks uncertainty through reasoning chains
- **Multi-Step Validation**: Validates multi-step reasoning processes

**Data Model**:
```typescript
interface ReasoningTrace {
  id: string;
  claimId: string;
  evidenceBindings: EvidenceBinding[];
  uncertaintyScore: number;
  validationSteps: ValidationStep[];
  crossLayerReferences: string[];
}

interface EvidenceBinding {
  evidenceId: string;
  claimId: string;
  bindingStrength: number;
  source: string;
}

interface ValidationStep {
  stepId: string;
  type: 'premise' | 'inference' | 'conclusion';
  content: string;
  confidence: number;
  dependencies: string[];
}
```

### 5. Cross-Layer Validation System 🆕 NEW

**Purpose**: Ensure consistency across all 42 analysis layers.

**Validation Rules**:

| Rule | Description | Severity Impact |
|------|-------------|-----------------|
| Rule 1: Layer Consistency | Issues in related layers should be consistent | +1 severity level if inconsistent |
| Rule 2: Severity Alignment | Severity should match across layers for same issue | Adjust to highest severity |
| Rule 3: Evidence Binding | All claims must have bound evidence | CRITICAL if missing |
| Rule 4: Uncertainty Propagation | Uncertainty must propagate correctly | +0.5 severity if broken chain |
| Rule 5: Multi-Step Reasoning | Multi-step reasoning must be complete | HIGH if incomplete |

### 6. API Layer (`src/app/api/analyze/route.ts`)

**Endpoints**:

| Method | Action | Description |
|--------|--------|-------------|
| POST | createSession | Create new analysis session |
| POST | analyze | Run full analysis |
| GET | - | Retrieve session/results |
| POST | getReasoningTrace | Get reasoning trace data |
| POST | getCrossLayerValidation | Get cross-layer validation results |

**Analysis Flow**:
```
1. Create session in database
2. Parse all documents
3. Build cross-document knowledge graph
4. Initialize all 55 agents
5. Run agents in parallel (Core + Advanced + Policy + Formal Verification + Validation first, then Meta)
6. Cross-validate results
7. Calculate health/safety/governance scores
8. Calculate reasoning trace scores
9. Calculate policy compliance scores
10. Run cross-layer validation
11. Save results to database
12. Return comprehensive response
```

### 7. Frontend (`src/app/page.tsx`)

**Key Components**:
- ✅ Drag & drop file upload
- ✅ Real-time agent progress visualization
- ✅ Document health score gauge
- ✅ Layer scores panel (42 layers)
- ✅ Agent performance panel
- ✅ Meta-cognition report display
- ✅ Issue list with filtering
- ✅ Issue detail dialog with evidence
- ✅ Export functionality
- ✅ Reasoning trace visualization (NEW)
- ✅ Cross-layer validation dashboard (NEW)
- ✅ Execution safety score gauge
- ✅ Governance score visualization
- ✅ Policy compliance visualization (NEW)
- ✅ Layer grouping (BASE/SYSTEM CORE/FORMAL SYSTEM/POLICY ENGINE/FORMAL VERIFICATION/VALIDATION)
- ✅ Agent tier indicators (6 tiers)

## Data Models

### Prisma Schema

```prisma
model AnalysisSession {
  id          String   @id @default(cuid())
  name        String
  status      String   // pending, analyzing, completed, failed
  fileCount   Int      @default(0)
  totalIssues Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  files       AnalysisFile[]
  issues      Issue[]
  reasoningTraces ReasoningTrace[]
  crossLayerValidations CrossLayerValidation[]
}

model AnalysisFile {
  id          String          @id @default(cuid())
  sessionId   String
  filename    String
  content     String
  wordCount   Int             @default(0)
  createdAt   DateTime        @default(now())
  session     AnalysisSession @relation(fields: [sessionId], references: [id])
  issues      Issue[]
}

model Issue {
  id          String       @id @default(cuid())
  sessionId   String
  fileId      String?
  type        String       // hallucination, contradiction, policy_violation, etc.
  severity    String       // critical, high, medium, low, info (5 levels)
  title       String
  description String
  location    String?
  suggestion  String?
  createdAt   DateTime     @default(now())
  session     AnalysisSession @relation(fields: [sessionId], references: [id])
  file        AnalysisFile?  @relation(fields: [fileId], references: [id])
}

model ReasoningTrace {
  id              String   @id @default(cuid())
  sessionId       String
  claimId         String
  evidenceBindings String // JSON array
  uncertaintyScore Float
  validationSteps String  // JSON array
  createdAt       DateTime @default(now())
  session         AnalysisSession @relation(fields: [sessionId], references: [id])
}

model CrossLayerValidation {
  id              String   @id @default(cuid())
  sessionId       String
  ruleId          Int      // 1-5
  layerId         String
  status          String   // pass, fail, warning
  details         String   // JSON
  createdAt       DateTime @default(now())
  session         AnalysisSession @relation(fields: [sessionId], references: [id])
}
```

## Knowledge Graph Structure

```typescript
interface DocumentGraph {
  // ✅ Implemented
  nodes: GraphNode[];           // Sections, claims, definitions
  edges: GraphEdge[];           // Relationships between nodes
  claims: Claim[];              // Extracted assertions
  definitions: Definition[];    // Term definitions
  references: Reference[];      // Links and citations
  entities: Entity[];           // Agents, components, authorities
  stateMutations: StateMutation[];     // State transitions
  executionPaths: ExecutionPath[];     // Workflow steps
  governanceCheckpoints: GovernanceCheckpoint[]; // Validation points
  reasoningTraces: ReasoningTrace[];   // Reasoning chains (NEW)
}

interface GraphNode {
  id: string;
  type: 'section' | 'claim' | 'definition' | 'code' | 'reference';
  label: string;
  content: string;
  location: string;
  fileName: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'contains' | 'references' | 'contradicts' | 'supports' | 'defines';
  weight: number;
}
```

## Severity System (5 Levels)

### CRITICAL 🔴
- Direct contradictions
- Fabricated information
- Broken functionality
- Major logical errors
- Execution safety violations
- Authority boundary breaches
- Policy violations
- Invariant violations

### HIGH 🟠
- Significant inconsistencies
- Missing critical information
- Governance gaps
- Determinism concerns
- Spec violations
- Safety property violations

### MEDIUM 🟡
- Minor inconsistencies
- Missing non-critical information
- Quality concerns
- Ambiguity issues
- Performance degradation
- Memory integrity issues

### LOW 🟢
- Style suggestions
- Minor improvements
- Documentation gaps
- Context mismatches
- Minor policy deviations

### INFO 🔵
- Best practice reminders
- Advisory notes
- Optimization suggestions
- Informational findings

## Anti-Hallucination Techniques

### 1. Multi-Agent Cross-Validation
- Multiple agents analyze the same content
- Findings that multiple agents agree on get boosted confidence
- Single-agent findings require higher confidence threshold

### 2. Evidence Grounding
- Every finding must cite exact document text
- AI is prompted: "Where is the proof in this document?"
- Evidence field contains quoted text

### 3. Rule-Based + AI Hybrid
- Structural analysis uses pure AST parsing (no AI hallucination)
- Terminology checks use regex patterns
- AI adds semantic understanding on top of rules

### 4. Confidence Scoring
- Each issue has 0-100% confidence
- Confidence increased by cross-validation (+15%)
- Confidence decreased by agent disagreement

### 5. Adversarial Testing
- Dedicated agent tries to DISPROVE claims
- Generates counter-arguments
- Tests boundary conditions

### 6. Meta-Cognition
- System monitors its own confidence
- Tracks agent agreement levels
- Identifies disagreement points for human review

### 7. Reasoning Trace Validation 🆕 NEW
- Every reasoning step is tracked
- Evidence bindings are validated
- Uncertainty is properly propagated
- Multi-step reasoning is verified

### 8. Cross-Layer Validation 🆕 NEW
- Consistency checks across all 42 layers
- Severity alignment verification
- Evidence binding completeness
- Reasoning chain integrity

## Performance Considerations

- **Parallel Agent Execution**: All agents run concurrently using `Promise.all()`
- **Singleton AI Instance**: ZAI instance reused across requests
- **Chunked Content**: Large documents processed in chunks
- **Indexed Database**: SQLite with proper indexing on session/file IDs
- **Reasoning Trace Caching**: Reasoning traces are cached for reuse
- **Cross-Layer Validation Optimization**: Validation rules run in parallel

## Error Handling

- **Graceful Degradation**: If one agent fails, others continue
- **JSON Parsing Fallback**: Multiple attempts to parse AI response
- **Timeout Protection**: API timeouts prevent hanging
- **Error Storage**: Failed analyses stored with error status
- **Reasoning Trace Recovery**: Partial traces are preserved

---

## AI Configuration System

The Document Intelligence Engine supports **any OpenAI-compatible API provider**, giving users complete flexibility in their AI backend choice.

### Supported Providers

| Provider | Base URL | Notes |
|----------|----------|-------|
| **OpenAI** | `https://api.openai.com/v1` | GPT-4o, GPT-4-turbo, GPT-3.5-turbo |
| **Azure OpenAI** | `https://{resource}.openai.azure.com/...` | Your Azure deployments |
| **Ollama (Local)** | `http://localhost:11434/v1` | Llama 3, Mistral, CodeLlama, Phi-3 |
| **LM Studio (Local)** | `http://localhost:1234/v1` | Any local model |
| **Groq** | `https://api.groq.com/openai/v1` | Fast inference (Llama 3.3 70B) |
| **Together AI** | `https://api.together.xyz/v1` | Open-source models |
| **Anthropic** | `https://api.anthropic.com/v1` | Claude 3.5 Sonnet (via proxy) |
| **Custom** | Any URL | Any OpenAI-compatible endpoint |

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI CONFIGURATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    FRONTEND (AI Settings Modal)                    │ │
│  │  - Provider preset selection (8 providers)                        │ │
│  │  - Base URL configuration                                          │ │
│  │  - API Key input (masked, encrypted)                              │ │
│  │  - Model selection dropdown                                        │ │
│  │  - Temperature & max tokens sliders                               │ │
│  │  - Connection validation button                                    │ │
│  │  - Usage statistics display                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    API LAYER (/api/ai-settings)                    │ │
│  │  - GET ?action=status - Get configuration status                  │ │
│  │  - GET ?action=active - Get active configuration                  │ │
│  │  - GET ?action=list - List all configurations                     │ │
│  │  - POST action=save - Save configuration                           │ │
│  │  - POST action=validate - Test connection                          │ │
│  │  - POST action=activate - Switch active config                    │ │
│  │  - POST action=delete - Remove configuration                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    OPENAI CLIENT (src/lib/ai/)                     │ │
│  │  - OpenAI SDK initialization with user config                     │ │
│  │  - XOR encryption for API keys (upgradeable)                       │ │
│  │  - Connection validation via models.list()                         │ │
│  │  - Token usage tracking                                            │ │
│  │  - Error handling & fallback                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    DATABASE (Prisma Schema)                        │ │
│  │  model AISettings {                                                │ │
│  │    name              String   @unique                              │ │
│  │    displayName       String?                                       │ │
│  │    baseUrl           String                                        │ │
│  │    apiKey            String   // Encrypted                         │ │
│  │    modelName         String                                        │ │
│  │    maxTokens         Int     @default(4096)                        │ │
│  │    temperature       Float   @default(0.7)                         │ │
│  │    isActive          Boolean @default(true)                        │ │
│  │    validationStatus  String  @default("pending")                   │ │
│  │    totalApiCalls     Int     @default(0)                           │ │
│  │    totalTokensUsed   Int     @default(0)                           │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration Flow

```
1. User opens AI Settings Modal
2. Selects provider preset (auto-fills URL & models)
3. Enters API key
4. Clicks "Validate" → API tests connection
5. On success: saves encrypted config to database
6. Agents automatically use active config
```

### Security Features

- **Encrypted Storage**: API keys are XOR-encrypted before storage
- **Masked Display**: Keys shown as `••••••••abcd` in UI
- **Local Processing**: Keys never sent to third parties
- **Validation**: Connection tested before saving

---

## Memory System Architecture

The Memory System provides historical tracking, agent performance metrics, and document caching for improved performance and insights.

### Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MEMORY SYSTEM LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    DOCUMENT CACHE SERVICE                          │ │
│  │  - SHA256 content hashing                                          │ │
│  │  - Parsed document caching (avoid re-parsing)                      │ │
│  │  - Access tracking and TTL management                              │ │
│  │  - Cache statistics (hit rate, entity counts)                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    AGENT METRICS SERVICE                           │ │
│  │  - Per-session agent performance recording                         │ │
│  │  - Confidence and processing time tracking                         │ │
│  │  - Rule-based vs AI issue attribution                              │ │
│  │  - Agent accuracy estimation                                       │ │
│  │  - Performance trends and top agent identification                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 HISTORICAL STATISTICS SERVICE                      │ │
│  │  - Daily aggregated statistics                                      │ │
│  │  - Running averages for scores (health, safety, governance)        │ │
│  │  - Issue rate tracking (critical/high/medium/low/info)             │ │
│  │  - Word count and analysis time metrics                            │ │
│  │  - Recent session tracking                                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      MEMORY SERVICE (Unified)                      │ │
│  │  - Combined interface for all memory operations                    │ │
│  │  - Dashboard data aggregation                                      │ │
│  │  - Analysis recording workflow                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Models

```prisma
// Agent Performance Tracking
model AgentMetric {
  id              String   @id @default(cuid())
  sessionId       String
  agentName       String
  agentTier       String   // core, advanced, policy, formal_verification, validation, meta
  agentLayer      String   // primary layer
  issueCount      Int      @default(0)
  confidence      Float    @default(0)
  processingTime  Int      @default(0) // milliseconds
  ruleBasedIssues Int      @default(0)
  aiIssues        Int      @default(0)
  accuracy        Float?   // calculated if validated
  createdAt       DateTime @default(now())
}

// Document Cache
model DocumentCache {
  id              String   @id @default(cuid())
  contentHash     String   @unique // SHA256
  parsedData      String   // JSON ParsedDocument
  entityCount     Int      @default(0)
  claimCount      Int      @default(0)
  definitionCount Int      @default(0)
  mutationCount   Int      @default(0)
  lastAccessed    DateTime @default(now())
  accessCount     Int      @default(0)
}

// Historical Statistics
model AnalysisStatistics {
  id                  String   @id @default(cuid())
  date                String   @unique // YYYY-MM-DD
  totalAnalyses       Int      @default(0)
  totalIssues         Int      @default(0)
  criticalIssues      Int      @default(0)
  highIssues          Int      @default(0)
  mediumIssues        Int      @default(0)
  lowIssues           Int      @default(0)
  infoIssues          Int      @default(0)
  avgDocumentHealth   Float    @default(0)
  avgExecutionSafety  Float    @default(0)
  avgGovernance       Float    @default(0)
  avgDeterminism      Float    @default(0)
  avgReasoningTrace   Float    @default(0)
  avgPolicyCompliance Float    @default(0)
  avgConfidence       Float    @default(0)
  avgAnalysisTime     Int      @default(0)
  totalWordsProcessed Int      @default(0)
}
```

### Memory Service API

```typescript
// Document Caching
DocumentCacheService.getCached(content: string): ParsedDocument | null
DocumentCacheService.cacheDocument(content: string, parsed: ParsedDocument): void
DocumentCacheService.getCacheStats(): CacheStats

// Agent Metrics
AgentMetricsService.recordAgentMetrics(sessionId, agentResults): void
AgentMetricsService.getAgentPerformance(): AgentPerformanceRecord[]
AgentMetricsService.getTopAgents(limit: number): AgentPerformanceRecord[]
AgentMetricsService.getAgentTrends(agentName: string): AgentTrend[]

// Historical Stats
HistoricalStatsService.updateDailyStats(date, analysisData): void
HistoricalStatsService.getOverallStats(): HistoricalStats
HistoricalStatsService.getDailyStats(days: number): DailyStats[]
HistoricalStatsService.getRecentSessions(limit: number): Session[]

// Unified Interface
MemoryService.recordAnalysis(sessionId, results): void
MemoryService.getDashboardData(): DashboardData
```

---

## Layer Architecture (42 Layers)

### BASE Layers (1-10)
| Layer | Name | Primary Agent |
|-------|------|---------------|
| 1 | Contradiction | Contradiction Detector |
| 2 | Logical | Logic Checker |
| 3 | Structural | Structure Analyzer |
| 4 | Semantic | Semantic Analyzer |
| 5 | Factual | Fact Checker |
| 6 | Functional | Functional Validator |
| 7 | Temporal | Temporal Analyzer |
| 8 | Architectural | Quantitative Checker |
| 9 | Completeness | Completeness Checker |
| 10 | Intent | Intent-Scope Checker |

### SYSTEM CORE Layers (11-15)
| Layer | Name | Primary Agent |
|-------|------|---------------|
| 11 | Execution Invariant | Execution Invariant Validator |
| 12 | Authority Boundary | Authority Boundary Analyzer |
| 13 | Deterministic | Determinism Analyzer |
| 14 | Governance | Governance Analyzer |
| 15 | PSG Consistency | World-Model Consistency Analyzer |

### FORMAL SYSTEM Layers (16-28)
| Layer | Name | Primary Agent |
|-------|------|---------------|
| 16 | Invariant Closure | Invariant Closure Checker |
| 17 | State Mutation | State Mutation Validator |
| 18 | Authority Leak | Authority Leak Detector |
| 19 | Closed World | Closed World Enforcer |
| 20 | Replay Fidelity | Replay Fidelity Validator |
| 21 | Multi-Agent | Multi-Agent Consistency Analyzer |
| 22 | Execution-PSG Sync | Sync Validator |
| 23 | Recovery | Recovery Semantics Analyzer |
| 24 | Concurrency | Concurrency Safety Analyzer |
| 25 | Boundary Enforcement | Boundary Enforcement Checker |
| 26 | Simulation | Simulation Soundness Analyzer |
| 27 | Convergence | Convergence Stability Analyzer |
| 28 | Semantic-Execution | Semantic-Execution Checker |

### POLICY ENGINE Layers (29-32) 🆕 NEW
| Layer | Name | Primary Agent |
|-------|------|---------------|
| 29 | Policy Compliance | Policy Engine |
| 30 | Rule Conflict Resolution | Rule Conflict Resolver |
| 31 | Audit Trail | Audit Trail Generator |
| 32 | Override Control | Override Controller |

### FORMAL VERIFICATION Layers (33-38) 🆕 NEW
| Layer | Name | Primary Agent |
|-------|------|---------------|
| 33 | Invariant Enforcement | Invariant Enforcer |
| 34 | Determinism Audit | Determinism Auditor |
| 35 | Spec Compliance | Spec Compliance |
| 36 | Ambiguity Elimination | Ambiguity Eliminator |
| 37 | State Explosion Control | State Explosion Controller |
| 38 | Formal Verification | Formal Verifier |

### VALIDATION Layers (39-42) 🆕 NEW
| Layer | Name | Primary Agent |
|-------|------|---------------|
| 39 | Context Validation | Context Validator |
| 40 | Memory Integrity | Memory Integrity |
| 41 | Safety Validation | Safety Validator |
| 42 | Performance Validation | Performance Validator |

---

## Implementation Status Summary

| Component | Status | Gap Level |
|-----------|--------|-----------|
| Core Agents (10) | ✅ Implemented | LOW - Some AI-only |
| Advanced Agents (20) | ✅ Implemented | LOW - Full functionality |
| Policy Engine Agents (4) | ✅ Implemented | LOW - Full functionality |
| Formal Verification Agents (7) | ✅ Implemented | LOW - Full functionality |
| Validation Agents (4) | ✅ Implemented | LOW - Full functionality |
| Meta Agents (4) | ✅ Implemented | LOW - Full functionality |
| Document Parser | ✅ Enhanced | LOW - All extractors implemented |
| Knowledge Graph | ✅ Complete | LOW - All arrays populated |
| API Layer | ✅ Implemented | LOW |
| Frontend | ✅ Full | LOW - All visualizations |
| Memory System | ✅ Implemented | LOW - Full functionality |
| Document Caching | ✅ Implemented | LOW - SHA256 hashing |
| Reasoning Trace System | ✅ Implemented | LOW - Full functionality |
| Cross-Layer Validation | ✅ Implemented | LOW - 5 rules implemented |

---

**See [GAP_ANALYSIS.md](./docs/GAP_ANALYSIS.md) for detailed gap analysis and recommendations.**
