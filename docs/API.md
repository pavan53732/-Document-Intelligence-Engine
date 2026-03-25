# 📡 API Documentation

## Overview

The Document Intelligence Engine provides a RESTful API for document analysis using **34 agents** across **28 layers**.

> **📋 See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for implementation status and known issues.**

**Base URL**: `/api/analyze`

## Endpoints

### POST /api/analyze

Main endpoint for creating sessions and running analysis.

#### Actions

##### 1. Create Session

Creates a new analysis session.

**Request**:
```json
{
  "action": "createSession",
  "files": [
    {
      "name": "document.md",
      "content": "# My Document\n\nContent here..."
    }
  ]
}
```

**Response**:
```json
{
  "sessionId": "clx1234567890abcdef"
}
```

##### 2. Analyze

Runs the full analysis pipeline with **34 agents** across **28 layers**.

**Request**:
```json
{
  "action": "analyze",
  "sessionId": "clx1234567890abcdef",
  "files": [
    {
      "name": "document.md",
      "content": "# My Document\n\nContent here..."
    }
  ]
}
```

**Response**:
```json
{
  "issues": [
    {
      "id": "issue-1234567890-abc123",
      "type": "structural",
      "severity": "warning",
      "title": "Heading hierarchy skip",
      "description": "Heading jumps from H1 to H3...",
      "location": "document.md: Line 15",
      "suggestion": "Add an H2 heading between these sections.",
      "fileName": "document.md",
      "evidence": null,
      "confidence": 0.95,
      "agentSource": "Structure Analyzer",
      "layer": "structural",
      "subType": "hierarchy_skip"
    }
  ],
  "agentResults": [
    {
      "agentName": "Logic Checker",
      "agentLayer": "logical",
      "agentTier": "core",
      "issueCount": 2,
      "confidence": 0.85,
      "processingTime": 1234
    }
  ],
  "documentGraph": {
    "nodeCount": 25,
    "claimCount": 8,
    "definitionCount": 3,
    "referenceCount": 5
  },
  "summary": {
    "totalIssues": 12,
    "critical": 1,
    "warning": 5,
    "info": 6,
    "byType": {
      "hallucination": 1,
      "contradiction": 0,
      "consistency": 3,
      "structural": 2,
      "logical": 1,
      "functional": 0,
      "semantic": 2,
      "temporal": 0,
      "completeness": 1,
      "intent": 0,
      "quantitative": 1,
      "invariant_violation": 0,
      "authority_breach": 0,
      "nondeterminism": 0,
      "governance_gap": 0,
      "psg_integrity": 0,
      "invariant_bypass": 0,
      "mutation_illegality": 0,
      "privilege_escalation": 0,
      "unknown_entity": 0,
      "replay_divergence": 0,
      "agent_conflict": 0,
      "sync_violation": 0,
      "recovery_failure": 0,
      "race_condition": 0,
      "enforcement_gap": 0,
      "simulation_drift": 0,
      "convergence_failure": 0,
      "semantic_drift": 0,
      "adversarial": 0,
      "meta": 0
    },
    "byLayer": {
      "contradiction": 3,
      "logical": 1,
      "structural": 2,
      "semantic": 2,
      "factual": 1,
      "functional": 0,
      "temporal": 0,
      "architectural": 1,
      "completeness": 1,
      "intent": 0,
      "execution_invariant": 0,
      "authority_boundary": 0,
      "deterministic": 0,
      "governance": 0,
      "psg_consistency": 0,
      "invariant_closure": 0,
      "state_mutation": 0,
      "authority_leak": 0,
      "closed_world": 0,
      "replay_fidelity": 0,
      "multi_agent": 0,
      "execution_psg_sync": 0,
      "recovery": 0,
      "concurrency": 0,
      "boundary_enforcement": 0,
      "simulation": 0,
      "convergence": 0,
      "semantic_execution": 0
    },
    "byAgent": {
      "Logic Checker": 1,
      "Consistency Checker": 3,
      "Structure Analyzer": 2
    },
    "byTier": {
      "core": 8,
      "advanced": 3,
      "meta": 1
    },
    "confidence": 0.82,
    "documentHealthScore": 78,
    "executionSafetyScore": 95,
    "governanceScore": 90,
    "determinismScore": 92
  },
  "metaCognition": {
    "overallConfidence": 0.82,
    "agentAgreement": 0.75,
    "highConfidenceIssues": 8,
    "uncertainIssues": 4,
    "disagreementPoints": [],
    "recommendedReview": [],
    "layerScores": {
      "contradiction": 85,
      "logical": 95,
      "structural": 80,
      "semantic": 88,
      "factual": 90,
      "functional": 100,
      "temporal": 100,
      "architectural": 92,
      "completeness": 95,
      "intent": 100,
      "execution_invariant": 100,
      "authority_boundary": 100,
      "deterministic": 100,
      "governance": 100,
      "psg_consistency": 100,
      "invariant_closure": 100,
      "state_mutation": 100,
      "authority_leak": 100,
      "closed_world": 100,
      "replay_fidelity": 100,
      "multi_agent": 100,
      "execution_psg_sync": 100,
      "recovery": 100,
      "concurrency": 100,
      "boundary_enforcement": 100,
      "simulation": 100,
      "convergence": 100,
      "semantic_execution": 100
    }
  },
  "agentInfo": {
    "totalAgents": 34,
    "coreAgents": 10,
    "advancedAgents": 20,
    "metaAgents": 4,
    "agentNames": [
      "Logic Checker",
      "Consistency Checker",
      "Contradiction Detector",
      "Structure Analyzer",
      "Fact Checker",
      "Intent-Scope Checker",
      "Dependency Checker",
      "Terminology Checker",
      "Assumption Detector",
      "Example Checker",
      "Semantic Analyzer",
      "Functional Validator",
      "Temporal Analyzer",
      "Completeness Checker",
      "Quantitative Checker",
      "Adversarial Analyzer",
      "Authority Boundary Analyzer",
      "Execution Invariant Validator",
      "Governance Analyzer",
      "State Mutation Validator",
      "Determinism Analyzer",
      "Multi-Agent Consistency Analyzer",
      "Concurrency Safety Analyzer",
      "Simulation Soundness Analyzer",
      "Recovery Semantics Analyzer",
      "World-Model Consistency Analyzer",
      "Boundary Enforcement Checker",
      "Convergence Stability Analyzer",
      "Semantic-Execution Checker",
      "Invariant Closure Checker",
      "Cross-Agent Conflict Resolver",
      "Severity Scoring Engine",
      "Stress-Test Generator",
      "Final Meta Judge"
    ]
  }
}
```

