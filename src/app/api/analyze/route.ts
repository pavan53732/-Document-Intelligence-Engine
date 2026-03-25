import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  metaAnalyzer, 
  CORE_AGENT_COUNT,
  ADVANCED_AGENT_COUNT,
  META_AGENT_COUNT,
  TOTAL_AGENT_COUNT_EXPORT,
  AGENT_NAMES,
} from '@/lib/agents/meta-analyzer';
import { parseMultipleDocuments, buildCrossDocumentGraph } from '@/lib/parsers/document-parser';
import { MemoryService, DocumentCacheService } from '@/lib/memory/memory-service';

interface MarkdownFile {
  name: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, files, sessionId } = body as { 
      action: string; 
      files?: MarkdownFile[]; 
      sessionId?: string;
    };

    if (action === 'createSession') {
      const session = await db.analysisSession.create({
        data: {
          name: `Analysis ${new Date().toISOString()}`,
          status: 'pending',
          fileCount: files?.length || 0,
        },
      });

      if (files && files.length > 0) {
        for (const file of files) {
          await db.analysisFile.create({
            data: {
              sessionId: session.id,
              filename: file.name,
              content: file.content,
              wordCount: file.content.split(/\s+/).filter(Boolean).length,
            },
          });
        }
      }

      return NextResponse.json({ sessionId: session.id });
    }

    if (action === 'analyze') {
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      const startTime = Date.now();

      if (sessionId) {
        await db.analysisSession.update({
          where: { id: sessionId },
          data: { status: 'analyzing' },
        });
      }

      // Step 1: Parse all documents with caching
      const parsedDocs = [];
      const uncachedFiles: MarkdownFile[] = [];
      const cachedResults: Map<string, Awaited<ReturnType<typeof DocumentCacheService.getCached>>> = new Map();
      
      // Check cache for each file
      for (const file of files) {
        const cached = await DocumentCacheService.getCached(file.content);
        if (cached) {
          cachedResults.set(file.name, cached);
        } else {
          uncachedFiles.push(file);
        }
      }

      // Parse uncached files
      const newlyParsed = parseMultipleDocuments(uncachedFiles);
      
      // Cache newly parsed documents
      for (let i = 0; i < uncachedFiles.length; i++) {
        await DocumentCacheService.cacheDocument(uncachedFiles[i].content, newlyParsed[i]);
      }

      // Combine cached and newly parsed results
      for (const file of files) {
        const cached = cachedResults.get(file.name);
        if (cached) {
          parsedDocs.push(cached);
        } else {
          const idx = uncachedFiles.findIndex(f => f.name === file.name);
          if (idx >= 0) {
            parsedDocs.push(newlyParsed[idx]);
          }
        }
      }
      
      // Step 2: Build cross-document knowledge graph
      const graph = buildCrossDocumentGraph(parsedDocs);

      // Step 3: Initialize all agents
      await metaAnalyzer.initializeAll();

      // Step 4: Run all agents in optimized parallel execution
      const agentResults = await metaAnalyzer.runAllAgentsOptimized(files, parsedDocs, graph);

      // Step 5: Cross-validate issues
      const { validated, uncertain, metaReport } = metaAnalyzer.crossValidateIssues(agentResults);
      const allIssues = [...validated, ...uncertain];

      // Step 6: Calculate scores
      const totalWords = files.reduce((sum, f) => 
        sum + f.content.split(/\s+/).filter(Boolean).length, 0
      );
      const summary = metaAnalyzer.buildSummary(allIssues, agentResults, totalWords);
      
      // Calculate layer scores
      const layerScores = metaAnalyzer.calculateLayerScores(allIssues);

      const analysisTime = Date.now() - startTime;

      // Step 7: Save issues to database with enhanced data
      if (sessionId) {
        for (const issue of allIssues) {
          await db.issue.create({
            data: {
              sessionId,
              type: issue.type,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
              location: issue.location,
              suggestion: issue.suggestion,
              layer: issue.layer,
              agentSource: issue.agentSource,
              confidence: issue.confidence,
            },
          });
        }

        await db.analysisSession.update({
          where: { id: sessionId },
          data: {
            status: 'completed',
            totalIssues: allIssues.length,
          },
        });

        // Record metrics to memory system
        await MemoryService.recordAnalysis(sessionId, {
          agentResults: agentResults.map(r => ({
            agentName: r.agentName,
            agentTier: r.agentTier,
            agentLayer: r.agentLayer,
            issueCount: r.issues.length,
            confidence: r.confidence,
            processingTime: r.processingTime,
            ruleBasedIssues: r.metadata?.ruleBasedIssues as number || 0,
            aiIssues: r.metadata?.aiIssues as number || r.issues.length,
          })),
          summary: {
            totalIssues: summary.totalIssues,
            critical: summary.critical,
            warning: summary.warning,
            info: summary.info,
            documentHealthScore: summary.documentHealthScore,
            executionSafetyScore: summary.executionSafetyScore,
            governanceScore: summary.governanceScore,
            determinismScore: summary.determinismScore,
            confidence: metaReport.overallConfidence,
          },
          analysisTime,
          wordCount: totalWords,
        });
      }

      // Step 8: Return comprehensive result with all scores
      return NextResponse.json({
        issues: allIssues,
        agentResults: agentResults.map(r => ({
          agentName: r.agentName,
          agentLayer: r.agentLayer,
          agentTier: r.agentTier,
          issueCount: r.issues.length,
          confidence: r.confidence,
          processingTime: r.processingTime,
        })),
        documentGraph: {
          nodeCount: graph.nodes.length,
          claimCount: graph.claims.length,
          definitionCount: graph.definitions.length,
          referenceCount: graph.references.length,
          entityCount: graph.entities.length,
          stateMutationCount: graph.stateMutations.length,
          executionPathCount: graph.executionPaths.length,
          governanceCheckpointCount: graph.governanceCheckpoints.length,
        },
        summary: {
          ...summary,
          layerScores,
          analysisTime,
        },
        metaCognition: metaReport,
        agentInfo: {
          totalAgents: TOTAL_AGENT_COUNT_EXPORT,
          coreAgents: CORE_AGENT_COUNT,
          advancedAgents: ADVANCED_AGENT_COUNT,
          metaAgents: META_AGENT_COUNT,
          agentNames: AGENT_NAMES,
        },
        // Additional extracted data for frontend
        extractedData: {
          entities: graph.entities.slice(0, 50).map(e => ({
            name: e.name,
            type: e.type,
            mentionCount: e.mentions.length,
          })),
          stateMutations: graph.stateMutations.slice(0, 20).map(m => ({
            source: m.source,
            target: m.target,
            authority: m.authority,
          })),
          executionPaths: graph.executionPaths.slice(0, 10).map(p => ({
            stepCount: p.steps.length,
            invariants: p.invariants.length,
            governancePoints: p.governancePoints.length,
          })),
          governanceCheckpoints: graph.governanceCheckpoints.slice(0, 15).map(g => ({
            type: g.type,
            rule: g.rule.slice(0, 100),
          })),
        },
        // Cache info
        cacheInfo: {
          cachedFiles: cachedResults.size,
          newlyParsed: uncachedFiles.length,
        },
      });
    }

    // New action: Get memory dashboard data
    if (action === 'getMemoryDashboard') {
      const dashboardData = await MemoryService.getDashboardData();
      return NextResponse.json(dashboardData);
    }

    // New action: Get agent performance
    if (action === 'getAgentPerformance') {
      const performance = await MemoryService.agents.getAgentPerformance();
      return NextResponse.json({ agents: performance });
    }

    // New action: Get historical stats
    if (action === 'getHistoricalStats') {
      const stats = await MemoryService.stats.getOverallStats();
      const dailyStats = await MemoryService.stats.getDailyStats(30);
      return NextResponse.json({ stats, dailyStats });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const action = searchParams.get('action');

  // Get memory dashboard
  if (action === 'memoryDashboard') {
    const dashboardData = await MemoryService.getDashboardData();
    return NextResponse.json(dashboardData);
  }

  // Get agent performance
  if (action === 'agentPerformance') {
    const performance = await MemoryService.agents.getAgentPerformance();
    return NextResponse.json({ agents: performance });
  }

  // Get historical stats
  if (action === 'historicalStats') {
    const stats = await MemoryService.stats.getOverallStats();
    const dailyStats = await MemoryService.stats.getDailyStats(30);
    return NextResponse.json({ stats, dailyStats });
  }

  if (sessionId) {
    const session = await db.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        files: true,
        issues: true,
        agentMetrics: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  }

  const sessions = await db.analysisSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      status: true,
      fileCount: true,
      totalIssues: true,
      documentHealthScore: true,
      executionSafetyScore: true,
      governanceScore: true,
      determinismScore: true,
      createdAt: true,
    },
  });

  return NextResponse.json(sessions);
}
