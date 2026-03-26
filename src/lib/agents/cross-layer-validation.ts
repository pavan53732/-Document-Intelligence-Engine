// Cross-Layer Validation System
// Validates consistency between different analysis layers
// Part of the 38+ Layer, 55+ Agent System

import {
  CrossLayerValidation,
  CrossLayerRule,
  DetectedIssue,
  AgentResult,
  IssueLayer,
  IssueType,
  Severity,
  DocumentGraph,
  ReasoningTrace,
  PolicyRule,
  AuditEntry,
  StateMutation,
  ExecutionPath,
  GovernanceCheckpoint,
  CROSS_LAYER_VALIDATIONS,
} from './types';

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDetectedIssue(
  type: IssueType,
  severity: Severity,
  title: string,
  description: string,
  layer: IssueLayer,
  agentSource: string,
  overrides: Partial<DetectedIssue> = {}
): DetectedIssue {
  return {
    id: generateId(),
    type,
    severity,
    title,
    description,
    layer,
    agentSource,
    confidence: overrides.confidence ?? 0.85,
    ...overrides,
  };
}

function createCrossLayerRule(
  name: string,
  sourceLayer: IssueLayer,
  targetLayer: IssueLayer,
  condition: string,
  expectedResult: string
): CrossLayerRule {
  return {
    id: generateId(),
    name,
    sourceLayer,
    targetLayer,
    condition,
    expectedResult,
    isValid: true,
    violations: [],
  };
}

// ========================================
// ARCHITECTURE EXECUTION CONSISTENCY VALIDATOR
// ========================================

/**
 * Validates that execution paths match architectural definitions.
 * Detects architectural drift and validates component boundaries.
 */
export class ArchitectureExecutionConsistency {
  private validationId = 'arch-exec-consistency';

  /**
   * Validates architecture ↔ execution consistency
   */
  validate(
    documentGraph: DocumentGraph,
    agentResults: AgentResult[]
  ): CrossLayerValidation {
    const baseValidation = CROSS_LAYER_VALIDATIONS.find(
      (v) => v.id === this.validationId
    )!;

    const validationRules: CrossLayerRule[] = [];
    const issues: DetectedIssue[] = [];

    // Rule 1: Execution paths must be defined in architecture
    const execPathRule = this.validateExecutionPathsDefined(documentGraph);
    validationRules.push(execPathRule);
    if (!execPathRule.isValid) {
      issues.push(
        createDetectedIssue(
          'architectural',
          'high',
          'Undefined Execution Path',
          `Found ${execPathRule.violations.length} execution paths not defined in architectural specifications`,
          'architectural',
          'ArchitectureExecutionConsistency',
          { evidence: execPathRule.violations.join('; ') }
        )
      );
    }

    // Rule 2: Component boundaries must be respected in execution
    const boundaryRule = this.validateComponentBoundaries(documentGraph);
    validationRules.push(boundaryRule);
    if (!boundaryRule.isValid) {
      issues.push(
        createDetectedIssue(
          'enforcement_gap',
          'critical',
          'Component Boundary Violation',
          `Execution paths cross component boundaries without proper authorization`,
          'boundary_enforcement',
          'ArchitectureExecutionConsistency',
          { evidence: boundaryRule.violations.join('; ') }
        )
      );
    }

    // Rule 3: Invariants must be enforced in execution paths
    const invariantRule = this.validateInvariantsEnforced(documentGraph);
    validationRules.push(invariantRule);
    if (!invariantRule.isValid) {
      issues.push(
        createDetectedIssue(
          'invariant_not_enforced',
          'critical',
          'Invariant Not Enforced at Runtime',
          `Found ${invariantRule.violations.length} invariants not enforced in execution paths`,
          'execution_invariant',
          'ArchitectureExecutionConsistency',
          { evidence: invariantRule.violations.join('; ') }
        )
      );
    }

    // Rule 4: Check for architectural drift
    const driftRule = this.detectArchitecturalDrift(documentGraph, agentResults);
    validationRules.push(driftRule);
    if (!driftRule.isValid) {
      issues.push(
        createDetectedIssue(
          'semantic_drift',
          'medium',
          'Architectural Drift Detected',
          `Execution semantics have drifted from architectural intent`,
          'semantic_execution',
          'ArchitectureExecutionConsistency',
          { evidence: driftRule.violations.join('; ') }
        )
      );
    }

    // Determine overall status
    const hasCriticalOrHigh = issues.some(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const status: CrossLayerValidation['status'] = issues.length === 0 
      ? 'pass' 
      : hasCriticalOrHigh 
        ? 'fail' 
        : 'warning';

    return {
      ...baseValidation,
      validationRules,
      status,
      issues,
    };
  }

  private validateExecutionPathsDefined(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Execution Paths Defined',
      'architectural',
      'execution_invariant',
      'All execution paths must have corresponding architectural definitions',
      'Every execution path has an architectural definition'
    );

    const archDefinedPaths = new Set(
      graph.nodes
        .filter((n) => n.type === 'architectural_component')
        .map((n) => n.id)
    );

    for (const path of graph.executionPaths) {
      for (const step of path.steps) {
        if (!archDefinedPaths.has(step)) {
          rule.violations.push(`Execution path step '${step}' not defined in architecture`);
          rule.isValid = false;
        }
      }
    }

    return rule;
  }

