// Document Parser - Enhanced Version for 28-Layer System
// Extracts all data needed for Core, Advanced, and Meta agents
// Includes comprehensive state mutation, governance, authority extraction

import type { 
  DocumentChunk, 
  DocumentGraph, 
  GraphNode, 
  GraphEdge, 
  Claim, 
  Definition, 
  Reference,
  Entity,
  StateMutation,
  ExecutionPath,
  GovernanceCheckpoint
} from '../agents/types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface ParsedDocument {
  chunks: DocumentChunk[];
  graph: DocumentGraph;
  headings: HeadingInfo[];
  codeBlocks: CodeBlockInfo[];
  links: LinkInfo[];
  lists: ListInfo[];
  // Enhanced extracted data
  authorityModel: AuthorityModel;
  invariantSet: InvariantSet;
}

export interface HeadingInfo {
  level: number;
  text: string;
  line: number;
  id: string;
  parent?: string;
  children: string[];
}

export interface CodeBlockInfo {
  language: string;
  code: string;
  line: number;
  id: string;
}

export interface LinkInfo {
  text: string;
  url: string;
  line: number;
  type: 'internal' | 'external' | 'image';
}

export interface ListInfo {
  type: 'ordered' | 'unordered';
  items: string[];
  line: number;
}

// Authority Model for permission/authority boundary validation
export interface AuthorityModel {
  roles: AuthorityRole[];
  permissions: Permission[];
  boundaries: AuthorityBoundary[];
  escalationPaths: EscalationPath[];
}

export interface AuthorityRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  location: string;
  fileName: string;
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
  conditions: string[];
  location: string;
  fileName: string;
}

export interface AuthorityBoundary {
  id: string;
  type: 'hard' | 'soft';
  description: string;
  allowedRoles: string[];
  location: string;
  fileName: string;
}

export interface EscalationPath {
  id: string;
  from: string;
  to: string;
  trigger: string;
  location: string;
  fileName: string;
}

// Invariant Set for execution invariant validation
export interface InvariantSet {
  invariants: Invariant[];
  preconditions: Precondition[];
  postconditions: Postcondition[];
  safetyProperties: SafetyProperty[];
}

export interface Invariant {
  id: string;
  expression: string;
  type: 'safety' | 'liveness' | 'integrity';
  scope: string;
  location: string;
  fileName: string;
}

export interface Precondition {
  id: string;
  operation: string;
  condition: string;
  location: string;
  fileName: string;
}

export interface Postcondition {
  id: string;
  operation: string;
  condition: string;
  location: string;
  fileName: string;
}

export interface SafetyProperty {
  id: string;
  property: string;
  enforcedBy: string[];
  location: string;
  fileName: string;
}

export class MarkdownParser {
  private content: string;
  private fileName: string;
  private lines: string[];

  constructor(content: string, fileName: string) {
    this.content = content;
    this.fileName = fileName;
    this.lines = content.split('\n');
  }

  parse(): ParsedDocument {
    const chunks = this.extractChunks();
    const headings = this.extractHeadings();
    const codeBlocks = this.extractCodeBlocks();
    const links = this.extractLinks();
    const lists = this.extractLists();
    const graph = this.buildGraph(chunks, headings, codeBlocks, links);
    const authorityModel = this.extractAuthorityModel();
    const invariantSet = this.extractInvariants();

    return { chunks, graph, headings, codeBlocks, links, lists, authorityModel, invariantSet };
  }

  private extractChunks(): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let currentChunk: Partial<DocumentChunk> | null = null;
    let inCodeBlock = false;
    let codeLanguage = '';