---

### GET /api/analyze

Retrieve analysis sessions.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | string | Optional. Retrieve specific session |

#### Responses

**Without sessionId** (List sessions):
```json
[
  {
    "id": "clx1234567890abcdef",
    "name": "Analysis 2024-01-15T10:30:00.000Z",
    "status": "completed",
    "fileCount": 2,
    "totalIssues": 12,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:31:00.000Z"
  }
]
```

**With sessionId** (Get details):
```json
{
  "id": "clx1234567890abcdef",
  "name": "Analysis 2024-01-15T10:30:00.000Z",
  "status": "completed",
  "fileCount": 2,
  "totalIssues": 12,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:31:00.000Z",
  "files": [
    {
      "id": "file-123",
      "filename": "document.md",
      "wordCount": 1500
    }
  ],
  "issues": [
    {
      "id": "issue-123",
      "type": "structural",
      "severity": "warning",
      "title": "Heading hierarchy skip",
      "description": "...",
      "location": "document.md: Line 15",
      "suggestion": "Add an H2 heading..."
    }
  ]
}
```

---

## Memory System Endpoints

### POST /api/analyze (Memory Actions)

#### getMemoryDashboard

Get comprehensive memory system dashboard data.

**Request**:
```json
{
  "action": "getMemoryDashboard"
}
```

**Response**:
```json
{
  "overallStats": {
    "totalAnalyses": 156,
    "totalIssues": 1234,
    "avgDocumentHealth": 78.5,
    "avgExecutionSafety": 92.3,
    "avgGovernance": 88.1,
    "avgDeterminism": 90.2,
    "avgConfidence": 0.85,
    "avgAnalysisTime": 4523,
    "totalWordsProcessed": 234567,
    "criticalRate": 0.05,
    "warningRate": 0.25,
    "infoRate": 0.70
  },
  "recentSessions": [
    {
      "id": "clx123",
      "name": "Analysis 2024-01-15",
      "status": "completed",
      "fileCount": 2,
      "totalIssues": 12,
      "documentHealthScore": 78,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "topAgents": [
    {
      "agentName": "Structure Analyzer",
      "agentTier": "core",
      "totalIssues": 156,
      "avgConfidence": 0.92,
      "estimatedAccuracy": 0.95
    }
  ],
  "dailyStats": [
    {
      "date": "2024-01-15",
      "analyses": 5,
      "issues": 45,
      "avgHealth": 82.5
    }
  ],
  "cacheStats": {
    "totalEntries": 23,
    "totalAccessCount": 156,
    "avgEntityCount": 12.5
  }
}
```

#### getAgentPerformance

Get performance metrics for all agents.

