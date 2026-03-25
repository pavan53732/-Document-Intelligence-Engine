// OpenAI-Compatible Client Utility
// Supports any OpenAI-compatible API (OpenAI, Azure, Ollama, LM Studio, Groq, Together, etc.)

import OpenAI from 'openai';
import { db } from '../db';

// Types for AI Settings
export interface AISettingsConfig {
  id: string;
  name: string;
  displayName: string | null;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  lastValidated: Date | null;
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationError: string | null;
  totalApiCalls: number;
  totalTokensUsed: number;
}

// Decryption key (in production, use proper encryption)
const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_KEY || 'doc-intel-ai-key-v1';

// Simple XOR encryption/decryption for API keys
function encryptApiKey(key: string): string {
  let result = '';
  for (let i = 0; i < key.length; i++) {
    result += String.fromCharCode(
      key.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return Buffer.from(result).toString('base64');
}

function decryptApiKey(encrypted: string): string {
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return result;
  } catch {
    return encrypted; // Return as-is if decryption fails
  }
}

// Get active AI settings
export async function getActiveAISettings(): Promise<AISettingsConfig | null> {
  const settings = await db.aISettings.findFirst({
    where: { isActive: true },
  });

  if (!settings) return null;

  return {
    ...settings,
    apiKey: decryptApiKey(settings.apiKey),
  };
}

// Get all AI settings (without decrypting API keys fully)
export async function getAllAISettings(): Promise<Omit<AISettingsConfig, 'apiKey'>[]> {
  const settings = await db.aISettings.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return settings.map(s => ({
    ...s,
    // Mask API key for display
    apiKey: s.apiKey ? '••••••••' + s.apiKey.slice(-4) : '',
  }));
}

// Create or update AI settings
export async function saveAISettings(
  config: Omit<AISettingsConfig, 'id' | 'createdAt' | 'updatedAt' | 'totalApiCalls' | 'totalTokensUsed' | 'lastValidated' | 'validationStatus' | 'validationError'>
): Promise<AISettingsConfig> {
  const encryptedKey = encryptApiKey(config.apiKey);

  // If this is set as active, deactivate others
  if (config.isActive) {
    await db.aISettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  const existing = await db.aISettings.findUnique({
    where: { name: config.name },
  });

  let settings;
  if (existing) {
    settings = await db.aISettings.update({
      where: { id: existing.id },
      data: {
        displayName: config.displayName,
        baseUrl: config.baseUrl,
        apiKey: encryptedKey,
        modelName: config.modelName,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        isActive: config.isActive,
        validationStatus: 'pending',
      },
    });
  } else {
    settings = await db.aISettings.create({
      data: {
        name: config.name,
        displayName: config.displayName,
        baseUrl: config.baseUrl,
        apiKey: encryptedKey,
        modelName: config.modelName,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        isActive: config.isActive,
      },
    });
  }

  return {
    ...settings,
    apiKey: config.apiKey, // Return unencrypted for confirmation
  };
}

// Validate AI settings by making a test call
export async function validateAISettings(settingsId: string): Promise<{
  valid: boolean;
  error?: string;
  models?: string[];
}> {
  const settings = await db.aISettings.findUnique({
    where: { id: settingsId },
  });

  if (!settings) {
    return { valid: false, error: 'Settings not found' };
  }

  const apiKey = decryptApiKey(settings.apiKey);

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: settings.baseUrl,
      dangerouslyAllowBrowser: false,
    });

    // Try to list models (validates API key and connection)
    let models: string[] = [];
    try {
      const modelsResponse = await client.models.list();
      models = modelsResponse.data.map(m => m.id).slice(0, 20);
    } catch {
      // Some APIs don't support models listing, try a simple completion
      models = [settings.modelName];
    }

    // Try a simple completion to validate the model
    const completion = await client.chat.completions.create({
      model: settings.modelName,
      messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
      max_tokens: 10,
    });

    if (completion.choices[0]?.message?.content) {
      // Update validation status
      await db.aISettings.update({
        where: { id: settingsId },
        data: {
          validationStatus: 'valid',
          lastValidated: new Date(),
          validationError: null,
        },
      });

      return { valid: true, models };
    }

    return { valid: false, error: 'No response from model' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await db.aISettings.update({
      where: { id: settingsId },
      data: {
        validationStatus: 'invalid',
        lastValidated: new Date(),
        validationError: errorMessage,
      },
    });

    return { valid: false, error: errorMessage };
  }
}

// Create OpenAI client from active settings
export async function createOpenAIClient(): Promise<{
  client: OpenAI;
  config: { model: string; maxTokens: number; temperature: number };
} | null> {
  const settings = await getActiveAISettings();

  if (!settings) {
    return null;
  }

  const client = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl,
    dangerouslyAllowBrowser: false,
  });

  // Update API call count
  await db.aISettings.update({
    where: { id: settings.id },
    data: { totalApiCalls: { increment: 1 } },
  });

  return {
    client,
    config: {
      model: settings.modelName,
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
    },
  };
}

// Track token usage
export async function trackTokenUsage(settingsId: string, tokens: number): Promise<void> {
  await db.aISettings.update({
    where: { id: settingsId },
    data: { totalTokensUsed: { increment: tokens } },
  });
}

// Call AI with active settings
export async function callAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<string | null> {
  const clientSetup = await createOpenAIClient();

  if (!clientSetup) {
    console.warn('[AI] No active AI settings configured');
    return null;
  }

  const { client, config } = clientSetup;

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages,
      max_tokens: options?.maxTokens ?? config.maxTokens,
      temperature: options?.temperature ?? config.temperature,
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    });

    // Track token usage
    if (completion.usage) {
      const settings = await db.aISettings.findFirst({ where: { isActive: true } });
      if (settings) {
        await trackTokenUsage(settings.id, completion.usage.total_tokens);
      }
    }

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('[AI] API call failed:', error);
    throw error;
  }
}

// Check if AI is configured
export async function isAIConfigured(): Promise<boolean> {
  const settings = await db.aISettings.findFirst({
    where: { 
      isActive: true,
      validationStatus: 'valid',
    },
  });
  return !!settings;
}

// Get AI configuration status
export async function getAIStatus(): Promise<{
  configured: boolean;
  hasValidSettings: boolean;
  activeConfig: {
    name: string;
    displayName: string | null;
    modelName: string;
    baseUrl: string;
    validationStatus: string;
    totalApiCalls: number;
    totalTokensUsed: number;
  } | null;
}> {
  const settings = await db.aISettings.findFirst({
    where: { isActive: true },
  });

  if (!settings) {
    return {
      configured: false,
      hasValidSettings: false,
      activeConfig: null,
    };
  }

  return {
    configured: true,
    hasValidSettings: settings.validationStatus === 'valid',
    activeConfig: {
      name: settings.name,
      displayName: settings.displayName,
      modelName: settings.modelName,
      baseUrl: settings.baseUrl,
      validationStatus: settings.validationStatus,
      totalApiCalls: settings.totalApiCalls,
      totalTokensUsed: settings.totalTokensUsed,
    },
  };
}