  private validateComponentBoundaries(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Component Boundaries Respected',
      'architectural',
      'boundary_enforcement',
      'Execution paths must respect component boundaries',
      'No unauthorized boundary crossings'
    );

    const boundaries = graph.nodes
      .filter((n) => n.type === 'boundary')
      .map((n) => n.id);

    const mutations = graph.stateMutations;
    
    for (const mutation of mutations) {
      // Check if mutation crosses boundaries without proper authority
      const crossesBoundary = boundaries.some(
        (b) => mutation.source.includes(b) !== mutation.target.includes(b)
      );
      
      if (crossesBoundary && !mutation.authority) {
        rule.violations.push(
          `Mutation from '${mutation.source}' to '${mutation.target}' crosses boundary without authority`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }

  private validateInvariantsEnforced(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Invariants Enforced',
      'architectural',
      'execution_invariant',
      'All invariants must be enforced at execution points',
      'All invariants are checked at execution'
    );

    const declaredInvariants = new Set<string>();
    
    // Collect declared invariants from governance checkpoints
    for (const checkpoint of graph.governanceCheckpoints) {
      if (checkpoint.type === 'validation') {
        declaredInvariants.add(checkpoint.rule);
      }
    }

    // Check if execution paths enforce these invariants
    for (const path of graph.executionPaths) {
      for (const invariant of path.invariants) {
        if (!declaredInvariants.has(invariant)) {
          rule.violations.push(
            `Invariant '${invariant}' in path '${path.id}' is not declared in governance checkpoints`
          );
          rule.isValid = false;
        }
      }
    }

    return rule;
  }

  private detectArchitecturalDrift(
    graph: DocumentGraph,
    agentResults: AgentResult[]
  ): CrossLayerRule {
    const rule = createCrossLayerRule(
      'No Architectural Drift',
      'architectural',
      'semantic_execution',
      'Execution semantics must match architectural intent',
      'No drift detected'
    );

    // Check for semantic execution issues from agent results
    const semanticIssues = agentResults
      .filter((r) => r.agentLayer === 'semantic_execution')
      .flatMap((r) => r.issues);

    for (const issue of semanticIssues) {
      if (issue.type === 'semantic_drift') {
        rule.violations.push(issue.description);
        rule.isValid = false;
      }
    }

    // Check for intent-execution alignment
    for (const path of graph.executionPaths) {
      if (path.isDeterministic === false) {
        rule.violations.push(
          `Execution path '${path.id}' is non-deterministic, violating architectural intent`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }
}

// ========================================
// MEMORY CONTEXT CONSISTENCY VALIDATOR
// ========================================

/**
 * Validates that memory state matches context state.
 * Detects memory-context mismatches and validates state synchronization.
 */
export class MemoryContextConsistency {
  private validationId = 'mem-ctx-consistency';

  /**
   * Validates memory ↔ context consistency
   */
  validate(
    documentGraph: DocumentGraph,
    agentResults: AgentResult[]
  ): CrossLayerValidation {
    const baseValidation = CROSS_LAYER_VALIDATIONS.find(
      (v) => v.id === this.validationId
    )!;

    const validationRules: CrossLayerRule[] = [];
    const issues: DetectedIssue[] = [];

    // Rule 1: Memory state must match PSG state
    const memoryPsgRule = this.validateMemoryPsgConsistency(documentGraph);
    validationRules.push(memoryPsgRule);
    if (!memoryPsgRule.isValid) {
      issues.push(
        createDetectedIssue(
          'memory_corruption',
          'critical',
          'Memory-PSG State Mismatch',
          `Memory state does not match PSG (Persistent State Graph) state`,
          'memory_integrity',
          'MemoryContextConsistency',
          { evidence: memoryPsgRule.violations.join('; ') }
        )
      );
    }

    // Rule 2: Context must reflect current memory
    const contextMemoryRule = this.validateContextMemoryConsistency(documentGraph);
    validationRules.push(contextMemoryRule);
    if (!contextMemoryRule.isValid) {
      issues.push(
        createDetectedIssue(
          'context_mismatch',
          'high',
          'Context-Memory Mismatch',
          `Context state does not reflect current memory state`,
          'context_validation',
          'MemoryContextConsistency',
          { evidence: contextMemoryRule.violations.join('; ') }
        )
      );
    }

    // Rule 3: State mutations must be synchronized
    const syncRule = this.validateStateSynchronization(documentGraph);
    validationRules.push(syncRule);
    if (!syncRule.isValid) {
      issues.push(
        createDetectedIssue(
          'sync_violation',
          'high',
          'State Synchronization Violation',
          `State mutations are not properly synchronized`,
          'psg_consistency',
          'MemoryContextConsistency',
          { evidence: syncRule.violations.join('; ') }
        )
      );
    }

    // Rule 4: Detect memory-context gaps
    const gapsRule = this.detectMemoryContextGaps(agentResults);
    validationRules.push(gapsRule);
    if (!gapsRule.isValid) {
      issues.push(
        createDetectedIssue(
          'completeness',
          'medium',
          'Memory-Context Coverage Gap',
          `Found gaps in memory-context coverage`,
          'completeness',
          'MemoryContextConsistency',
          { evidence: gapsRule.violations.join('; ') }
        )
      );
    }

    const hasCriticalOrHigh = issues.some(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const status: CrossLayerValidation['status'] = issues.length === 0 
      ? 'pass' 
      : hasCriticalOrHigh 
        ? 'fail' 
        : 'warning';

    return {
      ...baseValidation,
      validationRules,
      status,
      issues,
    };
  }

  private validateMemoryPsgConsistency(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Memory-PSG Consistency',
      'psg_consistency',
      'memory_integrity',
      'Memory state must match PSG state',
      'Memory and PSG states are consistent'
    );

    // Check entities for closed world status
    for (const entity of graph.entities) {
      if (entity.type === 'state') {
        if (entity.closedWorldStatus === 'unknown') {
          rule.violations.push(
            `State entity '${entity.name}' has unknown closed-world status`
          );
          rule.isValid = false;
        }
      }
    }

    // Check state mutations for legality
    for (const mutation of graph.stateMutations) {
      if (mutation.isLegal === false) {
        rule.violations.push(
          `Illegal state mutation from '${mutation.source}' to '${mutation.target}'`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }

  private validateContextMemoryConsistency(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Context-Memory Consistency',
      'context_validation',
      'memory_integrity',
      'Context must reflect current memory state',
      'Context and memory are synchronized'
    );

    // Check claims for verification status
    for (const claim of graph.claims) {
      if (claim.type === 'fact' && claim.verificationStatus === 'contradicted') {
        rule.violations.push(
          `Factual claim is contradicted: '${claim.text.substring(0, 50)}...'`
        );
        rule.isValid = false;
      }
    }

    // Check definitions for scope consistency
    for (const definition of graph.definitions) {
      if (definition.scope === 'local') {
        // Check if there are global definitions with the same term
        const globalDefs = graph.definitions.filter(
          (d) => d.term === definition.term && d.scope === 'global'
        );
        if (globalDefs.length > 0) {
          rule.violations.push(
            `Term '${definition.term}' has conflicting local and global definitions`
          );
          rule.isValid = false;
        }
      }
    }

    return rule;
  }

  private validateStateSynchronization(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'State Synchronization',
      'psg_consistency',
      'execution_psg_sync',
      'State mutations must be synchronized across layers',
      'All state mutations are synchronized'
    );

    // Check execution paths for PSG sync
    for (const path of graph.executionPaths) {
      // Check if path has governance points
      if (path.governancePoints.length === 0 && path.steps.length > 2) {
        rule.violations.push(
          `Execution path '${path.id}' has no governance synchronization points`
        );
        rule.isValid = false;
      }

      // Check replay fidelity
      if (path.replayFidelity !== undefined && path.replayFidelity < 0.95) {
        rule.violations.push(
          `Execution path '${path.id}' has low replay fidelity: ${path.replayFidelity}`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }

  private detectMemoryContextGaps(agentResults: AgentResult[]): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Memory-Context Coverage',
      'psg_consistency',
      'context_validation',
      'Memory and context must have complete coverage',
      'No coverage gaps detected'
    );

    const memoryIssues = agentResults
      .filter((r) => r.agentLayer === 'memory_integrity')
      .flatMap((r) => r.issues);

    const contextIssues = agentResults
      .filter((r) => r.agentLayer === 'context_validation')
      .flatMap((r) => r.issues);

    for (const issue of [...memoryIssues, ...contextIssues]) {
      if (issue.type === 'completeness' || issue.type === 'memory_corruption') {
        rule.violations.push(issue.description);
        rule.isValid = false;
      }
    }

    return rule;
  }
}

// ========================================
// AGENT REASONING TRACE MAPPING VALIDATOR
// ========================================

/**
 * Validates that agent decisions are traceable to reasoning steps.
 * Validates reasoning chain completeness and detects reasoning gaps.
 */
export class AgentReasoningTraceMapping {
  private validationId = 'agent-reasoning-trace';

  /**
   * Validates agent outputs ↔ reasoning trace mapping
   */
  validate(
    documentGraph: DocumentGraph,
    agentResults: AgentResult[]
  ): CrossLayerValidation {
    const baseValidation = CROSS_LAYER_VALIDATIONS.find(
      (v) => v.id === this.validationId
    )!;

    const validationRules: CrossLayerRule[] = [];
    const issues: DetectedIssue[] = [];

    // Rule 1: All agent decisions must have reasoning traces
    const traceabilityRule = this.validateDecisionTraceability(agentResults);
    validationRules.push(traceabilityRule);
    if (!traceabilityRule.isValid) {
      issues.push(
        createDetectedIssue(
          'reasoning_gap',
          'high',
          'Untraceable Agent Decision',
          `Found agent decisions without proper reasoning traces`,
          'multi_agent',
          'AgentReasoningTraceMapping',
          { evidence: traceabilityRule.violations.join('; ') }
        )
      );
    }

    // Rule 2: Reasoning chains must be complete
    const completenessRule = this.validateReasoningCompleteness(documentGraph);
    validationRules.push(completenessRule);
    if (!completenessRule.isValid) {
      issues.push(
        createDetectedIssue(
          'reasoning_gap',
          'medium',
          'Incomplete Reasoning Chain',
          `Reasoning chains are missing required steps`,
          'logical',
          'AgentReasoningTraceMapping',
          { evidence: completenessRule.violations.join('; ') }
        )
      );
    }

    // Rule 3: Evidence must be bound to reasoning steps
    const evidenceRule = this.validateEvidenceBinding(documentGraph);
    validationRules.push(evidenceRule);
    if (!evidenceRule.isValid) {
      issues.push(
        createDetectedIssue(
          'evidence_missing',
          'medium',
          'Missing Evidence Binding',
          `Reasoning steps are missing required evidence bindings`,
          'factual',
          'AgentReasoningTraceMapping',
          { evidence: evidenceRule.violations.join('; ') }
        )
      );
    }

    // Rule 4: Detect reasoning gaps
    const gapsRule = this.detectReasoningGaps(agentResults);
    validationRules.push(gapsRule);
    if (!gapsRule.isValid) {
      issues.push(
        createDetectedIssue(
          'reasoning_gap',
          'medium',
          'Reasoning Gap Detected',
          `Found gaps in reasoning that may affect decision validity`,
          'logical',
          'AgentReasoningTraceMapping',
          { evidence: gapsRule.violations.join('; ') }
        )
      );
    }

    const hasCriticalOrHigh = issues.some(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const status: CrossLayerValidation['status'] = issues.length === 0 
      ? 'pass' 
      : hasCriticalOrHigh 
        ? 'fail' 
        : 'warning';

    return {
      ...baseValidation,
      validationRules,
      status,
      issues,
    };
  }

  private validateDecisionTraceability(agentResults: AgentResult[]): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Decision Traceability',
      'multi_agent',
      'logical',
      'All agent decisions must be traceable to reasoning steps',
      'All decisions have reasoning traces'
    );

    for (const result of agentResults) {
      const hasTraces = result.reasoningTraces && result.reasoningTraces.length > 0;
      const hasIssues = result.issues.length > 0;

      if (hasIssues && !hasTraces) {
        rule.violations.push(
          `Agent '${result.agentName}' made decisions without reasoning traces`
        );
        rule.isValid = false;
      }

      // Check if trace IDs are referenced in issues
      if (hasTraces && hasIssues) {
        const traceIds = new Set(result.reasoningTraces!.map((t) => t.id));
        for (const issue of result.issues) {
          if (issue.reasoningTraceId && !traceIds.has(issue.reasoningTraceId)) {
            rule.violations.push(
              `Issue '${issue.id}' references non-existent trace '${issue.reasoningTraceId}'`
            );
            rule.isValid = false;
          }
        }
      }
    }

    return rule;
  }

  private validateReasoningCompleteness(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Reasoning Completeness',
      'logical',
      'semantic',
      'Reasoning chains must be complete and valid',
      'All reasoning chains are complete'
    );

    for (const trace of graph.reasoningTraces) {
      // Check if trace is marked as valid but has invalid steps
      if (trace.isValid) {
        const invalidSteps = trace.steps.filter(
          (s) => s.validationStatus === 'invalid' || s.validationStatus === 'contradicted'
        );
        if (invalidSteps.length > 0) {
          rule.violations.push(
            `Trace '${trace.id}' is marked valid but has ${invalidSteps.length} invalid steps`
          );
          rule.isValid = false;
        }
      }

      // Check for missing evidence
      const stepsWithoutEvidence = trace.steps.filter(
        (s) => s.evidenceIds.length === 0
      );
      if (stepsWithoutEvidence.length > 0) {
        rule.violations.push(
          `Trace '${trace.id}' has ${stepsWithoutEvidence.length} steps without evidence`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }

  private validateEvidenceBinding(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Evidence Binding',
      'factual',
      'logical',
      'Evidence must be properly bound to reasoning steps',
      'All evidence is properly bound'
    );

    for (const trace of graph.reasoningTraces) {
      for (const binding of trace.evidenceBindings) {
        // Check if step exists
        const step = trace.steps.find((s) => s.id === binding.stepId);
        if (!step) {
          rule.violations.push(
            `Evidence binding '${binding.id}' references non-existent step '${binding.stepId}'`
          );
          rule.isValid = false;
          continue;
        }

        // Check evidence quality
        if (binding.relevanceScore < 0.5) {
          rule.violations.push(
            `Evidence binding '${binding.id}' has low relevance score: ${binding.relevanceScore}`
          );
          rule.isValid = false;
        }

        if (binding.reliabilityScore < 0.5) {
          rule.violations.push(
            `Evidence binding '${binding.id}' has low reliability score: ${binding.reliabilityScore}`
          );
          rule.isValid = false;
        }
      }
    }

    return rule;
  }

  private detectReasoningGaps(agentResults: AgentResult[]): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Reasoning Gap Detection',
      'logical',
      'semantic',
      'No reasoning gaps should exist in decision chains',
      'No reasoning gaps detected'
    );

    for (const result of agentResults) {
      if (!result.reasoningTraces) continue;

      for (const trace of result.reasoningTraces) {
        // Check for low confidence propagation
        const lowConfSteps = trace.confidencePropagation.filter((c) => c < 0.6);
        if (lowConfSteps.length > 0) {
          rule.violations.push(
            `Trace '${trace.id}' has ${lowConfSteps.length} steps with low confidence`
          );
          rule.isValid = false;
        }

        // Check for unbounded uncertainty
        const unboundedUncertainty = trace.uncertaintyPropagation.filter(
          (u) => !u.bounded && u.outputUncertainty > 0.5
        );
        if (unboundedUncertainty.length > 0) {
          rule.violations.push(
            `Trace '${trace.id}' has ${unboundedUncertainty.length} steps with unbounded high uncertainty`
          );
          rule.isValid = false;
        }

        // Check self-correction loops
        const divergentLoops = trace.selfCorrectionLoops.filter(
          (l) => l.convergenceStatus === 'diverged' || l.convergenceStatus === 'oscillating'
        );
        if (divergentLoops.length > 0) {
          rule.violations.push(
            `Trace '${trace.id}' has ${divergentLoops.length} divergent self-correction loops`
          );
          rule.isValid = false;
        }
      }
    }

    return rule;
  }
}

// ========================================
// TOOL POLICY CONSTRAINTS VALIDATOR
// ========================================

/**
 * Validates that tool actions comply with policy constraints.
 * Detects policy violations and validates authorization chains.
 */
export class ToolPolicyConstraints {
  private validationId = 'tool-policy-constraint';

  /**
   * Validates tool actions ↔ policy constraints
   */
  validate(
    documentGraph: DocumentGraph,
    agentResults: AgentResult[],
    policies: PolicyRule[] = []
  ): CrossLayerValidation {
    const baseValidation = CROSS_LAYER_VALIDATIONS.find(
      (v) => v.id === this.validationId
    )!;

    const validationRules: CrossLayerRule[] = [];
    const issues: DetectedIssue[] = [];

    // Rule 1: Tool actions must comply with policies
    const complianceRule = this.validatePolicyCompliance(documentGraph, policies);
    validationRules.push(complianceRule);
    if (!complianceRule.isValid) {
      issues.push(
        createDetectedIssue(
          'policy_violation',
          'critical',
          'Policy Violation Detected',
          `Tool actions violate defined policies`,
          'policy_enforcement',
          'ToolPolicyConstraints',
          { evidence: complianceRule.violations.join('; ') }
        )
      );
    }

    // Rule 2: Actions must have proper authorization
    const authRule = this.validateAuthorizationChains(documentGraph);
    validationRules.push(authRule);
    if (!authRule.isValid) {
      issues.push(
        createDetectedIssue(
          'authority_breach',
          'critical',
          'Authorization Chain Violation',
          `Actions performed without proper authorization chain`,
          'authority_boundary',
          'ToolPolicyConstraints',
          { evidence: authRule.violations.join('; ') }
        )
      );
    }

    // Rule 3: Safety constraints must be enforced
    const safetyRule = this.validateSafetyConstraints(documentGraph);
    validationRules.push(safetyRule);
    if (!safetyRule.isValid) {
      issues.push(
        createDetectedIssue(
          'safety_violation',
          'critical',
          'Safety Constraint Violation',
          `Tool actions violate safety constraints`,
          'safety_validation',
          'ToolPolicyConstraints',
          { evidence: safetyRule.violations.join('; ') }
        )
      );
    }

    // Rule 4: Detect policy gaps
    const gapsRule = this.detectPolicyGaps(agentResults, policies);
    validationRules.push(gapsRule);
    if (!gapsRule.isValid) {
      issues.push(
        createDetectedIssue(
          'policy_gap',
          'medium',
          'Policy Gap Detected',
          `Found actions without applicable policies`,
          'governance',
          'ToolPolicyConstraints',
          { evidence: gapsRule.violations.join('; ') }
        )
      );
    }

    const hasCriticalOrHigh = issues.some(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const status: CrossLayerValidation['status'] = issues.length === 0 
      ? 'pass' 
      : hasCriticalOrHigh 
        ? 'fail' 
        : 'warning';

    return {
      ...baseValidation,
      validationRules,
      status,
      issues,
    };
  }

  private validatePolicyCompliance(
    graph: DocumentGraph,
    policies: PolicyRule[]
  ): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Policy Compliance',
      'policy_enforcement',
      'authority_boundary',
      'All tool actions must comply with policies',
      'All actions comply with policies'
    );

    for (const entry of graph.auditEntries) {
      if (entry.result === 'blocked') {
        rule.violations.push(
          `Action '${entry.action}' was blocked by policy`
        );
        rule.isValid = false;
      }

      // Check for policy violations in details
      if (entry.details.policyViolation) {
        rule.violations.push(
          `Audit entry '${entry.id}' has policy violation: ${entry.details.policyViolation}`
        );
        rule.isValid = false;
      }
    }

    // Check governance checkpoints
    for (const checkpoint of graph.governanceCheckpoints) {
      if (checkpoint.enforcementStatus === 'bypassed') {
        rule.violations.push(
          `Governance checkpoint '${checkpoint.id}' was bypassed`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }

  private validateAuthorizationChains(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Authorization Chain Validation',
      'governance',
      'authority_boundary',
      'All actions must have proper authorization chains',
      'All actions have valid authorization'
    );

    for (const mutation of graph.stateMutations) {
      if (!mutation.authority) {
        rule.violations.push(
          `State mutation '${mutation.id}' has no authority specified`
        );
        rule.isValid = false;
      } else if (mutation.riskLevel === 'critical' || mutation.riskLevel === 'high') {
        // High-risk mutations need explicit authorization in audit trail
        const hasAuditEntry = graph.auditEntries.some(
          (e) => e.target === mutation.id && e.result === 'success'
        );
        if (!hasAuditEntry) {
          rule.violations.push(
            `High-risk mutation '${mutation.id}' has no audit trail entry`
          );
          rule.isValid = false;
        }
      }
    }

    return rule;
  }

  private validateSafetyConstraints(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Safety Constraint Validation',
      'safety_validation',
      'boundary_enforcement',
      'All actions must respect safety constraints',
      'All safety constraints are respected'
    );

    for (const path of graph.executionPaths) {
      // Check for state explosion risk
      if (path.stateExplosionRisk) {
        rule.violations.push(
          `Execution path '${path.id}' has state explosion risk`
        );
        rule.isValid = false;
      }

      // Check governance points for safety validations
      const safetyCheckpoints = graph.governanceCheckpoints.filter(
        (c) => path.governancePoints.includes(c.id) && c.type === 'validation'
      );

      if (safetyCheckpoints.length === 0 && path.steps.length > 3) {
        rule.violations.push(
          `Execution path '${path.id}' has no safety validation checkpoints`
        );
        rule.isValid = false;
      }
    }

    return rule;
  }

  private detectPolicyGaps(
    agentResults: AgentResult[],
    policies: PolicyRule[]
  ): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Policy Gap Detection',
      'governance',
      'policy_enforcement',
      'All action types should have applicable policies',
      'No policy gaps detected'
    );

    const policyIssues = agentResults
      .filter((r) => r.agentLayer === 'policy_enforcement')
      .flatMap((r) => r.issues);

    for (const issue of policyIssues) {
      if (issue.type === 'policy_gap' || issue.type === 'rule_ambiguity') {
        rule.violations.push(issue.description);
        rule.isValid = false;
      }
    }

    return rule;
  }
}

// ========================================
// CONTROL RUNTIME ENFORCEMENT VALIDATOR
// ========================================

/**
 * Validates that control plane decisions are enforced at runtime.
 * Detects enforcement gaps and validates enforcement consistency.
 */
export class ControlRuntimeEnforcement {
  private validationId = 'control-runtime-enforcement';

  /**
   * Validates control plane ↔ runtime enforcement
   */
  validate(
    documentGraph: DocumentGraph,
    agentResults: AgentResult[]
  ): CrossLayerValidation {
    const baseValidation = CROSS_LAYER_VALIDATIONS.find(
      (v) => v.id === this.validationId
    )!;

    const validationRules: CrossLayerRule[] = [];
    const issues: DetectedIssue[] = [];

    // Rule 1: Control decisions must be enforced at runtime
    const enforcementRule = this.validateControlEnforcement(documentGraph);
    validationRules.push(enforcementRule);
    if (!enforcementRule.isValid) {
      issues.push(
        createDetectedIssue(
          'enforcement_gap',
          'critical',
          'Control Enforcement Gap',
          `Control plane decisions are not being enforced at runtime`,
          'boundary_enforcement',
          'ControlRuntimeEnforcement',
          { evidence: enforcementRule.violations.join('; ') }
        )
      );
    }

    // Rule 2: Invariant enforcement must be consistent
    const invariantRule = this.validateInvariantEnforcementConsistency(documentGraph);
    validationRules.push(invariantRule);
    if (!invariantRule.isValid) {
      issues.push(
        createDetectedIssue(
          'invariant_not_enforced',
          'critical',
          'Invariant Enforcement Inconsistency',
          `Invariants are not consistently enforced`,
          'invariant_enforcement',
          'ControlRuntimeEnforcement',
          { evidence: invariantRule.violations.join('; ') }
        )
      );
    }

    // Rule 3: Override controls must be properly tracked
    const overrideRule = this.validateOverrideControls(documentGraph);
    validationRules.push(overrideRule);
    if (!overrideRule.isValid) {
      issues.push(
        createDetectedIssue(
          'unauthorized_override',
          'high',
          'Unauthorized Override Detected',
          `Override controls are not properly tracked or authorized`,
          'override_control',
          'ControlRuntimeEnforcement',
          { evidence: overrideRule.violations.join('; ') }
        )
      );
    }

    // Rule 4: Detect enforcement gaps
    const gapsRule = this.detectEnforcementGaps(agentResults);
    validationRules.push(gapsRule);
    if (!gapsRule.isValid) {
      issues.push(
        createDetectedIssue(
          'enforcement_gap',
          'medium',
          'Enforcement Gap Detected',
          `Found gaps in control-to-runtime enforcement`,
          'governance',
          'ControlRuntimeEnforcement',
          { evidence: gapsRule.violations.join('; ') }
        )
      );
    }

    const hasCriticalOrHigh = issues.some(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const status: CrossLayerValidation['status'] = issues.length === 0 
      ? 'pass' 
      : hasCriticalOrHigh 
        ? 'fail' 
        : 'warning';

    return {
      ...baseValidation,
      validationRules,
      status,
      issues,
    };
  }

  private validateControlEnforcement(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Control Enforcement',
      'governance',
      'boundary_enforcement',
      'Control plane decisions must be enforced at runtime',
      'All control decisions are enforced'
    );

    // Check governance checkpoints
    for (const checkpoint of graph.governanceCheckpoints) {
      if (checkpoint.type === 'enforcement') {
        if (checkpoint.enforcementStatus === 'bypassed') {
          rule.violations.push(
            `Enforcement checkpoint '${checkpoint.id}' was bypassed`
          );
          rule.isValid = false;
        } else if (checkpoint.enforcementStatus === 'partial') {
          rule.violations.push(
            `Enforcement checkpoint '${checkpoint.id}' was only partially enforced`
          );
          rule.isValid = false;
        }
      }
    }

    // Check for missing enforcement at runtime
    const controlPolicies = graph.policies.filter(
      (p) => p.layer === 'governance' || p.layer === 'override_control'
    );

    for (const policy of controlPolicies) {
      if (policy.isActive) {
        // Check if there are corresponding audit entries
        const policyAudits = graph.auditEntries.filter(
          (e) => e.details.policyId === policy.id
        );

        if (policyAudits.length === 0 && policy.rules.length > 0) {
          rule.violations.push(
            `Active policy '${policy.name}' has no audit entries`
          );
          rule.isValid = false;
        }
      }
    }

    return rule;
  }

  private validateInvariantEnforcementConsistency(
    graph: DocumentGraph
  ): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Invariant Enforcement Consistency',
      'invariant_enforcement',
      'boundary_enforcement',
      'Invariants must be consistently enforced',
      'All invariants consistently enforced'
    );

    // Check invariant IDs in state mutations
    for (const mutation of graph.stateMutations) {
      if (mutation.invariantIds && mutation.invariantIds.length > 0) {
        // Check if all invariant IDs exist in governance checkpoints
        for (const invId of mutation.invariantIds) {
          const checkpoint = graph.governanceCheckpoints.find(
            (c) => c.rule === invId
          );

          if (!checkpoint) {
            rule.violations.push(
              `Mutation '${mutation.id}' references invariant '${invId}' with no governance checkpoint`
            );
            rule.isValid = false;
          } else if (checkpoint.enforcementStatus === 'bypassed') {
            rule.violations.push(
              `Invariant '${invId}' was bypassed for mutation '${mutation.id}'`
            );
            rule.isValid = false;
          }
        }
      }
    }

    return rule;
  }

