# PlaywrightAction

GitHub Actionによるセルフホスト環境でのPlaywright MCPモンキーテスト & スクリーンショット共有

## 概要

このアクションは、セルフホストランナー環境でPlaywrightを使用したモンキーテストを実行し、MCP (Model Context Protocol) を通じてAI支援テストとスクリーンショット共有機能を提供します。

## 機能

- 🐒 **モンキーテスト**: ランダムなユーザー操作を自動実行
- 📸 **スクリーンショット取得**: テスト中の画面キャプチャ
- 🤖 **MCP統合**: AI支援テスト分析（開発中）
- 🌐 **マルチブラウザ対応**: Chromium、Firefox、WebKit
- 🏠 **セルフホスト対応**: セルフホストランナーでの実行

## 使用方法

### 基本的な使用例

```yaml
name: Playwright Monkey Test
on: [push, pull_request]

jobs:
  monkey-test:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Playwright Monkey Test
        uses: g-kari/PlaywrightAction@v1
        with:
          url: 'https://example.com'
          test-duration: '5'
          browser: 'chromium'
          max-actions: '100'
```

### 高度な設定例

```yaml
name: Advanced Monkey Test
on: 
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時に実行

jobs:
  monkey-test:
    runs-on: self-hosted
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Monkey Test - ${{ matrix.browser }}
        uses: g-kari/PlaywrightAction@v1
        with:
          url: ${{ secrets.TEST_URL }}
          test-duration: '10'
          browser: ${{ matrix.browser }}
          max-actions: '200'
          action-delay: '500'
          screenshot-path: './test-screenshots/${{ matrix.browser }}'
          mcp-server: ${{ secrets.MCP_SERVER_URL }}
          
      - name: Upload Screenshots
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: screenshots-${{ matrix.browser }}
          path: ./test-screenshots/${{ matrix.browser }}
          retention-days: 30
```

## 入力パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|------------|------|------------|------|
| `url` | ✅ | - | テスト対象のURL |
| `test-duration` | ❌ | `5` | テスト実行時間（分） |
| `browser` | ❌ | `chromium` | 使用ブラウザ（chromium/firefox/webkit） |
| `mcp-server` | ❌ | `''` | MCPサーバーエンドポイント |
| `screenshot-path` | ❌ | `./screenshots` | スクリーンショット保存パス |
| `max-actions` | ❌ | `100` | 最大実行アクション数 |
| `action-delay` | ❌ | `1000` | アクション間の待機時間（ミリ秒） |

## 出力

| 出力 | 説明 |
|------|------|
| `screenshot-count` | 取得したスクリーンショット数 |
| `test-result` | テスト結果サマリー |
| `errors-found` | 発見されたエラー数 |

## セルフホストランナーのセットアップ

### 1. ランナーの準備

```bash
# Node.js 20+ のインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 必要なパッケージのインストール
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2
```

### 2. GitHub Actions Runnerの設定

```bash
# ランナーのダウンロードと設定
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# 設定（GitHubリポジトリのTokenが必要）
./config.sh --url https://github.com/your-org/your-repo --token YOUR_TOKEN

# サービスとして実行
sudo ./svc.sh install
sudo ./svc.sh start
```

### 3. Playwrightブラウザのインストール

```bash
# グローバルにPlaywrightをインストール
npm install -g playwright
npx playwright install --with-deps
```

## MCP統合について

MCP (Model Context Protocol) 統合により、AI支援テストが可能になります（現在開発中）。

### MCPサーバーの設定例

```yaml
# MCPサーバーエンドポイントを設定
with:
  mcp-server: 'http://localhost:3000/mcp'
```

MCPサーバーは以下の情報を受信します：
- テスト結果
- スクリーンショット
- エラー情報
- 実行されたアクション

## トラブルシューティング

### よくある問題

#### ブラウザが起動しない
```bash
# 必要な依存関係を再インストール
npx playwright install --with-deps chromium
```

#### 権限エラー
```bash
# ランナーユーザーに適切な権限を付与
sudo usermod -aG docker runner
```

#### スクリーンショットが保存されない
- `screenshot-path` のディレクトリに書き込み権限があることを確認
- 相対パスを使用する場合は、ワークスペースのルートからの相対パス

### ログの確認

アクションの詳細ログを確認するには：

```yaml
- name: Run Monkey Test
  uses: g-kari/PlaywrightAction@v1
  with:
    url: 'https://example.com'
  env:
    ACTIONS_STEP_DEBUG: true
```

## 開発・貢献

### ローカル開発

```bash
# リポジトリのクローン
git clone https://github.com/g-kari/PlaywrightAction.git
cd PlaywrightAction

# 依存関係のインストール
npm install

# ビルド
npm run build

# ローカルテスト
node dist/index.js
```

### テスト

```bash
# Playwrightブラウザのインストール
npx playwright install

# テスト実行
npm test
```

## ライセンス

MIT License

## サポート

問題や機能要求がある場合は、[Issues](https://github.com/g-kari/PlaywrightAction/issues) でお知らせください。

---

**注意**: このアクションはセルフホストランナーでの使用を想定しています。GitHub提供のランナーでは一部機能が制限される場合があります。