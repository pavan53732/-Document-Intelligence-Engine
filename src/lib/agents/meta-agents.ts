// Meta Agents (4) - Supervision & Coordination
// Cross-agent conflict resolution, severity scoring, stress testing, final judgment

import { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph, 
  IssueLayer,
  AnalysisSummary,
  MetaCognitionReport,
  generateId,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';
import { agentChat, parseAIJSON, isAIAvailable } from '../ai/agent-ai';

// ========================================
// META AGENT BASE CLASS
// ========================================

abstract class BaseMetaAgent {
  abstract name: string;
  abstract layer: IssueLayer;
  abstract description: string;
  abstract icon: string;
  
  async initialize() {
    const available = await isAIAvailable();
    if (!available) {
      console.warn(`[${this.name}] AI not configured, using rule-based analysis only`);
    }
  }
  
  abstract analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph,
    agentResults: AgentResult[]
  ): Promise<AgentResult>;

  protected async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const result = await agentChat(prompt, systemPrompt || 'You are a meta-analysis expert. Respond ONLY with valid JSON.', {
        maxTokens: 2000,
        temperature: 0.3,
        jsonMode: true,
      });
      return result || '[]';
    } catch (error) {
      console.error(`[${this.name}] AI call failed:`, error);
      return '[]';
    }
  }

  protected parseJSONResponse(response: string): unknown[] {
    return parseAIJSON(response);
  }
}

// ========================================
// 1. CROSS-AGENT CONFLICT RESOLVER
// ========================================

export class CrossAgentConflictResolverAgent extends BaseMetaAgent {
  name = 'Cross-Agent Conflict Resolver';
  layer: IssueLayer = 'multi_agent';
  description = 'Merges conflicting outputs, resolves disagreements';
  icon = '🧠';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph,
    agentResults: AgentResult[]
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Find conflicts between agent findings
    const allIssues = agentResults.flatMap(r => r.issues);
    const conflicts = this.findConflicts(allIssues);

