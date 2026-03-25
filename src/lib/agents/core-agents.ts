// Core Agents (10) - Base Document Analysis
// Layers 1-10: BASE LAYERS

import { 
  DetectedIssue, 
  AgentResult, 
  DocumentGraph, 
  Claim,
  generateId,
  IssueLayer,
} from './types';
import { ParsedDocument } from '../parsers/document-parser';
import { agentChat, parseAIJSON, isAIAvailable } from '../ai/agent-ai';

// ========================================
// BASE AGENT CLASS
// ========================================

abstract class BaseCoreAgent {
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
// 1. LOGIC CHECKER
// ========================================
export class LogicCheckerAgent extends BaseCoreAgent {
  name = 'Logic Checker';
  layer: IssueLayer = 'logical';
  description = 'Detects fallacies, circular reasoning, invalid inferences';
  icon = '🧠';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    const claims = graph.claims;
    const claimsText = claims.slice(0, 20).map(c => `- "${c.text}" (${c.location})`).join('\n');

    const prompt = `Analyze these claims for logical issues:
${claimsText}

Look for: circular reasoning, non sequiturs, false dichotomies, hasty generalizations, 
false causality, missing premises, invalid inferences, appeal to authority, slippery slope, 
overgeneralization, begging the question.

Return JSON array:
[{"type":"logical","severity":"critical|warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"circular_reasoning|non_sequitur|etc"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'logical',
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

    // Rule-based checks
    issues.push(...this.checkCircularDefinitions(graph));
    issues.push(...this.checkAbsoluteClaims(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.95 : 0.8,
      processingTime: Date.now() - startTime,
    };
  }

  private checkCircularDefinitions(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    graph.definitions.forEach(def1 => {
      graph.definitions.forEach(def2 => {
        if (def1.id !== def2.id &&
            def1.definition.toLowerCase().includes(def2.term.toLowerCase()) &&
            def2.definition.toLowerCase().includes(def1.term.toLowerCase())) {
          issues.push({
            id: generateId(),
            type: 'logical',
            severity: 'warning',
            title: 'Circular definition',
            description: `"${def1.term}" and "${def2.term}" define each other circularly`,
            location: `${def1.location}; ${def2.location}`,
            suggestion: 'Provide independent definitions',
            confidence: 0.85,
            agentSource: this.name,
            layer: this.layer,
            subType: 'circular_reasoning',
          });
        }
      });
    });
    return issues;
  }

  private checkAbsoluteClaims(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const absolutePatterns = [/\b(always|never|all|none|every)\b/gi];
    
    documents.forEach(doc => {
      absolutePatterns.forEach(pattern => {
        const matches = [...doc.content.matchAll(pattern)];
        if (matches.length > 3) {
          issues.push({
            id: generateId(),
            type: 'logical',
            severity: 'info',
            title: 'Multiple absolute claims',
            description: `Found ${matches.length} absolute claims which may need qualification`,
            location: doc.name,
            suggestion: 'Consider qualifying absolute statements',
            confidence: 0.6,
            agentSource: this.name,
            layer: this.layer,
            subType: 'overgeneralization',
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }
}

// ========================================
// 2. CONSISTENCY CHECKER
// ========================================
export class ConsistencyCheckerAgent extends BaseCoreAgent {
  name = 'Consistency Checker';
  layer: IssueLayer = 'contradiction';
  description = 'Checks terminology, naming conventions, style';
  icon = '🔄';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    issues.push(...this.checkTerminologyConsistency(graph));
    issues.push(...this.checkCapitalization(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }

  private checkTerminologyConsistency(graph: DocumentGraph): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const termMap = new Map<string, string[]>();
    
    graph.definitions.forEach(def => {
      const normalized = def.term.toLowerCase();
      if (!termMap.has(normalized)) termMap.set(normalized, []);
      termMap.get(normalized)!.push(def.definition);
    });

    termMap.forEach((defs, term) => {
      if (defs.length > 1 && new Set(defs.map(d => d.slice(0, 50))).size > 1) {
        issues.push({
          id: generateId(),
          type: 'consistency',
          severity: 'warning',
          title: `Inconsistent definition for "${term}"`,
          description: 'Term has multiple different definitions',
          suggestion: 'Unify the definition',
          confidence: 0.85,
          agentSource: this.name,
          layer: this.layer,
          subType: 'definition_drift',
        });
      }
    });
    return issues;
  }

  private checkCapitalization(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const techTerms = ['API', 'HTTP', 'JSON', 'REST', 'URL', 'ID', 'UI', 'UX', 'HTML', 'CSS', 'SQL'];

    documents.forEach(doc => {
      techTerms.forEach(term => {
        const matches = doc.content.match(new RegExp(`\\b${term}\\b`, 'gi'));
        if (matches && matches.length > 1 && new Set(matches).size > 1) {
          issues.push({
            id: generateId(),
            type: 'consistency',
            severity: 'info',
            title: `Inconsistent capitalization: ${term}`,
            description: `Found ${Array.from(new Set(matches)).join(', ')}`,
            location: doc.name,
            suggestion: `Use "${term}" consistently`,
            confidence: 0.9,
            agentSource: this.name,
            layer: this.layer,
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }
}

// ========================================
// 3. CONTRADICTION DETECTOR
// ========================================
export class ContradictionDetectorAgent extends BaseCoreAgent {
  name = 'Contradiction Detector';
  layer: IssueLayer = 'contradiction';
  description = 'Identifies conflicting statements';
  icon = '⚡';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    const claims = graph.claims;
    const pairs: Array<[Claim, Claim]> = [];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        if (this.arePotentiallyContradictory(claims[i], claims[j])) {
          pairs.push([claims[i], claims[j]]);
        }
      }
    }

    if (pairs.length > 0) {
      const pairsText = pairs.slice(0, 10).map((p, i) => 
        `Pair ${i + 1}: A) "${p[0].text}" B) "${p[1].text}"`
      ).join('\n');

      const prompt = `Analyze these claim pairs for contradictions:
