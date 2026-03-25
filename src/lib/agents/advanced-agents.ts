// Advanced Agents (20) - System-Specific Validation
// Layers: BASE Advanced (6) + SYSTEM CORE (6) + FORMAL SYSTEM (8)

import { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph, 
  generateId,
  IssueLayer,
  StateMutation,
  GovernanceCheckpoint,
  Entity,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';
import { agentChat, parseAIJSON, isAIAvailable } from '../ai/agent-ai';

// ========================================
// BASE AGENT CLASS FOR ADVANCED AGENTS
// ========================================

abstract class BaseAdvancedAgent {
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
      const result = await agentChat(prompt, systemPrompt || 'You are a meticulous document analyst. Respond ONLY with valid JSON.', {
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
// BASE ADVANCED AGENTS (6)
// ========================================

// 1. Semantic Analyzer
export class SemanticAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Semantic Analyzer';
  layer: IssueLayer = 'semantic';
  description = 'Detects ambiguity, vagueness, undefined terms';
  icon = '💬';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for vague terms
    issues.push(...this.checkVagueTerms(documents));
    
    // Rule-based: Check for undefined acronyms
    issues.push(...this.checkUndefinedAcronyms(documents, graph));

    // AI-based: Deep semantic analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for semantic clarity issues:
${content.slice(0, 5000)}

Look for: ambiguous pronoun references, vague quantifiers, undefined jargon, 
imprecise language, confusing sentence structure.

Return JSON array:
[{"type":"semantic","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"ambiguity|vagueness|undefined_term"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'semantic',
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
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkVagueTerms(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const vaguePatterns = [
      /\b(some|many|few|several|various|certain)\b/gi,
      /\b(appropriate|reasonable|suitable|adequate)\b/gi,
      /\b(etc\.?|and so on|and so forth)\b/gi,
    ];

    documents.forEach(doc => {
      vaguePatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 2) {
          issues.push({
            id: generateId(),
            type: 'semantic',
            severity: 'info',
            title: 'Vague terminology',
            description: `Found ${matches.length} vague terms (${matches.slice(0, 3).map(m => m[0]).join(', ')})`,
            location: doc.name,
            suggestion: 'Use more specific terminology',
            confidence: 0.7,
            agentSource: this.name,
            layer: this.layer,
            subType: 'vagueness',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }

  private checkUndefinedAcronyms(
    documents: { name: string; content: string }[], 
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const definedTerms = new Set(graph.definitions.map(d => d.term.toUpperCase()));
    const acronymPattern = /\b[A-Z]{2,}\b/g;

    documents.forEach(doc => {
      const acronyms = new Set([...doc.content.matchAll(acronymPattern)].map(m => m[0]));
      acronyms.forEach(acronym => {
        if (!definedTerms.has(acronym) && acronym.length <= 6) {
          issues.push({
            id: generateId(),
            type: 'semantic',
            severity: 'info',
            title: `Undefined acronym: ${acronym}`,
            description: `Acronym "${acronym}" is used but not defined`,
            location: doc.name,
            suggestion: 'Define the acronym on first use',
            confidence: 0.65,
            agentSource: this.name,
            layer: this.layer,
            subType: 'undefined_term',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }
}

// 2. Functional Validator
export class FunctionalValidatorAgent extends BaseAdvancedAgent {
  name = 'Functional Validator';
  layer: IssueLayer = 'functional';
  description = 'Checks impossible steps, broken workflows';
  icon = '⚙️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for TODO/FIXME
    issues.push(...this.checkPlaceholders(documents));

    // Rule-based: Check execution paths
    issues.push(...this.checkExecutionPaths(graph));

    // AI-based: Workflow validation
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Validate the functional workflow in this document:
${content.slice(0, 5000)}

Look for: impossible steps, missing prerequisites, broken workflows, 
dependency gaps, circular dependencies.

Return JSON array:
[{"type":"functional","severity":"critical|warning","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"impossible_step|missing_prerequisite|broken_workflow"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'functional',
        severity: item.severity as 'critical' | 'warning',
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
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkPlaceholders(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const placeholderPattern = /\b(TODO|FIXME|TBD|XXX|HACK)\b/gi;

    documents.forEach(doc => {
      const matches = [...doc.content.matchAll(placeholderPattern)];
      matches.forEach(match => {
        issues.push({
          id: generateId(),
          type: 'functional',
          severity: 'warning',
          title: 'Placeholder found',
          description: `Found placeholder "${match[0]}"`,
          location: doc.name,
          suggestion: 'Complete the placeholder content',
          confidence: 0.95,
          agentSource: this.name,
          layer: this.layer,
          subType: 'incomplete_content',
          fileName: doc.name,
        });
      });
    });
    return issues;
  }

  private checkExecutionPaths(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    graph.executionPaths.forEach(path => {
      // Check for empty steps
      if (path.steps.length === 0) {
        issues.push({
          id: generateId(),
          type: 'functional',
          severity: 'warning',
          title: 'Empty execution path',
          description: `Execution path has no steps defined`,
          location: path.location,
          suggestion: 'Define the steps for this execution path',
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          subType: 'empty_path',
        });
      }
    });
    return issues;
  }
}

// 3. Temporal Analyzer
export class TemporalAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Temporal Analyzer';
  layer: IssueLayer = 'temporal';
  description = 'Detects timeline contradictions, sequence errors';
  icon = '⏰';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check date inconsistencies
    issues.push(...this.checkDateInconsistencies(documents));

    // Rule-based: Check sequence errors
    issues.push(...this.checkSequenceErrors(graph));

    // AI-based: Temporal analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze temporal aspects of this document:
${content.slice(0, 5000)}

Look for: timeline contradictions, impossible sequences, causality breaks,
temporal paradoxes, date format inconsistencies.

Return JSON array:
[{"type":"temporal","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"timeline_contradiction|sequence_error|causality_break"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'temporal',
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
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkDateInconsistencies(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const datePatterns = [
      /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g,  // MM/DD/YYYY or DD/MM/YYYY
      /\b(\d{4})-(\d{2})-(\d{2})\b/g,           // YYYY-MM-DD
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,
    ];

    documents.forEach(doc => {
      const allDates: string[] = [];
      datePatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        allDates.push(...matches.map(m => m[0]));
      });

      if (allDates.length > 1) {
        // Check for mixed formats
        const hasISO = allDates.some(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
        const hasUS = allDates.some(d => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(d));
        
        if (hasISO && hasUS) {
          issues.push({
            id: generateId(),
            type: 'temporal',
            severity: 'info',
            title: 'Mixed date formats',
            description: 'Document uses multiple date formats',
            location: doc.name,
            suggestion: 'Use consistent date format throughout',
            confidence: 0.8,
            agentSource: this.name,
            layer: this.layer,
            subType: 'format_inconsistency',
            fileName: doc.name,
          });
        }
      }
    });
    return issues;
  }

  private checkSequenceErrors(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    graph.executionPaths.forEach(path => {
      // Check for "before" references that come after
      path.steps.forEach((step, i) => {
        if (i > 0 && /before|prior|previous/i.test(step)) {
          // Check if previous steps mention this step
          const prevSteps = path.steps.slice(0, i).join(' ');
          if (!new RegExp(step.split(' ').slice(0, 3).join(' '), 'i').test(prevSteps)) {
            issues.push({
              id: generateId(),
              type: 'temporal',
              severity: 'warning',
              title: 'Potential sequence error',
              description: `Step "${step.slice(0, 50)}..." references prior context that may not exist`,
              location: path.location,
              suggestion: 'Verify the sequence of operations',
              confidence: 0.65,
              agentSource: this.name,
              layer: this.layer,
              subType: 'sequence_error',
            });
          }
        }
      });
    });
    return issues;
  }
}

// 4. Completeness Checker
export class CompletenessCheckerAgent extends BaseAdvancedAgent {
  name = 'Completeness Checker';
  layer: IssueLayer = 'completeness';
  description = 'Finds missing edge cases, gaps in coverage';
  icon = '🧩';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for incomplete patterns
    issues.push(...this.checkIncompletePatterns(documents));

    // Rule-based: Check edge case coverage
    issues.push(...this.checkEdgeCaseCoverage(graph));

    // AI-based: Completeness analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for completeness:
${content.slice(0, 5000)}

Look for: missing edge cases, incomplete error handling, 
gaps in coverage, missing alternative paths.

Return JSON array:
[{"type":"completeness","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"missing_edge_case|incomplete_coverage|missing_alternative"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'completeness',
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
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkIncompletePatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const incompletePatterns = [
      { pattern: /\bif\b(?!\s+.*\bthen\b|\s*\{|\s*$)/gi, name: 'if without then/block' },
      { pattern: /\bwhen\b(?!\s+.*\bthen\b|\s*\{)/gi, name: 'when without consequence' },
      { pattern: /\bbut\b(?!\s+\w)/gi, name: 'hanging but' },
    ];

    documents.forEach(doc => {
      incompletePatterns.forEach(({ pattern, name }) => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 0) {
          issues.push({
            id: generateId(),
            type: 'completeness',
            severity: 'info',
            title: 'Potentially incomplete pattern',
            description: `Found pattern: ${name}`,
            location: doc.name,
            suggestion: 'Ensure all conditional statements are complete',
            confidence: 0.5,
            agentSource: this.name,
            layer: this.layer,
            subType: 'incomplete_pattern',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }

  private checkEdgeCaseCoverage(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if error handling is mentioned
    const hasErrorHandling = graph.claims.some(c => 
      /error|exception|failure|invalid|reject/i.test(c.text)
    );
    
    const hasSuccessPath = graph.executionPaths.length > 0;
    
    if (hasSuccessPath && !hasErrorHandling) {
      issues.push({
        id: generateId(),
        type: 'completeness',
        severity: 'warning',
        title: 'Missing error handling',
        description: 'Execution paths defined but no error handling documented',
        location: 'Global',
        suggestion: 'Add error handling and failure scenarios',
        confidence: 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: 'missing_edge_case',
      });
    }
    return issues;
  }
}

// 5. Quantitative Checker
export class QuantitativeCheckerAgent extends BaseAdvancedAgent {
  name = 'Quantitative Checker';
  layer: IssueLayer = 'architectural';
  description = 'Detects calculation errors, unit inconsistencies';
  icon = '📊';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check unit consistency
    issues.push(...this.checkUnitConsistency(documents));

    // Rule-based: Check number formatting
    issues.push(...this.checkNumberFormatting(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkUnitConsistency(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const unitGroups = [
      { units: ['KB', 'MB', 'GB', 'TB', 'PB'], name: 'data size' },
      { units: ['ms', 'seconds', 'minutes', 'hours', 'days'], name: 'time' },
      { units: ['B', 'KB', 'MB'], name: 'memory' },
    ];

    documents.forEach(doc => {
      unitGroups.forEach(group => {
        const found = group.units.filter(unit => 
          new RegExp(`\\d+\\s*${unit}\\b`, 'i').test(doc.content)
        );
        if (found.length > 1) {
          issues.push({
            id: generateId(),
            type: 'quantitative',
            severity: 'info',
            title: `Mixed ${group.name} units`,
            description: `Found: ${found.join(', ')}`,
            location: doc.name,
            suggestion: 'Use consistent unit formatting',
            confidence: 0.75,
            agentSource: this.name,
            layer: this.layer,
            subType: 'unit_inconsistency',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }

  private checkNumberFormatting(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    documents.forEach(doc => {
      // Check for numbers with inconsistent decimal separators
      const decimalComma = [...doc.content.matchAll(/\d+,\d+/g)];
      const decimalDot = [...doc.content.matchAll(/\d+\.\d+/g)];
      
      if (decimalComma.length > 0 && decimalDot.length > 0) {
        issues.push({
          id: generateId(),
          type: 'quantitative',
          severity: 'info',
          title: 'Mixed decimal separators',
          description: 'Found both comma and dot as decimal separators',
          location: doc.name,
          suggestion: 'Use consistent decimal separator',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'format_inconsistency',
          fileName: doc.name,
        });
      }
    });
    return issues;
  }
}

// 6. Adversarial Analyzer
export class AdversarialAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Adversarial Analyzer';
  layer: IssueLayer = 'semantic_execution';
  description = 'Stress tests claims, finds weak points';
  icon = '⚔️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // AI-based: Adversarial analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Act as an adversarial reviewer. Find weak points in this document:
${content.slice(0, 5000)}

Challenge every claim. Look for: counter-arguments, edge cases that break the logic,
assumptions that could be wrong, scenarios where the guidance fails.

Return JSON array:
[{"type":"adversarial","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"counter_argument|edge_case_failure|weak_assumption"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'adversarial',
        severity: item.severity as 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.6,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.8 : 0.65,
      processingTime: Date.now() - startTime,
    };
  }
}

// ========================================
// SYSTEM CORE AGENTS (6)
// ========================================

// 7. Authority Boundary Analyzer
export class AuthorityBoundaryAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Authority Boundary Analyzer';
  layer: IssueLayer = 'authority_boundary';
  description = 'Checks permission isolation, privilege escalation';
  icon = '🔒';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check authority boundaries
    issues.push(...this.checkAuthorityBoundaries(graph));

    // Rule-based: Check for privilege escalation patterns
    issues.push(...this.checkPrivilegeEscalation(documents, graph));

    // AI-based: Authority analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze this document for authority and permission issues:
${content.slice(0, 5000)}

Look for: permission bypass paths, missing authorization checks, 
privilege escalation risks, role boundary violations.

Return JSON array:
[{"type":"authority_breach","severity":"critical|warning","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"permission_bypass|missing_auth|privilege_escalation"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'authority_breach',
        severity: item.severity as 'critical' | 'warning',
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
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkAuthorityBoundaries(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    graph.entities.filter(e => e.type === 'authority').forEach(entity => {
      // Check for boundary without clear definition
      if (!entity.attributes.boundary || Object.keys(entity.attributes.boundary).length === 0) {
        issues.push({
          id: generateId(),
          type: 'authority_breach',
          severity: 'warning',
          title: `Undefined authority boundary: ${entity.name}`,
          description: `Authority "${entity.name}" has no defined boundary`,
          location: entity.mentions[0]?.location || 'Unknown',
          suggestion: 'Define clear boundaries for this authority',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'undefined_boundary',
        });
      }
    });
    return issues;
  }

  private checkPrivilegeEscalation(
    documents: { name: string; content: string }[], 
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for escalation patterns
    const escalationPatterns = [
      /can\s+access\s+all/i,
      /full\s+(access|control|permission)/i,
      /unrestricted/i,
      /bypass\s+(auth|security|check)/i,
    ];

    documents.forEach(doc => {
      escalationPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          issues.push({
            id: generateId(),
            type: 'authority_breach',
            severity: 'warning',
            title: 'Potential privilege escalation',
            description: `Found pattern: "${match[0]}"`,
            location: doc.name,
            suggestion: 'Review if this privilege is necessary and documented',
            confidence: 0.65,
            agentSource: this.name,
            layer: this.layer,
            subType: 'privilege_escalation',
            fileName: doc.name,
          });
        });
      });
    });
    return issues;
  }
}

// 8. Execution Invariant Validator
export class ExecutionInvariantValidatorAgent extends BaseAdvancedAgent {
  name = 'Execution Invariant Validator';
  layer: IssueLayer = 'execution_invariant';
  description = 'Validates invariant completeness, bypass channels';
  icon = '🔁';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check invariant coverage
    issues.push(...this.checkInvariantCoverage(graph));

    // Rule-based: Check for bypass patterns
    issues.push(...this.checkBypassPatterns(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkInvariantCoverage(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if state mutations have invariants
    graph.stateMutations.forEach(mutation => {
      if (mutation.preconditions.length === 0) {
        issues.push({
          id: generateId(),
          type: 'invariant_violation',
          severity: 'warning',
          title: 'State mutation without preconditions',
          description: `Mutation "${mutation.source} → ${mutation.target}" has no preconditions`,
          location: mutation.location,
          suggestion: 'Add preconditions to protect this mutation',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_precondition',
        });
      }
    });
    return issues;
  }

  private checkBypassPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const bypassPatterns = [
      /skip\s+(validation|check|auth)/i,
      /ignore\s+(error|warning|constraint)/i,
      /disable\s+(security|validation)/i,
    ];

    documents.forEach(doc => {
      bypassPatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        matches.forEach(match => {
          issues.push({
            id: generateId(),
            type: 'invariant_violation',
            severity: 'critical',
            title: 'Potential invariant bypass',
            description: `Found bypass pattern: "${match[0]}"`,
            location: doc.name,
            suggestion: 'Review if this bypass is intentional and safe',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'invariant_bypass',
            fileName: doc.name,
          });
        });
      });
    });
    return issues;
  }
}

// 9. Governance Analyzer
export class GovernanceAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Governance Analyzer';
  layer: IssueLayer = 'governance';
  description = 'Checks enforcement at all checkpoints';
  icon = '🎛️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check governance checkpoints
    issues.push(...this.checkGovernanceCheckpoints(graph));

    // Rule-based: Check for enforcement gaps
    issues.push(...this.checkEnforcementGaps(documents, graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkGovernanceCheckpoints(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    graph.governanceCheckpoints.forEach(checkpoint => {
      // Check for missing enforcement
      if (checkpoint.type === 'enforcement' && /may|can|could/i.test(checkpoint.rule)) {
        issues.push({
          id: generateId(),
          type: 'governance_gap',
          severity: 'warning',
          title: 'Weak enforcement rule',
          description: `Enforcement rule is permissive: "${checkpoint.rule.slice(0, 50)}..."`,
          location: checkpoint.location,
          suggestion: 'Use mandatory language for enforcement rules',
          confidence: 0.7,
          agentSource: this.name,
          layer: this.layer,
          subType: 'weak_enforcement',
        });
      }
    });
    return issues;
  }

  private checkEnforcementGaps(
    documents: { name: string; content: string }[], 
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if there are claims requiring governance but no checkpoints
    const regulatedClaims = graph.claims.filter(c => 
      /must|shall|required|mandatory|prohibited/i.test(c.text)
    );
    
    if (regulatedClaims.length > 0 && graph.governanceCheckpoints.length === 0) {
      issues.push({
        id: generateId(),
        type: 'governance_gap',
        severity: 'warning',
        title: 'Missing governance checkpoints',
        description: `Found ${regulatedClaims.length} regulated claims but no governance checkpoints`,
        location: 'Global',
        suggestion: 'Add governance checkpoints for regulated claims',
        confidence: 0.8,
        agentSource: this.name,
        layer: this.layer,
        subType: 'missing_checkpoint',
      });
    }
    return issues;
  }
}

// 10. State Mutation Validator
export class StateMutationValidatorAgent extends BaseAdvancedAgent {
  name = 'State Mutation Validator';
  layer: IssueLayer = 'state_mutation';
  description = 'Verifies legal state transitions';
  icon = '🗂️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for illegal transitions
    issues.push(...this.checkIllegalTransitions(graph));

    // Rule-based: Check for undefined states
    issues.push(...this.checkUndefinedStates(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkIllegalTransitions(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const definedStates = new Set(graph.entities
      .filter(e => e.type === 'state')
      .map(e => e.name.toLowerCase()));

    graph.stateMutations.forEach(mutation => {
      // Check if target state is defined
      if (!definedStates.has(mutation.target.toLowerCase()) && mutation.target !== '*') {
        issues.push({
          id: generateId(),
          type: 'mutation_illegality',
          severity: 'warning',
          title: 'Transition to undefined state',
          description: `Mutation targets undefined state: "${mutation.target}"`,
          location: mutation.location,
          suggestion: 'Define the target state or fix the transition',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'undefined_target',
        });
      }
    });
    return issues;
  }

  private checkUndefinedStates(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const definedStates = new Set(graph.entities
      .filter(e => e.type === 'state')
      .map(e => e.name.toLowerCase()));
    const usedStates = new Set<string>();

    graph.stateMutations.forEach(m => {
      usedStates.add(m.source.toLowerCase());
      usedStates.add(m.target.toLowerCase());
    });

    usedStates.forEach(state => {
      if (!definedStates.has(state) && state !== '*') {
        issues.push({
          id: generateId(),
          type: 'mutation_illegality',
          severity: 'info',
          title: `Undefined state: ${state}`,
          description: `State "${state}" is used but not defined`,
          location: 'Global',
          suggestion: 'Define the state entity',
          confidence: 0.7,
          agentSource: this.name,
          layer: this.layer,
          subType: 'undefined_state',
        });
      }
    });
    return issues;
  }
}

// 11. Determinism Analyzer
export class DeterminismAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Determinism Analyzer';
  layer: IssueLayer = 'deterministic';
  description = 'Detects nondeterministic logic, replay stability';
  icon = '🔄';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for nondeterministic patterns
    issues.push(...this.checkNondeterministicPatterns(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkNondeterministicPatterns(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const nondeterministicPatterns = [
      { pattern: /\brandom\b/gi, name: 'random', severity: 'warning' as const },
      { pattern: /\b(current\s+time|timestamp|now)\b/gi, name: 'current time', severity: 'warning' as const },
      { pattern: /\b(async|await)\b/gi, name: 'async', severity: 'info' as const },
      { pattern: /\b(thread|parallel|concurrent)\b/gi, name: 'parallel', severity: 'warning' as const },
      { pattern: /\b(race\s+condition|mutex|lock)\b/gi, name: 'race condition risk', severity: 'critical' as const },
    ];

    documents.forEach(doc => {
      nondeterministicPatterns.forEach(({ pattern, name, severity }) => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 0) {
          issues.push({
            id: generateId(),
            type: 'nondeterminism',
            severity,
            title: `Nondeterministic pattern: ${name}`,
            description: `Found ${matches.length} occurrences of "${name}"`,
            location: doc.name,
            suggestion: 'Ensure this operation is deterministic or handle nondeterminism explicitly',
            confidence: 0.75,
            agentSource: this.name,
            layer: this.layer,
            subType: 'nondeterministic_pattern',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }
}

// 12. Multi-Agent Consistency Analyzer
export class MultiAgentConsistencyAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Multi-Agent Consistency Analyzer';
  layer: IssueLayer = 'multi_agent';
  description = 'Detects conflicting agent decisions';
  icon = '🧩';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for agent conflicts
    issues.push(...this.checkAgentConflicts(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkAgentConflicts(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for overlapping agent responsibilities
    const agents = graph.entities.filter(e => e.type === 'agent');
    
    agents.forEach((agent1, i) => {
      agents.slice(i + 1).forEach(agent2 => {
        // Check for potential overlap in attributes
        const attrs1 = Object.keys(agent1.attributes);
        const attrs2 = Object.keys(agent2.attributes);
        const overlap = attrs1.filter(a => attrs2.includes(a));
        
        if (overlap.length > 0) {
          issues.push({
            id: generateId(),
            type: 'agent_conflict',
            severity: 'info',
            title: 'Potential agent responsibility overlap',
            description: `Agents "${agent1.name}" and "${agent2.name}" share attributes: ${overlap.join(', ')}`,
            location: 'Global',
            suggestion: 'Clarify boundaries between agent responsibilities',
            confidence: 0.6,
            agentSource: this.name,
            layer: this.layer,
            subType: 'responsibility_overlap',
          });
        }
      });
    });
    return issues;
  }
}

// ========================================
// FORMAL SYSTEM AGENTS (8)
// ========================================

// 13. Concurrency Safety Analyzer
export class ConcurrencySafetyAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Concurrency Safety Analyzer';
  layer: IssueLayer = 'concurrency';
  description = 'Race condition detection, parallel execution hazards';
  icon = '⚡';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for race conditions
    issues.push(...this.checkRaceConditions(documents, graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkRaceConditions(
    documents: { name: string; content: string }[], 
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for shared state without synchronization
    const sharedStates = graph.entities.filter(e => 
      e.type === 'state' && e.mentions.length > 1
    );

    sharedStates.forEach(state => {
      const hasSync = documents.some(d => 
        /\b(lock|mutex|semaphore|synchronized|atomic)\b/i.test(d.content)
      );
      
      if (!hasSync) {
        issues.push({
          id: generateId(),
          type: 'race_condition',
          severity: 'warning',
          title: `Potential race condition on state: ${state.name}`,
          description: `State "${state.name}" is accessed multiple times without visible synchronization`,
          location: 'Global',
          suggestion: 'Add synchronization for shared state access',
          confidence: 0.6,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_synchronization',
        });
      }
    });
    return issues;
  }
}

// 14. Simulation Soundness Analyzer
export class SimulationSoundnessAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Simulation Soundness Analyzer';
  layer: IssueLayer = 'simulation';
  description = 'Validates simulation accuracy, divergence risk';
  icon = '🧪';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // AI-based: Simulation analysis
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze simulation soundness in this document:
${content.slice(0, 5000)}

Look for: simulation divergence risks, accuracy issues, coverage gaps,
simplifying assumptions that may fail, model vs reality drift.

Return JSON array:
[{"type":"simulation_drift","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"divergence_risk|accuracy_issue|coverage_gap"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'simulation_drift',
        severity: item.severity as 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.65,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.8 : 0.65,
      processingTime: Date.now() - startTime,
    };
  }
}

// 15. Recovery Semantics Analyzer
export class RecoverySemanticsAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Recovery Semantics Analyzer';
  layer: IssueLayer = 'recovery';
  description = 'Rollback correctness, retry idempotency';
  icon = '🔙';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for recovery patterns
    issues.push(...this.checkRecoveryPatterns(documents, graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkRecoveryPatterns(
    documents: { name: string; content: string }[], 
    graph: DocumentGraph
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if error handling mentions recovery
    const hasErrorHandling = documents.some(d => 
      /\b(error|exception|failure)\b/i.test(d.content)
    );
    const hasRecovery = documents.some(d => 
      /\b(recover|rollback|retry|compensat)/i.test(d.content)
    );

    if (hasErrorHandling && !hasRecovery) {
      issues.push({
        id: generateId(),
        type: 'recovery_failure',
        severity: 'warning',
        title: 'Missing recovery semantics',
        description: 'Error handling detected but no recovery/rollback strategy',
        location: 'Global',
        suggestion: 'Add recovery or rollback procedures for error scenarios',
        confidence: 0.75,
        agentSource: this.name,
        layer: this.layer,
        subType: 'missing_recovery',
      });
    }
    return issues;
  }
}

// 16. World-Model Consistency Analyzer
export class WorldModelConsistencyAnalyzerAgent extends BaseAdvancedAgent {
  name = 'World-Model Consistency Analyzer';
  layer: IssueLayer = 'psg_consistency';
  description = 'PSG/graph integrity, snapshot isolation';
  icon = '🗺️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check graph consistency
    issues.push(...this.checkGraphConsistency(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkGraphConsistency(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for orphan nodes (no edges)
    const connectedNodes = new Set<string>();
    graph.edges.forEach(e => {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    });

    graph.nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        issues.push({
          id: generateId(),
          type: 'psg_integrity',
          severity: 'info',
          title: `Orphan node: ${node.label}`,
          description: `Node "${node.label}" has no connections`,
          location: node.location,
          suggestion: 'Consider if this node should be connected to other nodes',
          confidence: 0.7,
          agentSource: this.name,
          layer: this.layer,
          subType: 'orphan_node',
        });
      }
    });
    return issues;
  }
}

// 17. Boundary Enforcement Checker
export class BoundaryEnforcementCheckerAgent extends BaseAdvancedAgent {
  name = 'Boundary Enforcement Checker';
  layer: IssueLayer = 'boundary_enforcement';
  description = 'Ensures rules actually enforced';
  icon = '🔐';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check boundary enforcement
    issues.push(...this.checkBoundaryEnforcement(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkBoundaryEnforcement(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if boundaries have enforcement
    graph.entities.filter(e => e.type === 'boundary').forEach(boundary => {
      const hasEnforcement = graph.governanceCheckpoints.some(cp => 
        cp.rule.toLowerCase().includes(boundary.name.toLowerCase())
      );
      
      if (!hasEnforcement) {
        issues.push({
          id: generateId(),
          type: 'enforcement_gap',
          severity: 'warning',
          title: `Unenforced boundary: ${boundary.name}`,
          description: `Boundary "${boundary.name}" has no enforcement checkpoint`,
          location: boundary.mentions[0]?.location || 'Global',
          suggestion: 'Add enforcement checkpoint for this boundary',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_enforcement',
        });
      }
    });
    return issues;
  }
}

// 18. Convergence Stability Analyzer
export class ConvergenceStabilityAnalyzerAgent extends BaseAdvancedAgent {
  name = 'Convergence Stability Analyzer';
  layer: IssueLayer = 'convergence';
  description = 'Detects infinite loops, oscillation';
  icon = '🎯';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for cycles in state mutations
    issues.push(...this.checkStateCycles(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkStateCycles(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Build state transition graph
    const transitions = new Map<string, Set<string>>();
    graph.stateMutations.forEach(m => {
      if (!transitions.has(m.source)) transitions.set(m.source, new Set());
      transitions.get(m.source)!.add(m.target);
    });

    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (state: string): boolean => {
      visited.add(state);
      recursionStack.add(state);

      const targets = transitions.get(state);
      if (targets) {
        for (const target of targets) {
          if (!visited.has(target)) {
            if (hasCycle(target)) return true;
          } else if (recursionStack.has(target)) {
            return true;
          }
        }
      }

      recursionStack.delete(state);
      return false;
    };

    transitions.forEach((_, state) => {
      if (!visited.has(state) && hasCycle(state)) {
        issues.push({
          id: generateId(),
          type: 'convergence_failure',
          severity: 'warning',
          title: 'Potential non-convergent cycle',
          description: `State transition cycle detected involving "${state}"`,
          location: 'Global',
          suggestion: 'Review state machine for potential infinite loops',
          confidence: 0.7,
          agentSource: this.name,
          layer: this.layer,
          subType: 'state_cycle',
        });
      }
    });
    return issues;
  }
}

// 19. Semantic-Execution Checker
export class SemanticExecutionCheckerAgent extends BaseAdvancedAgent {
  name = 'Semantic-Execution Checker';
  layer: IssueLayer = 'semantic_execution';
  description = 'Intent vs execution drift detection';
  icon = '🔄';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // AI-based: Semantic-execution alignment
    const content = documents.map(d => d.content).join('\n');
    const prompt = `Analyze semantic-execution alignment in this document:
${content.slice(0, 5000)}

Look for: intent vs implementation drift, goal preservation issues,
semantic gaps in execution, stated purpose vs actual behavior.

Return JSON array:
[{"type":"semantic_drift","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"intent_drift|goal_preservation|semantic_gap"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'semantic_drift',
        severity: item.severity as 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.65,
        agentSource: this.name,
        layer: this.layer,
        subType: item.subType as string,
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.8 : 0.65,
      processingTime: Date.now() - startTime,
    };
  }
}

// 20. Invariant Closure Checker
export class InvariantClosureCheckerAgent extends BaseAdvancedAgent {
  name = 'Invariant Closure Checker';
  layer: IssueLayer = 'invariant_closure';
  description = 'Invariant covers all mutation paths';
  icon = '🔒';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check invariant coverage
    issues.push(...this.checkInvariantCoverage(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkInvariantCoverage(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check if all mutations have invariants defined
    graph.executionPaths.forEach(path => {
      if (path.steps.length > 0 && path.invariants.length === 0) {
        issues.push({
          id: generateId(),
          type: 'invariant_bypass',
          severity: 'warning',
          title: 'Execution path without invariants',
          description: `Path at ${path.location} has no invariants defined`,
          location: path.location,
          suggestion: 'Add invariants to protect this execution path',
          confidence: 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: 'missing_invariant',
        });
      }
    });
    return issues;
  }
}

// 21. Authority Leak Detector (Additional)
export class AuthorityLeakDetectorAgent extends BaseAdvancedAgent {
  name = 'Authority Leak Detector';
  layer: IssueLayer = 'authority_leak';
  description = 'Indirect authority paths, privilege escalation';
  icon = '🚨';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Rule-based: Check for indirect authority paths
    issues.push(...this.checkIndirectAuthorityPaths(graph));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'advanced',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkIndirectAuthorityPaths(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    
    // Check for potential authority delegation chains
    const authorities = graph.entities.filter(e => e.type === 'authority');
    
    authorities.forEach(auth => {
      // Check if authority can delegate
      const canDelegate = auth.mentions.some(m => 
        /delegate|transfer|assign/i.test(m.text)
      );
      
      if (canDelegate) {
        issues.push({
          id: generateId(),
          type: 'privilege_escalation',
          severity: 'warning',
          title: `Delegatable authority: ${auth.name}`,
          description: `Authority "${auth.name}" can be delegated - verify constraints`,
          location: auth.mentions[0]?.location || 'Global',
          suggestion: 'Ensure delegation has proper constraints and limits',
          confidence: 0.65,
          agentSource: this.name,
          layer: this.layer,
          subType: 'delegation_risk',
        });
      }
    });
    return issues;
  }
}

// ========================================
// EXPORT ALL ADVANCED AGENTS
// ========================================

export const advancedAgents = [
  // BASE Advanced (6)
  new SemanticAnalyzerAgent(),
  new FunctionalValidatorAgent(),
  new TemporalAnalyzerAgent(),
  new CompletenessCheckerAgent(),
  new QuantitativeCheckerAgent(),
  new AdversarialAnalyzerAgent(),
  
  // SYSTEM CORE (6)
  new AuthorityBoundaryAnalyzerAgent(),
  new ExecutionInvariantValidatorAgent(),
  new GovernanceAnalyzerAgent(),
  new StateMutationValidatorAgent(),
  new DeterminismAnalyzerAgent(),
  new MultiAgentConsistencyAnalyzerAgent(),
  
  // FORMAL SYSTEM (8)
  new ConcurrencySafetyAnalyzerAgent(),
  new SimulationSoundnessAnalyzerAgent(),
  new RecoverySemanticsAnalyzerAgent(),
  new WorldModelConsistencyAnalyzerAgent(),
  new BoundaryEnforcementCheckerAgent(),
  new ConvergenceStabilityAnalyzerAgent(),
  new SemanticExecutionCheckerAgent(),
  new InvariantClosureCheckerAgent(),
  
  // Additional (Authority Leak)
  new AuthorityLeakDetectorAgent(),
];

export const ADVANCED_AGENT_COUNT = advancedAgents.length;
