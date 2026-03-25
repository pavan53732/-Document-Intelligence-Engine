// Meta Analyzer - Orchestrates 34 Agents (10 Core + 20 Advanced + 4 Meta)
// 28-Layer Analysis System for Deterministic Autonomous System Specifications

import { coreAgents, CORE_AGENT_COUNT } from './core-agents';
import { advancedAgents, ADVANCED_AGENT_COUNT } from './advanced-agents';
import { metaAgents, META_AGENT_COUNT } from './meta-agents';
import type { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph,
  AnalysisSummary,
  MetaCognitionReport,
  IssueLayer,
  IssueType,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';

// Total agent count
const TOTAL_AGENT_COUNT = CORE_AGENT_COUNT + ADVANCED_AGENT_COUNT + META_AGENT_COUNT;

export class MetaAnalyzer {
  
  async initializeAll() {
    await Promise.all([
      ...coreAgents.map(agent => agent.initialize()),
      ...advancedAgents.map(agent => agent.initialize()),
      ...metaAgents.map(agent => agent.initialize()),
    ]);
  }

  async runAllAgents(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult[]> {
    // Run core agents first
    const coreResults = await Promise.all(
      coreAgents.map(agent => agent.analyze(documents, parsedDocs, graph))
    );

    // Run advanced agents
    const advancedResults = await Promise.all(
      advancedAgents.map(agent => agent.analyze(documents, parsedDocs, graph))
    );

    // Combine results for meta agents
    const preliminaryResults = [...coreResults, ...advancedResults];

    // Run meta agents (they analyze results from core + advanced)
    const metaResults = await Promise.all(
      metaAgents.map(agent => agent.analyze(documents, parsedDocs, graph, preliminaryResults))
    );

    return [...coreResults, ...advancedResults, ...metaResults];
  }

  // Optimized parallel execution with batching
  async runAllAgentsOptimized(
    documents: { name: string; content: string }[],
    parsedDocs: ParsedDocument[],
    graph: DocumentGraph
  ): Promise<AgentResult[]> {
    const startTime = Date.now();
    
    // Convert parsedDocs array to map for compatibility
    const parsedDocsMap = new Map<string, ParsedDocument>();
    documents.forEach((doc, i) => {
      parsedDocsMap.set(doc.name, parsedDocs[i]);
    });

    // Batch 1: Core and Advanced agents in parallel
    const [coreResults, advancedResults] = await Promise.all([
      Promise.all(coreAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph);
        result.processingTime = Date.now() - agentStart;
        return result;
      })),
      Promise.all(advancedAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph);
        result.processingTime = Date.now() - agentStart;
        return result;
      }))
    ]);

    // Combine results for meta agents
    const preliminaryResults = [...coreResults, ...advancedResults];

    // Batch 2: Meta agents (run after core + advanced complete)
    const metaResults = await Promise.all(
      metaAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph, preliminaryResults);
        result.processingTime = Date.now() - agentStart;
        return result;
      })
    );

    const totalTime = Date.now() - startTime;
    const totalAgents = coreResults.length + advancedResults.length + metaResults.length;
    console.log(`[MetaAnalyzer] Completed ${totalAgents} agents (${coreResults.length} core, ${advancedResults.length} advanced, ${metaResults.length} meta) in ${totalTime}ms`);

    return [...coreResults, ...advancedResults, ...metaResults];
  }

  // Cross-validate issues between agents
  crossValidateIssues(agentResults: AgentResult[]): {
    validated: DetectedIssue[];
    uncertain: DetectedIssue[];
    metaReport: MetaCognitionReport;
  } {
    const allIssues: DetectedIssue[] = [];
    const validated: DetectedIssue[] = [];
    const uncertain: DetectedIssue[] = [];

    agentResults.forEach(result => {
      allIssues.push(...result.issues);
    });

    // Group similar issues by location and type
    const issueGroups = new Map<string, DetectedIssue[]>();
    
    allIssues.forEach(issue => {
      const key = `${issue.type}:${issue.location?.split(':')[0] || 'general'}`;
      if (!issueGroups.has(key)) issueGroups.set(key, []);
      issueGroups.get(key)!.push(issue);
    });

    issueGroups.forEach((issues) => {
      if (issues.length > 1) {
        const agentSources = new Set(issues.map(i => i.agentSource));
        
        if (agentSources.size > 1) {
          // Different agents agree - strong signal
          const bestIssue = issues.reduce((best, curr) => 
            curr.confidence > best.confidence ? curr : best
          );
          bestIssue.confidence = Math.min(1, bestIssue.confidence + 0.15);
          bestIssue.crossReferences = issues.filter(i => i.id !== bestIssue.id).map(i => i.id);
          validated.push(bestIssue);
        } else {
          // Same agent reported multiple times
          const bestIssue = issues[0];
          uncertain.push(bestIssue);
        }
      } else {
        const issue = issues[0];
        if (issue.confidence >= 0.8) {
          validated.push(issue);
        } else {
          uncertain.push(issue);
        }
      }
    });

    // Generate meta-cognition report
    const metaReport = this.generateMetaCognitionReport(agentResults, allIssues);

    return { validated, uncertain, metaReport };
  }

  // Generate meta-cognition report
  generateMetaCognitionReport(
    agentResults: AgentResult[],
    allIssues: DetectedIssue[]
  ): MetaCognitionReport {
    const overallConfidence = agentResults.length > 0 
      ? agentResults.reduce((sum, r) => sum + r.confidence, 0) / agentResults.length 
      : 0.95;
    
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

    // Build layer scores
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
      agentAgreement: issueGroups.size > 0 ? agreementPoints.length / issueGroups.size : 1,
      highConfidenceIssues,
      uncertainIssues,
      disagreementPoints: [],
      recommendedReview: allIssues.filter(i => i.confidence < 0.7).map(i => i.location || 'General'),
      layerScores,
    };
  }

  // Calculate health score
  calculateHealthScore(issues: DetectedIssue[], totalWords: number): number {
    if (totalWords === 0) return 100;

    const severityWeights = { critical: 15, warning: 5, info: 1 };
    const penalty = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
    const normalizedPenalty = penalty / (totalWords / 1000);
    
    return Math.max(0, Math.min(100, 100 - normalizedPenalty * 1.5));
  }

  // Calculate execution safety score
  calculateExecutionSafetyScore(issues: DetectedIssue[]): number {
    const criticalLayers: IssueLayer[] = [
      'execution_invariant', 'authority_boundary', 'deterministic', 
      'governance', 'state_mutation', 'authority_leak', 'concurrency'
    ];

    const safetyIssues = issues.filter(i => criticalLayers.includes(i.layer));
    const criticalCount = safetyIssues.filter(i => i.severity === 'critical').length;
    const warningCount = safetyIssues.filter(i => i.severity === 'warning').length;

    return Math.max(0, 100 - (criticalCount * 25) - (warningCount * 10));
  }

  // Calculate governance score
  calculateGovernanceScore(issues: DetectedIssue[]): number {
    const governanceLayers: IssueLayer[] = [
      'governance', 'boundary_enforcement', 'authority_boundary', 'authority_leak'
    ];

    const govIssues = issues.filter(i => governanceLayers.includes(i.layer));
    const criticalCount = govIssues.filter(i => i.severity === 'critical').length;
    const warningCount = govIssues.filter(i => i.severity === 'warning').length;

    return Math.max(0, 100 - (criticalCount * 20) - (warningCount * 8));
  }

  // Calculate determinism score
  calculateDeterminismScore(issues: DetectedIssue[]): number {
    const determinismLayers: IssueLayer[] = [
      'deterministic', 'replay_fidelity', 'concurrency', 'multi_agent'
    ];

    const detIssues = issues.filter(i => determinismLayers.includes(i.layer));
    const criticalCount = detIssues.filter(i => i.severity === 'critical').length;
    const warningCount = detIssues.filter(i => i.severity === 'warning').length;

    return Math.max(0, 100 - (criticalCount * 22) - (warningCount * 8));
  }

  // Calculate layer scores
  calculateLayerScores(issues: DetectedIssue[]): Record<IssueLayer, number> {
    const layers: IssueLayer[] = [
      'contradiction', 'logical', 'structural', 'semantic', 'factual',
      'functional', 'temporal', 'architectural', 'completeness', 'intent',
      'execution_invariant', 'authority_boundary', 'deterministic', 'governance', 'psg_consistency',
      'invariant_closure', 'state_mutation', 'authority_leak', 'closed_world', 'replay_fidelity',
      'multi_agent', 'execution_psg_sync', 'recovery', 'concurrency', 'boundary_enforcement',
      'simulation', 'convergence', 'semantic_execution'
    ];

    const scores: Record<IssueLayer, number> = {} as Record<IssueLayer, number>;

    layers.forEach(layer => {
      const layerIssues = issues.filter(i => i.layer === layer);
      const criticalCount = layerIssues.filter(i => i.severity === 'critical').length;
      const warningCount = layerIssues.filter(i => i.severity === 'warning').length;
      scores[layer] = Math.max(0, 100 - (criticalCount * 20) - (warningCount * 5));
    });

    return scores;
  }

  // Build summary
  buildSummary(
    issues: DetectedIssue[],
    agentResults: AgentResult[],
    totalWords: number
  ): AnalysisSummary {
    const byType: Record<IssueType, number> = {} as Record<IssueType, number>;
    const types: IssueType[] = [
      'hallucination', 'contradiction', 'consistency', 'structural',
      'logical', 'functional', 'semantic', 'temporal', 'completeness',
      'intent', 'quantitative', 'invariant_violation', 'authority_breach',
      'nondeterminism', 'governance_gap', 'psg_integrity', 'invariant_bypass',
      'mutation_illegality', 'privilege_escalation', 'unknown_entity',
      'replay_divergence', 'agent_conflict', 'sync_violation', 'recovery_failure',
      'race_condition', 'enforcement_gap', 'simulation_drift', 'convergence_failure',
      'semantic_drift', 'adversarial', 'meta'
    ];
    types.forEach(type => byType[type] = issues.filter(i => i.type === type).length);

    const byLayer: Record<IssueLayer, number> = {} as Record<IssueLayer, number>;
    const layers: IssueLayer[] = [
      'contradiction', 'logical', 'structural', 'semantic', 'factual',
      'functional', 'temporal', 'architectural', 'completeness', 'intent',
      'execution_invariant', 'authority_boundary', 'deterministic', 'governance', 'psg_consistency',
      'invariant_closure', 'state_mutation', 'authority_leak', 'closed_world', 'replay_fidelity',
      'multi_agent', 'execution_psg_sync', 'recovery', 'concurrency', 'boundary_enforcement',
      'simulation', 'convergence', 'semantic_execution'
    ];
    layers.forEach(layer => byLayer[layer] = issues.filter(i => i.layer === layer).length);

    const byAgent: Record<string, number> = {};
    agentResults.forEach(result => byAgent[result.agentName] = result.issues.length);

    const byTier = {
      core: agentResults.filter(r => r.agentTier === 'core').reduce((s, r) => s + r.issues.length, 0),
      advanced: agentResults.filter(r => r.agentTier === 'advanced').reduce((s, r) => s + r.issues.length, 0),
      meta: agentResults.filter(r => r.agentTier === 'meta').reduce((s, r) => s + r.issues.length, 0),
    };

    return {
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      byType,
      byLayer,
      byAgent,
      byTier,
      confidence: issues.length > 0 
        ? issues.reduce((sum, i) => sum + i.confidence, 0) / issues.length 
        : 0.95,
      documentHealthScore: this.calculateHealthScore(issues, totalWords),
      executionSafetyScore: this.calculateExecutionSafetyScore(issues),
      governanceScore: this.calculateGovernanceScore(issues),
      determinismScore: this.calculateDeterminismScore(issues),
    };
  }
}

// Export singleton instance
export const metaAnalyzer = new MetaAnalyzer();

// Export counts and agent names
export const AGENT_NAMES = [
  ...coreAgents.map(a => a.name),
  ...advancedAgents.map(a => a.name),
  ...metaAgents.map(a => a.name),
];
export { CORE_AGENT_COUNT, ADVANCED_AGENT_COUNT, META_AGENT_COUNT };
export const TOTAL_AGENT_COUNT_EXPORT = TOTAL_AGENT_COUNT;
