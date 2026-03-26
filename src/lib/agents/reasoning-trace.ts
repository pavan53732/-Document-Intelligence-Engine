// Reasoning Trace System
// Provides structured reasoning chains with evidence binding, uncertainty propagation,
// and self-correction detection for agent findings

import {
  ReasoningTrace,
  ReasoningStep,
  EvidenceBinding,
  UncertaintyPropagation,
  SelfCorrectionLoop,
  DetectedIssue,
  Claim,
} from './types';
import { agentChat, parseAIJSON } from '../ai/agent-ai';

// ========================================
// CONFIGURATION
// ========================================

export const REASONING_CONFIG = {
  maxSteps: 50,
  maxIterations: 10,
  uncertaintyThreshold: 0.3,
  highUncertaintyThreshold: 0.5,
  minConfidence: 0.1,
  maxConfidence: 0.99,
  convergenceThreshold: 0.01,
  oscillationWindowSize: 5,
  defaultPropagationRule: 'bayesian' as const,
};

// ========================================
// GENERATE UNIQUE ID
// ========================================

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ========================================
// EVIDENCE BINDER
// ========================================

export interface EvidenceValidationResult {
  isValid: boolean;
  relevanceScore: number;
  reliabilityScore: number;
  issues: string[];
}

export interface ChainOfCustodyEntry {
  timestamp: Date;
  action: 'created' | 'verified' | 'transferred' | 'modified';
  agent: string;
  details: string;
}

export class EvidenceBinder {
  private bindings: Map<string, EvidenceBinding> = new Map();
  private custodyChains: Map<string, ChainOfCustodyEntry[]> = new Map();

  /**
   * Binds evidence to a reasoning step
   */
  bindEvidence(
    traceId: string,
    stepId: string,
    evidence: Omit<EvidenceBinding, 'id' | 'traceId' | 'stepId' | 'chainOfCustody'>
  ): EvidenceBinding {
    const id = generateId('ev');
    const binding: EvidenceBinding = {
      id,
      traceId,
      stepId,
      chainOfCustody: [`${new Date().toISOString()}: Created by EvidenceBinder`],
      ...evidence,
    };

    this.bindings.set(id, binding);
    this.custodyChains.set(id, [{
      timestamp: new Date(),
      action: 'created',
      agent: 'EvidenceBinder',
      details: `Evidence bound to step ${stepId}`,
    }]);

    return binding;
  }

  /**
   * Validates evidence relevance to a reasoning step
   */
  async validateRelevance(
    evidence: EvidenceBinding,
    step: ReasoningStep
  ): Promise<EvidenceValidationResult> {
    const issues: string[] = [];
    let relevanceScore = evidence.relevanceScore;
    let reliabilityScore = evidence.reliabilityScore;

    // Check if evidence is directly referenced in the step
    const isReferenced = step.evidenceIds.includes(evidence.id);
    if (!isReferenced) {
      issues.push('Evidence not directly referenced in reasoning step');
      relevanceScore *= 0.8;
    }

    // Check evidence type alignment with step type
    const typeAlignment = this.checkTypeAlignment(evidence.evidenceType, step.type);
    if (typeAlignment < 0.5) {
      issues.push(`Evidence type '${evidence.evidenceType}' may not align well with '${step.type}' reasoning`);
      relevanceScore *= typeAlignment;
    }

    // Validate source credibility
    const sourceCredibility = this.assessSourceCredibility(evidence.source);
    reliabilityScore *= sourceCredibility;

    // Check if evidence content relates to premise or conclusion
    const contentRelevance = this.assessContentRelevance(evidence.quote, step.premise, step.conclusion);
    relevanceScore *= contentRelevance;

    return {
      isValid: issues.length === 0 && relevanceScore >= 0.3 && reliabilityScore >= 0.3,
      relevanceScore: Math.min(relevanceScore, 1),
      reliabilityScore: Math.min(reliabilityScore, 1),
      issues,
    };
  }

  /**
   * Tracks chain of custody for evidence
   */
  trackCustody(
    evidenceId: string,
    action: ChainOfCustodyEntry['action'],
    agent: string,
    details: string
  ): void {
    const chain = this.custodyChains.get(evidenceId) || [];
    chain.push({
      timestamp: new Date(),
      action,
      agent,
      details,
    });
    this.custodyChains.set(evidenceId, chain);
  }

  /**
   * Gets chain of custody for evidence
   */
  getChainOfCustody(evidenceId: string): ChainOfCustodyEntry[] {
    return this.custodyChains.get(evidenceId) || [];
  }

  /**
   * Calculates overall reliability score for a set of evidence
   */
  calculateReliabilityScore(evidenceBindings: EvidenceBinding[]): number {
    if (evidenceBindings.length === 0) return 0;

    const weightedScores = evidenceBindings.map(eb => {
      const typeWeight = this.getEvidenceTypeWeight(eb.evidenceType);
      return eb.reliabilityScore * typeWeight * eb.relevanceScore;
    });

    const totalWeight = evidenceBindings.reduce((sum, eb) => 
      sum + this.getEvidenceTypeWeight(eb.evidenceType), 0
    );

    return weightedScores.reduce((a, b) => a + b, 0) / totalWeight;
  }

  /**
   * Gets all bindings for a trace
   */
  getBindingsForTrace(traceId: string): EvidenceBinding[] {
    return Array.from(this.bindings.values()).filter(b => b.traceId === traceId);
  }