    conflicts.forEach(conflict => {
      issues.push({
        id: generateId(),
        type: 'agent_conflict',
        severity: 'warning',
        title: `Agent disagreement: ${conflict.topic}`,
        description: `Agents ${conflict.agents.join(', ')} have conflicting findings about "${conflict.topic}"`,
        suggestion: 'Manual review required to resolve disagreement',
        confidence: 0.8,
        agentSource: this.name,
        layer: this.layer,
        subType: 'agent_disagreement',
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'meta',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.95 : 0.8,
      processingTime: Date.now() - startTime,
      metadata: { conflictCount: conflicts.length },
    };
  }

  private findConflicts(issues: DetectedIssue[]): Array<{ topic: string; agents: string[] }> {
    const conflicts: Array<{ topic: string; agents: string[] }> = [];
    const grouped = new Map<string, DetectedIssue[]>();

    // Group issues by location/content similarity
    issues.forEach(issue => {
      const key = issue.location?.split(':')[0] || issue.title.slice(0, 20);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(issue);
    });

    // Find groups with contradictory severities
    grouped.forEach((groupIssues, key) => {
      const severities = new Set(groupIssues.map(i => i.severity));
      const agents = [...new Set(groupIssues.map(i => i.agentSource))];
      
      if (severities.size > 1 && agents.length > 1) {
        conflicts.push({ topic: key, agents });
      }
    });

    return conflicts;
  }
}

// ========================================
// 2. SEVERITY SCORING ENGINE
// ========================================

export class SeverityScoringEngineAgent extends BaseMetaAgent {
  name = 'Severity Scoring Engine';
  layer: IssueLayer = 'governance';
  description = 'Assigns CRITICAL/HIGH/MEDIUM/LOW severity';
  icon = '📊';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph,
    agentResults: AgentResult[]
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Recalculate severity based on multiple factors
    const allIssues = agentResults.flatMap(r => r.issues);

    allIssues.forEach(issue => {
      const adjustedSeverity = this.calculateAdjustedSeverity(issue, allIssues);
      
      if (adjustedSeverity !== issue.severity) {
        issues.push({
          id: generateId(),
          type: 'meta',
          severity: 'info',
          title: `Severity adjusted: ${issue.title}`,
          description: `Severity adjusted from ${issue.severity} to ${adjustedSeverity} based on cross-validation`,
          location: issue.location,
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          subType: 'severity_adjustment',
        });
      }
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'meta',
      issues,
      claims: [],
      confidence: 0.9,
      processingTime: Date.now() - startTime,
      metadata: { totalAdjusted: issues.length },
    };
  }

  private calculateAdjustedSeverity(issue: DetectedIssue, allIssues: DetectedIssue[]): 'critical' | 'warning' | 'info' {
    // Boost severity if multiple agents found similar issues
    const similarIssues = allIssues.filter(i => 
      i.id !== issue.id && 
      i.type === issue.type &&
      i.location === issue.location
    );

    if (similarIssues.length >= 2 && issue.severity !== 'critical') {
      return issue.severity === 'info' ? 'warning' : 'critical';
    }

    return issue.severity;
  }
}

// ========================================
// 3. STRESS-TEST GENERATOR
// ========================================

export class StressTestGeneratorAgent extends BaseMetaAgent {
  name = 'Stress-Test Generator';
  layer: IssueLayer = 'simulation';
  description = 'Generates adversarial edge cases for testing';
  icon = '🧪';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph,
    agentResults: AgentResult[]
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    const content = documents.map(d => d.content).join('\n');
    
    const prompt = `Generate stress-test edge cases for this specification:
${content.slice(0, 5000)}

Create test scenarios that might break the system:
- Boundary conditions
- Race conditions
- Resource exhaustion
- Invalid inputs
- Concurrent access

Return JSON array:
[{"type":"adversarial","severity":"info","title":"...","description":"...","suggestion":"...","confidence":0.0-1.0}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'adversarial',
        severity: 'info',
        title: (item.title as string) || 'Stress test case',
        description: (item.description as string) || '',
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.6,
        agentSource: this.name,
        layer: this.layer,
        subType: 'stress_test',
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'meta',
      issues,
      claims: [],
      confidence: 0.7,
      processingTime: Date.now() - startTime,
      metadata: { testCasesGenerated: issues.length },
    };
  }
}

// ========================================
// 4. FINAL META JUDGE
// ========================================

export class FinalMetaJudgeAgent extends BaseMetaAgent {
  name = 'Final Meta Judge';
  layer: IssueLayer = 'semantic_execution';
  description = 'Produces final consolidated report';
  icon = '🏁';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph,
    agentResults: AgentResult[]
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Calculate overall metrics
    const totalIssues = agentResults.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalCount = agentResults.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const avgConfidence = agentResults.reduce((sum, r) => sum + r.confidence, 0) / agentResults.length;

    // Generate final assessment
    if (criticalCount > 0) {
      issues.push({
        id: generateId(),
        type: 'meta',
        severity: 'critical',
        title: 'Critical issues require immediate attention',
        description: `Found ${criticalCount} critical issues across ${agentResults.length} agents. Document may not be safe for use.`,
        suggestion: 'Review all critical issues before proceeding',
        confidence: 0.95,
        agentSource: this.name,
        layer: this.layer,
        subType: 'final_judgment',
      });
    } else if (totalIssues > 10) {
      issues.push({
        id: generateId(),
        type: 'meta',
        severity: 'warning',
        title: 'Multiple issues detected',
        description: `Found ${totalIssues} issues. Document quality may be affected.`,
        suggestion: 'Review warning and info level issues',
        confidence: 0.85,
        agentSource: this.name,
        layer: this.layer,
        subType: 'final_judgment',
      });
    } else {
      issues.push({
        id: generateId(),
        type: 'meta',
        severity: 'info',
        title: 'Document analysis complete',
        description: `Analysis completed with ${totalIssues} issues detected. Average confidence: ${(avgConfidence * 100).toFixed(0)}%`,
        confidence: avgConfidence,
        agentSource: this.name,
        layer: this.layer,
        subType: 'final_judgment',
      });
    }

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'meta',
      issues,
      claims: [],
      confidence: avgConfidence,
      processingTime: Date.now() - startTime,
      metadata: {
        totalIssues,
        criticalCount,
        avgConfidence,
        agentsRun: agentResults.length,
      },
    };
  }

  // Generate final meta-cognition report
  generateMetaCognitionReport(
    agentResults: AgentResult[],
    allIssues: DetectedIssue[]
  ): MetaCognitionReport {
    const overallConfidence = agentResults.reduce((sum, r) => sum + r.confidence, 0) / agentResults.length;
    
    const issueGroups = new Map<string, DetectedIssue[]>();
    allIssues.forEach(issue => {
      const key = issue.location?.split(':')[0] || 'general';
      if (!issueGroups.has(key)) issueGroups.set(key, []);
      issueGroups.get(key)!.push(issue);
    });

    const agreementPoints: string[] = [];
    issueGroups.forEach((issues, key) => {
      const agents = new Set(issues.map(i => i.agentSource));
      if (agents.size > 1) {
        agreementPoints.push(`${agents.size} agents agree on issues at ${key}`);
      }
    });

    const highConfidenceIssues = allIssues.filter(i => i.confidence >= 0.8).length;
    const uncertainIssues = allIssues.filter(i => i.confidence < 0.7).length;

    const layerScores: Record<IssueLayer, number> = {} as Record<IssueLayer, number>;
    const layers: IssueLayer[] = [
      'contradiction', 'logical', 'structural', 'semantic', 'factual',
      'functional', 'temporal', 'architectural', 'completeness', 'intent',
      'execution_invariant', 'authority_boundary', 'deterministic', 'governance', 'psg_consistency',
      'invariant_closure', 'state_mutation', 'authority_leak', 'closed_world', 'replay_fidelity',
      'multi_agent', 'execution_psg_sync', 'recovery', 'concurrency', 'boundary_enforcement',
      'simulation', 'convergence', 'semantic_execution'
    ];

    layers.forEach(layer => {
      const layerIssues = allIssues.filter(i => i.layer === layer);
      const criticalCount = layerIssues.filter(i => i.severity === 'critical').length;
      const warningCount = layerIssues.filter(i => i.severity === 'warning').length;
      layerScores[layer] = Math.max(0, 100 - (criticalCount * 20) - (warningCount * 5));
    });

    return {
      overallConfidence,
      agentAgreement: agreementPoints.length / Math.max(1, issueGroups.size),
      highConfidenceIssues,
      uncertainIssues,
      disagreementPoints: [],
      recommendedReview: allIssues.filter(i => i.confidence < 0.7).map(i => i.location || 'General'),
      layerScores,
    };
  }
}

// ========================================
// EXPORT ALL META AGENTS
// ========================================

export const metaAgents = [
  new CrossAgentConflictResolverAgent(),
  new SeverityScoringEngineAgent(),
  new StressTestGeneratorAgent(),
  new FinalMetaJudgeAgent(),
];

export const META_AGENT_COUNT = metaAgents.length;
