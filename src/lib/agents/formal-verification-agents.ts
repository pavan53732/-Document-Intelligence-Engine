// Formal Verification Agents (7) - Mathematical Verification & Formal Analysis
// Layers 33-38: FORMAL VERIFICATION LAYERS

import { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph, 
  generateId,
  IssueLayer,
  Claim,
  ExecutionPath,
  StateMutation,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';
import { agentChat, parseAIJSON, isAIAvailable } from '../ai/agent-ai';

// ========================================
// BASE AGENT CLASS FOR FORMAL VERIFICATION AGENTS
// ========================================

abstract class BaseFormalVerificationAgent {
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
    graph: DocumentGraph
  ): Promise<AgentResult>;

  protected async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const result = await agentChat(prompt, systemPrompt || 'You are a formal verification expert. Respond ONLY with valid JSON.', {
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
// 1. INVARIANT ENFORCER AGENT
// Layer: invariant_enforcement (33)
// ========================================

export class InvariantEnforcerAgent extends BaseFormalVerificationAgent {
  name = 'Invariant Enforcer Agent';
  layer: IssueLayer = 'invariant_enforcement';
  description = 'Enforces invariants at runtime, prevents violations';
  icon = '🛡️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Invariant pattern detection
    issues.push(...this.detectInvariantPatterns(documents));
    
    // Rule-based: Check for bypass attempts
    issues.push(...this.detectBypassAttempts(documents));
    
    // Rule-based: Validate invariant coverage
    issues.push(...this.checkInvariantCoverage(graph));

    // AI-based: Contextual invariant analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this specification for invariant enforcement issues:
${content.slice(0, 5000)}

Look for:
- Invariants that could be violated under certain conditions
- Missing runtime checks for stated invariants
- Contextual dependencies that could break invariants
- Edge cases where invariant enforcement fails

Return JSON array:
[{"type":"invariant_not_enforced","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"runtime_violation|missing_check|contextual_break"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'invariant_not_enforced',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
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
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private detectInvariantPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const invariantPatterns = [
      /\b(always|never|must\s+always|must\s+never)\b/gi,
      /\b(invariant|constraint|assertion)\s*:/gi,
      /\b(ensure|guarantee|maintain)\s+that\b/gi,
      /\b(precondition|postcondition)\s*:/gi,
    ];

    documents.forEach(doc => {
      invariantPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          // Check if there's an enforcement mechanism nearby
          const context = doc.content.slice(
            Math.max(0, match.index! - 100),
            Math.min(doc.content.length, match.index! + 200)
          );
          
          if (!/check|verify|validate|assert|enforce|guard/i.test(context)) {
            issues.push({
              id: generateId(),
              type: 'invariant_not_enforced',
              severity: 'high',
              title: 'Invariant without enforcement',
              description: `Invariant pattern "${match[0]}" found but no enforcement mechanism detected`,
              location: doc.name,
              suggestion: 'Add explicit enforcement checks for this invariant',
              confidence: 0.75,
              agentSource: this.name,
              layer: this.layer,
              subType: 'missing_check',
              fileName: doc.name,
            });
          }
        });
      });
    });
    return issues;
  }

  private detectBypassAttempts(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const bypassPatterns = [
      /\b(skip|bypass|ignore|override)\s+(invariant|check|validation|constraint)\b/gi,
      /\b(force|forceful)\s+(entry|exit|transition)\b/gi,
      /\b(exception|exemption)\s+(to|from)\s+(rule|invariant)\b/gi,
    ];

    documents.forEach(doc => {
      bypassPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          issues.push({
            id: generateId(),
            type: 'invariant_bypass',
            severity: 'critical',
            title: 'Potential invariant bypass detected',
            description: `Found bypass attempt: "${match[0]}"`,
            location: doc.name,
            suggestion: 'Review if this bypass is intentional and properly authorized',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'bypass_attempt',
            fileName: doc.name,
          });
        });
      });
    });
    return issues;
  }

  private checkInvariantCoverage(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if state mutations have associated invariants
    graph.stateMutations.forEach(mutation => {
      if (mutation.preconditions.length === 0 && mutation.postconditions.length === 0) {
        issues.push({
          id: generateId(),
          type: 'invariant_not_enforced',
          severity: 'medium',
          title: 'State mutation without invariants',
          description: `Mutation "${mutation.source} → ${mutation.target}" has no pre/post conditions`,
          location: mutation.location,
          suggestion: 'Define preconditions and postconditions for this mutation',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_check',
        });
      }
    });
    return issues;
  }
}

