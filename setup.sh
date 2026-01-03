#!/bin/bash

# GitHub Pay - Setup Script
# This script helps you set up GitHub Pay on your machine

set -e

echo "🚀 GitHub Pay Setup"
echo "==================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if solana-cli is available
if ! command -v solana-keygen &> /dev/null; then
    echo "⚠️  Solana CLI not found. You can install it with:"
    echo "   sh -c \"$(curl -sSfL https://release.solana.com/v1.18.0/install)\""
    echo ""
    read -p "Continue without Solana CLI? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create data directories
mkdir -p backend/data
mkdir -p logs

echo "✅ Created directories"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "✅ Backend dependencies installed"

# Create .env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and set:"
    echo "   1. SOLANA_PRIVATE_KEY (escrow wallet)"
    echo "   2. GITHUB_TOKEN"
    echo ""
else
    echo "✅ .env file already exists"
fi

cd ..

# Check extension files
if [ ! -f extension/manifest.json ]; then
    echo "❌ extension/manifest.json not found"
    exit 1
fi

echo "✅ Extension files found"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Setup complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Backend Setup:"
echo "   - Edit backend/.env with your credentials:"
echo "     * SOLANA_PRIVATE_KEY (use: solana-keygen show -f keypair.json)"
echo "     * GITHUB_TOKEN (from: https://github.com/settings/tokens)"
echo ""
echo "2️⃣  Start Backend:"
echo "   npm start (from backend/ directory)"
echo ""
echo "3️⃣  Load Extension:"
echo "   - Open chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'extension/' folder"
echo ""
echo "4️⃣  Configure GitHub Webhook (Optional):"
echo "   - Go to your GitHub repo Settings → Webhooks"
echo "   - Add webhook with:"
echo "     Payload URL: http://your-backend:3000/webhook/github"
echo "     Events: issue_comments"
echo ""
echo "5️⃣  Test:"
echo "   - Create a test PR"
echo "   - Comment: /pay 50"
echo "   - Check logs and watch the magic happen!"
echo ""
echo "📚 Full docs: README.md"
echo ""