${pairsText}

Return JSON array for actual contradictions:
[{"type":"contradiction","severity":"critical|warning","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"direct|indirect|hidden"}]`;

      const response = await this.callAI(prompt);
      const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
      
      parsed.forEach(item => {
        issues.push({
          id: generateId(),
          type: 'contradiction',
          severity: item.severity as 'critical' | 'warning',
          title: item.title as string,
          description: item.description as string,
          location: item.location as string,
          suggestion: item.suggestion as string,
          confidence: (item.confidence as number) || 0.75,
          agentSource: this.name,
          layer: this.layer,
          subType: item.subType as string,
        });
      });
    }

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private arePotentiallyContradictory(c1: Claim, c2: Claim): boolean {
    const negations = ['not', 'never', 'no', 'cannot', "doesn't", "isn't"];
    const t1 = c1.text.toLowerCase();
    const t2 = c2.text.toLowerCase();
    
    const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 3));
    const common = [...words1].filter(w => words2.has(w));

    if (common.length >= 2) {
      const hasNeg1 = negations.some(n => t1.includes(` ${n} `));
      const hasNeg2 = negations.some(n => t2.includes(` ${n} `));
      return hasNeg1 !== hasNeg2;
    }
    return false;
  }
}

// ========================================
// 4. STRUCTURE ANALYZER
// ========================================
export class StructureAnalyzerAgent extends BaseCoreAgent {
  name = 'Structure Analyzer';
  layer: IssueLayer = 'structural';
  description = 'Analyzes document structure and hierarchy';
  icon = '🏗️';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    parsedDocs.forEach((parsed, fileName) => {
      issues.push(...this.checkHeadingHierarchy(parsed, fileName));
      issues.push(...this.checkEmptySections(parsed, fileName));
      issues.push(...this.checkBrokenLinks(parsed, fileName));
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.95 : 0.85,
      processingTime: Date.now() - startTime,
    };
  }

