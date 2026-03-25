/**
 * Memory Service - Analysis History & Agent Accuracy Tracking
 * 
 * Provides:
 * - Historical tracking of analyses
 * - Agent accuracy metrics
 * - Document caching for performance
 * - Statistical insights
 */

import { db } from '@/lib/db';
import crypto from 'crypto';
import type { ParsedDocument } from '@/lib/parsers/document-parser';

// ============================================
// Types
// ============================================

export interface AgentPerformanceRecord {
  agentName: string;
  agentTier: string;
  totalIssues: number;
  avgConfidence: number;
  avgProcessingTime: number;
  totalAnalyses: number;
  ruleBasedIssues: number;
  aiIssues: number;
  estimatedAccuracy: number;
}

export interface HistoricalStats {
  totalAnalyses: number;
  totalIssues: number;
  avgDocumentHealth: number;
  avgExecutionSafety: number;
  avgGovernance: number;
  avgDeterminism: number;
  avgConfidence: number;
  avgAnalysisTime: number;
  totalWordsProcessed: number;
  criticalRate: number;
  warningRate: number;
  infoRate: number;
}

export interface DailyStats {
  date: string;
  analyses: number;
  issues: number;
  avgHealth: number;
}

export interface CachedDocument {
  hash: string;
  parsedData: ParsedDocument;
  entityCount: number;
  claimCount: number;
  definitionCount: number;
  mutationCount: number;
  accessCount: number;
}

// ============================================
// Document Cache Service
// ============================================

