# 🏗️ Architecture - Document Intelligence Engine

## System Overview

The Document Intelligence Engine is a multi-layered AI-powered document analysis system designed to detect hallucinations, contradictions, and various quality issues across **28 analysis layers** using **34 specialized agents**.

> **📋 See [GAP_ANALYSIS.md](./docs/GAP_ANALYSIS.md) for implementation status and known issues.**

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT INTELLIGENCE ENGINE                      │
│                           34 Agents • 28 Layers                          │
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
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    MULTI-AGENT ANALYSIS LAYER                      │ │
│  │  ┌───────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Meta Analyzer (Orchestrator)               │ │ │
│  │  │  - Agent Initialization (34 agents)                          │ │ │
│  │  │  - Parallel Agent Execution                                  │ │ │
│  │  │  - Cross-Validation                                         │ │ │
│  │  │  - Health Score Calculation                                 │ │ │
│  │  └───────────────────────────────────────────────────────────────┘ │ │
│  │                              │                                      │ │
│  │        ┌─────────────────────┼─────────────────────┐               │ │
│  │        ▼                     ▼                     ▼               │ │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐     │ │
│  │  │CORE AGENTS(10)│  │ADVANCED(20)      │  │META AGENTS(4)    │     │ │
│  │  │✅ Implemented │  │⚠️ AI-only        │  │✅ Implemented    │     │ │
│  │  │              │  │                  │  │                  │     │ │
│  │  │Logic Checker │  │BASE(6):          │  │Conflict Resolver │     │ │
│  │  │Consistency   │  │- Semantic        │  │Severity Engine   │     │ │
│  │  │Contradiction │  │- Functional      │  │Stress Test Gen   │     │ │
│  │  │Structure     │  │- Temporal        │  │Final Judge       │     │ │
│  │  │Fact Checker  │  │- Completeness    │  │                  │     │ │
│  │  │Intent-Scope  │  │- Quantitative    │  │                  │     │ │
│  │  │Dependency    │  │- Adversarial     │  │                  │     │ │
│  │  │Terminology   │  │                  │  │                  │     │ │
│  │  │Assumption    │  │SYSTEM(6):        │  │                  │     │ │
│  │  │Example       │  │⚠️ Authority      │  │                  │     │ │
│  │  │              │  │⚠️ Invariant      │  │                  │     │ │
│  │  │              │  │⚠️ Governance     │  │                  │     │ │
│  │  │              │  │⚠️ State Mutation │  │                  │     │ │
│  │  │              │  │⚠️ Determinism    │  │                  │     │ │
│  │  │              │  │⚠️ Multi-Agent    │  │                  │     │ │
│  │  │              │  │                  │  │                  │     │ │
│  │  │              │  │FORMAL(8):        │  │                  │     │ │
│  │  │              │  │⚠️ Concurrency    │  │                  │     │ │
│  │  │              │  │⚠️ Simulation     │  │                  │     │ │
│  │  │              │  │⚠️ Recovery       │  │                  │     │ │
│  │  │              │  │⚠️ World-Model    │  │                  │     │ │
│  │  │              │  │⚠️ Boundary       │  │                  │     │ │
│  │  │              │  │⚠️ Convergence    │  │                  │     │ │
│  │  │              │  │⚠️ Semantic-Exec  │  │                  │     │ │
│  │  │              │  │⚠️ Invariant Cl.  │  │                  │     │ │
│  │  └──────────────┘  └──────────────────┘  └──────────────────┘     │ │
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
│  │  │  ❌ State Mutation Extractor (MISSING)                      │   │ │
│  │  │  - Parse state transition patterns                          │   │ │
│  │  │  - Extract pre/postconditions                              │   │ │
│  │  │  - Identify mutation authority                             │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ❌ Governance Checkpoint Detector (MISSING)                │   │ │
│  │  │  - Parse validation rules                                   │   │ │
│  │  │  - Extract enforcement points                               │   │ │
│  │  │  - Identify bypass channels                                 │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  ❌ Authority Model Parser (MISSING)                        │   │ │
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
│  │  │  z-ai-web-dev-sdk (LLM Integration)                         │   │ │
│  │  │  - Chat Completions                                         │   │ │
│  │  │  - Structured JSON Output                                   │   │ │
│  │  │  - Multi-turn Context Management                            │   │ │
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
│  │  │  - Issue (detected issues)                                  │   │ │
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

**Enhanced Features** (✅ Implemented):
- ✅ State mutation extraction (for Layers 11-28)
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
}

