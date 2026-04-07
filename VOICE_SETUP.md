# VOICEVOX セットアップ

うさこトークの音声読み上げは VOICEVOX Engine を使用します。

## 前提

- Discord Botがテキスト/音声チャンネルに参加できる
- VOICEVOX Engine がローカルで起動している
- このリポジトリの依存関係がインストール済み

## 1. VOICEVOX Engine 起動

VOICEVOX Engine を起動し、以下にアクセスできることを確認します。

- http://127.0.0.1:50021/version
- http://127.0.0.1:50021/speakers

## 2. .env 設定

```env
TTS_ENABLED=true
TTS_API_URL=http://127.0.0.1:50021
VOICEVOX_SPEAKER_ID=46

VOICE_CHANNEL_ID=your_voice_channel_id
VOICE_CHANNEL_ENABLED=true
```

補足:
- VOICEVOX_SPEAKER_ID は style id を指定してください
- style id は speakers エンドポイントのレスポンスから確認できます

## 3. Discord 側の権限

Botに以下の権限が必要です。

- Send Messages
- Read Messages/View Channels
- Connect（音声接続）
- Speak（音声発話）

## 4. 起動確認

```bash
npm run dev
```

起動ログで以下を確認します。

- うさこBotのログイン成功
- 音声チャンネル接続成功（VOICE_CHANNEL_ENABLED=true の場合）
- ユーザーメッセージ送信後、返信と音声再生

## トラブルシューティング

- VOICEVOX接続失敗:
  - VOICEVOX Engine の起動状態を確認
  - TTS_API_URL のホスト/ポートを確認
- 音声が流れない:
  - VOICE_CHANNEL_ID が正しいか確認
  - BotのConnect/Speak権限を確認
- テキストだけ返る:
  - TTS_ENABLED と VOICE_CHANNEL_ENABLED が true か確認