export class DocumentCacheService {
  private static CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate SHA256 hash of content
   */
  static hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached document if exists and not expired
   */
  static async getCached(content: string): Promise<ParsedDocument | null> {
    const hash = this.hashContent(content);
    
    try {
      const cached = await db.documentCache.findUnique({
        where: { contentHash: hash }
      });

      if (!cached) return null;

      // Update access stats
      await db.documentCache.update({
        where: { contentHash: hash },
        data: {
          lastAccessed: new Date(),
          accessCount: { increment: 1 }
        }
      });

      return JSON.parse(cached.parsedData) as ParsedDocument;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Store parsed document in cache
   */
  static async cacheDocument(content: string, parsed: ParsedDocument): Promise<void> {
    const hash = this.hashContent(content);
    
    try {
      const entityCount = parsed.graph.entities?.length || 0;
      const claimCount = parsed.graph.claims?.length || 0;
      const definitionCount = parsed.graph.definitions?.length || 0;
      const mutationCount = parsed.graph.stateMutations?.length || 0;

      await db.documentCache.upsert({
        where: { contentHash: hash },
        update: {
          parsedData: JSON.stringify(parsed),
          entityCount,
          claimCount,
          definitionCount,
          mutationCount,
          lastAccessed: new Date(),
          accessCount: { increment: 1 }
        },
        create: {
          contentHash: hash,
          parsedData: JSON.stringify(parsed),
          entityCount,
          claimCount,
          definitionCount,
          mutationCount,
          accessCount: 1
        }
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - this.CACHE_TTL_MS);
    
    try {
      const result = await db.documentCache.deleteMany({
        where: {
          lastAccessed: { lt: cutoff }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    totalAccessCount: number;
    avgEntityCount: number;
  }> {
    try {
      const entries = await db.documentCache.aggregate({
        _count: { id: true },
        _sum: { accessCount: true, entityCount: true }
      });

      return {
        totalEntries: entries._count.id || 0,
        totalAccessCount: entries._sum.accessCount || 0,
        avgEntityCount: entries._count.id ? (entries._sum.entityCount || 0) / entries._count.id : 0
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { totalEntries: 0, totalAccessCount: 0, avgEntityCount: 0 };
    }
  }
}

// ============================================
// Agent Metrics Service
// ============================================

export class AgentMetricsService {
  /**
   * Record agent performance for a session
   */
  static async recordAgentMetrics(
    sessionId: string,
    agentResults: Array<{
      agentName: string;
      agentTier: 'core' | 'advanced' | 'meta';
      agentLayer: string;
      issueCount: number;
      confidence: number;
      processingTime: number;
      ruleBasedIssues?: number;
      aiIssues?: number;
    }>
  ): Promise<void> {
    try {
      await db.agentMetric.createMany({
        data: agentResults.map(agent => ({
          sessionId,
          agentName: agent.agentName,
          agentTier: agent.agentTier,
          agentLayer: agent.agentLayer,
          issueCount: agent.issueCount,
          confidence: agent.confidence,
          processingTime: agent.processingTime,
          ruleBasedIssues: agent.ruleBasedIssues || 0,
          aiIssues: agent.aiIssues || agent.issueCount
        }))
      });
    } catch (error) {
      console.error('Failed to record agent metrics:', error);
    }
  }

  /**
   * Get aggregated performance for all agents
   */
  static async getAgentPerformance(): Promise<AgentPerformanceRecord[]> {
    try {
      const metrics = await db.agentMetric.groupBy({
        by: ['agentName', 'agentTier'],
        _count: { id: true },
        _sum: { 
          issueCount: true, 
          confidence: true, 
          processingTime: true,
          ruleBasedIssues: true,
          aiIssues: true
        }
      });

      return metrics.map(m => ({
        agentName: m.agentName,
        agentTier: m.agentTier,
        totalIssues: m._sum.issueCount || 0,
        avgConfidence: m._count.id ? (m._sum.confidence || 0) / m._count.id : 0,
        avgProcessingTime: m._count.id ? (m._sum.processingTime || 0) / m._count.id : 0,
        totalAnalyses: m._count.id,
        ruleBasedIssues: m._sum.ruleBasedIssues || 0,
        aiIssues: m._sum.aiIssues || 0,
        // Estimated accuracy: higher rule-based ratio = higher confidence in accuracy
        estimatedAccuracy: m._sum.issueCount ? 
          Math.min(0.95, (m._sum.ruleBasedIssues || 0) / m._sum.issueCount * 0.5 + 0.5) : 0.5
      }));
    } catch (error) {
      console.error('Failed to get agent performance:', error);
      return [];
    }
  }

  /**
   * Get top performing agents by accuracy
   */
  static async getTopAgents(limit: number = 10): Promise<AgentPerformanceRecord[]> {
    const performance = await this.getAgentPerformance();
    return performance
      .sort((a, b) => b.estimatedAccuracy - a.estimatedAccuracy)
      .slice(0, limit);
  }

  /**
   * Get agent performance trends (last N sessions)
   */
  static async getAgentTrends(agentName: string, limit: number = 10): Promise<{
    sessionId: string;
    issueCount: number;
    confidence: number;
    processingTime: number;
  }[]> {
    try {
      const metrics = await db.agentMetric.findMany({
        where: { agentName },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          sessionId: true,
          issueCount: true,
          confidence: true,
          processingTime: true
        }
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get agent trends:', error);
      return [];
    }
  }
}

// ============================================
// Historical Statistics Service
// ============================================

export class HistoricalStatsService {
  /**
   * Update daily statistics
   */
  static async updateDailyStats(
    date: Date,
    analysisData: {
      issues: { critical: number; warning: number; info: number; total: number };
      scores: {
        documentHealth: number;
        executionSafety: number;
        governance: number;
        determinism: number;
        confidence: number;
      };
      analysisTime: number;
      wordCount: number;
    }
  ): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      // Get existing stats for the day
      const existing = await db.analysisStatistics.findUnique({
        where: { date: dateStr }
      });

      if (existing) {
        // Update with running average
        const newCount = existing.totalAnalyses + 1;
        await db.analysisStatistics.update({
          where: { date: dateStr },
          data: {
            totalAnalyses: newCount,
            totalIssues: existing.totalIssues + analysisData.issues.total,
            criticalIssues: existing.criticalIssues + analysisData.issues.critical,
            warningIssues: existing.warningIssues + analysisData.issues.warning,
            infoIssues: existing.infoIssues + analysisData.issues.info,
            avgDocumentHealth: (existing.avgDocumentHealth * existing.totalAnalyses + analysisData.scores.documentHealth) / newCount,
            avgExecutionSafety: (existing.avgExecutionSafety * existing.totalAnalyses + analysisData.scores.executionSafety) / newCount,
            avgGovernance: (existing.avgGovernance * existing.totalAnalyses + analysisData.scores.governance) / newCount,
            avgDeterminism: (existing.avgDeterminism * existing.totalAnalyses + analysisData.scores.determinism) / newCount,
            avgConfidence: (existing.avgConfidence * existing.totalAnalyses + analysisData.scores.confidence) / newCount,
            avgAnalysisTime: Math.round((existing.avgAnalysisTime * existing.totalAnalyses + analysisData.analysisTime) / newCount),
            totalWordsProcessed: existing.totalWordsProcessed + analysisData.wordCount
          }
        });
      } else {
        // Create new entry
        await db.analysisStatistics.create({
          data: {
            date: dateStr,
            totalAnalyses: 1,
            totalIssues: analysisData.issues.total,
            criticalIssues: analysisData.issues.critical,
            warningIssues: analysisData.issues.warning,
            infoIssues: analysisData.issues.info,
            avgDocumentHealth: analysisData.scores.documentHealth,
            avgExecutionSafety: analysisData.scores.executionSafety,
            avgGovernance: analysisData.scores.governance,
            avgDeterminism: analysisData.scores.determinism,
            avgConfidence: analysisData.scores.confidence,
            avgAnalysisTime: analysisData.analysisTime,
            totalWordsProcessed: analysisData.wordCount
          }
        });
      }
    } catch (error) {
      console.error('Failed to update daily stats:', error);
    }
  }

  /**
   * Get overall historical statistics
   */
  static async getOverallStats(): Promise<HistoricalStats> {
    try {
      const stats = await db.analysisStatistics.aggregate({
        _count: { id: true },
        _sum: {
          totalAnalyses: true,
          totalIssues: true,
          criticalIssues: true,
          warningIssues: true,
          infoIssues: true,
          totalWordsProcessed: true
        },
        _avg: {
          avgDocumentHealth: true,
          avgExecutionSafety: true,
          avgGovernance: true,
          avgDeterminism: true,
          avgConfidence: true,
          avgAnalysisTime: true
        }
      });

      const totalAnalyses = stats._sum.totalAnalyses || 0;
      const totalIssues = stats._sum.totalIssues || 0;

      return {
        totalAnalyses,
        totalIssues,
        avgDocumentHealth: stats._avg.avgDocumentHealth || 0,
        avgExecutionSafety: stats._avg.avgExecutionSafety || 0,
        avgGovernance: stats._avg.avgGovernance || 0,
        avgDeterminism: stats._avg.avgDeterminism || 0,
        avgConfidence: stats._avg.avgConfidence || 0,
        avgAnalysisTime: Math.round(stats._avg.avgAnalysisTime || 0),
        totalWordsProcessed: stats._sum.totalWordsProcessed || 0,
        criticalRate: totalIssues ? (stats._sum.criticalIssues || 0) / totalIssues : 0,
        warningRate: totalIssues ? (stats._sum.warningIssues || 0) / totalIssues : 0,
        infoRate: totalIssues ? (stats._sum.infoIssues || 0) / totalIssues : 0
      };
    } catch (error) {
      console.error('Failed to get overall stats:', error);
      return {
        totalAnalyses: 0,
        totalIssues: 0,
        avgDocumentHealth: 0,
        avgExecutionSafety: 0,
        avgGovernance: 0,
        avgDeterminism: 0,
        avgConfidence: 0,
        avgAnalysisTime: 0,
        totalWordsProcessed: 0,
        criticalRate: 0,
        warningRate: 0,
        infoRate: 0
      };
    }
  }

  /**
   * Get daily statistics for the last N days
   */
  static async getDailyStats(days: number = 30): Promise<DailyStats[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const stats = await db.analysisStatistics.findMany({
        where: {
          date: { gte: startDateStr }
        },
        orderBy: { date: 'asc' }
      });

      return stats.map(s => ({
        date: s.date,
        analyses: s.totalAnalyses,
        issues: s.totalIssues,
        avgHealth: s.avgDocumentHealth
      }));
    } catch (error) {
      console.error('Failed to get daily stats:', error);
      return [];
    }
  }

  /**
   * Get recent analysis sessions
   */
  static async getRecentSessions(limit: number = 10): Promise<{
    id: string;
    name: string;
    status: string;
    fileCount: number;
    totalIssues: number;
    documentHealthScore: number;
    createdAt: Date;
  }[]> {
    try {
      const sessions = await db.analysisSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          fileCount: true,
          totalIssues: true,
          documentHealthScore: true,
          createdAt: true
        }
      });

      return sessions;
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }
  }
}

// ============================================
// Memory Service - Unified Interface
// ============================================

export class MemoryService {
  static cache = DocumentCacheService;
  static agents = AgentMetricsService;
  static stats = HistoricalStatsService;

  /**
   * Record complete analysis result
   */
  static async recordAnalysis(
    sessionId: string,
    results: {
      agentResults: Array<{
        agentName: string;
        agentTier: 'core' | 'advanced' | 'meta';
        agentLayer: string;
        issueCount: number;
        confidence: number;
        processingTime: number;
        ruleBasedIssues?: number;
        aiIssues?: number;
      }>;
      summary: {
        totalIssues: number;
        critical: number;
        warning: number;
        info: number;
        documentHealthScore: number;
        executionSafetyScore: number;
        governanceScore: number;
        determinismScore: number;
        confidence: number;
      };
      analysisTime: number;
      wordCount: number;
    }
  ): Promise<void> {
    // Record agent metrics
    await AgentMetricsService.recordAgentMetrics(sessionId, results.agentResults);

    // Update daily statistics
    await HistoricalStatsService.updateDailyStats(new Date(), {
      issues: {
        total: results.summary.totalIssues,
        critical: results.summary.critical,
        warning: results.summary.warning,
        info: results.summary.info
      },
      scores: {
        documentHealth: results.summary.documentHealthScore,
        executionSafety: results.summary.executionSafetyScore,
        governance: results.summary.governanceScore,
        determinism: results.summary.determinismScore,
        confidence: results.summary.confidence
      },
      analysisTime: results.analysisTime,
      wordCount: results.wordCount
    });

    // Update session with scores
    await db.analysisSession.update({
      where: { id: sessionId },
      data: {
        documentHealthScore: results.summary.documentHealthScore,
        executionSafetyScore: results.summary.executionSafetyScore,
        governanceScore: results.summary.governanceScore,
        determinismScore: results.summary.determinismScore,
        overallConfidence: results.summary.confidence,
        analysisTime: results.analysisTime,
        wordCount: results.wordCount
      }
    });
  }

  /**
   * Get comprehensive memory dashboard data
   */
  static async getDashboardData(): Promise<{
    overallStats: HistoricalStats;
    recentSessions: Awaited<ReturnType<typeof HistoricalStatsService.getRecentSessions>>;
    topAgents: AgentPerformanceRecord[];
    dailyStats: DailyStats[];
    cacheStats: Awaited<ReturnType<typeof DocumentCacheService.getCacheStats>>;
  }> {
    const [overallStats, recentSessions, topAgents, dailyStats, cacheStats] = await Promise.all([
      HistoricalStatsService.getOverallStats(),
      HistoricalStatsService.getRecentSessions(5),
      AgentMetricsService.getTopAgents(5),
      HistoricalStatsService.getDailyStats(14),
      DocumentCacheService.getCacheStats()
    ]);

    return {
      overallStats,
      recentSessions,
      topAgents,
      dailyStats,
      cacheStats
    };
  }
}