  /**
   * Gets all bindings for a step
   */
  getBindingsForStep(stepId: string): EvidenceBinding[] {
    return Array.from(this.bindings.values()).filter(b => b.stepId === stepId);
  }

  // Private helper methods

  private checkTypeAlignment(evidenceType: EvidenceBinding['evidenceType'], stepType: ReasoningStep['type']): number {
    const alignmentMatrix: Record<EvidenceBinding['evidenceType'], Partial<Record<ReasoningStep['type'], number>>> = {
      direct: { deduction: 1.0, induction: 0.8, abduction: 0.7, analogy: 0.5, causal: 0.9 },
      indirect: { deduction: 0.7, induction: 0.9, abduction: 0.8, analogy: 0.6, causal: 0.7 },
      circumstantial: { deduction: 0.5, induction: 0.7, abduction: 0.9, analogy: 0.8, causal: 0.6 },
      expert: { deduction: 0.9, induction: 0.8, abduction: 0.8, analogy: 0.7, causal: 0.9 },
      statistical: { deduction: 0.6, induction: 1.0, abduction: 0.6, analogy: 0.5, causal: 0.8 },
    };
    return alignmentMatrix[evidenceType][stepType] ?? 0.5;
  }

  private assessSourceCredibility(source: string): number {
    // Simple heuristic-based credibility assessment
    const credibleSources = ['documentation', 'specification', 'test', 'code', 'contract'];
    const lowerSource = source.toLowerCase();
    
    for (const credible of credibleSources) {
      if (lowerSource.includes(credible)) return 0.9;
    }
    
    if (lowerSource.includes('external')) return 0.7;
    if (lowerSource.includes('opinion')) return 0.5;
    if (lowerSource.includes('unverified')) return 0.3;
    
    return 0.6; // Default moderate credibility
  }

  private assessContentRelevance(quote: string, premise: string, conclusion: string): number {
    const quoteWords = new Set(quote.toLowerCase().split(/\s+/));
    const premiseWords = new Set(premise.toLowerCase().split(/\s+/));
    const conclusionWords = new Set(conclusion.toLowerCase().split(/\s+/));

    const premiseOverlap = this.calculateWordOverlap(quoteWords, premiseWords);
    const conclusionOverlap = this.calculateWordOverlap(quoteWords, conclusionWords);

    return Math.max(premiseOverlap, conclusionOverlap);
  }

  private calculateWordOverlap(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private getEvidenceTypeWeight(evidenceType: EvidenceBinding['evidenceType']): number {
    const weights: Record<EvidenceBinding['evidenceType'], number> = {
      direct: 1.0,
      expert: 0.9,
      statistical: 0.8,
      indirect: 0.7,
      circumstantial: 0.5,
    };
    return weights[evidenceType];
  }
}

// ========================================
// UNCERTAINTY PROPAGATOR
// ========================================

export interface UncertaintyResult {
  outputUncertainty: number;
  bounded: boolean;
  warning?: string;
}

export class UncertaintyPropagator {
  private propagations: Map<string, UncertaintyPropagation> = new Map();
  private thresholds = {
    low: REASONING_CONFIG.uncertaintyThreshold,
    high: REASONING_CONFIG.highUncertaintyThreshold,
  };

  /**
   * Propagates uncertainty through a reasoning step
   */
  propagateUncertainty(
    stepId: string,
    inputUncertainty: number,
    stepConfidence: number,
    rule: UncertaintyPropagation['propagationRule'] = REASONING_CONFIG.defaultPropagationRule
  ): UncertaintyResult {
    let outputUncertainty: number;
    let bounded = true;
    let warning: string | undefined;

    switch (rule) {
      case 'additive':
        outputUncertainty = this.additivePropagation(inputUncertainty, stepConfidence);
        break;
      case 'multiplicative':
        outputUncertainty = this.multiplicativePropagation(inputUncertainty, stepConfidence);
        break;
      case 'max':
        outputUncertainty = this.maxPropagation(inputUncertainty, stepConfidence);
        break;
      case 'bayesian':
      default:
        outputUncertainty = this.bayesianPropagation(inputUncertainty, stepConfidence);
        break;
    }

    // Check boundedness
    if (outputUncertainty >= 1.0) {
      bounded = false;
      warning = 'Uncertainty has become unbounded (>= 1.0)';
      outputUncertainty = 0.99;
    }

    // Check threshold violations
    if (outputUncertainty > this.thresholds.high) {
      warning = `High uncertainty detected: ${outputUncertainty.toFixed(3)}`;
    } else if (outputUncertainty > this.thresholds.low) {
      warning = `Moderate uncertainty: ${outputUncertainty.toFixed(3)}`;
    }

    const propagation: UncertaintyPropagation = {
      stepId,
      inputUncertainty,
      outputUncertainty,
      propagationRule: rule,
      bounded,
    };

    this.propagations.set(stepId, propagation);

    return { outputUncertainty, bounded, warning };
  }

  /**
   * Propagates uncertainty through a chain of steps
   */
  propagateThroughChain(steps: ReasoningStep[]): UncertaintyPropagation[] {
    const results: UncertaintyPropagation[] = [];
    let currentUncertainty = 0; // Start with zero uncertainty

    for (const step of steps) {
      const result = this.propagateUncertainty(
        step.id,
        currentUncertainty,
        step.confidence
      );
      
      results.push({
        stepId: step.id,
        inputUncertainty: currentUncertainty,
        outputUncertainty: result.outputUncertainty,
        propagationRule: REASONING_CONFIG.defaultPropagationRule,
        bounded: result.bounded,
      });

      currentUncertainty = result.outputUncertainty;
    }

    return results;
  }

