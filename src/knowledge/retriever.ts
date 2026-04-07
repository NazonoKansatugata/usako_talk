import { KnowledgeQAItem, RetrievalResult, SearchQuery } from './types.js';

/**
 * QAアイテムから検索して上位k件を返す
 */
export class KnowledgeRetriever {
  private items: KnowledgeQAItem[] = [];

  constructor(items: KnowledgeQAItem[]) {
    this.items = items;
  }

  /**
   * クエリで検索して上位k件を返す
   * @param query 検索クエリ
   * @param topK 上位何件取得するか(デフォルト3)
   * @returns スコア降順のRetrievalResult配列
   */
  search(query: string, topK: number = 3): RetrievalResult[] {
    const queryWords = this.tokenize(query);

    // 全アイテムをスコア化
    const scored = this.items.map((item) => ({
      item,
      score: this.calculateScore(item, queryWords, query),
    }));

    // スコア降順でソート
    scored.sort((a, b) => b.score - a.score);

    // 上位k件を返す
    return scored.slice(0, topK).filter((r) => r.score > 0);
  }

  /**
   * 1つのアイテムに対してスコアを計算
   */
  private calculateScore(
    item: KnowledgeQAItem,
    queryWords: string[],
    query: string
  ): number {
    let score = 0;

    // Question完全一致: +100
    if (item.question.toLowerCase() === query.toLowerCase()) {
      score += 100;
    }
    // Question部分一致: +40
    else if (item.question.toLowerCase().includes(query.toLowerCase())) {
      score += 40;
    }

    // Question単語マッチ: +15 per word
    for (const word of queryWords) {
      if (item.question.toLowerCase().includes(word)) {
        score += 15;
      }
    }

    // Tag一致: +20 per tag
    for (const tag of item.tags) {
      for (const word of queryWords) {
        if (tag.toLowerCase().includes(word)) {
          score += 20;
        }
      }
    }

    // Answer内キーワード一致: +30 per word (Question より も詳しく含むため高スコア)
    for (const word of queryWords) {
      const wordMatches = (item.answer.toLowerCase().match(new RegExp(word, 'g')) || []).length;
      if (wordMatches > 0) {
        score += 30 * wordMatches; // 複数回出現したら加算
      }
    }

    // Answer部分一致: +5 (全体的なマッチ)
    if (item.answer.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    return score;
  }

  /**
   * クエリ文字列を単語に分割
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[\s、，,\.\!\?\!？]+/)
      .filter((word) => word.length > 0);
  }

  /**
   * 全体の情報を取得
   */
  getStats() {
    return {
      totalItems: this.items.length,
      uniqueQuestions: new Set(this.items.map((i) => i.question)).size,
      totalSources: new Set(this.items.map((i) => i.sourcePath)).size,
    };
  }
}
