// Validation Agents (4) - Context, Memory, Safety, Performance Validation
// Layers: context_validation (39), memory_integrity (40), safety_validation (41), performance_validation (42)

import {
  DetectedIssue,
  AgentResult,
  DocumentGraph,
  generateId,
  IssueLayer,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';
import { agentChat, parseAIJSON, isAIAvailable } from '../ai/agent-ai';

// ========================================
// BASE AGENT CLASS FOR VALIDATION AGENTS
// ========================================

abstract class BaseValidationAgent {
  abstract name: string;
  abstract layer: IssueLayer;
  abstract description: string;
  abstract icon: string;

  async initialize() {
    // Check if AI is configured
    const available = await isAIAvailable();
    if (!available) {
      console.warn(`[${this.name}] AI not configured, using rule-based analysis only`);
    }
  }

  abstract analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult>;

  protected async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const result = await agentChat(prompt, systemPrompt || 'You are a meticulous validation analyst. Respond ONLY with valid JSON.', {
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
// VALIDATION AGENTS (4)
// ========================================

// 1. Context Validator Agent
export class ContextValidatorAgent extends BaseValidationAgent {
  name = 'Context Validator';
  layer: IssueLayer = 'context_validation';
  description = 'Validates context consistency and completeness, detects context mismatches';
  icon = '🎯';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check context pattern detection
    issues.push(...this.checkContextPatterns(documents, graph));

    // Rule-based: Check context completeness
    issues.push(...this.checkContextCompleteness(graph));

    // AI-based: Contextual analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for context validation issues:
${content.slice(0, 5000)}

Look for: context inconsistencies, missing context dependencies, 
context drift, context boundary violations, context completeness issues.

Return JSON array:
[{"type":"context_mismatch","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"inconsistency|missing_dependency|drift|boundary_violation"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;

    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'context_mismatch',
        severity: item.severity as 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'validation',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkContextPatterns(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const contextPatterns = [
      { pattern: /\b(in\s+this\s+context|given\s+the\s+context|within\s+context)\b/gi, name: 'context reference' },
      { pattern: /\b(as\s+mentioned\s+earlier|as\s+stated\s+above|previously\s+defined)\b/gi, name: 'forward/back reference' },
      { pattern: /\b(in\s+the\s+context\s+of|contextually|context-dependent)\b/gi, name: 'context dependency' },
    ];

    documents.forEach(doc => {
      contextPatterns.forEach(({ pattern, name }) => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 3) {
          issues.push({
            id: generateId(),
            type: 'context_mismatch',
            severity: 'info',
            title: 'High context dependency',
            description: `Found ${matches.length} ${name} patterns which may indicate context coupling`,
            location: doc.name,
            suggestion: 'Consider making content more self-contained or explicitly defining context boundaries',
            confidence: 0.7,
            agentSource: this.name,
            layer: this.layer,
            subType: 'context_dependency',
            fileName: doc.name,
          });
        }
      });
    });

    // Check for context references without clear definitions
    const contextRefs = graph.references.filter(r =>
      /context|scope|environment|setting/i.test(r.text)
    );

    contextRefs.forEach(ref => {
      if (!ref.isValid) {
        issues.push({
          id: generateId(),
          type: 'context_mismatch',
          severity: 'warning',
          title: 'Unresolved context reference',
          description: `Context reference "${ref.text}" is not resolved`,
          location: ref.location,
          suggestion: 'Define the context or fix the reference',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_dependency',
          fileName: ref.fileName,
        });
      }
    });

    return issues;
  }

  private checkContextCompleteness(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for entities without context
    graph.entities.forEach(entity => {
      if (!entity.attributes.context && entity.mentions.length > 1) {
        issues.push({
          id: generateId(),
          type: 'context_mismatch',
          severity: 'info',
          title: `Entity without context: ${entity.name}`,
          description: `Entity "${entity.name}" is used in multiple places but has no defined context`,
          location: entity.mentions[0]?.location || 'Unknown',
          suggestion: 'Define the context scope for this entity',
          confidence: 0.65,
          agentSource: this.name,
          layer: this.layer,
          subType: 'boundary_violation',
        });
      }
    });

    // Check for claims without evidence context
    const contextlessClaims = graph.claims.filter(c =>
      c.type === 'fact' && (!c.evidence || c.evidence.length === 0)
    );

    if (contextlessClaims.length > 0) {
      issues.push({
        id: generateId(),
        type: 'context_mismatch',
        severity: 'info',
        title: 'Facts without evidence context',
        description: `Found ${contextlessClaims.length} factual claims without evidence context`,
        location: 'Global',
        suggestion: 'Add evidence or context for factual claims',
        confidence: 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: 'inconsistency',
      });
    }

    return issues;
  }
}

// 2. Memory Integrity Agent
export class MemoryIntegrityAgent extends BaseValidationAgent {
  name = 'Memory Integrity Agent';
  layer: IssueLayer = 'memory_integrity';
  description = 'Validates memory state integrity, detects corruption patterns, checks memory consistency';
  icon = '💾';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: State validation
    issues.push(...this.checkStateValidation(graph));

    // Rule-based: Check memory consistency
    issues.push(...this.checkMemoryConsistency(documents, graph));

    // AI-based: Integrity analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for memory integrity issues:
${content.slice(0, 5000)}

Look for: memory state corruption patterns, inconsistent state transitions,
memory leaks, state synchronization issues, integrity violations.

Return JSON array:
[{"type":"memory_corruption","severity":"critical|warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"corruption|inconsistency|leak|sync_failure"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;

    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'memory_corruption',
        severity: item.severity as 'critical' | 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'validation',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkStateValidation(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for state mutations without proper validation
    graph.stateMutations.forEach(mutation => {
      // Check for missing postconditions
      if (mutation.postconditions.length === 0) {
        issues.push({
          id: generateId(),
          type: 'memory_corruption',
          severity: 'warning',
          title: 'State mutation without postconditions',
          description: `Mutation from "${mutation.source}" to "${mutation.target}" has no postconditions defined`,
          location: mutation.location,
          suggestion: 'Define postconditions to ensure state integrity',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'inconsistency',
        });
      }

      // Check for mutations without authority
      if (!mutation.authority || mutation.authority === 'unknown') {
        issues.push({
          id: generateId(),
          type: 'memory_corruption',
          severity: 'critical',
          title: 'Unauthorized state mutation',
          description: `Mutation from "${mutation.source}" to "${mutation.target}" has no defined authority`,
          location: mutation.location,
          suggestion: 'Define the authority responsible for this state mutation',
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          subType: 'corruption',
        });
      }
    });

    // Check for unreachable states
    const definedStates = new Set(graph.entities
      .filter(e => e.type === 'state')
      .map(e => e.name.toLowerCase()));

    const reachableStates = new Set<string>();
    graph.stateMutations.forEach(m => {
      reachableStates.add(m.target.toLowerCase());
    });

    definedStates.forEach(state => {
      if (!reachableStates.has(state)) {
        issues.push({
          id: generateId(),
          type: 'memory_corruption',
          severity: 'info',
          title: `Unreachable state: ${state}`,
          description: `State "${state}" is defined but never reached by any mutation`,
          location: 'Global',
          suggestion: 'Consider removing unused state or add transitions to it',
          confidence: 0.7,
          agentSource: this.name,
          layer: this.layer,
          subType: 'inconsistency',
        });
      }
    });

    return issues;
  }

  private checkMemoryConsistency(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for conflicting state definitions
    const stateDefinitions = new Map<string, string[]>();
    graph.entities
      .filter(e => e.type === 'state')
      .forEach(entity => {
        const name = entity.name.toLowerCase();
        if (!stateDefinitions.has(name)) {
          stateDefinitions.set(name, []);
        }
        entity.mentions.forEach(m => {
          stateDefinitions.get(name)!.push(m.location);
        });
      });

    stateDefinitions.forEach((locations, stateName) => {
      const uniqueLocations = [...new Set(locations)];
      if (uniqueLocations.length > 2) {
        issues.push({
          id: generateId(),
          type: 'memory_corruption',
          severity: 'info',
          title: `Multiple state definitions: ${stateName}`,
          description: `State "${stateName}" is defined in ${uniqueLocations.length} different locations`,
          location: uniqueLocations.join(', '),
          suggestion: 'Consolidate state definitions to ensure consistency',
          confidence: 0.65,
          agentSource: this.name,
          layer: this.layer,
          subType: 'inconsistency',
        });
      }
    });

    // Check for memory leak patterns
    documents.forEach(doc => {
      const allocationPatterns = [
        /\b(allocate|create|new|init)\b.*\b(memory|state|resource)\b/gi,
        /\b(store|save|cache|buffer)\b/gi,
      ];

      const deallocationPatterns = [
        /\b(deallocate|free|release|destroy|cleanup)\b/gi,
        /\b(delete|remove|clear)\b/gi,
      ];

      const allocations = allocationPatterns.flatMap(p => [...doc.content.matchAll(p)]);
      const deallocations = deallocationPatterns.flatMap(p => [...doc.content.matchAll(p)]);

      if (allocations.length > 3 && deallocations.length === 0) {
        issues.push({
          id: generateId(),
          type: 'memory_corruption',
          severity: 'warning',
          title: 'Potential memory leak pattern',
          description: `Found ${allocations.length} allocation patterns but no cleanup patterns`,
          location: doc.name,
          suggestion: 'Ensure resources are properly released',
          confidence: 0.6,
          agentSource: this.name,
          layer: this.layer,
          subType: 'leak',
          fileName: doc.name,
        });
      }
    });

    return issues;
  }
}

// 3. Safety Validator Agent
export class SafetyValidatorAgent extends BaseValidationAgent {
  name = 'Safety Validator';
  layer: IssueLayer = 'safety_validation';
  description = 'Validates safety properties, checks safety constraints, detects safety violations';
  icon = '🛡️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Safety pattern detection
    issues.push(...this.checkSafetyPatterns(documents));

    // Rule-based: Safety constraint validation
    issues.push(...this.checkSafetyConstraints(graph));

    // AI-based: Safety analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for safety validation issues:
${content.slice(0, 5000)}

Look for: safety property violations, unsafe operations, 
missing safety checks, constraint violations, risk conditions.

Return JSON array:
[{"type":"safety_violation","severity":"critical|high|warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"property_violation|unsafe_operation|missing_check|constraint_violation"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;

    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'safety_violation',
        severity: item.severity as 'critical' | 'high' | 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'validation',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkSafetyPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    const unsafePatterns = [
      { pattern: /\b(bypass|override|skip)\s+(safety|security|check|validation)\b/gi, name: 'safety bypass', severity: 'critical' as const },
      { pattern: /\b(disable|turn\s+off)\s+(safety|security|protection)\b/gi, name: 'safety disable', severity: 'critical' as const },
      { pattern: /\b(ignore|suppress)\s+(error|warning|alert)\b/gi, name: 'error suppression', severity: 'high' as const },
      { pattern: /\b(unsafe|dangerous|risky)\b/gi, name: 'unsafe keyword', severity: 'warning' as const },
      { pattern: /\b(no\s+validation|without\s+validation|unvalidated)\b/gi, name: 'missing validation', severity: 'high' as const },
      { pattern: /\b(unlimited|unrestricted|unbounded)\b.*\b(access|resource|memory)\b/gi, name: 'unlimited resource', severity: 'warning' as const },
    ];

    documents.forEach(doc => {
      unsafePatterns.forEach(({ pattern, name, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          issues.push({
            id: generateId(),
            type: 'safety_violation',
            severity,
            title: `Safety pattern detected: ${name}`,
            description: `Found potentially unsafe pattern: "${match[0]}"`,
            location: doc.name,
            suggestion: 'Review and ensure this operation is intentional and properly controlled',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'unsafe_operation',
            fileName: doc.name,
          });
        });
      });
    });

    return issues;
  }

  private checkSafetyConstraints(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for mutations without safety constraints
    graph.stateMutations.forEach(mutation => {
      const hasSafetyPrecondition = mutation.preconditions.some(pre =>
        /safe|valid|authorized|verified|checked/i.test(pre)
      );

      if (!hasSafetyPrecondition && mutation.riskLevel === 'high') {
        issues.push({
          id: generateId(),
          type: 'safety_violation',
          severity: 'high',
          title: 'High-risk mutation without safety precondition',
          description: `Mutation "${mutation.source} → ${mutation.target}" is marked high-risk but has no safety preconditions`,
          location: mutation.location,
          suggestion: 'Add safety preconditions to protect this mutation',
          confidence: 0.85,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_check',
        });
      }
    });

    // Check for governance checkpoints without enforcement
    graph.governanceCheckpoints.forEach(checkpoint => {
      if (checkpoint.type === 'validation' && checkpoint.enforcementStatus === 'bypassed') {
        issues.push({
          id: generateId(),
          type: 'safety_violation',
          severity: 'critical',
          title: 'Bypassed validation checkpoint',
          description: `Validation checkpoint is bypassed: "${checkpoint.rule.slice(0, 50)}..."`,
          location: checkpoint.location,
          suggestion: 'Ensure validation checkpoints are enforced',
          confidence: 0.95,
          agentSource: this.name,
          layer: this.layer,
          subType: 'property_violation',
        });
      }
    });

    // Check for execution paths without invariants
    graph.executionPaths.forEach(path => {
      if (path.invariants.length === 0 && path.steps.length > 3) {
        issues.push({
          id: generateId(),
          type: 'safety_violation',
          severity: 'warning',
          title: 'Execution path without safety invariants',
          description: `Path with ${path.steps.length} steps has no defined invariants`,
          location: path.location,
          suggestion: 'Add invariants to ensure safety during execution',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'constraint_violation',
        });
      }
    });

    return issues;
  }
}

// 4. Performance Validator Agent
export class PerformanceValidatorAgent extends BaseValidationAgent {
  name = 'Performance Validator';
  layer: IssueLayer = 'performance_validation';
  description = 'Validates performance requirements, checks resource usage, detects performance issues';
  icon = '📊';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Metric validation
    issues.push(...this.checkMetricValidation(documents));

    // Rule-based: Resource usage validation
    issues.push(...this.checkResourceUsage(graph));

    // AI-based: Performance analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for performance validation issues:
${content.slice(0, 5000)}

Look for: performance bottlenecks, resource exhaustion risks, 
scalability issues, missing performance constraints, inefficient patterns.

Return JSON array:
[{"type":"performance_degradation","severity":"high|medium|warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"bottleneck|resource_exhaustion|scalability|missing_constraint"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;

    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'performance_degradation',
        severity: item.severity as 'high' | 'medium' | 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'validation',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkMetricValidation(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for performance metric patterns
    const metricPatterns = [
      { pattern: /\b(\d+)\s*(ms|milliseconds?|seconds?|minutes?)\b/gi, name: 'time metric' },
      { pattern: /\b(\d+)\s*(MB|GB|TB|KB)\b/gi, name: 'memory metric' },
      { pattern: /\b(\d+)\s*(requests?|queries?|operations?)\s*(per|\/)\s*(second|minute|hour)\b/gi, name: 'throughput metric' },
    ];

    const metricsFound: { type: string; value: string; file: string }[] = [];

    documents.forEach(doc => {
      metricPatterns.forEach(({ pattern, name }) => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          metricsFound.push({ type: name, value: match[0], file: doc.name });
        });
      });
    });

    // Check for inconsistent metrics across documents
    const metricTypes = new Set(metricsFound.map(m => m.type));
    if (metricsFound.length > 5 && metricTypes.size < 2) {
      issues.push({
        id: generateId(),
        type: 'performance_degradation',
        severity: 'info',
        title: 'Limited performance metric coverage',
        description: `Found ${metricsFound.length} metrics but only ${metricTypes.size} types`,
        location: 'Global',
        suggestion: 'Add diverse performance metrics for comprehensive validation',
        confidence: 0.65,
        agentSource: this.name,
        layer: this.layer,
        subType: 'missing_constraint',
      });
    }

    // Check for performance anti-patterns
    const antiPatterns = [
      { pattern: /\b(n\s*\+\s*1|n\+1)\s*(query|queries|call|calls)?\b/gi, name: 'N+1 query', severity: 'high' as const },
      { pattern: /\b(o\s*\(\s*n\s*\^\s*2\s*\)|o\(n\^2\)|quadratic)\b/gi, name: 'quadratic complexity', severity: 'high' as const },
      { pattern: /\b(o\s*\(\s*n\s*\*\s*log\s*\)|o\(n\s*log\))\b/gi, name: 'n-log complexity', severity: 'medium' as const },
      { pattern: /\b(full\s+scan|table\s+scan|sequential\s+scan)\b/gi, name: 'full scan', severity: 'medium' as const },
      { pattern: /\b(blocking|synchronous)\s+(call|operation|io)\b/gi, name: 'blocking operation', severity: 'warning' as const },
    ];

    documents.forEach(doc => {
      antiPatterns.forEach(({ pattern, name, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 0) {
          issues.push({
            id: generateId(),
            type: 'performance_degradation',
            severity,
            title: `Performance anti-pattern: ${name}`,
            description: `Found ${matches.length} occurrences of "${name}" pattern`,
            location: doc.name,
            suggestion: 'Review and optimize to avoid performance degradation',
            confidence: 0.8,
            agentSource: this.name,
            layer: this.layer,
            subType: 'bottleneck',
            fileName: doc.name,
          });
        }
      });
    });

    return issues;
  }

  private checkResourceUsage(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for entities with resource implications
    const resourceEntities = graph.entities.filter(e =>
      e.type === 'resource' || /memory|cpu|disk|network|bandwidth/i.test(e.name)
    );

    resourceEntities.forEach(entity => {
      // Check for resource without limits
      if (!entity.attributes.limit && !entity.attributes.maxSize) {
        issues.push({
          id: generateId(),
          type: 'performance_degradation',
          severity: 'warning',
          title: `Resource without limits: ${entity.name}`,
          description: `Resource "${entity.name}" has no defined limits`,
          location: entity.mentions[0]?.location || 'Unknown',
          suggestion: 'Define resource limits to prevent exhaustion',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'resource_exhaustion',
        });
      }
    });

    // Check execution paths for performance issues
    graph.executionPaths.forEach(path => {
      // Check for very long execution paths
      if (path.steps.length > 20) {
        issues.push({
          id: generateId(),
          type: 'performance_degradation',
          severity: 'info',
          title: 'Long execution path',
          description: `Execution path has ${path.steps.length} steps which may impact performance`,
          location: path.location,
          suggestion: 'Consider optimizing or breaking down the execution path',
          confidence: 0.6,
          agentSource: this.name,
          layer: this.layer,
          subType: 'bottleneck',
        });
      }

      // Check for state explosion risk
      if (path.stateExplosionRisk) {
        issues.push({
          id: generateId(),
          type: 'performance_degradation',
          severity: 'high',
          title: 'State explosion risk detected',
          description: 'Execution path has potential for state explosion',
          location: path.location,
          suggestion: 'Implement state pruning or limiting mechanisms',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'scalability',
        });
      }
    });

    // Check for concurrent execution without proper handling
    graph.executionPaths.forEach(path => {
      const hasConcurrency = path.steps.some(step =>
        /parallel|concurrent|async|simultaneous/i.test(step)
      );

      const hasSynchronization = path.invariants.some(inv =>
        /lock|mutex|semaphore|synchronize|coordinate/i.test(inv)
      );

      if (hasConcurrency && !hasSynchronization) {
        issues.push({
          id: generateId(),
          type: 'performance_degradation',
          severity: 'warning',
          title: 'Concurrent execution without synchronization',
          description: 'Path has concurrent operations but no synchronization invariants',
          location: path.location,
          suggestion: 'Add synchronization mechanisms for concurrent operations',
          confidence: 0.7,
          agentSource: this.name,
          layer: this.layer,
          subType: 'resource_exhaustion',
        });
      }
    });

    return issues;
  }
}

// ========================================
// FACTORY FUNCTION
// ========================================

export function getValidationAgents(): BaseValidationAgent[] {
  return [
    new ContextValidatorAgent(),
    new MemoryIntegrityAgent(),
    new SafetyValidatorAgent(),
    new PerformanceValidatorAgent(),
  ];
}
