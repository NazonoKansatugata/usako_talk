import { CharacterBot } from './CharacterBot.js';
import { characters, botConfig, ttsConfig, voiceChannelConfig } from '../config/index.js';
import { CharacterType } from '../types/index.js';
import { OllamaClient } from '../ollama/client.js';
import { PromptBuilder } from '../llm/promptBuilder.js';
import { ConversationHistory } from '../conversation/history.js';

type IncomingUserMessage = {
  username: string;
  content: string;
  channelId: string;
};

/**
 * うさこトーク向けBot管理クラス
 */
export class BotManager {
  private bots: Map<CharacterType, CharacterBot> = new Map();
  private isRunning = false;
  private ollamaClient: OllamaClient;
  private conversationHistory: ConversationHistory;

  // ユーザー入力を順番に処理して応答取りこぼしを防ぐ
  private userMessageQueue: IncomingUserMessage[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.ollamaClient = new OllamaClient();
    this.conversationHistory = new ConversationHistory();
  }

  /**
   * うさこBotの初期化とログイン
   */
  async initialize(): Promise<void> {
    console.log('🚀 Botマネージャーを初期化中...');

    try {
      const usakoConfig = characters.find((c) => c.type === 'usako');
      if (!usakoConfig) {
        throw new Error('うさこのBot設定が見つかりません');
      }

      const usakoBot = new CharacterBot(usakoConfig);
      this.bots.set(usakoConfig.type, usakoBot);
      await usakoBot.login();

      this.isRunning = true;
      console.log('✅ うさこBotのログインが完了しました');

      await this.waitForAllBotsReady();
      console.log('✅ Botの準備が完了しました');

      console.log('🔌 Ollamaに接続中...');
      const isOllamaHealthy = await this.ollamaClient.healthCheck();
      if (!isOllamaHealthy) {
        console.warn('⚠️ Ollamaへの接続に失敗しました。LLM機能は使用できません。');
      } else {
        console.log('✅ Ollamaに接続しました');
      }

      usakoBot.setOnHumanMessage((username, content, channelId) => {
        this.enqueueHumanMessage({ username, content, channelId });
      });
      console.log('✅ 人間のメッセージハンドラーを設定しました');

      if (ttsConfig.enabled && voiceChannelConfig.enabled && voiceChannelConfig.channelId) {
        console.log('🔊 うさこBotを音声チャンネルに接続中...');
        await usakoBot.connectToVoiceChannel(botConfig.guildId, voiceChannelConfig.channelId);
        console.log('✅ うさこBotの音声チャンネル接続が完了しました');
      }
    } catch (error) {
      console.error('❌ Botの初期化に失敗しました:', error);
      await this.shutdown();
      throw error;
    }
  }

  private async waitForAllBotsReady(): Promise<void> {
    const maxWaitTime = 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const allReady = Array.from(this.bots.values()).every((bot) => bot.isClientReady());
      if (allReady) {
        return;
      }
      await this.sleep(500);
    }

    throw new Error('Botの準備がタイムアウトしました');
  }

  getBot(type: CharacterType): CharacterBot | undefined {
    return this.bots.get(type);
  }

  async sendMessage(characterType: CharacterType, content: string): Promise<void> {
    const bot = this.getBot(characterType);
    if (!bot) {
      console.error(`❌ Bot ${characterType} が見つかりません`);
      return;
    }

    const targetChannelId = voiceChannelConfig.channelId || botConfig.channelId;
    await bot.sendMessage(targetChannelId, content);
  }

  private enqueueHumanMessage(message: IncomingUserMessage): void {
    const targetChannelId = voiceChannelConfig.channelId || botConfig.channelId;
    if (message.channelId !== targetChannelId) {
      return;
    }

    const trimmedContent = message.content.trim();
    if (!trimmedContent) {
      return;
    }

    this.userMessageQueue.push({
      username: message.username,
      content: trimmedContent,
      channelId: message.channelId,
    });

    if (!this.isProcessingQueue) {
      this.processUserMessageQueue().catch((error) => {
        console.error('❌ ユーザー入力キュー処理に失敗:', error);
      });
    }
  }

  private async processUserMessageQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.userMessageQueue.length > 0 && this.isRunning) {
        const message = this.userMessageQueue.shift();
        if (!message) {
          continue;
        }

        await this.handleHumanMessage(message.username, message.content);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async handleHumanMessage(username: string, content: string): Promise<void> {
    console.log(`\n👤 メッセージ受信: ${username}: ${content}\n`);

    try {
      this.conversationHistory.addMessage('usako', `${username}: ${content}`, true);

      const recentMessages = this.conversationHistory.getRecent(12);
      const prompt = PromptBuilder.buildUserReplyPrompt('usako', recentMessages, username, content);
      const reply = await this.ollamaClient.generate(prompt);

      await this.sendMessage('usako', reply);
      this.conversationHistory.addMessage('usako', reply);

      if (ttsConfig.enabled && voiceChannelConfig.enabled) {
        const usakoBot = this.bots.get('usako');
        if (usakoBot) {
          await usakoBot.speak(reply, 'usako');
        }
      }
    } catch (error) {
      console.error('❌ ユーザー応答の生成に失敗:', error);
      await this.sendMessage('usako', 'ごめんね...うまく答えられなかった。もう一度送ってみて。');
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 全Botをシャットダウン中...');
    this.isRunning = false;
    this.userMessageQueue = [];

    for (const bot of this.bots.values()) {
      await bot.shutdown();
    }

    this.bots.clear();
    console.log('✅ 全Botのシャットダウンが完了しました');
  }

  isActive(): boolean {
    return this.isRunning;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
