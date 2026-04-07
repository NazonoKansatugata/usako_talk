# QA情報源(Notionエクスポート対応)実装設計

## 目的
- サークル情報を knowledge/ 内のNotionエクスポートファイルから参照し、回答の根拠を明示できるQA応答を作る。
- 既存の会話Bot実装を壊さず、段階的に導入する。
- 情報源フォルダはローカル運用とし、Git管理から除外する。

## 実データ確認結果
現状の knowledge/ は次の構成だった。
- ルートMarkdown: FAQ 316c40a7d2ef806cb931e4c2aec79dd3.md
- 配下フォルダ: FAQ/
- DBエクスポートCSV:
  - FAQ 32ec40a7d2ef80debb3af40c6f4aed19.csv
  - FAQ 32ec40a7d2ef80debb3af40c6f4aed19_all.csv

CSVは以下の列を持つ。
- Question
- Answer
- Tag
- 最終更新者

このため「Markdown本文を見出し分割して検索する」よりも、
「CSVの1行=1QAエントリ」として読み込む方式が最短で適合する。

## 情報源フォルダ方針
- 情報源ルートは knowledge-data/ とする（`src/knowledge` との区別を明示化）。
- knowledge-data/ は .gitignore に追加済み。
- Notionエクスポートの初期対応対象は以下。
  - ルートの .md(インデックス用途)
  - 子フォルダの .csv(DB本体)

## Notionエクスポート向けデータ仕様
- QA本体はCSVを優先採用する。
- 1行を1ドキュメントとして扱う。
- フィールド正規化ルールを定義する。

正規化ルール:
- question: Question 列
- answer: Answer 列
- tags: Tag 列をカンマ分割してtrim
- author: 最終更新者 列
- sourcePath: 元CSVファイル
- rowIndex: CSV行番号
- sourceTitle: CSVファイル名(例: FAQ)

運用ルール:
- Question/Answer が空の行は除外する。
- 重複Questionは以下優先で1件採用する。
  - Tagに info を含む行
  - Answer文字数が長い行
- 連絡先や個人情報は記載しない。

## システム構成
既存フローに検索レイヤを追加する。

現在:
- ユーザー入力
- PromptBuilderでプロンプト生成
- Ollamaで回答

追加後:
- ユーザー入力
- Knowledge検索(上位k件取得)
- PromptBuilderで「質問 + 根拠コンテキスト」を組み立て
- Ollamaで回答
- 回答末尾に参照元タイトルを添える(任意)

## 追加するモジュール案
- src/knowledge/types.ts
  - KnowledgeQAItem, RetrievalResult
- src/knowledge/csvParser.ts
  - Notion CSV(改行・引用符込み)を安全にパース
- src/knowledge/loader.ts
  - knowledge/ を再帰走査して .csv を収集
  - CSV行を KnowledgeQAItem へ正規化
- src/knowledge/retriever.ts
  - question/tags/answer へのキーワードスコアで上位k件を返す
- src/knowledge/service.ts
  - 初期化、再読み込み、検索APIを提供

既存改修ポイント:
- src/config/index.ts
  - KNOWLEDGE_DIR, KNOWLEDGE_TOP_K, KNOWLEDGE_MAX_CHARS を追加
- src/bots/BotManager.ts
  - handleHumanMessage 内で KnowledgeService.search を呼ぶ
- src/llm/promptBuilder.ts
  - 取得コンテキストを埋め込む buildUserReplyPrompt を拡張

## 検索方式(段階導入)
第1段階(最短導入):
- CSVの各行を対象にスコア化する。
- 推奨スコア配分(Question と Answer の両方を対象):
  - Question完全一致: +100
  - Question部分一致: +40
  - Answer内キーワード一致: +30 (段落内で複数回一致時は加算)
  - Tag一致: +20
  - Answer内部分一致: +5
- 上位3-5件を採用し、重複Questionは1件に圧縮する。

第2段階(精度向上):
- embedding検索を追加(BM25/ベクトル併用)
- 取得根拠の重複除去と再ランキング

## プロンプト設計
モデルに以下を明示する。
- 回答は与えられた根拠を優先する。
- 根拠が不足する場合は「不明」と答える。
- 推測で規約を作らない。
- **キャラクター性**: 回答の語尾を「うさ」で統一し、元気で親友らしい口調を保つ。

出力方針:
- 1段落目で結論(会話らしく、知識源をそのままではなく説明する)
- 2段落目で理由や詳細(必要に応じて)
- 語尾は必ず「うさ」で統一
- 最後に参照した資料タイトルを列挙(任意)

例:
- ❌ 原情報: "情報技術研究部 - ゲームやウェブなどの制作を行う"
- ✅ 会話体: "情報技術研究部は、ゲームやWEBなど、いろんなものを作るサークルなんだうさ！"

## エラー時の動作
- knowledge/ が存在しない:
  - 警告ログのみで継続(通常チャットモード)
- 文書読み込み失敗:
  - 該当ファイルをスキップ
- 検索結果0件:
  - 一般回答にフォールバックし、断定を避ける

## 更新反映
最初はシンプルに起動時ロードでよい。
必要になったら以下を追加する。
- 開発時のみ30秒ごとにmtime監視
- 変更があれば差分再ロード

## セキュリティと運用
- knowledge/ はGit管理外を維持する。
- 秘匿情報は記載しない。
- 回答ログに全文コンテキストを残さない(抜粋のみ)。

## 実装ステップ(推奨)
1. knowledge/ 運用開始
2. loader/chunker/retriever/service を追加
3. BotManager と PromptBuilder を接続
4. 5-10個の質問で手動評価
5. 必要ならembedding検索を追加

## 受け入れ基準
- QA質問時に、knowledge由来の文言が回答へ反映される。
- 根拠なしの断定回答が減る。
- knowledge/ が空でもBotが落ちない。
- 既存の通常会話と音声機能に回帰不具合がない。

## Notionエクスポート固有の注意点
- CSV内のAnswerは複数行を含むため、単純な split(',') は禁止。
- UTF-8(BOM付き)を想定し、BOM除去処理を入れる。
- Notionリンク表記 "タイトル (https://...)" はそのまま保持し、回答時に壊さない。
- _all.csv は件数が多い可能性があるため、起動時に一括ロードしてメモリ保持する。

## 最小実装のゴール
- ローカルNotionエクスポート(CSV中心)を使って、質問に対して根拠付き回答を返せる状態。
- まずはキーワード検索で成立させ、その後に検索精度を段階改善する。