// ========================================
// 2. DETERMINISM AUDITOR AGENT
// Layer: determinism_audit (34)
// ========================================

export class DeterminismAuditorAgent extends BaseFormalVerificationAgent {
  name = 'Determinism Auditor';
  layer: IssueLayer = 'determinism_audit';
  description = 'Audits execution for determinism compliance';
  icon = '🔍';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Pattern matching (random, time, async)
    issues.push(...this.detectNondeterministicPatterns(documents));
    
    // Rule-based: Validate replay fidelity
    issues.push(...this.checkReplayFidelity(graph));

    // AI-based: Semantic determinism analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this specification for determinism issues:
${content.slice(0, 5000)}

Look for:
- Operations that could produce different results on repeated execution
- Dependencies on external state that could vary
- Ordering dependencies that could cause nondeterminism
- Race conditions in concurrent operations
- Time-dependent behaviors

Return JSON array:
[{"type":"determinism_break","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"nondeterministic_operation|external_dependency|ordering_issue|race_condition|time_dependency"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'determinism_break',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
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
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private detectNondeterministicPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const nondeterministicPatterns = [
      { pattern: /\brandom\s*\(/gi, name: 'random()', severity: 'high' as const },
      { pattern: /\bMath\.random\b/gi, name: 'Math.random', severity: 'high' as const },
      { pattern: /\b(current\s+time|timestamp|now\s*\(\)|Date\.now)/gi, name: 'current time', severity: 'high' as const },
      { pattern: /\b(async\s+|await\s+|Promise\.)/gi, name: 'async/await', severity: 'medium' as const },
      { pattern: /\b(thread|parallel|concurrent|mutex|lock)\b/gi, name: 'concurrency', severity: 'high' as const },
      { pattern: /\b(UUID|uuid|guid)\b/gi, name: 'UUID generation', severity: 'medium' as const },
      { pattern: /\b(hash|checksum)\s*\(.*time/gi, name: 'time-based hash', severity: 'medium' as const },
    ];

    documents.forEach(doc => {
      nondeterministicPatterns.forEach(({ pattern, name, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 0) {
          issues.push({
            id: generateId(),
            type: 'determinism_break',
            severity,
            title: `Nondeterministic pattern: ${name}`,
            description: `Found ${matches.length} occurrence(s) of "${name}" which can break determinism`,
            location: doc.name,
            suggestion: 'Consider using deterministic alternatives or seeding mechanisms',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'nondeterministic_operation',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }

  private checkReplayFidelity(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    graph.executionPaths.forEach(path => {
      // Check for non-deterministic markers in paths
      if (path.isDeterministic === false) {
        issues.push({
          id: generateId(),
          type: 'determinism_break',
          severity: 'high',
          title: 'Non-deterministic execution path',
          description: `Execution path at ${path.location} is marked as non-deterministic`,
          location: path.location,
          suggestion: 'Ensure execution paths produce consistent results',
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          subType: 'replay_divergence',
        });
      }
      
      // Check replay fidelity score
      if (path.replayFidelity !== undefined && path.replayFidelity < 1.0) {
        issues.push({
          id: generateId(),
          type: 'replay_divergence',
          severity: 'medium',
          title: 'Low replay fidelity',
          description: `Execution path has replay fidelity of ${(path.replayFidelity * 100).toFixed(0)}%`,
          location: path.location,
          suggestion: 'Investigate and fix causes of replay divergence',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'replay_divergence',
        });
      }
    });
    return issues;
  }
}

// ========================================
// 3. SPEC COMPLIANCE AGENT
// Layer: spec_compliance (35)
// ========================================

export class SpecComplianceAgent extends BaseFormalVerificationAgent {
  name = 'Spec Compliance Agent';
  layer: IssueLayer = 'spec_compliance';
  description = 'Validates specification compliance';
  icon = '✅';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Requirements traceability
    issues.push(...this.checkRequirementsTraceability(documents, graph));
    
    // Rule-based: Spec violation detection
    issues.push(...this.detectSpecViolations(documents, graph));

    // AI-based: Compliance analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this specification for compliance issues:
${content.slice(0, 5000)}

Look for:
- Requirements that are stated but not enforced
- Missing coverage of specified behaviors
- Contradictions between specification and implementation hints
- Gaps in requirements traceability
- Ambiguous requirements that could lead to non-compliance

Return JSON array:
[{"type":"spec_violation","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"unimplemented_requirement|coverage_gap|contradiction|traceability_gap|ambiguous_requirement"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'spec_violation',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
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
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkRequirementsTraceability(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Find requirement statements
    const requirementPatterns = [
      /\b(SHALL|MUST|SHOULD|MAY|REQUIRED|OPTIONAL)\b/gi,
      /\b(REQ-?\d+|FR-?\d+|NFR-?\d+)\b/gi,
    ];

    documents.forEach(doc => {
      requirementPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        
        // Check if requirements have traceability
        matches.forEach(match => {
          const context = doc.content.slice(
            Math.max(0, match.index! - 50),
            Math.min(doc.content.length, match.index! + 150)
          );
          
          // Look for traceability markers
          if (!/\[TRACE|\[TEST|\[IMPL|trace:|test:/i.test(context)) {
            // Only flag if this looks like a formal requirement
            if (/SHALL|MUST|REQUIRED/i.test(match[0])) {
              issues.push({
                id: generateId(),
                type: 'spec_violation',
                severity: 'medium',
                title: 'Requirement without traceability',
                description: `Requirement "${match[0]}" found but no traceability marker detected`,
                location: doc.name,
                suggestion: 'Add traceability links to tests and implementation',
                confidence: 0.65,
                agentSource: this.name,
                layer: this.layer,
                subType: 'traceability_gap',
                fileName: doc.name,
              });
            }
          }
        });
      });
    });
    return issues;
  }

  private detectSpecViolations(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for conflicting requirement levels
    const conflictPatterns = [
      { pattern: /\bMUST\s+NOT\b[\s\S]*\bMAY\b/gi, name: 'MUST NOT with MAY conflict' },
      { pattern: /\bSHALL\s+NOT\b[\s\S]*\bSHOULD\b/gi, name: 'SHALL NOT with SHOULD conflict' },
    ];

    documents.forEach(doc => {
      conflictPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(doc.content)) {
          issues.push({
            id: generateId(),
            type: 'spec_violation',
            severity: 'high',
            title: 'Conflicting requirement levels',
            description: `Found ${name}`,
            location: doc.name,
            suggestion: 'Resolve conflicting requirement specifications',
            confidence: 0.8,
            agentSource: this.name,
            layer: this.layer,
            subType: 'contradiction',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }
}

// ========================================
// 4. AMBIGUITY ELIMINATOR AGENT
// Layer: ambiguity_resolution (36)
// ========================================

export class AmbiguityEliminatorAgent extends BaseFormalVerificationAgent {
  name = 'Ambiguity Eliminator';
  layer: IssueLayer = 'ambiguity_resolution';
  description = 'Eliminates ambiguities, enforces clarity';
  icon = '🎯';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Vague term detection
    issues.push(...this.detectVagueTerms(documents));
    
    // Rule-based: Ambiguous pronouns
    issues.push(...this.detectAmbiguousPronouns(documents));

    // AI-based: Contextual ambiguity analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this specification for ambiguities:
${content.slice(0, 5000)}

Look for:
- Terms with multiple possible interpretations
- Pronoun references that could be ambiguous
- Quantifiers without precise definitions
- Conditions that could be interpreted multiple ways
- Boundary cases that aren't clearly specified

Return JSON array:
[{"type":"ambiguity_detected","severity":"high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"term_ambiguity|pronoun_reference|quantifier_vagueness|conditional_ambiguity|boundary_ambiguity"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'ambiguity_detected',
        severity: item.severity as 'high' | 'medium' | 'low' | 'info',
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
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private detectVagueTerms(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const vaguePatterns = [
      { pattern: /\b(some|several|various|certain)\b/gi, name: 'imprecise quantifier', severity: 'medium' as const },
      { pattern: /\b(approximately|roughly|about|around)\b/gi, name: 'imprecise measurement', severity: 'medium' as const },
      { pattern: /\b(reasonable|appropriate|suitable|adequate)\b/gi, name: 'subjective term', severity: 'high' as const },
      { pattern: /\b(etc\.?|and so on|and so forth|and others)\b/gi, name: 'open-ended list', severity: 'medium' as const },
      { pattern: /\b(usually|typically|normally|generally)\b/gi, name: 'frequency qualifier', severity: 'medium' as const },
      { pattern: /\b(fast|slow|large|small|big|significant)\b/gi, name: 'relative term', severity: 'low' as const },
    ];

    documents.forEach(doc => {
      vaguePatterns.forEach(({ pattern, name, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 0) {
          issues.push({
            id: generateId(),
            type: 'ambiguity_detected',
            severity,
            title: `Vague term detected: ${name}`,
            description: `Found ${matches.length} occurrence(s) of vague term pattern "${matches[0][0]}"`,
            location: doc.name,
            suggestion: `Replace with precise definition or remove ambiguity`,
            confidence: 0.75,
            agentSource: this.name,
            layer: this.layer,
            subType: 'quantifier_vagueness',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }

  private detectAmbiguousPronouns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    documents.forEach(doc => {
      const lines = doc.content.split('\n');
      
      lines.forEach((line, lineIndex) => {
        // Find pronouns that could be ambiguous
        const pronounPattern = /\b(it|they|them|this|that|these|those)\b/gi;
        const matches = [...line.matchAll(pronounPattern)];
        
        matches.forEach(match => {
          // Check if there's a clear antecedent
          const prevLines = lines.slice(Math.max(0, lineIndex - 3), lineIndex).join(' ');
          const nouns = prevLines.match(/\b[A-Z][a-z]+\b|\b[a-z]+s\b/g) || [];
          
          if (nouns.length > 1) {
            issues.push({
              id: generateId(),
              type: 'ambiguity_detected',
              severity: 'low',
              title: 'Potentially ambiguous pronoun',
              description: `Pronoun "${match[0]}" could refer to multiple antecedents`,
              location: `${doc.name}: Line ${lineIndex + 1}`,
              suggestion: 'Replace pronoun with specific noun for clarity',
              confidence: 0.6,
              agentSource: this.name,
              layer: this.layer,
              subType: 'pronoun_reference',
              fileName: doc.name,
            });
          }
        });
      });
    });
    return issues;
  }
}

// ========================================
// 5. STATE EXPLOSION CONTROLLER AGENT
// Layer: state_explosion (37)
// ========================================

export class StateExplosionControllerAgent extends BaseFormalVerificationAgent {
  name = 'State Explosion Controller';
  layer: IssueLayer = 'state_explosion';
  description = 'Controls state space explosion, ensures tractability';
  icon = '💥';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: State counting
    issues.push(...this.analyzeStateSpace(graph));
    
    // Rule-based: Detect exponential growth
    issues.push(...this.detectExponentialGrowth(documents, graph));

    // AI-based: Abstraction suggestions
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this specification for state space explosion risks:
${content.slice(0, 5000)}

Look for:
- Combinatorial explosion of states
- Unbounded state variables
- Nested state machines
- Complex interactions between components
- Missing state abstractions

Return JSON array:
[{"type":"state_explosion_risk","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"combinatorial_explosion|unbounded_variable|nested_complexity|component_interaction|missing_abstraction"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'state_explosion_risk',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
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
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private analyzeStateSpace(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Count states and transitions
    const states = graph.entities.filter(e => e.type === 'state');
    const mutations = graph.stateMutations;
    
    // Calculate theoretical state space
    const stateCount = states.length;
    const transitionCount = mutations.length;
    
    // Warn if state space is large
    if (stateCount > 50) {
      issues.push({
        id: generateId(),
        type: 'state_explosion_risk',
        severity: 'high',
        title: 'Large state space detected',
        description: `Found ${stateCount} states which may lead to verification challenges`,
        location: 'Global',
        suggestion: 'Consider state abstraction or decomposition to reduce complexity',
        confidence: 0.8,
        agentSource: this.name,
        layer: this.layer,
        subType: 'combinatorial_explosion',
      });
    }
    
    // Check transition density
    if (transitionCount > stateCount * stateCount * 0.5) {
      issues.push({
        id: generateId(),
        type: 'state_explosion_risk',
        severity: 'medium',
        title: 'High transition density',
        description: `Transition density of ${(transitionCount / stateCount).toFixed(1)} transitions per state`,
        location: 'Global',
        suggestion: 'Consider reducing transition complexity or using abstraction',
        confidence: 0.75,
        agentSource: this.name,
        layer: this.layer,
        subType: 'combinatorial_explosion',
      });
    }
    
    return issues;
  }

  private detectExponentialGrowth(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Look for patterns that indicate exponential state growth
    const exponentialPatterns = [
      /\bfor\s+each\s+.*\s+for\s+each\b/gi,
      /\bnested\s+(loop|state|machine)/gi,
      /\brecursiv(e|ely)\b/gi,
      /\b(n!|factorial)\b/gi,
    ];

    documents.forEach(doc => {
      exponentialPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          issues.push({
            id: generateId(),
            type: 'state_explosion_risk',
            severity: 'high',
            title: 'Potential exponential state growth',
            description: `Found pattern "${match[0]}" that could cause state explosion`,
            location: doc.name,
            suggestion: 'Consider using bounded abstractions or iterative approaches',
            confidence: 0.7,
            agentSource: this.name,
            layer: this.layer,
            subType: 'nested_complexity',
            fileName: doc.name,
          });
        });
      });
    });
    
    // Check execution paths for explosion risk
    graph.executionPaths.forEach(path => {
      if (path.stateExplosionRisk) {
        issues.push({
          id: generateId(),
          type: 'state_explosion_risk',
          severity: 'critical',
          title: 'Execution path marked as explosion risk',
          description: `Path at ${path.location} has state explosion risk`,
          location: path.location,
          suggestion: 'Apply state abstraction to reduce complexity',
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_abstraction',
        });
      }
    });
    
    return issues;
  }
}

// ========================================
// 6. ADVERSARIAL TESTER AGENT
// Layer: formal_verification (38)
// ========================================

export class AdversarialTesterAgent extends BaseFormalVerificationAgent {
  name = 'Adversarial Tester Agent';
  layer: IssueLayer = 'formal_verification';
  description = 'Adversarial testing, stress testing, vulnerability detection';
  icon = '⚔️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // AI-based: Generate adversarial cases
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Act as an adversarial tester. Find vulnerabilities and stress-test this specification:
${content.slice(0, 5000)}

Generate adversarial test cases that could:
- Break security assumptions
- Exploit edge cases
- Trigger undefined behavior
- Cause system failures
- Bypass validations
- Create race conditions
- Exhaust resources

Return JSON array with adversarial test cases:
[{"type":"adversarial","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"security_vulnerability|edge_case_failure|undefined_behavior|system_failure|validation_bypass|race_condition|resource_exhaustion"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'adversarial',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
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

    // Rule-based: Check for common vulnerability patterns
    issues.push(...this.detectVulnerabilityPatterns(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private detectVulnerabilityPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const vulnerabilityPatterns = [
      { pattern: /\b(password|secret|key|token)\s*=\s*["'][^"']+["']/gi, name: 'hardcoded secret', severity: 'critical' as const },
      { pattern: /\bexec\s*\(|\beval\s*\(|\bsystem\s*\(/gi, name: 'code injection risk', severity: 'critical' as const },
      { pattern: /\bSELECT\s+.*\bFROM\b.*\+\s*\w+/gi, name: 'SQL injection risk', severity: 'critical' as const },
      { pattern: /\binnerHTML\s*=|\bdocument\.write\b/gi, name: 'XSS risk', severity: 'high' as const },
      { pattern: /\bTODO:?\s*(security|auth|encrypt)/gi, name: 'security TODO', severity: 'medium' as const },
      { pattern: /\bno\s+(validation|auth|check|limit)\b/gi, name: 'missing validation', severity: 'high' as const },
    ];

    documents.forEach(doc => {
      vulnerabilityPatterns.forEach(({ pattern, name, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          issues.push({
            id: generateId(),
            type: 'adversarial',
            severity,
            title: `Vulnerability pattern: ${name}`,
            description: `Found potential ${name}: "${match[0].slice(0, 50)}..."`,
            location: doc.name,
            suggestion: 'Review and address this security concern',
            confidence: 0.8,
            agentSource: this.name,
            layer: this.layer,
            subType: 'security_vulnerability',
            fileName: doc.name,
          });
        });
      });
    });
    return issues;
  }
}

// ========================================
// 7. FORMAL VERIFIER AGENT
// Layer: formal_verification (38)
// ========================================

export class FormalVerifierAgent extends BaseFormalVerificationAgent {
  name = 'Formal Verifier Agent';
  layer: IssueLayer = 'formal_verification';
  description = 'Mathematical verification, property checking, proof generation';
  icon = '🔬';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Property verification
    issues.push(...this.verifyProperties(documents, graph));
    
    // Rule-based: Proof obligation detection
    issues.push(...this.detectProofObligations(graph));

    // AI-based: Property verification
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Perform formal verification analysis on this specification:
${content.slice(0, 5000)}

Analyze for:
- Safety properties that could be violated
- Liveness properties that might not hold
- Invariants that need proof
- Termination guarantees
- Deadlock potential
- Livelock potential

Return JSON array with verification findings:
[{"type":"verification_failure","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"safety_violation|liveness_violation|unproven_invariant|non_termination|deadlock|livelock"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'verification_failure',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
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
      agentTier: 'formal',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private verifyProperties(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for safety property patterns
    const safetyPatterns = [
      /\b(never|always|cannot|must\s+not)\s+\w+/gi,
      /\b(no\s+.*\s+can\s+ever)\b/gi,
      /\b(it\s+is\s+impossible\s+to)\b/gi,
    ];

    documents.forEach(doc => {
      safetyPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          // Check if property is formally specified
          const context = doc.content.slice(
            Math.max(0, match.index! - 100),
            Math.min(doc.content.length, match.index! + 200)
          );
          
          if (!/∀|∃|□|◇|⇒|⟹|formally|proof|lemma|theorem/i.test(context)) {
            issues.push({
              id: generateId(),
              type: 'verification_failure',
              severity: 'medium',
              title: 'Safety property without formal specification',
              description: `Safety property "${match[0].slice(0, 30)}..." lacks formal specification`,
              location: doc.name,
              suggestion: 'Consider formal specification of this property for verification',
              confidence: 0.7,
              agentSource: this.name,
              layer: this.layer,
              subType: 'unproven_invariant',
              fileName: doc.name,
            });
          }
        });
      });
    });
    
    return issues;
  }

  private detectProofObligations(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for unproven invariants in state mutations
    graph.stateMutations.forEach(mutation => {
      // Check if invariants are declared but not proven
      if (mutation.invariantIds && mutation.invariantIds.length > 0) {
        // Invariants exist but verification status unknown
        if (mutation.isLegal === undefined) {
          issues.push({
            id: generateId(),
            type: 'verification_failure',
            severity: 'medium',
            title: 'Unverified mutation invariant',
            description: `Mutation "${mutation.source} → ${mutation.target}" has invariants but verification status unknown`,
            location: mutation.location,
            suggestion: 'Provide proof that this mutation preserves all stated invariants',
            confidence: 0.75,
            agentSource: this.name,
            layer: this.layer,
            subType: 'unproven_invariant',
          });
        }
      }
    });
    
    // Check execution paths for termination
    graph.executionPaths.forEach(path => {
      if (path.steps.length > 10 && !path.governancePoints.some(p => /termin|exit|end|complete/i.test(p))) {
        issues.push({
          id: generateId(),
          type: 'verification_failure',
          severity: 'low',
          title: 'Long execution path without termination guarantee',
          description: `Path with ${path.steps.length} steps lacks explicit termination guarantee`,
          location: path.location,
          suggestion: 'Add termination condition or prove termination',
          confidence: 0.6,
          agentSource: this.name,
          layer: this.layer,
          subType: 'non_termination',
        });
      }
    });
    
    return issues;
  }
}

// ========================================
// EXPORT ALL FORMAL VERIFICATION AGENTS
// ========================================

/**
 * Returns instances of all formal verification agents
 */
export function getFormalVerificationAgents(): BaseFormalVerificationAgent[] {
  return [
    new InvariantEnforcerAgent(),
    new DeterminismAuditorAgent(),
    new SpecComplianceAgent(),
    new AmbiguityEliminatorAgent(),
    new StateExplosionControllerAgent(),
    new AdversarialTesterAgent(),
    new FormalVerifierAgent(),
  ];
}

export const FORMAL_VERIFICATION_AGENT_COUNT = 7;

// Individual exports
export {
  BaseFormalVerificationAgent,
};