  private validateOverrideControls(graph: DocumentGraph): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Override Control Validation',
      'override_control',
      'governance',
      'Override controls must be properly tracked',
      'All overrides are properly tracked'
    );

    for (const entry of graph.auditEntries) {
      if (entry.overrideId) {
        // Check if override was approved
        if (entry.result === 'success') {
          rule.violations.push(
            `Audit entry '${entry.id}' used override '${entry.overrideId}' - verify approval`
          );
          // This is a warning, not necessarily invalid
        }
      }
    }

    // Check for unauthorized overrides
    const overridePolicies = graph.policies.filter(
      (p) => p.layer === 'override_control'
    );

    for (const policy of overridePolicies) {
      for (const rule_pol of policy.rules) {
        // Check if there are audit entries for override rules
        const overrideAudits = graph.auditEntries.filter(
          (e) => e.overrideId === rule_pol.id
        );

        for (const audit of overrideAudits) {
          if (!audit.details.approvedBy) {
            rule.violations.push(
              `Override '${rule_pol.name}' used without approval in audit '${audit.id}'`
            );
            rule.isValid = false;
          }
        }
      }
    }

    return rule;
  }

  private detectEnforcementGaps(agentResults: AgentResult[]): CrossLayerRule {
    const rule = createCrossLayerRule(
      'Enforcement Gap Detection',
      'governance',
      'boundary_enforcement',
      'No enforcement gaps should exist',
      'No enforcement gaps detected'
    );

    const enforcementIssues = agentResults
      .filter(
        (r) =>
          r.agentLayer === 'boundary_enforcement' ||
          r.agentLayer === 'invariant_enforcement'
      )
      .flatMap((r) => r.issues);

    for (const issue of enforcementIssues) {
      if (issue.type === 'enforcement_gap' || issue.type === 'invariant_bypass') {
        rule.violations.push(issue.description);
        rule.isValid = false;
      }
    }

    return rule;
  }
}

