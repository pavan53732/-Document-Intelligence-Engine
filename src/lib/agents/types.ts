// Complete Agent Types - 28-Layer, 29-Agent System
// For Deterministic Autonomous System Specifications

// ========================================
// 28 ANALYSIS LAYERS
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
  | 'semantic_execution';  // Layer 28

// ========================================
// ISSUE TYPES (80+)
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
  // META ISSUES
  | 'adversarial' | 'meta';

export type Severity = 'critical' | 'warning' | 'info';

// ========================================
// DETECTED ISSUE
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
}

export interface Definition {
  id: string;
  term: string;
  definition: string;
  location: string;
  fileName: string;
}

export interface Reference {
  id: string;
  text: string;
  target: string;
  location: string;
  fileName: string;
  type: 'internal' | 'external' | 'code' | 'resource';
}

export interface Entity {
  id: string;
  name: string;
  type: 'agent' | 'component' | 'state' | 'resource' | 'authority' | 'boundary';
  mentions: Array<{ text: string; location: string; fileName: string }>;
  attributes: Record<string, unknown>;
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
}

export interface ExecutionPath {
  id: string;
  steps: string[];
  invariants: string[];
  governancePoints: string[];
  location: string;
  fileName: string;
}

export interface GovernanceCheckpoint {
  id: string;
  type: 'validation' | 'authorization' | 'audit' | 'enforcement';
  rule: string;
  location: string;
  fileName: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface AgentResult {
  agentName: string;
  agentLayer: IssueLayer;
  agentTier: 'core' | 'advanced' | 'meta';
  issues: DetectedIssue[];
  claims: Claim[];
  confidence: number;
  processingTime: number;
  metadata?: Record<string, unknown>;
}

// ========================================
// META COGNITION REPORT
// ========================================

export interface MetaCognitionReport {
  overallConfidence: number;
  agentAgreement: number;
  highConfidenceIssues: number;
  uncertainIssues: number;
  disagreementPoints: string[];
  recommendedReview: string[];
  layerScores: Record<IssueLayer, number>;
}

// ========================================
// ANALYSIS SUMMARY
// ========================================

export interface AnalysisSummary {
  totalIssues: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<IssueType, number>;
  byLayer: Record<IssueLayer, number>;
  byAgent: Record<string, number>;
  byTier: { core: number; advanced: number; meta: number };
  confidence: number;
  documentHealthScore: number;
  executionSafetyScore: number;
  governanceScore: number;
  determinismScore: number;
}

// ========================================
// 29 AGENT CONFIGURATION
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
  // Additional Core Support Agents
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
  // Base Advanced
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
  // System Core Advanced Agents
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
    description: 'Assigns CRITICAL/HIGH/MEDIUM/LOW severity',
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
// LAYER CONFIGURATION
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
};

// ========================================
// ISSUE TYPE CONFIGURATION
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
  
  // META ISSUE TYPES
  adversarial: { label: 'Adversarial', icon: '⚔️', color: 'slate', layer: 'semantic_execution', description: 'Counter-argument found' },
  meta: { label: 'Meta', icon: '🔮', color: 'indigo', layer: 'semantic_execution', description: 'Self-validation issue' },
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
