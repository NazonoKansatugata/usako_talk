import { VoiceProfile } from '../types/index.js';
import { Readable } from 'stream';
import { ttsConfig } from '../config/index.js';

/**
 * VOICEVOX クライアント
 * ローカルのVOICEVOX Engine HTTP APIを利用した音声合成
 */
export class TTSClient {
  private apiUrl: string;

  constructor() {
    this.apiUrl = ttsConfig.apiUrl;
  }

  /**
   * テキストを音声データに変換
   * @param text 読み上げるテキスト
   * @param voiceProfile 音声プロファイル
   * @returns 音声データのストリーム
   */
  async textToSpeech(text: string, voiceProfile: VoiceProfile): Promise<Readable> {
    const speakerId = voiceProfile.speakerId ?? ttsConfig.speakerId;
    const textTruncated = text.substring(0, 50);
    console.log(`🎤 VOICEVOX生成開始 [speaker:${speakerId}]: "${textTruncated}${text.length > 50 ? '...' : ''}"`);
    
    try {
      const audioQueryResponse = await fetch(
        `${this.apiUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
        { method: 'POST' }
      );

      if (!audioQueryResponse.ok) {
        throw new Error(`VOICEVOX audio_query error: ${audioQueryResponse.status} ${audioQueryResponse.statusText}`);
      }

      const audioQuery = await audioQueryResponse.json() as Record<string, unknown>;

      // 任意の速度・ピッチ指定があれば反映
      if (typeof voiceProfile.speed === 'number') {
        audioQuery.speedScale = voiceProfile.speed;
      }
      if (typeof voiceProfile.pitch === 'number') {
        audioQuery.pitchScale = voiceProfile.pitch;
      }

      const synthesisResponse = await fetch(
        `${this.apiUrl}/synthesis?speaker=${speakerId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(audioQuery),
        }
      );

      if (!synthesisResponse.ok) {
        throw new Error(`VOICEVOX synthesis error: ${synthesisResponse.status} ${synthesisResponse.statusText}`);
      }

      const wavBuffer = Buffer.from(await synthesisResponse.arrayBuffer());

      console.log('✅ VOICEVOX生成完了');

      return Readable.from(wavBuffer);

    } catch (error) {
      console.error('❌ TTS生成エラー:', error);
      throw error;
    }
  }

  /**
   * フォールバック: 無音生成（テスト・デバッグ用）
   */
  async generateSilence(duration: number = 1000): Promise<Readable> {
    console.log(`🔇 無音データ生成 (${duration}ms)`);
    
    // 48kHz, 1ch, 16bitのPCMフォーマットで無音データを生成
    const sampleRate = 48000;
    const channels = 1;
    const bytesPerSample = 2;
    const samples = Math.floor((duration / 1000) * sampleRate);
    const bufferSize = samples * channels * bytesPerSample;
    
    const silenceBuffer = Buffer.alloc(bufferSize, 0);
    
    return Readable.from(silenceBuffer);
  }

  /**
   * モデルの接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 VOICEVOX接続テスト中...');
      const response = await fetch(`${this.apiUrl}/speakers`);
      if (!response.ok) {
        throw new Error(`VOICEVOX接続失敗: ${response.status} ${response.statusText}`);
      }
      console.log('✅ VOICEVOX接続テスト成功');
      return true;
      
    } catch (error) {
      console.error('❌ VOICEVOX接続テスト エラー:', error);
      return false;
    }
  }
}
