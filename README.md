# PlaywrightAction

セルフホスト・GitHub ホスト両対応 Playwright MCP モンキーテスト & スクリーンショット共有 GitHub Action

## 概要

このGitHub Actionは、セルフホストランナー・GitHub提供ホストランナーの両方でPlaywrightを活用したモンキーテストを実行し、MCP（Model Context Protocol）によるAI支援テスト分析とスクリーンショット共有機能を提供します。

## 主な機能

- 🐒 **モンキーテスト**: ランダムなユーザー操作の自動実行
- 📸 **スクリーンショット取得**: テスト実行中の画面キャプチャ
- 🤖 **MCP統合**: AI支援によるテスト分析（開発中）
- 🌐 **マルチブラウザ対応**: Chromium、Firefox、WebKitをサポート
- 🏠 **セルフホスト対応**: セルフホストランナーでの動作最適化
- ☁️ **GitHub ホスト対応**: GitHub提供ランナーでの実行をサポート
- 🔄 **自動ランナー検出**: 実行環境に応じて最適な設定を自動適用

## 使用方法

### GitHub ホストランナーでの使用例

```yaml
name: Playwright Monkey Test (GitHub-Hosted)
on: [push, pull_request]

jobs:
  monkey-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run Playwright Monkey Test
        uses: g-kari/PlaywrightAction@v1
        with:
          url: 'https://example.com'
          test-duration: '3'
          browser: 'chromium'
          max-actions: '50'
```

### セルフホストランナーでの使用例

```yaml
name: Playwright Monkey Test (Self-Hosted)
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

### 高度な設定例（マルチプラットフォーム）

```yaml
name: Cross-Platform Monkey Test
on: 
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時に自動実行

jobs:
  # GitHub ホストランナーでのテスト
  test-github-hosted:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        browser: [chromium, firefox]
        
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: モンキーテスト実行 - ${{ matrix.browser }} on ${{ matrix.os }}
        uses: g-kari/PlaywrightAction@v1
        with:
          url: ${{ secrets.TEST_URL }}
          test-duration: '5'
          browser: ${{ matrix.browser }}
          max-actions: '100'
          action-delay: '1000'
          screenshot-path: './test-screenshots/${{ matrix.os }}-${{ matrix.browser }}'
          
      - name: スクリーンショットのアップロード
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: screenshots-${{ matrix.os }}-${{ matrix.browser }}
          path: ./test-screenshots/${{ matrix.os }}-${{ matrix.browser }}
          retention-days: 30

  # セルフホストランナーでのテスト
  test-self-hosted:
    runs-on: self-hosted
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: モンキーテスト実行 - ${{ matrix.browser }}
        uses: g-kari/PlaywrightAction@v1
        with:
          url: ${{ secrets.TEST_URL }}
          test-duration: '10'
          browser: ${{ matrix.browser }}
          max-actions: '200'
          action-delay: '500'
          screenshot-path: './test-screenshots/${{ matrix.browser }}'
          mcp-server: ${{ secrets.MCP_SERVER_URL }}
```

## 入力パラメータ

| パラメータ | 必須 | デフォルト値 | 説明 |
|------------|------|------------|------|
| `url` | ✅ | - | テスト対象のURL |
| `test-duration` | ❌ | `5` | テスト実行時間（分） |
| `browser` | ❌ | `chromium` | 使用するブラウザ（chromium/firefox/webkit） |
| `mcp-server` | ❌ | `''` | MCPサーバーのエンドポイント |
| `screenshot-path` | ❌ | `./screenshots` | スクリーンショットの保存パス |
| `max-actions` | ❌ | `100` | 最大実行アクション数 |
| `action-delay` | ❌ | `1000` | アクション間の待機時間（ミリ秒） |

## 出力値

| 出力値 | 説明 |
|------|------|
| `screenshot-count` | 取得したスクリーンショットの数 |
| `test-result` | テスト結果のサマリー |
| `errors-found` | 発見されたエラーの数 |

## ランナータイプと推奨設定

このアクションは実行環境を自動検出し、最適な設定を適用します：

### GitHub ホストランナー
- **対応OS**: Ubuntu, Windows, macOS
- **ブラウザ**: Chromium, Firefox (WebKitはmacOSのみ推奨)
- **セットアップ**: Playwrightの事前インストールが必要
- **利点**: 設定不要、スケーラブル、コスト効率
- **制限**: 実行時間制限、一部システム機能への制限

### セルフホストランナー
- **対応OS**: 主にLinux (Ubuntu推奨)
- **ブラウザ**: Chromium, Firefox, WebKit (全て対応)
- **セットアップ**: 事前環境構築が必要
- **利点**: 完全制御、長時間実行可能、カスタム環境
- **制限**: 管理コスト、スケーラビリティ

## GitHub ホストランナーでの使用準備

GitHub ホストランナーを使用する場合、以下のセットアップが必要です：

### 基本セットアップ

```yaml
steps:
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      
  - name: Install Playwright browsers
    run: npx playwright install --with-deps chromium
