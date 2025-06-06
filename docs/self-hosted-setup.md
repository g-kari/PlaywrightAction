# セルフホストランナーセットアップガイド

## 前提条件

- Ubuntu 20.04+ (推奨)
- Node.js 20+
- 管理者権限

## 手順

### 1. システムの準備

```bash
# システムの更新
sudo apt update && sudo apt upgrade -y

# Node.js 20のインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 必要な依存関係のインストール
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
    libasound2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxrandr2 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev
```

### 2. GitHub Actions Runnerのインストール

```bash
# ランナー用のユーザー作成（オプション）
sudo useradd -m -s /bin/bash github-runner

# ランナーディレクトリの作成
mkdir actions-runner && cd actions-runner

# 最新のランナーをダウンロード
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
    https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# アーカイブの展開
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

### 3. ランナーの設定

```bash
# リポジトリで設定トークンを生成
# GitHub > リポジトリ > Settings > Actions > Runners > Add runner

# ランナーの設定
./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN

# ランナー名とラベルを設定
# Name: playwright-runner
# Labels: self-hosted,linux,x64,playwright
```

### 4. Playwrightのセットアップ

```bash
# Playwrightのグローバルインストール
npm install -g playwright

# ブラウザのインストール
npx playwright install --with-deps

# 権限の確認
npx playwright install-deps
```

### 5. サービスとしての実行

```bash
# サービスのインストール
sudo ./svc.sh install

# サービスの開始
sudo ./svc.sh start

# サービスの状態確認
sudo ./svc.sh status
```

### 6. 動作確認

```bash
# ランナーの状態確認
sudo systemctl status actions.runner.*

# ログの確認
sudo journalctl -u actions.runner.* -f
```

## トラブルシューティング

### ブラウザが起動しない

```bash
# 依存関係の再インストール
sudo apt-get install --reinstall libnss3 libatk-bridge2.0-0

# Playwrightブラウザの再インストール
npx playwright install --force --with-deps
```

### 権限エラー

```bash
# github-runnerユーザーに権限を付与
sudo usermod -aG sudo github-runner

# ディレクトリの権限設定
sudo chown -R github-runner:github-runner /home/github-runner/actions-runner
```

### メモリ不足

```bash
# スワップファイルの作成（2GB）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# /etc/fstabに追加
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## セキュリティ考慮事項

### ファイアウォール設定

```bash
# UFWの有効化
sudo ufw enable

# HTTPSのみ許可
sudo ufw allow 443
sudo ufw allow 22  # SSH
```

### ランナーの分離

```bash
# Dockerコンテナでの実行（推奨）
docker run -d \
  --name github-runner \
  --restart always \
  -e REPO_URL="https://github.com/YOUR_ORG/YOUR_REPO" \
  -e RUNNER_TOKEN="YOUR_TOKEN" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  myoung34/github-runner:latest
```

## 監視とメンテナンス

### ログローテーション

```bash
# logrotateの設定
sudo tee /etc/logrotate.d/github-runner <<EOF
/home/github-runner/actions-runner/_diag/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
}
EOF
```

### 定期メンテナンス

```bash
# 週次メンテナンススクリプト
cat > weekly_maintenance.sh <<EOF
#!/bin/bash
# ブラウザキャッシュのクリア
rm -rf ~/.cache/ms-playwright/

# 一時ファイルのクリア
find /tmp -name "playwright-*" -type d -mtime +1 -exec rm -rf {} +

# Playwrightブラウザの更新
npx playwright install --with-deps
EOF

chmod +x weekly_maintenance.sh

# cronに追加
echo "0 2 * * 0 /path/to/weekly_maintenance.sh" | crontab -
```