// ========================================
// CROSS-LAYER VALIDATION ENGINE
// ========================================

/**
 * Main orchestration class for cross-layer validation.
 * Runs all cross-layer validations, aggregates results, and generates violation reports.
 */
export class CrossLayerValidationEngine {
  private architectureExecutionValidator: ArchitectureExecutionConsistency;
  private memoryContextValidator: MemoryContextConsistency;
  private agentReasoningValidator: AgentReasoningTraceMapping;
  private toolPolicyValidator: ToolPolicyConstraints;
  private controlRuntimeValidator: ControlRuntimeEnforcement;

  constructor() {
    this.architectureExecutionValidator = new ArchitectureExecutionConsistency();
    this.memoryContextValidator = new MemoryContextConsistency();
    this.agentReasoningValidator = new AgentReasoningTraceMapping();
    this.toolPolicyValidator = new ToolPolicyConstraints();
    this.controlRuntimeValidator = new ControlRuntimeEnforcement();
  }

  /**
   * Runs all cross-layer validations
   */
  runAllValidations(
    documentGraph: DocumentGraph,
    agentResults: AgentResult[],
    policies: PolicyRule[] = []
  ): CrossLayerValidation[] {
    return [
      this.architectureExecutionValidator.validate(documentGraph, agentResults),
      this.memoryContextValidator.validate(documentGraph, agentResults),
      this.agentReasoningValidator.validate(documentGraph, agentResults),
      this.toolPolicyValidator.validate(documentGraph, agentResults, policies),
      this.controlRuntimeValidator.validate(documentGraph, agentResults),
    ];
  }