  /**
   * Detects if uncertainty is bounded throughout a chain
   */
  detectBoundedness(propagations: UncertaintyPropagation[]): {
    isBounded: boolean;
    unboundedSteps: string[];
    maxUncertainty: number;
  } {
    const unboundedSteps = propagations
      .filter(p => !p.bounded)
      .map(p => p.stepId);

    const maxUncertainty = Math.max(
      ...propagations.map(p => p.outputUncertainty)
    );

    return {
      isBounded: unboundedSteps.length === 0,
      unboundedSteps,
      maxUncertainty,
    };
  }

  /**
   * Flags when uncertainty exceeds thresholds
   */
  flagThresholdViolations(propagations: UncertaintyPropagation[]): {
    low: UncertaintyPropagation[];
    high: UncertaintyPropagation[];
    critical: UncertaintyPropagation[];
  } {
    return {
      low: propagations.filter(p => 
        p.outputUncertainty > this.thresholds.low && 
        p.outputUncertainty <= this.thresholds.high
      ),
      high: propagations.filter(p => 
        p.outputUncertainty > this.thresholds.high &&
        p.outputUncertainty < 0.9
      ),
      critical: propagations.filter(p => p.outputUncertainty >= 0.9),
    };
  }

  // Private propagation methods

  private additivePropagation(inputUncertainty: number, confidence: number): number {
    // Add uncertainty from step to existing uncertainty
    const stepUncertainty = 1 - confidence;
    return Math.min(inputUncertainty + stepUncertainty, 1);
  }

  private multiplicativePropagation(inputUncertainty: number, confidence: number): number {
    // Multiply uncertainties (conservative approach)
    const stepUncertainty = 1 - confidence;
    return 1 - ((1 - inputUncertainty) * (1 - stepUncertainty));
  }

  private maxPropagation(inputUncertainty: number, confidence: number): number {
    // Take maximum uncertainty
    const stepUncertainty = 1 - confidence;
    return Math.max(inputUncertainty, stepUncertainty);
  }

  private bayesianPropagation(inputUncertainty: number, confidence: number): number {
    // Bayesian update of uncertainty
    // Prior: inputUncertainty, Likelihood: confidence
    const prior = inputUncertainty;
    const likelihood = confidence;
    
    // Simple Bayesian-inspired formula
    const posterior = (prior * (1 - likelihood)) / 
      (prior * (1 - likelihood) + (1 - prior) * likelihood);
    
    // Combine with step uncertainty
    const stepUncertainty = 1 - confidence;
    return Math.min((posterior + stepUncertainty) / 2, 0.99);
  }
}

// ========================================
// SELF CORRECTION DETECTOR
// ========================================

export interface IterationState {
  iterationNumber: number;
  stepId: string;
  conclusion: string;
  confidence: number;
  timestamp: Date;
}

export interface ConvergenceResult {
  status: SelfCorrectionLoop['convergenceStatus'];
  reason: string;
  iterationsUsed: number;
}

export class SelfCorrectionDetector {
  private loops: Map<string, SelfCorrectionLoop> = new Map();
  private iterationHistory: Map<string, IterationState[]> = new Map();
  private maxIterations = REASONING_CONFIG.maxIterations;
  private convergenceThreshold = REASONING_CONFIG.convergenceThreshold;

  /**
   * Tracks an iteration in a reasoning process
   */
  trackIteration(
    traceId: string,
    stepId: string,
    conclusion: string,
    confidence: number
  ): IterationState {
    const history = this.iterationHistory.get(traceId) || [];
    
    const state: IterationState = {
      iterationNumber: history.length + 1,
      stepId,
      conclusion,
      confidence,
      timestamp: new Date(),
    };

    history.push(state);
    this.iterationHistory.set(traceId, history);

    return state;
  }

  /**
   * Detects convergence, divergence, or oscillation
   */
  detectConvergence(traceId: string): ConvergenceResult {
    const history = this.iterationHistory.get(traceId) || [];

    if (history.length === 0) {
      return { status: 'converged', reason: 'No iterations yet', iterationsUsed: 0 };
    }

    // Check for max iterations exceeded
    if (history.length >= this.maxIterations) {
      return {
        status: 'bounded',
        reason: `Maximum iterations (${this.maxIterations}) exceeded`,
        iterationsUsed: history.length,
      };
    }

    // Check for oscillation
    const oscillationResult = this.detectOscillation(history);
    if (oscillationResult.isOscillating) {
      return {
        status: 'oscillating',
        reason: `Oscillation detected: ${oscillationResult.pattern}`,
        iterationsUsed: history.length,
      };
    }

    // Check for divergence
    const divergenceResult = this.detectDivergence(history);
    if (divergenceResult.isDiverging) {
      return {
        status: 'diverged',
        reason: `Divergence detected: ${divergenceResult.reason}`,
        iterationsUsed: history.length,
      };
    }

    // Check for convergence
    const convergenceResult = this.checkConvergence(history);
    if (convergenceResult.hasConverged) {
      return {
        status: 'converged',
        reason: `Converged with delta ${convergenceResult.delta.toFixed(4)}`,
        iterationsUsed: history.length,
      };
    }

    return {
      status: 'bounded',
      reason: 'Still within bounds, continuing',
      iterationsUsed: history.length,
    };
  }

