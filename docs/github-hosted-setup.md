# GitHub ホストランナーセットアップガイド

## 概要

GitHub ホストランナーは GitHub が提供するクラウド環境で、設定不要ですぐに利用可能です。PlaywrightAction では自動的に環境を検出し、最適な設定を適用します。

## 前提条件

- Playwrightの事前インストールが必要
- Node.js 20以上の環境設定
- ブラウザの依存関係インストール

## 基本セットアップ

### 単一ブラウザテスト

```yaml
name: GitHub-Hosted Playwright Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Run Monkey Test
        uses: g-kari/PlaywrightAction@v1
        with:
          url: 'https://example.com'
          test-duration: '3'
          browser: 'chromium'
          max-actions: '50'
```

### マルチブラウザテスト

```yaml
name: Multi-Browser Test
on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        browser: [chromium, firefox]
        
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
        
      - name: Run Monkey Test - ${{ matrix.browser }}
        uses: g-kari/PlaywrightAction@v1
        with:
          url: 'https://example.com'
          test-duration: '2'
          browser: ${{ matrix.browser }}
          max-actions: '30'
```

### クロスプラットフォームテスト

```yaml
name: Cross-Platform Test
on: workflow_dispatch

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        browser: [chromium, firefox]
        exclude:
          # WebKit は macOS でのみ推奨
          - os: ubuntu-latest
            browser: webkit
          - os: windows-latest
            browser: webkit
            
    runs-on: ${{ matrix.os }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
        
      - name: Run Monkey Test
        uses: g-kari/PlaywrightAction@v1
        with:
          url: 'https://example.com'
          test-duration: '1'
          browser: ${{ matrix.browser }}
          max-actions: '20'
          screenshot-path: './screenshots/${{ matrix.os }}-${{ matrix.browser }}'
          
      - name: Upload Screenshots
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: screenshots-${{ matrix.os }}-${{ matrix.browser }}
          path: ./screenshots/${{ matrix.os }}-${{ matrix.browser }}/
```

## プラットフォーム別の注意事項

### Ubuntu (ubuntu-latest)
- **推奨ブラウザ**: Chromium, Firefox
- **WebKit**: 利用可能ですが、依存関係が多い
- **パフォーマンス**: 最も安定した環境

### Windows (windows-latest)
- **推奨ブラウザ**: Chromium, Firefox
- **WebKit**: サポートされていません
- **注意点**: パス区切りがバックスラッシュ

### macOS (macos-latest)
- **推奨ブラウザ**: Chromium, Firefox, WebKit
- **WebKit**: 最も安定した環境
- **注意点**: ARM64 アーキテクチャ

## パフォーマンス最適化

### キャッシュ活用

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-playwright-
      
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
  if: steps.cache.outputs.cache-hit != 'true'
```

### 並列実行

```yaml
strategy:
  matrix:
    test-group: [1, 2, 3, 4]
    
steps:
  - name: Run Monkey Test - Group ${{ matrix.test-group }}
    uses: g-kari/PlaywrightAction@v1
    with:
      url: 'https://example.com/page${{ matrix.test-group }}'
      test-duration: '1'
      max-actions: '25'
```

## 制限事項と注意点

### 実行時間制限
- **GitHub Free**: 2000分/月
- **GitHub Pro**: 3000分/月
- **タイムアウト**: 6時間（ジョブあたり）

### リソース制限
- **CPU**: 2コア
- **メモリ**: 7GB
- **ディスク**: 14GB SSD

### ネットワーク制限
- 外部ネットワークアクセス可能
- 一部ポートへの制限あり

## トラブルシューティング

### ブラウザインストールエラー

```yaml
# 依存関係を強制的に再インストール
- name: Install Playwright with dependencies
  run: |
    npx playwright install --with-deps
    sudo apt-get update
    sudo apt-get install -y libnss3 libatk-bridge2.0-0
```

### WebKit関連のエラー

```yaml
# Ubuntu で WebKit を使用する場合
- name: Install WebKit dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y \
      libwoff1 \
      libopus0 \
      libwebp6 \
      libwebpdemux2 \
      libenchant-2-2 \
      libgudev-1.0-0 \
      libsecret-1-0 \
      libhyphen0 \
      libgdk-pixbuf2.0-0 \
      libegl1 \
      libnotify4 \
      libxss1 \
      libasound2
```

### Windows でのパス問題

```yaml
# Windows 環境でのスクリーンショットパス
- name: Run Monkey Test (Windows)
  uses: g-kari/PlaywrightAction@v1
  with:
    url: 'https://example.com'
    screenshot-path: './screenshots'  # Unix形式のパス使用
  if: runner.os == 'Windows'
```

## ベストプラクティス

### 1. 適切なテスト時間の設定

```yaml
# GitHub ホストランナーでは短めのテスト時間を推奨
- name: Run Quick Monkey Test
  uses: g-kari/PlaywrightAction@v1
  with:
    url: 'https://example.com'
    test-duration: '2'  # 2分程度
    max-actions: '30'   # アクション数を制限
```

### 2. アーティファクト管理

```yaml
- name: Upload Screenshots
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-screenshots-${{ github.run_id }}
    path: ./screenshots/
    retention-days: 7  # 短めの保持期間
```

### 3. 条件実行

```yaml
# PRのみでテスト実行
- name: Run Monkey Test
  uses: g-kari/PlaywrightAction@v1
  if: github.event_name == 'pull_request'
  with:
    url: 'https://example.com'
    test-duration: '1'
```

## 料金とコスト管理

### 実行時間の見積もり
- セットアップ: 1-2分
- テスト実行: 設定した時間
- 成果物アップロード: 0.5-1分

### コスト削減のヒント
1. 必要な場合のみテスト実行
2. 短いテスト時間の設定
3. 並列実行の最適化
4. キャッシュの活用

## 参考リンク

- [GitHub Actions Usage Limits](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)