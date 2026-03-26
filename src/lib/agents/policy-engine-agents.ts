// Policy Engine Agents (4) - Layers 29-32
// Policy enforcement, rule conflict resolution, audit trails, and override control

import { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph, 
  generateId,
  IssueLayer,
  Policy,
  PolicyRule,
  RuleConflict,
  AuditEntry,
  OverrideRequest,
  Claim,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';
import { agentChat, parseAIJSON, isAIAvailable } from '../ai/agent-ai';

// ========================================
// BASE AGENT CLASS FOR POLICY ENGINE AGENTS
// ========================================

abstract class BasePolicyEngineAgent {
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
      const result = await agentChat(prompt, systemPrompt || 'You are a meticulous policy compliance analyst. Respond ONLY with valid JSON.', {
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
// 1. POLICY ENGINE AGENT - Layer 29
// ========================================

export class PolicyEngineAgent extends BasePolicyEngineAgent {
  name = 'Policy Engine Agent';
  layer: IssueLayer = 'policy_enforcement';
  description = 'Enforces policy rules, validates compliance with documented policies';
  icon = '📜';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Check for policy patterns (must, shall, required, prohibited)
    issues.push(...this.checkPolicyPatterns(documents));

    // Rule-based: Validate against defined policies
    issues.push(...this.validatePolicyCompliance(graph));

    // AI-based: Analyze policy compliance semantically
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for policy compliance issues:
${content.slice(0, 5000)}

Look for: policy violations, missing policy enforcement, inconsistent policy application,
undocumented exceptions, policy gaps, non-compliant behaviors.

Return JSON array:
[{"type":"policy_violation","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"policy_violation|missing_enforcement|policy_gap|rule_ambiguity","policyId":"..."}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'policy_violation',
        severity: item.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
        policyViolation: item.policyId as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'policy',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkPolicyPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Mandatory language patterns
    const mandatoryPatterns = [
      { pattern: /\b(must|shall|is required to|has to)\b/gi, type: 'mandatory' },
      { pattern: /\b(required|mandatory|obligatory)\b/gi, type: 'required' },
      { pattern: /\b(prohibited|forbidden|must not|shall not)\b/gi, type: 'prohibited' },
    ];

    documents.forEach(doc => {
      const policyStatements: Array<{ match: string; type: string; context: string }> = [];
      
      mandatoryPatterns.forEach(({ pattern, type }) => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          const contextStart = Math.max(0, match.index! - 50);
          const contextEnd = Math.min(doc.content.length, match.index! + match[0].length + 50);
          const context = doc.content.slice(contextStart, contextEnd);
          policyStatements.push({ match: match[0], type, context });
        });
      });

      // Check for policy statements without enforcement mechanisms
      if (policyStatements.length > 0) {
        const hasEnforcement = /\b(enforce|enforcement|validate|validation|check|verify|audit)\b/i.test(doc.content);
        
        if (!hasEnforcement && policyStatements.length > 3) {
          issues.push({
            id: generateId(),
            type: 'policy_violation',
            severity: 'medium',
            title: 'Policies without enforcement mechanisms',
            description: `Found ${policyStatements.length} policy statements but no clear enforcement mechanisms documented`,
            location: doc.name,
            suggestion: 'Add enforcement mechanisms (validation, checks, audits) for policy compliance',
            confidence: 0.75,
            agentSource: this.name,
            layer: this.layer,
            subType: 'missing_enforcement',
            fileName: doc.name,
          });
        }
      }

      // Check for conflicting policy statements
      const prohibitedStatements = policyStatements.filter(s => s.type === 'prohibited');
      const mandatoryStatements = policyStatements.filter(s => s.type === 'mandatory');
      
      // Look for potential conflicts between mandatory and prohibited on similar subjects
      prohibitedStatements.forEach(prohibited => {
        mandatoryStatements.forEach(mandatory => {
          // Simple heuristic: check if they reference similar context
          const prohibitedWords = prohibited.context.toLowerCase().split(/\s+/);
          const mandatoryWords = mandatory.context.toLowerCase().split(/\s+/);
          const commonWords = prohibitedWords.filter(w => mandatoryWords.includes(w) && w.length > 4);
          
          if (commonWords.length >= 2) {
            issues.push({
              id: generateId(),
              type: 'policy_violation',
              severity: 'high',
              title: 'Potential policy conflict detected',
              description: `Mandatory statement "${mandatory.match}" and prohibited statement "${prohibited.match}" may conflict`,
              location: doc.name,
              suggestion: 'Review and clarify the policy to resolve potential conflict',
              confidence: 0.65,
              agentSource: this.name,
              layer: this.layer,
              subType: 'rule_ambiguity',
              fileName: doc.name,
            });
          }
        });
      });
    });

    return issues;
  }

  private validatePolicyCompliance(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check policies defined in the graph
    graph.policies.forEach(policy => {
      if (!policy.isActive) {
        issues.push({
          id: generateId(),
          type: 'policy_violation',
          severity: 'info',
          title: `Inactive policy: ${policy.name}`,
          description: `Policy "${policy.name}" is defined but not active`,
          location: 'Global',
          suggestion: 'Review if this policy should be activated or removed',
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          subType: 'policy_gap',
        });
      }

      // Check for rules without clear conditions
      policy.rules.forEach(rule => {
        if (!rule.condition || rule.condition.trim() === '') {
          issues.push({
            id: generateId(),
            type: 'policy_violation',
            severity: 'medium',
            title: `Rule without condition: ${rule.name}`,
            description: `Rule "${rule.name}" in policy "${policy.name}" has no defined condition`,
            location: 'Global',
            suggestion: 'Define the condition under which this rule applies',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'rule_ambiguity',
          });
        }
      });
    });

    // Check governance checkpoints for policy references
    graph.governanceCheckpoints.forEach(checkpoint => {
      if (checkpoint.policyId) {
        const policyExists = graph.policies.some(p => p.id === checkpoint.policyId);
        if (!policyExists) {
          issues.push({
            id: generateId(),
            type: 'policy_violation',
            severity: 'high',
            title: 'Governance checkpoint references undefined policy',
            description: `Checkpoint references policy "${checkpoint.policyId}" which is not defined`,
            location: checkpoint.location,
            suggestion: 'Define the referenced policy or update the checkpoint',
            confidence: 0.9,
            agentSource: this.name,
            layer: this.layer,
            subType: 'policy_gap',
          });
        }
      }
    });

    return issues;
  }
}

// ========================================
// 2. RULE CONFLICT RESOLVER AGENT - Layer 30
// ========================================

export class RuleConflictResolverAgent extends BasePolicyEngineAgent {
  name = 'Rule Conflict Resolver';
  layer: IssueLayer = 'rule_conflict';
  description = 'Detects conflicting rules and resolves using priority/precedence';
  icon = '⚖️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Pattern matching for contradictions
    issues.push(...this.detectContradictions(documents, graph));

    // Rule-based: Detect conflicts in defined rules
    const conflicts = this.detectRuleConflicts(graph);
    issues.push(...conflicts.issues);
    claims.push(...conflicts.claims);

    // AI-based: Semantic conflict detection
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for rule conflicts and contradictions:
${content.slice(0, 5000)}

Look for: contradictory rules, overlapping conditions with different outcomes,
rules that negate each other, priority conflicts, scope conflicts.

Return JSON array:
[{"type":"rule_conflict","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"contradiction|overlap|exclusion|priority","rule1Id":"...","rule2Id":"...","resolution":"rule1_wins|rule2_wins|merge|escalate"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'rule_conflict',
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
      agentTier: 'policy',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private detectContradictions(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Patterns that often indicate contradictions
    const contradictionPatterns = [
      { pattern: /\b(always|never|all|none|every|no)\b/gi, type: 'absolute' },
      { pattern: /\b(may|can|might|could|sometimes|occasionally)\b/gi, type: 'conditional' },
    ];

    documents.forEach(doc => {
      const absoluteStatements: Array<{ match: string; index: number }> = [];
      const conditionalStatements: Array<{ match: string; index: number }> = [];

      contradictionPatterns.forEach(({ pattern, type }) => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          if (type === 'absolute') {
            absoluteStatements.push({ match: match[0], index: match.index! });
          } else {
            conditionalStatements.push({ match: match[0], index: match.index! });
          }
        });
      });

      // Check for absolute followed by conditional on similar topic (potential contradiction)
      if (absoluteStatements.length > 0 && conditionalStatements.length > 0) {
        const hasPotentialConflict = absoluteStatements.some(abs => {
          return conditionalStatements.some(cond => {
            const distance = Math.abs(abs.index - cond.index);
            return distance < 500; // Within same paragraph/section
          });
        });

        if (hasPotentialConflict) {
          issues.push({
            id: generateId(),
            type: 'rule_conflict',
            severity: 'medium',
            title: 'Potential rule contradiction',
            description: 'Found absolute statements (always/never/all) near conditional statements (may/can/might)',
            location: doc.name,
            suggestion: 'Review for potential contradiction between absolute and conditional rules',
            confidence: 0.6,
            agentSource: this.name,
            layer: this.layer,
            subType: 'contradiction',
            fileName: doc.name,
          });
        }
      }
    });

    return issues;
  }

  private detectRuleConflicts(graph: DocumentGraph): { issues: DetectedIssue[]; claims: Claim[] } {
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];
    const allRules: PolicyRule[] = [];

    // Collect all rules from all policies
    graph.policies.forEach(policy => {
      policy.rules.forEach(rule => {
        allRules.push(rule);
      });
    });

    // Check for conflicts between rules
    for (let i = 0; i < allRules.length; i++) {
      for (let j = i + 1; j < allRules.length; j++) {
        const rule1 = allRules[i];
        const rule2 = allRules[j];

        // Check if rules are in conflict list
        if (rule1.conflicts.includes(rule2.id) || rule2.conflicts.includes(rule1.id)) {
          issues.push({
            id: generateId(),
            type: 'rule_conflict',
            severity: 'high',
            title: `Documented rule conflict: ${rule1.name} vs ${rule2.name}`,
            description: `Rules "${rule1.name}" and "${rule2.name}" are marked as conflicting`,
            location: 'Global',
            suggestion: 'Apply conflict resolution policy or merge rules',
            confidence: 0.95,
            agentSource: this.name,
            layer: this.layer,
            subType: 'contradiction',
          });

          claims.push({
            id: generateId(),
            text: `Rules ${rule1.name} and ${rule2.name} are in documented conflict`,
            location: 'Global',
            fileName: 'system',
            type: 'fact',
            confidence: 0.95,
          });
        }

        // Check for rules with same policy but different actions on same condition
        if (rule1.policyId === rule2.policyId) {
          const conditionSimilarity = this.calculateConditionSimilarity(rule1.condition, rule2.condition);
          if (conditionSimilarity > 0.7 && rule1.action !== rule2.action) {
            issues.push({
              id: generateId(),
              type: 'rule_conflict',
              severity: 'high',
              title: `Overlapping rules in same policy: ${rule1.name} and ${rule2.name}`,
              description: `Both rules have similar conditions but different actions within the same policy`,
              location: 'Global',
              suggestion: 'Consolidate rules or clarify priority/precedence',
              confidence: 0.8,
              agentSource: this.name,
              layer: this.layer,
              subType: 'overlap',
            });
          }
        }
      }
    }

    return { issues, claims };
  }

  private calculateConditionSimilarity(condition1: string, condition2: string): number {
    const words1 = new Set(condition1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(condition2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

// ========================================
// 3. AUDIT TRAIL GENERATOR AGENT - Layer 31
// ========================================

export class AuditTrailGeneratorAgent extends BasePolicyEngineAgent {
  name = 'Audit Trail Generator';
  layer: IssueLayer = 'audit_trail';
  description = 'Generates comprehensive audit trails, tracks agent decisions';
  icon = '📋';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];
    const auditEntries: AuditEntry[] = [];

    // Rule-based: Structured logging checks
    issues.push(...this.checkAuditRequirements(documents, graph));

    // Rule-based: Track existing audit entries
    const existingAuditAnalysis = this.analyzeExistingAuditEntries(graph);
    issues.push(...existingAuditAnalysis.issues);
    auditEntries.push(...existingAuditAnalysis.entries);

    // Generate audit entries for tracked activities
    const generatedEntries = this.generateAuditEntries(documents, graph);
    auditEntries.push(...generatedEntries);

    // AI-based: Natural language summaries
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for audit trail completeness and generate natural language summaries:
${content.slice(0, 5000)}

Look for: missing audit trails, incomplete evidence chains, actions without tracking,
decision points without logging, state changes without records.

Return JSON array:
[{"type":"missing_audit_trail","severity":"high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"missing_audit|incomplete_evidence|untracked_action|untracked_decision"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'missing_audit_trail',
        severity: item.severity as 'high' | 'medium' | 'low' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
        auditEntryId: generateId(),
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'policy',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
      auditEntries,
    };
  }

  private checkAuditRequirements(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for actions that should have audit trails
    const auditKeywords = ['approve', 'reject', 'modify', 'delete', 'create', 'update', 'access', 'grant', 'revoke'];
    
    documents.forEach(doc => {
      auditKeywords.forEach(keyword => {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = [...doc.content.matchAll(pattern)];
        
        if (matches.length > 0) {
          // Check if audit/logging is mentioned nearby
          const hasLoggingNearby = matches.some(match => {
            const start = Math.max(0, match.index! - 100);
            const end = Math.min(doc.content.length, match.index! + 100);
            const context = doc.content.slice(start, end).toLowerCase();
            return /log|audit|record|track|history|trace/.test(context);
          });

          if (!hasLoggingNearby && matches.length > 2) {
            issues.push({
              id: generateId(),
              type: 'missing_audit_trail',
              severity: 'medium',
              title: `Missing audit trail for ${keyword} actions`,
              description: `Found ${matches.length} "${keyword}" actions without apparent audit tracking`,
              location: doc.name,
              suggestion: `Add audit logging for ${keyword} actions to maintain compliance`,
              confidence: 0.7,
              agentSource: this.name,
              layer: this.layer,
              subType: 'untracked_action',
              fileName: doc.name,
            });
          }
        }
      });
    });

    // Check state mutations for audit trails
    graph.stateMutations.forEach(mutation => {
      const hasAuditEntry = graph.auditEntries.some(
        entry => entry.target === mutation.source || entry.target === mutation.target
      );
      
      if (!hasAuditEntry) {
        issues.push({
          id: generateId(),
          type: 'missing_audit_trail',
          severity: 'medium',
          title: 'State mutation without audit trail',
          description: `Mutation from "${mutation.source}" to "${mutation.target}" has no audit entry`,
          location: mutation.location,
          suggestion: 'Add audit trail for this state transition',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'untracked_action',
        });
      }
    });

    return issues;
  }

  private analyzeExistingAuditEntries(graph: DocumentGraph): { issues: DetectedIssue[]; entries: AuditEntry[] } {
    const issues: DetectedIssue[] = [];
    const entries: AuditEntry[] = [];

    graph.auditEntries.forEach(entry => {
      // Check for complete evidence chains
      if (!entry.evidence || entry.evidence.length === 0) {
        issues.push({
          id: generateId(),
          type: 'missing_audit_trail',
          severity: 'low',
          title: 'Audit entry without evidence',
          description: `Audit entry for action "${entry.action}" has no evidence chain`,
          location: entry.target,
          suggestion: 'Add evidence references to strengthen audit trail',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'incomplete_evidence',
          auditEntryId: entry.id,
        });
      }

      // Validate tamper-evident properties
      if (!entry.details || Object.keys(entry.details).length === 0) {
        issues.push({
          id: generateId(),
          type: 'missing_audit_trail',
          severity: 'info',
          title: 'Audit entry lacks detail metadata',
          description: `Audit entry for "${entry.action}" has minimal metadata`,
          location: entry.target,
          suggestion: 'Add contextual details for comprehensive audit trail',
          confidence: 0.65,
          agentSource: this.name,
          layer: this.layer,
          subType: 'incomplete_evidence',
          auditEntryId: entry.id,
        });
      }
    });

    return { issues, entries };
  }

  private generateAuditEntries(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): AuditEntry[] {
    const entries: AuditEntry[] = [];
    const now = new Date();

    // Generate audit entries for governance checkpoints
    graph.governanceCheckpoints.forEach(checkpoint => {
      entries.push({
        id: generateId(),
        timestamp: now,
        agentSource: this.name,
        action: 'governance_checkpoint_analysis',
        target: checkpoint.location,
        result: 'success',
        details: {
          checkpointType: checkpoint.type,
          rule: checkpoint.rule.slice(0, 100),
          policyId: checkpoint.policyId,
        },
        evidence: [checkpoint.rule],
      });
    });

    // Generate audit entries for policy evaluations
    graph.policies.forEach(policy => {
      entries.push({
        id: generateId(),
        timestamp: now,
        agentSource: this.name,
        action: 'policy_compliance_check',
        target: policy.name,
        result: policy.isActive ? 'success' : 'warning',
        details: {
          policyId: policy.id,
          ruleCount: policy.rules.length,
          priority: policy.priority,
          isActive: policy.isActive,
        },
        evidence: policy.rules.map(r => r.name),
      });
    });

    return entries;
  }
}

// ========================================
// 4. OVERRIDE CONTROLLER AGENT - Layer 32
// ========================================

export class OverrideControllerAgent extends BasePolicyEngineAgent {
  name = 'Override Controller';
  layer: IssueLayer = 'override_control';
  description = 'Manages override requests, validates authorization, tracks history';
  icon = '🎛️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];
    const claims: Claim[] = [];

    // Rule-based: Authorization checks
    issues.push(...this.checkAuthorizationPatterns(documents, graph));

    // Rule-based: Check override request validity
    issues.push(...this.validateOverrideRequests(graph));

    // AI-based: Risk assessment for overrides
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for override control issues:
${content.slice(0, 5000)}

Look for: unauthorized override attempts, missing authorization, expired overrides,
risky override patterns, bypass mechanisms without proper controls.

Return JSON array:
[{"type":"unauthorized_override","severity":"critical|high|medium|low|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"unauthorized|expired|risky_pattern|missing_authorization","riskLevel":"low|medium|high|critical"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'unauthorized_override',
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
      agentTier: 'policy',
      issues,
      claims,
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkAuthorizationPatterns(
    documents: { name: string; content: string }[],
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Patterns that indicate override or bypass attempts
    const overridePatterns = [
      { pattern: /\b(override|bypass|skip|ignore|disable)\b/gi, severity: 'high' as const },
      { pattern: /\b(exception|exemption|waiver)\b/gi, severity: 'medium' as const },
      { pattern: /\b(force|manual\s+override|admin\s+override)\b/gi, severity: 'critical' as const },
    ];

    documents.forEach(doc => {
      overridePatterns.forEach(({ pattern, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        
        matches.forEach(match => {
          // Check if authorization is mentioned nearby
          const start = Math.max(0, match.index! - 150);
          const end = Math.min(doc.content.length, match.index! + 150);
          const context = doc.content.slice(start, end).toLowerCase();
          
          const hasAuthorization = /authorized|approved|permission|authorized by|approved by|sign.?off/i.test(context);
          const hasControls = /control|validation|check|require|audit|log/i.test(context);

          if (!hasAuthorization) {
            issues.push({
              id: generateId(),
              type: 'unauthorized_override',
              severity,
              title: `${match[0]} without explicit authorization`,
              description: `Found "${match[0]}" mechanism without clear authorization in context`,
              location: doc.name,
              suggestion: 'Add explicit authorization requirements and audit logging for this override',
              confidence: 0.7,
              agentSource: this.name,
              layer: this.layer,
              subType: 'missing_authorization',
              fileName: doc.name,
            });
          } else if (!hasControls) {
            issues.push({
              id: generateId(),
              type: 'unauthorized_override',
              severity: 'medium',
              title: `${match[0]} with weak controls`,
              description: `Found "${match[0]}" with authorization but limited control mechanisms`,
              location: doc.name,
              suggestion: 'Add validation checks and audit logging for override actions',
              confidence: 0.65,
              agentSource: this.name,
              layer: this.layer,
              subType: 'risky_pattern',
              fileName: doc.name,
            });
          }
        });
      });
    });

    return issues;
  }

  private validateOverrideRequests(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const now = new Date();

    // Check entities that might represent override requests
    graph.entities.filter(e => e.type === 'policy' || e.type === 'rule').forEach(entity => {
      // Check for override-related attributes
      if (entity.attributes.override || entity.attributes.bypass) {
        if (!entity.attributes.authorized) {
          issues.push({
            id: generateId(),
            type: 'unauthorized_override',
            severity: 'high',
            title: `Unauthorized override on ${entity.name}`,
            description: `Entity "${entity.name}" has override capability without authorization`,
            location: entity.mentions[0]?.location || 'Global',
            suggestion: 'Add authorization for this override capability',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'unauthorized',
          });
        }
      }
    });

    // Check for expired overrides in audit entries
    graph.auditEntries.forEach(entry => {
      if (entry.overrideId) {
        // Check if this override has expired (simplified check)
        const entryTime = new Date(entry.timestamp);
        const daysSinceEntry = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceEntry > 30) {
          issues.push({
            id: generateId(),
            type: 'unauthorized_override',
            severity: 'info',
            title: 'Potentially expired override',
            description: `Override "${entry.overrideId}" was granted ${Math.floor(daysSinceEntry)} days ago`,
            location: entry.target,
            suggestion: 'Verify if this override should be renewed or revoked',
            confidence: 0.6,
            agentSource: this.name,
            layer: this.layer,
            subType: 'expired',
            auditEntryId: entry.id,
          });
        }
      }
    });

    return issues;
  }
}

// ========================================
// EXPORTS
// ========================================

export function getPolicyEngineAgents(): BasePolicyEngineAgent[] {
  return [
    new PolicyEngineAgent(),
    new RuleConflictResolverAgent(),
    new AuditTrailGeneratorAgent(),
    new OverrideControllerAgent(),
  ];
}