  /**
   * Creates a self-correction loop record
   */
  createLoop(
    traceId: string,
    steps: string[],
    terminationReason: string
  ): SelfCorrectionLoop {
    const convergence = this.detectConvergence(traceId);
    const history = this.iterationHistory.get(traceId) || [];

    const loop: SelfCorrectionLoop = {
      id: generateId('scl'),
      traceId,
      steps,
      maxIterations: this.maxIterations,
      actualIterations: history.length,
      convergenceStatus: convergence.status,
      terminationReason,
    };

    this.loops.set(loop.id, loop);
    return loop;
  }

  /**
   * Enforces maximum iteration bounds
   */
  enforceMaxIterations(traceId: string): boolean {
    const history = this.iterationHistory.get(traceId) || [];
    return history.length < this.maxIterations;
  }

  /**
   * Gets iteration count for a trace
   */
  getIterationCount(traceId: string): number {
    const history = this.iterationHistory.get(traceId) || [];
    return history.length;
  }

  /**
   * Clears iteration history for a trace
   */
  clearHistory(traceId: string): void {
    this.iterationHistory.delete(traceId);
  }

  // Private detection methods

  private detectOscillation(history: IterationState[]): { isOscillating: boolean; pattern?: string } {
    if (history.length < REASONING_CONFIG.oscillationWindowSize) {
      return { isOscillating: false };
    }

    const recent = history.slice(-REASONING_CONFIG.oscillationWindowSize);
    const conclusions = recent.map(h => h.conclusion);
    
    // Check for repeating patterns
    const uniqueConclusions = new Set(conclusions);
    if (uniqueConclusions.size <= 2 && conclusions.length >= 4) {
      // Check for alternating pattern
      let isAlternating = true;
      for (let i = 2; i < conclusions.length; i++) {
        if (conclusions[i] !== conclusions[i % 2]) {
          isAlternating = false;
          break;
        }
      }
      if (isAlternating) {
        return { isOscillating: true, pattern: 'Alternating between two conclusions' };
      }
    }

    // Check for confidence oscillation
    const confidences = recent.map(h => h.confidence);
    let direction = confidences[1] > confidences[0] ? 1 : -1;
    let directionChanges = 0;

    for (let i = 2; i < confidences.length; i++) {
      const newDirection = confidences[i] > confidences[i - 1] ? 1 : -1;
      if (newDirection !== direction) {
        directionChanges++;
        direction = newDirection;
      }
    }

    if (directionChanges >= 3) {
      return { isOscillating: true, pattern: 'Confidence oscillating' };
    }

    return { isOscillating: false };
  }

  private detectDivergence(history: IterationState[]): { isDiverging: boolean; reason?: string } {
    if (history.length < 3) {
      return { isDiverging: false };
    }

    const confidences = history.map(h => h.confidence);
    
    // Check for decreasing confidence trend
    const recentConfidences = confidences.slice(-3);
    let isDecreasing = true;
    for (let i = 1; i < recentConfidences.length; i++) {
      if (recentConfidences[i] >= recentConfidences[i - 1]) {
        isDecreasing = false;
        break;
      }
    }

    if (isDecreasing && recentConfidences[recentConfidences.length - 1] < 0.5) {
      return { isDiverging: true, reason: 'Confidence declining consistently' };
    }

    // Check for increasing uncertainty
    const lastConfidence = confidences[confidences.length - 1];
    const firstConfidence = confidences[0];
    if (lastConfidence < firstConfidence * 0.5) {
      return { isDiverging: true, reason: 'Confidence dropped significantly from start' };
    }

    return { isDiverging: false };
  }

  private checkConvergence(history: IterationState[]): { hasConverged: boolean; delta: number } {
    if (history.length < 2) {
      return { hasConverged: false, delta: 1 };
    }

    const confidences = history.map(h => h.confidence);
    const lastTwo = confidences.slice(-2);
    const delta = Math.abs(lastTwo[1] - lastTwo[0]);

    return {
      hasConverged: delta < this.convergenceThreshold && lastTwo[1] > 0.8,
      delta,
    };
  }
}

// ========================================
// MULTI-STEP VALIDATOR
// ========================================

export interface ValidationIssue {
  type: 'gap' | 'inconsistency' | 'invalid_inference' | 'missing_evidence' | 'circular';
  stepId: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  consistencyScore: number;
  completenessScore: number;
}

export class MultiStepValidator {
  /**
   * Validates a multi-step reasoning chain
   */
  validate(steps: ReasoningStep[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check for empty chain
    if (steps.length === 0) {
      return {
        isValid: false,
        issues: [{
          type: 'gap',
          stepId: 'chain',
          description: 'Empty reasoning chain',
          severity: 'critical',
        }],
        consistencyScore: 0,
        completenessScore: 0,
      };
    }

    // Validate individual steps
    for (const step of steps) {
      const stepIssues = this.validateStep(step);
      issues.push(...stepIssues);
    }

    // Validate step transitions
    for (let i = 1; i < steps.length; i++) {
      const transitionIssues = this.validateTransition(steps[i - 1], steps[i]);
      issues.push(...transitionIssues);
    }

    // Check for gaps in reasoning
    const gapIssues = this.detectGaps(steps);
    issues.push(...gapIssues);

    // Check for circular reasoning
    const circularIssues = this.detectCircularReasoning(steps);
    issues.push(...circularIssues);

    // Calculate scores
    const consistencyScore = this.calculateConsistencyScore(steps, issues);
    const completenessScore = this.calculateCompletenessScore(steps, issues);

    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      consistencyScore,
      completenessScore,
    };
  }

