import { Readable } from 'stream';
import { readFileSync } from 'fs';

/**
 * Notionエクスポート CSV パーサー
 * - BOM付きUTF-8対応
 * - 複数行を含むセル対応（引用符内の改行）
 * - 簡易的だが実用的なパース
 */
export class NotionCSVParser {
  /**
   * CSVファイルを読みこんで行単位で返す
   * @param filePath ファイルパス
   * @returns [ヘッダー行(列名配列), データ行(値の配列の配列)]
   */
  static parseFile(filePath: string): [string[], string[][]] {
    const content = readFileSync(filePath, 'utf-8');
    return this.parseContent(content);
  }

  /**
   * CSVコンテンツを解析
   * @param content CSVコンテンツ文字列
   * @returns [ヘッダー行, データ行]
   */
  static parseContent(content: string): [string[], string[][]] {
    // BOM除去
    let cleaned = content;
    if (cleaned.charCodeAt(0) === 0xfeff) {
      cleaned = cleaned.slice(1);
    }

    // 行単位で分割（ただし引用符内の改行は除く）
    const rows = this.splitRows(cleaned);

    if (rows.length === 0) {
      return [[], []];
    }

    const header = this.parseLine(rows[0]);
    const dataRows = rows.slice(1).map((row) => this.parseLine(row));

    return [header, dataRows];
  }

  /**
   * CSVを行に分割（引用符内の改行は保持）
   */
  private static splitRows(content: string): string[] {
    const rows: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        // エスケープ判定: "" なら1つの " で、"<その他> なら引用符の開閉
        if (nextChar === '"') {
          current += '""';
          i++; // skipする
        } else {
          inQuotes = !inQuotes;
          current += char;
        }
      } else if (char === '\n' && !inQuotes) {
        // 改行で行分割（ただし引用符内は除く）
        if (current.trim().length > 0) {
          rows.push(current);
        }
        current = '';
      } else if (char === '\r' && !inQuotes && nextChar === '\n') {
        // CRLF対応
        if (current.trim().length > 0) {
          rows.push(current);
        }
        current = '';
        i++; // \n をskip
      } else {
        current += char;
      }
    }

    if (current.trim().length > 0) {
      rows.push(current);
    }

    return rows;
  }

  /**
   * 1行をパース
   * @param line CSV行
   * @returns パースされた値の配列
   */
  private static parseLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (nextChar === '"') {
          // "" エスケープ
          current += '"';
          i++; // skip
        } else {
          // 引用符開閉
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // カンマで区切り
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }
}
