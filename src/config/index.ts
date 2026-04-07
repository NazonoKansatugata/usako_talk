import { config } from 'dotenv';
import { CharacterConfig, BotConfig, OllamaConfig, TTSConfig, VoiceChannelConfig } from '../types/index.js';

config();

/**
 * 環境変数の検証
 */
function validateEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}

/**
 * キャラクター設定
 */
export const characters: CharacterConfig[] = [
  {
    name: 'うさこ',
    type: 'usako',
    token: validateEnv('USAKO_BOT_TOKEN'),
    displayName: 'うさこ',
    description: '主人公・ミステリアス担当',
    personality: '無口気味で短文が多い。ミステリアスな雰囲気を持つ。',
  },
];

/**
 * Bot設定
 */
export const botConfig: BotConfig = {
  guildId: validateEnv('GUILD_ID'),
  channelId: validateEnv('CHANNEL_ID'),
};

/**
 * Ollama設定
 */
export const ollamaConfig: OllamaConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'qwen3.0',
  temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.8'),
  topP: parseFloat(process.env.OLLAMA_TOP_P || '0.9'),
  repeatPenalty: parseFloat(process.env.OLLAMA_REPEAT_PENALTY || '1.1'),
  maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '150'),
};

/**
 * TTS設定
 */
export const ttsConfig: TTSConfig = {
  apiUrl: process.env.TTS_API_URL || 'http://127.0.0.1:50021',
  enabled: process.env.TTS_ENABLED === 'true',
  speakerId: parseInt(process.env.VOICEVOX_SPEAKER_ID || '46'),
};

/**
 * 音声チャンネル設定
 */
export const voiceChannelConfig: VoiceChannelConfig = {
  channelId: process.env.VOICE_CHANNEL_ID || '',
  enabled: process.env.VOICE_CHANNEL_ENABLED === 'true',
};