  /**
   * Validates that conclusions follow from premises
   */
  validateConclusionFollowsPremise(step: ReasoningStep): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for empty premise or conclusion
    if (!step.premise || step.premise.trim().length === 0) {
      issues.push({
        type: 'gap',
        stepId: step.id,
        description: 'Step has no premise',
        severity: 'high',
      });
    }

    if (!step.conclusion || step.conclusion.trim().length === 0) {
      issues.push({
        type: 'gap',
        stepId: step.id,
        description: 'Step has no conclusion',
        severity: 'high',
      });
    }

    // Check if premise and conclusion are the same (circular)
    if (step.premise.toLowerCase() === step.conclusion.toLowerCase()) {
      issues.push({
        type: 'circular',
        stepId: step.id,
        description: 'Premise and conclusion are identical',
        severity: 'high',
      });
    }

    // Validate inference type
    const inferenceValid = this.validateInferenceType(step);
    if (!inferenceValid.isValid) {
      issues.push({
        type: 'invalid_inference',
        stepId: step.id,
        description: inferenceValid.reason || 'Invalid inference for reasoning type',
        severity: 'medium',
      });
    }

    return issues;
  }

  /**
   * Uses AI to validate logical consistency between steps
   */
  async validateWithAI(steps: ReasoningStep[]): Promise<ValidationResult> {
    const systemPrompt = `You are a logical reasoning validator. Analyze the reasoning chain and identify any:
1. Logical gaps between steps
2. Invalid inferences
3. Missing evidence
4. Circular reasoning

Respond with a JSON array of issues found, or an empty array if no issues.`;

    const stepsDescription = steps.map((s, i) => 
      `Step ${i + 1} (${s.type}):\n  Premise: ${s.premise}\n  Conclusion: ${s.conclusion}\n  Confidence: ${s.confidence}`
    ).join('\n\n');

    const prompt = `Analyze this reasoning chain:\n\n${stepsDescription}`;

    try {
      const response = await agentChat(prompt, systemPrompt, { jsonMode: true });
      const aiIssues = parseAIJSON<{
        stepId?: string;
        type?: string;
        description?: string;
        severity?: string;
      }>(response);

      const issues: ValidationIssue[] = aiIssues
        .filter(issue => issue.type && issue.description)
        .map(issue => ({
          type: (issue.type as ValidationIssue['type']) || 'inconsistency',
          stepId: issue.stepId || 'unknown',
          description: issue.description || '',
          severity: (issue.severity as ValidationIssue['severity']) || 'medium',
        }));

      const baseResult = this.validate(steps);
      
      return {
        isValid: baseResult.isValid && issues.filter(i => i.severity === 'critical').length === 0,
        issues: [...baseResult.issues, ...issues],
        consistencyScore: baseResult.consistencyScore,
        completenessScore: baseResult.completenessScore,
      };
    } catch {
      // Fall back to non-AI validation
      return this.validate(steps);
    }
  }

  // Private validation methods

  private validateStep(step: ReasoningStep): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check confidence bounds
    if (step.confidence < REASONING_CONFIG.minConfidence || 
        step.confidence > REASONING_CONFIG.maxConfidence) {
      issues.push({
        type: 'inconsistency',
        stepId: step.id,
        description: `Confidence ${step.confidence} is out of valid range`,
        severity: 'low',
      });
    }

    // Check validation status
    if (step.validationStatus === 'contradicted') {
      issues.push({
        type: 'inconsistency',
        stepId: step.id,
        description: 'Step has been contradicted',
        severity: 'critical',
      });
    }

    if (step.validationStatus === 'invalid') {
      issues.push({
        type: 'invalid_inference',
        stepId: step.id,
        description: 'Step validation failed',
        severity: 'high',
      });
    }

    // Check for missing evidence
    if (step.evidenceIds.length === 0 && step.type !== 'deduction') {
      issues.push({
        type: 'missing_evidence',
        stepId: step.id,
        description: 'Step has no supporting evidence',
        severity: 'medium',
      });
    }

