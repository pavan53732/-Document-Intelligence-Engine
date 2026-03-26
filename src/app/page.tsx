'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload, FileText, AlertTriangle, AlertCircle, Info, Brain, GitBranch, Layers,
  FileCode, Zap, CheckCircle2, XCircle, Loader2, Download, Trash2, ChevronRight,
  Sparkles, Shield, Activity, Search, Heart, Quote, MessageSquare, Settings,
  TimerIcon, Puzzle, Crosshair, BarChart3, Swords, Lock, RefreshCw, Target, Clock,
  Database, TrendingUp, Users, Box, ArrowRightLeft, Gauge, History, Cpu, Scale,
  FileCheck, AlertOctagon, ShieldCheck, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AISettingsModal, AIStatusIndicator } from '@/components/ai-settings-modal';

// ========================================
// COMPLETE TYPES - Matches Backend
// ========================================

type IssueLayer = 
  // BASE (1-10)
  | 'contradiction' | 'logical' | 'structural' | 'semantic' | 'factual'
  | 'functional' | 'temporal' | 'architectural' | 'completeness' | 'intent'
  // SYSTEM CORE (11-15)
  | 'execution_invariant' | 'authority_boundary' | 'deterministic' | 'governance' | 'psg_consistency'
  // FORMAL SYSTEM (16-28)
  | 'invariant_closure' | 'state_mutation' | 'authority_leak' | 'closed_world' | 'replay_fidelity'
  | 'multi_agent' | 'execution_psg_sync' | 'recovery' | 'concurrency' | 'boundary_enforcement'
  | 'simulation' | 'convergence' | 'semantic_execution'
  // POLICY ENGINE (29-32)
  | 'policy_enforcement' | 'rule_conflict' | 'audit_trail' | 'override_control'
  // FORMAL VERIFICATION (33-38)
  | 'invariant_enforcement' | 'determinism_audit' | 'spec_compliance' | 'ambiguity_resolution'
  | 'state_explosion' | 'formal_verification'
  // VALIDATION (39-42)
  | 'context_validation' | 'memory_integrity' | 'safety_validation' | 'performance_validation';

type IssueType = 
  // Base types
  | 'hallucination' | 'contradiction' | 'consistency' | 'structural' | 'logical' 
  | 'functional' | 'semantic' | 'temporal' | 'completeness' | 'intent' | 'quantitative'
  // System types
  | 'invariant_violation' | 'authority_breach' | 'nondeterminism' | 'governance_gap' | 'psg_integrity'
  // Formal types
  | 'invariant_bypass' | 'mutation_illegality' | 'privilege_escalation' | 'unknown_entity'
  | 'replay_divergence' | 'agent_conflict' | 'sync_violation' | 'recovery_failure' | 'race_condition'
  | 'enforcement_gap' | 'simulation_drift' | 'convergence_failure' | 'semantic_drift'
  // Policy Engine types
  | 'policy_violation' | 'rule_conflict' | 'audit_failure' | 'unauthorized_override'
  // Formal Verification types
  | 'invariant_failure' | 'determinism_failure' | 'spec_violation' | 'ambiguity_detected'
  | 'state_explosion_risk' | 'verification_failure'
  // Validation types
  | 'context_error' | 'memory_corruption' | 'safety_violation' | 'performance_degradation'
  // Other
  | 'adversarial' | 'meta';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface MarkdownFile {
  id: string;
  name: string;
  content: string;
  wordCount: number;
}

interface Issue {
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
}

interface AgentResult {
  agentName: string;
  agentLayer: IssueLayer;
  agentTier: 'core' | 'advanced' | 'meta' | 'policy' | 'formal' | 'validation';
  issueCount: number;
  confidence: number;
  processingTime: number;
}

interface ExtractedEntity {
  name: string;
  type: string;
  mentionCount: number;
}

interface StateMutation {
  source: string;
  target: string;
  authority: string;
}

interface GovernanceCheckpoint {
  type: string;
  rule: string;
}

interface AnalysisSummary {
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
  reasoningTraceScore: number;
  evidenceBindingScore: number;
  policyComplianceScore: number;
  crossLayerValidationScore: number;
  layerScores?: Record<IssueLayer, number>;
  analysisTime?: number;
}

interface MetaCognition {
  overallConfidence: number;
  agentAgreement: number;
  highConfidenceIssues: number;
  uncertainIssues: number;
  disagreementPoints: string[];
  recommendedReview: string[];
  layerScores?: Record<IssueLayer, number>;
}

interface AnalysisResult {
  sessionId: string;
  status: string;
  files: MarkdownFile[];
  issues: Issue[];
  agentResults: AgentResult[];
  summary: AnalysisSummary;
  metaCognition: MetaCognition;
  agentInfo: {
    totalAgents: number;
    coreAgents: number;
    advancedAgents: number;
    metaAgents: number;
    policyAgents: number;
    formalAgents: number;
    validationAgents: number;
    agentNames: string[];
  };
  extractedData?: {
    entities: ExtractedEntity[];
    stateMutations: StateMutation[];
    governanceCheckpoints: GovernanceCheckpoint[];
  };
  cacheInfo?: {
    cachedFiles: number;
    newlyParsed: number;
  };
}

// ========================================
// 42 LAYER CONFIGURATION
// ========================================

