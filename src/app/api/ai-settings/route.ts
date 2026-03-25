// AI Settings API Route
// Handles OpenAI-compatible configuration management

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  saveAISettings,
  validateAISettings,
  getActiveAISettings,
  getAllAISettings,
  getAIStatus,
} from '@/lib/ai/openai-client';

// GET - Retrieve AI settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await getAIStatus();
        return NextResponse.json(status);

      case 'active':
        const active = await getActiveAISettings();
        if (!active) {
          return NextResponse.json({ error: 'No active configuration' }, { status: 404 });
        }
        // Mask API key for security
        return NextResponse.json({
          ...active,
          apiKey: '••••••••' + active.apiKey.slice(-4),
        });

      case 'list':
        const all = await getAllAISettings();
        return NextResponse.json({ settings: all });

      default:
        const defaultStatus = await getAIStatus();
        return NextResponse.json(defaultStatus);
    }
  } catch (error) {
    console.error('[AI Settings API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update AI settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'save':
        // Validate required fields
        if (!data.baseUrl || !data.apiKey || !data.modelName) {
          return NextResponse.json(
            { error: 'Missing required fields: baseUrl, apiKey, modelName' },
            { status: 400 }
          );
        }

        // Normalize base URL
        let baseUrl = data.baseUrl.trim();
        if (!baseUrl.startsWith('http')) {
          baseUrl = 'https://' + baseUrl;
        }
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }

        const saved = await saveAISettings({
          name: data.name || 'default',
          displayName: data.displayName || null,
          baseUrl,
          apiKey: data.apiKey,
          modelName: data.modelName,
          maxTokens: data.maxTokens ?? 4096,
          temperature: data.temperature ?? 0.7,
          isActive: data.isActive ?? true,
        });

        // Mask API key in response
        return NextResponse.json({
          success: true,
          settings: {
            ...saved,
            apiKey: '••••••••' + saved.apiKey.slice(-4),
          },
        });

      case 'validate':
        if (!data.settingsId) {
          return NextResponse.json(
            { error: 'Missing settingsId' },
            { status: 400 }
          );
        }

        const validation = await validateAISettings(data.settingsId);
        return NextResponse.json(validation);

      case 'activate':
        if (!data.settingsId) {
          return NextResponse.json(
            { error: 'Missing settingsId' },
            { status: 400 }
          );
        }

        // Deactivate all others
        await db.aISettings.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        // Activate the specified one
        await db.aISettings.update({
          where: { id: data.settingsId },
          data: { isActive: true },
        });

        return NextResponse.json({ success: true });

      case 'delete':
        if (!data.settingsId) {
          return NextResponse.json(
            { error: 'Missing settingsId' },
            { status: 400 }
          );
        }

        await db.aISettings.delete({
          where: { id: data.settingsId },
        });

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[AI Settings API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