```

### マルチブラウザセットアップ

```yaml
strategy:
  matrix:
    browser: [chromium, firefox]

steps:
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      
  - name: Install Playwright browsers
    run: npx playwright install --with-deps ${{ matrix.browser }}
```

### Windows/macOS の場合

```yaml
# Windows
- name: Install Playwright browsers (Windows)
  run: npx playwright install --with-deps chromium
  if: runner.os == 'Windows'

# macOS  
- name: Install Playwright browsers (macOS)
  run: npx playwright install --with-deps chromium webkit
  if: runner.os == 'macOS'
```

## セルフホストランナーのセットアップ

### 1. 実行環境の準備

```bash
# Node.js 20以上のインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 必要なシステムパッケージのインストール
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
# Actions Runnerのダウンロードと設定
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# ランナーの設定（GitHubリポジトリのTokenが必要）
./config.sh --url https://github.com/your-org/your-repo --token YOUR_TOKEN

# サービスとしてインストール・起動
sudo ./svc.sh install
sudo ./svc.sh start
```

### 3. Playwrightブラウザのセットアップ

```bash
# Playwrightをグローバルにインストール
npm install -g playwright
npx playwright install --with-deps
```

## MCP統合について

MCP（Model Context Protocol）統合により、AI支援によるテスト分析が可能になります（現在開発中）。

### MCPサーバーの設定例

```yaml
# MCPサーバーのエンドポイントを設定
with:
  mcp-server: 'http://localhost:3000/mcp'
```

MCPサーバーは以下の情報を受信して分析を行います：
- テスト実行結果
- 取得したスクリーンショット
- 検出されたエラー情報
- 実行されたアクションの履歴

## トラブルシューティング

### よくある問題と解決方法

#### ブラウザが起動しない場合
```bash
# 必要な依存関係を再インストール
npx playwright install --with-deps chromium
```

#### 権限エラーが発生する場合
```bash
# ランナーユーザーに適切な権限を付与
sudo usermod -aG docker runner
```

#### スクリーンショットが保存されない場合
- `screenshot-path` で指定したディレクトリに書き込み権限があることを確認してください
- 相対パスを使用する場合は、ワークスペースのルートからの相対パスで指定してください

### デバッグログの有効化

アクションの詳細ログを確認するには：

```yaml
- name: モンキーテスト実行
  uses: g-kari/PlaywrightAction@v1
  with:
    url: 'https://example.com'
  env:
    ACTIONS_STEP_DEBUG: true
```

## 開発・貢献

### ローカル開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/g-kari/PlaywrightAction.git
cd PlaywrightAction

# 依存関係のインストール
npm install

# TypeScriptのビルド
npm run build

# ローカルでのテスト実行
node dist/index.js
```

### テストの実行

```bash
# Playwrightブラウザのインストール
npx playwright install

# テストスイートの実行
npm test
```

## ライセンス

MIT License

## サポート・お問い合わせ

問題の報告や機能要求がございましたら、[Issues](https://github.com/g-kari/PlaywrightAction/issues) よりお知らせください。

---

**📋 ランナー対応状況**: このアクションはセルフホストランナー・GitHub提供ホストランナーの両方で動作します。実行環境は自動検出され、最適な設定が適用されます。GitHub ホストランナーではPlaywrightの事前インストールが必要です。