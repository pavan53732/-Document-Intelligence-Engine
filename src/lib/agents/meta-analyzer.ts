// Meta Analyzer - Orchestrates 55+ Agents (10 Core + 20 Advanced + 4 Policy + 7 Formal + 4 Validation + 4 Meta)
// 42-Layer Analysis System for Deterministic Autonomous System Specifications
// Version 2.0 - Enhanced with Reasoning Traces, Policy Engine, Cross-Layer Validation

import { coreAgents, CORE_AGENT_COUNT } from './core-agents';
import { advancedAgents, ADVANCED_AGENT_COUNT } from './advanced-agents';
import { metaAgents, META_AGENT_COUNT } from './meta-agents';
import { getPolicyEngineAgents, POLICY_ENGINE_AGENT_COUNT } from './policy-engine-agents';
import { getFormalVerificationAgents, FORMAL_VERIFICATION_AGENT_COUNT } from './formal-verification-agents';
import { getValidationAgents, VALIDATION_AGENT_COUNT } from './validation-agents';
import { runAllCrossLayerValidations, CrossLayerValidationEngine } from './cross-layer-validation';
import { defaultReasoningSystem, ReasoningTraceSystem } from './reasoning-trace';
import type { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph,
  AnalysisSummary,
  MetaCognitionReport,
  IssueLayer,
  IssueType,
  ReasoningTrace,
  CrossLayerValidation,
  Severity,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';

// Total agent count
const TOTAL_AGENT_COUNT = CORE_AGENT_COUNT + ADVANCED_AGENT_COUNT + META_AGENT_COUNT + 
                          POLICY_ENGINE_AGENT_COUNT + FORMAL_VERIFICATION_AGENT_COUNT + VALIDATION_AGENT_COUNT;

export class MetaAnalyzer {
  private policyEngineAgents = getPolicyEngineAgents();
  private formalVerificationAgents = getFormalVerificationAgents();
  private validationAgents = getValidationAgents();
  private crossLayerEngine = new CrossLayerValidationEngine();
  private reasoningSystem = defaultReasoningSystem;

  async initializeAll() {
    await Promise.all([
      ...coreAgents.map(agent => agent.initialize()),
      ...advancedAgents.map(agent => agent.initialize()),
      ...metaAgents.map(agent => agent.initialize()),
      ...this.policyEngineAgents.map(agent => agent.initialize()),
      ...this.formalVerificationAgents.map(agent => agent.initialize()),
      ...this.validationAgents.map(agent => agent.initialize()),
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

    // Run policy engine agents
    const policyResults = await Promise.all(
      this.policyEngineAgents.map(agent => agent.analyze(documents, parsedDocs, graph))
    );

    // Run formal verification agents
    const formalResults = await Promise.all(
      this.formalVerificationAgents.map(agent => agent.analyze(documents, parsedDocs, graph))
    );

    // Run validation agents
    const validationResults = await Promise.all(
      this.validationAgents.map(agent => agent.analyze(documents, parsedDocs, graph))
    );

    // Combine results for meta agents
    const preliminaryResults = [...coreResults, ...advancedResults, ...policyResults, ...formalResults, ...validationResults];

    // Run meta agents (they analyze results from all other agents)
    const metaResults = await Promise.all(
      metaAgents.map(agent => agent.analyze(documents, parsedDocs, graph, preliminaryResults))
    );

    return [...coreResults, ...advancedResults, ...policyResults, ...formalResults, ...validationResults, ...metaResults];
  }

  // Optimized parallel execution with batching
  async runAllAgentsOptimized(
    documents: { name: string; content: string }[],
    parsedDocs: ParsedDocument[],
    graph: DocumentGraph
  ): Promise<{
    results: AgentResult[];
    reasoningTraces: ReasoningTrace[];
    crossLayerValidations: CrossLayerValidation[];
  }> {
    const startTime = Date.now();
    
    // Convert parsedDocs array to map for compatibility
    const parsedDocsMap = new Map<string, ParsedDocument>();
    documents.forEach((doc, i) => {
      parsedDocsMap.set(doc.name, parsedDocs[i]);
    });

    // Batch 1: Core, Advanced, Policy, Formal, Validation agents in parallel
    const [coreResults, advancedResults, policyResults, formalResults, validationResults] = await Promise.all([
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
      })),
      Promise.all(this.policyEngineAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph);
        result.processingTime = Date.now() - agentStart;
        return result;
      })),
      Promise.all(this.formalVerificationAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph);
        result.processingTime = Date.now() - agentStart;
        return result;
      })),
      Promise.all(this.validationAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph);
        result.processingTime = Date.now() - agentStart;
        return result;
      }))
    ]);

    // Combine results for meta agents
    const preliminaryResults = [...coreResults, ...advancedResults, ...policyResults, ...formalResults, ...validationResults];

    // Batch 2: Meta agents (run after all other agents complete)
    const metaResults = await Promise.all(
      metaAgents.map(async agent => {
        const agentStart = Date.now();
        const result = await agent.analyze(documents, parsedDocsMap, graph, preliminaryResults);
        result.processingTime = Date.now() - agentStart;
        return result;
      })
    );

    // Batch 3: Cross-layer validation (runs in parallel with reasoning traces)
    const crossLayerValidations = await runAllCrossLayerValidations(
      preliminaryResults,
      graph,
      documents
    );

    // Batch 4: Build reasoning traces for high-severity issues
    const reasoningTraces: ReasoningTrace[] = [];
    const allIssues = preliminaryResults.flatMap(r => r.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
    
    for (const issue of criticalIssues.slice(0, 10)) { // Limit to 10 traces for performance
      try {
        const trace = await this.reasoningSystem.buildTraceFromFindings(
          issue,
          [{ text: issue.description, type: 'fact' }],
          issue.evidence || ''
        );
        if (trace) {
          reasoningTraces.push(trace);
          issue.reasoningTraceId = trace.id;
        }
      } catch (error) {
        console.warn(`[MetaAnalyzer] Failed to build reasoning trace for issue ${issue.id}`);
      }
    }

    const totalTime = Date.now() - startTime;
    const allResults = [...coreResults, ...advancedResults, ...policyResults, ...formalResults, ...validationResults, ...metaResults];
    const totalAgents = allResults.length;
    
    console.log(`[MetaAnalyzer] Completed ${totalAgents} agents in ${totalTime}ms`);
    console.log(`[MetaAnalyzer] Core: ${coreResults.length}, Advanced: ${advancedResults.length}, Policy: ${policyResults.length}, Formal: ${formalResults.length}, Validation: ${validationResults.length}, Meta: ${metaResults.length}`);
    console.log(`[MetaAnalyzer] Built ${reasoningTraces.length} reasoning traces, ${crossLayerValidations.length} cross-layer validations`);

    return {
      results: allResults,
      reasoningTraces,
      crossLayerValidations,
    };
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

    // Build layer scores - includes all 42 layers
    const layerScores: Record<IssueLayer, number> = {} as Record<IssueLayer, number>;
    const layers: IssueLayer[] = [
      // BASE (1-10)
      'contradiction', 'logical', 'structural', 'semantic', 'factual',
      'functional', 'temporal', 'architectural', 'completeness', 'intent',
      // SYSTEM CORE (11-15)
      'execution_invariant', 'authority_boundary', 'deterministic', 'governance', 'psg_consistency',
      // FORMAL SYSTEM (16-28)
      'invariant_closure', 'state_mutation', 'authority_leak', 'closed_world', 'replay_fidelity',
      'multi_agent', 'execution_psg_sync', 'recovery', 'concurrency', 'boundary_enforcement',
      'simulation', 'convergence', 'semantic_execution',
      // POLICY ENGINE (29-32)
      'policy_enforcement', 'rule_conflict', 'audit_trail', 'override_control',
      // FORMAL VERIFICATION (33-38)
      'invariant_enforcement', 'determinism_audit', 'spec_compliance', 'ambiguity_resolution',
      'state_explosion', 'formal_verification',
      // VALIDATION (39-42)
      'context_validation', 'memory_integrity', 'safety_validation', 'performance_validation'
    ];

    layers.forEach(layer => {
      const layerIssues = allIssues.filter(i => i.layer === layer);
      const criticalCount = layerIssues.filter(i => i.severity === 'critical').length;
      const highCount = layerIssues.filter(i => i.severity === 'high').length;
      const mediumCount = layerIssues.filter(i => i.severity === 'medium').length;
      layerScores[layer] = Math.max(0, 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5));
    });

    return {
      overallConfidence,
      agentAgreement: issueGroups.size > 0 ? agreementPoints.length / issueGroups.size : 1,
      highConfidenceIssues,
      uncertainIssues,
      disagreementPoints: [],
      recommendedReview: allIssues.filter(i => i.confidence < 0.7).map(i => i.location || 'General'),
      layerScores,
      // Enhanced fields
      reasoningTraceCoverage: 0,
      evidenceBindingCoverage: 0,
      uncertaintyPropagationScore: overallConfidence,
      selfCorrectionLoopStatus: 'none',
      policyComplianceScore: layerScores['policy_enforcement'] || 100,
      auditTrailCompleteness: layerScores['audit_trail'] || 100,
      crossLayerValidationResults: [],
      closedWorldValidationScore: layerScores['closed_world'] || 100,
      deterministicScore: layerScores['deterministic'] || 100,
    };
  }

  // Calculate health score (5-level severity)
  calculateHealthScore(issues: DetectedIssue[], totalWords: number): number {
    if (totalWords === 0) return 100;

    const severityWeights: Record<Severity, number> = { 
      critical: 20, 
      high: 12, 
      medium: 6, 
      low: 2, 
      info: 1 
    };
    const penalty = issues.reduce((sum, issue) => sum + (severityWeights[issue.severity] || 1), 0);
    const normalizedPenalty = penalty / (totalWords / 1000);
    
    return Math.max(0, Math.min(100, 100 - normalizedPenalty * 1.5));
  }

  // Calculate execution safety score
  calculateExecutionSafetyScore(issues: DetectedIssue[]): number {
    const criticalLayers: IssueLayer[] = [
      'execution_invariant', 'authority_boundary', 'deterministic', 
      'governance', 'state_mutation', 'authority_leak', 'concurrency',
      'invariant_enforcement', 'safety_validation'
    ];

    const safetyIssues = issues.filter(i => criticalLayers.includes(i.layer));
    const criticalCount = safetyIssues.filter(i => i.severity === 'critical').length;
    const highCount = safetyIssues.filter(i => i.severity === 'high').length;
    const mediumCount = safetyIssues.filter(i => i.severity === 'medium').length;

    return Math.max(0, 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5));
  }

  // Calculate governance score
  calculateGovernanceScore(issues: DetectedIssue[]): number {
    const governanceLayers: IssueLayer[] = [
      'governance', 'boundary_enforcement', 'authority_boundary', 'authority_leak',
      'policy_enforcement', 'rule_conflict', 'audit_trail', 'override_control'
    ];

    const govIssues = issues.filter(i => governanceLayers.includes(i.layer));
    const criticalCount = govIssues.filter(i => i.severity === 'critical').length;
    const highCount = govIssues.filter(i => i.severity === 'high').length;
    const mediumCount = govIssues.filter(i => i.severity === 'medium').length;

    return Math.max(0, 100 - (criticalCount * 20) - (highCount * 12) - (mediumCount * 4));
  }

  // Calculate determinism score
  calculateDeterminismScore(issues: DetectedIssue[]): number {
    const determinismLayers: IssueLayer[] = [
      'deterministic', 'replay_fidelity', 'concurrency', 'multi_agent',
      'determinism_audit', 'formal_verification'
    ];

    const detIssues = issues.filter(i => determinismLayers.includes(i.layer));
    const criticalCount = detIssues.filter(i => i.severity === 'critical').length;
    const highCount = detIssues.filter(i => i.severity === 'high').length;
    const mediumCount = detIssues.filter(i => i.severity === 'medium').length;

    return Math.max(0, 100 - (criticalCount * 22) - (highCount * 12) - (mediumCount * 4));
  }

  // Calculate reasoning trace score
  calculateReasoningTraceScore(reasoningTraces: ReasoningTrace[]): number {
    if (reasoningTraces.length === 0) return 100;
    const validTraces = reasoningTraces.filter(t => t.isValid);
    const avgConfidence = reasoningTraces.reduce((s, t) => s + t.confidenceScore, 0) / reasoningTraces.length;
    return Math.round(avgConfidence * 100);
  }

  // Calculate cross-layer validation score
  calculateCrossLayerScore(validations: CrossLayerValidation[]): number {
    if (validations.length === 0) return 100;
    const passCount = validations.filter(v => v.status === 'pass').length;
    const warningCount = validations.filter(v => v.status === 'warning').length;
    return Math.round(((passCount + warningCount * 0.5) / validations.length) * 100);
  }

  // Calculate layer scores
  calculateLayerScores(issues: DetectedIssue[]): Record<IssueLayer, number> {
    const layers: IssueLayer[] = [
      // BASE (1-10)
      'contradiction', 'logical', 'structural', 'semantic', 'factual',
      'functional', 'temporal', 'architectural', 'completeness', 'intent',
      // SYSTEM CORE (11-15)
      'execution_invariant', 'authority_boundary', 'deterministic', 'governance', 'psg_consistency',
      // FORMAL SYSTEM (16-28)
      'invariant_closure', 'state_mutation', 'authority_leak', 'closed_world', 'replay_fidelity',
      'multi_agent', 'execution_psg_sync', 'recovery', 'concurrency', 'boundary_enforcement',
      'simulation', 'convergence', 'semantic_execution',
      // POLICY ENGINE (29-32)
      'policy_enforcement', 'rule_conflict', 'audit_trail', 'override_control',
      // FORMAL VERIFICATION (33-38)
      'invariant_enforcement', 'determinism_audit', 'spec_compliance', 'ambiguity_resolution',
      'state_explosion', 'formal_verification',
      // VALIDATION (39-42)
      'context_validation', 'memory_integrity', 'safety_validation', 'performance_validation'
    ];

    const scores: Record<IssueLayer, number> = {} as Record<IssueLayer, number>;

    layers.forEach(layer => {
      const layerIssues = issues.filter(i => i.layer === layer);
      const criticalCount = layerIssues.filter(i => i.severity === 'critical').length;
      const highCount = layerIssues.filter(i => i.severity === 'high').length;
      const mediumCount = layerIssues.filter(i => i.severity === 'medium').length;
      scores[layer] = Math.max(0, 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5));
    });

    return scores;
  }

  // Build summary (enhanced with 5-level severity and new scores)
  buildSummary(
    issues: DetectedIssue[],
    agentResults: AgentResult[],
    totalWords: number,
    reasoningTraces: ReasoningTrace[] = [],
    crossLayerValidations: CrossLayerValidation[] = []
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
      'semantic_drift', 'adversarial', 'meta',
      // Policy types
      'policy_violation', 'rule_conflict', 'missing_audit_trail', 'unauthorized_override',
      'policy_gap', 'rule_ambiguity',
      // Formal verification types
      'invariant_not_enforced', 'determinism_break', 'spec_violation', 'ambiguity_detected',
      'state_explosion_risk', 'verification_failure',
      // Validation types
      'context_mismatch', 'memory_corruption', 'safety_violation', 'performance_degradation',
      'resource_exhaustion',
      // Reasoning types
      'reasoning_gap', 'evidence_missing', 'uncertainty_propagation', 'self_correction_loop',
      'multi_step_failure', 'cross_layer_violation'
    ];
    types.forEach(type => byType[type] = issues.filter(i => i.type === type).length);

    const byLayer: Record<IssueLayer, number> = {} as Record<IssueLayer, number>;
    const layers: IssueLayer[] = [
      'contradiction', 'logical', 'structural', 'semantic', 'factual',
      'functional', 'temporal', 'architectural', 'completeness', 'intent',
      'execution_invariant', 'authority_boundary', 'deterministic', 'governance', 'psg_consistency',
      'invariant_closure', 'state_mutation', 'authority_leak', 'closed_world', 'replay_fidelity',
      'multi_agent', 'execution_psg_sync', 'recovery', 'concurrency', 'boundary_enforcement',
      'simulation', 'convergence', 'semantic_execution',
      'policy_enforcement', 'rule_conflict', 'audit_trail', 'override_control',
      'invariant_enforcement', 'determinism_audit', 'spec_compliance', 'ambiguity_resolution',
      'state_explosion', 'formal_verification',
      'context_validation', 'memory_integrity', 'safety_validation', 'performance_validation'
    ];
    layers.forEach(layer => byLayer[layer] = issues.filter(i => i.layer === layer).length);

    const byAgent: Record<string, number> = {};
    agentResults.forEach(result => byAgent[result.agentName] = result.issues.length);

    const byTier = {
      core: agentResults.filter(r => r.agentTier === 'core').reduce((s, r) => s + r.issues.length, 0),
      advanced: agentResults.filter(r => r.agentTier === 'advanced').reduce((s, r) => s + r.issues.length, 0),
      meta: agentResults.filter(r => r.agentTier === 'meta').reduce((s, r) => s + r.issues.length, 0),
      policy: agentResults.filter(r => r.agentTier === 'policy').reduce((s, r) => s + r.issues.length, 0),
      formal: agentResults.filter(r => r.agentTier === 'formal').reduce((s, r) => s + r.issues.length, 0),
      validation: agentResults.filter(r => r.agentTier === 'validation').reduce((s, r) => s + r.issues.length, 0),
    };

    return {
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
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
      // Enhanced scores
      reasoningTraceScore: this.calculateReasoningTraceScore(reasoningTraces),
      evidenceBindingScore: reasoningTraces.length > 0 
        ? reasoningTraces.reduce((s, t) => s + t.avgRelevanceScore, 0) / reasoningTraces.length * 100 
        : 100,
      policyComplianceScore: this.calculateGovernanceScore(issues),
      crossLayerValidationScore: this.calculateCrossLayerScore(crossLayerValidations),
      closedWorldScore: this.calculateLayerScores(issues)['closed_world'] || 100,
      auditTrailScore: this.calculateLayerScores(issues)['audit_trail'] || 100,
    };
  }
}

// Export singleton instance
export const metaAnalyzer = new MetaAnalyzer();

// Export counts and agent names
export const AGENT_NAMES = [
  ...coreAgents.map(a => a.name),
  ...advancedAgents.map(a => a.name),
  ...getPolicyEngineAgents().map(a => a.name),
  ...getFormalVerificationAgents().map(a => a.name),
  ...getValidationAgents().map(a => a.name),
  ...metaAgents.map(a => a.name),
];

export { 
  CORE_AGENT_COUNT, 
  ADVANCED_AGENT_COUNT, 
  META_AGENT_COUNT,
  POLICY_ENGINE_AGENT_COUNT,
  FORMAL_VERIFICATION_AGENT_COUNT,
  VALIDATION_AGENT_COUNT 
};

export const TOTAL_AGENT_COUNT_EXPORT = TOTAL_AGENT_COUNT;