    return issues;
  }

  private validateTransition(step1: ReasoningStep, step2: ReasoningStep): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if step2's premise relates to step1's conclusion
    const relationScore = this.assessRelation(step1.conclusion, step2.premise);
    
    if (relationScore < 0.2) {
      issues.push({
        type: 'gap',
        stepId: step2.id,
        description: `Weak logical connection from step ${step1.stepNumber} to step ${step2.stepNumber}`,
        severity: 'high',
      });
    } else if (relationScore < 0.4) {
      issues.push({
        type: 'gap',
        stepId: step2.id,
        description: `Moderate gap between step ${step1.stepNumber} and step ${step2.stepNumber}`,
        severity: 'medium',
      });
    }

    return issues;
  }

  private detectGaps(steps: ReasoningStep[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for missing step numbers
    const stepNumbers = steps.map(s => s.stepNumber).sort((a, b) => a - b);
    for (let i = 1; i < stepNumbers.length; i++) {
      if (stepNumbers[i] - stepNumbers[i - 1] > 1) {
        issues.push({
          type: 'gap',
          stepId: steps[i].id,
          description: `Missing steps between ${stepNumbers[i - 1]} and ${stepNumbers[i]}`,
          severity: 'medium',
        });
      }
    }

    return issues;
  }

  private detectCircularReasoning(steps: ReasoningStep[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Build conclusion -> premise mapping
    const conclusions = new Map<string, number>();
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const conclusionWords = step.conclusion.toLowerCase();
      
      // Check if this conclusion appears in earlier premises
      for (let j = 0; j < i; j++) {
        const earlierPremise = steps[j].premise.toLowerCase();
        if (earlierPremise.includes(conclusionWords.substring(0, 30)) && conclusionWords.length > 20) {
          issues.push({
            type: 'circular',
            stepId: step.id,
            description: `Circular reasoning detected with step ${steps[j].stepNumber}`,
            severity: 'high',
          });
        }
      }

      conclusions.set(conclusionWords, i);
    }

    return issues;
  }

  private validateInferenceType(step: ReasoningStep): { isValid: boolean; reason?: string } {
    // Different reasoning types have different requirements
    switch (step.type) {
      case 'deduction':
        // Deduction should have high confidence if valid
        if (step.confidence < 0.9 && step.validationStatus === 'valid') {
          return { isValid: false, reason: 'Valid deduction should have high confidence' };
        }
        break;
      
      case 'induction':
        // Induction requires evidence
        if (step.evidenceIds.length < 2) {
          return { isValid: false, reason: 'Induction requires multiple pieces of evidence' };
        }
        break;
      
      case 'abduction':
        // Abduction is hypothesis-forming, typically lower confidence
        if (step.confidence > 0.95) {
          return { isValid: false, reason: 'Abduction should have some uncertainty' };
        }
        break;
      
      case 'analogy':
        // Analogy requires explicit assumptions about similarity
        if (step.assumptions.length === 0) {
          return { isValid: false, reason: 'Analogy requires stated assumptions about similarity' };
        }
        break;
      
      case 'causal':
        // Causal reasoning needs evidence chain
        if (step.evidenceIds.length === 0) {
          return { isValid: false, reason: 'Causal reasoning requires evidence' };
        }
        break;
    }

    return { isValid: true };
  }

  private assessRelation(conclusion: string, premise: string): number {
    const conclusionWords = new Set(conclusion.toLowerCase().split(/\s+/));
    const premiseWords = new Set(premise.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(conclusionWords).filter(x => premiseWords.has(x)));
    const union = new Set([...Array.from(conclusionWords), ...Array.from(premiseWords)]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateConsistencyScore(steps: ReasoningStep[], issues: ValidationIssue[]): number {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    
    const baseScore = 1 - (criticalCount * 0.3 + highCount * 0.1);
    return Math.max(0, Math.min(1, baseScore));
  }

  private calculateCompletenessScore(steps: ReasoningStep[], issues: ValidationIssue[]): number {
    const gapCount = issues.filter(i => i.type === 'gap').length;
    const missingEvidenceCount = issues.filter(i => i.type === 'missing_evidence').length;
    
    const baseScore = 1 - (gapCount * 0.15 + missingEvidenceCount * 0.1);
    return Math.max(0, Math.min(1, baseScore));
  }
}

// ========================================
// REASONING TRACE BUILDER
// ========================================

export interface TraceBuilderOptions {
  agentSource: string;
  issueId: string;
  maxSteps?: number;
}

export class ReasoningTraceBuilder {
  private steps: ReasoningStep[] = [];
  private evidenceBindings: EvidenceBinding[] = [];
  private agentSource: string;
  private issueId: string;
  private maxSteps: number;
  private evidenceBinder: EvidenceBinder;
  private uncertaintyPropagator: UncertaintyPropagator;
  private selfCorrectionDetector: SelfCorrectionDetector;

  constructor(options: TraceBuilderOptions, evidenceBinder?: EvidenceBinder) {
    this.agentSource = options.agentSource;
    this.issueId = options.issueId;
    this.maxSteps = options.maxSteps || REASONING_CONFIG.maxSteps;
    this.evidenceBinder = evidenceBinder || new EvidenceBinder();
    this.uncertaintyPropagator = new UncertaintyPropagator();
    this.selfCorrectionDetector = new SelfCorrectionDetector();
  }

  /**
   * Adds a reasoning step to the trace
   */
  addStep(
    type: ReasoningStep['type'],
    premise: string,
    conclusion: string,
    confidence: number,
    options?: {
      evidenceIds?: string[];
      assumptions?: string[];
      isEnforceable?: boolean;
    }
  ): ReasoningStep {
    if (this.steps.length >= this.maxSteps) {
      throw new Error(`Maximum steps (${this.maxSteps}) exceeded`);
    }

    const step: ReasoningStep = {
      id: generateId('step'),
      stepNumber: this.steps.length + 1,
      type,
      premise,
      conclusion,
      confidence: Math.max(REASONING_CONFIG.minConfidence, 
                          Math.min(REASONING_CONFIG.maxConfidence, confidence)),
      evidenceIds: options?.evidenceIds || [],
      assumptions: options?.assumptions || [],
      isEnforceable: options?.isEnforceable ?? false,
      validationStatus: 'unverified',
    };

    this.steps.push(step);
    return step;
  }

  /**
   * Binds evidence to a step
   */
  bindEvidence(
    stepId: string,
    evidence: Omit<EvidenceBinding, 'id' | 'traceId' | 'stepId' | 'chainOfCustody'>
  ): EvidenceBinding {
    const traceId = generateId('trace');
    const binding = this.evidenceBinder.bindEvidence(traceId, stepId, evidence);
    this.evidenceBindings.push(binding);
    return binding;
  }

  /**
   * Propagates uncertainty through the chain
   */
  propagateUncertainty(): UncertaintyPropagation[] {
    return this.uncertaintyPropagator.propagateThroughChain(this.steps);
  }

  /**
   * Detects self-correction loops
   */
  detectSelfCorrection(): SelfCorrectionLoop | null {
    // Check if any step revisits earlier conclusions
    for (let i = 1; i < this.steps.length; i++) {
      const currentStep = this.steps[i];
      
      for (let j = 0; j < i; j++) {
        const earlierStep = this.steps[j];
        
        // If current premise relates to earlier conclusion, track iteration
        if (this.isRelated(currentStep.premise, earlierStep.conclusion)) {
          this.selfCorrectionDetector.trackIteration(
            this.issueId,
            currentStep.id,
            currentStep.conclusion,
            currentStep.confidence
          );
        }
      }
    }

    const iterationCount = this.selfCorrectionDetector.getIterationCount(this.issueId);
    if (iterationCount > 0) {
      return this.selfCorrectionDetector.createLoop(
        this.issueId,
        this.steps.map(s => s.id),
        'Self-correction detected in reasoning chain'
      );
    }

    return null;
  }

  /**
   * Validates the entire reasoning chain
   */
  validate(): { isValid: boolean; issues: ValidationIssue[] } {
    const validator = new MultiStepValidator();
    const result = validator.validate(this.steps);
    return {
      isValid: result.isValid,
      issues: result.issues,
    };
  }

  /**
   * Builds the final reasoning trace
   */
  build(): ReasoningTrace {
    const traceId = generateId('trace');
    const uncertaintyPropagation = this.propagateUncertainty();
    const selfCorrectionLoop = this.detectSelfCorrection();

    // Update step IDs to match trace
    const updatedSteps = this.steps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    }));

    // Update evidence bindings with correct trace ID
    const updatedBindings = this.evidenceBindings.map(binding => ({
      ...binding,
      traceId,
    }));

    return {
      id: traceId,
      agentSource: this.agentSource,
      issueId: this.issueId,
      steps: updatedSteps,
      totalSteps: updatedSteps.length,
      isValid: this.steps.every(s => s.validationStatus !== 'contradicted'),
      confidencePropagation: updatedSteps.map(s => s.confidence),
      uncertaintyPropagation,
      selfCorrectionLoops: selfCorrectionLoop ? [selfCorrectionLoop] : [],
      evidenceBindings: updatedBindings,
      createdAt: new Date(),
    };
  }

  /**
   * Builds a trace from a detected issue
   */
  async buildFromIssue(issue: DetectedIssue): Promise<ReasoningTrace> {
    // Create initial step from issue description
    this.addStep(
      'deduction',
      `Issue detected: ${issue.title}`,
      issue.description,
      issue.confidence,
      { evidenceIds: issue.evidenceBindings?.map(eb => eb.id) || [] }
    );

    // Add supporting evidence if available
    if (issue.evidence) {
      this.bindEvidence(this.steps[0].id, {
        evidenceType: 'direct',
        source: issue.agentSource,
        quote: issue.evidence,
        location: issue.location || 'unknown',
        relevanceScore: 1.0,
        reliabilityScore: issue.confidence,
      });
    }

    return this.build();
  }

  /**
   * Gets current steps
   */
  getSteps(): ReasoningStep[] {
    return [...this.steps];
  }

  // Private helper methods

  private isRelated(text1: string, text2: string): boolean {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    return intersection.size >= 3; // At least 3 common words
  }
}

