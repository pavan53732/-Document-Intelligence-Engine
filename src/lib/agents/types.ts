// Complete Agent Types - 38+ Layers, 55+ Agent System
// For Deterministic Autonomous System Specifications
// Version 2.0 - Enhanced with Reasoning Traces, Policy Engine, Cross-Layer Validation

// ========================================
// 38+ ANALYSIS LAYERS
// ========================================

export type IssueLayer = 
  // BASE LAYERS (1-10)
  | 'contradiction'        // Layer 1
  | 'logical'              // Layer 2
  | 'structural'           // Layer 3
  | 'semantic'             // Layer 4
  | 'factual'              // Layer 5
  | 'functional'           // Layer 6
  | 'temporal'             // Layer 7
  | 'architectural'        // Layer 8
  | 'completeness'         // Layer 9
  | 'intent'               // Layer 10
  // SYSTEM CORE LAYERS (11-15)
  | 'execution_invariant'  // Layer 11
  | 'authority_boundary'   // Layer 12
  | 'deterministic'        // Layer 13
  | 'governance'           // Layer 14
  | 'psg_consistency'      // Layer 15
  // FORMAL SYSTEM LAYERS (16-28)
  | 'invariant_closure'    // Layer 16
  | 'state_mutation'       // Layer 17
  | 'authority_leak'       // Layer 18
  | 'closed_world'         // Layer 19
  | 'replay_fidelity'      // Layer 20
  | 'multi_agent'          // Layer 21
  | 'execution_psg_sync'   // Layer 22
  | 'recovery'             // Layer 23
  | 'concurrency'          // Layer 24
  | 'boundary_enforcement' // Layer 25
  | 'simulation'           // Layer 26
  | 'convergence'          // Layer 27
  | 'semantic_execution'   // Layer 28
  // POLICY ENGINE LAYERS (29-32)
  | 'policy_enforcement'   // Layer 29
  | 'rule_conflict'        // Layer 30
  | 'audit_trail'          // Layer 31
  | 'override_control'     // Layer 32
  // FORMAL VERIFICATION LAYERS (33-38)
  | 'invariant_enforcement'// Layer 33
  | 'determinism_audit'    // Layer 34
  | 'spec_compliance'      // Layer 35
  | 'ambiguity_resolution' // Layer 36
  | 'state_explosion'      // Layer 37
  | 'formal_verification'  // Layer 38
  // VALIDATION LAYERS (39-42)
  | 'context_validation'   // Layer 39
  | 'memory_integrity'     // Layer 40
  | 'safety_validation'    // Layer 41
  | 'performance_validation';// Layer 42

// ========================================
// 5-LEVEL SEVERITY SYSTEM
// ========================================

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_CONFIG: Record<Severity, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  priority: number;
}> = {
  critical: { 
    label: 'CRITICAL', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-500',
    priority: 5 
  },
  high: { 
    label: 'HIGH', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50', 
    borderColor: 'border-orange-500',
    priority: 4 
  },
  medium: { 
    label: 'MEDIUM', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-500',
    priority: 3 
  },
  low: { 
    label: 'LOW', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-500',
    priority: 2 
  },
  info: { 
    label: 'INFO', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50', 
    borderColor: 'border-gray-300',
    priority: 1 
  },
};

// ========================================
// ISSUE TYPES (100+)
// ========================================

export type IssueType = 
  // BASE ISSUES
  | 'hallucination' | 'contradiction' | 'consistency' | 'structural' 
  | 'logical' | 'functional' | 'semantic' | 'temporal' 
  | 'completeness' | 'intent' | 'architectural' | 'quantitative'
  // SYSTEM CORE ISSUES
  | 'invariant_violation' | 'authority_breach' | 'nondeterminism' 
  | 'governance_gap' | 'psg_integrity'
  // FORMAL SYSTEM ISSUES
  | 'invariant_bypass' | 'mutation_illegality' | 'privilege_escalation'
  | 'unknown_entity' | 'replay_divergence' | 'agent_conflict'
  | 'sync_violation' | 'recovery_failure' | 'race_condition'
  | 'enforcement_gap' | 'simulation_drift' | 'convergence_failure'
  | 'semantic_drift'
  // POLICY ENGINE ISSUES
  | 'policy_violation' | 'rule_conflict' | 'missing_audit_trail'
  | 'unauthorized_override' | 'policy_gap' | 'rule_ambiguity'
  // FORMAL VERIFICATION ISSUES
  | 'invariant_not_enforced' | 'determinism_break' | 'spec_violation'
  | 'ambiguity_detected' | 'state_explosion_risk' | 'verification_failure'
  // VALIDATION ISSUES
  | 'context_mismatch' | 'memory_corruption' | 'safety_violation'
  | 'performance_degradation' | 'resource_exhaustion'
  // REASONING TRACE ISSUES
  | 'reasoning_gap' | 'evidence_missing' | 'uncertainty_propagation'
  | 'self_correction_loop' | 'multi_step_failure'
  // META ISSUES
  | 'adversarial' | 'meta' | 'cross_layer_violation';

// ========================================
// REASONING TRACE SYSTEM
// ========================================

export interface ReasoningStep {
  id: string;
  stepNumber: number;
  type: 'deduction' | 'induction' | 'abduction' | 'analogy' | 'causal';
  premise: string;
  conclusion: string;
  confidence: number;
  evidenceIds: string[];
  assumptions: string[];
  isEnforceable: boolean;
  validationStatus: 'valid' | 'invalid' | 'unverified' | 'contradicted';
}

export interface ReasoningTrace {
  id: string;
  agentSource: string;
  issueId: string;
  steps: ReasoningStep[];
  totalSteps: number;
  isValid: boolean;
  confidencePropagation: number[];
  uncertaintyPropagation: UncertaintyPropagation[];
  selfCorrectionLoops: SelfCorrectionLoop[];
  evidenceBindings: EvidenceBinding[];
  createdAt: Date;
}

