import { BotManager } from './bots/BotManager.js';

/**
 * メイン処理
 */
async function main() {
  console.log('='.repeat(50));
  console.log('🐰 うさこトーク Discord Bot');
  console.log('='.repeat(50));

  const manager = new BotManager();

  // シグナルハンドリング（Ctrl+Cなどでの終了処理）
  process.on('SIGINT', async () => {
    console.log('\n⚠️ 終了シグナルを受信しました');
    await manager.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⚠️ 終了シグナルを受信しました');
    await manager.shutdown();
    process.exit(0);
  });

  try {
    // Bot初期化
    await manager.initialize();

    console.log('\n✅ 初期化が完了しました');
    console.log('   💬 指定チャンネルでユーザーのコメントを常時待機します');
    console.log('💡 Ctrl+C で終了できます\n');

    // プログラムを終了させずに実行し続ける
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await manager.shutdown();
    process.exit(1);
  }
}

// 実行
main().catch(console.error);
