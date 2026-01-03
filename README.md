# GitHub Pay - Complete Setup Guide

## 📋 Overview

GitHub Pay is a Chrome extension that enables maintainers to reward contributors directly from GitHub PR comments using Solana payments.

**Architecture:**
```
GitHub PR Comment
    ↓ (/pay 50)
    ↓
GitHub Webhook
    ↓
Express Backend (Node.js)
    ↓
SQLite Database
    ↓
Chrome Extension (Content Script)
    ↓
Phantom Wallet
    ↓
Solana Network
    ↓
Contributor Wallet
```

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 16+
- Chrome browser
- GitHub account
- Phantom wallet (or similar Solana wallet)
- Solana devnet SOL (free)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Generate Solana Keypair (Escrow Wallet)

```bash
# Install Solana CLI if not already installed
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Generate a new keypair
solana-keygen new --outfile escrow-keypair.json

# View the private key in array format
solana-keygen show escrow-keypair.json

# Copy the array (numbers in brackets) and paste it in .env SOLANA_PRIVATE_KEY
```

### 3. Get GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `admin:repo_hook`, `read:user`
4. Copy token and paste in `.env` as `GITHUB_TOKEN`

### 4. Update .env

Edit `backend/.env`:

```env
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=[1,2,3,...]  # Your keypair array
GITHUB_TOKEN=ghp_your_token_here
BACKEND_URL=http://localhost:3000
```

### 5. Start Backend

```bash
npm start
# Server runs on http://localhost:3000
```

Check health:
```bash
curl http://localhost:3000/health
```

---

## 💻 Chrome Extension Setup

### 1. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Extension appears in your toolbar ✓

### 2. Connect Wallet

1. Click the extension icon
2. Click "Connect Phantom Wallet"
3. Approve in Phantom popup
4. Link GitHub username

---

## 🔧 How It Works

### Maintainer: Issuing a Reward

1. Go to any GitHub PR
2. In a comment, type:
   ```
   /pay 50
   ```
3. Backend receives webhook
4. Verifies you're a maintainer
5. Creates pending reward in database
6. Posts confirmation comment

### Contributor: Redeeming

1. Install extension (already connected wallet + GitHub)
2. Open the PR with reward
3. See "💰 Redeem 50 SOL" button
4. Click button
5. Extension sends redeem request
6. Backend transfers SOL from escrow to your wallet
7. Button shows ✅ Redeemed

---

## 📝 API Endpoints

### GET /health
Health check and Solana status.

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "solana": true
}
```

### POST /webhook/github
GitHub webhook receiver. Configure in GitHub App settings.

Payload:
```json
{
  "action": "created",
  "comment": { "body": "/pay 50", "user": { "login": "maintainer" } },
  "issue": { "number": 123, "user": { "login": "contributor" } },
  "pull_request": { ... },
  "repository": { "full_name": "owner/repo" }
}
```

### GET /api/reward?repo=owner/repo&pr=123
Get pending reward for a PR.

```bash
curl http://localhost:3000/api/reward?repo=kubernetes/kubernetes&pr=5248
```

Response:
```json
{
  "id": "uuid",
  "repo": "owner/repo",
  "pr": 123,
  "amount": 50,
  "status": "pending",
  "issuedBy": "maintainer",
  "recipient": "contributor"
}
```

### GET /api/rewards/:username
Get all pending rewards for a user.

```bash
curl http://localhost:3000/api/rewards/ujesh
```

### POST /api/redeem
Redeem a reward (called by extension).

Request:
```json
{
  "rewardId": "uuid",
  "recipientWallet": "7xKa...abc",
  "recipientGithub": "ujesh",
  "repo": "owner/repo",
  "pr": 123,
  "amount": 50
}
```

Response:
```json
{
  "success": true,
  "txHash": "abc123...",
  "status": "redeemed"
}
```

### GET /api/balance
Check escrow wallet balance.

```bash
curl http://localhost:3000/api/balance
```

---

## 🧪 Testing

### 1. Test Backend Locally

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Test webhook
curl -X POST http://localhost:3000/webhook/github \
  -H "Content-Type: application/json" \
  -d '{
    "action": "created",
    "comment": {
      "body": "/pay 50",
      "user": { "login": "maintainer_username" }
    },
    "issue": {
      "number": 1,
      "pull_request": {},
      "user": { "login": "contributor_username" }
    },
    "repository": {
      "name": "test-repo",
      "owner": { "login": "your-username" }
    }
  }'
```

