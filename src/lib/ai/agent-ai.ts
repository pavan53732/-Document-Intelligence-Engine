// AI Service for Agents
// Provides OpenAI-compatible API access for all agents

import { callAI, isAIConfigured, getActiveAISettings, createOpenAIClient } from './openai-client';

// Check if AI is available
export async function isAIAvailable(): Promise<boolean> {
  return isAIConfigured();
}

// Get current model name
export async function getCurrentModel(): Promise<string | null> {
  const settings = await getActiveAISettings();
  return settings?.modelName || null;
}

// Simple chat completion for agents
export async function agentChat(
  prompt: string,
  systemPrompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  const result = await callAI(messages, options);
  return result || '';
}

// Parse JSON from AI response
export function parseAIJSON<T>(response: string): T[] {
  try {
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

// Get AI configuration info for display
export async function getAIInfo(): Promise<{
  configured: boolean;
  model: string | null;
  provider: string | null;
}> {
  const settings = await getActiveAISettings();
  
  if (!settings) {
    return {
      configured: false,
      model: null,
      provider: null,
    };
  }

  // Extract provider name from base URL
  let provider = 'Custom';
  if (settings.baseUrl.includes('openai.com')) {
    provider = 'OpenAI';
  } else if (settings.baseUrl.includes('azure')) {
    provider = 'Azure OpenAI';
  } else if (settings.baseUrl.includes('localhost:11434') || settings.baseUrl.includes('127.0.0.1:11434')) {
    provider = 'Ollama (Local)';
  } else if (settings.baseUrl.includes('localhost:1234') || settings.baseUrl.includes('127.0.0.1:1234')) {
    provider = 'LM Studio (Local)';
  } else if (settings.baseUrl.includes('groq')) {
    provider = 'Groq';
  } else if (settings.baseUrl.includes('together')) {
    provider = 'Together AI';
  } else if (settings.baseUrl.includes('anthropic')) {
    provider = 'Anthropic';
  }

  return {
    configured: true,
    model: settings.modelName,
    provider,
  };
}
