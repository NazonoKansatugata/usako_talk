import { KnowledgeQAItem, RetrievalResult, SearchQuery, SearchResponse } from './types.js';
import { KnowledgeLoader } from './loader.js';
import { KnowledgeRetriever } from './retriever.js';

/**
 * Knowledge管理のメインサービス
 * - ロード、再ロード、検索APIを提供
 */
export class KnowledgeService {
  private retriever: KnowledgeRetriever | null = null;
  private knowledgeDir: string;
  private topK: number;
  private isInitialized = false;

  constructor(knowledgeDir: string, topK: number = 3) {
    this.knowledgeDir = knowledgeDir;
    this.topK = topK;
  }

  /**
   * サービス初期化（CSVロード）
   */
  async initialize(): Promise<void> {
    try {
      console.log('📚 Knowledge サービスを初期化中...');
      const items = KnowledgeLoader.loadAllCSVs(this.knowledgeDir);

      if (items.length === 0) {
        console.warn('⚠️ Knowledge情報源が見つかりません。QA機能のみで動作します。');
      }

      this.retriever = new KnowledgeRetriever(items);
      this.isInitialized = true;

      const stats = this.retriever.getStats();
      console.log(
        `✅ Knowledge サービス初期化完了: ${stats.totalItems} 件 (${stats.totalSources} ファイル)`
      );
    } catch (error) {
      console.error('❌ Knowledge サービス初期化失敗:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 検索実行
   * @param query 検索クエリ
   * @returns 検索結果
   */
  search(query: SearchQuery): SearchResponse {
    if (!this.isInitialized || !this.retriever) {
      return {
        results: [],
        totalCount: 0,
        filesConsumed: 0,
      };
    }

    const topK = query.topK ?? this.topK;
    const results = this.retriever.search(query.query, topK);

    const stats = this.retriever.getStats();

    return {
      results,
      totalCount: stats.totalItems,
      filesConsumed: stats.totalSources,
    };
  }

  /**
   * 検索結果をプロンプト用コンテキストに変換
   * @param results 検索結果
   * @param maxChars 最大文字数
   * @returns コンテキスト文字列
   */
  formatContextFromResults(results: RetrievalResult[], maxChars: number = 2000): string {
    if (results.length === 0) {
      return '';
    }

    let context = '【関連情報】\n';
    let currentLength = context.length;

    for (const result of results) {
      const entry = `Q: ${result.item.question}\nA: ${result.item.answer}\n\n`;
      if (currentLength + entry.length > maxChars) {
        break;
      }
      context += entry;
      currentLength += entry.length;
    }

    return context;
  }

  /**
   * 検索結果から参照元を抽出
   * @param results 検索結果
   * @returns 参照元タイトルの配列
   */
  extractSources(results: RetrievalResult[]): string[] {
    return Array.from(
      new Set(results.map((r) => r.item.sourceTitle))
    );
  }

  /**
   * サービスが初期化されたか
   */
  isReady(): boolean {
    return this.isInitialized && this.retriever !== null;
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    if (!this.retriever) {
      return { totalItems: 0, uniqueQuestions: 0, totalSources: 0 };
    }
    return this.retriever.getStats();
  }
}

// グローバルインスタンス
let knowledgeServiceInstance: KnowledgeService | null = null;

/**
 * グローバルインスタンスを所得(初期化も含む)
 */
export async function initializeKnowledgeService(
  knowledgeDir: string,
  topK: number = 3
): Promise<KnowledgeService> {
  if (!knowledgeServiceInstance) {
    knowledgeServiceInstance = new KnowledgeService(knowledgeDir, topK);
    await knowledgeServiceInstance.initialize();
  }
  return knowledgeServiceInstance;
}

/**
 * グローバルインスタンスを取得
 */
export function getKnowledgeService(): KnowledgeService | null {
  return knowledgeServiceInstance;
}
