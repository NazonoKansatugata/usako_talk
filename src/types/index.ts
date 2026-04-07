/**
 * キャラクターの種類
 */
export type CharacterType = 'usako' | 'nekoko' | 'keroko';

/**
 * キャラクター設定
 */
export interface CharacterConfig {
  name: string;
  type: CharacterType;
  token: string;
  displayName: string;
  description: string;
  personality: string;
}

/**
 * 会話メッセージ
 */
export interface ConversationMessage {
  id: string;
  characterType: CharacterType;
  content: string;
  timestamp: Date;
  isHuman: boolean;
}

/**
 * Bot設定
 */
export interface BotConfig {
  guildId: string;
  channelId: string;
}

/**
 * Ollama設定
 */
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  topP: number;
  repeatPenalty: number;
  maxTokens: number;
}

/**
 * LLM生成リクエスト
 */
export interface GenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    repeat_penalty?: number;
    num_predict?: number;
  };
}

/**
 * LLM生成レスポンス
 */
export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  thinking?: string;
  done: boolean;
  done_reason?: string;
}

/**
 * TTS設定
 */
export interface TTSConfig {
  apiUrl: string;
  enabled: boolean;
  speakerId: number;
}

/**
 * 音声プロファイル
 */
export interface VoiceProfile {
  speakerId?: number;
  pitch?: number;
  speed?: number;
}

/**
 * 音声チャンネル設定
 */
export interface VoiceChannelConfig {
  channelId: string;
  enabled: boolean;
}