  private checkHeadingHierarchy(parsed: ParsedDocument, fileName: string): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const headings = parsed.headings;

    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1) {
        issues.push({
          id: generateId(),
          type: 'structural',
          severity: 'warning',
          title: 'Heading hierarchy skip',
          description: `H${headings[i - 1].level} → H${headings[i].level}`,
          location: `${fileName}: Line ${headings[i].line}`,
          suggestion: 'Add intermediate heading',
          confidence: 0.95,
          agentSource: this.name,
          layer: this.layer,
          subType: 'hierarchy_skip',
          fileName,
        });
      }
    }
    return issues;
  }

  private checkEmptySections(parsed: ParsedDocument, fileName: string): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    parsed.chunks.filter(c => c.type === 'heading').forEach(heading => {
      if (heading.content.length < 5) {
        issues.push({
          id: generateId(),
          type: 'structural',
          severity: 'info',
          title: 'Empty section',
          description: `Section "${heading.content}" is empty`,
          location: `${fileName}: Line ${heading.startLine}`,
          suggestion: 'Add content or remove heading',
          confidence: 0.9,
          agentSource: this.name,
          layer: this.layer,
          fileName,
        });
      }
    });
    return issues;
  }

  private checkBrokenLinks(parsed: ParsedDocument, fileName: string): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const anchors = new Set(parsed.headings.map(h => 
      h.text.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    ));

    parsed.links.forEach(link => {
      if (link.type === 'internal' && !anchors.has(link.url.slice(1).toLowerCase())) {
        issues.push({
          id: generateId(),
          type: 'functional',
          severity: 'warning',
          title: 'Broken internal link',
          description: `Link "${link.text}" → "${link.url}" not found`,
          location: `${fileName}: Line ${link.line}`,
          suggestion: 'Fix anchor or remove link',
          confidence: 0.85,
          agentSource: this.name,
          layer: 'functional',
          fileName,
        });
      }
    });
    return issues;
  }
}

// ========================================
// 5. FACT CHECKER
// ========================================
export class FactCheckerAgent extends BaseCoreAgent {
  name = 'Fact Checker';
  layer: IssueLayer = 'factual';
  description = 'Validates claims and detects hallucinations';
  icon = '🔍';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    issues.push(...this.checkStatistics(documents));
    issues.push(...this.checkCitations(documents));

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }

  private checkStatistics(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const statPattern = /\b\d+(?:\.\d+)?%\b|\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b(?=\s*(?:people|users|percent|millions?|billions?))/gi;

    documents.forEach(doc => {
      const matches = [...doc.content.matchAll(statPattern)];
      matches.forEach(match => {
        const context = doc.content.slice(Math.max(0, match.index! - 50), match.index! + match[0].length + 50);
        if (!/source|according|cited|\[\d+\]/i.test(context)) {
          issues.push({
            id: generateId(),
            type: 'hallucination',
            severity: 'warning',
            title: 'Unsourced statistic',
            description: `Statistic "${match[0]}" without citation`,
            location: doc.name,
            suggestion: 'Add source citation',
            evidence: context,
            confidence: 0.75,
            agentSource: this.name,
            layer: this.layer,
            fileName: doc.name,
          });
        }
      });
    });
    return issues;
  }

  private checkCitations(documents: { name: string; content: string }[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    documents.forEach(doc => {
      const citations = [...doc.content.matchAll(/\[(\d+)\]/g)];
      if (citations.length > 0 && !/#{1,6}\s*(references|bibliography)/i.test(doc.content)) {
        issues.push({
          id: generateId(),
          type: 'hallucination',
          severity: 'warning',
          title: 'Missing references section',
          description: `Document has ${citations.length} citations but no references`,
          location: doc.name,
          suggestion: 'Add references section',
          confidence: 0.8,
          agentSource: this.name,
          layer: this.layer,
          fileName: doc.name,
        });
      }
    });
    return issues;
  }
}

// ========================================
// 6-10. ADDITIONAL CORE AGENTS
// ========================================

// 6. Intent-Scope Checker
export class IntentScopeCheckerAgent extends BaseCoreAgent {
  name = 'Intent-Scope Checker';
  layer: IssueLayer = 'intent';
  description = 'Verifies requirement boundaries, detects scope bleed';
  icon = '🧭';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    const content = documents.map(d => d.content).join('\n');
    