### 2. Test Real GitHub PR

1. Create a test GitHub repo
2. Configure GitHub App webhook to point to `BACKEND_URL/webhook/github`
3. Install app on test repo
4. Create a PR
5. Comment `/pay 50`
6. Check backend logs

### 3. Test Extension

1. Open a PR page with a pending reward
2. Check if "Redeem" button appears
3. Click to test Solana transfer

---

## 📊 Database Schema

### rewards table
```sql
CREATE TABLE rewards (
  id TEXT PRIMARY KEY,
  repo TEXT,
  pr INTEGER,
  amount REAL,
  token TEXT,
  issued_by TEXT,
  recipient TEXT,
  recipient_wallet TEXT,
  status TEXT ('pending', 'redeemed', 'failed'),
  tx_hash TEXT,
  created_at DATETIME,
  redeemed_at DATETIME
)
```

### users table
```sql
CREATE TABLE users (
  github_username TEXT PRIMARY KEY,
  solana_wallet TEXT,
  created_at DATETIME,
  updated_at DATETIME
)
```

---

## 🔐 Security Checklist

- [ ] GitHub token has minimal permissions
- [ ] Solana private key is in `.env` (never commit)
- [ ] CORS configured for your domain only
- [ ] Webhook signature validation enabled (production)
- [ ] HTTPS enabled (production)
- [ ] Rate limiting on endpoints
- [ ] Maintainer permission verified for /pay command
- [ ] Reward can only be redeemed by recipient

---

## 🐛 Troubleshooting

### "Wallet not connected" error
- Open extension popup
- Click "Connect Phantom Wallet"
- Approve in Phantom

### "Invalid Solana wallet" error
- Check that Phantom is installed
- Check that you're using correct network (devnet/testnet)
- Verify wallet address format

### "No pending reward" on PR
- Check backend logs for webhook
- Verify comment author is repo maintainer
- Check that `/pay` command format is correct: `/pay 50`

### Backend won't start
- Check Node.js version: `node --version` (should be 16+)
- Check `.env` file exists and has `SOLANA_PRIVATE_KEY`
- Check port 3000 is not in use: `lsof -i :3000`

### Webhook not receiving
- Check GitHub App is installed on repo
- Check webhook URL is correct in GitHub settings
- Check firewall/network allows incoming webhooks

---

## 🚢 Production Deployment

### Using Vercel

1. Push code to GitHub
2. Create Vercel project
3. Set environment variables
4. Deploy

### Using Heroku

```bash
git push heroku main

# Set environment variables
heroku config:set GITHUB_TOKEN=xxx SOLANA_PRIVATE_KEY=xxx
```

### Using AWS Lambda

Convert `server.js` to Lambda handler and deploy with Serverless Framework.

---

## 📚 Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Phantom Wallet API](https://docs.phantom.app/)

---

## 💡 Future Features

- [ ] Multiple token support (USDC, etc.)
- [ ] Batch rewards
- [ ] Escrow options (non-custodial)
- [ ] DAO governance for rewards
- [ ] Email notifications
- [ ] Reward history dashboard
- [ ] Custom reward messages
- [ ] Integration with GitHub Actions

---

## 🤝 Contributing

This is a Solana hackathon project. Contributions welcome!

---

## 📄 License

MIT

---

**Made with ❤️ for Open Source contributors** 🚀
#   G i t p a y  
 