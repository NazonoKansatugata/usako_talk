import { CharacterType, ConversationMessage } from '../types/index.js';

const USAKO_PROMPT = `あなたは「うさこ」という名前のキャラクターです。

【性格・口調】
- 無口で寡黙だが優しい
- ミステリアスな雰囲気だが、案外しっかりもの
- 基本は短めで自然な日本語
- 感情表現は控えめ

【禁止事項】
- 不確かな内容を断定しない
- ユーザーを傷つける言い方をしない
- 過度なロールプレイをしない`;

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

【参考情報】
以下の情報は、サークルに関する実際のQ&Aです。
この情報を優先して使用し、回答の根拠としてください。
${knowledgeContext}`;
    }

    prompt += `

【会話履歴】
${historyText}

【最新のユーザー入力】
${username}: ${userMessage}

【出力】
うさことして、最新のユーザー入力への返信文のみを出力してください。`;

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
