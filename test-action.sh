#!/bin/bash

# Simple test script to validate the action compiles and has the right structure

set -e

echo "🔧 Testing PlaywrightAction..."

# Check if action.yml exists and has required fields
if [ ! -f "action.yml" ]; then
    echo "❌ action.yml not found"
    exit 1
fi

echo "✅ action.yml found"

# Check if dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js not found"
    exit 1
fi

echo "✅ dist/index.js found"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ package.json found"

# Validate action.yml syntax
if ! python3 -c "import yaml; yaml.safe_load(open('action.yml'))" 2>/dev/null; then
    echo "❌ action.yml has invalid YAML syntax"
    exit 1
fi

echo "✅ action.yml has valid YAML syntax"

# Check if the action has required inputs
if ! grep -q "url:" action.yml; then
    echo "❌ action.yml missing required 'url' input"
    exit 1
fi

echo "✅ action.yml has required inputs"

# Check if README has Japanese content
if ! grep -q "モンキーテスト" README.md; then
    echo "❌ README.md missing Japanese content"
    exit 1
fi

echo "✅ README.md has Japanese documentation"

# Check if example workflows exist
if [ ! -f ".github/workflows/basic-example.yml" ]; then
    echo "❌ Basic example workflow not found"
    exit 1
fi

echo "✅ Example workflows found"

# Check if documentation exists
if [ ! -f "docs/self-hosted-setup.md" ]; then
    echo "❌ Self-hosted setup documentation not found"
    exit 1
fi

echo "✅ Documentation files found"

echo "🎉 All tests passed! PlaywrightAction is ready for use."