  /**
   * Aggregates validation results into a summary
   */
  aggregateResults(validations: CrossLayerValidation[]): {
    totalValidations: number;
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    infoIssues: number;
  } {
    const passed = validations.filter((v) => v.status === 'pass').length;
    const failed = validations.filter((v) => v.status === 'fail').length;
    const warnings = validations.filter((v) => v.status === 'warning').length;
    const notApplicable = validations.filter(
      (v) => v.status === 'not_applicable'
    ).length;

    const allIssues = validations.flatMap((v) => v.issues);

    return {
      totalValidations: validations.length,
      passed,
      failed,
      warnings,
      notApplicable,
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter((i) => i.severity === 'critical').length,
      highIssues: allIssues.filter((i) => i.severity === 'high').length,
      mediumIssues: allIssues.filter((i) => i.severity === 'medium').length,
      lowIssues: allIssues.filter((i) => i.severity === 'low').length,
      infoIssues: allIssues.filter((i) => i.severity === 'info').length,
    };
  }

  /**
   * Generates a violation report
   */
  generateViolationReport(validations: CrossLayerValidation[]): {
    reportId: string;
    timestamp: Date;
    validations: CrossLayerValidation[];
    summary: ReturnType<CrossLayerValidationEngine['aggregateResults']>;
    criticalViolations: DetectedIssue[];
    recommendations: string[];
  } {
    const summary = this.aggregateResults(validations);
    const criticalViolations = validations
      .flatMap((v) => v.issues)
      .filter((i) => i.severity === 'critical' || i.severity === 'high');

    const recommendations = this.generateRecommendations(validations);

    return {
      reportId: generateId(),
      timestamp: new Date(),
      validations,
      summary,
      criticalViolations,
      recommendations,
    };
  }