**Request**:
```json
{
  "action": "getAgentPerformance"
}
```

**Response**:
```json
[
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
  },
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
  }
]
```

#### getHistoricalStats

Get overall historical statistics.

**Request**:
```json
{
  "action": "getHistoricalStats"
}
```

**Response**:
```json
{
  "totalAnalyses": 156,
  "totalIssues": 1234,
  "avgDocumentHealth": 78.5,
  "avgExecutionSafety": 92.3,
  "avgGovernance": 88.1,
  "avgDeterminism": 90.2,
  "avgConfidence": 0.85,
  "avgAnalysisTime": 4523,
  "totalWordsProcessed": 234567,
  "criticalRate": 0.05,
  "warningRate": 0.25,
  "infoRate": 0.70
}
```

---

### GET /api/analyze (Memory Actions)

#### ?action=memoryDashboard

Get memory dashboard data via GET request.

**Example**:
```
GET /api/analyze?action=memoryDashboard
```

#### ?action=agentPerformance

Get agent performance metrics via GET request.

**Example**:
```
GET /api/analyze?action=agentPerformance
```

#### ?action=historicalStats

Get historical statistics via GET request.

**Example**:
```
GET /api/analyze?action=historicalStats
```

---

## Data Types

### IssueType (32 Types)

```typescript
type IssueType = 
  // BASE ISSUES (12)
  | 'hallucination' | 'contradiction' | 'consistency' | 'structural' 
  | 'logical' | 'functional' | 'semantic' | 'temporal' 
  | 'completeness' | 'intent' | 'architectural' | 'quantitative'
  // SYSTEM CORE ISSUES (5)
  | 'invariant_violation' | 'authority_breach' | 'nondeterminism' 
  | 'governance_gap' | 'psg_integrity'
  // FORMAL SYSTEM ISSUES (13)
  | 'invariant_bypass' | 'mutation_illegality' | 'privilege_escalation'
  | 'unknown_entity' | 'replay_divergence' | 'agent_conflict'
  | 'sync_violation' | 'recovery_failure' | 'race_condition'
  | 'enforcement_gap' | 'simulation_drift' | 'convergence_failure'
  | 'semantic_drift'
  // META ISSUES (2)
  | 'adversarial' | 'meta';
```

### Severity

```typescript
type Severity = 'critical' | 'warning' | 'info';
```

### IssueLayer (28 Layers)

```typescript
type IssueLayer = 
  // BASE LAYERS (1-10)
  | 'contradiction' | 'logical' | 'structural' | 'semantic' 
  | 'factual' | 'functional' | 'temporal' | 'architectural' 
  | 'completeness' | 'intent'
  // SYSTEM CORE LAYERS (11-15)
  | 'execution_invariant' | 'authority_boundary' | 'deterministic' 
  | 'governance' | 'psg_consistency'
  // FORMAL SYSTEM LAYERS (16-28)
  | 'invariant_closure' | 'state_mutation' | 'authority_leak' 
  | 'closed_world' | 'replay_fidelity' | 'multi_agent' 
  | 'execution_psg_sync' | 'recovery' | 'concurrency' 
  | 'boundary_enforcement' | 'simulation' | 'convergence' 
  | 'semantic_execution';
```

### AgentTier

```typescript
type AgentTier = 'core' | 'advanced' | 'meta';
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | No files provided | No markdown files in request |
| 400 | Invalid action | Unknown action parameter |
| 404 | Session not found | Session ID doesn't exist |
| 500 | Analysis failed | Server-side error during analysis |

---

## Example Usage

### JavaScript/TypeScript

```typescript
// Upload and analyze files
async function analyzeDocuments(files: File[]) {
  // Read file contents
  const fileContents = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      content: await file.text(),
    }))
  );

  // Create session
  const sessionResponse = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createSession',
      files: fileContents,
    }),
  });
  
  const { sessionId } = await sessionResponse.json();

  // Run analysis
  const analyzeResponse = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'analyze',
      sessionId,
      files: fileContents,
    }),
  });

  return analyzeResponse.json();
}
```

### cURL

```bash
# Create session
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createSession",
    "files": [{"name": "test.md", "content": "# Test\n\nContent"}]
  }'

# Run analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "sessionId": "YOUR_SESSION_ID",
    "files": [{"name": "test.md", "content": "# Test\n\nContent"}]
  }'
