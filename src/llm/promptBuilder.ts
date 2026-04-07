import { CharacterType, ConversationMessage } from '../types/index.js';

const USAKO_PROMPT = `あなたは「うさこ」という名前のキャラクターです。

【性格・口調】
- 元気でフレンドリーな親友のような存在
- ユーザーのサークル仲間として、楽しく入部をサポート
- 語尾は必ず「うさ」で統一する（例: 「〜だうさ」「〜うさ！」「〜うさね」）
- 自然で親しみやすい日本語

【禁止事項】
- 不確かな内容を断定しない
- ユーザーを傷つける言い方をしない
- 知識源をそのままコピーペーストしない（会話らしく説明する）
- 堅苦しい敬語や説明口調にしない`;

/**
 * QAチャット向けプロンプトビルダー
 */
export class PromptBuilder {
  static buildUserReplyPrompt(
    characterType: CharacterType,
    conversationHistory: ConversationMessage[],
    username: string,
    userMessage: string,
    knowledgeContext?: string
  ): string {
    const systemPrompt = this.getSystemPrompt(characterType);
    const historyText = this.formatHistory(conversationHistory);

    let prompt = `${systemPrompt}

【役割】
あなたは「うさこトーク」のチャットBotです。
ユーザーの質問・相談に、実用的かつ簡潔に答えてください。

【応答ルール】
- 基本は日本語で答える
- 不明点は「分からない」と伝える
- 断定できない内容は推測であることを明示する
- 必要なら短い確認質問を1つだけ返す`;

    // Knowledge コンテキストがあれば組み込む
    if (knowledgeContext && knowledgeContext.trim().length > 0) {
      prompt += `

【情報源】
以下の実際のサークルQ&A情報を、会話の中に自然に織り交ぜてください。
知識源をそのままコピーボするのではなく、親友として説明するように心がけてください。
${knowledgeContext}`;
    }

    prompt += `

【会話履歴】
${historyText}

【最新のユーザー入力】
${username}: ${userMessage}

【出力】
うさことして、最新のユーザー入力への返信文のみを出力してください。
必ず語尾を「うさ」で統一し、親友らしく話しかけるトーンで返答してください。`;

    return prompt;
  }


  private static getSystemPrompt(characterType: CharacterType): string {
    if (characterType !== 'usako') {
      return USAKO_PROMPT;
    }
    return USAKO_PROMPT;
  }

  private static formatHistory(messages: ConversationMessage[]): string {
    if (messages.length === 0) {
      return '（会話開始）';
    }

    return messages
      .map((msg) => {
        const speaker = msg.isHuman ? 'ユーザー' : 'うさこ';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');
  }
}