  private generateRecommendations(validations: CrossLayerValidation[]): string[] {
    const recommendations: string[] = [];

    for (const validation of validations) {
      if (validation.status === 'fail') {
        recommendations.push(
          `URGENT: Address ${validation.name} failures - found ${validation.issues.length} issues`
        );
      } else if (validation.status === 'warning') {
        recommendations.push(
          `Review ${validation.name} warnings - found ${validation.issues.length} potential issues`
        );
      }
    }

    // Add specific recommendations based on issue types
    const allIssues = validations.flatMap((v) => v.issues);

    if (allIssues.some((i) => i.type === 'policy_violation')) {
      recommendations.push(
        'Review and update policy definitions to address violations'
      );
    }

    if (allIssues.some((i) => i.type === 'enforcement_gap')) {
      recommendations.push(
        'Strengthen enforcement mechanisms to close identified gaps'
      );
    }

    if (allIssues.some((i) => i.type === 'reasoning_gap')) {
      recommendations.push(
        'Enhance reasoning trace capture to ensure decision traceability'
      );
    }

    if (allIssues.some((i) => i.type === 'memory_corruption')) {
      recommendations.push(
        'Investigate and resolve memory-context synchronization issues'
      );
    }

    return recommendations;
  }
}

// ========================================
// CONVENIENCE FUNCTION
// ========================================

/**
 * Runs all cross-layer validations and returns the results.
 * This is the main entry point for cross-layer validation.
 */
export function runAllCrossLayerValidations(
  documentGraph: DocumentGraph,
  agentResults: AgentResult[],
  policies: PolicyRule[] = []
): CrossLayerValidation[] {
  const engine = new CrossLayerValidationEngine();
  return engine.runAllValidations(documentGraph, agentResults, policies);
}
