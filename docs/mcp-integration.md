# MCP統合ガイド（開発中）

## MCP (Model Context Protocol) とは

MCPは、AIモデルとアプリケーション間のコミュニケーションを標準化するプロトコルです。このアクションでは、テスト結果をAIモデルに送信し、インテリジェントな分析とフィードバックを取得できます。

## 現在の実装状況

- ✅ 基本的なMCP統合インターフェース
- 🚧 MCPサーバーとの通信実装中
- 🚧 AI分析レポート生成機能
- 🚧 スクリーンショット自動分析

## 使用予定のMCPサーバー設定

```yaml
- name: Run Monkey Test with MCP
  uses: g-kari/PlaywrightAction@v1
  with:
    url: 'https://example.com'
    mcp-server: 'http://localhost:3000/mcp'
```

## MCPサーバーの要件

MCPサーバーは以下のエンドポイントを提供する必要があります：

### POST /mcp/analyze

テスト結果の分析要求

```json
{
  "test_results": {
    "url": "https://example.com",
    "browser": "chromium",
    "actions_performed": 150,
    "errors_found": 2,
    "duration": 300,
    "screenshots": [
      {
        "name": "initial-2024-01-01T00:00:00.000Z.png",
        "path": "./screenshots/initial-2024-01-01T00:00:00.000Z.png",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "errors": [
      "HTTP error: 404 https://example.com/missing-resource",
      "Page error: TypeError: Cannot read property 'x' of undefined"
    ]
  }
}
```

### レスポンス

```json
{
  "analysis": {
    "severity": "medium",
    "recommendations": [
      "Fix the missing resource at /missing-resource",
      "Add null checks for undefined properties"
    ],
    "score": 75,
    "issues": [
      {
        "type": "broken_link",
        "description": "404 error found",
        "priority": "high"
      }
    ]
  }
}
```

## 実装予定機能

### 1. スクリーンショット分析

AIがスクリーンショットを分析し、UI/UXの問題を検出

```typescript
interface ScreenshotAnalysis {
  visual_issues: {
    type: 'layout_broken' | 'text_overlap' | 'color_contrast';
    description: string;
    location: { x: number; y: number };
  }[];
  accessibility_issues: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }[];
}
```

### 2. インテリジェントテスト戦略

AIがテスト結果を学習し、より効果的なテスト戦略を提案

```typescript
interface TestStrategy {
  focus_areas: string[];
  suggested_actions: {
    element: string;
    action: 'click' | 'fill' | 'hover';
    priority: number;
  }[];
  avoid_patterns: string[];
}
```

### 3. 継続的学習

過去のテスト結果から学習し、テストの精度を向上

## MCPサーバーのサンプル実装

### Express.js版

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/mcp/analyze', async (req, res) => {
  const { test_results } = req.body;
  
  // AI分析ロジック（例：OpenAI API使用）
  const analysis = await analyzeTestResults(test_results);
  
  res.json({ analysis });
});

async function analyzeTestResults(results) {
  // 実装例
  const severity = results.errors_found > 5 ? 'high' : 
                  results.errors_found > 2 ? 'medium' : 'low';
  
  return {
    severity,
    score: Math.max(0, 100 - (results.errors_found * 10)),
    recommendations: generateRecommendations(results.errors),
    issues: analyzeErrors(results.errors)
  };
}

app.listen(3000, () => {
  console.log('MCP Server running on port 3000');
});
```

### Python Flask版

```python
from flask import Flask, request, jsonify
import openai

app = Flask(__name__)

@app.route('/mcp/analyze', methods=['POST'])
def analyze_test_results():
    data = request.get_json()
    test_results = data['test_results']
    
    # AI分析
    analysis = perform_ai_analysis(test_results)
    
    return jsonify({'analysis': analysis})

def perform_ai_analysis(results):
    # OpenAI GPT分析例
    prompt = f"""
    Analyze the following web test results:
    - URL: {results['url']}
    - Actions performed: {results['actions_performed']}
    - Errors found: {results['errors_found']}
    - Errors: {results['errors']}
    
    Provide recommendations for improvement.
    """
    
    # GPT API呼び出し（実装詳細は省略）
    return {
        'severity': 'medium',
        'score': 75,
        'recommendations': ['Fix 404 errors', 'Improve error handling']
    }

if __name__ == '__main__':
    app.run(port=3000)
```

## 設定例

### GitHub Actions設定

```yaml
jobs:
  monkey-test:
    runs-on: self-hosted
    services:
      mcp-server:
        image: your-org/mcp-server:latest
        ports:
          - 3000:3000
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    steps:
      - name: Run Monkey Test
        uses: g-kari/PlaywrightAction@v1
        with:
          url: 'https://example.com'
          mcp-server: 'http://localhost:3000/mcp'
```

## ロードマップ

- [ ] 基本的なMCP通信の実装
- [ ] スクリーンショット分析機能
- [ ] エラー分析とレポート生成
- [ ] テスト戦略の最適化
- [ ] ダッシュボード機能
- [ ] 複数AIモデル対応

## 貢献

MCP統合機能の開発にご興味がある方は、[Issues](https://github.com/g-kari/PlaywrightAction/issues)でお知らせください。