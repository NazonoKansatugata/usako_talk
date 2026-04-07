# うさこトーク

Discord上でユーザーのコメントにのみ反応する、うさこ単体のQA・チャットBotです。

## 変更点（おしゃべりうさこ部から）

- 3Bot構成（うさこ・ねここ・けろこ）を廃止し、うさこ1Botに統一
- Bot同士の自律会話を廃止し、ユーザー投稿時のみ応答
- TTSをQwen3方式からVOICEVOX Engine方式に変更
- 時間帯スケジュール（10時開始/18時終了）を廃止し、起動中は常時受付

## 主な機能

- Ollama（Qwen3系）による応答生成
- Discordテキストチャンネルでのコメント応答
- 任意でDiscord音声チャンネルへのVOICEVOX読み上げ

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

```bash
cp .env.example .env
```

最低限以下を設定してください。

```env
USAKO_BOT_TOKEN=...
GUILD_ID=...
CHANNEL_ID=...

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:14b

TTS_ENABLED=false
VOICE_CHANNEL_ENABLED=false
```

音声を使う場合は以下も設定します。

```env
TTS_ENABLED=true
TTS_API_URL=http://127.0.0.1:50021
VOICEVOX_SPEAKER_ID=46
VOICE_CHANNEL_ID=...
VOICE_CHANNEL_ENABLED=true
```

### 3. 実行

開発モード:

```bash
npm run dev
```

本番モード:

```bash
npm run build
npm start
```

## 動作仕様

- Botは起動後、指定チャンネルのユーザーメッセージを待機
- ユーザーがコメントすると、その内容を履歴に加えてOllamaに問い合わせ
- 生成された返信をうさこBotとして投稿
- 音声設定が有効なら同内容をVOICEVOXで音声化し、音声チャンネルで再生

## 補足

- Firebase連携・自律会話・日報生成・旧QwenTTS関連コードは削除済みです
- VOICEVOXセットアップの詳細は VOICE_SETUP.md を参照してください