// ========================================
// MAIN REASONING TRACE SYSTEM
// ========================================

export interface ReasoningSystemOptions {
  useAIValidation?: boolean;
  maxSteps?: number;
  maxIterations?: number;
  uncertaintyThreshold?: number;
}

export class ReasoningTraceSystem {
  private evidenceBinder: EvidenceBinder;
  private uncertaintyPropagator: UncertaintyPropagator;
  private selfCorrectionDetector: SelfCorrectionDetector;
  private multiStepValidator: MultiStepValidator;
  private options: Required<ReasoningSystemOptions>;

  constructor(options: ReasoningSystemOptions = {}) {
    this.options = {
      useAIValidation: options.useAIValidation ?? false,
      maxSteps: options.maxSteps ?? REASONING_CONFIG.maxSteps,
      maxIterations: options.maxIterations ?? REASONING_CONFIG.maxIterations,
      uncertaintyThreshold: options.uncertaintyThreshold ?? REASONING_CONFIG.uncertaintyThreshold,
    };

    this.evidenceBinder = new EvidenceBinder();
    this.uncertaintyPropagator = new UncertaintyPropagator();
    this.selfCorrectionDetector = new SelfCorrectionDetector();
    this.multiStepValidator = new MultiStepValidator();
  }

  /**
   * Creates a new reasoning trace builder
   */
  createBuilder(options: TraceBuilderOptions): ReasoningTraceBuilder {
    return new ReasoningTraceBuilder(
      { ...options, maxSteps: this.options.maxSteps },
      this.evidenceBinder
    );
  }