const ALL_42_LAYERS = [
  // BASE (1-10)
  { id: 'contradiction', name: 'Contradiction & Consistency', group: 'base', num: 1 },
  { id: 'logical', name: 'Logical Integrity', group: 'base', num: 2 },
  { id: 'structural', name: 'Structural & Organizational', group: 'base', num: 3 },
  { id: 'semantic', name: 'Semantic & Clarity', group: 'base', num: 4 },
  { id: 'factual', name: 'Factual & Evidence', group: 'base', num: 5 },
  { id: 'functional', name: 'Functional & Practical', group: 'base', num: 6 },
  { id: 'temporal', name: 'Temporal & State', group: 'base', num: 7 },
  { id: 'architectural', name: 'Architectural & System', group: 'base', num: 8 },
  { id: 'completeness', name: 'Completeness & Coverage', group: 'base', num: 9 },
  { id: 'intent', name: 'Intent & Goal Alignment', group: 'base', num: 10 },
  // SYSTEM CORE (11-15)
  { id: 'execution_invariant', name: 'Execution Invariant Safety', group: 'system', num: 11 },
  { id: 'authority_boundary', name: 'Authority Boundary Integrity', group: 'system', num: 12 },
  { id: 'deterministic', name: 'Deterministic Execution', group: 'system', num: 13 },
  { id: 'governance', name: 'Governance Enforcement', group: 'system', num: 14 },
  { id: 'psg_consistency', name: 'PSG Consistency', group: 'system', num: 15 },
  // FORMAL SYSTEM (16-28)
  { id: 'invariant_closure', name: 'Invariant Closure', group: 'formal', num: 16 },
  { id: 'state_mutation', name: 'State Mutation Legitimacy', group: 'formal', num: 17 },
  { id: 'authority_leak', name: 'Authority Leak Detection', group: 'formal', num: 18 },
  { id: 'closed_world', name: 'Closed-World Enforcement', group: 'formal', num: 19 },
  { id: 'replay_fidelity', name: 'Replay Fidelity', group: 'formal', num: 20 },
  { id: 'multi_agent', name: 'Multi-Agent Consistency', group: 'formal', num: 21 },
  { id: 'execution_psg_sync', name: 'Execution-PSG Sync', group: 'formal', num: 22 },
  { id: 'recovery', name: 'Recovery Semantics', group: 'formal', num: 23 },
  { id: 'concurrency', name: 'Concurrency Safety', group: 'formal', num: 24 },
  { id: 'boundary_enforcement', name: 'Boundary Enforcement', group: 'formal', num: 25 },
  { id: 'simulation', name: 'Simulation Soundness', group: 'formal', num: 26 },
  { id: 'convergence', name: 'Goal Convergence', group: 'formal', num: 27 },
  { id: 'semantic_execution', name: 'Semantic-Execution Alignment', group: 'formal', num: 28 },
  // POLICY ENGINE (29-32)
  { id: 'policy_enforcement', name: 'Policy Enforcement', group: 'policy', num: 29 },
  { id: 'rule_conflict', name: 'Rule Conflict Detection', group: 'policy', num: 30 },
  { id: 'audit_trail', name: 'Audit Trail Validation', group: 'policy', num: 31 },
  { id: 'override_control', name: 'Override Control', group: 'policy', num: 32 },
  // FORMAL VERIFICATION (33-38)
  { id: 'invariant_enforcement', name: 'Invariant Enforcement', group: 'verification', num: 33 },
  { id: 'determinism_audit', name: 'Determinism Audit', group: 'verification', num: 34 },
  { id: 'spec_compliance', name: 'Specification Compliance', group: 'verification', num: 35 },
  { id: 'ambiguity_resolution', name: 'Ambiguity Resolution', group: 'verification', num: 36 },
  { id: 'state_explosion', name: 'State Explosion Prevention', group: 'verification', num: 37 },
  { id: 'formal_verification', name: 'Formal Verification', group: 'verification', num: 38 },
  // VALIDATION (39-42)
  { id: 'context_validation', name: 'Context Validation', group: 'validation', num: 39 },
  { id: 'memory_integrity', name: 'Memory Integrity', group: 'validation', num: 40 },
  { id: 'safety_validation', name: 'Safety Validation', group: 'validation', num: 41 },
  { id: 'performance_validation', name: 'Performance Validation', group: 'validation', num: 42 },
];