export interface UncertaintyPropagation {
  stepId: string;
  inputUncertainty: number;
  outputUncertainty: number;
  propagationRule: 'additive' | 'multiplicative' | 'max' | 'bayesian';
  bounded: boolean;
}

export interface SelfCorrectionLoop {
  id: string;
  traceId: string;
  steps: string[];
  maxIterations: number;
  actualIterations: number;
  convergenceStatus: 'converged' | 'diverged' | 'oscillating' | 'bounded';
  terminationReason: string;
}

export interface EvidenceBinding {
  id: string;
  traceId: string;
  stepId: string;
  evidenceType: 'direct' | 'indirect' | 'circumstantial' | 'expert' | 'statistical';
  source: string;
  quote: string;
  location: string;
  relevanceScore: number;
  reliabilityScore: number;
  chainOfCustody: string[];
}

// ========================================
// POLICY ENGINE TYPES
// ========================================

export interface Policy {
  id: string;
  name: string;
  description: string;
  layer: IssueLayer;
  rules: PolicyRule[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  policyId: string;
  name: string;
  condition: string;
  action: string;
  severity: Severity;
  exceptions: string[];
  dependencies: string[];
  conflicts: string[];
}

export interface RuleConflict {
  id: string;
  rule1Id: string;
  rule2Id: string;
  conflictType: 'contradiction' | 'overlap' | 'exclusion' | 'priority';
  description: string;
  resolution: 'rule1_wins' | 'rule2_wins' | 'merge' | 'escalate' | 'unresolved';
  resolutionReason?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  agentSource: string;
  action: string;
  target: string;
  result: 'success' | 'failure' | 'warning' | 'blocked';
  details: Record<string, unknown>;
  evidence: string[];
  overrideId?: string;
}

export interface OverrideRequest {
  id: string;
  ruleId: string;
  requestedBy: string;
  reason: string;
  justification: string;
  riskAssessment: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
}

// ========================================
// CROSS-LAYER VALIDATION
// ========================================

export interface CrossLayerValidation {
  id: string;
  name: string;
  description: string;
  sourceLayers: IssueLayer[];
  targetLayers: IssueLayer[];
  validationRules: CrossLayerRule[];
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  issues: DetectedIssue[];
}

export interface CrossLayerRule {
  id: string;
  name: string;
  sourceLayer: IssueLayer;
  targetLayer: IssueLayer;
  condition: string;
  expectedResult: string;
  actualResult?: string;
  isValid: boolean;
  violations: string[];
}

export const CROSS_LAYER_VALIDATIONS: CrossLayerValidation[] = [
  {
    id: 'arch-exec-consistency',
    name: 'Architecture ↔ Execution Consistency',
    description: 'Validates that execution paths match architectural definitions',
    sourceLayers: ['architectural'],
    targetLayers: ['execution_invariant', 'execution_psg_sync'],
    validationRules: [],
    status: 'not_applicable',
    issues: [],
  },
  {
    id: 'mem-ctx-consistency',
    name: 'Memory ↔ Context Consistency',
    description: 'Validates that memory state matches context state',
    sourceLayers: ['psg_consistency'],
    targetLayers: ['context_validation', 'memory_integrity'],
    validationRules: [],
    status: 'not_applicable',
    issues: [],
  },
  {
    id: 'agent-reasoning-trace',
    name: 'Agent Outputs ↔ Reasoning Trace Mapping',
    description: 'Validates that agent decisions are traceable to reasoning steps',
    sourceLayers: ['multi_agent'],
    targetLayers: ['logical', 'semantic'],
    validationRules: [],
    status: 'not_applicable',
    issues: [],
  },
  {
    id: 'tool-policy-constraint',
    name: 'Tool Actions ↔ Policy Constraints',
    description: 'Validates that tool actions comply with policy constraints',
    sourceLayers: ['governance', 'policy_enforcement'],
    targetLayers: ['authority_boundary', 'safety_validation'],
    validationRules: [],
    status: 'not_applicable',
    issues: [],
  },
  {
    id: 'control-runtime-enforcement',
    name: 'Control Plane ↔ Runtime Enforcement',
    description: 'Validates that control plane decisions are enforced at runtime',
    sourceLayers: ['governance', 'override_control'],
    targetLayers: ['boundary_enforcement', 'invariant_enforcement'],
    validationRules: [],
    status: 'not_applicable',
    issues: [],
  },
];

// ========================================
// AUDIT OUTPUT REQUIREMENTS
// ========================================

export interface AuditOutput {
  id: string;
  sessionId: string;
  timestamp: Date;
  findings: AuditFinding[];
  closedWorldValidation: ClosedWorldValidation;
  severityClassification: SeverityClassification;
  patchReadyCorrections: PatchReadyCorrection[];
  deterministicProof: DeterministicProof;
}

export interface AuditFinding {
  id: string;
  issueId: string;
  isDeterministic: boolean;
  hasNoAssumptions: boolean;
  closedWorldValidated: boolean;
  severity: Severity;
  patchReady: boolean;
  evidenceChain: string[];
  verificationMethod: string;
}

export interface ClosedWorldValidation {
  id: string;
  entitiesVerified: number;
  entitiesUnknown: number;
  assumptionsRejected: number;
  isValid: boolean;
  violations: string[];
}

export interface SeverityClassification {
  id: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
  classificationMethod: string;
}

export interface PatchReadyCorrection {
  id: string;
  issueId: string;
  issueTitle: string;
  currentContent: string;
  suggestedContent: string;
  changeType: 'add' | 'modify' | 'delete' | 'restructure';
  confidence: number;
  automatedSafe: boolean;
  reviewRequired: boolean;
  impact: string;
}

export interface DeterministicProof {
  id: string;
  proofType: 'exhaustive' | 'sampling' | 'formal' | 'statistical';
  sampleSize: number;
  passRate: number;
  reproducibilityScore: number;
  evidence: string[];
}

// ========================================
// DETECTED ISSUE (Enhanced)
// ========================================

export interface DetectedIssue {
  id: string;
  type: IssueType;
  severity: Severity;
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
  fileName?: string;
  evidence?: string;
  confidence: number;
  agentSource: string;
  layer: IssueLayer;
  subType?: string;
  impact?: string;
  crossReferences?: string[];
  // New fields for enhanced system
  reasoningTraceId?: string;
  evidenceBindings?: EvidenceBinding[];
  policyViolation?: string;
  auditEntryId?: string;
  patchReadyCorrection?: PatchReadyCorrection;
  crossLayerViolations?: string[];
  isDeterministic?: boolean;
  closedWorldValidated?: boolean;
}

// ========================================
// DOCUMENT STRUCTURES
// ========================================

export interface DocumentChunk {
  id: string;
  fileName: string;
  content: string;
  startLine: number;
  endLine: number;
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'table' | 'quote' | 'other';
  metadata: Record<string, unknown>;
}

export interface DocumentGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  claims: Claim[];
  definitions: Definition[];
  references: Reference[];
  entities: Entity[];
  stateMutations: StateMutation[];
  executionPaths: ExecutionPath[];
  governanceCheckpoints: GovernanceCheckpoint[];
  // Enhanced fields
  policies: Policy[];
  reasoningTraces: ReasoningTrace[];
  auditEntries: AuditEntry[];
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  content: string;
  location: string;
  fileName: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface Claim {
  id: string;
  text: string;
  location: string;
  fileName: string;
  type: 'fact' | 'opinion' | 'inference' | 'definition' | 'prediction' | 'instruction';
  confidence: number;
  evidence?: string;
  // Enhanced fields
  evidenceBindings?: EvidenceBinding[];
  verificationStatus?: 'verified' | 'unverified' | 'contradicted' | 'partial';
}

export interface Definition {
  id: string;
  term: string;
  definition: string;
  location: string;
  fileName: string;
  // Enhanced fields
  aliases?: string[];
  scope?: 'global' | 'local' | 'contextual';
}

export interface Reference {
  id: string;
  text: string;
  target: string;
  location: string;
  fileName: string;
  type: 'internal' | 'external' | 'code' | 'resource';
  // Enhanced fields
  isValid?: boolean;
  resolutionStatus?: 'resolved' | 'unresolved' | 'ambiguous';
}

export interface Entity {
  id: string;
  name: string;
  type: 'agent' | 'component' | 'state' | 'resource' | 'authority' | 'boundary' | 'policy' | 'rule';
  mentions: Array<{ text: string; location: string; fileName: string }>;
  attributes: Record<string, unknown>;
  // Enhanced fields
  closedWorldStatus?: 'known' | 'unknown' | 'partial';
  verificationRequired?: boolean;
}

export interface StateMutation {
  id: string;
  source: string;
  target: string;
  preconditions: string[];
  postconditions: string[];
  authority: string;
  location: string;
  fileName: string;
  // Enhanced fields
  isLegal?: boolean;
  invariantIds?: string[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExecutionPath {
  id: string;
  steps: string[];
  invariants: string[];
  governancePoints: string[];
  location: string;
  fileName: string;
  // Enhanced fields
  isDeterministic?: boolean;
  replayFidelity?: number;
  stateExplosionRisk?: boolean;
}

export interface GovernanceCheckpoint {
  id: string;
  type: 'validation' | 'authorization' | 'audit' | 'enforcement';
  rule: string;
  location: string;
  fileName: string;
  // Enhanced fields
  policyId?: string;
  enforcementStatus?: 'enforced' | 'bypassed' | 'partial';
}

// ========================================
// AGENT RESULT (Enhanced)
// ========================================

export interface AgentResult {
  agentName: string;
  agentLayer: IssueLayer;
  agentTier: 'core' | 'advanced' | 'meta' | 'policy' | 'formal' | 'validation';
  issues: DetectedIssue[];
  claims: Claim[];
  confidence: number;
  processingTime: number;
  metadata?: Record<string, unknown>;
  // Enhanced fields
  reasoningTraces?: ReasoningTrace[];
  auditEntries?: AuditEntry[];
  crossLayerValidations?: CrossLayerValidation[];
  deterministicProof?: DeterministicProof;
}

// ========================================
// META COGNITION REPORT (Enhanced)
// ========================================

export interface MetaCognitionReport {
  overallConfidence: number;
  agentAgreement: number;
  highConfidenceIssues: number;
  uncertainIssues: number;
  disagreementPoints: string[];
  recommendedReview: string[];
  layerScores: Record<IssueLayer, number>;
  // Enhanced fields
  reasoningTraceCoverage: number;
  evidenceBindingCoverage: number;
  uncertaintyPropagationScore: number;
  selfCorrectionLoopStatus: 'none' | 'converged' | 'diverged' | 'bounded';
  policyComplianceScore: number;
  auditTrailCompleteness: number;
  crossLayerValidationResults: CrossLayerValidation[];
  closedWorldValidationScore: number;
  deterministicScore: number;
}

// ========================================
// ANALYSIS SUMMARY (Enhanced)
// ========================================

export interface AnalysisSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  byType: Record<IssueType, number>;
  byLayer: Record<IssueLayer, number>;
  byAgent: Record<string, number>;
  byTier: { core: number; advanced: number; meta: number; policy: number; formal: number; validation: number };
  confidence: number;
  documentHealthScore: number;
  executionSafetyScore: number;
  governanceScore: number;
  determinismScore: number;
  // Enhanced fields
  reasoningTraceScore: number;
  evidenceBindingScore: number;
  policyComplianceScore: number;
  crossLayerValidationScore: number;
  closedWorldScore: number;
  auditTrailScore: number;
}

// ========================================
// AGENT CONFIGURATION (55+ Agents)
// ========================================

export const AGENT_CONFIG = {
  // ========================================
  // CORE AGENTS (10)
  // ========================================
  logicChecker: {
    name: 'Logic Checker',
    tier: 'core' as const,
    layer: 'logical' as IssueLayer,
    description: 'Detects fallacies, circular reasoning, invalid inferences',
    icon: '🧠',
    color: 'purple',
    layerGroup: 'base',
  },
  consistencyChecker: {
    name: 'Consistency Checker',
    tier: 'core' as const,
    layer: 'contradiction' as IssueLayer,
    description: 'Checks terminology, naming conventions, style consistency',
    icon: '🔄',
    color: 'amber',
    layerGroup: 'base',
  },
  contradictionDetector: {
    name: 'Contradiction Detector',
    tier: 'core' as const,
    layer: 'contradiction' as IssueLayer,
    description: 'Identifies conflicting statements within and across documents',
    icon: '⚡',
    color: 'red',
    layerGroup: 'base',
  },
  structureAnalyzer: {
    name: 'Structure Analyzer',
    tier: 'core' as const,
    layer: 'structural' as IssueLayer,
    description: 'Analyzes document structure, heading hierarchy, organization',
    icon: '🏗️',
    color: 'blue',
    layerGroup: 'base',
  },
  factChecker: {
    name: 'Fact Checker',
    tier: 'core' as const,
    layer: 'factual' as IssueLayer,
    description: 'Validates claims against evidence, detects hallucinations',
    icon: '🔍',
    color: 'emerald',
    layerGroup: 'base',
  },
  intentScopeChecker: {
    name: 'Intent-Scope Checker',
    tier: 'core' as const,
    layer: 'intent' as IssueLayer,
    description: 'Verifies requirement boundaries, detects scope bleed',
    icon: '🧭',
    color: 'rose',
    layerGroup: 'base',
  },
  dependencyChecker: {
    name: 'Dependency Checker',
    tier: 'core' as const,
    layer: 'structural' as IssueLayer,
    description: 'Validates cross-section dependencies, undefined references',
    icon: '🔗',
    color: 'cyan',
    layerGroup: 'base',
  },
  terminologyChecker: {
    name: 'Terminology Checker',
    tier: 'core' as const,
    layer: 'semantic' as IssueLayer,
    description: 'Canonical vocabulary enforcement, synonym drift detection',
    icon: '📚',
    color: 'violet',
    layerGroup: 'base',
  },
  assumptionDetector: {
    name: 'Assumption Detector',
    tier: 'core' as const,
    layer: 'semantic' as IssueLayer,
    description: 'Finds implicit assumptions, undefined external dependencies',
    icon: '🧠',
    color: 'pink',
    layerGroup: 'base',
  },
  exampleChecker: {
    name: 'Example Checker',
    tier: 'core' as const,
    layer: 'factual' as IssueLayer,
    description: 'Validates examples vs actual rules, misleading cases',
    icon: '🧪',
    color: 'teal',
    layerGroup: 'base',
  },

  // ========================================
  // ADVANCED AGENTS (20)
  // ========================================
  semanticAnalyzer: {
    name: 'Semantic Analyzer',
    tier: 'advanced' as const,
    layer: 'semantic' as IssueLayer,
    description: 'Detects ambiguity, vagueness, undefined terms',
    icon: '💬',
    color: 'pink',
    layerGroup: 'base',
  },
  functionalValidator: {
    name: 'Functional Validator',
    tier: 'advanced' as const,
    layer: 'functional' as IssueLayer,
    description: 'Checks impossible steps, broken workflows, dependency gaps',
    icon: '⚙️',
    color: 'orange',
    layerGroup: 'base',
  },
  temporalAnalyzer: {
    name: 'Temporal Analyzer',
    tier: 'advanced' as const,
    layer: 'temporal' as IssueLayer,
    description: 'Detects timeline contradictions, sequence errors',
    icon: '⏰',
    color: 'cyan',
    layerGroup: 'base',
  },
  completenessChecker: {
    name: 'Completeness Checker',
    tier: 'advanced' as const,
    layer: 'completeness' as IssueLayer,
    description: 'Finds missing edge cases, gaps in coverage',
    icon: '🧩',
    color: 'violet',
    layerGroup: 'base',
  },
  quantitativeChecker: {
    name: 'Quantitative Checker',
    tier: 'advanced' as const,
    layer: 'architectural' as IssueLayer,
    description: 'Detects calculation errors, unit inconsistencies',
    icon: '📊',
    color: 'teal',
    layerGroup: 'base',
  },
  adversarialAnalyzer: {
    name: 'Adversarial Analyzer',
    tier: 'advanced' as const,
    layer: 'semantic_execution' as IssueLayer,
    description: 'Stress tests claims, finds weak points',
    icon: '⚔️',
    color: 'slate',
    layerGroup: 'formal',
  },
  authorityBoundaryAnalyzer: {
    name: 'Authority Boundary Analyzer',
    tier: 'advanced' as const,
    layer: 'authority_boundary' as IssueLayer,
    description: 'Checks permission isolation, privilege escalation paths',
    icon: '🔒',
    color: 'red',
    layerGroup: 'system_core',
  },
  executionInvariantValidator: {
    name: 'Execution Invariant Validator',
    tier: 'advanced' as const,
    layer: 'execution_invariant' as IssueLayer,
    description: 'Validates invariant completeness, bypass channels',
    icon: '🔁',
    color: 'orange',
    layerGroup: 'system_core',
  },
  governanceAnalyzer: {
    name: 'Governance Analyzer',
    tier: 'advanced' as const,
    layer: 'governance' as IssueLayer,
    description: 'Checks enforcement at all checkpoints, missing validation',
    icon: '🎛️',
    color: 'indigo',
    layerGroup: 'system_core',
  },
  stateMutationValidator: {
    name: 'State Mutation Validator',
    tier: 'advanced' as const,
    layer: 'state_mutation' as IssueLayer,
    description: 'Verifies legal state transitions, invalid mutation paths',
    icon: '🗂️',
    color: 'amber',
    layerGroup: 'formal',
  },
  determinismAnalyzer: {
    name: 'Determinism Analyzer',
    tier: 'advanced' as const,
    layer: 'deterministic' as IssueLayer,
    description: 'Detects nondeterministic logic, replay stability',
    icon: '🔄',
    color: 'blue',
    layerGroup: 'system_core',
  },
  multiAgentConsistencyAnalyzer: {
    name: 'Multi-Agent Consistency Analyzer',
    tier: 'advanced' as const,
    layer: 'multi_agent' as IssueLayer,
    description: 'Detects conflicting agent decisions, coordination gaps',
    icon: '🧩',
    color: 'purple',
    layerGroup: 'formal',
  },
  concurrencyAnalyzer: {
    name: 'Concurrency Safety Analyzer',
    tier: 'advanced' as const,
    layer: 'concurrency' as IssueLayer,
    description: 'Race condition detection, parallel execution hazards',
    icon: '⚡',
    color: 'yellow',
    layerGroup: 'formal',
  },
  simulationAnalyzer: {
    name: 'Simulation Soundness Analyzer',
    tier: 'advanced' as const,
    layer: 'simulation' as IssueLayer,
    description: 'Validates simulation accuracy, divergence risk',
    icon: '🧪',
    color: 'green',
    layerGroup: 'formal',
  },
  recoveryAnalyzer: {
    name: 'Recovery Semantics Analyzer',
    tier: 'advanced' as const,
    layer: 'recovery' as IssueLayer,
    description: 'Rollback correctness, retry idempotency',
    icon: '🔙',
    color: 'cyan',
    layerGroup: 'formal',
  },
  worldModelAnalyzer: {
    name: 'World-Model Consistency Analyzer',
    tier: 'advanced' as const,
    layer: 'psg_consistency' as IssueLayer,
    description: 'PSG/graph integrity, snapshot isolation validation',
    icon: '🗺️',
    color: 'blue',
    layerGroup: 'system_core',
  },
  boundaryEnforcementChecker: {
    name: 'Boundary Enforcement Checker',
    tier: 'advanced' as const,
    layer: 'boundary_enforcement' as IssueLayer,
    description: 'Ensures rules actually enforced, unenforced constraints',
    icon: '🔐',
    color: 'red',
    layerGroup: 'formal',
  },
  convergenceAnalyzer: {
    name: 'Convergence Stability Analyzer',
    tier: 'advanced' as const,
    layer: 'convergence' as IssueLayer,
    description: 'Detects infinite loops, oscillation detection',
    icon: '🎯',
    color: 'orange',
    layerGroup: 'formal',
  },
  semanticExecutionChecker: {
    name: 'Semantic-Execution Checker',
    tier: 'advanced' as const,
    layer: 'semantic_execution' as IssueLayer,
    description: 'Intent vs execution drift detection',
    icon: '🔄',
    color: 'violet',
    layerGroup: 'formal',
  },
  invariantClosureChecker: {
    name: 'Invariant Closure Checker',
    tier: 'advanced' as const,
    layer: 'invariant_closure' as IssueLayer,
    description: 'Invariant covers all mutation paths, closure validation',
    icon: '🔒',
    color: 'slate',
    layerGroup: 'formal',
  },
  authorityLeakDetector: {
    name: 'Authority Leak Detector',
    tier: 'advanced' as const,
    layer: 'authority_leak' as IssueLayer,
    description: 'Indirect authority paths, privilege escalation',
    icon: '🚨',
    color: 'red',
    layerGroup: 'formal',
  },

  // ========================================
  // POLICY ENGINE AGENTS (4)
  // ========================================
  policyEngineAgent: {
    name: 'Policy Engine Agent',
    tier: 'policy' as const,
    layer: 'policy_enforcement' as IssueLayer,
    description: 'Enforces policy rules, validates compliance',
    icon: '📜',
    color: 'indigo',
    layerGroup: 'policy',
  },
  ruleConflictResolver: {
    name: 'Rule Conflict Resolver',
    tier: 'policy' as const,
    layer: 'rule_conflict' as IssueLayer,
    description: 'Detects and resolves rule conflicts',
    icon: '⚖️',
    color: 'amber',
    layerGroup: 'policy',
  },
  auditTrailGenerator: {
    name: 'Audit Trail Generator',
    tier: 'policy' as const,
    layer: 'audit_trail' as IssueLayer,
    description: 'Generates comprehensive audit trails',
    icon: '📋',
    color: 'teal',
    layerGroup: 'policy',
  },
  overrideController: {
    name: 'Override Controller',
    tier: 'policy' as const,
    layer: 'override_control' as IssueLayer,
    description: 'Manages override requests and approvals',
    icon: '🎛️',
    color: 'red',
    layerGroup: 'policy',
  },

  // ========================================
  // FORMAL VERIFICATION AGENTS (7)
  // ========================================
  invariantEnforcerAgent: {
    name: 'Invariant Enforcer Agent',
    tier: 'formal' as const,
    layer: 'invariant_enforcement' as IssueLayer,
    description: 'Enforces invariants at runtime, prevents violations',
    icon: '🛡️',
    color: 'red',
    layerGroup: 'formal_verification',
  },
  determinismAuditor: {
    name: 'Determinism Auditor',
    tier: 'formal' as const,
    layer: 'determinism_audit' as IssueLayer,
    description: 'Audits execution for determinism compliance',
    icon: '🔍',
    color: 'blue',
    layerGroup: 'formal_verification',
  },
  specComplianceAgent: {
    name: 'Spec Compliance Agent',
    tier: 'formal' as const,
    layer: 'spec_compliance' as IssueLayer,
    description: 'Validates specification compliance',
    icon: '✅',
    color: 'green',
    layerGroup: 'formal_verification',
  },
  ambiguityEliminator: {
    name: 'Ambiguity Eliminator',
    tier: 'formal' as const,
    layer: 'ambiguity_resolution' as IssueLayer,
    description: 'Eliminates ambiguities, enforces clarity',
    icon: '🎯',
    color: 'amber',
    layerGroup: 'formal_verification',
  },
  stateExplosionController: {
    name: 'State Explosion Controller',
    tier: 'formal' as const,
    layer: 'state_explosion' as IssueLayer,
    description: 'Controls state space explosion, ensures tractability',
    icon: '💥',
    color: 'orange',
    layerGroup: 'formal_verification',
  },
  adversarialTesterAgent: {
    name: 'Adversarial Tester Agent',
    tier: 'formal' as const,
    layer: 'formal_verification' as IssueLayer,
    description: 'Adversarial testing, stress testing, vulnerability detection',
    icon: '⚔️',
    color: 'slate',
    layerGroup: 'formal_verification',
  },
  formalVerifierAgent: {
    name: 'Formal Verifier Agent',
    tier: 'formal' as const,
    layer: 'formal_verification' as IssueLayer,
    description: 'Mathematical verification of properties',
    icon: '🔬',
    color: 'purple',
    layerGroup: 'formal_verification',
  },

  // ========================================
  // VALIDATION AGENTS (4)
  // ========================================
  contextValidator: {
    name: 'Context Validator',
    tier: 'validation' as const,
    layer: 'context_validation' as IssueLayer,
    description: 'Validates context consistency and completeness',
    icon: '🎯',
    color: 'cyan',
    layerGroup: 'validation',
  },
  memoryIntegrityAgent: {
    name: 'Memory Integrity Agent',
    tier: 'validation' as const,
    layer: 'memory_integrity' as IssueLayer,
    description: 'Validates memory state integrity',
    icon: '💾',
    color: 'blue',
    layerGroup: 'validation',
  },
  safetyValidator: {
    name: 'Safety Validator',
    tier: 'validation' as const,
    layer: 'safety_validation' as IssueLayer,
    description: 'Validates safety properties and constraints',
    icon: '🛡️',
    color: 'green',
    layerGroup: 'validation',
  },
  performanceValidator: {
    name: 'Performance Validator',
    tier: 'validation' as const,
    layer: 'performance_validation' as IssueLayer,
    description: 'Validates performance requirements',
    icon: '📊',
    color: 'teal',
    layerGroup: 'validation',
  },

  // ========================================
  // META AGENTS (4)
  // ========================================
  crossAgentConflictResolver: {
    name: 'Cross-Agent Conflict Resolver',
    tier: 'meta' as const,
    layer: 'multi_agent' as IssueLayer,
    description: 'Merges conflicting outputs, resolves disagreements',
    icon: '🧠',
    color: 'indigo',
    layerGroup: 'meta',
  },
  severityScoringEngine: {
    name: 'Severity Scoring Engine',
    tier: 'meta' as const,
    layer: 'governance' as IssueLayer,
    description: 'Assigns CRITICAL/HIGH/MEDIUM/LOW/INFO severity',
    icon: '📊',
    color: 'red',
    layerGroup: 'meta',
  },
  stressTestGenerator: {
    name: 'Stress-Test Generator',
    tier: 'meta' as const,
    layer: 'simulation' as IssueLayer,
    description: 'Generates adversarial edge cases for testing',
    icon: '🧪',
    color: 'orange',
    layerGroup: 'meta',
  },
  finalMetaJudge: {
    name: 'Final Meta Judge',
    tier: 'meta' as const,
    layer: 'semantic_execution' as IssueLayer,
    description: 'Produces final consolidated report',
    icon: '🏁',
    color: 'purple',
    layerGroup: 'meta',
  },
};

// ========================================
// LAYER CONFIGURATION (Enhanced)
// ========================================

export const LAYER_CONFIG: Record<IssueLayer, { 
  label: string; 
  icon: string; 
  color: string; 
  group: string;
  order: number;
}> = {
  // BASE LAYERS (1-10)
  contradiction: { label: 'Contradiction & Consistency', icon: '🔴', color: 'red', group: 'base', order: 1 },
  logical: { label: 'Logical Integrity', icon: '🟠', color: 'orange', group: 'base', order: 2 },
  structural: { label: 'Structural & Organizational', icon: '🟡', color: 'yellow', group: 'base', order: 3 },
  semantic: { label: 'Semantic & Clarity', icon: '🟢', color: 'green', group: 'base', order: 4 },
  factual: { label: 'Factual & Evidence', icon: '🔵', color: 'blue', group: 'base', order: 5 },
  functional: { label: 'Functional & Practical', icon: '🟣', color: 'purple', group: 'base', order: 6 },
  temporal: { label: 'Temporal & State', icon: '⚫', color: 'gray', group: 'base', order: 7 },
  architectural: { label: 'Architectural & System', icon: '⚪', color: 'slate', group: 'base', order: 8 },
  completeness: { label: 'Completeness & Coverage', icon: '🟤', color: 'brown', group: 'base', order: 9 },
  intent: { label: 'Intent & Goal Alignment', icon: '🔶', color: 'amber', group: 'base', order: 10 },
  
  // SYSTEM CORE LAYERS (11-15)
  execution_invariant: { label: 'Execution Invariant Safety', icon: '🛡️', color: 'red', group: 'system_core', order: 11 },
  authority_boundary: { label: 'Authority Boundary Integrity', icon: '🔒', color: 'red', group: 'system_core', order: 12 },
  deterministic: { label: 'Deterministic Execution', icon: '🎯', color: 'blue', group: 'system_core', order: 13 },
  governance: { label: 'Governance Enforcement', icon: '⚖️', color: 'indigo', group: 'system_core', order: 14 },
  psg_consistency: { label: 'PSG Consistency', icon: '📊', color: 'teal', group: 'system_core', order: 15 },
  
  // FORMAL SYSTEM LAYERS (16-28)
  invariant_closure: { label: 'Invariant Closure', icon: '🔐', color: 'slate', group: 'formal', order: 16 },
  state_mutation: { label: 'State Mutation Legitimacy', icon: '🔄', color: 'orange', group: 'formal', order: 17 },
  authority_leak: { label: 'Authority Leak Detection', icon: '🚨', color: 'red', group: 'formal', order: 18 },
  closed_world: { label: 'Closed-World Enforcement', icon: '🌍', color: 'blue', group: 'formal', order: 19 },
  replay_fidelity: { label: 'Replay Fidelity', icon: '📼', color: 'purple', group: 'formal', order: 20 },
  multi_agent: { label: 'Multi-Agent Consistency', icon: '🤖', color: 'cyan', group: 'formal', order: 21 },
  execution_psg_sync: { label: 'Execution-PSG Sync', icon: '🔗', color: 'teal', group: 'formal', order: 22 },
  recovery: { label: 'Recovery & Failure Semantics', icon: '🔙', color: 'amber', group: 'formal', order: 23 },
  concurrency: { label: 'Concurrency Safety', icon: '⚡', color: 'yellow', group: 'formal', order: 24 },
  boundary_enforcement: { label: 'Boundary Enforcement', icon: '🧱', color: 'slate', group: 'formal', order: 25 },
  simulation: { label: 'Simulation Soundness', icon: '🧪', color: 'green', group: 'formal', order: 26 },
  convergence: { label: 'Goal Convergence', icon: '🎯', color: 'orange', group: 'formal', order: 27 },
  semantic_execution: { label: 'Semantic-Execution Alignment', icon: '🔄', color: 'violet', group: 'formal', order: 28 },

  // POLICY ENGINE LAYERS (29-32)
  policy_enforcement: { label: 'Policy Enforcement', icon: '📜', color: 'indigo', group: 'policy', order: 29 },
  rule_conflict: { label: 'Rule Conflict Resolution', icon: '⚖️', color: 'amber', group: 'policy', order: 30 },
  audit_trail: { label: 'Audit Trail Generation', icon: '📋', color: 'teal', group: 'policy', order: 31 },
  override_control: { label: 'Override Control', icon: '🎛️', color: 'red', group: 'policy', order: 32 },

  // FORMAL VERIFICATION LAYERS (33-38)
  invariant_enforcement: { label: 'Invariant Enforcement', icon: '🛡️', color: 'red', group: 'formal_verification', order: 33 },
  determinism_audit: { label: 'Determinism Audit', icon: '🔍', color: 'blue', group: 'formal_verification', order: 34 },
  spec_compliance: { label: 'Spec Compliance', icon: '✅', color: 'green', group: 'formal_verification', order: 35 },
  ambiguity_resolution: { label: 'Ambiguity Resolution', icon: '🎯', color: 'amber', group: 'formal_verification', order: 36 },
  state_explosion: { label: 'State Explosion Control', icon: '💥', color: 'orange', group: 'formal_verification', order: 37 },
  formal_verification: { label: 'Formal Verification', icon: '🔬', color: 'purple', group: 'formal_verification', order: 38 },

  // VALIDATION LAYERS (39-42)
  context_validation: { label: 'Context Validation', icon: '🎯', color: 'cyan', group: 'validation', order: 39 },
  memory_integrity: { label: 'Memory Integrity', icon: '💾', color: 'blue', group: 'validation', order: 40 },
  safety_validation: { label: 'Safety Validation', icon: '🛡️', color: 'green', group: 'validation', order: 41 },
  performance_validation: { label: 'Performance Validation', icon: '📊', color: 'teal', group: 'validation', order: 42 },
};

// ========================================
// ISSUE TYPE CONFIGURATION (Enhanced)
// ========================================

export const ISSUE_TYPE_CONFIG: Record<string, {
  label: string;
  icon: string;
  color: string;
  layer: IssueLayer;
  description: string;
}> = {
  // BASE ISSUE TYPES
  hallucination: { label: 'Hallucination', icon: '🎭', color: 'purple', layer: 'factual', description: 'Claims without evidence' },
  contradiction: { label: 'Contradiction', icon: '⚡', color: 'red', layer: 'contradiction', description: 'Conflicting statements' },
  consistency: { label: 'Consistency', icon: '🔄', color: 'amber', layer: 'contradiction', description: 'Terminology issues' },
  structural: { label: 'Structural', icon: '📐', color: 'cyan', layer: 'structural', description: 'Document structure issues' },
  logical: { label: 'Logical', icon: '💭', color: 'orange', layer: 'logical', description: 'Reasoning errors' },
  functional: { label: 'Functional', icon: '⚙️', color: 'emerald', layer: 'functional', description: 'Workflow issues' },
  semantic: { label: 'Semantic', icon: '💬', color: 'pink', layer: 'semantic', description: 'Clarity issues' },
  temporal: { label: 'Temporal', icon: '⏰', color: 'sky', layer: 'temporal', description: 'Timeline issues' },
  completeness: { label: 'Completeness', icon: '🧩', color: 'violet', layer: 'completeness', description: 'Missing content' },
  intent: { label: 'Intent', icon: '🎯', color: 'rose', layer: 'intent', description: 'Goal misalignment' },
  quantitative: { label: 'Quantitative', icon: '📊', color: 'teal', layer: 'architectural', description: 'Numerical errors' },
  
  // SYSTEM CORE ISSUE TYPES
  invariant_violation: { label: 'Invariant Violation', icon: '🛡️', color: 'red', layer: 'execution_invariant', description: 'Safety invariant bypassed' },
  authority_breach: { label: 'Authority Breach', icon: '🔒', color: 'red', layer: 'authority_boundary', description: 'Permission boundary crossed' },
  nondeterminism: { label: 'Nondeterminism', icon: '🎲', color: 'orange', layer: 'deterministic', description: 'Execution not deterministic' },
  governance_gap: { label: 'Governance Gap', icon: '⚖️', color: 'indigo', layer: 'governance', description: 'Missing enforcement' },
  psg_integrity: { label: 'PSG Integrity', icon: '📊', color: 'teal', layer: 'psg_consistency', description: 'Graph consistency issue' },
  
  // FORMAL SYSTEM ISSUE TYPES
  invariant_bypass: { label: 'Invariant Bypass', icon: '🔓', color: 'red', layer: 'invariant_closure', description: 'Mutation path uncovered' },
  mutation_illegality: { label: 'Illegal Mutation', icon: '🚫', color: 'red', layer: 'state_mutation', description: 'Invalid state transition' },
  privilege_escalation: { label: 'Privilege Escalation', icon: '🚨', color: 'red', layer: 'authority_leak', description: 'Authority escalation path' },
  unknown_entity: { label: 'Unknown Entity', icon: '❓', color: 'amber', layer: 'closed_world', description: 'Unverified entity' },
  replay_divergence: { label: 'Replay Divergence', icon: '↔️', color: 'orange', layer: 'replay_fidelity', description: 'Non-reproducible execution' },
  agent_conflict: { label: 'Agent Conflict', icon: '🤖', color: 'purple', layer: 'multi_agent', description: 'Conflicting agent decisions' },
  sync_violation: { label: 'Sync Violation', icon: '🔗', color: 'red', layer: 'execution_psg_sync', description: 'State-runtime mismatch' },
  recovery_failure: { label: 'Recovery Failure', icon: '⚠️', color: 'amber', layer: 'recovery', description: 'Invalid recovery path' },
  race_condition: { label: 'Race Condition', icon: '⚡', color: 'red', layer: 'concurrency', description: 'Parallel execution hazard' },
  enforcement_gap: { label: 'Enforcement Gap', icon: '🧱', color: 'red', layer: 'boundary_enforcement', description: 'Unenforced constraint' },
  simulation_drift: { label: 'Simulation Drift', icon: '📈', color: 'orange', layer: 'simulation', description: 'Simulation inaccuracy' },
  convergence_failure: { label: 'Convergence Failure', icon: '🔄', color: 'red', layer: 'convergence', description: 'Non-terminating process' },
  semantic_drift: { label: 'Semantic Drift', icon: '🔀', color: 'violet', layer: 'semantic_execution', description: 'Intent-execution mismatch' },
  
  // POLICY ENGINE ISSUE TYPES
  policy_violation: { label: 'Policy Violation', icon: '📜', color: 'red', layer: 'policy_enforcement', description: 'Policy rule violated' },
  rule_conflict: { label: 'Rule Conflict', icon: '⚖️', color: 'amber', layer: 'rule_conflict', description: 'Conflicting rules' },
  missing_audit_trail: { label: 'Missing Audit Trail', icon: '📋', color: 'teal', layer: 'audit_trail', description: 'No audit trail for action' },
  unauthorized_override: { label: 'Unauthorized Override', icon: '🎛️', color: 'red', layer: 'override_control', description: 'Override without authorization' },
  policy_gap: { label: 'Policy Gap', icon: '📝', color: 'indigo', layer: 'policy_enforcement', description: 'Missing policy coverage' },
  rule_ambiguity: { label: 'Rule Ambiguity', icon: '❓', color: 'amber', layer: 'rule_conflict', description: 'Ambiguous rule interpretation' },
  
  // FORMAL VERIFICATION ISSUE TYPES
  invariant_not_enforced: { label: 'Invariant Not Enforced', icon: '🛡️', color: 'red', layer: 'invariant_enforcement', description: 'Invariant not enforced at runtime' },
  determinism_break: { label: 'Determinism Break', icon: '🎲', color: 'orange', layer: 'determinism_audit', description: 'Determinism violated' },
  spec_violation: { label: 'Spec Violation', icon: '✅', color: 'red', layer: 'spec_compliance', description: 'Specification not met' },
  ambiguity_detected: { label: 'Ambiguity Detected', icon: '🎯', color: 'amber', layer: 'ambiguity_resolution', description: 'Ambiguous definition found' },
  state_explosion_risk: { label: 'State Explosion Risk', icon: '💥', color: 'orange', layer: 'state_explosion', description: 'State space too large' },
  verification_failure: { label: 'Verification Failure', icon: '🔬', color: 'red', layer: 'formal_verification', description: 'Property verification failed' },
  
  // VALIDATION ISSUE TYPES
  context_mismatch: { label: 'Context Mismatch', icon: '🎯', color: 'cyan', layer: 'context_validation', description: 'Context inconsistency' },
  memory_corruption: { label: 'Memory Corruption', icon: '💾', color: 'red', layer: 'memory_integrity', description: 'Memory state corrupted' },
  safety_violation: { label: 'Safety Violation', icon: '🛡️', color: 'red', layer: 'safety_validation', description: 'Safety constraint violated' },
  performance_degradation: { label: 'Performance Degradation', icon: '📊', color: 'teal', layer: 'performance_validation', description: 'Performance requirement not met' },
  resource_exhaustion: { label: 'Resource Exhaustion', icon: '⚠️', color: 'orange', layer: 'performance_validation', description: 'Resource limit exceeded' },
  
  // REASONING TRACE ISSUE TYPES
  reasoning_gap: { label: 'Reasoning Gap', icon: '🔗', color: 'orange', layer: 'logical', description: 'Missing reasoning step' },
  evidence_missing: { label: 'Evidence Missing', icon: '❓', color: 'amber', layer: 'factual', description: 'No evidence for claim' },
  uncertainty_propagation: { label: 'Uncertainty Propagation', icon: '📊', color: 'violet', layer: 'logical', description: 'Uncertainty not propagated' },
  self_correction_loop: { label: 'Self Correction Loop', icon: '🔄', color: 'red', layer: 'logical', description: 'Unbounded self-correction' },
  multi_step_failure: { label: 'Multi Step Failure', icon: '⛓️', color: 'red', layer: 'logical', description: 'Multi-step reasoning failed' },
  
  // META ISSUE TYPES
  adversarial: { label: 'Adversarial', icon: '⚔️', color: 'slate', layer: 'semantic_execution', description: 'Counter-argument found' },
  meta: { label: 'Meta', icon: '🔮', color: 'indigo', layer: 'semantic_execution', description: 'Self-validation issue' },
  cross_layer_violation: { label: 'Cross Layer Violation', icon: '🔀', color: 'red', layer: 'multi_agent', description: 'Cross-layer consistency violation' },
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const AGENT_COUNT = Object.keys(AGENT_CONFIG).length;
export const LAYER_COUNT = Object.keys(LAYER_CONFIG).length;
export const AGENT_NAMES = Object.values(AGENT_CONFIG).map(a => a.name);