    const prompt = `Analyze this document for intent and scope issues:
${content.slice(0, 5000)}

Look for: requirement drift, scope creep, objective ambiguity, goal mismatch, ineffective solutions.

Return JSON array:
[{"type":"intent","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"scope_creep|requirement_drift|etc"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'intent',
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
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }
}

// 7. Dependency Checker
export class DependencyCheckerAgent extends BaseCoreAgent {
  name = 'Dependency Checker';
  layer: IssueLayer = 'structural';
  description = 'Validates cross-section dependencies';
  icon = '🔗';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Check for undefined references
    const definedTerms = new Set(graph.definitions.map(d => d.term.toLowerCase()));
    
    graph.references.forEach(ref => {
      if (ref.type === 'internal') {
        const targetExists = graph.nodes.some(n => 
          n.label.toLowerCase().includes(ref.target.toLowerCase())
        );
        if (!targetExists) {
          issues.push({
            id: generateId(),
            type: 'structural',
            severity: 'warning',
            title: 'Undefined reference',
            description: `Reference "${ref.text}" → "${ref.target}" not defined`,
            location: ref.location,
            suggestion: 'Define the referenced term or fix the reference',
            confidence: 0.8,
            agentSource: this.name,
            layer: this.layer,
            subType: 'undefined_reference',
          });
        }
      }
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }
}

// 8. Terminology Checker
export class TerminologyCheckerAgent extends BaseCoreAgent {
  name = 'Terminology Checker';
  layer: IssueLayer = 'semantic';
  description = 'Canonical vocabulary enforcement';
  icon = '📚';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    // Check for synonym drift
    const synonymGroups = [
      ['endpoint', 'route', 'path', 'url'],
      ['function', 'method', 'procedure'],
      ['variable', 'parameter', 'argument'],
      ['response', 'result', 'output'],
    ];

    documents.forEach(doc => {
      synonymGroups.forEach(group => {
        const found = group.filter(term => 
          new RegExp(`\\b${term}\\b`, 'i').test(doc.content)
        );
        if (found.length > 1) {
          issues.push({
            id: generateId(),
            type: 'semantic',
            severity: 'info',
            title: 'Synonym drift detected',
            description: `Found synonyms: ${found.join(', ')}`,
            location: doc.name,
            suggestion: 'Use consistent terminology',
            confidence: 0.7,
            agentSource: this.name,
            layer: this.layer,
            subType: 'synonym_drift',
            fileName: doc.name,
          });
        }
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.9 : 0.75,
      processingTime: Date.now() - startTime,
    };
  }
}

// 9. Assumption Detector
export class AssumptionDetectorAgent extends BaseCoreAgent {
  name = 'Assumption Detector';
  layer: IssueLayer = 'semantic';
  description = 'Finds implicit assumptions';
  icon = '🧠';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    const content = documents.map(d => d.content).join('\n');
    
    const prompt = `Find implicit assumptions in this document:
${content.slice(0, 5000)}

Look for: unstated prerequisites, assumed context, implicit dependencies.

Return JSON array:
[{"type":"semantic","severity":"info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"implicit_assumption"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'semantic',
        severity: 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.6,
        agentSource: this.name,
        layer: this.layer,
        subType: 'implicit_assumption',
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }
}

// 10. Example Checker
export class ExampleCheckerAgent extends BaseCoreAgent {
  name = 'Example Checker';
  layer: IssueLayer = 'factual';
  description = 'Validates examples vs actual rules';
  icon = '🧪';

  async analyze(
    documents: { name: string; content: string }[],
    parsedDocs: Map<string, ParsedDocument>,
    graph: DocumentGraph
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const issues: DetectedIssue[] = [];

    const content = documents.map(d => d.content).join('\n');
    
    const prompt = `Validate examples in this document against stated rules:
${content.slice(0, 5000)}

Look for: examples that contradict rules, misleading examples, outdated examples.

Return JSON array:
[{"type":"factual","severity":"warning|info","title":"...","description":"...","location":"...","suggestion":"...","confidence":0.0-1.0,"subType":"misleading_example"}]`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSONResponse(response) as Array<Record<string, unknown>>;
    
    parsed.forEach(item => {
      issues.push({
        id: generateId(),
        type: 'factual',
        severity: item.severity as 'warning' | 'info',
        title: item.title as string,
        description: item.description as string,
        location: item.location as string,
        suggestion: item.suggestion as string,
        confidence: (item.confidence as number) || 0.7,
        agentSource: this.name,
        layer: this.layer,
        subType: 'misleading_example',
      });
    });

    return {
      agentName: this.name,
      agentLayer: this.layer,
      agentTier: 'core',
      issues,
      claims: [],
      confidence: issues.length === 0 ? 0.85 : 0.7,
      processingTime: Date.now() - startTime,
    };
  }
}

// ========================================
// EXPORT ALL CORE AGENTS
// ========================================

export const coreAgents = [
  new LogicCheckerAgent(),
  new ConsistencyCheckerAgent(),
  new ContradictionDetectorAgent(),
  new StructureAnalyzerAgent(),
  new FactCheckerAgent(),
  new IntentScopeCheckerAgent(),
  new DependencyCheckerAgent(),
  new TerminologyCheckerAgent(),
  new AssumptionDetectorAgent(),
  new ExampleCheckerAgent(),
];

export const CORE_AGENT_COUNT = coreAgents.length;