const ISSUE_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  // Base types
  hallucination: { label: 'Hallucination', icon: '🎭', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  contradiction: { label: 'Contradiction', icon: '⚡', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  consistency: { label: 'Consistency', icon: '🔄', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  structural: { label: 'Structural', icon: '📐', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  logical: { label: 'Logical', icon: '💭', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  functional: { label: 'Functional', icon: '⚙️', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  semantic: { label: 'Semantic', icon: '💬', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  temporal: { label: 'Temporal', icon: '⏰', color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
  completeness: { label: 'Completeness', icon: '🧩', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  intent: { label: 'Intent', icon: '🎯', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  quantitative: { label: 'Quantitative', icon: '📊', color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  // System types
  invariant_violation: { label: 'Invariant Violation', icon: '🛡️', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  authority_breach: { label: 'Authority Breach', icon: '🔒', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  nondeterminism: { label: 'Nondeterminism', icon: '🎲', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  governance_gap: { label: 'Governance Gap', icon: '⚖️', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  race_condition: { label: 'Race Condition', icon: '⚡', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  // Policy Engine types
  policy_violation: { label: 'Policy Violation', icon: '📋', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  rule_conflict: { label: 'Rule Conflict', icon: '⚔️', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  audit_failure: { label: 'Audit Failure', icon: '📝', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  unauthorized_override: { label: 'Unauthorized Override', icon: '🚫', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  // Formal Verification types
  invariant_failure: { label: 'Invariant Failure', icon: '🔴', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  determinism_failure: { label: 'Determinism Failure', icon: '🌀', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  spec_violation: { label: 'Spec Violation', icon: '📄', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  ambiguity_detected: { label: 'Ambiguity Detected', icon: '❓', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  state_explosion_risk: { label: 'State Explosion Risk', icon: '💥', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  verification_failure: { label: 'Verification Failure', icon: '❌', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  // Validation types
  context_error: { label: 'Context Error', icon: '🔍', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  memory_corruption: { label: 'Memory Corruption', icon: '🧠', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  safety_violation: { label: 'Safety Violation', icon: '⚠️', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  performance_degradation: { label: 'Performance Degradation', icon: '📉', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  // Other
  adversarial: { label: 'Adversarial', icon: '⚔️', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
  meta: { label: 'Meta', icon: '🔮', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
};

const severityConfig = {
  critical: { label: 'Critical', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500' },
  high: { label: 'High', icon: AlertOctagon, color: 'text-orange-500', bgColor: 'bg-orange-500' },
  medium: { label: 'Medium', icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500' },
  low: { label: 'Low', icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-500' },
  info: { label: 'Info', icon: Info, color: 'text-gray-500', bgColor: 'bg-gray-500' },
};

const AGENT_ICONS: Record<string, typeof Brain> = {
  'Logic Checker': Brain,
  'Consistency Checker': Layers,
  'Contradiction Detector': GitBranch,
  'Structure Analyzer': FileCode,
  'Fact Checker': Search,
  'Semantic Analyzer': MessageSquare,
  'Functional Validator': Settings,
  'Temporal Analyzer': TimerIcon,
  'Completeness Checker': Puzzle,
  'Intent Validator': Crosshair,
  'Quantitative Checker': BarChart3,
  'Adversarial Analyzer': Swords,
  'Authority Boundary Analyzer': Lock,
  'Execution Invariant Validator': RefreshCw,
  'Governance Analyzer': Target,
  'Determinism Analyzer': RefreshCw,
  'Policy Enforcement Agent': Scale,
  'Rule Conflict Analyzer': FileCheck,
  'Audit Trail Validator': FileCheck,
  'Override Control Agent': ShieldCheck,
  'Invariant Enforcement Agent': ShieldCheck,
  'Determinism Auditor': RefreshCw,
  'Spec Compliance Checker': FileCheck,
  'Ambiguity Resolver': Crosshair,
  'State Explosion Analyzer': AlertTriangle,
  'Formal Verification Agent': CheckSquare,
  'Context Validator': Search,
  'Memory Integrity Agent': Database,
  'Safety Validator': Shield,
  'Performance Validator': Gauge,
  'default': Activity,
};

// ========================================
// MAIN COMPONENT
// ========================================

export default function MarkdownAnalyzerApp() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('issues');
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);

  // Check AI configuration status
  useEffect(() => {
    fetch('/api/ai-settings?action=status')
      .then(res => res.json())
      .then(data => setAiConfigured(data.hasValidSettings))
      .catch(console.error);
  }, [aiSettingsOpen]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.md') || file.name.endsWith('.markdown')
    );
    if (droppedFiles.length === 0) {
      setError('Please drop only Markdown files (.md or .markdown)');
      return;
    }
    processFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      file => file.name.endsWith('.md') || file.name.endsWith('.markdown')
    );
    if (selectedFiles.length > 0) processFiles(selectedFiles);
  };

  const processFiles = async (fileList: File[]) => {
    const processedFiles: MarkdownFile[] = [];
    for (const file of fileList) {
      const content = await file.text();
      processedFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        content,
        wordCount: content.split(/\s+/).filter(Boolean).length,
      });
    }
    setFiles(prev => [...prev, ...processedFiles]);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearFiles = () => { setFiles([]); setResult(null); setError(null); };

  const analyzeFiles = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      setProgressMessage('🔌 Creating analysis session...');
      setProgress(5);

      const sessionResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createSession',
          files: files.map(f => ({ name: f.name, content: f.content })),
        }),
      });

      if (!sessionResponse.ok) throw new Error('Failed to create session');
      const sessionData = await sessionResponse.json();

      setProgressMessage('📚 Parsing documents & building knowledge graph...');
      setProgress(15);

      // Show progress for all 55 agents (10 Core + 20 Advanced + 4 Policy + 7 Formal + 4 Validation + 4 Meta)
      const progressAgentCount = 55;
      for (let i = 0; i < progressAgentCount; i++) {
        setProgressMessage(`🤖 Running analysis agent ${i + 1}/${progressAgentCount}...`);
        setProgress(20 + (i / progressAgentCount) * 60);
        await new Promise(r => setTimeout(r, 50));
      }

      setProgressMessage('🔗 Cross-validating results...');
      setProgress(85);

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          sessionId: sessionData.sessionId,
          files: files.map(f => ({ name: f.name, content: f.content })),
        }),
      });

      if (!analyzeResponse.ok) throw new Error('Analysis failed');
      const analysisData = await analyzeResponse.json();

      setProgress(100);
      setProgressMessage('✅ Complete!');

      setResult({
        sessionId: sessionData.sessionId,
        status: 'completed',
        files,
        issues: analysisData.issues,
        agentResults: analysisData.agentResults,
        summary: analysisData.summary,
        metaCognition: analysisData.metaCognition,
        agentInfo: analysisData.agentInfo,
        extractedData: analysisData.extractedData,
        cacheInfo: analysisData.cacheInfo,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: result.summary,
      issues: result.issues,
      metaCognition: result.metaCognition,
      extractedData: result.extractedData,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredIssues = result?.issues.filter(issue => {
    if (filterType !== 'all' && issue.type !== filterType) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (filterAgent !== 'all' && issue.agentSource !== filterAgent) return false;
    return true;
  }) || [];

  const totalWords = files.reduce((sum, f) => sum + f.wordCount, 0);
  const getHealthColor = (score: number) => 
    score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  
  const getLayerColor = (group: string) => {
    switch (group) {
      case 'base': return 'from-blue-500/10 to-green-500/10';
      case 'system': return 'from-red-500/10 to-orange-500/10';
      case 'formal': return 'from-purple-500/10 to-indigo-500/10';
      case 'policy': return 'from-teal-500/10 to-cyan-500/10';
      case 'verification': return 'from-rose-500/10 to-pink-500/10';
      case 'validation': return 'from-emerald-500/10 to-lime-500/10';
      default: return 'from-gray-500/10 to-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-emerald-500/20">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                  Document Intelligence Engine
                </h1>
                <p className="text-xs text-muted-foreground">
                  {result?.agentInfo.totalAgents || 55} Agents • 42 Layers • Memory System Enabled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* AI Configuration Status */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiSettingsOpen(true)}
                className="gap-2"
              >
                {aiConfigured ? (
                  <>
                    <Cpu className="w-4 h-4 text-green-500" />
                    <span className="hidden sm:inline text-xs">AI Ready</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline text-xs">Setup AI</span>
                  </>
                )}
              </Button>
              {result && (
                <>
                  {result.cacheInfo && (
                    <Badge variant="outline" className="text-xs">
                      <Database className="w-3 h-3 mr-1" />
                      {result.cacheInfo.cachedFiles} cached
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {result.agentInfo.coreAgents} Core • {result.agentInfo.advancedAgents} Advanced • {result.agentInfo.policyAgents || 0} Policy • {result.agentInfo.formalAgents || 0} Formal • {result.agentInfo.validationAgents || 0} Validation • {result.agentInfo.metaAgents} Meta
                  </Badge>
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <Download className="w-4 h-4 mr-2" />Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearFiles}>
                    <Trash2 className="w-4 h-4 mr-2" />New
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 py-4">
        {!result ? (
          <div className="space-y-4">
            {/* Upload */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div
                  className={`relative flex flex-col items-center justify-center py-8 transition-all ${isDragging ? 'scale-105' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className={`absolute inset-0 rounded-xl transition-all ${isDragging ? 'bg-purple-500/10 border-2 border-purple-500' : 'bg-muted/50'}`} />
                  <div className="relative z-10 text-center">
                    <motion.div animate={{ y: isDragging ? -10 : 0 }} className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/20 mb-3">
                      <Upload className="w-8 h-8 text-purple-500" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-1">Drop Markdown Files Here</h3>
                    <p className="text-sm text-muted-foreground mb-3">or click to browse</p>
                    <label>
                      <input type="file" multiple accept=".md,.markdown" className="hidden" onChange={handleFileInput} />
                      <Button variant="outline" className="cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />Select Files
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {files.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Files ({files.length}) • {totalWords.toLocaleString()} words</CardTitle>
                    <Button variant="ghost" size="sm" onClick={clearFiles}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-1">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({file.wordCount.toLocaleString()} words)</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.id)}>
                          <XCircle className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {files.length > 0 && !isAnalyzing && (
              <div className="flex justify-center">
                <Button size="lg" className="px-8 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" onClick={analyzeFiles}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Run {result?.agentInfo.totalAgents || 55}-Agent Analysis
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{progressMessage}</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex flex-wrap justify-center gap-1 text-xs">
                      <Badge variant="outline" className="bg-blue-500/10">Core: 10</Badge>
                      <Badge variant="outline" className="bg-purple-500/10">Advanced: 20</Badge>
                      <Badge variant="outline" className="bg-teal-500/10">Policy: 4</Badge>
                      <Badge variant="outline" className="bg-rose-500/10">Formal: 7</Badge>
                      <Badge variant="outline" className="bg-emerald-500/10">Validation: 4</Badge>
                      <Badge variant="outline" className="bg-amber-500/10">Meta: 4</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info when no files */}
            {files.length === 0 && !isAnalyzing && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="bg-gradient-to-br from-blue-500/5 to-green-500/5">
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Activity className="w-4 h-4" /> BASE (1-10)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      contradiction, logical, structural, semantic, factual, functional, temporal, architectural, completeness, intent
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5">
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Lock className="w-4 h-4" /> SYSTEM (11-15)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      execution invariant, authority boundary, deterministic, governance, PSG consistency
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Target className="w-4 h-4" /> FORMAL (16-28)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      invariant closure, state mutation, authority leak, concurrency, simulation, convergence
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-500/5 to-cyan-500/5">
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Scale className="w-4 h-4" /> POLICY (29-32)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      policy enforcement, rule conflict, audit trail, override control
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500/5 to-pink-500/5">
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> VERIFICATION (33-38)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      invariant enforcement, determinism audit, spec compliance, ambiguity, state explosion, formal verification
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/5 to-lime-500/5">
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <CheckSquare className="w-4 h-4" /> VALIDATION (39-42)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      context validation, memory integrity, safety validation, performance validation
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            {/* Score Cards - 5 Severity Levels */}
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              <Card className="bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Document Health</p>
                  <p className={`text-2xl font-bold ${getHealthColor(result.summary.documentHealthScore)}`}>
                    {result.summary.documentHealthScore.toFixed(0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/10 to-transparent">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-500">{result.summary.critical}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">High</p>
                  <p className="text-2xl font-bold text-orange-500">{result.summary.high}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Medium</p>
                  <p className="text-2xl font-bold text-amber-500">{result.summary.medium}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-2xl font-bold text-blue-500">{result.summary.low}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-gray-500/10 to-transparent">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-gray-500">{result.summary.info}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Analysis Time</p>
                  <p className="text-2xl font-bold">{((result.summary.analysisTime || 0) / 1000).toFixed(1)}s</p>
                </CardContent>
              </Card>
            </div>

            {/* Special Scores with Gauges */}
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Execution Safety</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.executionSafetyScore)}`}>
                        {result.summary.executionSafetyScore.toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${result.summary.executionSafetyScore * 1.005} 100.5`}
                          className={result.summary.executionSafetyScore >= 80 ? 'text-green-500' : result.summary.executionSafetyScore >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <Lock className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.executionSafetyScore} className="h-1" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Governance</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.governanceScore)}`}>
                        {result.summary.governanceScore.toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${result.summary.governanceScore * 1.005} 100.5`}
                          className={result.summary.governanceScore >= 80 ? 'text-green-500' : result.summary.governanceScore >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <Target className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.governanceScore} className="h-1" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Determinism</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.determinismScore)}`}>
                        {result.summary.determinismScore.toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${result.summary.determinismScore * 1.005} 100.5`}
                          className={result.summary.determinismScore >= 80 ? 'text-green-500' : result.summary.determinismScore >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <RefreshCw className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.determinismScore} className="h-1" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Reasoning Trace</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.reasoningTraceScore || 100)}`}>
                        {(result.summary.reasoningTraceScore || 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${(result.summary.reasoningTraceScore || 100) * 1.005} 100.5`}
                          className={(result.summary.reasoningTraceScore || 100) >= 80 ? 'text-green-500' : (result.summary.reasoningTraceScore || 100) >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <GitBranch className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.reasoningTraceScore || 100} className="h-1" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-teal-500/5 to-cyan-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Evidence Binding</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.evidenceBindingScore || 100)}`}>
                        {(result.summary.evidenceBindingScore || 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${(result.summary.evidenceBindingScore || 100) * 1.005} 100.5`}
                          className={(result.summary.evidenceBindingScore || 100) >= 80 ? 'text-green-500' : (result.summary.evidenceBindingScore || 100) >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <Database className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.evidenceBindingScore || 100} className="h-1" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-rose-500/5 to-pink-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Policy Compliance</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.policyComplianceScore || 100)}`}>
                        {(result.summary.policyComplianceScore || 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${(result.summary.policyComplianceScore || 100) * 1.005} 100.5`}
                          className={(result.summary.policyComplianceScore || 100) >= 80 ? 'text-green-500' : (result.summary.policyComplianceScore || 100) >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <Scale className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.policyComplianceScore || 100} className="h-1" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/5 to-lime-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Cross-Layer</p>
                      <p className={`text-xl font-bold ${getHealthColor(result.summary.crossLayerValidationScore || 100)}`}>
                        {(result.summary.crossLayerValidationScore || 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle 
                          cx="20" cy="20" r="16" fill="none" 
                          stroke="currentColor" strokeWidth="3" 
                          strokeDasharray={`${(result.summary.crossLayerValidationScore || 100) * 1.005} 100.5`}
                          className={(result.summary.crossLayerValidationScore || 100) >= 80 ? 'text-green-500' : (result.summary.crossLayerValidationScore || 100) >= 60 ? 'text-amber-500' : 'text-red-500'}
                        />
                      </svg>
                      <Layers className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
                    </div>
                  </div>
                  <Progress value={result.summary.crossLayerValidationScore || 100} className="h-1" />
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8">
                <TabsTrigger value="issues" className="text-xs">Issues</TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">42 Layers</TabsTrigger>
                <TabsTrigger value="entities" className="text-xs">Entities</TabsTrigger>
                <TabsTrigger value="agents" className="text-xs">Agents</TabsTrigger>
                <TabsTrigger value="memory" className="text-xs">Memory</TabsTrigger>
              </TabsList>

              {/* Issues Tab */}
              <TabsContent value="issues" className="mt-2 space-y-2">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select className="px-2 py-1 text-xs rounded border bg-background" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">All Types</option>
                    {Object.entries(ISSUE_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select className="px-2 py-1 text-xs rounded border bg-background" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                    <option value="all">All Severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                  <select className="px-2 py-1 text-xs rounded border bg-background" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
                    <option value="all">All Agents</option>
                    {result.agentInfo.agentNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setFilterType('all'); setFilterSeverity('all'); setFilterAgent('all'); }}>Clear</Button>
                </div>

                {/* Issues List */}
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[280px]">
                      <div className="divide-y">
                        <AnimatePresence>
                          {filteredIssues.map((issue, i) => {
                            const config = ISSUE_TYPE_CONFIG[issue.type] || ISSUE_TYPE_CONFIG.meta;
                            const sev = severityConfig[issue.severity];
                            return (
                              <motion.div
                                key={issue.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                                className="p-3 hover:bg-muted/50 cursor-pointer"
                                onClick={() => setSelectedIssue(issue)}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg">{config.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <Badge variant="outline" className={`text-[10px] h-4 ${sev.color}`}>{sev.label}</Badge>
                                      <span className="text-[10px] text-muted-foreground">{config.label}</span>
                                      <span className="text-[10px] text-muted-foreground">• {issue.agentSource}</span>
                                    </div>
                                    <p className="text-sm font-medium">{issue.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{issue.description}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        {filteredIssues.length === 0 && (
                          <div className="p-8 text-center text-muted-foreground">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">No issues found!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 42 Layers Tab */}
              <TabsContent value="layers" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {/* BASE Layers */}
                  <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-500" /> BASE Layers (1-10)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="grid grid-cols-2 gap-1">
                        {ALL_42_LAYERS.filter(l => l.group === 'base').map(layer => {
                          const score = result.metaCognition.layerScores?.[layer.id as IssueLayer] ?? 
                                       result.summary.layerScores?.[layer.id as IssueLayer] ?? 100;
                          return (
                            <div key={layer.id} className="p-1.5 rounded bg-gradient-to-br from-blue-500/5 to-green-500/5">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] text-muted-foreground">L{layer.num}</span>
                                <span className={`text-[10px] font-bold ${getHealthColor(score)}`}>{score.toFixed(0)}</span>
                              </div>
                              <p className="text-[9px] font-medium truncate">{layer.name}</p>
                              <Progress value={score} className="h-0.5 mt-0.5" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* SYSTEM CORE Layers */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Lock className="w-3 h-3 text-red-500" /> SYSTEM CORE (11-15)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 space-y-1">
                      {ALL_42_LAYERS.filter(l => l.group === 'system').map(layer => {
                        const score = result.metaCognition.layerScores?.[layer.id as IssueLayer] ?? 
                                     result.summary.layerScores?.[layer.id as IssueLayer] ?? 100;
                        return (
                          <div key={layer.id} className="flex items-center gap-2 p-1 rounded bg-gradient-to-r from-red-500/5 to-orange-500/5">
                            <span className="text-[9px] text-muted-foreground w-5">L{layer.num}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-medium truncate">{layer.name}</p>
                            </div>
                            <Progress value={score} className="h-1 w-12" />
                            <span className={`text-[9px] font-bold w-5 text-right ${getHealthColor(score)}`}>{score.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* FORMAL SYSTEM Layers */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Target className="w-3 h-3 text-purple-500" /> FORMAL SYSTEM (16-28)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-1">
                          {ALL_42_LAYERS.filter(l => l.group === 'formal').map(layer => {
                            const score = result.metaCognition.layerScores?.[layer.id as IssueLayer] ?? 
                                         result.summary.layerScores?.[layer.id as IssueLayer] ?? 100;
                            return (
                              <div key={layer.id} className="flex items-center gap-2 p-1 rounded bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                                <span className="text-[9px] text-muted-foreground w-5">L{layer.num}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-medium truncate">{layer.name}</p>
                                </div>
                                <Progress value={score} className="h-1 w-10" />
                                <span className={`text-[9px] font-bold w-5 text-right ${getHealthColor(score)}`}>{score.toFixed(0)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* POLICY ENGINE Layers */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Scale className="w-3 h-3 text-teal-500" /> POLICY ENGINE (29-32)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 space-y-1">
                      {ALL_42_LAYERS.filter(l => l.group === 'policy').map(layer => {
                        const score = result.metaCognition.layerScores?.[layer.id as IssueLayer] ?? 
                                     result.summary.layerScores?.[layer.id as IssueLayer] ?? 100;
                        return (
                          <div key={layer.id} className="flex items-center gap-2 p-1 rounded bg-gradient-to-r from-teal-500/5 to-cyan-500/5">
                            <span className="text-[9px] text-muted-foreground w-5">L{layer.num}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-medium truncate">{layer.name}</p>
                            </div>
                            <Progress value={score} className="h-1 w-12" />
                            <span className={`text-[9px] font-bold w-5 text-right ${getHealthColor(score)}`}>{score.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* FORMAL VERIFICATION Layers */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-rose-500" /> FORMAL VERIFICATION (33-38)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-1">
                          {ALL_42_LAYERS.filter(l => l.group === 'verification').map(layer => {
                            const score = result.metaCognition.layerScores?.[layer.id as IssueLayer] ?? 
                                         result.summary.layerScores?.[layer.id as IssueLayer] ?? 100;
                            return (
                              <div key={layer.id} className="flex items-center gap-2 p-1 rounded bg-gradient-to-r from-rose-500/5 to-pink-500/5">
                                <span className="text-[9px] text-muted-foreground w-5">L{layer.num}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-medium truncate">{layer.name}</p>
                                </div>
                                <Progress value={score} className="h-1 w-10" />
                                <span className={`text-[9px] font-bold w-5 text-right ${getHealthColor(score)}`}>{score.toFixed(0)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* VALIDATION Layers */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <CheckSquare className="w-3 h-3 text-emerald-500" /> VALIDATION (39-42)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 space-y-1">
                      {ALL_42_LAYERS.filter(l => l.group === 'validation').map(layer => {
                        const score = result.metaCognition.layerScores?.[layer.id as IssueLayer] ?? 
                                     result.summary.layerScores?.[layer.id as IssueLayer] ?? 100;
                        return (
                          <div key={layer.id} className="flex items-center gap-2 p-1 rounded bg-gradient-to-r from-emerald-500/5 to-lime-500/5">
                            <span className="text-[9px] text-muted-foreground w-5">L{layer.num}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-medium truncate">{layer.name}</p>
                            </div>
                            <Progress value={score} className="h-1 w-12" />
                            <span className={`text-[9px] font-bold w-5 text-right ${getHealthColor(score)}`}>{score.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Entities Tab */}
              <TabsContent value="entities" className="mt-2 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Entities */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" /> Extracted Entities ({result.extractedData?.entities.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <ScrollArea className="h-[200px]">
                        {result.extractedData?.entities && result.extractedData.entities.length > 0 ? (
                          <div className="space-y-1">
                            {result.extractedData.entities.map((entity, i) => (
                              <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/30">
                                <Box className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-medium flex-1 truncate">{entity.name}</span>
                                <Badge variant="outline" className="text-[10px]">{entity.type}</Badge>
                                <span className="text-[10px] text-muted-foreground">×{entity.mentionCount}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4">No entities extracted</p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* State Mutations */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4" /> State Mutations ({result.extractedData?.stateMutations.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <ScrollArea className="h-[200px]">
                        {result.extractedData?.stateMutations && result.extractedData.stateMutations.length > 0 ? (
                          <div className="space-y-1">
                            {result.extractedData.stateMutations.map((mutation, i) => (
                              <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/30">
                                <span className="text-[10px] font-mono bg-blue-500/10 px-1 rounded">{mutation.source}</span>
                                <span className="text-[10px]">→</span>
                                <span className="text-[10px] font-mono bg-green-500/10 px-1 rounded">{mutation.target}</span>
                                {mutation.authority && (
                                  <Badge variant="outline" className="text-[10px]">{mutation.authority}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4">No state mutations detected</p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Governance Checkpoints */}
                  <Card className="md:col-span-2">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Governance Checkpoints ({result.extractedData?.governanceCheckpoints.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <ScrollArea className="h-[150px]">
                        {result.extractedData?.governanceCheckpoints && result.extractedData.governanceCheckpoints.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                            {result.extractedData.governanceCheckpoints.map((checkpoint, i) => (
                              <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/30">
                                <Badge variant="outline" className="text-[10px]">{checkpoint.type}</Badge>
                                <span className="text-[10px] truncate flex-1">{checkpoint.rule}...</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4">No governance checkpoints detected</p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Agents Tab */}
              <TabsContent value="agents" className="mt-2">
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Agent Performance ({result.agentResults.length} agents)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <ScrollArea className="h-[280px]">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                        {result.agentResults.map((agent) => {
                          const Icon = AGENT_ICONS[agent.agentName] || AGENT_ICONS['default'];
                          const tierColor = agent.agentTier === 'core' ? 'bg-blue-500/10 border-blue-500/30' : 
                                            agent.agentTier === 'advanced' ? 'bg-purple-500/10 border-purple-500/30' : 
                                            agent.agentTier === 'policy' ? 'bg-teal-500/10 border-teal-500/30' :
                                            agent.agentTier === 'formal' ? 'bg-rose-500/10 border-rose-500/30' :
                                            agent.agentTier === 'validation' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                            'bg-amber-500/10 border-amber-500/30';
                          return (
                            <div key={agent.agentName} className={`flex items-center gap-2 p-2 rounded border ${tierColor}`}>
                              <Icon className="w-4 h-4" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{agent.agentName}</p>
                                <div className="flex items-center gap-1">
                                  <Progress value={agent.confidence * 100} className="h-1 flex-1" />
                                  <span className="text-[10px]">{agent.issueCount} issues</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground">{agent.processingTime}ms</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Memory Tab */}
              <TabsContent value="memory" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Current Analysis Cache Info */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Database className="w-4 h-4" /> Current Analysis Cache
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-2xl font-bold text-blue-500">{result.cacheInfo?.cachedFiles || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Cached Files</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-2xl font-bold text-green-500">{result.cacheInfo?.newlyParsed || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Newly Parsed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analysis Metrics */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TimerIcon className="w-4 h-4" /> Analysis Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Analysis Time:</span>
                          <span className="font-medium">{((result.summary.analysisTime || 0) / 1000).toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Agents:</span>
                          <span className="font-medium">{result.agentInfo.totalAgents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Agent Tiers:</span>
                          <span className="font-medium">{result.agentInfo.coreAgents}C / {result.agentInfo.advancedAgents}A / {result.agentInfo.policyAgents || 0}P / {result.agentInfo.formalAgents || 0}F / {result.agentInfo.validationAgents || 0}V / {result.agentInfo.metaAgents}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Overall Confidence:</span>
                          <span className="font-medium">{(result.metaCognition.overallConfidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Graph Stats */}
                  <Card className="md:col-span-2">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Extracted Document Structure
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-lg font-bold">{result.extractedData?.entities?.length || 0}</p>
                          <p className="text-[9px] text-muted-foreground">Entities</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-lg font-bold">{result.extractedData?.stateMutations?.length || 0}</p>
                          <p className="text-[9px] text-muted-foreground">Mutations</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-lg font-bold">{result.extractedData?.governanceCheckpoints?.length || 0}</p>
                          <p className="text-[9px] text-muted-foreground">Checkpoints</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-lg font-bold">{totalWords.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">Words</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-lg font-bold">{result.issues.length}</p>
                          <p className="text-[9px] text-muted-foreground">Issues</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <p className="text-lg font-bold">{files.length}</p>
                          <p className="text-[9px] text-muted-foreground">Files</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Summary */}
                  <Card className="md:col-span-2">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Gauge className="w-4 h-4" /> Score Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                        <div className="p-2 rounded bg-gradient-to-r from-blue-500/10 to-green-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Doc Health</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.documentHealthScore)}`}>
                              {result.summary.documentHealthScore.toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.documentHealthScore} className="h-1 mt-1" />
                        </div>
                        <div className="p-2 rounded bg-gradient-to-r from-red-500/10 to-orange-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Exec Safety</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.executionSafetyScore)}`}>
                              {result.summary.executionSafetyScore.toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.executionSafetyScore} className="h-1 mt-1" />
                        </div>
                        <div className="p-2 rounded bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Governance</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.governanceScore)}`}>
                              {result.summary.governanceScore.toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.governanceScore} className="h-1 mt-1" />
                        </div>
                        <div className="p-2 rounded bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Determinism</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.determinismScore)}`}>
                              {result.summary.determinismScore.toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.determinismScore} className="h-1 mt-1" />
                        </div>
                        <div className="p-2 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Reasoning</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.reasoningTraceScore || 100)}`}>
                              {(result.summary.reasoningTraceScore || 100).toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.reasoningTraceScore || 100} className="h-1 mt-1" />
                        </div>
                        <div className="p-2 rounded bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Evidence</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.evidenceBindingScore || 100)}`}>
                              {(result.summary.evidenceBindingScore || 100).toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.evidenceBindingScore || 100} className="h-1 mt-1" />
                        </div>
                        <div className="p-2 rounded bg-gradient-to-r from-rose-500/10 to-pink-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Policy</span>
                            <span className={`text-sm font-bold ${getHealthColor(result.summary.policyComplianceScore || 100)}`}>
                              {(result.summary.policyComplianceScore || 100).toFixed(0)}
                            </span>
                          </div>
                          <Progress value={result.summary.policyComplianceScore || 100} className="h-1 mt-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Meta-Cognition */}
            <Card className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Brain className="w-4 h-4" /> Meta-Cognition Report
                </h3>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="ml-1 font-medium">{(result.metaCognition.overallConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agreement:</span>
                    <span className="ml-1 font-medium">{(result.metaCognition.agentAgreement * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">High Conf:</span>
                    <span className="ml-1 font-medium">{result.metaCognition.highConfidenceIssues}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uncertain:</span>
                    <span className="ml-1 font-medium">{result.metaCognition.uncertainIssues}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Issue Detail Dialog */}
      <AlertDialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              {selectedIssue && (
                <>
                  <span className="text-xl">{ISSUE_TYPE_CONFIG[selectedIssue.type]?.icon || '🔮'}</span>
                  {selectedIssue.title}
                </>
              )}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3 text-sm">
            {selectedIssue && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={severityConfig[selectedIssue.severity].color}>
                    {severityConfig[selectedIssue.severity].label}
                  </Badge>
                  <Badge variant="outline">{selectedIssue.agentSource}</Badge>
                  <span className="text-xs text-muted-foreground">{(selectedIssue.confidence * 100).toFixed(0)}% confidence</span>
                </div>
                <p className="text-muted-foreground">{selectedIssue.description}</p>
                {selectedIssue.location && (
                  <code className="block p-2 bg-muted rounded text-xs">{selectedIssue.location}</code>
                )}
                {selectedIssue.evidence && (
                  <div className="p-2 bg-muted rounded border-l-2 border-purple-500">
                    <Quote className="w-3 h-3 text-muted-foreground mb-1" />
                    <p className="text-xs italic">{selectedIssue.evidence}</p>
                  </div>
                )}
                {selectedIssue.suggestion && (
                  <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
                    💡 {selectedIssue.suggestion}
                  </div>
                )}
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Settings Modal */}
      <AISettingsModal
        open={aiSettingsOpen}
        onOpenChange={setAiSettingsOpen}
        onSettingsSaved={() => setAiConfigured(true)}
      />

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-2 text-center text-[10px] text-muted-foreground">
          <p>Document Intelligence Engine • 55 Agents (10 Core + 20 Advanced + 4 Policy + 7 Formal + 4 Validation + 4 Meta) • 42 Layers • Memory System</p>
        </div>
      </footer>
    </div>
  );
}
