import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { KnowledgeQAItem } from './types.js';
import { NotionCSVParser } from './csvParser.js';

/**
 * Knowledge情報源(CSVファイル)をロード
 */
export class KnowledgeLoader {
  /**
   * 指定フォルダからすべてのCSVを読み込んでQAアイテムに正規化
   * @param knowledgeDir knowledge フォルダのパス
   * @returns KnowledgeQAItem配列
   */
  static loadAllCSVs(knowledgeDir: string): KnowledgeQAItem[] {
    if (!existsSync(knowledgeDir)) {
      console.warn(`⚠️ Knowledge フォルダが見つかりません: ${knowledgeDir}`);
      return [];
    }

    const items: KnowledgeQAItem[] = [];

    try {
      const csvFiles = this.findCSVFiles(knowledgeDir);
      console.log(`📚 ${csvFiles.length} 個のCSVファイルを発見しました`);

      for (const csvPath of csvFiles) {
        try {
          const fileItems = this.loadCSV(csvPath);
          items.push(...fileItems);
          console.log(`✅ ${basename(csvPath)}: ${fileItems.length} 件のQ&Aを読み込みました`);
        } catch (error) {
          console.error(`❌ CSV読み込み失敗 ${csvPath}:`, error);
        }
      }

      console.log(`📦 合計 ${items.length} 件のQ&Aを読み込みました`);
    } catch (error) {
      console.error('❌ Knowledge フォルダのスキャンに失敗:', error);
    }

    return items;
  }

  /**
   * knowledge フォルダ配下のすべてのCSVファイルを見つける
   */
  private static findCSVFiles(dir: string): string[] {
    const files: string[] = [];

    const scanDir = (currentDir: string) => {
      try {
        const entries = readdirSync(currentDir);

        for (const entry of entries) {
          const fullPath = join(currentDir, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            // 再帰的に走査
            scanDir(fullPath);
          } else if (stat.isFile() && extname(entry).toLowerCase() === '.csv') {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`⚠️ ディレクトリスキャン失敗 ${currentDir}:`, error);
      }
    };

    scanDir(dir);
    return files;
  }

  /**
   * 1つのCSVファイルをロードして正規化
   */
  private static loadCSV(csvPath: string): KnowledgeQAItem[] {
    const [header, dataRows] = NotionCSVParser.parseFile(csvPath);

    if (dataRows.length === 0) {
      return [];
    }

    // ヘッダーのインデックスマッピング
    const questionIdx = header.findIndex(
      (h) => h.toLowerCase() === 'question'
    );
    const answerIdx = header.findIndex((h) => h.toLowerCase() === 'answer');
    const tagIdx = header.findIndex((h) => h.toLowerCase() === 'tag');
    const authorIdx = header.findIndex(
      (h) => h.toLowerCase() === '最終更新者'
    );

    if (questionIdx === -1 || answerIdx === -1) {
      throw new Error(
        `必須列が見つかりません: Question=${questionIdx >= 0}, Answer=${answerIdx >= 0}`
      );
    }

    const sourceTitle = basename(csvPath, '.csv');
    const items: KnowledgeQAItem[] = [];

    // 重複チェック用
    const seenQuestions = new Map<string, KnowledgeQAItem>();

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];

      const question = row[questionIdx]?.trim() || '';
      const answer = row[answerIdx]?.trim() || '';

      // 空行スキップ
      if (!question || !answer) {
        continue;
      }

      const tags = tagIdx >= 0
        ? row[tagIdx]
            ?.split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0) || []
        : [];
      const author = authorIdx >= 0 ? row[authorIdx]?.trim() || 'unknown' : 'unknown';

      const item: KnowledgeQAItem = {
        question,
        answer,
        tags,
        author,
        sourcePath: csvPath,
        rowIndex: rowIdx + 1, // 1-indexed
        sourceTitle,
      };

      // 重複Question処理: info タグ優先、その後Answer長優先
      const existing = seenQuestions.get(question);
      if (existing) {
        const existingHasInfo = existing.tags.some(
          (t) => t.toLowerCase() === 'info'
        );
        const newHasInfo = item.tags.some((t) => t.toLowerCase() === 'info');

        // 新規がinfoを持つ場合は上書き
        if (newHasInfo && !existingHasInfo) {
          seenQuestions.set(question, item);
        } else if (newHasInfo === existingHasInfo) {
          // どちらもinfoを持つか持たないかの場合、Answer長で判定
          if (item.answer.length > existing.answer.length) {
            seenQuestions.set(question, item);
          }
        }
        // 既存がinfoを持ち新規が持たない場合は既存を保持
      } else {
        seenQuestions.set(question, item);
      }
    }

    items.push(...Array.from(seenQuestions.values()));
    return items;
  }
}