  /**
   * Analyzes a complete reasoning trace
   */
  async analyzeTrace(trace: ReasoningTrace): Promise<{
    validation: ValidationResult;
    uncertaintyAnalysis: {
      isBounded: boolean;
      maxUncertainty: number;
      violations: ReturnType<UncertaintyPropagator['flagThresholdViolations']>;
    };
    selfCorrectionAnalysis: {
      hasLoops: boolean;
      loopCount: number;
      convergenceStatus: SelfCorrectionLoop['convergenceStatus'] | null;
    };
  }> {
    // Validate the trace
    const validation = this.options.useAIValidation
      ? await this.multiStepValidator.validateWithAI(trace.steps)
      : this.multiStepValidator.validate(trace.steps);

    // Analyze uncertainty
    const boundedness = this.uncertaintyPropagator.detectBoundedness(
      trace.uncertaintyPropagation
    );
    const violations = this.uncertaintyPropagator.flagThresholdViolations(
      trace.uncertaintyPropagation
    );

    // Analyze self-correction loops
    const hasLoops = trace.selfCorrectionLoops.length > 0;
    const loopCount = trace.selfCorrectionLoops.length;
    const convergenceStatus = hasLoops
      ? trace.selfCorrectionLoops[0].convergenceStatus
      : null;

    return {
      validation,
      uncertaintyAnalysis: {
        isBounded: boundedness.isBounded,
        maxUncertainty: boundedness.maxUncertainty,
        violations,
      },
      selfCorrectionAnalysis: {
        hasLoops,
        loopCount,
        convergenceStatus,
      },
    };
  }

  /**
   * Builds a reasoning trace from detected issues and claims
   */
  async buildTraceFromFindings(
    agentSource: string,
    issues: DetectedIssue[],
    claims: Claim[]
  ): Promise<ReasoningTrace> {
    const builder = this.createBuilder({
      agentSource,
      issueId: generateId('issue'),
    });

    // Add steps from issues
    for (const issue of issues) {
      builder.addStep(
        'abduction',
        `Observation: ${issue.description}`,
        `Hypothesis: ${issue.title}`,
        issue.confidence,
        {
          evidenceIds: issue.evidenceBindings?.map(eb => eb.id) || [],
          isEnforceable: issue.isDeterministic ?? false,
        }
      );
    }

    // Add steps from high-confidence claims
    for (const claim of claims.filter(c => c.confidence > 0.7)) {
      builder.addStep(
        'deduction',
        `Claim: ${claim.text}`,
        `Verified: ${claim.text}`,
        claim.confidence,
        {
          evidenceIds: claim.evidenceBindings?.map(eb => eb.id) || [],
        }
      );
    }

    return builder.build();
  }

  /**
   * Validates evidence bindings for a trace
   */
  async validateEvidence(trace: ReasoningTrace): Promise<Map<string, EvidenceValidationResult>> {
    const results = new Map<string, EvidenceValidationResult>();

    for (const step of trace.steps) {
      const stepBindings = trace.evidenceBindings.filter(eb => eb.stepId === step.id);
      
      for (const binding of stepBindings) {
        const result = await this.evidenceBinder.validateRelevance(binding, step);
        results.set(binding.id, result);
      }
    }

    return results;
  }

  /**
   * Gets the evidence binder instance
   */
  getEvidenceBinder(): EvidenceBinder {
    return this.evidenceBinder;
  }

  /**
   * Gets the uncertainty propagator instance
   */
  getUncertaintyPropagator(): UncertaintyPropagator {
    return this.uncertaintyPropagator;
  }

  /**
   * Gets the self-correction detector instance
   */
  getSelfCorrectionDetector(): SelfCorrectionDetector {
    return this.selfCorrectionDetector;
  }

  /**
   * Gets the multi-step validator instance
   */
  getMultiStepValidator(): MultiStepValidator {
    return this.multiStepValidator;
  }

  /**
   * Creates a trace for a single issue with full reasoning chain
   */
  async traceIssue(issue: DetectedIssue): Promise<ReasoningTrace> {
    const builder = this.createBuilder({
      agentSource: issue.agentSource,
      issueId: issue.id,
    });

    // Step 1: Observation
    builder.addStep(
      'induction',
      `Detected ${issue.type} in ${issue.layer} layer`,
      `Issue: ${issue.title}`,
      issue.confidence * 0.9,
      { isEnforceable: issue.isDeterministic ?? false }
    );

    // Step 2: Analysis
    builder.addStep(
      'abduction',
      `Issue: ${issue.title}`,
      `Analysis: ${issue.description}`,
      issue.confidence,
      { assumptions: [`Severity: ${issue.severity}`] }
    );

    // Step 3: Resolution (if suggestion exists)
    if (issue.suggestion) {
      builder.addStep(
        'deduction',
        `Analysis: ${issue.description}`,
        `Recommendation: ${issue.suggestion}`,
        issue.confidence * 0.95,
        { isEnforceable: true }
      );
    }

    // Bind evidence if available
    if (issue.evidence) {
      const steps = builder.getSteps();
      if (steps.length > 0) {
        builder.bindEvidence(steps[0].id, {
          evidenceType: 'direct',
          source: issue.agentSource,
          quote: issue.evidence,
          location: issue.location || 'unknown',
          relevanceScore: 1.0,
          reliabilityScore: issue.confidence,
        });
      }
    }

    return builder.build();
  }
}

// Export a default instance for convenience
export const defaultReasoningSystem = new ReasoningTraceSystem();
