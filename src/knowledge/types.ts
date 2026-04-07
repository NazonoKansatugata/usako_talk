/**
 * Knowledge(QA情報源)関連の型定義
 */

/**
 * NotionエクスポートCSVから読み込んだ1つのQAアイテム
 */
export interface KnowledgeQAItem {
  // 質問文
  question: string;
  // 回答文
  answer: string;
  // タグ一覧（カンマ分割をtrim済み配列に正規化）
  tags: string[];
  // 最終更新者
  author: string;
  // 元のCSVファイルパス
  sourcePath: string;
  // CSVファイル内の行番号
  rowIndex: number;
  // CSVタイトル(ファイル名から抽出)
  sourceTitle: string;
}

/**
 * 検索結果の1件
 */
export interface RetrievalResult {
  // マッチしたQAアイテム
  item: KnowledgeQAItem;
  // スコア(高いほど関連度高い)
  score: number;
}

/**
 * 検索リクエスト
 */
export interface SearchQuery {
  // ユーザーの質問文
  query: string;
  // 上位何件取得するか
  topK?: number;
}

/**
 * 検索レスポンス
 */
export interface SearchResponse {
  // マッチしたアイテムとスコア(スコア降順)
  results: RetrievalResult[];
  // 検索対象のQ&A総数
  totalCount: number;
  // 検索で参照したファイル数
  filesConsumed: number;
}