interface DocumentGraph {
  nodes: GraphNode[];           // ✅ Populated
  edges: GraphEdge[];           // ✅ Populated
  claims: Claim[];              // ✅ Populated
  definitions: Definition[];    // ✅ Populated
  references: Reference[];      // ✅ Populated
  entities: Entity[];           // ✅ Populated (ENHANCED)
  stateMutations: StateMutation[];     // ✅ Populated (ENHANCED)
  executionPaths: ExecutionPath[];     // ✅ Populated (ENHANCED)
  governanceCheckpoints: GovernanceCheckpoint[]; // ✅ Populated (ENHANCED)
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

#### Meta Agents (`meta-agents.ts`) - 4 Agents ✅

| Agent | Purpose | Status |
|-------|---------|--------|
| Cross-Agent Conflict Resolver | Merge conflicting outputs | ✅ |
| Severity Scoring Engine | Assign severity levels | ✅ |
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
- ⚠️ Calculate execution safety scores (limited by missing parser)
- ⚠️ Calculate governance scores (limited by missing parser)

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
5. Generate meta-cognition report
```

**Limitations**:
- Doesn't consider layer compatibility
- Doesn't weight agent credibility
- Doesn't handle conflicting findings (A says X, B says not-X)

### 4. API Layer (`src/app/api/analyze/route.ts`)

**Endpoints**:

| Method | Action | Description |
|--------|--------|-------------|
| POST | createSession | Create new analysis session |
| POST | analyze | Run full analysis |
| GET | - | Retrieve session/results |

**Analysis Flow**:
```
1. Create session in database
2. Parse all documents
3. Build cross-document knowledge graph
4. Initialize all 34 agents
5. Run agents in parallel (Core + Advanced first, then Meta)
6. Cross-validate results
7. Calculate health/safety/governance scores
8. Save results to database
9. Return comprehensive response
```

### 5. Frontend (`src/app/page.tsx`)

**Key Components**:
- ✅ Drag & drop file upload
- ✅ Real-time agent progress visualization
- ✅ Document health score gauge
- ⚠️ Layer scores panel (only shows 12/28 layers)
- ⚠️ Agent performance panel (missing tier info)
- ✅ Meta-cognition report display
- ✅ Issue list with filtering
- ✅ Issue detail dialog with evidence
- ✅ Export functionality

**Missing UI Components**:
- ❌ Execution safety score gauge
- ❌ Governance score visualization
- ❌ Layer grouping (BASE/SYSTEM CORE/FORMAL)
- ❌ Agent tier indicators

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
  type        String       // hallucination, contradiction, etc.
  severity    String       // critical, warning, info
  title       String
  description String
  location    String?
  suggestion  String?
  createdAt   DateTime     @default(now())
  session     AnalysisSession @relation(fields: [sessionId], references: [id])
  file        AnalysisFile?  @relation(fields: [fileId], references: [id])
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
  
  // ❌ NOT Implemented (Critical Gap)
  entities: Entity[];           // Agents, components, authorities
  stateMutations: StateMutation[];     // State transitions
  executionPaths: ExecutionPath[];     // Workflow steps
  governanceCheckpoints: GovernanceCheckpoint[]; // Validation points
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

## Performance Considerations

- **Parallel Agent Execution**: All agents run concurrently using `Promise.all()`
- **Singleton AI Instance**: ZAI instance reused across requests
- **Chunked Content**: Large documents processed in chunks
- **Indexed Database**: SQLite with proper indexing on session/file IDs

## Error Handling

- **Graceful Degradation**: If one agent fails, others continue
- **JSON Parsing Fallback**: Multiple attempts to parse AI response
- **Timeout Protection**: API timeouts prevent hanging
- **Error Storage**: Failed analyses stored with error status

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
│  │  - Issue rate tracking (critical/warning/info)                     │ │
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
  agentTier       String   // core, advanced, meta
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
  warningIssues       Int      @default(0)
  infoIssues          Int      @default(0)
  avgDocumentHealth   Float    @default(0)
  avgExecutionSafety  Float    @default(0)
  avgGovernance       Float    @default(0)
  avgDeterminism      Float    @default(0)
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

## Implementation Status Summary

| Component | Status | Gap Level |
|-----------|--------|-----------|
| Core Agents (10) | ✅ Implemented | LOW - Some AI-only |
| Advanced Agents (20) | ✅ Implemented | LOW - Full functionality |
| Meta Agents (4) | ✅ Implemented | LOW - Full functionality |
| Document Parser | ✅ Enhanced | LOW - All extractors implemented |
| Knowledge Graph | ✅ Complete | LOW - All arrays populated |
| API Layer | ✅ Implemented | LOW |
| Frontend | ✅ Full | LOW - All visualizations |
| Memory System | ✅ Implemented | LOW - Full functionality |
| Document Caching | ✅ Implemented | LOW - SHA256 hashing |

---

**See [GAP_ANALYSIS.md](./docs/GAP_ANALYSIS.md) for detailed gap analysis and recommendations.**