    this.lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          currentChunk = {
            id: generateId(),
            fileName: this.fileName,
            content: '',
            startLine: lineNum,
            type: 'code',
            metadata: { language: codeLanguage },
          };
        } else {
          inCodeBlock = false;
          if (currentChunk) {
            currentChunk.endLine = lineNum;
            chunks.push(currentChunk as DocumentChunk);
            currentChunk = null;
          }
        }
        return;
      }

      if (inCodeBlock && currentChunk) {
        currentChunk.content += line + '\n';
        return;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentChunk) {
          currentChunk.endLine = lineNum - 1;
          chunks.push(currentChunk as DocumentChunk);
        }
        currentChunk = {
          id: generateId(),
          fileName: this.fileName,
          content: headingMatch[2],
          startLine: lineNum,
          type: 'heading',
          metadata: { level: headingMatch[1].length },
        };
        return;
      }

      if (line.match(/^[\*\-\+]\s+/) || line.match(/^\d+\.\s+/)) {
        if (!currentChunk || currentChunk.type !== 'list') {
          if (currentChunk) {
            currentChunk.endLine = lineNum - 1;
            chunks.push(currentChunk as DocumentChunk);
          }
          currentChunk = {
            id: generateId(),
            fileName: this.fileName,
            content: line + '\n',
            startLine: lineNum,
            type: 'list',
            metadata: {},
          };
        } else {
          currentChunk.content += line + '\n';
        }
        return;
      }

      if (line.startsWith('|')) {
        if (!currentChunk || currentChunk.type !== 'table') {
          if (currentChunk) {
            currentChunk.endLine = lineNum - 1;
            chunks.push(currentChunk as DocumentChunk);
          }
          currentChunk = {
            id: generateId(),
            fileName: this.fileName,
            content: line + '\n',
            startLine: lineNum,
            type: 'table',
            metadata: {},
          };
        } else {
          currentChunk.content += line + '\n';
        }
        return;
      }

      if (line.startsWith('>')) {
        if (!currentChunk || currentChunk.type !== 'quote') {
          if (currentChunk) {
            currentChunk.endLine = lineNum - 1;
            chunks.push(currentChunk as DocumentChunk);
          }
          currentChunk = {
            id: generateId(),
            fileName: this.fileName,
            content: line + '\n',
            startLine: lineNum,
            type: 'quote',
            metadata: {},
          };
        } else {
          currentChunk.content += line + '\n';
        }
        return;
      }

      if (line.trim()) {
        if (!currentChunk || currentChunk.type !== 'paragraph') {
          if (currentChunk) {
            currentChunk.endLine = lineNum - 1;
            chunks.push(currentChunk as DocumentChunk);
          }
          currentChunk = {
            id: generateId(),
            fileName: this.fileName,
            content: line + '\n',
            startLine: lineNum,
            type: 'paragraph',
            metadata: {},
          };
        } else {
          currentChunk.content += line + '\n';
        }
        return;
      }

      if (currentChunk) {
        currentChunk.endLine = lineNum - 1;
        chunks.push(currentChunk as DocumentChunk);
        currentChunk = null;
      }
    });

    if (currentChunk) {
      currentChunk.endLine = this.lines.length;
      chunks.push(currentChunk as DocumentChunk);
    }

    return chunks;
  }

  private extractHeadings(): HeadingInfo[] {
    const headings: HeadingInfo[] = [];
    const stack: HeadingInfo[] = [];

    this.lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const heading: HeadingInfo = {
          level,
          text: match[2],
          line: index + 1,
          id: generateId(),
          children: [],
        };

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length > 0) {
          heading.parent = stack[stack.length - 1].id;
          stack[stack.length - 1].children.push(heading.id);
        }

        headings.push(heading);
        stack.push(heading);
      }
    });

    return headings;
  }

  private extractCodeBlocks(): CodeBlockInfo[] {
    const blocks: CodeBlockInfo[] = [];
    let inBlock = false;
    let currentBlock: Partial<CodeBlockInfo> | null = null;

    this.lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (!inBlock) {
          inBlock = true;
          currentBlock = {
            language: line.slice(3).trim() || 'text',
            code: '',
            line: index + 1,
            id: generateId(),
          };
        } else {
          inBlock = false;
          if (currentBlock) {
            blocks.push(currentBlock as CodeBlockInfo);
            currentBlock = null;
          }
        }
      } else if (inBlock && currentBlock) {
        currentBlock.code += line + '\n';
      }
    });

    return blocks;
  }

  private extractLinks(): LinkInfo[] {
    const links: LinkInfo[] = [];
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

    this.lines.forEach((line, index) => {
      let match;
      while ((match = linkPattern.exec(line)) !== null) {
        const url = match[2];
        links.push({
          text: match[1],
          url,
          line: index + 1,
          type: url.startsWith('http') ? 'external' : url.startsWith('#') ? 'internal' : 'image',
        });
      }
    });

    return links;
  }

  private extractLists(): ListInfo[] {
    const lists: ListInfo[] = [];
    let currentList: ListInfo | null = null;

    this.lines.forEach((line, index) => {
      const ulMatch = line.match(/^[\*\-\+]\s+(.+)$/);
      const olMatch = line.match(/^\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (!currentList || currentList.type !== 'unordered') {
          if (currentList) lists.push(currentList);
          currentList = { type: 'unordered', items: [ulMatch[1]], line: index + 1 };
        } else {
          currentList.items.push(ulMatch[1]);
        }
      } else if (olMatch) {
        if (!currentList || currentList.type !== 'ordered') {
          if (currentList) lists.push(currentList);
          currentList = { type: 'ordered', items: [olMatch[1]], line: index + 1 };
        } else {
          currentList.items.push(olMatch[1]);
        }
      } else if (currentList && !line.trim()) {
        lists.push(currentList);
        currentList = null;
      }
    });

    if (currentList) lists.push(currentList);
    return lists;
  }

  // ========================================
  // ENHANCED: Authority Model Extraction
  // ========================================
  private extractAuthorityModel(): AuthorityModel {
    const roles: AuthorityRole[] = [];
    const permissions: Permission[] = [];
    const boundaries: AuthorityBoundary[] = [];
    const escalationPaths: EscalationPath[] = [];

    // Extract roles and permission levels
    const rolePatterns = [
      /(?:role|user type|actor):\s*["']?(\w+)["']?/gi,
      /\b(\w+)\s+(?:has|with|possesses)\s+(?:permission|authority|access)\b/gi,
      /(?:admin|administrator|user|guest|system|agent|supervisor|manager)\s*(?:\s+(\w+))?/gi,
    ];

    let roleLevel = 0;
    rolePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const roleName = match[1] || match[0];
        if (roleName && roleName.length > 2) {
          roles.push({
            id: generateId(),
            name: roleName,
            level: roleLevel++,
            permissions: [],
            location: `${this.fileName}:${this.getLineNumber(match.index)}`,
            fileName: this.fileName,
          });
        }
      }
    });

    // Extract permissions
    const permissionPatterns = [
      /(?:can|may|allowed to|permitted to|authorized to)\s+(\w+)\s+(?:on|in|to|access|modify|read|write|delete|create)\s+(\w+)/gi,
      /(?:permission|access rights?|privileges?):\s*(\w+)\s*(?:on|for|→|->)\s*(\w+)/gi,
      /\b(read|write|delete|create|update|execute|access)\s+(?:access|permission|rights?)?\s*(?:on|for|to)?\s*(\w+)/gi,
    ];

    permissionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        permissions.push({
          id: generateId(),
          action: match[1],
          resource: match[2] || 'all',
          conditions: [],
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    // Extract authority boundaries
    const boundaryPatterns = [
      /(?:boundary|limit|constraint|restriction):\s*(.+?)(?:\.|,|;)/gi,
      /(?:cannot|must not|forbidden|prohibited)\s+(.+?)(?:\.|,|;)/gi,
      /(?:only|exclusively)\s+(\w+)\s+(?:can|may)\s+(.+?)(?:\.|,|;)/gi,
      /(?:no\s+(\w+)\s+(?:can|may|should|shall)\s+(.+?))(?:\.|,|;)/gi,
    ];

    boundaryPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        boundaries.push({
          id: generateId(),
          type: match[0].includes('cannot') || match[0].includes('must not') ? 'hard' : 'soft',
          description: match[1] || match[0],
          allowedRoles: [],
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    // Extract escalation paths
    const escalationPatterns = [
      /(?:escalate|escalation)\s*(?:from)?\s*(\w+)\s*(?:to)\s*(\w+)(?:\s+(?:when|if|on)\s+(.+?))?(?:\.|,|;)/gi,
      /(?:promote|elevate|upgrade)\s*(\w+)\s*(?:to)\s*(\w+)/gi,
      /(?:fallback|override)\s*(?:to)\s*(\w+)(?:\s+by\s+(\w+))?/gi,
    ];

    escalationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        escalationPaths.push({
          id: generateId(),
          from: match[1] || '',
          to: match[2] || '',
          trigger: match[3] || 'unspecified',
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    return { roles, permissions, boundaries, escalationPaths };
  }

  // ========================================
  // ENHANCED: Invariant Extraction
  // ========================================
  private extractInvariants(): InvariantSet {
    const invariants: Invariant[] = [];
    const preconditions: Precondition[] = [];
    const postconditions: Postcondition[] = [];
    const safetyProperties: SafetyProperty[] = [];

    // Extract invariants
    const invariantPatterns = [
      /(?:invariant|always|never|must always|must never):\s*(.+?)(?:\.|,|;)/gi,
      /\b(?:always|never)\s+(?:be\s+)?(.+?)(?:\.|,|;)/gi,
      /(?:safety property|guarantee):\s*(.+?)(?:\.|,|;)/gi,
      /\b(?:ensure|guarantee|maintain)\s+(?:that\s+)?(.+?)(?:\.|,|;)/gi,
      /(?:for all|∀)\s+(\w+)\s*,\s*(.+?)(?:\.|,|;)/gi,
    ];

    invariantPatterns.forEach((pattern, idx) => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const expression = match[1] || match[2] || match[0];
        invariants.push({
          id: generateId(),
          expression: expression.trim(),
          type: idx < 2 ? 'safety' : idx < 4 ? 'liveness' : 'integrity',
          scope: 'global',
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    // Extract preconditions
    const preconditionPatterns = [
      /(?:precondition|pre-condition|requires?|before)\s*(?::|-)?\s*(.+?)(?:\.|,|;)/gi,
      /(?:requires?|needs?|must have)\s+(?:that\s+)?(.+?)(?:\.|,|;)/gi,
      /(?:if|when)\s+(.+?),\s*(?:then\s+)?(.+?)(?:can|may|will)/gi,
      /(?:before)\s+(.+?),\s*(.+?)(?:must|should)/gi,
    ];

    preconditionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        preconditions.push({
          id: generateId(),
          operation: 'unspecified',
          condition: (match[1] || match[0]).trim(),
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    // Extract postconditions
    const postconditionPatterns = [
      /(?:postcondition|post-condition|ensures?|after|guarantees?)\s*(?::|-)?\s*(.+?)(?:\.|,|;)/gi,
      /(?:returns?|results? in|yields?)\s+(.+?)(?:\.|,|;)/gi,
      /(?:after)\s+(.+?),\s*(.+?)(?:must|should|will)/gi,
    ];

    postconditionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        postconditions.push({
          id: generateId(),
          operation: 'unspecified',
          condition: (match[1] || match[0]).trim(),
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    // Extract safety properties
    const safetyPatterns = [
      /(?:safe|safety|secure|security):\s*(.+?)(?:\.|,|;)/gi,
      /(?:protect|prevent|avoid)\s+(.+?)(?:\.|,|;)/gi,
      /(?:no\s+(?:data\s+)?leak|no\s+unauthorized|no\s+escalation)/gi,
    ];

    safetyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        safetyProperties.push({
          id: generateId(),
          property: match[1] || match[0],
          enforcedBy: [],
          location: `${this.fileName}:${this.getLineNumber(match.index)}`,
          fileName: this.fileName,
        });
      }
    });

    return { invariants, preconditions, postconditions, safetyProperties };
  }

  private buildGraph(
    chunks: DocumentChunk[],
    headings: HeadingInfo[],
    codeBlocks: CodeBlockInfo[],
    links: LinkInfo[]
  ): DocumentGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const claims: Claim[] = [];
    const definitions: Definition[] = [];
    const references: Reference[] = [];
    const entities: Entity[] = [];
    const stateMutations: StateMutation[] = [];
    const executionPaths: ExecutionPath[] = [];
    const governanceCheckpoints: GovernanceCheckpoint[] = [];

    // Create nodes from chunks
    chunks.forEach(chunk => {
      nodes.push({
        id: chunk.id,
        type: chunk.type === 'heading' ? 'section' : 
              chunk.type === 'code' ? 'code' : 'claim',
        label: chunk.type === 'heading' ? chunk.content : 
               chunk.content.slice(0, 50) + '...',
        content: chunk.content,
        location: `${this.fileName}:${chunk.startLine}-${chunk.endLine}`,
        fileName: this.fileName,
      });

      // Extract claims from paragraphs
      if (chunk.type === 'paragraph') {
        const sentences = chunk.content.split(/[.!?]+/).filter(s => s.trim());
        sentences.forEach(sentence => {
          if (this.isClaim(sentence)) {
            claims.push({
              id: generateId(),
              text: sentence.trim(),
              location: `${this.fileName}:${chunk.startLine}`,
              fileName: this.fileName,
              type: this.classifyClaimType(sentence),
              confidence: 0.7,
            });
          }
        });
      }

      // ENHANCED: Extract state mutations with more patterns
      if (chunk.type === 'paragraph' || chunk.type === 'list') {
        const mutationPatterns = [
          // Direct transitions
          /(.+?)\s+(?:transitions?|changes?|moves?|updates?|switches?)\s+(?:from\s+)?(.+?)\s+(?:to|into)\s+(.+)/gi,
          // State definitions
          /(?:state|status)\s+["']?(\w+)["']?\s*(?::|=|→|->|transitions to)\s*["']?(\w+)["']?/gi,
          // Conditional transitions
          /(?:when|if|after)\s+(.+?),\s*(.+?)\s+(?:transitions?|changes?|becomes?)\s+(?:to\s+)?(.+)/gi,
          // Event-driven
          /(?:on|upon|triggered by)\s+(.+?),\s*(.+?)\s+→\s+(.+)/gi,
          // Workflow steps
          /(\w+)\s*->\s*(\w+)\s*(?:->\s*(\w+))?/gi,
        ];

        mutationPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(chunk.content)) !== null) {
            const source = match[1]?.trim() || '';
            const target = match[2]?.trim() || match[3]?.trim() || '';
            
            if (source && target && source !== target) {
              stateMutations.push({
                id: generateId(),
                source,
                target,
                preconditions: match[0].includes('if') || match[0].includes('when') ? [match[1]] : [],
                postconditions: [],
                authority: this.extractAuthority(match[0]),
                location: `${this.fileName}:${chunk.startLine}`,
                fileName: this.fileName,
              });
            }
          }
        });
      }

      // ENHANCED: Extract governance checkpoints
      if (chunk.type === 'paragraph' || chunk.type === 'list') {
        const govPatterns = [
          // Validation requirements
          /(?:must|should|shall|required|mandatory)\s+(?:be\s+)?(.+?)(?:\.|before|after|during|,)/gi,
          // Checkpoints
          /(?:checkpoint|gate|validation|verification|audit)\s*(?::|-)?\s*(.+?)(?:\.|,|;)/gi,
          // Approvals
          /(?:approval|authorization|sign.?off)\s+(?:required\s+)?(?:for\s+)?(.+?)(?:\.|,|;)/gi,
          // Enforcement
          /(?:enforce|enforced|enforcement)\s*(?::|-)?\s*(.+?)(?:\.|,|;)/gi,
          // Reviews
          /(?:review|reviewed|inspected)\s+(?:by\s+)?(.+?)(?:\.|,|;)/gi,
          // Constraints
          /(?:constraint|limit|restriction):\s*(.+?)(?:\.|,|;)/gi,
        ];

        const govTypes: ('validation' | 'authorization' | 'audit' | 'enforcement')[] = 
          ['validation', 'validation', 'authorization', 'enforcement', 'audit', 'enforcement'];

        govPatterns.forEach((pattern, typeIdx) => {
          let match;
          while ((match = pattern.exec(chunk.content)) !== null) {
            governanceCheckpoints.push({
              id: generateId(),
              type: govTypes[typeIdx] || 'validation',
              rule: match[1] || match[0],
              location: `${this.fileName}:${chunk.startLine}`,
              fileName: this.fileName,
            });
          }
        });
      }

      // Extract execution paths (workflows)
      if (chunk.type === 'list') {
        const items = chunk.content.split('\n').filter(l => l.trim());
        if (items.length >= 2) {
          // Extract invariants mentioned in workflow
          const invPattern = /(?:ensure|verify|check|validate|maintain)\s+(.+)/gi;
          const invariants: string[] = [];
          let invMatch;
          while ((invMatch = invPattern.exec(chunk.content)) !== null) {
            invariants.push(invMatch[1]);
          }

          // Extract governance points
          const govPattern = /(?:approval|review|sign.?off|checkpoint|gate)/gi;
          const govPoints = items
            .map((item, idx) => item.match(govPattern) ? idx.toString() : null)
            .filter(Boolean) as string[];

          executionPaths.push({
            id: generateId(),
            steps: items.map(item => 
              item.replace(/^[\*\-\+\d\.]\s*/, '').trim()
            ),
            invariants,
            governancePoints: govPoints,
            location: `${this.fileName}:${chunk.startLine}`,
            fileName: this.fileName,
          });
        }
      }
    });

    // Create edges from heading hierarchy
    headings.forEach(heading => {
      if (heading.parent) {
        edges.push({
          source: heading.parent,
          target: heading.id,
          type: 'contains',
          weight: 1,
        });
      }
    });

    // Create references from links
    links.forEach(link => {
      references.push({
        id: generateId(),
        text: link.text,
        target: link.url,
        location: `${this.fileName}:${link.line}`,
        fileName: this.fileName,
        type: link.type === 'internal' ? 'internal' : 
              link.type === 'external' ? 'external' : 'code',
      });
    });

    // Extract definitions
    const definitionPatterns = [
      /(\w[\w\s]+?)\s+is\s+(?:defined as\s+)?([^.]+)/gi,
      /(\w[\w\s]+?)\s+means\s+([^.]+)/gi,
      /(\w[\w\s]+?)\s+refers to\s+([^.]+)/gi,
      /(?:definition:?)\s*(\w[\w\s]+?)\s*[:=]\s*([^.]+)/gi,
      /(\w[\w\s]+?)\s*:\s+([^.]{10,})/gi,
    ];

    chunks.forEach(chunk => {
      if (chunk.type === 'paragraph' || chunk.type === 'list') {
        definitionPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(chunk.content)) !== null) {
            const term = match[1].trim();
            const definition = match[2].trim();
            if (term.length > 2 && definition.length > 5 && term.length < 50) {
              definitions.push({
                id: generateId(),
                term,
                definition,
                location: `${this.fileName}:${chunk.startLine}`,
                fileName: this.fileName,
              });
            }
          }
        });
      }
    });

    // ENHANCED: Extract entities with more types and patterns
    const entityPatterns = [
      // Agents and roles
      { pattern: /\b(agent|user|admin|administrator|system|service|actor|role|client|server)\s+["']?(\w+)["']?/gi, type: 'agent' as const },
      // Components and modules
      { pattern: /\b(component|module|service|API|endpoint|handler|controller|manager)\s+["']?(\w+)["']?/gi, type: 'component' as const },
      // States
      { pattern: /\b(state|status|phase|stage)\s+["']?(\w+)["']?/gi, type: 'state' as const },
      // Resources
      { pattern: /\b(resource|entity|data|store|database|table)\s+["']?(\w+)["']?/gi, type: 'resource' as const },
      // Boundaries
      { pattern: /\b(boundary|scope|context|domain|namespace)\s+["']?(\w+)["']?/gi, type: 'boundary' as const },
      // Authority
      { pattern: /\b(authority|permission|privilege|right)\s+["']?(\w+)["']?/gi, type: 'authority' as const },
    ];

    entityPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const entityName = match[2];
        if (!entityName || entityName.length < 2) continue;
        
        const existingEntity = entities.find(e => 
          e.name.toLowerCase() === entityName.toLowerCase() &&
          e.type === type
        );
        
        if (existingEntity) {
          existingEntity.mentions.push({
            text: match[0],
            location: `${this.fileName}:${this.getLineNumber(match.index)}`,
            fileName: this.fileName,
          });
        } else {
          entities.push({
            id: generateId(),
            name: entityName,
            type,
            mentions: [{
              text: match[0],
              location: `${this.fileName}:${this.getLineNumber(match.index)}`,
              fileName: this.fileName,
            }],
            attributes: { context: match[1] },
          });
        }
      }
    });

    return {
      nodes,
      edges,
      claims,
      definitions,
      references,
      entities,
      stateMutations,
      executionPaths,
      governanceCheckpoints,
    };
  }

  private extractAuthority(text: string): string {
    const patterns = [
      /by\s+(\w+)/i,
      /(\w+)\s+can/i,
      /authorized\s+by\s+(\w+)/i,
      /(\w+)\s+permission/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return 'unspecified';
  }

  private getLineNumber(index: number): number {
    const textBefore = this.content.slice(0, index);
    return textBefore.split('\n').length;
  }

  private isClaim(sentence: string): boolean {
    const claimIndicators = [
      'is', 'are', 'was', 'were', 'will be', 'has been', 'have been',
      'must', 'should', 'can', 'cannot', 'will', 'would',
      'always', 'never', 'all', 'none', 'every', 'no',
      'proves', 'shows', 'demonstrates', 'indicates',
      'ensures', 'guarantees', 'maintains',
    ];

    const lowerSentence = sentence.toLowerCase();
    return claimIndicators.some(indicator => 
      lowerSentence.includes(` ${indicator} `) || 
      lowerSentence.startsWith(`${indicator} `)
    );
  }

  private classifyClaimType(sentence: string): 'fact' | 'opinion' | 'inference' | 'definition' {
    const lowerSentence = sentence.toLowerCase();

    if (lowerSentence.includes('i think') || lowerSentence.includes('i believe') || 
        lowerSentence.includes('in my opinion')) {
      return 'opinion';
    }
    if (lowerSentence.includes('therefore') || lowerSentence.includes('thus') || 
        lowerSentence.includes('consequently') || lowerSentence.includes('implies')) {
      return 'inference';
    }
    if (lowerSentence.includes(' is ') || lowerSentence.includes(' are ') || 
        lowerSentence.includes(' means ') || lowerSentence.includes('defined as')) {
      return 'definition';
    }
    return 'fact';
  }
}

// Multi-document parser
export function parseMultipleDocuments(
  documents: { name: string; content: string }[]
): Map<string, ParsedDocument> {
  const results = new Map<string, ParsedDocument>();

  documents.forEach(doc => {
    const parser = new MarkdownParser(doc.content, doc.name);
    results.set(doc.name, parser.parse());
  });

  return results;
}

// Build cross-document graph
export function buildCrossDocumentGraph(
  parsedDocs: Map<string, ParsedDocument>
): DocumentGraph {
  const combinedGraph: DocumentGraph = {
    nodes: [],
    edges: [],
    claims: [],
    definitions: [],
    references: [],
    entities: [],
    stateMutations: [],
    executionPaths: [],
    governanceCheckpoints: [],
  };

  parsedDocs.forEach((parsed) => {
    combinedGraph.nodes.push(...parsed.graph.nodes);
    combinedGraph.edges.push(...parsed.graph.edges);
    combinedGraph.claims.push(...parsed.graph.claims);
    combinedGraph.definitions.push(...parsed.graph.definitions);
    combinedGraph.references.push(...parsed.graph.references);
    combinedGraph.entities.push(...parsed.graph.entities);
    combinedGraph.stateMutations.push(...parsed.graph.stateMutations);
    combinedGraph.executionPaths.push(...parsed.graph.executionPaths);
    combinedGraph.governanceCheckpoints.push(...parsed.graph.governanceCheckpoints);
  });

  // Find cross-references between documents
  const definitions = combinedGraph.definitions;
  combinedGraph.claims.forEach(claim => {
    definitions.forEach(def => {
      if (claim.text.toLowerCase().includes(def.term.toLowerCase())) {
        combinedGraph.edges.push({
          source: claim.id,
          target: def.id,
          type: 'references',
          weight: 0.5,
        });
      }
    });
  });

  // Link state mutations to entities
  combinedGraph.stateMutations.forEach(mutation => {
    const sourceEntity = combinedGraph.entities.find(e => 
      e.name.toLowerCase() === mutation.source.toLowerCase()
    );
    const targetEntity = combinedGraph.entities.find(e => 
      e.name.toLowerCase() === mutation.target.toLowerCase()
    );
    
    if (sourceEntity && targetEntity) {
      combinedGraph.edges.push({
        source: sourceEntity.id,
        target: targetEntity.id,
        type: 'mutates_to',
        weight: 1,
      });
    }
  });

  // Link governance checkpoints to execution paths
  combinedGraph.executionPaths.forEach(path => {
    path.governancePoints.forEach(gp => {
      const checkpoint = combinedGraph.governanceCheckpoints.find(gc =>
        path.location === gc.location
      );
      if (checkpoint) {
        combinedGraph.edges.push({
          source: path.id,
          target: checkpoint.id,
          type: 'requires',
          weight: 1,
        });
      }
    });
  });

  return combinedGraph;
}

// Export combined authority model from all documents
export function buildCombinedAuthorityModel(
  parsedDocs: Map<string, ParsedDocument>
): AuthorityModel {
  const combined: AuthorityModel = {
    roles: [],
    permissions: [],
    boundaries: [],
    escalationPaths: [],
  };

  parsedDocs.forEach((parsed) => {
    combined.roles.push(...parsed.authorityModel.roles);
    combined.permissions.push(...parsed.authorityModel.permissions);
    combined.boundaries.push(...parsed.authorityModel.boundaries);
    combined.escalationPaths.push(...parsed.authorityModel.escalationPaths);
  });

  return combined;
}

// Export combined invariant set from all documents
export function buildCombinedInvariantSet(
  parsedDocs: Map<string, ParsedDocument>
): InvariantSet {
  const combined: InvariantSet = {
    invariants: [],
    preconditions: [],
    postconditions: [],
    safetyProperties: [],
  };

  parsedDocs.forEach((parsed) => {
    combined.invariants.push(...parsed.invariantSet.invariants);
    combined.preconditions.push(...parsed.invariantSet.preconditions);
    combined.postconditions.push(...parsed.invariantSet.postconditions);
    combined.safetyProperties.push(...parsed.invariantSet.safetyProperties);
  });

  return combined;
}