```

---

## Response Score Types

### Document Health Score (0-100)
Overall document quality based on:
- Issue count and severity
- Document length normalization
- Cross-validation confidence

### Execution Safety Score (0-100)
Safety for autonomous system execution based on:
- Layers: execution_invariant, authority_boundary, deterministic, governance, state_mutation, authority_leak, concurrency
- Critical issues: -25 points each
- Warning issues: -10 points each

### Governance Score (0-100)
Governance enforcement quality based on:
- Layers: governance, boundary_enforcement, authority_boundary, authority_leak
- Critical issues: -20 points each
- Warning issues: -8 points each

### Determinism Score (0-100)
Execution determinism quality based on:
- Layers: deterministic, replay_fidelity, concurrency, multi_agent
- Critical issues: -22 points each
- Warning issues: -8 points each

---

## Rate Limits

No rate limiting is currently implemented. For production use, consider adding:
- Request rate limiting
- File size limits
- Concurrent session limits

---

## Performance Notes

- **Parallel Execution**: All 30 Core + Advanced agents run concurrently, then 4 Meta agents
- **Large Files**: Content is chunked for processing (max 5000 chars per AI call)
- **Typical Response Time**: 5-60 seconds depending on document size
- **Memory Usage**: Scales with total document size

---

## AI Settings API

### GET /api/ai-settings

Get AI configuration status and settings.

#### Actions

##### ?action=status

Get current AI configuration status.

**Response**:
```json
{
  "configured": true,
  "hasValidSettings": true,
  "activeConfig": {
    "name": "default",
    "displayName": "OpenAI",
    "modelName": "gpt-4o-mini",
    "baseUrl": "https://api.openai.com/v1",
    "validationStatus": "valid",
    "totalApiCalls": 156,
    "totalTokensUsed": 45678
  }
}
```

##### ?action=active

Get active AI configuration (API key masked).

**Response**:
```json
{
  "id": "clx1234567890",
  "name": "default",
  "displayName": "OpenAI",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "••••••••abcd",
  "modelName": "gpt-4o-mini",
  "maxTokens": 4096,
  "temperature": 0.7,
  "isActive": true,
  "validationStatus": "valid"
}
```

##### ?action=list

List all saved AI configurations.

**Response**:
```json
{
  "settings": [
    {
      "id": "clx1234567890",
      "name": "default",
      "displayName": "OpenAI",
      "baseUrl": "https://api.openai.com/v1",
      "modelName": "gpt-4o-mini",
      "isActive": true,
      "validationStatus": "valid"
    },
    {
      "id": "clx9876543210",
      "name": "local",
      "displayName": "Ollama Local",
      "baseUrl": "http://localhost:11434/v1",
      "modelName": "llama3.2",
      "isActive": false,
      "validationStatus": "valid"
    }
  ]
}
```

---

### POST /api/ai-settings

Manage AI configurations.

#### Actions

##### save

Save or update AI configuration.

**Request**:
```json
{
  "action": "save",
  "name": "default",
  "displayName": "OpenAI",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-your-api-key",
  "modelName": "gpt-4o-mini",
  "maxTokens": 4096,
  "temperature": 0.7,
  "isActive": true
}
```

**Response**:
```json
{
  "success": true,
  "settings": {
    "id": "clx1234567890",
    "name": "default",
    "displayName": "OpenAI",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "••••••••abcd",
    "modelName": "gpt-4o-mini",
    "isActive": true
  }
}
```

##### validate

Validate AI configuration by testing the connection.

**Request**:
```json
{
  "action": "validate",
  "settingsId": "clx1234567890"
}
```

**Response** (Success):
```json
{
  "valid": true,
  "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
}
```

**Response** (Failure):
```json
{
  "valid": false,
  "error": "Invalid API key"
}
```

##### activate

Activate a specific configuration.

**Request**:
```json
{
  "action": "activate",
  "settingsId": "clx1234567890"
}
```

**Response**:
```json
{
  "success": true
}
```

##### delete

Delete a configuration.

**Request**:
```json
{
  "action": "delete",
  "settingsId": "clx1234567890"
}
```

**Response**:
```json
{
  "success": true
}
```

---

## Supported AI Providers

| Provider | Base URL | Notes |
|----------|----------|-------|
| OpenAI | `https://api.openai.com/v1` | Official OpenAI API |
| Azure OpenAI | `https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT` | Requires Azure subscription |
| Ollama | `http://localhost:11434/v1` | Local LLM inference |
| LM Studio | `http://localhost:1234/v1` | Local model hosting |
| Groq | `https://api.groq.com/openai/v1` | Fast inference |
| Together AI | `https://api.together.xyz/v1` | Open-source models |
| Anthropic | `https://api.anthropic.com/v1` | Claude models (may need proxy) |
| Custom | Any OpenAI-compatible URL | Any compatible endpoint |

---

**The API provides a simple interface to the powerful 34-agent, 28-layer analysis system.**
